'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCharacterPageGuard } from '../characters/use-character-page-guard';
import type { AlbumModuleType } from '@/libraries/services/threed/multimedia/album-entity-registry';
import { albumModuleLabels } from '@/libraries/services/threed/multimedia/album-labels';

type Assignment = {
  albumId: number;
  sortOrder: number;
};
type Choice = {
  id: number;
  title: string;
  status: string;
};
type Destination = {
  projectId: number;
  moduleId: number;
  title: string;
  moduleName: string;
};
type Props = {
  moduleType: AlbumModuleType;
  entityId: number | string;
  entityName?: string;
  hideChooser?: boolean;
  disabled?: boolean;
  onStateChange?: (state: { dirty: boolean; busy: boolean }) => void;
};

async function json(response: Response) {
  const data = await response.json();
  if (!response.ok) throw Error(data.error ?? 'Request failed.');
  return data;
}

export function EntityAlbumWorkspace(props: Props) {
  const { data, status } = useSession();
  if (status === 'loading') return <p role="status">Loading account…</p>;
  if (!data?.user?.id) return <p role="alert">Sign in to manage Album assignments.</p>;
  return <Workspace key={`${data.user.id}:${props.moduleType}:${props.entityId}`} {...props} />;
}

function Workspace({ moduleType, entityId, entityName, hideChooser = false, disabled = false, onStateChange }: Props) {
  const url = `/api/threed/album-associations/${moduleType}/${entityId}`;
  const [snapshot, setSnapshot] = useState<{ assignments: Assignment[]; revision: string } | null>(null);
  const [draft, setDraft] = useState<Assignment[]>([]);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [savedName, setSavedName] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [choicesError, setChoicesError] = useState('');
  const [choicesLoading, setChoicesLoading] = useState(true);
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [projectSearch, setProjectSearch] = useState('');
  const [projectOffset, setProjectOffset] = useState(0);
  const [projects, setProjects] = useState<Destination[]>([]);
  const [projectsMore, setProjectsMore] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [destination, setDestination] = useState<Destination | null>(null);
  const dirty = !!snapshot && JSON.stringify(draft) !== JSON.stringify(snapshot.assignments);
  useCharacterPageGuard(true, dirty, busy, 'Multimedia Albums');
  useEffect(() => { onStateChange?.({ dirty, busy }); }, [dirty, busy, onStateChange]);


  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setSnapshot(null);
    setError('');
    void fetch(url, { signal: controller.signal, cache: 'no-store' }).then(json).then(data => {
      if (!controller.signal.aborted) {
        setSnapshot(data); setDraft(data.assignments); setSavedName(data.entityName ?? '');
        setTitles(current => ({ ...current, ...data.albumTitles }));
      }
    }).catch(() => {
      if (!controller.signal.aborted) setError('Album assignments could not be loaded. Retry before editing.');
    });
    return () => controller.abort();
  }, [url, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setChoicesLoading(true); setChoicesError(''); setChoices([]);
    const query = new URLSearchParams({ scope: 'albums', moduleType, search, offset: String(offset) });
    void fetch(`/api/threed/album-associations/options?${query}`, { signal: controller.signal, cache: 'no-store' }).then(json).then(data => {
      if (controller.signal.aborted) return;
      setChoices(data.items); setHasMore(data.hasMore);
      setTitles(current => ({ ...current, ...Object.fromEntries(data.items.map((item: Choice) => [item.id, item.title])) }));
    }).catch(() => { if (!controller.signal.aborted) setChoicesError('Album choices could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setChoicesLoading(false); });
    return () => controller.abort();
  }, [moduleType, search, offset, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setProjectsLoading(true);
    setProjects([]); setDestination(null); setProjectsError(''); setProjectsMore(false);
    const query = new URLSearchParams({ scope: 'projects', search: projectSearch, offset: String(projectOffset) });
    void fetch(`/api/threed/album-associations/options?${query}`, { signal: controller.signal, cache: 'no-store' }).then(json).then(data => {
      if (!controller.signal.aborted) { setProjects(data.items); setProjectsMore(data.hasMore); }
    }).catch(() => { if (!controller.signal.aborted) setProjectsError('Project choices could not be loaded.'); }).finally(() => { if (!controller.signal.aborted) setProjectsLoading(false); });
    return () => controller.abort();
  }, [projectSearch, projectOffset, revision]);

  async function save() {
    if (!snapshot || disabled || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const data = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        signal: lifetime.current?.signal,
        body: JSON.stringify({ expectedRevision: snapshot.revision, assignments: draft }),
      }).then(json);
      if (!lifetime.current?.signal.aborted) { setSnapshot({ assignments: draft, revision: data.revision }); setMessage('Album assignments saved.'); }
    } catch (error) {
      if (!lifetime.current?.signal.aborted) setError(error instanceof Error ? error.message : 'Save failed. Your draft is retained.');
    } finally { busyRef.current = false; setBusy(false); }
  }

  async function addToProject() {
    if (!snapshot || !destination || dirty || disabled || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    let added = 0;
    let present = 0;
    let failed = 0;
    try {
      // Re-read the saved repertoire. Project additions never use unsaved Album choices.
      const saved = await fetch(url, { signal: lifetime.current?.signal, cache: 'no-store' }).then(json);
      if (saved.revision !== snapshot.revision) throw Error('Related Albums changed. Reload assignments before adding them to a Project.');
      for (const item of saved.assignments as Assignment[]) {
        if (lifetime.current?.signal.aborted) return;
        const response = await fetch('/api/project/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: lifetime.current?.signal,
          body: JSON.stringify({
            projectId: destination.projectId,
            moduleId: destination.moduleId,
            moduleType: 'multimedia',
            assetType: 'multimedia_albums',
            assetId: item.albumId,
          }),
        });
        const result = await response.json();
        if (response.ok) added++;
        else if (response.status === 409 && result.error === 'Asset already added to this module') present++;
        else failed++;
      }
      if (!lifetime.current?.signal.aborted) setMessage(`${added} added; ${present} already assigned; ${failed} failed. Refresh Project Assets to see Multimedia. ${failed ? 'Retry to add remaining Albums.' : ''}`);
    } catch (error) {
      if (!lifetime.current?.signal.aborted) setError(`${added} added before stopping. ${error instanceof Error ? error.message : 'Request failed.'} Retry is safe for already assigned Albums.`);
    } finally { busyRef.current = false; setBusy(false); }
  }

  function reload() {
    if (busyRef.current || (dirty && !window.confirm('Discard the Album draft and reload saved assignments?'))) return;
    setRevision(value => value + 1);
  }

  return <section id="multimedia-albums" className="space-y-3 rounded-lg border p-3">
    <header className="border-b pb-2">
      <h2 className="text-sm font-semibold">Multimedia Albums: {entityName || savedName || `#${entityId}`}</h2>
      <p className="text-xs text-muted-foreground">{albumModuleLabels[moduleType]} / #{entityId}. Album assignments save separately from Details. Tracks remain inside Albums.</p>
      {!hideChooser && <a href="/admin/threed/album-associations" className="text-xs underline">Choose another ThreeD item</a>}
    </header>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && !dirty && <p role="status" className="text-sm">{message}</p>}
    <p role="status" className="text-xs">{busy ? "Saving..." : dirty ? "Unsaved Album changes - save before adding to a Project." : snapshot ? "Album assignments saved." : "Assignments not loaded."}</p>
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" disabled={disabled || busy} onClick={reload}>Reload assignments</Button>
      <Button type="button" variant="outline" size="sm" disabled={disabled || busy || !dirty} onClick={() => snapshot && setDraft(snapshot.assignments)}>Discard draft</Button>
      <Button type="button" variant="success" size="sm" disabled={disabled || busy || !snapshot || !dirty} onClick={() => void save()}>Save Album assignments</Button>
    </div>
    {!snapshot && !error && <p role="status">Loading assignments…</p>}
    <fieldset disabled={disabled || busy || !snapshot} className="space-y-2">
      <legend className="text-sm font-medium">1. Choose Albums ({draft.length}/100 selected)</legend>
      <label className="block text-xs">Find Albums<Input value={search} maxLength={120} onChange={event => { setSearch(event.target.value); setOffset(0); }} /></label>
      {choicesLoading && <p role="status">Loading Album choices…</p>}
      {choicesError && <p role="alert">{choicesError}</p>}
      {!choicesLoading && !choicesError && !choices.length && <p>No Albums match.</p>}
      <p className="text-xs text-muted-foreground">Check Albums to select them, then Save. Selected Albums stay visible while searching.</p>
      <div className="max-h-64 overflow-y-auto rounded border">
      {[...draft.map(row => ({ id: row.albumId, title: titles[row.albumId] ?? 'Album #' + row.albumId, status: '' })), ...choices.filter(item => !draft.some(row => row.albumId === item.id))].map(item => {
        const selected = draft.find(row => row.albumId === item.id);
        return <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b p-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!selected} disabled={!selected && draft.length >= 100} onChange={() => setDraft(current => current.some(row => row.albumId === item.id) ? current.filter(row => row.albumId !== item.id) : [...current, { albumId: item.id, sortOrder: 0 }])} />
            <span>{item.title} {item.status && <span className="text-muted-foreground">({item.status})</span>}</span>
          </label>
          {selected && <details className="text-xs"><summary className="cursor-pointer">Order</summary>
            <label>Sort Order<Input className="w-24" type="number" min={-10000} max={10000} step={1} value={selected.sortOrder} onChange={event => {
              const sortOrder = Number(event.target.value);
              if (Number.isInteger(sortOrder) && Math.abs(sortOrder) <= 10000) setDraft(current => current.map(row => row.albumId === item.id ? { ...row, sortOrder } : row));
            }} /></label>
          </details>}
        </div>;
      })}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!offset || choicesLoading} onClick={() => setOffset(value => Math.max(0, value - 50))}>Previous Albums</Button>
        <Button type="button" variant="outline" size="sm" disabled={!hasMore || choicesLoading} onClick={() => setOffset(value => value + 50)}>Next Albums</Button>
      </div>
    </fieldset>
    <fieldset disabled={disabled || busy || !snapshot || dirty} className="space-y-2 rounded border p-3">
      <legend className="text-sm font-medium">2. Add saved Albums to a Project (optional)</legend>
      <p className="text-xs text-muted-foreground">Save your Album assignments first. Choose an existing active Project Multimedia module; this adds Albums without replacing Project Assets.</p>
      <label className="block text-xs">Find Project<Input value={projectSearch} maxLength={120} onChange={event => { setProjectSearch(event.target.value); setProjectOffset(0); }} /></label>
      {projectsError && <p role="alert">{projectsError}</p>}
      <label className="block text-xs">Project / Multimedia module
        <select className="mt-1 block w-full rounded border bg-background p-2" value={destination ? `${destination.projectId}:${destination.moduleId}` : ''} onChange={event => setDestination(projects.find(item => `${item.projectId}:${item.moduleId}` === event.target.value) ?? null)}>
          <option value="">Choose a Project Multimedia module</option>
          {projects.map(item => <option key={`${item.projectId}:${item.moduleId}`} value={`${item.projectId}:${item.moduleId}`}>{item.title} — {item.moduleName}</option>)}
        </select>
      </label>
      {projectsLoading && <p role="status" className="text-xs">Loading Projects...</p>}
      {!projectsLoading && !projects.length && !projectsError && <p className="text-xs">No matching Projects. Add an active Multimedia module in Project Modules, then Reload assignments here.</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!projectOffset} onClick={() => setProjectOffset(value => Math.max(0, value - 50))}>Previous Projects</Button>
        <Button type="button" size="sm" variant="outline" disabled={!projectsMore} onClick={() => setProjectOffset(value => value + 50)}>Next Projects</Button>
        <Button type="button" size="sm" variant="success" disabled={!destination || !snapshot?.assignments.length} onClick={() => void addToProject()}>Add related Albums to Project</Button>
      </div>
    </fieldset>
  </section>;
}
