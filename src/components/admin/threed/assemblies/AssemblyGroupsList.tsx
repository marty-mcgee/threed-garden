'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Boxes, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Row = {
  id: string;
  name: string;
  revision: number;
  updatedAt: string;
};
const root = '/admin/threed/assembly-groups';
const actionClass = 'h-7 gap-1 px-2 text-xs';

export function AssemblyGroupsList() {
  const { data: session } = useSession();
  const owner = session?.user?.id ?? '';
  const identity = useRef(owner);
  identity.current = owner;
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; items: Row[]; total: number } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const deleting = useRef(false);
  const key = `${owner}:${search}:${offset}:${limit}:${refresh}`;
  useEffect(() => {
    setError('');
    if (!owner) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ search, offset: String(offset), limit: String(limit) });
      void fetch(`/api/threed/assembly-groups?${params}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.data?.items)) throw Error(body.error || 'Could not load Assembly Groups.');
        if (!controller.signal.aborted) {
          if (offset > 0 && offset >= body.data.total) { setOffset(Math.max(0, Math.ceil(body.data.total / limit) - 1) * limit); return; }
          setResult({ key, items: body.data.items, total: body.data.total });
        }
      }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load Assembly Groups.'); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, owner, search, offset, limit]);
  const current = result?.key === key ? result : null;
  async function remove(row: Row) {
    if (deleting.current || !window.confirm(`Delete “${row.name}” and all its saved revisions? Source Models will be retained.`)) return;
    deleting.current = true; setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ id: row.id, revision: String(row.revision) });
      const response = await fetch(`/api/threed/assembly-groups?${params}`, { method: 'DELETE' });
      const body = await response.json();
      if (identity.current !== owner) return;
      if (!response.ok || !body.success || body.data?.id !== row.id) throw Error(body.error || 'Could not delete Assembly.');
      setRefresh(value => value + 1);
    } catch (cause) {
      if (identity.current === owner) setError(cause instanceof Error ? cause.message : 'Could not delete Assembly.');
    } finally { deleting.current = false; setBusy(false); }
  }
  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 text-xs">
    <AdminWorkspaceHeader moduleKey="assemblyGroups" icon={Boxes} title="Assembly Groups" description="Saved Model compositions" showModuleAlbums={false} className="shrink-0">
      <span className="rounded bg-muted px-2">{current?.total ?? '—'}</span>
      <Input aria-label="Search Assembly Groups" placeholder="Search by name…" maxLength={120} className="h-7 min-w-32 flex-1 text-xs" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setOffset(0); }} />
      <Button variant="outline" className={actionClass} disabled={busy} onClick={() => setRefresh(value => value + 1)}><RefreshCw className="size-3.5" />Refresh</Button>
      <Button asChild variant="success" className={actionClass}><Link href={`${root}/new`}><Plus className="size-3.5" />New Assembly</Link></Button>
    </AdminWorkspaceHeader>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <p role="status">{!current ? error ? 'Assembly Groups unavailable' : 'Loading Assembly Groups…' : `${current.total ? offset + 1 : 0}–${offset + current.items.length} of ${current.total} Assembly Groups`}</p>
      <div className="flex items-center gap-1">
        <label>Per page <select aria-label="Assembly Groups per page" className="rounded border bg-background p-1" value={limit} disabled={busy} onChange={event => { setLimit(Number(event.target.value)); setOffset(0); }}>{[25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
        <Button variant="outline" className={actionClass} disabled={busy || !offset || !current} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
        <Button variant="outline" className={actionClass} disabled={busy || !current || offset + limit >= current.total} onClick={() => setOffset(offset + limit)}>Next</Button>
      </div>
    </div>
    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Revision</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {current?.items.map(row => <TableRow key={row.id}>
            <TableCell><Link className="font-medium hover:underline" href={`${root}/${row.id}`}>{row.name}</Link></TableCell>
            <TableCell>{row.revision}</TableCell>
            <TableCell>{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</TableCell>
            <TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" className={actionClass}><Link href={`${root}/${row.id}`} aria-label={`Edit ${row.name}`}><Pencil className="size-3.5" />Edit</Link></Button><Button variant="ghost" className={actionClass} disabled={busy} aria-label={`Delete ${row.name}`} onClick={() => void remove(row)}><Trash2 className="size-3.5" />Delete</Button></div></TableCell>
          </TableRow>)}
          {current && !current.items.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{search ? 'No matching Assembly Groups.' : 'No Assembly Groups yet. Add one to begin.'}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  </div>;
}
