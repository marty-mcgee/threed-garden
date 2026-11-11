'use client';

import { useEffect, useState } from 'react';
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

export function TerrainsList() {
  const [rows, setRows] = useState<TerrainRow[]>([]);
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch('/api/threed/terrains', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.error || 'Could not load Terrains.');
        if (!controller.signal.aborted) setRows(result.data);
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load Terrains.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  const visible = rows.filter(row => row.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 text-xs">
    <AdminWorkspaceHeader icon={Mountain} title="Terrains" description="Reusable ThreeD Terrain definitions" showModuleAlbums={false} className="shrink-0">
      <span className="rounded bg-muted px-2">{rows.length}</span>
      <Input aria-label="Search Terrains" placeholder="Search by name…" className="h-7 min-w-32 flex-1 text-xs" value={search} onChange={event => setSearch(event.target.value)} />
      <Button variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => setRefresh(value => value + 1)}><RefreshCw className="size-3.5" />Refresh</Button>
      <Button asChild variant="success" className="h-7 gap-1 px-2 text-xs"><Link href={`${root}/new`}><Plus className="size-3.5" />Add Terrain</Link></Button>
    </AdminWorkspaceHeader>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <p role="status">{loading ? 'Loading Terrains…' : `${visible.length} of ${rows.length} saved Terrains`}</p>
    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Revision</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {visible.map(row => <TableRow key={row.id}>
            <TableCell><Link className="font-medium hover:underline" href={`${root}/${row.id}`}>{row.name}</Link></TableCell>
            <TableCell>{row.revision}</TableCell>
            <TableCell>{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</TableCell>
            <TableCell className="text-right"><Button asChild variant="ghost" className="h-7 gap-1 px-2 text-xs"><Link href={`${root}/${row.id}`}><Pencil className="size-3.5" />Edit</Link></Button></TableCell>
          </TableRow>)}
          {!loading && !visible.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{search ? 'No matching Terrains.' : 'No Terrains yet. Add one to begin.'}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  </div>;
}
