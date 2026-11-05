'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Boxes, ChevronRight, Copy, Download, Plus, Save, Trash2, Upload } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseAssemblyDefinition, MAX_ASSEMBLY_COMPONENTS, type AssemblyDefinition, type AssemblyTransform } from '@/libraries/services/threed/models/assembly-group-core';
import { assemblyComponentDraft, assemblyDraftTransform, assemblyTransformFields, type AssemblyComponentDraft } from '@/libraries/services/threed/models/assembly-editor-core';
import { AssemblyCanvas } from './AssemblyCanvas';
import { AssemblyStlImport } from './AssemblyStlImport';

type ModelOption = { id: number; modelName: string; modelType: string };
const fields = [
  ['x', 'Position X'],
  ['y', 'Position Y'],
  ['z', 'Position Z'],
  ['rx', 'Rotation X (°)'],
  ['ry', 'Rotation Y (°)'],
  ['rz', 'Rotation Z (°)'],
  ['scale', 'Scale'],
] as const;

function AssemblyEditorPanel({ label, title, children }: {
  label: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  return <section aria-label={label} className="admin-editor-panel rounded-lg border px-2 py-1.5">
    <h2>
      <Button type="button" variant="ghost" className="h-6 w-full justify-start gap-1 p-0 text-left text-xs font-semibold hover:bg-transparent has-[>svg]:px-0" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(value => !value)}>
        <ChevronRight className={`size-3.5 transition-transform motion-reduce:transition-none ${open ? 'rotate-90' : ''}`} />
        {title}
      </Button>
    </h2>
    <div id={contentId} hidden={!open} className="space-y-2 pt-1">{children}</div>
  </section>;
}

