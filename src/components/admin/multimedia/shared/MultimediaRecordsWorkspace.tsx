'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { multimediaOrdering } from '@/libraries/services/multimedia/ordering';

type Row = { id: number; [key: string]: unknown };
export function useMultimediaRecords(kind: string, enabled: boolean, parent: { albumId?: number; trackId?: number } = {}) {
  const { albumId, trackId } = parent;
  const [rows, setRows] = useState<Row[]>([]), [total, setTotal] = useState(0);
  const [page, setPage] = useState(0), [size, setSize] = useState(25), [search, setSearch] = useState('');
  const defaults = multimediaOrdering(kind);
  const [sort, setSort] = useState(defaults.sort), [direction, setDirection] = useState<'asc' | 'desc'>(defaults.direction);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [revision, setRevision] = useState(0); const lock = useRef(false);
  const reload = () => setRevision(value => value + 1);
  useEffect(() => { const order = multimediaOrdering(kind); setSort(order.sort); setDirection(order.direction); }, [kind]);
  useEffect(() => { setPage(0); setSelected(new Set()); }, [kind, albumId, trackId]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController(); setLoading(true); setSelected(new Set());
    const timer = setTimeout(async () => {
      try {
        const scope = `${albumId ? `&albumId=${albumId}` : ''}${trackId ? `&trackId=${trackId}` : ''}`;
        const response = await fetch(`/api/multimedia/admin-list?kind=${kind}&limit=${size}&offset=${page * size}&sort=${sort}&direction=${direction}&search=${encodeURIComponent(search)}${scope}`, { signal: controller.signal });
        const result = await response.json(); if (!response.ok) throw Error(result.error || 'Could not load records.');
        if (controller.signal.aborted) return;
        const last = Math.max(0, Math.ceil(result.total / size) - 1);
        if (page > last) { setPage(last); return; }
        setRows(result.data); setTotal(result.total);
        setError('');
      } catch (reason) { if (!controller.signal.aborted) { setRows([]); setTotal(0); setError(reason instanceof Error ? reason.message : 'Could not load records.'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [enabled, kind, page, size, search, sort, direction, revision, albumId, trackId]);
  async function removeSelected() {
    const targets = rows.filter(row => selected.has(row.id));
    if (lock.current || !targets.length || !window.confirm(`Delete ${targets.length} selected ${kind}?${kind === 'albums' ? ' Album deletion also removes its related records.' : ''}`)) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    let succeeded = 0; const failures: string[] = [];
    for (const row of targets) {
      try {
        const response = await fetch(`/api/multimedia/${kind}?id=${row.id}`, { method: 'DELETE' });
        const result = await response.json(); if (!response.ok || result.success === false) throw Error(result.error || 'Deletion failed.');
        succeeded++;
      } catch (reason) { failures.push(`#${row.id}: ${reason instanceof Error ? reason.message : 'Deletion failed.'}`); }
    }
    setNotice(succeeded ? `${succeeded} deleted.` : ''); setError(failures.join(' '));
    setSelected(new Set()); lock.current = false; setBusy(false); reload();
  }
  return { rows, total, page, size, search, sort, direction, loading, busy, error, notice, selected, setSelected, reload, removeSelected,
    searchChange: (value: string) => { setSearch(value); setPage(0); setError(''); },
    pageChange: setPage, sizeChange: (value: number) => { setSize(value); setPage(0); },
    sortChange: (value: string) => { setSort(value); setDirection(sort === value && direction === 'asc' ? 'desc' : 'asc'); setPage(0); setSelected(new Set()); },
    retry: () => { setError(''); reload(); },
  };
}
type Workspace = ReturnType<typeof useMultimediaRecords>;
export function MultimediaRecordsSearch({ workspace: w }: { workspace: Workspace }) {
  return <div className="relative min-w-48 flex-1"><Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" /><Input aria-label="Search records" placeholder="Search by name…" maxLength={255} value={w.search} disabled={w.busy} onChange={event => w.searchChange(event.target.value)} className="h-7 pl-7 text-xs" /></div>;
}
export function MultimediaStatus({ value }: { value: unknown }) {
  if (typeof value === 'boolean') return value ? <Check aria-label="Yes" className="h-4 w-4 text-green-500" /> : <X aria-label="No" className="h-4 w-4 text-gray-400" />;
  const label = String(value ?? '—');
  return <span className={['active','published'].includes(label) ? 'text-green-500' : ['draft','processing','pending'].includes(label) ? 'text-yellow-500' : 'text-muted-foreground'}>{label}</span>;
}
export function MultimediaRecordsTable({ workspace: w, columns, actions, label }: { workspace: Workspace; columns: { field: string; label: string; sortable?: boolean; render?: (row: Row) => ReactNode }[]; actions: (row: Row) => ReactNode; label: string }) {
  const last = Math.max(0, Math.ceil(w.total / w.size) - 1), disabled = w.loading || w.busy;
  const picked = w.rows.filter(row => w.selected.has(row.id)).length;
  return <>
    {w.error && <p role="alert" className="shrink-0 text-sm text-red-500">{w.error} <button className="underline" disabled={disabled} onClick={w.retry}>Retry</button></p>}
    {w.notice && <p role="status" className="shrink-0 text-sm text-green-500">{w.notice}</p>}
    <nav aria-label={`${label} pagination`} className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2"><span>{w.loading ? 'Loading…' : w.total ? `${w.page * w.size + 1}–${Math.min((w.page + 1) * w.size, w.total)} of ${w.total} ${label}` : `0 ${label}`}</span><span>|</span><span>{picked} selected</span><Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={disabled || !picked} onClick={w.removeSelected}>Delete selected</Button><Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={disabled || !picked} onClick={() => w.setSelected(new Set())}>Clear selection</Button></div>
      <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label={`${label} per page`} className="h-7 rounded-md border bg-background px-2 text-xs" disabled={disabled} value={w.size} onChange={event => w.sizeChange(Number(event.target.value))}>{[25,50,100,200].map(n => <option key={n}>{n}</option>)}</select></label>{['First','Previous'].map((name,i) => <Button key={name} size="sm" variant="outline" className="h-7 text-xs" disabled={disabled || !w.page} onClick={() => w.pageChange(i ? w.page - 1 : 0)}>{name}</Button>)}<span>Page {w.page + 1} of {last + 1}</span>{['Next','Last'].map((name,i) => <Button key={name} size="sm" variant="outline" className="h-7 text-xs" disabled={disabled || w.page >= last} onClick={() => w.pageChange(i ? last : w.page + 1)}>{name}</Button>)}</div>
    </nav>
    <div className="min-h-0 flex-1 overflow-auto rounded-md border" tabIndex={0} role="region" aria-label={`${label} records`}><Table className="min-w-[760px] [&_td]:py-1 [&_td]:text-xs [&_th]:text-xs"><TableHeader className="sticky top-0 z-10 border-b bg-background text-left"><TableRow><TableHead className="h-8 w-8 px-2 py-1"><input type="checkbox" aria-label="Select this page" disabled={disabled || !w.rows.length} checked={!!w.rows.length && picked === w.rows.length} ref={node => { if(node) node.indeterminate = picked > 0 && picked < w.rows.length; }} onChange={event => w.setSelected(event.target.checked ? new Set(w.rows.map(row => row.id)) : new Set())} /></TableHead>{columns.map(column => {
      const sortable = column.sortable !== false;
      const active = sortable && column.field === w.sort;
      const Icon = active ? w.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
      return <TableHead key={column.field} className="h-8 px-2 py-1 text-xs font-semibold" aria-sort={sortable ? active ? w.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>
        {sortable ? <button className="inline-flex items-center gap-1" disabled={disabled} onClick={() => w.sortChange(column.field)}>{column.label}<Icon className="h-3 w-3" /></button> : column.label}
      </TableHead>;
    })}<TableHead className="h-8 px-2 py-1 text-right text-xs">Actions</TableHead></TableRow></TableHeader><TableBody>
      {w.loading ? <TableRow><TableCell colSpan={columns.length+2} className="p-4 text-center">Loading…</TableCell></TableRow> : !w.rows.length ? <TableRow><TableCell colSpan={columns.length+2} className="p-4 text-center text-muted-foreground">{w.error ? 'Records unavailable.' : `No ${label.toLowerCase()} found.`}</TableCell></TableRow> : w.rows.map(row => <TableRow key={row.id} className="border-b hover:bg-muted/50"><TableCell className="px-2 py-1"><input type="checkbox" aria-label={`Select record ${row.id}`} disabled={disabled} checked={w.selected.has(row.id)} onChange={event => w.setSelected(current => { const next = new Set(current); if(event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /></TableCell>{columns.map(column => <TableCell key={column.field} className="px-2 py-1">{column.render ? column.render(row) : String(row[column.field] ?? '—')}</TableCell>)}<TableCell className="whitespace-nowrap px-2 py-1 text-right"><fieldset disabled={disabled}>{actions(row)}</fieldset></TableCell></TableRow>)}
    </TableBody></Table></div>
  </>;
}
