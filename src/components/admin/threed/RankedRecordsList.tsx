'use client';

import { DuplicateSavedObject } from '@/components/admin/threed/DuplicateSavedObject';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Boxes, Edit, GripVertical, MoreHorizontal, Mountain, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isSortOrder, SORT_ORDER_LIMIT, sortOrderError } from '@/libraries/services/threed/list-sort-order';

type Row = {
  id: RecordId;
  name: string;
  revision: number;
  sortOrder: number | null;
  updatedAt: string;
  isActive: boolean | null;
};
type RecordId = number | string;

const workspaces = {
  assemblyGroups: {
    root: '/admin/threed/assembly-groups',
    endpoint: '/api/threed/assembly-groups',
    singular: 'Assembly Group',
    plural: 'Assembly Groups',
    description: 'Saved Model compositions',
    icon: Boxes,
    add: 'New Assembly',
    deleteWarning: 'Source Models will be retained.',
  },
  terrains: {
    root: '/admin/threed/terrains',
    endpoint: '/api/threed/terrains',
    singular: 'Terrain',
    plural: 'Terrains',
    description: 'Reusable ThreeD Terrain definitions',
    icon: Mountain,
    add: 'Add Terrain',
    deleteWarning: 'This cannot be undone.',
  },
} as const;
const controlClass = 'h-7 text-xs';
const columns = [
  ['name', 'Name'],
  ['sortOrder', 'Sort Order'],
  ['revision', 'Revision'],
  ['updatedAt', 'Updated'],
  ['isActive', 'Active'],
] as const;
type ListChange = { action: 'set'; ids: RecordId[]; sortOrder?: number; isActive?: boolean } |
  { action: 'move'; sourceId: RecordId; targetId: RecordId; after: boolean };
type ListEdit = {
  owner: string;
  ids: RecordId[];
  mode: 'bulk' | 'rank' | 'activity';
  rank: string;
  changeRank: boolean;
  activity: '' | 'active' | 'inactive';
};

