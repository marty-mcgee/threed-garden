'use client';
import { AdminRelationshipBadge } from '@/components/admin/shared/AdminRelationshipBadge';
import { useAdminListQueryState } from '@/components/admin/shared/use-admin-list-query-state';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Eye, FlaskConical, RotateCw } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModelFieldHelp } from '../models/ModelFieldHelp';

type Row = { id: number; runId: string; name: string; projectId: number; simulationId: number | null; simulationRevision: number; status: string; createdAt: string; clientEndedAt: string | null };
const statuses = ['running', 'completed', 'failed', 'cancelled', 'timed-out'];
export function SimulationResultsList({ projectId: initialProjectId, simulationId: initialSimulationId }: { projectId?: number; simulationId?: number }) {
  const [projectId, setProjectId] = useAdminListQueryState('/admin/threed/simulation-results', 'projectId', String(initialProjectId ?? ''), {enabled: true, urlDefault: ''});
  const [simulationId, setSimulationId] = useAdminListQueryState('/admin/threed/simulation-results', 'simulationId', String(initialSimulationId ?? ''), {enabled: true, urlDefault: ''});
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [projectError, setProjectError] = useState('');
  const [status, setStatus] = useAdminListQueryState('/admin/threed/simulation-results', 'status', '', {enabled: true}), [page, setPage] = useAdminListQueryState('/admin/threed/simulation-results', 'page', 0, {enabled: true}), [limit, setLimit] = useAdminListQueryState('/admin/threed/simulation-results', 'limit', 25, {enabled: true}), [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState<Row[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const invalidId = !!simulationId && (!/^[1-9]\d*$/.test(simulationId) || !Number.isSafeInteger(Number(simulationId)) || Number(simulationId) > 2_147_483_647);
  useEffect(() => {
    const abort = new AbortController(); setProjectError('');
    fetch('/api/project', { signal: abort.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Project filter choices unavailable. Refresh to retry.');
      if (!abort.signal.aborted) setProjects(result.data);
    }).catch(cause => { if (!abort.signal.aborted) setProjectError(cause instanceof Error ? cause.message : 'Projects unavailable.'); });
    return () => abort.abort();
  }, [refresh]);
  useEffect(() => {
    const abort = new AbortController(); setRows([]); setTotal(0); setError('');
    if (invalidId) { setLoading(false); return () => abort.abort(); }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
        if (projectId) params.set('projectId', projectId);
        if (simulationId) params.set('simulationId', simulationId);
        if (status) params.set('status', status);
        const response = await fetch(`/api/threed/simulation-results?${params}`, { signal: abort.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.error || 'Simulation Results unavailable.');
        if (abort.signal.aborted) return;
        const count = Number(result.pagination.total);
        if (page && page * limit >= count) { setPage(() => Math.max(0, Math.ceil(count / limit) - 1), {replace: true}); return; }
        setRows(result.data); setTotal(count);
      } catch (cause) { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Simulation Results unavailable.'); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    }, simulationId ? 200 : 0);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [projectId, simulationId, invalidId, status, page, limit, refresh]);
  const pages = Math.max(1, Math.ceil(total / limit));
  const listHref = `/admin/threed/simulations${projectId ? `?projectId=${projectId}` : ''}`;
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 text-xs">
    <AdminWorkspaceHeader icon={ClipboardList} title="Simulation Results" description="Browse captured Simulation run history.">
      <ModelFieldHelp label="Simulation Results">Results are browser-reported run history. Finalized reports are immutable. A running record means no final report has been received; it does not prove a browser is still running. Sensor observations do not certify a goal.</ModelFieldHelp>
      <span className="rounded border px-1.5 py-0.5">{loading ? 'Loading...' : total}</span>
      <select aria-label="Filter Results by Project" className="h-7 max-w-56 rounded-md border bg-background px-2" value={projectId} onChange={event => { setProjectId(event.target.value); setSimulationId(''); setPage(0); }}>
        <option value="">All Projects</option>
        {projectId && !projects.some(project => String(project.id) === projectId) && <option value={projectId}>Project #{projectId}</option>}
        {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      <Input className="h-7 w-36 text-xs" aria-label="Filter Results by Simulation ID" inputMode="numeric" maxLength={10} placeholder="Simulation ID" value={simulationId} aria-invalid={invalidId} onChange={event => { setSimulationId(event.target.value); setPage(0); }} />
      <select aria-label="Filter Results by status" className="h-7 rounded-md border bg-background px-2" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}>
        <option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{value === 'running' ? 'Awaiting final report' : value}</option>)}
      </select>
      <Button variant="outline" size="sm" className="h-7" onClick={() => { setProjectId(''); setSimulationId(''); setStatus(''); setPage(0); }}>Clear filters</Button>
      <Button variant="outline" size="sm" className="h-7" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RotateCw className="h-3.5 w-3.5" /> Refresh</Button>
      <AdminWorkspaceLink href={listHref} icon={FlaskConical}>Simulations</AdminWorkspaceLink>
    </AdminWorkspaceHeader>
    <p className="text-muted-foreground">Saved run history, newest first. Records awaiting a final report may belong to an interrupted browser session.</p>
    {projectError && <p role="alert" className="text-destructive">{projectError}</p>}
    {invalidId && <p role="alert" className="text-destructive">Enter a positive Simulation ID, or clear the filter.</p>}
    <nav aria-label="Simulation Results pagination" className="flex flex-wrap items-center justify-between gap-2">
      <span role="status">{loading ? 'Loading Results...' : error || invalidId ? 'Results unavailable' : `${total ? page * limit + 1 : 0}-${Math.min((page + 1) * limit, total)} of ${total} Results`}</span>
      <div className="flex flex-wrap items-center gap-1">
        <select aria-label="Results per page" className="h-7 rounded-md border bg-background px-2" value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(0); }}>{[25, 50, 100].map(size => <option key={size} value={size}>{size} per page</option>)}</select>
        <Button variant="outline" size="sm" disabled={loading || !page || invalidId} onClick={() => setPage(0)}>First</Button>
        <Button variant="outline" size="sm" disabled={loading || !page || invalidId} onClick={() => setPage(value => value - 1)}>Previous</Button>
        <span>Page {page + 1} of {pages}</span>
        <Button variant="outline" size="sm" disabled={loading || page + 1 >= pages || invalidId} onClick={() => setPage(value => value + 1)}>Next</Button>
        <Button variant="outline" size="sm" disabled={loading || page + 1 >= pages || invalidId} onClick={() => setPage(pages - 1)}>Last</Button>
      </div>
    </nav>
    <div className="min-h-0 flex-1 overflow-auto rounded-md border"><Table className="min-w-[800px] [&_td]:py-2 [&_td]:text-xs [&_th]:text-xs">
      <TableHeader className="sticky top-0 z-10 bg-background"><TableRow>{['Result', 'Simulation snapshot', 'Project', 'Revision', 'Status', 'Recorded', 'Details'].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{loading ? <TableRow><TableCell colSpan={7}>Loading Results...</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={7} role="alert" className="text-destructive">{error} <Button variant="outline" size="sm" onClick={() => setRefresh(value => value + 1)}>Retry</Button></TableCell></TableRow> : !rows.length ? <TableRow><TableCell colSpan={7}>{invalidId ? 'Correct the Simulation ID above.' : 'No saved Results match these filters. Owner runs capture Results from the Project Scene.'}</TableCell></TableRow> : rows.map(row => <TableRow key={row.runId}>
        <TableCell>#{row.id}</TableCell><TableCell className="font-medium">{row.name}<span className="block text-muted-foreground">{row.simulationId ? <AdminRelationshipBadge kind="simulation" id={row.simulationId} /> : 'Definition deleted; snapshot retained'}</span></TableCell>
        <TableCell><AdminRelationshipBadge kind="project" id={row.projectId} label={projects.find(project => project.id === row.projectId)?.name} /></TableCell><TableCell>{row.simulationRevision}</TableCell>
        <TableCell className={row.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300' : row.status === 'running' ? 'text-amber-700 dark:text-amber-300' : row.status === 'cancelled' ? 'text-muted-foreground' : 'text-destructive'}>{row.status === 'running' ? 'Awaiting final report' : row.status}</TableCell>
        <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
        <TableCell><Button asChild variant="outline" size="sm"><Link href={`/admin/threed/simulation-results/${row.runId}`} aria-label={`View Result #${row.id}`}><Eye className="h-3.5 w-3.5" /> View</Link></Button></TableCell>
      </TableRow>)}</TableBody>
    </Table></div>
  </div>;
}
