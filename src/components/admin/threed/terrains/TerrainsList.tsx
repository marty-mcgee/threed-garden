'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Mountain, Pencil, Plus, RefreshCw } from 'lucide-react';
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

export function TerrainsList() {
  const { data: session } = useSession();
  const owner = session?.user?.id ?? '';
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; items: TerrainRow[]; total: number } | null>(null);
  const [error, setError] = useState('');
  const key = `${owner}:${search}:${offset}:${limit}:${refresh}`;

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
  }, [key, owner, search, offset, limit]);

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
      <div className="flex items-center gap-1">
        <label>Per page <select aria-label="Terrains per page" className="rounded border bg-background p-1" value={limit} onChange={event => { setLimit(Number(event.target.value)); setOffset(0); }}>{[25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
        <Button variant="outline" className={actionClass} disabled={!offset || !current} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
        <Button variant="outline" className={actionClass} disabled={!current || offset + limit >= current.total} onClick={() => setOffset(offset + limit)}>Next</Button>
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
            <TableCell className="text-right"><Button asChild variant="ghost" className={actionClass}><Link href={`${root}/${row.id}`} aria-label={`Edit ${row.name}`}><Pencil className="size-3.5" />Edit</Link></Button></TableCell>
          </TableRow>)}
          {current && !current.items.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{search ? 'No matching Terrains.' : 'No Terrains yet. Add one to begin.'}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  </div>;
}
