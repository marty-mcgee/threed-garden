'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MicVocal, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { SpeechHistory } from './SpeechHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Summary = { id: number; title: string; revision: number; acceptedVersionNumber: number | null; archivedAt: string | null; updatedAt: string };
type Draft = { id?: number; title: string; text: string; voiceId: string | null; revision?: number };

export default function SpeechPage() {
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [rows, setRows] = useState<Summary[]>([]);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState('updatedAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setSelected(new Set());
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/multimedia/speech?limit=${pageSize}&offset=${page * pageSize}&sort=${sort}&direction=${direction}&archived=${archived}&search=${encodeURIComponent(search)}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load Speech.');
        if (controller.signal.aborted) return;
        const lastPage = Math.max(0, Math.ceil(result.pagination.total / pageSize) - 1);
        if (page > lastPage) { setPage(lastPage); return; }
        setRows(result.data); setTotal(result.pagination.total);
      } catch (reason) {
        if (!controller.signal.aborted) { setRows([]); setTotal(0); setError(reason instanceof Error ? reason.message : 'Could not load Speech.'); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, sort, direction, search, archived, refresh]);
  async function edit(id: number) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/multimedia/speech/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load draft.');
      const { title, text, voiceId, revision } = result.data;
      setDraft({ id, title, text, voiceId, revision }); setFormError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load draft.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save() {
    if (!draft || lock.current) return;
    lock.current = true; setBusy(true); setFormError('');
    try {
      const { id, ...body } = draft;
      const response = await fetch(`/api/multimedia/speech${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save draft.');
      setDraft(null); setRefresh(value => value + 1);
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Could not save draft. Check the list before retrying.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function archive(targets: Summary[]) {
    if (lock.current || !targets.length) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    let successes = 0;
    const failures: string[] = [];
    for (const row of targets) {
      try {
        const response = await fetch(`/api/multimedia/speech/${row.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: row.revision, archived: !row.archivedAt }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not update Speech.');
        successes++;
      } catch (reason) { failures.push(`${row.title}: ${reason instanceof Error ? reason.message : 'Could not update Speech.'}`); }
    }
    setNotice(successes ? `${successes} Speech record${successes === 1 ? '' : 's'} ${archived ? 'restored' : 'archived'}.` : '');
    setError(failures.join(' '));
    setSelected(new Set()); setRefresh(value => value + 1);
    lock.current = false; setBusy(false);
  }
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const selectedRows = rows.filter(row => selected.has(row.id));
  function heading(field: string, label: string) {
    const active = sort === field;
    const Icon = active ? direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <th className="px-3 py-1 text-xs font-medium" aria-sort={active ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={busy || loading} className="inline-flex items-center gap-1" onClick={() => { setDirection(active && direction === 'asc' ? 'desc' : 'asc'); setSort(field); setPage(0); }}>{label}<Icon className="h-3 w-3" /></button></th>;
  }
  return <div className="space-y-3">
    <AdminWorkspaceHeader icon={MicVocal} title="All Speeches" description="Manage saved Multimedia Speech records">
      <Input aria-label="Search Speech" placeholder="Search Speech…" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} className="h-8 min-w-40 flex-1 text-xs" disabled={busy} maxLength={255} />
      <Button size="sm" variant="outline" className="h-8 text-xs" disabled={busy} onClick={() => { setArchived(!archived); setPage(0); }}>{archived ? 'Show active' : 'Show archived'}</Button>
      <Button size="sm" asChild><Link href="/admin/multimedia/speech/new">New Speech</Link></Button>
    </AdminWorkspaceHeader>
    {notice && <p role="status" className="text-sm text-green-500">{notice}</p>}
    {error && <p role="alert" className="text-sm text-red-500">{error} <button className="underline" onClick={() => { setError(''); setRefresh(value => value + 1); }}>Retry</button></p>}
    <nav aria-label="Speech pagination" className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : total ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total} Speeches` : '0 Speeches'}</span><span aria-hidden="true">|</span><span>{selectedRows.length} selected</span>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !selectedRows.length} onClick={() => archive(selectedRows)}>{archived ? 'Restore selected' : 'Archive selected'}</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !selectedRows.length} onClick={() => setSelected(new Set())}>Clear selection</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Speeches per page" className="rounded border bg-background p-1" value={pageSize} disabled={busy || loading} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}>{[25, 50, 100].map(size => <option key={size}>{size}</option>)}</select></label>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !page} onClick={() => setPage(0)}>First</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !page} onClick={() => setPage(page - 1)}>Previous</Button>
        <span>Page {page + 1} of {lastPage + 1}</span>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || page >= lastPage} onClick={() => setPage(page + 1)}>Next</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || page >= lastPage} onClick={() => setPage(lastPage)}>Last</Button>
      </div>
    </nav>
    <div className="overflow-x-auto rounded border"><table className="w-full text-sm"><thead className="border-b text-left text-muted-foreground"><tr><th className="w-8 px-2"><input type="checkbox" aria-label="Select this page" disabled={busy || loading || !rows.length} checked={!!rows.length && selectedRows.length === rows.length} ref={node => { if (node) node.indeterminate = selectedRows.length > 0 && selectedRows.length < rows.length; }} onChange={event => setSelected(event.target.checked ? new Set(rows.map(row => row.id)) : new Set())} /></th>{heading('title', 'Title')}{heading('id', 'ID')}{heading('acceptedVersionNumber', 'Accepted version')}{heading('updatedAt', 'Updated')}<th className="px-3 py-1 text-xs font-medium">Actions</th></tr></thead><tbody>
      {!loading && !rows.length && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{error ? 'Speech unavailable.' : 'No Speech records found.'}</td></tr>}
      {rows.map(row => <tr key={row.id} className="border-b last:border-0"><td className="px-2 py-1"><input type="checkbox" aria-label={`Select ${row.title}`} disabled={busy || loading} checked={selected.has(row.id)} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /></td><td className="px-3 py-1"><span className="inline-flex items-center gap-2"><MicVocal className="h-4 w-4 shrink-0 text-blue-500" />{row.title}</span></td><td className="px-3 py-1">{row.id}</td><td className="px-3 py-1">{row.acceptedVersionNumber ? `Version ${row.acceptedVersionNumber}` : 'None'}</td><td className="px-3 py-1">{new Date(row.updatedAt).toLocaleString()}</td><td className="px-3 py-1"><div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy || loading} onClick={() => setHistoryId(row.id)}>Versions</Button><Button size="sm" variant="outline" disabled={busy || loading} onClick={() => edit(row.id)}>Edit</Button><Button size="sm" variant="outline" disabled={busy || loading} onClick={() => archive([row])}>{row.archivedAt ? 'Restore' : 'Archive'}</Button></div></td></tr>)}
    </tbody></table></div>
    {historyId !== null && <SpeechHistory key={historyId} id={historyId} onClose={() => setHistoryId(null)} onChange={() => setRefresh(value => value + 1)} />}
    <Dialog open={!!draft} onOpenChange={open => { if (!open && !busy) setDraft(null); }}><DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{draft?.id ? 'Edit Speech' : 'New Speech'}</DialogTitle></DialogHeader>
      {draft && <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save(); }}>
        <label className="block space-y-1 text-sm"><span>Title</span><Input required maxLength={255} value={draft.title} disabled={busy} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="block space-y-1 text-sm"><span>Speech text</span><textarea className="min-h-48 w-full rounded border bg-background p-3" maxLength={2000} value={draft.text} disabled={busy} onChange={event => setDraft({ ...draft, text: event.target.value })} /><span className="text-xs text-muted-foreground">{draft.text.length}/2,000</span></label>
        <label className="block space-y-1 text-sm"><span>Fish Audio voice ID</span><Input value={draft.voiceId ?? ''} maxLength={32} disabled={busy} onChange={event => setDraft({ ...draft, voiceId: event.target.value })} /></label>
        {formError && <p role="alert" className="text-sm text-red-500">{formError}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</Button></div>
      </form>}
    </DialogContent></Dialog>
  </div>;
}