export function AssemblyCompositionWorkspace({ recordId }: { recordId?: string } = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const ownerId = session?.user?.id;
  const [workspaceOwner, setWorkspaceOwner] = useState(ownerId);
  const [name, setName] = useState('New Assembly');
  const [assemblyId, setAssemblyId] = useState('');
  const [components, setComponents] = useState<AssemblyComponentDraft[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [savedRevision, setSavedRevision] = useState(0);
  const [loadedRecordId, setLoadedRecordId] = useState('');
  const [stlImportOpen, setStlImportOpen] = useState(false);
  const stlImportOpenRef = useRef(false);
  const operationRef = useRef(0);
  const busyRef = useRef(false);
  const manipulatingRef = useRef(false);
  const [manipulating, setManipulating] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef(ownerId);
  accountRef.current = ownerId;
  useEffect(() => {
    accountRef.current = ownerId;
    setComponents([]); setSelectedId(null); setName('New Assembly'); setAssemblyId(crypto.randomUUID()); setDirty(false); setNotice('');
    setSavedRevision(0); setLoadedRecordId(''); setSaving(false); setReading(false);
    operationRef.current++; busyRef.current = false;
    manipulatingRef.current = false; setManipulating(false);
    setWorkspaceOwner(ownerId);
    if (ownerId && recordId) void persistOrLoad(recordId, false);
  }, [ownerId, recordId]);
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
      return { definition: parseAssemblyDefinition({ formatVersion: 1, id: assemblyId, ownerId, name: name.trim(), revision: savedRevision || 1,
        components: components.map(c => ({
          id: c.id,
          modelId: c.modelId,
          label: c.label.trim(),
          transform: assemblyDraftTransform(c),
        })),
      }) };
    } catch (error) { return { error: components.length ? (error instanceof Error ? error.message : 'Check the composition.') : 'Add a Model to begin.' }; }
  }, [assemblyId, ownerId, name, components, savedRevision]);
  const selected = components.find(c => c.id === selectedId);
  function edit(patch: Partial<AssemblyComponentDraft>) {
    setComponents(rows => rows.map(c => c.id === selectedId ? { ...c, ...patch } : c)); setDirty(true); setNotice('');
  }
  const transformComponent = useCallback((id: string, transform: AssemblyTransform) => {
    if (busyRef.current || stlImportOpenRef.current) return;
    const patch = assemblyTransformFields(transform);
    setComponents(rows => rows.map(component => component.id === id ? { ...component, ...patch } : component));
    setDirty(true);
    setNotice('');
  }, []);
  const handleStlOpenChange = useCallback((open: boolean) => {
    stlImportOpenRef.current = open;
    setStlImportOpen(open);
  }, []);
  const handleManipulating = useCallback((active: boolean) => {
    manipulatingRef.current = active;
    setManipulating(active);
  }, []);
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
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Draft exported. Use Save to retain changes in Assembly Groups.');
  }
  async function importDraft(file?: File) {
    if (!file || reading || busyRef.current || stlImportOpenRef.current || manipulatingRef.current || !ownerId) return;
    if (file.size > 1024 * 1024) { setNotice('Choose a draft smaller than 1 MiB.'); return; }
    if (dirty && !window.confirm('Replace the current composition? Export it first to keep a copy.')) return;
    const operation = ++operationRef.current;
    busyRef.current = true;
    setReading(true);
    try {
      const incoming = parseAssemblyDefinition(JSON.parse(await file.text()));
      if (accountRef.current !== ownerId || operation !== operationRef.current) return;
      // Import as a new local composition for this account, never as proof of ownership.
      setAssemblyId(crypto.randomUUID()); setName(incoming.name); setComponents(incoming.components.map(assemblyComponentDraft)); setSelectedId(incoming.components[0].id); setDirty(true);
      setSavedRevision(0);
      setNotice('Draft loaded as a new Assembly. Save revalidates its Model references.');
    } catch { if (accountRef.current === ownerId && operation === operationRef.current) setNotice('This file is not a valid assembly draft. The current composition was kept.'); }
    finally { if (accountRef.current === ownerId && operation === operationRef.current) { busyRef.current = false; setReading(false); } }
  }
  async function persistOrLoad(id?: string, confirmReplace = true) {
    if (!ownerId || manipulatingRef.current || (confirmReplace && (busyRef.current || stlImportOpenRef.current || reading)) || (!id && !validation.definition)) return;
    if (id && confirmReplace && dirty && !window.confirm('Replace the current composition? Save or export it first to keep a copy.')) return;
    const operation = ++operationRef.current;
    busyRef.current = true; setSaving(true); setNotice('');
    try {
      const response = await fetch(id ? `/api/threed/assembly-groups?id=${encodeURIComponent(id)}` : '/api/threed/assembly-groups', id ? { cache: 'no-store' } : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition: validation.definition, expectedRevision: savedRevision }),
      });
      const result = await response.json();
      if (operation !== operationRef.current || accountRef.current !== ownerId) return;
      if (!response.ok || !result.success) throw new Error(result.error || 'Assembly operation failed. Your draft is retained.');
      const saved = parseAssemblyDefinition(result.data);
      if (saved.ownerId !== ownerId || saved.id !== (id ?? assemblyId) || (!id && saved.revision !== savedRevision + 1)) throw new Error('Assembly response does not match this composition. Your draft is retained.');
      setAssemblyId(saved.id); setName(saved.name); setComponents(saved.components.map(assemblyComponentDraft));
      setSelectedId(saved.components[0].id); setSavedRevision(saved.revision); setDirty(false);
      setLoadedRecordId(saved.id);
      setNotice(id ? `Assembly opened · revision ${saved.revision}.` : `Assembly saved · revision ${saved.revision}.`);
      if (!id && saved.id !== recordId) router.replace(`/admin/threed/assembly-groups/${saved.id}`);
    } catch (error) {
      if (operation === operationRef.current && accountRef.current === ownerId) setNotice(error instanceof Error ? error.message : 'Assembly operation failed. Your draft is retained.');
    } finally {
      if (operation === operationRef.current && accountRef.current === ownerId) { busyRef.current = false; setSaving(false); }
    }
  }
  function navigate(href: string) {
    if (busyRef.current || stlImportOpenRef.current || manipulatingRef.current || saving || reading || (dirty && !window.confirm('Leave with unsaved changes? Save Changes or Export Draft first to keep your work.'))) return;
    router.push(href);
  }
  function startNew() {
    if (busyRef.current || stlImportOpenRef.current || manipulatingRef.current || saving || reading || (dirty && !window.confirm('Start a new Assembly? Save Changes or export your composition first.'))) return;
    if (recordId) { router.push('/admin/threed/assembly-groups/new'); return; }
    setAssemblyId(crypto.randomUUID()); setName('New Assembly'); setComponents([]); setSelectedId(null); setSavedRevision(0); setDirty(false); setNotice('');
  }
  if (!ownerId) return <p className="p-6 text-sm">Sign in to compose Assembly Groups.</p>;
  if (workspaceOwner !== ownerId) return <p role="status" className="p-6 text-sm">Loading your Assembly workspace…</p>;
  return <main className="flex h-full min-h-0 min-w-0 flex-col gap-2 text-xs">
    <AdminWorkspaceHeader moduleKey="assemblyGroups" icon={Boxes} title={savedRevision || recordId ? 'Edit Assembly Group' : 'Add Assembly Group'} description="Create and edit reusable Model compositions" className="shrink-0" showModuleAlbums={false}>
      <ModelFieldHelp label="Assembly Groups">Add Models from the library, then select a component and drag its handles to assemble the group. Use Move, Rotate or Scale to arrange it. The fields and canvas edit the same relative transforms. Save Changes retains an Assembly revision. Import/Export Draft exchanges a JSON copy. Import STL reviews disconnected geometry before creating reusable Models and a new Assembly.</ModelFieldHelp>
      <span data-testid="assembly-draft-status" className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{savedRevision ? `Revision ${savedRevision}` : 'Local draft'}{dirty ? ' · modified' : ''}</span>
      <div className="ml-auto flex flex-wrap gap-1">
        <Button variant="outline" className="h-7 text-xs" disabled={saving || reading || manipulating || stlImportOpen} onClick={() => navigate('/admin/threed/assembly-groups')}>All Assembly Groups</Button>
        {recordId && <Button variant="outline" className="h-7 text-xs" disabled={saving || reading || manipulating || stlImportOpen} onClick={() => void persistOrLoad(recordId)}>Reload</Button>}
        <AssemblyStlImport
          key={ownerId}
          ownerId={ownerId}
          disabled={saving || reading || manipulating || (!!recordId && loadedRecordId !== recordId)}
          beforeOpen={() => {
            if (busyRef.current || stlImportOpenRef.current || manipulatingRef.current) return false;
            return !dirty || window.confirm('Import STL creates and opens a new Assembly after saving. Save Changes or Export Draft first to keep your current unsaved composition. Continue?');
          }}
          onOpenChange={handleStlOpenChange}
          onSaved={saved => {
            if (accountRef.current !== saved.ownerId) return;
            setAssemblyId(saved.id);
            setName(saved.name);
            setComponents(saved.components.map(assemblyComponentDraft));
            setSelectedId(saved.components[0].id);
            setSavedRevision(saved.revision);
            setLoadedRecordId(saved.id);
            setDirty(false);
            setNotice('STL Models and Assembly saved. Arrange the parts in the canvas.');
            router.replace(`/admin/threed/assembly-groups/${saved.id}`);
          }}
        />
        <Button variant="success" className="h-7 text-xs" disabled={saving || reading || manipulating || stlImportOpen} onClick={startNew}><Plus className="size-3.5" />New Assembly</Button>
      </div>
      <input ref={uploadRef} type="file" accept=".json,application/json" className="hidden" aria-label="Import assembly draft" onChange={e => { void importDraft(e.target.files?.[0]); e.target.value = ''; }} />
    </AdminWorkspaceHeader>
    {recordId && loadedRecordId !== recordId && <p role="status" className="text-muted-foreground">{saving || !notice ? 'Opening Assembly Group…' : 'Use Reload to try opening this Assembly Group again.'}</p>}
    <fieldset hidden={!!recordId && loadedRecordId !== recordId} disabled={reading || saving || manipulating || stlImportOpen} className="min-h-0 min-w-0 flex-1 overflow-y-auto lg:overflow-hidden [&_input]:h-7 [&_input]:px-2 [&_input]:text-xs [&_select]:h-7 [&_select]:py-1 [&_select]:text-xs">
      <div className="grid min-w-0 gap-2 lg:h-full lg:min-h-0 lg:grid-cols-[16rem_minmax(0,1fr)] [&_h2]:text-xs [&_button]:text-xs">
        <div aria-label="Assembly controls" className="min-h-0 min-w-0 space-y-2 lg:overflow-y-auto">
          <section aria-label="Assembly details" className="admin-editor-panel rounded-lg border px-2 py-1.5">
            <label className="block text-xs">Assembly name<Input maxLength={255} value={name} onChange={e => { setName(e.target.value); setDirty(true); }} /></label>
          </section>
          <AssemblyEditorPanel label="Available Models" title="Add Models">
            <Input aria-label="Search Models" placeholder="Search Models…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            {catalogError && <p role="alert" className="text-sm text-amber-600">{catalogError}</p>}
            {loading && !catalogError && <p role="status" className="text-xs">Loading Models…</p>}
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {catalog.rows.map(model => <div key={model.id} className="flex items-center gap-2 rounded border px-2 py-1 text-xs"><span className="min-w-0 flex-1 break-words">{model.modelName}</span><Button size="icon-xs" variant="outline" aria-label={`Add ${model.modelName}`} disabled={components.length >= MAX_ASSEMBLY_COMPONENTS} onClick={() => add(model)}><Plus className="size-3.5" /></Button></div>)}
              {!loading && !catalogError && !catalog.rows.length && <p className="text-xs text-muted-foreground">No matching Models.</p>}
            </div>
            <div className="flex gap-1"><Button size="xs" variant="outline" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Previous</Button><Button size="xs" variant="outline" disabled={loading || (page + 1) * 25 >= catalog.total} onClick={() => setPage(p => p + 1)}>Next</Button><Button size="xs" variant="ghost" onClick={() => setRefresh(v => v + 1)}>Refresh</Button></div>
          </AssemblyEditorPanel>
          <AssemblyEditorPanel label="Assembly components" title={<>Components · {components.length}/{MAX_ASSEMBLY_COMPONENTS}</>}>
            {!components.length && <p className="text-xs text-muted-foreground">Add a Model from the list. Each addition creates an independent component.</p>}
            <div className="max-h-64 space-y-1 overflow-y-auto">{components.map((c, i) => <Button key={c.id} variant={c.id === selectedId ? 'secondary' : 'ghost'} aria-pressed={c.id === selectedId} className="h-auto min-h-6 w-full justify-start whitespace-normal px-2 py-1 text-left text-xs leading-tight" onClick={() => setSelectedId(c.id)}>{i + 1}. {c.label || 'Unnamed component'}</Button>)}</div>
            {validation.error && <p role="status" className="text-xs text-amber-600">{validation.error}</p>}
          </AssemblyEditorPanel>
          <AssemblyEditorPanel label="Component transform" title="Component transform">
            {selected ? <>
              <label className="block text-xs">Component label<Input value={selected.label} maxLength={255} onChange={e => edit({ label: e.target.value })} /></label>
              <p className="text-xs text-muted-foreground">Model #{selected.modelId} · Position relative to the assembly origin. Rotations use degrees.</p>
              <div className="grid grid-cols-3 gap-1.5">{fields.map(([key, label]) => <label key={key} className="block text-xs">{label}<Input type="number" step="any" value={selected[key]} onChange={e => edit({ [key]: e.target.value })} /></label>)}</div>
              <div className="flex gap-1"><Button size="xs" variant="outline" disabled={components.length >= MAX_ASSEMBLY_COMPONENTS} onClick={() => { const id = crypto.randomUUID(); setComponents(rows => [...rows, { ...selected, id }]); setSelectedId(id); setDirty(true); }}><Copy className="size-3.5" />Duplicate</Button><Button size="xs" variant="outline" onClick={() => { setComponents(rows => rows.filter(c => c.id !== selected.id)); setSelectedId(null); setDirty(true); }}><Trash2 className="size-3.5" />Remove</Button></div>
            </> : <p className="text-xs text-muted-foreground">Select a component to edit its placement.</p>}
          </AssemblyEditorPanel>
        </div>
        <AssemblyCanvas key={assemblyId} ownerId={ownerId} components={components} selectedId={selectedId} disabled={reading || saving || stlImportOpen} onSelect={setSelectedId} onTransform={transformComponent} onManipulating={handleManipulating} />
      </div>
    </fieldset>
    <footer aria-label="Assembly actions" className="admin-editor-actions rounded-lg border border-emerald-500/30 bg-emerald-50 p-2 dark:bg-emerald-950/50 [&_button]:h-8 [&_button]:text-xs [&_svg]:h-3.5 [&_svg]:w-3.5">
      <Button size="sm" variant="success" disabled={!validation.definition || reading || saving || manipulating || stlImportOpen || (!!recordId && loadedRecordId !== recordId) || (!dirty && savedRevision > 0)} onClick={() => void persistOrLoad()}><Save className="h-4 w-4" />{saving ? 'Working…' : 'Save Changes'}</Button>
      <Button size="sm" variant="outline" disabled={reading || saving || manipulating || stlImportOpen || (!!recordId && loadedRecordId !== recordId)} onClick={() => uploadRef.current?.click()}><Upload className="h-4 w-4" />Import Draft</Button>
      <Button size="sm" variant="outline" disabled={!validation.definition || reading || saving || manipulating || stlImportOpen || (!!recordId && loadedRecordId !== recordId)} onClick={download}><Download className="h-4 w-4" />Export Draft</Button>
      {notice && <p role="status" className="min-w-0 flex-1 basis-full text-xs sm:basis-auto">{notice}</p>}
    </footer>
  </main>;
}
