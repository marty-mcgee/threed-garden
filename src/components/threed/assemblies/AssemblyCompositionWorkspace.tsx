'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Boxes, Copy, Download, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseAssemblyDefinition, MAX_ASSEMBLY_COMPONENTS, type AssemblyDefinition, type AssemblyComponent } from '@/libraries/services/threed/models/assembly-group-core';

type ModelOption = { id: number; modelName: string; modelType: string };
type DraftComponent = { id: string; modelId: number; label: string; x: string; y: string; z: string; rx: string; ry: string; rz: string; scale: string };
const fields = [['x', 'Position X'], ['y', 'Position Y'], ['z', 'Position Z'], ['rx', 'Rotation X (°)'], ['ry', 'Rotation Y (°)'], ['rz', 'Rotation Z (°)'], ['scale', 'Scale']] as const;
function componentDraft(c: AssemblyComponent): DraftComponent {
  const p = c.transform.position; const r = c.transform.rotation;
  return { id: c.id, modelId: c.modelId, label: c.label, x: String(p.x), y: String(p.y), z: String(p.z), rx: String(r.x * 180 / Math.PI), ry: String(r.y * 180 / Math.PI), rz: String(r.z * 180 / Math.PI), scale: String(c.transform.scale) };
}
function number(value: string): number { return value.trim() ? Number(value) : NaN; }

