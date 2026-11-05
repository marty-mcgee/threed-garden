'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseAssemblyDefinition, type AssemblyDefinition, type AssemblyTransform } from '@/libraries/services/threed/models/assembly-group-core';
import type { ProjectThreeDMarkerRecord } from '@/libraries/types/map';

interface AssemblySummary {
  id: string;
  name: string;
  revision: number;
}

interface PlacementAttempt {
  projectId: number;
  threedId: number;
  assemblyId: string;
  assemblyRevision: number;
  requestId: string;
  transform: AssemblyTransform;
}

/** Mounted per Project: a failed request keeps its identity for a safe retry. */
export function AssemblyPlacementDialog({
  open,
  projectId,
  modules,
  initialModuleId,
  onOpenChange,
  onPlaced,
}: {
  open: boolean;
  projectId: number;
  modules: Array<{
    id: number;
    name: string;
  }>;
  initialModuleId: number | null;
  onOpenChange: (open: boolean) => void;
  onPlaced: (markers: ProjectThreeDMarkerRecord[], name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [items, setItems] = useState<AssemblySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AssemblyDefinition | null>(null);
  const [moduleId, setModuleId] = useState(initialModuleId ?? modules[0]?.id ?? 0);
  const [draft, setDraft] = useState({
    x: '0',
    y: '0',
    z: '0',
    rotationY: '0',
    scale: '1',
  });
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<PlacementAttempt | null>(null);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const selectionRequest = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      selectionRequest.current++;
    };
  }, []);

  useEffect(() => {
    if (!open || attempt) return;
    const controller = new AbortController();
    setLoading(true);
    const query = new URLSearchParams({
      search,
      offset: String(offset),
      limit: '25',
    });
    void fetch(`/api/threed/assembly-groups?${query}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data?.items)) {
          throw new Error(result.error || 'Could not load Assembly Groups.');
        }
        if (controller.signal.aborted) return;
        setItems(result.data.items);
        setTotal(result.data.total);
      })
      .catch(caught => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not load Assembly Groups.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, search, offset, refresh, attempt]);

  const choose = async (id: string) => {
    if (busyRef.current || attempt) return;
    const request = ++selectionRequest.current;
    setSelected(null);
    setReading(true);
    setError(null);
    try {
      const response = await fetch(`/api/threed/assembly-groups?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not open this Assembly.');
      const definition = parseAssemblyDefinition(result.data);
      if (mounted.current && request === selectionRequest.current) setSelected(definition);
    } catch (caught) {
      if (mounted.current && request === selectionRequest.current) setError(caught instanceof Error ? caught.message : 'Could not open this Assembly.');
    } finally {
      if (mounted.current && request === selectionRequest.current) setReading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busyRef.current || !selected || reading) return;
    let request = attempt;
    if (!request) {
      const values = Object.values(draft);
      if (values.some(value => !value.trim() || !Number.isFinite(Number(value)))
        || ['x', 'y', 'z'].some(key => Math.abs(Number(draft[key as 'x' | 'y' | 'z'])) > 1_000_000)
        || Math.abs(Number(draft.rotationY)) > 360_000
        || Number(draft.scale) < 0.0001 || Number(draft.scale) > 1_000
        || !modules.some(module => module.id === moduleId)) {
        setError('Enter valid coordinates, rotation and a scale between 0.0001 and 1,000.');
        return;
      }
      request = {
        projectId,
        threedId: moduleId,
        assemblyId: selected.id,
        assemblyRevision: selected.revision,
        requestId: crypto.randomUUID(),
        transform: {
          position: {
            x: Number(draft.x),
            y: Number(draft.y),
            z: Number(draft.z),
          },
          rotation: {
            x: 0,
            y: Number(draft.rotationY) * Math.PI / 180,
            z: 0,
          },
          scale: Number(draft.scale),
        },
      };
      setAttempt(request);
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    let sent = Boolean(attempt);
    try {
      // Resolve through the existing authorized Model reader, never from client
      // guesses or a second whole-Project load. Keep requests bounded.
      const pending = [...new Set(selected.components.map(component => component.modelId))];
      const models = new Map<number, Record<string, unknown>>();
      let hydrationFailed = false;
      const hydration = await Promise.allSettled(Array.from({ length: Math.min(4, pending.length) }, async () => {
        while (pending.length && mounted.current && !hydrationFailed) {
          const id = pending.shift()!;
          try {
            const response = await fetch(`/api/threed/models?id=${id}`, {
              cache: 'no-store',
              signal: AbortSignal.timeout(20_000),
            });
            const result = await response.json();
            if (!response.ok || !result.success || result.data?.id !== id || typeof result.data.modelName !== 'string') {
              throw new Error(`Model #${id} could not be loaded. Retry before placing the Assembly.`);
            }
            models.set(id, {
              ...result.data,
              renderingAssetsResolved: true,
            });
          } catch (caught) {
            hydrationFailed = true;
            throw caught;
          }
        }
      }));
      const failure = hydration.find(result => result.status === 'rejected');
      if (failure?.status === 'rejected') throw failure.reason;
      if (!mounted.current) return;
      sent = true;
      const response = await fetch('/api/project/assembly-placements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(120_000),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        // A rejected request did not create a placement; allow correcting its inputs.
        if (response.status >= 400 && response.status < 500 && mounted.current) setAttempt(null);
        throw new Error(result.error || 'Could not place this Assembly. Retry to check the same placement.');
      }
      const markers = result.data?.markers;
      if (!Array.isArray(markers) || markers.length !== selected.components.length || result.data.placementId !== request.requestId
        || markers.some(marker => marker.markerType !== 'models' || marker.threedId !== request.threedId
          || typeof marker.markerId !== 'string' || !models.has(marker.sourceAssetId))
        || new Set(markers.map(marker => marker.markerId)).size !== markers.length) {
        throw new Error('Placement response was incomplete. Retry to recover the same placement.');
      }
      if (!mounted.current) return;
      onPlaced(markers.map(marker => ({
        ...marker,
        data: {
          ...models.get(marker.sourceAssetId),
          ...marker.data,
          modelId: marker.sourceAssetId,
        },
      })), selected.name);
      setAttempt(null);
      setSelected(null);
      onOpenChange(false);
    } catch (caught) {
      if (mounted.current) {
        if (!sent) setAttempt(null);
        setError(caught instanceof Error ? caught.message : 'Could not place this Assembly. Retry to check the same placement.');
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const locked = busy || Boolean(attempt);
  return <Dialog open={open} onOpenChange={next => { if (!busyRef.current) onOpenChange(next); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Add Assembly Group</DialogTitle>
        <DialogDescription>Place a saved arrangement as independent Project Models. Each Model can then be selected and edited in the Scene and Design plan.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <Input aria-label="Search Assembly Groups" placeholder="Search Assembly Groups…" value={search} disabled={locked}
            onChange={event => { setSearch(event.target.value); setOffset(0); }} />
          <Button type="button" variant="outline" disabled={locked || loading} onClick={() => { setError(null); setRefresh(value => value + 1); }}>Refresh</Button>
        </div>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-1" aria-label="Saved Assembly Groups">
          {loading ? <p role="status" className="p-2 text-sm">Loading Assembly Groups…</p> : items.length ? items.map(item => <Button key={item.id} type="button" variant={selected?.id === item.id ? 'secondary' : 'ghost'}
            className="h-auto w-full justify-start whitespace-normal text-left" disabled={locked} aria-pressed={selected?.id === item.id} onClick={() => void choose(item.id)}>{item.name}</Button>)
            : <p className="p-2 text-sm text-muted-foreground">No saved Assembly Groups found. Create one in Admin &gt; ThreeD &gt; Assembly Groups.</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={locked || loading || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 25))}>Previous</Button>
          <Button type="button" size="sm" variant="outline" disabled={locked || loading || offset + 25 >= total} onClick={() => setOffset(value => value + 25)}>Next</Button>
          <span className="text-xs text-muted-foreground">{total} Assembly Groups</span>
        </div>
        {reading && <p role="status" className="text-sm">Opening Assembly…</p>}
        {selected && <p className="text-sm"><strong>{selected.name}</strong> · {selected.components.length} Models · revision {selected.revision}</p>}
        <div className="space-y-1">
          <Label htmlFor="assembly-project-module">ThreeD Module</Label>
          <select id="assembly-project-module" value={moduleId} disabled={locked} onChange={event => setModuleId(Number(event.target.value))} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
            {modules.map(module => <option key={module.id} value={module.id}>{module.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['x', 'y', 'z'] as const).map(axis => <div key={axis} className="space-y-1">
            <Label htmlFor={`assembly-position-${axis}`}>Position {axis.toUpperCase()}</Label>
            <Input id={`assembly-position-${axis}`} type="number" step="any" value={draft[axis]} disabled={locked} onChange={event => setDraft(current => ({ ...current, [axis]: event.target.value }))} />
          </div>)}
        </div>
        <p className="text-xs text-muted-foreground">Scene units. The saved component offsets are retained relative to this position.</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label htmlFor="assembly-rotation">Y rotation (°)</Label><Input id="assembly-rotation" type="number" step="any" value={draft.rotationY} disabled={locked} onChange={event => setDraft(current => ({ ...current, rotationY: event.target.value }))} /></div>
          <div className="space-y-1"><Label htmlFor="assembly-scale">Uniform scale</Label><Input id="assembly-scale" type="number" step="any" min="0.0001" max="1000" value={draft.scale} disabled={locked} onChange={event => setDraft(current => ({ ...current, scale: event.target.value }))} /></div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {attempt && !busy && <p className="text-xs text-muted-foreground">Retry checks the same placement without adding a second copy. Closing this dialog retains the retry while this Project stays open.</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Close</Button>
          <Button type="submit" disabled={busy || reading || !selected || !moduleId}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{attempt ? 'Retry placement' : 'Place Assembly'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
