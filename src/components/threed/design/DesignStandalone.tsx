'use client';
import { useAdminListQueryState } from '@/components/admin/shared/use-admin-list-query-state';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowUpDown, Building2, Search, RefreshCw, SquarePen, PencilRuler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DesignFieldHelp } from './DesignFieldHelp';

interface DesignProject {
  id: number; name: string; isActive: boolean | null; isPublic: boolean | null; updatedAt: string | null;
  walls: number; floors: number; roofs: number; openings: number;
}


/** Designs is an editing mode of an existing Project, never a separate Scene. */
export function DesignStandalone() {
  const query = useSearchParams(), router = useRouter();
  const { data: session, status } = useSession();
  const projectId = query.get('projectId');
  const [offset, setOffset] = useAdminListQueryState('/admin/threed/designs', 'offset', 0);
  const [search, setSearch] = useAdminListQueryState('/admin/threed/designs', 'search', '');
  const [active, setActive] = useAdminListQueryState('/admin/threed/designs', 'active', 'all', { values: ['all', 'active', 'inactive'] });
  const [visibility, setVisibility] = useAdminListQueryState('/admin/threed/designs', 'visibility', 'all', { values: ['all', 'public', 'private'] });
  const [content, setContent] = useAdminListQueryState('/admin/threed/designs', 'content', 'all', { values: ['all', 'saved', 'empty'] });
  const [sort, setSort] = useAdminListQueryState('/admin/threed/designs', 'sort', { key: 'updatedAt', direction: 'desc' }, { values: ['name', 'updatedAt'] });
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; projects: DesignProject[]; total: number; offset: number }>();
  const [failure, setFailure] = useState<{ key: string; message: string }>();
  const params = new URLSearchParams({ search, active, visibility, content, sort: sort.key, direction: sort.direction, offset: String(offset) }).toString();
  const key = `${session?.user?.id ?? ''}:${status}:${params}:${retry}`;
  const current = result?.key === key ? result : undefined;
  const error = failure?.key === key ? failure.message : '';
  const loading = !current && !error;
  useEffect(() => {
    if (projectId && /^[1-9]\d*$/.test(projectId) && Number.isSafeInteger(Number(projectId))) {
      router.replace('/dashboard/scene?projectId=' + projectId + '&view=design'); return;
    }
    if (status === 'loading') return;
    if (status !== 'authenticated') { setFailure({ key, message: 'Sign in to view your Projects.' }); return; }
    const controller = new AbortController();
    void fetch('/api/admin/designs?' + params, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load Designs.');
      if (!controller.signal.aborted) {
        setFailure(undefined);
        setResult({ key, projects: body.projects, total: body.total, offset: body.offset });
      }
    }).catch(error => { if (!controller.signal.aborted) setFailure({ key, message: error instanceof Error ? error.message : 'Unable to load Designs.' }); });
    return () => controller.abort();
  }, [projectId, params, key, status, router]);
  const changeSort = (field: string) => { setSort({ key: field, direction: sort.key === field && sort.direction === 'asc' ? 'desc' : 'asc' }); setOffset(0); };
  const reset = () => { setSearch(''); setActive('all'); setVisibility('all'); setContent('all'); setSort({ key: 'updatedAt', direction: 'desc' }); setOffset(0); };
  const filtered = !!search || active !== 'all' || visibility !== 'all' || content !== 'all';
  return <section className="flex h-full min-h-0 flex-col gap-2">
    <AdminWorkspaceHeader className="shrink-0" icon={Building2} title="Designs" description="Manage architectural content through its owning Project.">
      <DesignFieldHelp label="ThreeD Designs">Each row is a Project. Open Design edits its architectural content in the existing Scene. Use Project Save to retain changes. Counts describe saved walls, floors, roofs and openings; Updated is the Project update date.</DesignFieldHelp>
      {current && <Badge variant="secondary" className="text-xs">{current.total}</Badge>}
      <div className="relative min-w-48 flex-1">
        <Search aria-hidden="true" className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search Projects" placeholder="Search Projects…" className="h-7 pl-7 text-xs" maxLength={200} value={search} onChange={event => { setSearch(event.target.value); setOffset(0); }} />
      </div>
      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setRetry(value => value + 1)}><RefreshCw aria-hidden="true" className="mr-1 h-3.5 w-3.5" />Refresh</Button>
    </AdminWorkspaceHeader>
    <fieldset aria-label="Design filters" className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border p-2 text-xs">
      {([
        ['Project status', active, setActive, [['all', 'All statuses'], ['active', 'Active'], ['inactive', 'Inactive']]],
        ['Visibility', visibility, setVisibility, [['all', 'All visibility'], ['public', 'Public'], ['private', 'Private']]],
        ['Architectural content', content, setContent, [['all', 'All content'], ['saved', 'Has architectural objects'], ['empty', 'No architectural objects']]],
      ] as const).map(([label, value, setter, options]) => <label key={label} className="flex flex-wrap items-center gap-1">{label}<select aria-label={label} className="h-7 max-w-64 rounded border bg-background px-2" value={value} onChange={event => { setter(event.target.value); setOffset(0); }}>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>)}
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={reset}>Clear filters</Button>
    </fieldset>
    <nav aria-label="Designs pagination" className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <span aria-live="polite">{current ? current.total ? `${current.offset + 1}–${current.offset + current.projects.length} of ${current.total} Projects` : '0 Projects' : ''}</span>
      <div className="flex gap-2"><Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={!current || current.offset === 0} onClick={() => setOffset(Math.max(0, (current?.offset ?? 0) - 50))}>Previous</Button><Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={!current || current.offset + 50 >= current.total} onClick={() => setOffset((current?.offset ?? 0) + 50)}>Next</Button></div>
    </nav>
    {error ? <div role="alert" className="text-sm text-destructive"><p>{error}</p><Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setRetry(value => value + 1)}>Try again</Button></div> : <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible" aria-busy={loading}>
      <Table className="min-w-[900px] [&_td]:py-1 [&_th]:py-1 [&_th]:text-xs [&_th_button]:h-7 [&_th_button]:px-0 [&_th_button]:text-xs"><TableHeader className="sticky top-0 z-10 bg-background"><TableRow className="hover:bg-transparent">
        <TableHead aria-sort={sort.key === 'name' ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><Button variant="ghost" size="sm" onClick={() => changeSort('name')}>Project <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
        <TableHead>Saved architecture</TableHead><TableHead>Status</TableHead><TableHead>Visibility</TableHead>
        <TableHead aria-sort={sort.key === 'updatedAt' ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><Button variant="ghost" size="sm" onClick={() => changeSort('updatedAt')}>Updated <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead><TableHead className="text-right">Actions</TableHead>
      </TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={6}><p role="status" className="py-6 text-center">Loading Designs…</p></TableCell></TableRow> : current?.projects.length ? current.projects.map(project => <TableRow key={project.id}>
          <TableCell><div className="flex items-center gap-2"><Building2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-blue-500" /><Link className="font-medium hover:underline" href={`/dashboard/scene?projectId=${project.id}&view=design`}>{project.name}</Link><span className="text-xs text-muted-foreground">#{project.id}</span></div></TableCell>
          <TableCell>{project.walls + project.floors + project.roofs + project.openings ? <div className="flex flex-wrap gap-1">{[['Walls', project.walls], ['Floors', project.floors], ['Roofs', project.roofs], ['Openings', project.openings]].map(([name, count]) => <Badge key={name} variant="secondary" className="text-[10px]">{count} {name}</Badge>)}</div> : <span className="text-xs text-muted-foreground">Ready to start designing</span>}</TableCell>
          <TableCell><Badge variant="outline" className="text-[10px]">{project.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
          <TableCell><Badge variant="outline" className="text-[10px]">{project.isPublic ? 'Public' : 'Private'}</Badge></TableCell>
          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '—'}</TableCell>
          <TableCell><div className="flex items-center justify-end gap-1"><Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400"><Link href={`/dashboard/scene?projectId=${project.id}&view=design`}><PencilRuler aria-hidden="true" className="mr-1 h-3.5 w-3.5" />Open Design</Link></Button><Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400"><Link href={`/admin/projects/${project.id}`}><SquarePen aria-hidden="true" className="mr-1 h-3.5 w-3.5" />Edit Project</Link></Button></div></TableCell>
        </TableRow>) : <TableRow><TableCell colSpan={6} className="py-8 text-center">{filtered ? 'No Projects match these filters.' : 'No Projects yet. Create a Project to begin designing.'}{!filtered && <Link className="ml-2 underline" href="/admin/projects/new">Create a New Project</Link>}</TableCell></TableRow>}
      </TableBody></Table>
    </div>}

  </section>;
}
