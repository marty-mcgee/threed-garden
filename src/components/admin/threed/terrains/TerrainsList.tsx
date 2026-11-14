'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Mountain, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TerrainRow {
  id: number;
  name: string;
  revision: number;
  updatedAt: string;
}

const root = '/admin/threed/terrains';
const actionClass = 'h-7 gap-1 px-2 text-xs';
const sortColumns = [
  {
    key: 'name',
    label: 'Name',
  },
  {
    key: 'revision',
    label: 'Revision',
  },
  {
    key: 'updatedAt',
    label: 'Updated',
  },
] as const;
type SortColumn = typeof sortColumns[number]['key'];

export function TerrainsList() {
  const { data: session } = useSession();
  const owner = session?.user?.id ?? '';
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [refresh, setRefresh] = useState(0);
  const [sortBy, setSortBy] = useState<SortColumn>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [result, setResult] = useState<{ key: string; items: TerrainRow[]; total: number } | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const deleteBusy = useRef(false);
  async function deleteTerrain(row: TerrainRow) {
    if (deleteBusy.current || !window.confirm(`Delete Terrain “${row.name}” (#${row.id}) and all its revisions? This cannot be undone.`)) return;
    deleteBusy.current = true;
    setDeleting(row.id);
    setError('');
    try {
      const response = await fetch(`/api/threed/terrains?id=${row.id}&revision=${row.revision}`, { method: 'DELETE' });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Could not delete Terrain.');
      setRefresh(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete Terrain.');
    } finally {
      deleteBusy.current = false;
      setDeleting(null);
    }
  }
  const key = `${owner}:${search}:${offset}:${limit}:${refresh}:${sortBy}:${sortDir}`;

  useEffect(() => {
    setError('');
    if (!owner) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        paged: '1',
        search,
        offset: String(offset),
        limit: String(limit),
        sortBy,
        sortDir,
      });
      void fetch(`/api/threed/terrains?${params}`, { cache: 'no-store', signal: controller.signal })
        .then(async response => {
          const body = await response.json();
          if (!response.ok || !body.success || !Array.isArray(body.data?.items)) throw new Error(body.error || 'Could not load Terrains.');
          if (controller.signal.aborted) return;
          if (offset > 0 && offset >= body.data.total) {
            setOffset(Math.max(0, Math.ceil(body.data.total / limit) - 1) * limit);
            return;
          }
          setResult({ key, items: body.data.items, total: body.data.total });
        })
        .catch(cause => {
          if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load Terrains.');
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, owner, search, offset, limit, sortBy, sortDir]);

  const current = result?.key === key ? result : null;
  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 text-xs">
    <AdminWorkspaceHeader icon={Mountain} title="Terrains" description="Reusable ThreeD Terrain definitions" showModuleAlbums={false} className="shrink-0">
      <span className="rounded bg-muted px-2">{current?.total ?? '—'}</span>
      <Input aria-label="Search Terrains" placeholder="Search by name…" maxLength={120} className="h-7 min-w-32 flex-1 text-xs" value={search} onChange={event => { setSearch(event.target.value); setOffset(0); }} />
      <Button variant="outline" className={actionClass} onClick={() => setRefresh(value => value + 1)}><RefreshCw className="size-3.5" />Refresh</Button>
      <Button asChild variant="success" className={actionClass}><Link href={`${root}/new`}><Plus className="size-3.5" />Add Terrain</Link></Button>
    </AdminWorkspaceHeader>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <p role="status">{!current ? error ? 'Terrains unavailable' : 'Loading Terrains…' : `${current.total ? offset + 1 : 0}–${offset + current.items.length} of ${current.total} Terrains`}</p>
      <div className="flex flex-wrap items-center gap-1">
        <label>Per page <select aria-label="Terrains per page" className="rounded border bg-background p-1" value={limit} onChange={event => { setLimit(Number(event.target.value)); setOffset(0); }}>{[25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
        <Button variant="outline" className={actionClass} disabled={!offset || !current} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
        <Button variant="outline" className={actionClass} disabled={!current || offset + limit >= current.total} onClick={() => setOffset(offset + limit)}>Next</Button>
      </div>
    </div>
    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
      <Table className="text-xs [&_th]:h-8 [&_td:not([colspan])]:py-1">
        <TableHeader><TableRow>
          {sortColumns.map(column => {
            const active = sortBy === column.key;
            const Icon = active ? sortDir === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
            return <TableHead key={column.key} aria-sort={active ? sortDir === 'asc' ? 'ascending' : 'descending' : 'none'}>
              <button type="button" className="inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => {
                setSortBy(column.key);
                setSortDir(active && sortDir === 'asc' ? 'desc' : 'asc');
                setOffset(0);
              }}>
                {column.label}<Icon className="size-3" aria-hidden="true" />
              </button>
            </TableHead>;
          })}
          <TableHead className="text-right">Edit</TableHead>
          <TableHead className="text-right">Delete</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {current?.items.map(row => <TableRow key={row.id}>
            <TableCell><Link className="font-medium hover:underline" href={`${root}/${row.id}`}>{row.name}</Link><Link href={`${root}/${row.id}`} aria-label={`Edit Terrain #${row.id}`} className="ml-2 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-700 dark:text-cyan-300">#{row.id}</Link></TableCell>
            <TableCell>{row.revision}</TableCell>
            <TableCell>{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</TableCell>
            <TableCell className="text-right"><Button asChild variant="ghost" className={actionClass}><Link href={`${root}/${row.id}`} aria-label={`Edit ${row.name}`}><Pencil className="size-3.5" />Edit</Link></Button></TableCell>
            <TableCell className="text-right"><Button variant="ghost" className={`${actionClass} text-destructive`} disabled={deleting !== null} onClick={() => void deleteTerrain(row)} aria-label={`Delete ${row.name}`}><Trash2 className="size-3.5" />{deleting === row.id ? 'Deleting…' : 'Delete'}</Button></TableCell>
          </TableRow>)}
          {current && !current.items.length && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{search ? 'No matching Terrains.' : 'No Terrains yet. Add one to begin.'}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  </div>;
}
