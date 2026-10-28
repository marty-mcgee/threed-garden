'use client';
import { AdminRelationshipBadge } from '@/components/admin/shared/AdminRelationshipBadge';
import { useAdminListQueryState } from '@/components/admin/shared/use-admin-list-query-state';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, BookOpen, Check, FlaskConical, ListChecks, Map, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { ModelFieldHelp } from '../models/ModelFieldHelp';

type Row = { id: number; name: string; slug: string; projectId: number; projectName: string; threedName: string; isActive: boolean; revision: number; actionCount: number; observationCount: number };
type Sort = 'name' | 'slug' | 'project' | 'revision' | 'active';
export function SimulationsList({ initialProjectId }: { initialProjectId?: number } = {}) {
  const router = useRouter(), { showToast, ToastComponent } = useToast(), lock = useRef(false);
  const [rows, setRows] = useState<Row[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]), [projectId, setProjectId] = useAdminListQueryState('/admin/threed/simulations', 'projectId', initialProjectId ? String(initialProjectId) : '', {enabled: true, urlDefault: ''});
  const [availability, setAvailability] = useAdminListQueryState('/admin/threed/simulations', 'isActive', '', {enabled: true, values: ['', 'true', 'false']});
  const [search, setSearch] = useAdminListQueryState('/admin/threed/simulations', 'search', '', {enabled: true}), [page, setPage] = useAdminListQueryState('/admin/threed/simulations', 'page', 0, {enabled: true}), [limit, setLimit] = useAdminListQueryState('/admin/threed/simulations', 'limit', 50, {enabled: true}), [sort, setSort] = useAdminListQueryState<Sort>('/admin/threed/simulations', 'sort', 'name', {enabled: true, values: ["name","slug","project","revision","active"]}), [direction, setDirection] = useAdminListQueryState('/admin/threed/simulations', 'direction', 'asc', {enabled: true, values: ['asc','desc']});
  const [selected, setSelected] = useState<Set<number>>(new Set()), [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: MouseEvent) => { if ((event.target as Element | null)?.closest('a[href]')) { event.preventDefault(); event.stopImmediatePropagation(); } };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [busy]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/project', { signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Projects unavailable.');
      if (!controller.signal.aborted) setProjects(result.data);
    }).catch(() => { if (!controller.signal.aborted) showToast('Project filter choices unavailable.', 'error'); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setSelected(new Set());
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit), search, sort, direction });
        if (projectId) params.set('projectId', projectId);
        if (availability) params.set('isActive', availability);
        const response = await fetch(`/api/threed/simulations?${params}`, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json(); if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.error || 'Simulations unavailable.');
        if (controller.signal.aborted) return;
        const total = Number(result.pagination?.total ?? 0);
        if (page > 0 && page * limit >= total) { setPage(() => Math.max(0, Math.ceil(total / limit) - 1), {replace: true}); return; }
        setRows(result.data); setTotal(total);
      } catch (e) { if (!controller.signal.aborted) { setRows([]); setTotal(0); setError(e instanceof Error ? e.message : 'Simulations unavailable.'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, search ? 200 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, limit, search, sort, direction, projectId, availability, refresh]);
  const reset = () => { setPage(0); setSelected(new Set()); };
  const filtered = !!(search || projectId || availability);
  const clearFilters = () => { setSearch(''); setProjectId(''); setAvailability(''); reset(); };
  const resultsHref = `/admin/threed/simulation-results${projectId ? `?projectId=${projectId}` : ''}`;
  const pages = Math.max(1, Math.ceil(total / limit));
  async function remove(targets: Row[]) {
    if (lock.current || loading || !targets.length || !window.confirm(`Delete ${targets.length} Simulation${targets.length === 1 ? '' : 's'}? Saved Results remain as historical records.`)) return;
    lock.current = true; setBusy(true); let deleted = 0;
    try {
      for (const row of targets) {
        try {
          const response = await fetch(`/api/threed/simulations?id=${row.id}&revision=${row.revision}`, { method: 'DELETE', signal: AbortSignal.timeout(30000) });
          const result = await response.json(); if (response.ok && result.success && result.data?.id === row.id) deleted++;
        } catch { /* Preserve the remaining results and report the batch honestly. */ }
      }
      showToast(deleted === targets.length ? `${deleted} Simulation${deleted === 1 ? '' : 's'} deleted.` : `${deleted} of ${targets.length} Simulations deleted. Refresh and retry the remainder.`, deleted === targets.length ? 'success' : 'error');
    } finally { lock.current = false; setBusy(false); setSelected(new Set()); setRefresh(value => value + 1); }
  }
  const heading = (label: string, key: Sort) => {
    const Icon = sort === key ? direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <button type="button" aria-label={`Sort by ${label}`} className="flex items-center gap-1 text-xs font-semibold" onClick={() => { setSort(key); setDirection(sort === key && direction === 'asc' ? 'desc' : 'asc'); reset(); }}>{label}<Icon className="h-3 w-3" /></button>;
  };
  return <div className="flex min-h-0 flex-1 flex-col gap-2 text-xs [&_button]:text-xs">
    {ToastComponent}
    <fieldset disabled={busy} className="contents">
      <AdminWorkspaceHeader icon={FlaskConical} title="ThreeD Simulations" description="Manage Project-owned Simulation definitions.">
        <ModelFieldHelp label="Simulations">Plan ordered Character Actions and Sensor Group observations. Active controls availability; saving does not execute a Simulation. Select saved Project markers as Action participants.</ModelFieldHelp>
        <span className="rounded border px-1.5 py-0.5 text-xs">{total}</span>
        <Input aria-label="Search Simulations" className="h-7 min-w-40 flex-1 text-xs" maxLength={120} placeholder="Search name, slug or Project…" value={search} onChange={event => { setSearch(event.target.value); reset(); }} />
        <select aria-label="Filter Simulations by Project" className="h-7 max-w-48 rounded-md border bg-background px-2 text-xs" value={projectId} onChange={event => { setProjectId(event.target.value); reset(); }}><option value="">All Projects</option>{projectId && !projects.some(project => String(project.id) === projectId) && <option value={projectId}>Project #{projectId}</option>}{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
        <select aria-label="Filter Simulations by availability" className="h-7 rounded-md border bg-background px-2 text-xs" value={availability} onChange={event => { setAvailability(event.target.value); reset(); }}><option value="">All availability</option><option value="true">Active</option><option value="false">Inactive</option></select>
        <Button variant="outline" size="sm" className="h-7" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
        <Button variant="ghost" size="sm" className="h-7" disabled={!filtered} onClick={clearFilters}>Reset filters</Button>
        <AdminWorkspaceLink href={resultsHref} icon={ListChecks}>Results</AdminWorkspaceLink>
        <AdminWorkspaceLink href="/admin/threed/scenarios" icon={BookOpen}>Scenarios</AdminWorkspaceLink>
        <Button variant="success" size="sm" className="h-7 text-xs" onClick={() => router.push(`/admin/threed/simulations/new${projectId ? `?projectId=${projectId}` : ''}`)}><Plus className="h-3.5 w-3.5" /> Add Simulation</Button>
      </AdminWorkspaceHeader>
      <p className="text-xs text-muted-foreground">Active makes a saved definition available in its Project. Scene execution currently supports Run to target ball and Kick ball with one Character and one ball; readiness is checked in the Scene. Other Actions can be authored and previewed.</p>
      <nav aria-label="Simulations pagination" className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : error ? 'Simulations unavailable' : `${total ? page * limit + 1 : 0}–${Math.min((page + 1) * limit, total)} of ${total} Simulations`}</span><span>|</span><span>{selected.size} selected</span><Button variant="outline" size="sm" disabled={loading || !selected.size} onClick={() => void remove(rows.filter(row => selected.has(row.id)))}><Trash2 className="h-3.5 w-3.5" /> Delete selected</Button><Button variant="ghost" size="sm" disabled={!selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button></div>
        <div className="flex flex-wrap items-center gap-1"><select aria-label="Simulations per page" className="h-7 rounded-md border bg-background px-2" value={limit} onChange={event => { setLimit(Number(event.target.value)); reset(); }}>{[25, 50, 100].map(size => <option key={size} value={size}>{size} per page</option>)}</select><Button variant="outline" size="sm" disabled={loading || !page} onClick={() => setPage(0)}>First</Button><Button variant="outline" size="sm" disabled={loading || !page} onClick={() => setPage(page - 1)}>Previous</Button><span className="px-1">Page {page + 1} of {pages}</span><Button variant="outline" size="sm" disabled={loading || page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button><Button variant="outline" size="sm" disabled={loading || page + 1 >= pages} onClick={() => setPage(pages - 1)}>Last</Button></div>
      </nav>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border"><Table className="min-w-[850px] [&_td]:py-1 [&_td]:text-xs [&_th]:text-xs">
        <TableHeader className="sticky top-0 z-10 bg-background"><TableRow><TableHead className="w-8"><input type="checkbox" aria-label="Select current page of Simulations" disabled={loading || !!error || !rows.length} checked={!!rows.length && rows.every(row => selected.has(row.id))} onChange={event => setSelected(event.target.checked ? new Set(rows.map(row => row.id)) : new Set())} /></TableHead><TableHead>{heading('Name', 'name')}</TableHead><TableHead>{heading('Slug', 'slug')}</TableHead><TableHead>{heading('Project', 'project')}</TableHead><TableHead>ThreeD module</TableHead><TableHead>Actions</TableHead><TableHead>Observations</TableHead><TableHead>{heading('Revision', 'revision')}</TableHead><TableHead>{heading('Active', 'active')}</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>{loading ? <TableRow><TableCell colSpan={10} role="status">Loading Simulations…</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={10} role="alert" className="text-destructive">{error}<Button variant="ghost" size="sm" onClick={() => setRefresh(value => value + 1)}>Retry</Button></TableCell></TableRow> : !rows.length ? <TableRow><TableCell colSpan={10}>{filtered ? 'No Simulations match these filters. Reset filters or add a Simulation to the selected Project.' : 'No Simulations yet. Add one to start planning Actions.'}</TableCell></TableRow> : rows.map(row => <TableRow key={row.id}>
          <TableCell><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.has(row.id)} onChange={event => setSelected(value => { const next = new Set(value); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /></TableCell>
          <TableCell className="font-medium">{row.name}<span className="ml-1 text-muted-foreground">#{row.id}</span></TableCell><TableCell>{row.slug}</TableCell><TableCell><AdminRelationshipBadge kind="project" id={row.projectId} label={row.projectName} /></TableCell><TableCell>{row.threedName}</TableCell><TableCell>{row.actionCount}</TableCell><TableCell>{row.observationCount}</TableCell><TableCell>{row.revision}</TableCell><TableCell>{row.isActive ? <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" aria-hidden="true" />Active</span> : <span className="inline-flex items-center gap-1 text-muted-foreground"><X className="h-4 w-4" aria-hidden="true" />Inactive</span>}</TableCell>
          <TableCell className="whitespace-nowrap text-right"><Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Simulation" aria-label={`Edit ${row.name}`} onClick={() => router.push(`/admin/threed/simulations/${row.id}`)}><Pencil className="h-4 w-4 text-blue-500" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" title="View saved Results" aria-label={`Results for ${row.name}`} onClick={() => router.push(`/admin/threed/simulation-results?projectId=${row.projectId}&simulationId=${row.id}`)}><ListChecks className="h-4 w-4 text-teal-500" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" title="Open Project Scene" aria-label={`Open Project Scene for ${row.name}`} onClick={() => router.push(`/dashboard/scene?projectId=${row.projectId}`)}><Map className="h-4 w-4 text-emerald-500" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" title="Delete Simulation" aria-label={`Delete ${row.name}`} onClick={() => void remove([row])}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>
    </fieldset>
  </div>;
}
