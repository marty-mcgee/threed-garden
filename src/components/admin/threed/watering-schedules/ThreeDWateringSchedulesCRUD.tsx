'use client';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { useAdminListQueryState } from '@/components/admin/shared/use-admin-list-query-state';

import { useEffect, useRef, useState } from 'react';
import { Droplets, Edit, GripVertical, MoreHorizontal, Plus, RefreshCw, Search, Sprout, Trash2 } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ThreedWateringSchedule, ThreedWateringHistory } from '@/libraries/schema/threed';
import { wateringHistorySortFields, wateringScheduleSortFields } from '@/libraries/services/threed/waterings/watering-list-query';
import { WateringScheduleDialog, type WateringScheduleAction } from './WateringScheduleDialog';
import { WateringHistoryDialog, type WateringHistoryAction } from './WateringHistoryDialog';
import { WateringBulkEditDialog, type WateringBulkSelection } from './WateringBulkEditDialog';

type View = 'schedules' | 'history';
type Row = (Omit<ThreedWateringSchedule, 'sortOrder'> | Omit<ThreedWateringHistory, 'sortOrder'>) & { sortOrder?: number | null };
type ScheduleSortField = typeof wateringScheduleSortFields[number];
type HistorySortField = typeof wateringHistorySortFields[number];
type RecordAction = { view: 'schedules'; action: WateringScheduleAction } | { view: 'history'; action: WateringHistoryAction };
const route = '/admin/threed/watering-schedules';
const scheduleHeadings: ReadonlyArray<{ label: string; field?: ScheduleSortField }> = [
  { label: 'Schedule ID', field: 'scheduleId' },
  { label: 'Frequency', field: 'frequency' },
  { label: 'Next Watering', field: 'nextWatering' },
  { label: 'Last Watering', field: 'lastWatering' },
  { label: 'Duration', field: 'durationMs' },
  { label: 'Volume', field: 'volumeMl' },
  { label: 'Targets' },
  { label: 'Active', field: 'isActive' },
  { label: 'Notes' },
];
const historyHeadings: ReadonlyArray<{ label: string; field?: HistorySortField }> = [
  { label: 'History ID', field: 'historyId' },
  { label: 'Executed', field: 'executedAt' },
  { label: 'Status', field: 'status' },
  { label: 'Duration', field: 'durationMs' },
  { label: 'Volume', field: 'volumeMl' },
  { label: 'Targets' },
  { label: 'Schedule', field: 'scheduleId' },
  { label: 'Executed By', field: 'executedBy' },
  { label: 'Reason' },
];
const dateLabel = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};
const measurement = (value: number | null, unit: string) => value === null ? '—' : `${value} ${unit}`;

