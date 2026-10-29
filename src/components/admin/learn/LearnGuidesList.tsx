'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, BookOpen, Check, Download, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { useAdminListQueryState } from '@/components/admin/shared/use-admin-list-query-state';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LEARN_SEARCH_LIMIT, learnGuideSorts, type LearnGuidePage, type LearnGuideRow, type LearnGuideSort } from '@/libraries/services/learn/contracts';
import { LearnAdminError, learnAdminResponse, learnAdminActionClass as actionClass, learnAdminSelectClass as selectClass } from './learn-admin-client';

const route = '/admin/learn';
type ListState = { key: string; rows: LearnGuideRow[]; total: number; error: string; denied: boolean };

export function LearnGuidesList() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <p role="status" className="p-3 text-sm">Checking Learn access…</p>;
  if (status !== 'authenticated' || !session?.user?.id) return <p role="alert" className="p-3 text-sm">Sign in to manage Learn guides. <Link className="underline" href="/auth/sign-in">Sign In</Link></p>;
  // A new identity mounts a clean workspace before any old records can render.
  return <LearnGuidesWorkspace key={session.user.id} />;
}

function LearnGuidesWorkspace() {
  const [search, setSearch] = useAdminListQueryState(route, 'search', '');
  const [requestedPage, setPage] = useAdminListQueryState(route, 'page', 0);
  const [limit, setLimit] = useAdminListQueryState(route, 'limit', 25);
  const page = Math.min(requestedPage, Math.floor(1_000_000 / limit));
  const [sort, setSort] = useAdminListQueryState<LearnGuideSort>(route, 'sort', 'sortOrder', { values: learnGuideSorts });
  const [direction, setDirection] = useAdminListQueryState(route, 'direction', 'asc', { values: ['asc', 'desc'] });
  const [active, setActive] = useAdminListQueryState(route, 'isActive', '', { values: ['', 'true', 'false'] });
  const [published, setPublished] = useAdminListQueryState(route, 'isPublished', '', { values: ['', 'true', 'false'] });
  const params = new URLSearchParams({ search, limit: String(limit), offset: String(page * limit), sort, direction });
  if (active) params.set('isActive', active);
  if (published) params.set('isPublished', published);
  const queryKey = params.toString();
  const [result, setResult] = useState<ListState | null>(null);
  const [pending, setPending] = useState(true), [refresh, setRefresh] = useState(0);
  const [selection, setSelection] = useState<{ key: string; ids: Set<number> }>({ key: '', ids: new Set() });
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [writeDenied, setWriteDenied] = useState(false);
  const generation = useRef(0), mounted = useRef(true), mutation = useRef<AbortController | null>(null);
  const currentQuery = useRef(queryKey); currentQuery.current = queryKey;
  const current = result?.key === queryKey ? result : null;
  const loading = pending || !current;
  const denied = writeDenied || !!current?.denied;
  const rows = !loading && !denied && !current?.error ? current?.rows ?? [] : [];
  const total = !loading && !denied ? current?.total ?? 0 : 0;
  const selected = selection.key === queryKey && !loading ? selection.ids : new Set<number>();
  const ready = !loading && !current?.error && !denied;
  const pages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; mutation.current?.abort(); generation.current++; };
  }, []);
  useEffect(() => { if (page !== requestedPage) setPage(page, { replace: true }); }, [page, requestedPage]);
  useEffect(() => {
    const request = ++generation.current, controller = new AbortController();
    setPending(true); setSelection({ key: queryKey, ids: new Set() });
    const timer = setTimeout(() => { void (async () => {
      try {
        const response = await fetch(`/api/learn/guides?${queryKey}`, { cache: 'no-store', signal: controller.signal });
        const payload = await learnAdminResponse<LearnGuidePage<LearnGuideRow>>(response, 'Learn guides could not be loaded.');
        if (!Array.isArray(payload.data) || !Number.isSafeInteger(payload.pagination?.total) || payload.pagination.total < 0) throw new Error('Learn guides returned an invalid page.');
        if (controller.signal.aborted || request !== generation.current || currentQuery.current !== queryKey) return;
        if (page > 0 && page * limit >= payload.pagination.total) {
          setPage(Math.max(0, Math.ceil(payload.pagination.total / limit) - 1), { replace: true });
          return;
        }
        setWriteDenied(false);
        setResult({ key: queryKey, rows: payload.data, total: payload.pagination.total, error: '', denied: false });
      } catch (error) {
        if (controller.signal.aborted || request !== generation.current || currentQuery.current !== queryKey) return;
        const forbidden = error instanceof LearnAdminError && (error.status === 401 || error.status === 403);
        setResult({ key: queryKey, rows: [], total: 0, error: error instanceof Error ? error.message : 'Learn guides could not be loaded.', denied: forbidden });
      } finally { if (!controller.signal.aborted && request === generation.current) setPending(false); }
    })(); }, search ? 200 : 0);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [queryKey, refresh]);
  useEffect(() => {
    if (!busy) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: MouseEvent) => { if ((event.target as Element | null)?.closest?.('a[href]')) { event.preventDefault(); event.stopImmediatePropagation(); } };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); };
  }, [busy]);

  const resetPage = () => { setPage(0); setSelection({ key: '', ids: new Set() }); };
  const reload = () => { setPending(true); setRefresh(value => value + 1); };
  const clearFilters = () => { setSearch(''); setActive(''); setPublished(''); resetPage(); };
  const filtered = !!(search || active || published);
  async function remove(targets: LearnGuideRow[]) {
    if (mutation.current || !ready || currentQuery.current !== queryKey || !targets.length || !targets.every(target => rows.some(row => row.id === target.id && row.revision === target.revision))) return;
    if (!window.confirm(`Delete ${targets.length} Learn guide${targets.length === 1 ? '' : 's'} permanently? Published guides will also disappear from Learn.`)) return;
    const controller = new AbortController(); mutation.current = controller; setBusy(true); setNotice('');
    let removed = 0, failure = '', forbidden = false;
    try {
      for (const row of targets) {
        if (!mounted.current || controller.signal.aborted) break;
        try {
          const query = new URLSearchParams({ id: String(row.id), revision: row.revision });
          const response = await fetch(`/api/learn/guides?${query}`, { method: 'DELETE', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) });
          const payload = await learnAdminResponse<{ data: { id: number } }>(response, 'Guide could not be deleted.');
          if (payload.data?.id !== row.id) throw new Error('Deletion could not be confirmed.');
          removed++;
        } catch (error) {
          failure = error instanceof Error ? error.message : 'A guide could not be deleted.';
          if (error instanceof LearnAdminError && (error.status === 401 || error.status === 403)) { forbidden = true; break; }
        }
      }
      if (mounted.current) {
        setNotice(removed === targets.length ? `${removed} guide${removed === 1 ? '' : 's'} deleted.` : `${removed} of ${targets.length} guides deleted. ${failure} Review the refreshed records before retrying.`);
        if (forbidden) setWriteDenied(true);
      }
    } finally {
      if (mutation.current === controller) mutation.current = null;
      if (mounted.current) { setBusy(false); setSelection({ key: '', ids: new Set() }); if (!forbidden) reload(); }
    }
  }
  async function importStarters() {
    if (mutation.current || !ready || !window.confirm('Import missing Starter Guides? Existing slugs and their content will be kept.')) return;
    const controller = new AbortController(); mutation.current = controller; setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/learn/guides/import-starters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) });
      const payload = await learnAdminResponse<{ data: { imported: number; skipped: number } }>(response, 'Starter Guides could not be imported.');
      if (!Number.isSafeInteger(payload.data?.imported) || !Number.isSafeInteger(payload.data?.skipped)) throw new Error('The import result could not be confirmed. Refresh before retrying.');
      if (mounted.current) { setNotice(`${payload.data.imported} Starter Guides imported; ${payload.data.skipped} existing guides kept.`); reload(); }
    } catch (error) {
      if (mounted.current) {
        setNotice(error instanceof Error ? error.message : 'Starter Guides could not be imported.');
        if (error instanceof LearnAdminError && (error.status === 401 || error.status === 403)) setWriteDenied(true);
      }
    } finally { if (mutation.current === controller) mutation.current = null; if (mounted.current) setBusy(false); }
  }
  const heading = (label: string, key: LearnGuideSort) => {
    const Icon = sort === key ? direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <button type="button" disabled={busy} className="flex items-center gap-1 text-xs font-semibold" aria-label={`Sort by ${label}`} onClick={() => { setSort(key); setDirection(sort === key && direction === 'asc' ? 'desc' : 'asc'); resetPage(); }}>{label}<Icon aria-hidden="true" className="h-3 w-3" /></button>;
  };
  return <div className="flex h-full min-h-0 flex-1 flex-col gap-2 text-xs [&_button]:text-xs">
    <fieldset disabled={busy} className="contents">
      <AdminWorkspaceHeader moduleKey="learn" icon={BookOpen} title="Learn" description="Manage shared App guides." className="shrink-0">
        <ModelFieldHelp label="Learn guides">Super Admins manage one shared collection. Only Active and Published guides appear publicly. Import Starter Guides adds missing slugs and keeps existing content.</ModelFieldHelp>
        <span className="rounded border px-1.5 py-0.5">{loading ? '…' : total}</span>
        <Input aria-label="Search Learn guides" className="h-7 min-w-40 flex-1 text-xs" placeholder="Search title, slug or summary…" maxLength={LEARN_SEARCH_LIMIT} value={search} onChange={event => { setSearch(event.target.value); resetPage(); }} />
        <select aria-label="Filter guides by activity" className={selectClass} value={active} onChange={event => { setActive(event.target.value); resetPage(); }}><option value="">All activity</option><option value="true">Active</option><option value="false">Inactive</option></select>
        <select aria-label="Filter guides by publication" className={selectClass} value={published} onChange={event => { setPublished(event.target.value); resetPage(); }}><option value="">All publication</option><option value="true">Published</option><option value="false">Unpublished</option></select>
        <Button variant="outline" className={actionClass} disabled={loading} onClick={reload}><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Refresh</Button>
        <Button variant="ghost" className={actionClass} disabled={!filtered} onClick={clearFilters}>Reset filters</Button>
        <AdminWorkspaceLink href="/learn" icon={BookOpen}>Open Learn</AdminWorkspaceLink>
        <Button variant="success" className={actionClass} disabled={!ready} onClick={() => void importStarters()}><Download aria-hidden="true" className="h-3.5 w-3.5" />Import Starter Guides</Button>
        <Button variant="success" className={actionClass} disabled={!ready} onClick={() => window.location.assign('/admin/learn/new')}><Plus aria-hidden="true" className="h-3.5 w-3.5" />Add Guide</Button>
      </AdminWorkspaceHeader>
      <nav aria-label="Learn guides pagination" className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : denied ? 'Super Admin access required' : current?.error ? 'Guides unavailable' : `${total ? page * limit + 1 : 0}–${Math.min((page + 1) * limit, total)} of ${total} guides`}</span><span>{selected.size} selected</span><Button variant="outline" className={actionClass} disabled={!ready || !selected.size} onClick={() => void remove(rows.filter(row => selected.has(row.id)))}><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Delete selected</Button><Button variant="ghost" className={actionClass} disabled={!selected.size} onClick={() => setSelection({ key: queryKey, ids: new Set() })}>Clear selection</Button></div>
        <div className="flex flex-wrap items-center gap-1"><select aria-label="Guides per page" className={selectClass} value={limit} onChange={event => { setLimit(Number(event.target.value)); resetPage(); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size} per page</option>)}</select><Button variant="outline" className={actionClass} disabled={loading || !page} onClick={() => setPage(0)}>First</Button><Button variant="outline" className={actionClass} disabled={loading || !page} onClick={() => setPage(page - 1)}>Previous</Button><span className="px-1">Page {page + 1} of {pages}</span><Button variant="outline" className={actionClass} disabled={!ready || page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button><Button variant="outline" className={actionClass} disabled={!ready || page + 1 >= pages} onClick={() => setPage(pages - 1)}>Last</Button></div>
      </nav>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border" aria-busy={loading}>
        {loading ? <p role="status" className="p-4">Loading Learn guides…</p> : denied || current?.error ? <div role="alert" className="space-y-2 p-4"><p>{denied ? 'An active Super Admin account is required to manage Learn guides.' : current?.error}</p><Button variant="outline" className={actionClass} onClick={reload}>Retry</Button></div> : <Table>
          <TableHeader className="sticky top-0 z-10 bg-background"><TableRow><TableHead className="w-9"><input type="checkbox" aria-label="Select guides on this page" checked={!!rows.length && rows.every(row => selected.has(row.id))} disabled={!rows.length} onChange={event => setSelection({ key: queryKey, ids: new Set(event.target.checked ? rows.map(row => row.id) : []) })} /></TableHead><TableHead>{heading('Title', 'title')}</TableHead><TableHead>{heading('Slug', 'slug')}</TableHead><TableHead>{heading('Sort Order', 'sortOrder')}</TableHead><TableHead>{heading('Active', 'isActive')}</TableHead><TableHead>{heading('Published', 'isPublished')}</TableHead><TableHead>{heading('Updated', 'updatedAt')}</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map(row => <TableRow key={row.id}><TableCell><input type="checkbox" aria-label={`Select ${row.title}`} checked={selected.has(row.id)} onChange={event => setSelection({ key: queryKey, ids: new Set(event.target.checked ? [...selected, row.id] : [...selected].filter(id => id !== row.id)) })} /></TableCell><TableCell><button type="button" className="text-left font-medium hover:underline focus-visible:underline" onClick={() => window.location.assign(`/admin/learn/${row.id}`)}>{row.title}</button>{row.summary && <p className="mt-0.5 max-w-lg truncate text-[11px] text-muted-foreground">{row.summary}</p>}</TableCell><TableCell className="text-muted-foreground">{row.slug}</TableCell><TableCell>{row.sortOrder}</TableCell><TableCell>{row.isActive ? <Check aria-label="Active" className="h-3.5 w-3.5 text-emerald-500" /> : <X aria-label="Inactive" className="h-3.5 w-3.5 text-muted-foreground" />}</TableCell><TableCell>{row.isPublished ? <Check aria-label="Published" className="h-3.5 w-3.5 text-emerald-500" /> : <X aria-label="Unpublished" className="h-3.5 w-3.5 text-muted-foreground" />}</TableCell><TableCell className="whitespace-nowrap">{new Date(row.updatedAt).toLocaleDateString()}</TableCell><TableCell className="whitespace-nowrap text-right"><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${row.title}`} onClick={() => window.location.assign(`/admin/learn/${row.id}`)}><Pencil aria-hidden="true" className="h-3.5 w-3.5 text-blue-500" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Delete ${row.title}`} onClick={() => void remove([row])}><Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-red-500" /></Button></TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">{filtered ? 'No guides match these filters.' : 'No Learn guides yet. Add a Guide or import Starter Guides.'}</TableCell></TableRow>}</TableBody>
        </Table>}
      </div>
    </fieldset>
    {/* <footer className="shrink-0 border-t pt-2 text-xs text-muted-foreground" aria-live="polite">
      {busy ? 'Saving Learn changes…' : notice || 'Active and Published guides are visible to everyone. Unpublished or inactive guides stay in Admin.'}
    </footer> */}
  </div>;
}
