'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Check, Plus, Trash2, X } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Scenario = { id: number; projectId: number; threedId: number; projectName: string; threedName: string; name: string; slug: string; description: string | null; isActive: boolean; createdAt: string };
type Project = { id: number; name: string };
type Module = { id: number; name: string };
type Form = { projectId: string; threedId: string; name: string; slug: string; description: string; isActive: boolean };
const emptyForm: Form = { projectId: '', threedId: '', name: '', slug: '', description: '', isActive: true };
const pageSizes = [25, 50, 100];
const sortKeys = ['name', 'slug', 'project', 'active', 'createdAt'] as const;
type SortKey = typeof sortKeys[number];

export function ThreeDScenariosCRUD() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [projectError, setProjectError] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/project', { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load Projects.');
      if (!controller.signal.aborted) setProjects(result.data);
    }).catch(error => { if (!controller.signal.aborted) setProjectError(error instanceof Error ? error.message : 'Could not load Projects.'); });
    return () => controller.abort();
  }, []);

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
  function openCreate() { setEditing(null); setForm(emptyForm); setModules([]); setFormError(''); setDialogOpen(true); }
  function openEdit(row: Scenario) {
    setEditing(row);
    setForm({ projectId: String(row.projectId), threedId: String(row.threedId), name: row.name, slug: row.slug, description: row.description ?? '', isActive: row.isActive });
    setFormError(''); setDialogOpen(true);
  }
  function changeSort(key: SortKey) {
    setDirection(sort === key && direction === 'asc' ? 'desc' : 'asc'); setSort(key); resetList();
  }
  async function save() {
    setBusy(true); setFormError('');
    try {
      const response = await fetch('/api/threed/scenarios', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editing?.id, projectId: Number(form.projectId), threedId: Number(form.threedId) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save Scenario.');
      setDialogOpen(false); setNotice(editing ? 'Scenario updated.' : 'Scenario created.'); setRevision(value => value + 1);
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

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentIds = rows.map(row => row.id);
  const allSelected = currentIds.length > 0 && currentIds.every(id => selected.has(id));
  const sortable = (label: string, key: SortKey) => <button type="button" onClick={() => changeSort(key)} aria-label={`Sort by ${label}`} className="font-semibold hover:underline">{label}{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</button>;
  return <div className="flex min-h-0 flex-1 flex-col gap-3">
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
          {!loading && !loadError && !rows.length && <TableRow><TableCell colSpan={8}>No Scenarios found.</TableCell></TableRow>}
          {!loading && !loadError && rows.map(row => <TableRow key={row.id}>
            <TableCell><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.has(row.id)} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /></TableCell>
            <TableCell className="font-medium">{row.name}</TableCell><TableCell>{row.slug}</TableCell><TableCell>{row.projectName}</TableCell><TableCell>{row.threedName}</TableCell>
            <TableCell>{row.isActive ? <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300"><Check className="h-3.5 w-3.5" /> Active</span> : <span className="inline-flex items-center gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" /> Inactive</span>}</TableCell>
            <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="whitespace-nowrap"><Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>Edit</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => void remove([row.id])} aria-label={`Delete ${row.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </div>
    <nav aria-label="Scenarios pagination" className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Scenarios unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Scenarios`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span><Button variant="outline" size="sm" disabled={!selected.size || busy} onClick={() => void remove([...selected])}>Delete selected</Button><Button variant="ghost" size="sm" disabled={!selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button></div>
      <div className="flex flex-wrap items-center gap-1"><select aria-label="Scenarios per page" className="h-8 rounded border bg-background px-2" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); resetList(); }}>{pageSizes.map(size => <option key={size} value={size}>{size} per page</option>)}</select><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(0)}>First</Button><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span className="px-2">Page {page + 1} of {pages}</span><Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button><Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(pages - 1)}>Last</Button></div>
    </nav>
    <Dialog open={dialogOpen} onOpenChange={open => { if (!busy) setDialogOpen(open); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Edit Scenario' : 'New Scenario'}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label htmlFor="scenario-project">Project</Label><select id="scenario-project" className="mt-1 w-full rounded border bg-background p-2 text-sm" disabled={!!editing} value={form.projectId} onChange={event => { setForm(value => ({ ...value, projectId: event.target.value, threedId: '' })); setFormError(''); }}><option value="">Choose a Project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
        <div><Label htmlFor="scenario-threed">ThreeD module</Label>{editing ? <Input id="scenario-threed" disabled value={editing.threedName} /> : <select id="scenario-threed" className="mt-1 w-full rounded border bg-background p-2 text-sm" value={form.threedId} onChange={event => setForm(value => ({ ...value, threedId: event.target.value }))} disabled={!form.projectId}><option value="">Choose an assigned ThreeD module</option>{modules.map(module => <option key={module.id} value={module.id}>{module.name}</option>)}</select>}</div>
        <div><Label htmlFor="scenario-name">Name</Label><Input id="scenario-name" maxLength={120} value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} /></div>
        <div><Label htmlFor="scenario-slug">Slug</Label><Input id="scenario-slug" maxLength={100} value={form.slug} onChange={event => setForm(value => ({ ...value, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} /></div>
        <div><Label htmlFor="scenario-description">Description</Label><Textarea id="scenario-description" maxLength={2000} value={form.description} onChange={event => setForm(value => ({ ...value, description: event.target.value }))} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={event => setForm(value => ({ ...value, isActive: event.target.checked }))} /> Active</label>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDialogOpen(false)}>Cancel</Button><Button disabled={busy || !form.projectId || !form.threedId || !form.name.trim() || !form.slug.trim()} onClick={() => void save()}>{busy ? 'Saving…' : 'Save Scenario'}</Button></div>
      </div>
    </DialogContent></Dialog>
  </div>;
}