export function ThreeDWateringSchedulesCRUD({ threedId, scrollRecords = false, manageSchedules = false }: { threedId?: number; onModuleUpdate?: () => void; scrollRecords?: boolean; manageSchedules?: boolean }) {
  const standalone = manageSchedules && threedId === undefined;
  const [view, setView] = useAdminListQueryState<View>(route, 'view', 'schedules', { enabled: scrollRecords, values: ['schedules', 'history'] });
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useAdminListQueryState(route, 'page', 0, { enabled: scrollRecords });
  const [pageSize, setPageSize] = useAdminListQueryState(route, 'limit', 25, { enabled: scrollRecords });
  const [search, setSearch] = useAdminListQueryState(route, 'search', '', { enabled: scrollRecords });
  const [scheduleSort, setScheduleSort] = useAdminListQueryState<{ field: ScheduleSortField; direction: 'asc' | 'desc' }>(
    route, 'sort', standalone ? { field: 'sortOrder', direction: 'asc' } : { field: 'nextWatering', direction: 'desc' },
    { enabled: scrollRecords, values: wateringScheduleSortFields },
  );
  const [historySort, setHistorySort] = useAdminListQueryState<HistorySortField>(route, 'historySort', standalone ? 'sortOrder' : 'executedAt', { enabled: scrollRecords, values: wateringHistorySortFields });
  const [historyDirection, setHistoryDirection] = useAdminListQueryState<'asc' | 'desc'>(route, 'historyDirection', standalone ? 'asc' : 'desc', { enabled: scrollRecords, values: ['asc', 'desc'] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [action, setAction] = useState<RecordAction | null>(null);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState<{ view: View; selection: WateringBulkSelection; rank?: number } | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: number; after: boolean } | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState('');
  const dragSource = useRef<number | null>(null);
  const movingRef = useRef(false);
  const focusAfterMove = useRef<number | null>(null);
  const currentView = useRef(view);
  currentView.current = view;
  const { field: sortField, direction: sortDirection } = view === 'schedules' ? scheduleSort : { field: historySort, direction: historyDirection };
  const ranksReady = rows.length > 0 && rows.every(row => typeof row.sortOrder === 'number');
  const reorderMode = sortField === 'sortOrder' && sortDirection === 'asc' && !search.trim();
  const canReorder = standalone && ranksReady && rows.length > 1 && reorderMode && !loading && !moving && !bulk && !action;
  const reorderHelp = !ranksReady ? 'Sort Order is unavailable' : rows.length < 2 ? 'At least two records are needed to reorder'
    : reorderMode ? 'Drag or use Arrow Up and Arrow Down' : 'Use Reorder to return to Sort Order';
  const selectedRows = rows.filter(row => selected.has(row.id));
  const reset = () => { setPage(0); setRows([]); setLoading(true); };
  const openReorder = () => {
    reset();
    setSearch('');
    setMoveError('');
    if (view === 'schedules') setScheduleSort({ field: 'sortOrder', direction: 'asc' });
    else { setHistorySort('sortOrder'); setHistoryDirection('asc'); }
  };
  const openRow = (mode: 'edit' | 'delete', row: Row) => {
    setNotice('');
    setAction('frequency' in row ? { view: 'schedules', action: { mode, schedule: { ...row, sortOrder: row.sortOrder ?? 0 } } }
      : { view: 'history', action: { mode, entry: { ...row, sortOrder: row.sortOrder ?? 0 } } });
  };
  const openBulk = (items: Row[], rank?: number) => {
    setNotice('');
    setBulk({ view, selection: items.map(row => ({ id: row.id, expectedUpdatedAt: new Date(row.updatedAt).toISOString() })), rank });
  };
  const clearDrag = () => { dragSource.current = null; setDragging(null); setDropTarget(null); };
  async function moveRow(sourceId: number, targetId: number, after: boolean, keyboard = false) {
    clearDrag();
    if (!canReorder || movingRef.current || sourceId === targetId) return;
    movingRef.current = true;
    setMoving(true);
    setMoveError('');
    setNotice('');
    try {
      const response = await fetch(`/api/threed/waterings/manage?view=${view}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ action: 'move', sourceId, targetId, after }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !Number.isInteger(result.data?.updated)) throw new Error(result.error || 'Could not confirm the new order.');
      if (currentView.current !== view || !result.data.updated) return;
      if (keyboard) focusAfterMove.current = sourceId;
      setNotice('Sort Order saved.');
      setLoading(true);
      setRevision(value => value + 1);
    } catch (failure) {
      if (currentView.current === view) setMoveError(failure instanceof Error ? failure.message : 'Could not save Sort Order.');
    } finally {
      movingRef.current = false;
      setMoving(false);
    }
  }
  const close = () => setAction(null);
  const refreshAfterSave = () => {
    if (!action) return;
    const name = action.view === 'schedules' ? 'Watering Schedule' : 'Watering History entry';
    const verb = action.action.mode === 'create' ? 'added' : action.action.mode === 'delete' ? 'deleted' : 'saved';
    setNotice(`${name} ${verb}.`);
    close();
    setLoading(true);
    setRevision(value => value + 1);
  };
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected(new Set()); clearDrag();
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search });
    if (threedId !== undefined) params.set('moduleId', String(threedId));
    params.set('sortBy', sortField);
    params.set('sortDir', sortDirection);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/watering-${view}?${params}`, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load Waterings');
        if (controller.signal.aborted) return;
        setRows(result.data); setTotal(Number(result.pagination.total));
        if (page > 0 && page * pageSize >= result.pagination.total) setPage(() => Math.max(0, Math.ceil(result.pagination.total / pageSize) - 1), {replace: true});
      } catch (failure) {
        if (!controller.signal.aborted) { setError(failure instanceof Error ? failure.message : 'Unable to load Waterings'); setRows([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [view, page, pageSize, search, threedId, revision, sortField, sortDirection]);
  const baseHeadings = view === 'schedules' ? scheduleHeadings : historyHeadings;
  const headings = standalone ? [...baseHeadings.slice(0, 1), { label: 'Sort Order', field: 'sortOrder' as const }, ...baseHeadings.slice(1)] : baseHeadings;
  const columnCount = headings.length + (standalone ? 3 : 0);
  const targets = (row: Row) => [row.plantingId ? `Planting #${row.plantingId}` : '', row.plantId ? `Plant #${row.plantId}` : '', row.farmbotId ? `FarmBot #${row.farmbotId}` : '', 'bedId' in row && row.bedId ? `Bed #${row.bedId}` : ''].filter(Boolean).join(' · ') || '—';
  return <div className={scrollRecords ? 'flex h-full min-h-0 flex-col gap-2' : 'space-y-2'}>
    <AdminWorkspaceHeader iconColor="blue" icon={Droplets} title="Waterings" description="Browse watering schedules and recorded watering history" showModuleAlbums={!standalone} className="shrink-0">
      <Badge variant="secondary" className="text-xs">{loading || error ? '—' : total}</Badge>
      <div className="relative min-w-0 w-full flex-auto sm:w-auto sm:min-w-48 sm:flex-1">
        <Search aria-hidden="true" className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input aria-label={`Search watering ${view}`} placeholder={view === 'schedules' ? 'Search Schedule ID or notes…' : 'Search History ID, status or reason…'} maxLength={200} value={search} onChange={event => { reset(); setSearch(event.target.value); }} className="pl-7 h-7 text-xs" />
      </div>
      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw className="mr-1 size-3" />Refresh</Button>
      {standalone ? <Button variant="success" size="sm" className="h-7 px-2 text-xs" onClick={() => { setNotice(''); setAction({ view, action: { mode: 'create' } }); }}>
        <Plus className="mr-1 size-3" />{view === 'schedules' ? 'Add Watering Schedule' : 'Add Watering History'}
      </Button> : <AdminWorkspaceLink href="/admin/threed/plantings" icon={Sprout}>Plantings</AdminWorkspaceLink>}
    </AdminWorkspaceHeader>
    <Tabs value={view} onValueChange={value => { reset(); setAction(null); setBulk(null); setMoveError(''); setNotice(''); setSearch(''); setView(value as View); }} className="shrink-0">
      <div className="flex items-center gap-1">
        <TabsList aria-label="Watering views" className="group-data-[orientation=horizontal]/tabs:h-8">
          <TabsTrigger value="schedules" className="px-3 text-xs">Schedules</TabsTrigger>
          <TabsTrigger value="history" className="px-3 text-xs">History</TabsTrigger>
        </TabsList>
        {view === 'history' && <ModelFieldHelp label="Watering History">
          Recorded watering outcomes. Missing duration or volume means it was not recorded.
        </ModelFieldHelp>}
      </div>
    </Tabs>
    {view === 'history' && threedId !== undefined && <p className="shrink-0 text-xs text-muted-foreground">This view follows currently linked Plantings and Schedules, not historical Project membership.</p>}
    {notice && <p role="status" className="shrink-0 text-xs text-muted-foreground">{notice}</p>}
    {moveError && <p role="alert" className="shrink-0 text-xs text-destructive">{moveError}</p>}
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span>{loading ? 'Loading…' : error ? 'Records unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} ${view}`}</span>
        {standalone && <>
          <span aria-hidden="true">|</span><span>{selectedRows.length} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading || moving || !selectedRows.length} onClick={() => openBulk(selectedRows)}><Edit className="mr-1 size-3" />Bulk Edit</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!selectedRows.length} onClick={() => setSelected(new Set())}>Clear selection</Button>
          {!reorderMode && <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading || moving} onClick={openReorder}>
            <GripVertical className="size-3" />Reorder
          </Button>}
        </>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label>Per page <select aria-label="Waterings per page" value={pageSize} disabled={loading} className="rounded border bg-background p-1 text-xs" onChange={event => { reset(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size}>{size}</option>)}</select></label>
        {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} variant="outline" size="sm" className="h-7 text-xs" disabled={loading || !!error || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
      </div>
    </div>
    <div role="region" aria-label={`Watering ${view} records`} tabIndex={0} className={scrollRecords ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible' : 'overflow-auto rounded-lg border'}>
      <Table className="min-w-[1100px]">
        <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}>
          <TableRow className="hover:bg-transparent">
            {standalone && <TableHead className="w-8"><input type="checkbox" aria-label="Select all records on this page" disabled={loading || moving || !rows.length}
              checked={rows.length > 0 && selectedRows.length === rows.length} onChange={event => setSelected(event.target.checked ? new Set(rows.map(row => row.id)) : new Set())} /></TableHead>}
            {headings.map(({ label, field }) => {
              const sorted = field === sortField;
              return <TableHead key={label} className="py-1 text-xs" aria-sort={field ? sorted ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>
                {field ? <button type="button" className="inline-flex items-center gap-1 py-1" onClick={() => {
                  reset();
                  const direction = sorted && sortDirection === 'asc' ? 'desc' : 'asc';
                  if (view === 'schedules') {
                    const scheduleField = wateringScheduleSortFields.find(value => value === field);
                    if (scheduleField) setScheduleSort({ field: scheduleField, direction });
                  } else {
                    const historyField = wateringHistorySortFields.find(value => value === field);
                    if (historyField) { setHistorySort(historyField); setHistoryDirection(direction); }
                  }
                }}>{label}<span aria-hidden="true">{sorted ? sortDirection === 'asc' ? '↑' : '↓' : '↕'}</span></button> : label}
              </TableHead>;
            })}
            {standalone && <><TableHead className="w-10 text-right text-xs">Edit</TableHead><TableHead className="w-10 text-right"><span className="sr-only">More actions</span></TableHead></>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={columnCount} className="text-xs text-muted-foreground"><span role="status">Loading {view}…</span></TableCell></TableRow> : error ? <TableRow><TableCell colSpan={columnCount} className="text-xs"><span role="alert" className="text-destructive">{error}</span><Button variant="outline" size="sm" className="ml-2 h-7 text-xs" onClick={() => setRevision(value => value + 1)}>Retry</Button></TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={columnCount} className="py-4 text-center text-sm text-muted-foreground">No watering {view} found{search ? ' for this search' : ''}.</TableCell></TableRow> : rows.map((row, index) => {
            const name = 'frequency' in row ? row.scheduleId : row.historyId;
            const cells = 'frequency' in row
              ? [row.scheduleId, row.frequency, dateLabel(row.nextWatering), dateLabel(row.lastWatering), measurement(row.durationMs, 'ms'), measurement(row.volumeMl, 'mL'), targets(row), <span aria-label={row.isActive ? 'Active' : 'Inactive'} title={row.isActive ? 'Active' : 'Inactive'} className={row.isActive ? 'text-green-500' : 'text-muted-foreground'}>{row.isActive ? '✓' : '×'}</span>, row.notes || '—']
              : [row.historyId, dateLabel(row.executedAt), <span className={row.status === 'success' ? 'text-green-500' : row.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}>{row.status}</span>, measurement(row.durationMs, 'ms'), measurement(row.volumeMl, 'mL'), targets(row), row.scheduleId ? `#${row.scheduleId}` : '—', row.executedBy || '—', [row.skipReason, row.errorMessage].filter(Boolean).join(' · ') || '—'];
            return <TableRow key={`${view}-${row.id}`} className={dragging === row.id ? 'opacity-50' : dropTarget?.id === row.id
              ? (dropTarget.after ? 'border-b-2 border-b-emerald-500 bg-emerald-500/10' : 'border-t-2 border-t-emerald-500 bg-emerald-500/10') : 'hover:bg-muted/50'}
              onDragOver={event => {
                if (!canReorder || dragSource.current === null || dragSource.current === row.id) { setDropTarget(null); return; }
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                const rect = event.currentTarget.getBoundingClientRect();
                const after = event.clientY >= rect.top + rect.height / 2;
                setDropTarget(previous => previous?.id === row.id && previous.after === after ? previous : { id: row.id, after });
              }} onDrop={event => {
                const sourceId = dragSource.current;
                if (!canReorder || sourceId === null || sourceId === row.id) return;
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                void moveRow(sourceId, row.id, event.clientY >= rect.top + rect.height / 2);
              }}>
              {standalone && <TableCell><input type="checkbox" aria-label={`Select ${name}`} disabled={moving} checked={selected.has(row.id)} onChange={event => {
                const checked = event.target.checked;
                setSelected(previous => {
                  const next = new Set(previous);
                  if (checked) next.add(row.id); else next.delete(row.id);
                  return next;
                });
              }} /></TableCell>}
              <TableCell className="py-1 text-sm font-medium"><div className="flex items-center gap-2">
                {standalone && <span title={reorderHelp}>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 cursor-grab" aria-label={`Reorder ${name}`} draggable={canReorder}
                    disabled={!canReorder && !moving} aria-disabled={!canReorder} ref={button => {
                      if (button && focusAfterMove.current === row.id) { focusAfterMove.current = null; button.focus(); }
                    }} onDragStart={event => {
                      if (!canReorder) { event.preventDefault(); return; }
                      dragSource.current = row.id;
                      setDragging(row.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', String(row.id));
                    }} onDragEnd={clearDrag} onKeyDown={event => {
                      if (!canReorder || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                      event.preventDefault();
                      const after = event.key === 'ArrowDown';
                      const target = rows[index + (after ? 1 : -1)];
                      if (target) void moveRow(row.id, target.id, after, true);
                    }}><GripVertical className="size-4" /></Button>
                </span>}
                <ModuleIcon moduleKey="waterings" className="size-3.5 shrink-0 text-muted-foreground" inheritColor />{name}
              </div></TableCell>
              {standalone && <TableCell className="py-1 text-xs tabular-nums">{typeof row.sortOrder === 'number'
                ? <button type="button" className="hover:underline" disabled={moving} aria-label={`Edit Sort Order for ${name}`} onClick={() => openBulk([row], row.sortOrder ?? 0)}>{row.sortOrder}</button>
                : <span title="Apply the Waterings Sort Order migration">—</span>}</TableCell>}
              {cells.slice(1).map((cell, index) => <TableCell key={baseHeadings[index + 1].label} className="py-1 text-xs">{cell}</TableCell>)}
              {standalone && <>
                <TableCell className="py-1 text-right">
                  <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${name}`} onClick={() => openRow('edit', row)}>
                    <Edit className="size-4" />
                  </Button>
                </TableCell>
                <TableCell className="py-1 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={`More actions for ${name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-red-600" onSelect={() => openRow('delete', row)}>
                        <Trash2 className="mr-2 size-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </>}
            </TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
    {standalone && action?.view === view && (action.view === 'schedules'
      ? <WateringScheduleDialog key={action.action.mode === 'create' ? 'create' : `${action.action.mode}-${action.action.schedule.id}`} action={action.action} onClose={close} onSaved={refreshAfterSave} />
      : <WateringHistoryDialog key={action.action.mode === 'create' ? 'create' : `${action.action.mode}-${action.action.entry.id}`} action={action.action} onClose={close} onSaved={refreshAfterSave} />)}
    {standalone && bulk?.view === view && <WateringBulkEditDialog view={view} selection={bulk.selection} ranksReady={ranksReady} rank={bulk.rank}
      onClose={() => setBulk(null)} onSaved={() => {
        setNotice(`Updated ${bulk.selection.length} ${bulk.selection.length === 1 ? 'record' : 'records'}.`);
        setBulk(null);
        setLoading(true);
        setRevision(value => value + 1);
      }} />}
  </div>;
}
