'use client';

import { useEffect, useState } from 'react';
import { Check, Droplets, RefreshCw, Sprout, X } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ThreedWateringSchedule, ThreedWateringHistory } from '@/lib/schema/threed';

type View = 'schedules' | 'history';
type Row = ThreedWateringSchedule | ThreedWateringHistory;
const dateLabel = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};
const measurement = (value: number | null, unit: string) => value === null ? '—' : `${value} ${unit}`;

// Compatibility with Project-admin hosts; this workspace does not mutate records.
export function ThreeDWateringSchedulesCRUD({ threedId, scrollRecords = false }: { threedId?: number; onModuleUpdate?: () => void; scrollRecords?: boolean }) {
  const [view, setView] = useState<View>('schedules');
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const reset = () => { setPage(0); setRows([]); setLoading(true); };
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search });
    if (threedId !== undefined) params.set('moduleId', String(threedId));
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/watering-${view}?${params}`, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load Waterings');
        if (controller.signal.aborted) return;
        setRows(result.data); setTotal(Number(result.pagination.total));
        if (page > 0 && page * pageSize >= result.pagination.total) setPage(Math.max(0, Math.ceil(result.pagination.total / pageSize) - 1));
      } catch (failure) {
        if (!controller.signal.aborted) { setError(failure instanceof Error ? failure.message : 'Unable to load Waterings'); setRows([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [view, page, pageSize, search, threedId, revision]);
  const headings = view === 'schedules'
    ? ['Schedule ID', 'Frequency', 'Next watering', 'Last watering', 'Duration', 'Volume', 'Targets', 'Active', 'Notes']
    : ['History ID', 'Executed', 'Status', 'Duration', 'Volume', 'Targets', 'Schedule', 'Executed by', 'Reason'];
  const targets = (row: Row) => [row.plantingId ? `Planting #${row.plantingId}` : '', row.plantId ? `Plant #${row.plantId}` : '', row.farmbotId ? `FarmBot #${row.farmbotId}` : '', 'bedId' in row && row.bedId ? `Bed #${row.bedId}` : ''].filter(Boolean).join(' · ') || '—';
  return <div className={scrollRecords ? 'flex h-full min-h-0 flex-col gap-2' : 'space-y-2'}>
    <AdminWorkspaceHeader icon={Droplets} title="Waterings" description="Browse watering schedules and recorded watering history" className="shrink-0 [&>a]:text-[11px]">
      <Badge variant="secondary">{loading || error ? '—' : total}</Badge>
      <Input aria-label={`Search watering ${view}`} placeholder={view === 'schedules' ? 'Search Schedule ID or notes…' : 'Search History ID, status or reason…'} value={search} onChange={event => { reset(); setSearch(event.target.value); }} className="h-7 min-w-48 flex-1 text-xs" />
      <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw className="h-3 w-3" />Refresh</Button>
      <AdminWorkspaceLink href="/admin/threed/plantings" icon={Sprout}>Plantings</AdminWorkspaceLink>
    </AdminWorkspaceHeader>
    <Tabs value={view} onValueChange={value => { reset(); setSearch(''); setView(value as View); }} className="shrink-0">
      <TabsList aria-label="Watering views"><TabsTrigger value="schedules">Schedules</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
    </Tabs>
    <p className="shrink-0 text-xs text-muted-foreground">{view === 'schedules' ? 'Saved schedules. Schedule editing and execution are not available here yet.' : 'Recorded watering outcomes. Missing duration or volume means it was not recorded.'}{threedId !== undefined && view === 'history' ? ' This view follows currently linked Plantings and Schedules, not historical Project membership.' : ''}</p>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <span>{loading ? 'Loading…' : error ? 'Records unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} ${view}`}</span>
      <div className="flex flex-wrap items-center gap-2">
        <label>Per page <select aria-label="Waterings per page" value={pageSize} disabled={loading} className="rounded border bg-background p-1 text-[11px]" onChange={event => { reset(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size}>{size}</option>)}</select></label>
        {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading || !!error || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
      </div>
    </div>
    <div role="region" aria-label={`Watering ${view} records`} tabIndex={0} className={scrollRecords ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible' : 'overflow-auto rounded-lg border'}>
      <Table className="min-w-[1100px]">
        <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}><TableRow>{headings.map(title => <TableHead key={title} className="py-1 text-xs">{title}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={9}><span role="status">Loading {view}…</span></TableCell></TableRow> : error ? <TableRow><TableCell colSpan={9}><span role="alert" className="text-destructive">{error}</span><Button variant="outline" size="sm" className="ml-2 text-[11px]" onClick={() => setRevision(value => value + 1)}>Retry</Button></TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={9}>No watering {view} found{search ? ' for this search' : ''}.</TableCell></TableRow> : rows.map(row => {
            const cells = 'frequency' in row
              ? [row.scheduleId, row.frequency, dateLabel(row.nextWatering), dateLabel(row.lastWatering), measurement(row.durationMs, 'ms'), measurement(row.volumeMl, 'mL'), targets(row), row.isActive ? <Check aria-label="Active" className="h-4 w-4 text-green-500" /> : <X aria-label="Inactive" className="h-4 w-4 text-gray-500" />, row.notes || '—']
              : [row.historyId, dateLabel(row.executedAt), <span className={row.status === 'success' ? 'text-green-500' : row.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}>{row.status}</span>, measurement(row.durationMs, 'ms'), measurement(row.volumeMl, 'mL'), targets(row), row.scheduleId ? `#${row.scheduleId}` : '—', row.executedBy || '—', [row.skipReason, row.errorMessage].filter(Boolean).join(' · ') || '—'];
            return <TableRow key={`${view}-${row.id}`}>{cells.map((cell, index) => <TableCell key={headings[index]} className="py-1 text-xs">{index === 0 ? <span className="flex items-center gap-2"><Droplets className="h-3.5 w-3.5 shrink-0 text-blue-500" />{cell}</span> : cell}</TableCell>)}</TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
  </div>;
}
