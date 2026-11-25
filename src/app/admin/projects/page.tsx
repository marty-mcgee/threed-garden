'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowDown, ArrowUp, Box, Folder, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { useAdminListQueryState } from '@/components/admin/shared/use-admin-list-query-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DuplicateSavedObject } from '@/components/admin/threed/DuplicateSavedObject';

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean | null;
  isActive: boolean | null;
  threed: number;
  traffic: number;
  multimedia: number;
}

const root = '/admin/projects';
const pageSize = 25;

function ProjectInventory({ owner }: { owner: string }) {
  const [data, setData] = useState<ProjectRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useAdminListQueryState(root, 'search', '');
  const [active, setActive] = useAdminListQueryState(root, 'active', 'all', { values: ['all', 'active', 'inactive'] });
  const [visibility, setVisibility] = useAdminListQueryState(root, 'visibility', 'all', { values: ['all', 'public', 'private'] });
  const [sort, setSort] = useAdminListQueryState(root, 'sort', { key: 'id', direction: 'desc' }, { values: ['id', 'name'] });
  const [page, setPage] = useAdminListQueryState(root, 'page', 0);
  useEffect(() => {
    const request = new AbortController();
    setBusy(true);
    setError('');
    async function load() {
      try {
        const res = await fetch('/api/admin/projects', { cache: 'no-store', signal: request.signal });
        if (!res.ok) throw Error('Could not load Projects. Use Refresh to retry.');
        const payload = await res.json();
        if (!request.signal.aborted) setData(payload.rows);
      } catch (e) {
        if (!request.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load Projects.');
      } finally {
        if (!request.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => request.abort();
  }, [owner, revision]);

  const needle = search.trim().toLowerCase();
  const matches = data.filter(row =>
    (active === 'all' || Boolean(row.isActive) === (active === 'active')) &&
    (visibility === 'all' || Boolean(row.isPublic) === (visibility === 'public')) &&
    (!needle || [row.name, row.description ?? '', String(row.id)].some(value => value.toLowerCase().includes(needle)))
  ).sort((a, b) => (sort.direction === 'asc' ? 1 : -1) * ((sort.key === 'name' ? a.name.localeCompare(b.name) : 0) || a.id - b.id));
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = matches.slice(current * pageSize, (current + 1) * pageSize);
  const refresh = () => setRevision(value => value + 1);
  async function remove(row: ProjectRow) {
    if (deleting !== null || !window.confirm(`Delete Project “${row.name}” (#${row.id}) and its Project-owned content?`)) return;
    setDeleting(row.id);
    setNotice('');
    try {
      const res = await fetch(`/api/project?id=${row.id}`, { method: 'DELETE' });
      if (!res.ok) throw Error((await res.json()).error || 'Could not delete Project.');
      setData(rows => rows.filter(item => item.id !== row.id));
      setNotice(`Deleted Project “${row.name}”.`);
      refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not confirm deletion. Refresh before retrying.');
    } finally {
      setDeleting(null);
    }
  }
  function heading(key: string, label: string) {
    const selected = key === sort.key;
    const Arrow = sort.direction === 'asc' ? ArrowUp : ArrowDown;
    return <TableHead aria-sort={selected ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
      <button className="inline-flex items-center gap-1" onClick={() => { setPage(0); setSort({ key, direction: selected && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{label}{selected && <Arrow className="size-3" />}</button>
    </TableHead>;
  }
  return <div className="space-y-3">
    <AdminWorkspaceHeader title="Projects" description="Manage Projects and their assigned Modules" icon={Folder} iconColor="blue" showModuleAlbums={false}>
      <Button asChild variant="success" size="sm" className="ml-auto h-7 text-xs"><Link href={root + '/new'}><Plus className="size-3.5" />Add Project</Link></Button>
    </AdminWorkspaceHeader>
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Input aria-label="Search Projects" placeholder="Search name, description or ID" maxLength={200} className="h-8 w-56 text-xs" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
      <select aria-label="Project activity" className="h-8 rounded-md border bg-background px-2" value={active} onChange={e => { setActive(e.target.value); setPage(0); }}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      <select aria-label="Project visibility" className="h-8 rounded-md border bg-background px-2" value={visibility} onChange={e => { setVisibility(e.target.value); setPage(0); }}><option value="all">All visibility</option><option value="public">Public</option><option value="private">Private</option></select>
      <Button size="sm" variant="ghost" disabled={!search && active === 'all' && visibility === 'all'} onClick={() => { setSearch(''); setActive('all'); setVisibility('all'); setPage(0); }}>Reset filters</Button>
      <Button size="sm" variant="outline" className="ml-auto h-8" disabled={busy} onClick={refresh}><RefreshCw className="size-3.5" />Refresh</Button>
    </div>
    {notice && <p role="status" className="text-xs">{notice}</p>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : busy ? <p role="status">Loading Projects…</p> : <>
      <p className="text-xs text-muted-foreground">{data.length} Projects · {data.filter(p => p.isActive).length} active · {data.filter(p => p.isPublic).length} public · {data.reduce((n,p) => n+p.threed+p.multimedia+p.traffic,0)} active Module assignments</p>
      <div className="overflow-x-auto rounded-md border"><Table className="text-xs"><TableHeader><TableRow>
        {heading('id', 'ID')}{heading('name', 'Project')}<TableHead>Status</TableHead><TableHead>Visibility</TableHead><TableHead>ThreeD</TableHead><TableHead>Multimedia</TableHead><TableHead>Traffic</TableHead><TableHead className="text-right">Actions</TableHead>
      </TableRow></TableHeader><TableBody>{visible.map(row => <TableRow key={row.id}>
        <TableCell>#{row.id}</TableCell><TableCell><Link className="font-medium hover:underline" href={root + '/' + row.id}>{row.name}</Link>{row.description && <p className="max-w-xs truncate text-muted-foreground" title={row.description}>{row.description}</p>}</TableCell>
        <TableCell><Badge variant={row.isActive ? 'outline' : 'secondary'}>{row.isActive ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell>{row.isPublic ? 'Public' : 'Private'}</TableCell>
        <TableCell>{row.threed}</TableCell><TableCell>{row.multimedia}</TableCell><TableCell>{row.traffic}</TableCell>
        <TableCell><div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8" asChild><Link href={root + '/' + row.id} title="Edit Project" aria-label={`Edit ${row.name}`}><Pencil className="size-4" /></Link></Button>
          <DuplicateSavedObject compact kind="project" sourceId={row.id} onCopied={refresh} disabled={deleting !== null} />
          <Button variant="ghost" size="icon" className="size-8" asChild><Link href={`/dashboard/scene?projectId=${row.id}`} title="Open Scene" aria-label={`Open Scene for ${row.name}`}><Box className="size-4" /></Link></Button>
          <Button variant="ghost" size="icon" className="size-8 text-destructive" title="Delete Project" aria-label={`Delete ${row.name}`} disabled={deleting !== null} onClick={() => void remove(row)}><Trash2 className="size-4" /></Button>
        </div></TableCell>
      </TableRow>)}{!visible.length && <TableRow><TableCell colSpan={8}>{data.length ? 'No Projects match these filters.' : 'No Projects yet. Choose Add Project to create one.'}</TableCell></TableRow>}</TableBody></Table></div>
      <div className="flex items-center justify-end gap-2 text-xs"><span>{matches.length} matching · Page {current + 1} of {pages}</span><Button size="sm" variant="outline" disabled={!current} onClick={() => setPage(current-1)}>Previous</Button><Button size="sm" variant="outline" disabled={current+1 >= pages} onClick={() => setPage(current+1)}>Next</Button></div>
    </>}
  </div>;
}

export default function AdminProjectsPage() {
  const { data, status } = useSession();
  const router = useRouter();
  useEffect(() => { if (status === 'unauthenticated') router.replace('/auth/sign-in'); }, [status, router]);
  if (status !== 'authenticated' || !data?.user?.id) return <p role="status">Opening Projects…</p>;
  return <ProjectInventory key={data.user.id} owner={data.user.id} />;
}