export function AssemblyCompositionWorkspace() {
  const { data: session } = useSession();
  const ownerId = session?.user?.id;
  const [name, setName] = useState('New Assembly');
  const [assemblyId, setAssemblyId] = useState('');
  const [components, setComponents] = useState<DraftComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [catalog, setCatalog] = useState<{ rows: ModelOption[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [reading, setReading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef(ownerId);
  useEffect(() => {
    accountRef.current = ownerId;
    setComponents([]); setSelectedId(null); setName('New Assembly'); setAssemblyId(crypto.randomUUID()); setDirty(false); setNotice('');
  }, [ownerId]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!ownerId) return;
    const controller = new AbortController();
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    setLoading(true); setCatalogError(''); setCatalog({ rows: [], total: 0 });
    const delay = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const params = new URLSearchParams({ view: 'selector', scope: 'library', limit: '25', offset: String(page * 25), search });
        const response = await fetch(`/api/threed/models?${params}`, { cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error();
        if (active && !controller.signal.aborted) setCatalog({ rows: result.data.filter((row: ModelOption) => Number.isSafeInteger(row.id) && row.id > 0 && typeof row.modelName === 'string'), total: Number(result.pagination?.total) || 0 });
      } catch {
        if (active) setCatalogError('Could not load Models. Try refreshing the list.');
      } finally { clearTimeout(timeout); if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(delay); clearTimeout(timeout); controller.abort(); };
  }, [ownerId, search, page, refresh]);

  const validation = useMemo((): { definition?: AssemblyDefinition; error?: string } => {
    try {
      return { definition: parseAssemblyDefinition({ formatVersion: 1, id: assemblyId, ownerId, name: name.trim(), revision: 1,
        components: components.map(c => ({ id: c.id, modelId: c.modelId, label: c.label.trim(), transform: {
          position: { x: number(c.x), y: number(c.y), z: number(c.z) },
          rotation: { x: number(c.rx) * Math.PI / 180, y: number(c.ry) * Math.PI / 180, z: number(c.rz) * Math.PI / 180 }, scale: number(c.scale),
        } })),
      }) };
    } catch (error) { return { error: components.length ? (error instanceof Error ? error.message : 'Check the composition.') : 'Add a Model to begin.' }; }
  }, [assemblyId, ownerId, name, components]);
  const selected = components.find(c => c.id === selectedId);
  function edit(patch: Partial<DraftComponent>) {
    setComponents(rows => rows.map(c => c.id === selectedId ? { ...c, ...patch } : c)); setDirty(true); setNotice('');
  }
  function add(model: ModelOption) {
    if (components.length >= MAX_ASSEMBLY_COMPONENTS) return;
    const id = crypto.randomUUID();
    setComponents(rows => [...rows, { id, modelId: model.id, label: model.modelName, x: '0', y: '0', z: '0', rx: '0', ry: '0', rz: '0', scale: '1' }]);
    setSelectedId(id); setDirty(true); setNotice('');
  }
  function download() {
    if (!validation.definition) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(validation.definition, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${name.replace(/[^a-z0-9_-]/gi, '_') || 'assembly'}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setDirty(false); setNotice('Draft exported. No assembly has been saved to a Project.');
  }
  async function importDraft(file?: File) {
    if (!file || reading || !ownerId) return;
    if (file.size > 1024 * 1024) { setNotice('Choose a draft smaller than 1 MiB.'); return; }
    if (dirty && !window.confirm('Replace the current composition? Export it first to keep a copy.')) return;
    setReading(true);
    try {
      const incoming = parseAssemblyDefinition(JSON.parse(await file.text()));
      if (accountRef.current !== ownerId) return;
      // Import as a new local composition for this account, never as proof of ownership.
      setAssemblyId(crypto.randomUUID()); setName(incoming.name); setComponents(incoming.components.map(componentDraft)); setSelectedId(incoming.components[0].id); setDirty(true);
      setNotice('Draft loaded. Model references must be checked before future saving or placement.');
    } catch { if (accountRef.current === ownerId) setNotice('This file is not a valid assembly draft. The current composition was kept.'); }
    finally { setReading(false); }
  }
  if (!ownerId) return <p className="p-6 text-sm">Sign in to compose Assembly Groups.</p>;
  return <main className="space-y-4 p-4">
    <header className="flex flex-wrap items-center gap-2 border-b pb-3">
      <Boxes className="h-5 w-5 text-blue-500" /><h1 className="text-base font-semibold">Assembly Composition and Construction</h1>
      <span className="text-xs text-muted-foreground">Local draft{dirty ? ' · modified' : ''}</span>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="outline" disabled={reading} onClick={() => uploadRef.current?.click()}><Upload className="h-4 w-4" />Import Draft</Button>
        <Button size="sm" disabled={!validation.definition || reading} onClick={download}><Download className="h-4 w-4" />Export Draft</Button>
      </div>
      <input ref={uploadRef} type="file" accept=".json,application/json" className="hidden" aria-label="Import assembly draft" onChange={e => { void importDraft(e.target.files?.[0]); e.target.value = ''; }} />
    </header>
    <p className="text-xs text-muted-foreground">Build a component arrangement using relative transforms. Export a draft to keep your work. Database saving, 3D preview and Scene placement are not available yet.</p>
    {notice && <p role="status" className="rounded border p-2 text-sm">{notice}</p>}
    <fieldset disabled={reading} className="min-w-0 space-y-4">
      <label className="block max-w-lg text-xs">Assembly name<Input maxLength={255} value={name} onChange={e => { setName(e.target.value); setDirty(true); }} /></label>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <section className="space-y-3 rounded border p-3" aria-label="Available Models">
          <h2 className="text-sm font-semibold">Add Models</h2>
          <Input aria-label="Search Models" placeholder="Search Models…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          {catalogError && <p role="alert" className="text-sm text-amber-600">{catalogError}</p>}
          {loading && !catalogError && <p role="status" className="text-xs">Loading Models…</p>}
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {catalog.rows.map(model => <div key={model.id} className="flex items-center gap-2 rounded border p-2 text-xs"><span className="min-w-0 flex-1 break-words">{model.modelName}</span><Button size="icon-sm" variant="outline" aria-label={`Add ${model.modelName}`} disabled={components.length >= MAX_ASSEMBLY_COMPONENTS} onClick={() => add(model)}><Plus className="h-4 w-4" /></Button></div>)}
            {!loading && !catalogError && !catalog.rows.length && <p className="text-xs text-muted-foreground">No matching Models.</p>}
          </div>
          <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={loading || (page + 1) * 25 >= catalog.total} onClick={() => setPage(p => p + 1)}>Next</Button><Button size="sm" variant="ghost" onClick={() => setRefresh(v => v + 1)}>Refresh</Button></div>
        </section>
        <section className="space-y-3 rounded border p-3" aria-label="Assembly components">
          <h2 className="text-sm font-semibold">Components · {components.length}/{MAX_ASSEMBLY_COMPONENTS}</h2>
          {!components.length && <p className="text-sm text-muted-foreground">Add a Model from the list. Each addition creates an independent component.</p>}
          <div className="max-h-96 space-y-1 overflow-y-auto">{components.map((c, i) => <Button key={c.id} variant={c.id === selectedId ? 'secondary' : 'ghost'} className="h-auto w-full justify-start whitespace-normal text-left text-xs" onClick={() => setSelectedId(c.id)}>{i + 1}. {c.label || 'Unnamed component'}</Button>)}</div>
          {validation.error && <p role="status" className="text-xs text-amber-600">{validation.error}</p>}
        </section>
        <section className="space-y-3 rounded border p-3" aria-label="Component transform">
          <h2 className="text-sm font-semibold">Component transform</h2>
          {selected ? <>
            <label className="block text-xs">Component label<Input value={selected.label} maxLength={255} onChange={e => edit({ label: e.target.value })} /></label>
            <p className="text-xs text-muted-foreground">Model #{selected.modelId} · Position relative to the assembly origin. Rotations use degrees.</p>
            <div className="grid grid-cols-3 gap-2">{fields.map(([key, label]) => <label key={key} className="block text-xs">{label}<Input type="number" step="any" value={selected[key]} onChange={e => edit({ [key]: e.target.value })} /></label>)}</div>
            <div className="flex gap-2"><Button size="sm" variant="outline" disabled={components.length >= MAX_ASSEMBLY_COMPONENTS} onClick={() => { const id = crypto.randomUUID(); setComponents(rows => [...rows, { ...selected, id }]); setSelectedId(id); setDirty(true); }}><Copy className="h-4 w-4" />Duplicate</Button><Button size="sm" variant="outline" onClick={() => { setComponents(rows => rows.filter(c => c.id !== selected.id)); setSelectedId(null); setDirty(true); }}><Trash2 className="h-4 w-4" />Remove</Button></div>
          </> : <p className="text-sm text-muted-foreground">Select a component to edit its placement.</p>}
        </section>
      </div>
    </fieldset>
  </main>;
}