export function RankedRecordsList({ workspace }: { workspace: keyof typeof workspaces }) {
  const { root, endpoint, singular, plural, description, icon: Icon, add, deleteWarning } = workspaces[workspace];
  const { data: session } = useSession();
  const owner = session?.user?.id ?? '';
  const identity = useRef(owner);
  identity.current = owner;
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [sort, setSort] = useState<{ field: typeof columns[number][0]; direction: 'asc' | 'desc' }>({ field: 'sortOrder', direction: 'asc' });
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; refresh: number; items: Row[]; total: number } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<RecordId>>(new Set());
  const [dragging, setDragging] = useState<RecordId | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: RecordId; after: boolean } | null>(null);
  const [edit, setEdit] = useState<ListEdit | null>(null);
  const listEdit = edit?.owner === owner ? edit : null;
  const mutationLock = useRef(false);
  const key = JSON.stringify([workspace, owner, search, offset, limit, sort.field, sort.direction]);
  useEffect(() => {
    setError('');
    setSelected(new Set());
    setDragging(null);
    setDropTarget(null);
    if (!owner) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ search, offset: String(offset), limit: String(limit) });
      if (workspace === 'terrains') {
        params.set('paged', '1');
        params.set('sortBy', sort.field);
        params.set('sortDir', sort.direction);
      } else {
        params.set('sort', sort.field);
        params.set('direction', sort.direction);
      }
      void fetch(`${endpoint}?${params}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.data?.items)) throw Error(body.error || `Could not load ${plural}.`);
        if (!controller.signal.aborted) {
          if (offset > 0 && offset >= body.data.total) { setOffset(Math.max(0, Math.ceil(body.data.total / limit) - 1) * limit); return; }
          setResult({ key, refresh, items: body.data.items, total: body.data.total });
        }
      }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : `Could not load ${plural}.`); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, owner, search, offset, limit, sort.field, sort.direction, refresh, workspace, endpoint, plural]);
  const current = result?.key === key ? result : null;
  const items = current?.items ?? [];
  const selectedRows = items.filter(row => selected.has(row.id));
  const rankReady = items.length > 0 && items.every(row => typeof row.sortOrder === 'number');
  const activityReady = items.length > 0 && items.every(row => typeof row.isActive === 'boolean');
  const refreshing = current !== null && current.refresh !== refresh;
  const canReorder = rankReady && items.length > 1 && !refreshing && !busy && !listEdit && !search.trim() && sort.field === 'sortOrder' && sort.direction === 'asc';

  function changeSort(field: typeof columns[number][0]) {
    setOffset(0);
    setSort(previous => ({ field, direction: previous.field === field && previous.direction === 'asc' ? 'desc' : 'asc' }));
  }

  function openEdit(rows: Row[], mode: ListEdit['mode']) {
    if (!owner || refreshing || !rows.length || mutationLock.current) return;
    const rank = rows[0].sortOrder ?? 0;
    setError('');
    setEdit({
      owner,
      ids: rows.map(row => row.id),
      mode,
      rank: rows.every(row => row.sortOrder === rank) ? String(rank) : '',
      changeRank: mode === 'rank',
      activity: '',
    });
  }

  function clearDrag() {
    setDragging(null);
    setDropTarget(null);
  }

  async function saveListChange(change: ListChange) {
    if (!owner || mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change),
        signal: AbortSignal.timeout(30000),
      });
      const body = await response.json();
      if (identity.current !== owner) return;
      if (!response.ok || !body.success || !Number.isInteger(body.data?.updated) ||
          (change.action === 'set' && body.data.updated !== change.ids.length)) {
        throw Error(body.error || `Could not confirm the ${singular} update.`);
      }
      setEdit(null);
      if (body.data.updated) setRefresh(value => value + 1);
    } catch (cause) {
      if (identity.current === owner) setError(cause instanceof Error ? cause.message : `Could not update ${plural}.`);
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  function moveRecord(sourceId: RecordId, targetId: RecordId, after: boolean) {
    clearDrag();
    if (canReorder && sourceId !== targetId) void saveListChange({ action: 'move', sourceId, targetId, after });
  }

  function saveEdit() {
    if (!listEdit) return;
    const { ids, changeRank, rank, activity } = listEdit;
    const change: ListChange = { action: 'set', ids };
    if (changeRank) {
      const sortOrder = Number(rank);
      if (!rank.trim() || !isSortOrder(sortOrder)) { setError(sortOrderError); return; }
      change.sortOrder = sortOrder;
    }
    if (activity) change.isActive = activity === 'active';
    void saveListChange(change);
  }

  async function remove(row: Row) {
    if (mutationLock.current || !window.confirm(`Delete “${row.name}”${workspace === 'terrains' ? ` (#${row.id})` : ''} and all its saved revisions? ${deleteWarning}`)) return;
    mutationLock.current = true; setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ id: String(row.id), revision: String(row.revision) });
      const response = await fetch(`${endpoint}?${params}`, { method: 'DELETE' });
      const body = await response.json();
      if (identity.current !== owner) return;
      if (!response.ok || !body.success || (workspace === 'assemblyGroups' && body.data?.id !== row.id)) throw Error(body.error || `Could not delete ${singular}.`);
      setRefresh(value => value + 1);
    } catch (cause) {
      if (identity.current === owner) setError(cause instanceof Error ? cause.message : `Could not delete ${singular}.`);
    } finally { mutationLock.current = false; setBusy(false); }
  }
  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
    <AdminWorkspaceHeader moduleKey={workspace === 'assemblyGroups' ? workspace : undefined} iconColor="muted" icon={Icon} title={plural} description={description} showModuleAlbums={false} className="shrink-0">
      <Badge variant="secondary" className="text-xs">{current?.total ?? '—'}</Badge>
      <div className="relative min-w-0 w-full flex-auto sm:w-auto sm:min-w-48 sm:flex-1">
        <Search aria-hidden="true" className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input aria-label={`Search ${plural}`} placeholder="Search by name…" maxLength={120} className="pl-7 h-7 text-xs" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setOffset(0); }} />
      </div>
      <Button variant="outline" size="sm" className={controlClass} disabled={busy} onClick={() => setRefresh(value => value + 1)}><RefreshCw className="mr-1 size-3" />Refresh</Button>
      <Button asChild variant="success" size="sm" className="h-7 px-2 text-xs"><Link href={`${root}/new`}><Plus className="mr-1 size-3" />{add}</Link></Button>
    </AdminWorkspaceHeader>
    {error && !listEdit && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {items.length > 0 && !rankReady && <p className="text-xs text-muted-foreground">Apply the {plural} Sort Order migration to edit ranks.</p>}
    {items.length > 0 && !activityReady && <p className="text-xs text-muted-foreground">Apply the {plural} Active status migration to edit activity.</p>}
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <p role="status">{!current ? error ? `${plural} unavailable` : `Loading ${plural}…` : `${current.total ? offset + 1 : 0}–${offset + current.items.length} of ${current.total} ${plural}`}</p>
        <span aria-hidden="true">|</span><span>{selectedRows.length} selected</span>
        <Button variant="outline" size="sm" className={controlClass} disabled={busy || refreshing || !(rankReady || activityReady) || !selectedRows.length} onClick={() => openEdit(selectedRows, 'bulk')}><Edit className="mr-1 size-3" />Bulk Edit</Button>
        <Button variant="outline" size="sm" className={controlClass} disabled={busy || !selectedRows.length} onClick={() => setSelected(new Set())}>Clear selection</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label>Per page <select aria-label={`${plural} per page`} className="rounded border bg-background p-1 text-xs" value={limit} disabled={busy} onChange={event => { setLimit(Number(event.target.value)); setOffset(0); }}>{[25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
        <Button variant="outline" size="sm" className={controlClass} disabled={busy || !offset || !current} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
        <Button variant="outline" size="sm" className={controlClass} disabled={busy || !current || offset + limit >= current.total} onClick={() => setOffset(offset + limit)}>Next</Button>
      </div>
    </div>
    <div role="region" aria-label={`${singular} records`} tabIndex={0}
      className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible">
      <Table className="min-w-[700px]">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8">
              <input type="checkbox" aria-label={`Select all ${plural} on this page`} disabled={busy || !(rankReady || activityReady)}
                checked={items.length > 0 && selectedRows.length === items.length}
                onChange={event => setSelected(event.target.checked ? new Set(items.map(row => row.id)) : new Set())} />
            </TableHead>
            {columns.map(([field, label]) => (
              <TableHead key={field} className="text-xs py-1" aria-sort={sort.field === field ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
                <button type="button" className="inline-flex items-center gap-1 py-1" disabled={busy} onClick={() => changeSort(field)}>
                  {label}<span aria-hidden="true">{sort.field === field ? sort.direction === 'asc' ? '↑' : '↓' : '↕'}</span>
                </button>
              </TableHead>
            ))}
            <TableHead className="text-right text-xs py-1">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row, index) => <TableRow key={row.id}
            className={dragging === row.id ? 'opacity-50' : dropTarget?.id === row.id
              ? (dropTarget.after ? 'border-b-2 border-b-emerald-500 bg-emerald-500/10' : 'border-t-2 border-t-emerald-500 bg-emerald-500/10')
              : 'hover:bg-muted/50'}
            onDragOver={event => {
              if (!canReorder || !dragging || dragging === row.id) { setDropTarget(null); return; }
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              const rect = event.currentTarget.getBoundingClientRect();
              const after = event.clientY >= rect.top + rect.height / 2;
              setDropTarget(previous => previous?.id === row.id && previous.after === after ? previous : { id: row.id, after });
            }}
            onDrop={event => {
              if (!canReorder || !dragging || dragging === row.id) return;
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              moveRecord(dragging, row.id, event.clientY >= rect.top + rect.height / 2);
            }}>
            <TableCell>
              <input type="checkbox" aria-label={`Select ${row.name}`} disabled={busy || !(rankReady || activityReady)} checked={selected.has(row.id)}
                onChange={event => {
                  const checked = event.target.checked;
                  setSelected(previous => {
                    const next = new Set(previous);
                    if (checked) next.add(row.id);
                    else next.delete(row.id);
                    return next;
                  });
                }} />
            </TableCell>
            <TableCell className="py-1 text-sm font-medium"><div className="flex items-center gap-2">
              <span title={canReorder ? 'Drag to reorder, or use Arrow Up and Arrow Down' : 'Clear search and sort by Sort Order ascending to reorder'}>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 cursor-grab active:cursor-grabbing"
                  disabled={!canReorder && !busy && !refreshing} aria-disabled={!canReorder} draggable={canReorder} aria-label={`Reorder ${row.name}`}
                  onDragStart={event => {
                    if (!canReorder) { event.preventDefault(); return; }
                    setDragging(row.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(row.id));
                  }}
                  onDragEnd={clearDrag}
                  onKeyDown={event => {
                    if (!canReorder || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                    event.preventDefault();
                    const after = event.key === 'ArrowDown';
                    const target = items[index + (after ? 1 : -1)];
                    if (target) moveRecord(row.id, target.id, after);
                  }}><GripVertical className="size-4" /></Button>
              </span>
              <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
              <Link className="hover:underline" href={`${root}/${row.id}`}>{row.name}</Link>
              {workspace === 'terrains' && <Badge asChild variant="outline" className="text-[10px]">
                <Link href={`${root}/${row.id}`} aria-label={`Edit Terrain #${row.id}`}>#{row.id}</Link>
              </Badge>}
            </div></TableCell>
            <TableCell className="py-1 text-xs tabular-nums">
              {typeof row.sortOrder === 'number' ? <button type="button" className="hover:underline disabled:opacity-50"
                disabled={busy || refreshing} aria-label={`Edit Sort Order for ${row.name}`} onClick={() => openEdit([row], 'rank')}>{row.sortOrder}</button> : '—'}
            </TableCell>
            <TableCell className="py-1 text-xs tabular-nums">{row.revision}</TableCell>
            <TableCell className="py-1 text-xs whitespace-nowrap">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</TableCell>
            <TableCell className="py-1">
              {typeof row.isActive === 'boolean' ? <button type="button" disabled={busy || refreshing}
                aria-label={`${row.name}: ${row.isActive ? 'Active' : 'Inactive'}. Edit activity`}
                title={row.isActive ? 'Active' : 'Inactive'} className={row.isActive ? 'text-green-500' : 'text-muted-foreground'}
                onClick={() => openEdit([row], 'activity')}>{row.isActive ? '✓' : '×'}</button> : <span title="Activity unavailable">—</span>}
            </TableCell>
            <TableCell className="py-1 text-right">
              <div className="flex items-center justify-end gap-1">
                {workspace === "terrains" && typeof row.id === "number" && <DuplicateSavedObject compact kind="terrain" sourceId={row.id} disabled={busy || refreshing} onCopied={() => setRefresh(value => value + 1)} />}
                <Button asChild variant="ghost" size="sm"><Link href={`${root}/${row.id}`} aria-label={`Edit ${row.name}`}><Edit className="size-4" /></Link></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy} aria-label={`More actions for ${row.name}`}><MoreHorizontal className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-600" aria-label={`Delete ${row.name}`} onSelect={() => void remove(row)}>
                      <Trash2 className="mr-2 size-4" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>)}
          {current && !items.length && <TableRow><TableCell colSpan={columns.length + 2} className="py-4 text-center text-sm text-muted-foreground">{search ? `No matching ${plural}.` : `No ${plural} yet. Add one to begin.`}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
    {listEdit && (
      <Dialog open onOpenChange={open => { if (!open && !mutationLock.current) { setEdit(null); setError(''); } }}>
        <DialogContent showCloseButton={!busy} className="max-h-[85dvh] overflow-y-auto sm:max-w-xl"
          onEscapeKeyDown={event => { if (mutationLock.current) event.preventDefault(); }}
          onInteractOutside={event => { if (mutationLock.current) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>{listEdit.mode === 'bulk' ? `Bulk Edit · ${listEdit.ids.length} ${listEdit.ids.length === 1 ? singular : plural}` : listEdit.mode === 'rank' ? 'Edit Sort Order' : 'Edit Activity'}</DialogTitle>
            <DialogDescription>{listEdit.mode === 'bulk' ? `Choose which fields to update for the selected ${plural}.` : `Update the selected ${singular}.`}</DialogDescription>
          </DialogHeader>
          <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
            {listEdit.mode !== 'rank' && activityReady && <label className="space-y-1 text-sm">
              <span>Activity</span>
              <select className="h-9 w-full rounded-md border bg-background px-2" value={listEdit.activity}
                onChange={event => {
                  const activity = event.target.value;
                  if (activity === '' || activity === 'active' || activity === 'inactive') setEdit({ ...listEdit, activity });
                }}>
                <option value="">Keep current</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>}
            {listEdit.mode !== 'activity' && rankReady && <div className="space-y-1">
              {listEdit.mode === 'bulk' ? <Label className="flex items-center gap-2">
                <input type="checkbox" checked={listEdit.changeRank} onChange={event => setEdit({ ...listEdit, changeRank: event.target.checked })} />
                Change Sort Order
              </Label> : <Label htmlFor="record-sort-order">Sort Order</Label>}
              <Input id="record-sort-order" aria-label="Sort Order" type="number" min={-SORT_ORDER_LIMIT} max={SORT_ORDER_LIMIT} step={1}
                value={listEdit.rank} disabled={!listEdit.changeRank} onChange={event => setEdit({ ...listEdit, rank: event.target.value })} />
            </div>}
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => { setEdit(null); setError(''); }}>Cancel</Button>
            <Button variant="success" disabled={busy || (listEdit.changeRank ? !listEdit.rank.trim() : !listEdit.activity)} onClick={saveEdit}>{busy ? 'Saving…' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
  </div>;
}
