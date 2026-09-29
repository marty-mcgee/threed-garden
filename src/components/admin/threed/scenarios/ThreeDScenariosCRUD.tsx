'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Check, CircleDot, Pencil, Plus, Radar, Sprout, Trash2, X } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScenarioContinuationDialog } from './ScenarioContinuationDialog';
import type { ScenarioSetup } from '@/libraries/services/threed/scenarios/scenario-input';

type Scenario = { id: number; projectId: number; threedId: number; projectName: string; threedName: string; name: string; slug: string; description: string | null; isActive: boolean; createdAt: string; setup: ScenarioSetup | null };
type Project = { id: number; name: string };
type Module = { id: number; name: string };
type AssignedAsset = { assetType: string; assetId: number; moduleId: number };
type ModelChoice = { id: string; name: string };
type GroupChoice = { id: string; name: string };
type Form = { projectId: string; threedId: string; name: string; slug: string; description: string; isActive: boolean; setupKind: '' | 'soccer' | 'farming'; environmentMarkerId: string; sensorGroupId: string };
const emptyForm: Form = { projectId: '', threedId: '', name: '', slug: '', description: '', isActive: true, setupKind: '', environmentMarkerId: '', sensorGroupId: '' };
const pageSizes = [25, 50, 100];
const sortKeys = ['name', 'slug', 'project', 'active', 'createdAt'] as const;
type SortKey = typeof sortKeys[number];
const purposePrompts = [
  { id: 'farm', icon: Sprout, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', title: 'Explore a farm', outcome: 'Discover places and plants.', suggested: 'Beds + Plantings', name: 'Explore the Farm', description: 'Explore the farm and discover its places, plants, and people.' },
  { id: 'soccer', icon: CircleDot, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', title: 'Practice soccer', outcome: 'Play and observe the field.', suggested: 'Field + ball + Sensor Group', name: 'Soccer Practice', description: 'Practice on the field and explore how the Scene responds.' },
  { id: 'monitor', icon: Radar, color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', title: 'Monitor activity', outcome: 'Watch what happens in the Scene.', suggested: 'Project Sensors', name: 'Project Activity', description: 'Observe activity in the Project Scene.' },
] as const;

function slugFromName(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/, '');
}

export function ThreeDScenariosCRUD({ projectId, compact = false }: { projectId?: string; compact?: boolean } = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [assetSnapshot, setAssetSnapshot] = useState<{ projectId: string; assets: AssignedAsset[] | null } | null>(null);
  const [projectError, setProjectError] = useState('');
  const [projectFilter, setProjectFilter] = useState(compact ? projectId ?? '' : '');
  const [rows, setRows] = useState<Scenario[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Scenario | null>(null);
  const [detail, setDetail] = useState<Pick<Scenario, 'id' | 'projectId' | 'projectName' | 'threedName' | 'name' | 'description'> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [choosingPurpose, setChoosingPurpose] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [formError, setFormError] = useState('');
  const [modelChoices, setModelChoices] = useState<ModelChoice[]>([]);
  const [groupChoices, setGroupChoices] = useState<GroupChoice[]>([]);
  const [choicesLoading, setChoicesLoading] = useState(false);
  const [choicesError, setChoicesError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/project', { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load Projects.');
      if (!controller.signal.aborted) {
        const ownedProjects: Project[] = Array.isArray(result.data) ? result.data : [];
        setProjects(ownedProjects);
        setProjectError('');
        const params = compact ? null : new URLSearchParams(window.location.search);
        const requestedId = params?.get('projectId');
        if (compact && projectId && !ownedProjects.some(project => String(project.id) === projectId)) {
          setProjectError('This Project is unavailable.');
        }
        if (requestedId && /^\d+$/.test(requestedId) && ownedProjects.some(project => String(project.id) === requestedId)) {
          setProjectFilter(requestedId);
          if (params?.get('create') === '1') {
            setEditing(null);
            setForm({ ...emptyForm, projectId: requestedId });
            setFormError('');
            setChoosingPurpose(true);
            setDialogOpen(true);
          }
        }
      }
    }).catch(error => { if (!controller.signal.aborted) setProjectError(error instanceof Error ? error.message : 'Could not load Projects.'); });
    return () => controller.abort();
  }, [compact, projectId]);

  useEffect(() => {
    if (!compact) return;
    setProjectFilter(projectId ?? '');
    setPage(0);
    setDialogOpen(false);
    setEditing(null);
    setForm({ ...emptyForm, projectId: projectId ?? '' });
  }, [compact, projectId]);

  useEffect(() => {
    if (!dialogOpen || editing || !form.projectId) { setModules([]); return; }
    const controller = new AbortController();
    fetch(`/api/project/modules?projectId=${form.projectId}`, { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load ThreeD modules.');
      if (!controller.signal.aborted) setModules(Array.isArray(result.data?.threed) ? result.data.threed : []);
    }).catch(error => { if (!controller.signal.aborted) setFormError(error instanceof Error ? error.message : 'Could not load ThreeD modules.'); });
    return () => controller.abort();
  }, [dialogOpen, editing, form.projectId]);

  useEffect(() => {
    if (!dialogOpen || !choosingPurpose || !form.projectId) { setAssetSnapshot(null); return; }
    const controller = new AbortController();
    setAssetSnapshot(null);
    fetch(`/api/project/assets?projectId=${encodeURIComponent(form.projectId)}&moduleType=threed`, { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Project assets unavailable');
      if (!controller.signal.aborted) setAssetSnapshot({ projectId: form.projectId, assets: Array.isArray(result.data) ? result.data : null });
    }).catch(() => { if (!controller.signal.aborted) setAssetSnapshot({ projectId: form.projectId, assets: null }); });
    return () => controller.abort();
  }, [dialogOpen, choosingPurpose, form.projectId]);

  useEffect(() => {
    if (!dialogOpen || choosingPurpose || !form.projectId) { setModelChoices([]); setGroupChoices([]); return; }
    const controller = new AbortController();
    setChoicesLoading(true); setChoicesError(''); setModelChoices([]); setGroupChoices([]);
    const suffix = `projectId=${encodeURIComponent(form.projectId)}`;
    Promise.all([
      fetch(`/api/project/assets?${suffix}&moduleType=threed&assetType=threed_models`, { signal: controller.signal }),
      fetch(`/api/project/threed-markers?${suffix}`, { signal: controller.signal }),
      fetch(`/api/project/sensor-groups?${suffix}`, { signal: controller.signal }),
    ]).then(async responses => {
      const results = await Promise.all(responses.map(async response => ({ ok: response.ok, body: await response.json() })));
      if (results.some(result => !result.ok || !result.body.success)) throw new Error('Could not load Project setup choices.');
      if (controller.signal.aborted) return;
      const assets: AssignedAsset[] = results[0].body.data;
      const markers: { markerId: string; markerType: string; sourceAssetId: number; threedId: number; name: string; isActive: boolean }[] = results[1].body.data;
      const models = new Map<string, ModelChoice>();
      for (const asset of assets) {
        if (asset.assetType !== 'threed_models') continue;
        const marker = markers.find(item => item.markerType === 'models' && item.sourceAssetId === asset.assetId && item.threedId === asset.moduleId && item.isActive);
        const id = marker?.markerId ?? `models-${asset.assetId}`;
        models.set(id, { id, name: marker?.name ?? `Model ${asset.assetId}` });
      }
      setModelChoices([...models.values()]);
      setGroupChoices(results[2].body.data);
    }).catch(error => { if (!controller.signal.aborted) setChoicesError(error instanceof Error ? error.message : 'Could not load Project setup choices.'); })
      .finally(() => { if (!controller.signal.aborted) setChoicesLoading(false); });
    return () => controller.abort();
  }, [dialogOpen, choosingPurpose, form.projectId]);

  useEffect(() => {
    if (!compact) return;
    const refresh = () => { if (document.visibilityState === 'visible') setRevision(value => value + 1); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [compact]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setLoadError('');
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search, sort, direction });
      if (projectFilter) params.set('projectId', projectFilter);
      try {
        const response = await fetch(`/api/threed/scenarios?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not load Scenarios.');
        if (controller.signal.aborted) return;
        const nextTotal = Number(result.pagination?.total ?? 0);
        if (page > 0 && page * pageSize >= nextTotal) { setPage(Math.max(0, Math.ceil(nextTotal / pageSize) - 1)); return; }
        setRows(result.data); setTotal(nextTotal); setSelected(new Set());
      } catch (error) {
        if (!controller.signal.aborted) { setRows([]); setLoadError(error instanceof Error ? error.message : 'Could not load Scenarios.'); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, search ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, search, sort, direction, projectFilter, revision]);

  function resetList() { setPage(0); setSelected(new Set()); }
  function openCreate() { if (compact && !projects.some(project => String(project.id) === projectFilter)) return; setEditing(null); setForm({ ...emptyForm, projectId: projectFilter }); setModules([]); setFormError(''); setChoosingPurpose(true); setDialogOpen(true); }
  function choosePurpose(prompt?: typeof purposePrompts[number]) {
    if (prompt) setForm(value => ({ ...value, name: prompt.name, slug: slugFromName(prompt.name), description: prompt.description, setupKind: prompt.id === 'farm' ? 'farming' : prompt.id === 'soccer' ? 'soccer' : '' }));
    setChoosingPurpose(false);
  }
  function openEdit(row: Scenario) {
    setEditing(row);
    setChoosingPurpose(false);
    setForm({ projectId: String(row.projectId), threedId: String(row.threedId), name: row.name, slug: row.slug, description: row.description ?? '', isActive: row.isActive, setupKind: row.setup?.kind ?? '', environmentMarkerId: row.setup?.environmentMarkerId ?? '', sensorGroupId: row.setup?.sensorGroupId ?? '' });
    setFormError(''); setDialogOpen(true);
  }
  function changeSort(key: SortKey) {
    setDirection(sort === key && direction === 'asc' ? 'desc' : 'asc'); setSort(key); resetList();
  }
  async function save() {
    if (choicesLoading || choicesError) { setFormError(choicesError || 'Project setup choices are still loading.'); return; }
    setBusy(true); setFormError('');
    try {
      const setup: ScenarioSetup | null = form.setupKind
        ? { version: 1, kind: form.setupKind, environmentMarkerId: form.environmentMarkerId || null, sensorGroupId: form.setupKind === 'soccer' ? form.sensorGroupId || null : null }
        : null;
      const setupChanged = JSON.stringify(setup) !== JSON.stringify(editing?.setup ?? null);
      const response = await fetch('/api/threed/scenarios', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editing?.id, projectId: Number(form.projectId), threedId: Number(form.threedId),
          ...(editing && !setupChanged ? {} : { setup }) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save Scenario.');
      setDialogOpen(false); setNotice(editing ? 'Scenario updated.' : 'Scenario created.'); setRevision(value => value + 1);
      setDetail({ id: result.data.id, projectId: result.data.projectId, name: result.data.name, description: result.data.description,
        projectName: editing?.projectName ?? projects.find(project => project.id === result.data.projectId)?.name ?? 'Project',
        threedName: editing?.threedName ?? modules.find(module => module.id === result.data.threedId)?.name ?? 'ThreeD module' });
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not save Scenario.'); }
    finally { setBusy(false); }
  }
  async function remove(ids: number[]) {
    if (!ids.length || !window.confirm(`Delete ${ids.length} Scenario${ids.length === 1 ? '' : 's'}?`)) return;
    setBusy(true); setNotice('');
    let deleted = 0;
    for (const id of ids) {
      try {
        const response = await fetch(`/api/threed/scenarios?id=${id}`, { method: 'DELETE' });
        if (response.ok && (await response.json()).success) deleted++;
      } catch { /* Report partial result after the batch. */ }
    }
    setBusy(false); setSelected(new Set());
    setNotice(deleted === ids.length ? `${deleted} Scenario${deleted === 1 ? '' : 's'} deleted.` : `${deleted} of ${ids.length} Scenarios deleted. Refresh and retry the remainder.`);
    setRevision(value => value + 1);
  }

  const assignedAssets = assetSnapshot?.projectId === form.projectId ? assetSnapshot.assets : null;
  const assignedCount = (type: string) => assignedAssets?.filter(asset => asset.assetType === type).length ?? 0;
  const projectContext = (id: typeof purposePrompts[number]['id']) => {
    if (!form.projectId || !assetSnapshot || assetSnapshot.projectId !== form.projectId || !assignedAssets) return '';
    if (id === 'farm') return `In Project: ${assignedCount('threed_beds')} Beds · ${assignedCount('threed_plantings')} Plantings`;
    if (id === 'soccer') return `In Project: ${assignedCount('threed_models')} Models`;
    return `In Project: ${assignedAssets.length} ThreeD assets`;
  };
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentIds = rows.map(row => row.id);
  const allSelected = currentIds.length > 0 && currentIds.every(id => selected.has(id));
  const sortable = (label: string, key: SortKey) => <button type="button" onClick={() => changeSort(key)} aria-label={`Sort by ${label}`} className="font-semibold hover:underline">{label}{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</button>;
  return <div className={compact ? 'mt-3 space-y-2.5 rounded-lg border border-foreground/15 bg-foreground/[0.03] p-3' : 'flex min-h-0 flex-1 flex-col gap-3'}>
    {compact ? <section aria-label="Saved Scenario outlines" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300"><BookOpen aria-hidden="true" className="h-4 w-4" /></span> Saved Scenarios <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">{total}</span></h3>
        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={!projects.some(project => String(project.id) === projectFilter)} onClick={openCreate}><Plus aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" /> New Scenario</Button>
      </div>
      <Input aria-label="Search saved Scenarios" placeholder="Search outlines" className="h-8 bg-background/50 text-xs" maxLength={120} value={search} onChange={event => { setSearch(event.target.value); resetList(); }} />
      {projectError && <p role="alert" className="text-xs text-destructive">{projectError}</p>}
      {notice && <p role="status" className="text-xs">{notice}</p>}
      {loading ? <p className="text-xs text-muted-foreground">Loading saved outlines…</p> :
        loadError ? <p role="alert" className="text-xs text-destructive">{loadError}</p> :
        rows.length ? <ul className="space-y-2">{rows.map(row => <li key={row.id} className="rounded-lg border border-foreground/10 bg-background/30 p-2.5 transition-colors hover:bg-foreground/[0.06]">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold">{row.name}</p><p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"><span>{row.threedName}</span><span aria-hidden="true">·</span><span className={row.isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>{row.isActive ? 'Active' : 'Inactive'}</span></p></div>
            <div className="flex shrink-0 gap-1"><Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDetail(row)} aria-label={`View ${row.name}`}>View</Button><Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}><Pencil aria-hidden="true" className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" /> Edit</Button><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={busy} onClick={() => void remove([row.id])} aria-label={`Delete ${row.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></div>
          </div>
          {row.description && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{row.description}</p>}
        </li>)}</ul> :
        <p className="text-xs text-muted-foreground">{search ? 'No saved Scenarios match this search.' : 'No saved outlines for this Project yet.'}</p>}
      {total > pageSize && <nav aria-label="Saved Scenarios pages" className="flex items-center justify-between gap-2 text-xs"><span>Page {page + 1} of {pages}</span><div className="flex gap-1"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button></div></nav>}
    </section> : <>
    <AdminWorkspaceHeader icon={BookOpen} title="ThreeD Scenarios" description="Manage Project-scoped ThreeD Scenario definitions.">
      <span className="rounded border px-2 py-0.5 text-xs">{total} total</span>
      <Input aria-label="Search Scenarios" placeholder="Search Scenarios" className="h-8 w-52 text-xs" maxLength={120} value={search} onChange={event => { setSearch(event.target.value); resetList(); }} />
      <select aria-label="Filter by Project" className="h-8 max-w-48 rounded border bg-background px-2 text-xs" value={projectFilter} onChange={event => { setProjectFilter(event.target.value); resetList(); }}>
        <option value="">All Projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      <Button size="sm" className="h-8 gap-1 text-xs" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> New Scenario</Button>
    </AdminWorkspaceHeader>
    {projectError && <p role="alert" className="text-sm text-destructive">{projectError}</p>}
    {notice && <p role="status" className="text-xs">{notice}</p>}
    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background"><TableRow>
          <TableHead className="w-9"><input type="checkbox" aria-label="Select current page" checked={allSelected} onChange={event => setSelected(event.target.checked ? new Set(currentIds) : new Set())} disabled={loading || !!loadError} /></TableHead>
          <TableHead>{sortable('Name', 'name')}</TableHead><TableHead>{sortable('Slug', 'slug')}</TableHead><TableHead>{sortable('Project', 'project')}</TableHead><TableHead>ThreeD module</TableHead><TableHead>{sortable('Active', 'active')}</TableHead><TableHead>{sortable('Created', 'createdAt')}</TableHead><TableHead>Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={8}>Loading Scenarios…</TableCell></TableRow>}
          {!loading && loadError && <TableRow><TableCell colSpan={8} role="alert">{loadError}</TableCell></TableRow>}
          {!loading && !loadError && !rows.length && <TableRow><TableCell colSpan={8}>
            {search ? 'No Scenarios match this search.' : <div className="space-y-2 py-5 text-center"><p className="font-medium">Give {projectFilter ? 'this Project' : 'a Project'} a purpose.</p><p className="text-xs text-muted-foreground">Save a Scenario outline now. You can add to the Scene later.</p><Button size="sm" onClick={openCreate}>Create Scenario</Button></div>}
          </TableCell></TableRow>}
          {!loading && !loadError && rows.map(row => <TableRow key={row.id}>
            <TableCell><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.has(row.id)} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /></TableCell>
            <TableCell className="font-medium">{row.name}</TableCell><TableCell>{row.slug}</TableCell><TableCell>{row.projectName}</TableCell><TableCell>{row.threedName}</TableCell>
            <TableCell>{row.isActive ? <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300"><Check className="h-3.5 w-3.5" /> Active</span> : <span className="inline-flex items-center gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" /> Inactive</span>}</TableCell>
            <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="whitespace-nowrap"><Button variant="ghost" size="sm" onClick={() => setDetail(row)} aria-label={`View ${row.name}`}>View</Button><Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>Edit</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => void remove([row.id])} aria-label={`Delete ${row.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </div>
    <nav aria-label="Scenarios pagination" className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Scenarios unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Scenarios`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span><Button variant="outline" size="sm" disabled={!selected.size || busy} onClick={() => void remove([...selected])}>Delete selected</Button><Button variant="ghost" size="sm" disabled={!selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button></div>
      <div className="flex flex-wrap items-center gap-1"><select aria-label="Scenarios per page" className="h-8 rounded border bg-background px-2" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); resetList(); }}>{pageSizes.map(size => <option key={size} value={size}>{size} per page</option>)}</select><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(0)}>First</Button><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span className="px-2">Page {page + 1} of {pages}</span><Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button><Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(pages - 1)}>Last</Button></div>
    </nav>
    </>}
    <ScenarioContinuationDialog scenario={detail} onClose={() => setDetail(null)} />
    <Dialog open={dialogOpen} onOpenChange={open => { if (!busy) setDialogOpen(open); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Edit Scenario' : choosingPurpose ? 'Choose a Scenario' : 'New Scenario'}</DialogTitle></DialogHeader>
      {!editing && choosingPurpose ? <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">{purposePrompts.map(prompt => {
          const Icon = prompt.icon;
          const context = projectContext(prompt.id);
          return <button key={prompt.id} type="button" onClick={() => choosePurpose(prompt)} className="rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span aria-hidden="true" className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${prompt.color}`}><Icon className="h-5 w-5" /></span>
            <span className="mt-2 block text-sm font-semibold">{prompt.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{prompt.outcome}</span>
            <span className="mt-2 block text-[11px] text-muted-foreground">Try: {prompt.suggested}</span>
            {context && <span className="mt-1 block text-[11px] text-muted-foreground">{context}</span>}
          </button>;
        })}<button type="button" onClick={() => choosePurpose()} className="rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400"><Pencil className="h-5 w-5" /></span>
          <span className="mt-2 block text-sm font-semibold">Start from scratch</span>
          <span className="mt-1 block text-xs text-muted-foreground">Blank outline, your idea.</span>
        </button></div>
      </div> : <div className="space-y-3">
        <div><Label htmlFor="scenario-project">Project</Label><select id="scenario-project" className="mt-1 w-full rounded border bg-background p-2 text-sm" disabled={!!editing} value={form.projectId} onChange={event => { setForm(value => ({ ...value, projectId: event.target.value, threedId: '', environmentMarkerId: '', sensorGroupId: '' })); setFormError(''); }}><option value="">Choose a Project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
        <div><Label htmlFor="scenario-threed">ThreeD module</Label>{editing ? <Input id="scenario-threed" disabled value={editing.threedName} /> : <select id="scenario-threed" className="mt-1 w-full rounded border bg-background p-2 text-sm" value={form.threedId} onChange={event => setForm(value => ({ ...value, threedId: event.target.value }))} disabled={!form.projectId}><option value="">Choose an assigned ThreeD module</option>{modules.map(module => <option key={module.id} value={module.id}>{module.name}</option>)}</select>}
          {!editing && form.projectId && !modules.length && <p className="mt-1 text-xs text-muted-foreground">Assign a ThreeD module in <Link className="underline" href={`/admin/projects/${form.projectId}`}>Project Modules</Link> to save.</p>}
        </div>
        <div><Label htmlFor="scenario-name">Name</Label><Input id="scenario-name" maxLength={120} value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value, slug: !editing && (!value.slug || value.slug === slugFromName(value.name)) ? slugFromName(event.target.value) : value.slug }))} /></div>
        <div><Label htmlFor="scenario-slug">Slug</Label><Input id="scenario-slug" maxLength={100} value={form.slug} onChange={event => setForm(value => ({ ...value, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} /></div>
        <div><Label htmlFor="scenario-description">Purpose (optional)</Label><Textarea id="scenario-description" maxLength={2000} value={form.description} onChange={event => setForm(value => ({ ...value, description: event.target.value }))} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="scenario-setup-kind">Setup type</Label><select id="scenario-setup-kind" className="mt-1 w-full rounded border bg-background p-2 text-sm" value={form.setupKind} onChange={event => setForm(value => ({ ...value, setupKind: event.target.value as Form['setupKind'], sensorGroupId: event.target.value === 'soccer' ? value.sensorGroupId : '' }))}><option value="">Outline only</option><option value="soccer">Soccer</option><option value="farming">Farming</option></select></div>
          {form.setupKind && <div><Label htmlFor="scenario-environment">{form.setupKind === 'soccer' ? 'Field Model' : 'Environment Model'}</Label><select id="scenario-environment" className="mt-1 w-full rounded border bg-background p-2 text-sm" value={form.environmentMarkerId} onChange={event => setForm(value => ({ ...value, environmentMarkerId: event.target.value }))}><option value="">Choose an assigned Model</option>{form.environmentMarkerId && !modelChoices.some(choice => choice.id === form.environmentMarkerId) && <option value={form.environmentMarkerId}>Missing Model ({form.environmentMarkerId})</option>}{modelChoices.map(choice => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></div>}
          {form.setupKind === 'soccer' && <div><Label htmlFor="scenario-sensor-group">Sensor Group</Label><select id="scenario-sensor-group" className="mt-1 w-full rounded border bg-background p-2 text-sm" value={form.sensorGroupId} onChange={event => setForm(value => ({ ...value, sensorGroupId: event.target.value }))}><option value="">Choose a group</option>{form.sensorGroupId && !groupChoices.some(choice => choice.id === form.sensorGroupId) && <option value={form.sensorGroupId}>Missing group ({form.sensorGroupId})</option>}{groupChoices.map(choice => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></div>}
        </div>
        {choicesLoading && <p className="text-xs text-muted-foreground">Loading Project setup choices…</p>}
        {choicesError && <p role="alert" className="text-xs text-destructive">{choicesError}</p>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={event => setForm(value => ({ ...value, isActive: event.target.checked }))} /> Active</label>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDialogOpen(false)}>Cancel</Button><Button disabled={busy || choicesLoading || !!choicesError || !form.projectId || !form.threedId || !form.name.trim() || !form.slug.trim()} onClick={() => void save()}>{busy ? 'Saving…' : 'Save Scenario'}</Button></div>
      </div>}
    </DialogContent></Dialog>
  </div>;
}
