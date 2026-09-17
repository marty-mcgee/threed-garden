'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, FolderTree, Clapperboard, Box, Users, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
type Category = { id: number; name: string; slotUsage: number; clipUsage: number };
type Draft = { id?: number; name: string };
type SortKey = 'name' | 'references';
const references = (category: Category) => category.slotUsage;
async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Animation Categories request failed');
  return result.data;
}
export function ThreeDAnimationCategoriesWorkspace() {
  const [rows, setRows] = useState<Category[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [search, setSearch] = useState(''), [page, setPage] = useState(0), [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set()), [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0), [notice, setNotice] = useState(''), [operationError, setOperationError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setSelected(new Set());
    request('/api/threed/animation-categories', { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setRows(data); })
      .catch(cause => { if (!controller.signal.aborted) { setRows([]); setError(cause instanceof Error ? cause.message : 'Categories unavailable'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const value = (category: Category): string | number => sort.key === 'references' ? category.slotUsage + category.clipUsage : category.name.toLowerCase();
    return rows.filter(category => category.name.toLowerCase().includes(query)).sort((a, b) => {
      const left = value(a), right = value(b);
      const comparison = typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right);
      return comparison * (sort.direction === 'asc' ? 1 : -1) || a.id - b.id;
    });
  }, [rows, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setPage(value => Math.min(value, pages - 1)); setSelected(new Set()); }, [pages, page, pageSize, search, sort]);
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize), deletable = visible.filter(category => references(category) === 0);
  async function save() {
    if (!draft || busy) return;
    setBusy(true); setOperationError(''); setNotice('');
    try { await request('/api/threed/animation-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) }); setDraft(null); setRefresh(value => value + 1); setNotice('Category saved. Reload open assignment windows and the Scene to use changes.'); }
    catch (cause) { setOperationError(cause instanceof Error ? cause.message : 'Could not save Category'); }
    finally { setBusy(false); }
  }
  async function remove(targets: Category[]) {
    if (busy || !targets.length || !confirm(`Delete ${targets.length} Categories without Slot references? Clip Category labels will be removed; clips and action mappings remain.`)) return;
    setBusy(true); setOperationError(''); setNotice('');
    let removed = 0; const failures: string[] = [];
    for (const category of targets) {
      try { await request(`/api/threed/animation-categories?id=${category.id}`, { method: 'DELETE' }); removed++; }
      catch (cause) { failures.push(`${category.name}: ${cause instanceof Error ? cause.message : 'Deletion failed'}`); }
    }
    setNotice(`${removed} Category(s) deleted.`); setOperationError(failures.join(' ')); setSelected(new Set()); setRefresh(value => value + 1); setBusy(false);
  }
  function heading(key: SortKey, title: string) {
    return <TableHead aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={busy || loading} className="flex items-center gap-1 text-xs" onClick={() => { setSort(previous => ({ key, direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc' })); setPage(0); }}>{title}{sort.key !== key ? <ArrowUpDown className="h-3 w-3" /> : sort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</button></TableHead>;
  }
  return <div className="flex h-full min-h-0 flex-col gap-2">
    <AdminWorkspaceHeader icon={FolderTree} title="Animation Categories" description="Shared Categories for animation clips and Action Slots">
      <span className="rounded bg-muted px-2 text-xs">{error ? '—' : filtered.length}</span>
      <Input aria-label="Search Animation Categories" placeholder="Search Categories by name…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(0); }} className="h-7 min-w-48 flex-1 text-xs" />
      <Button size="sm" className="h-7 text-xs" disabled={busy || loading || !!draft || !!error} onClick={() => { setOperationError(''); setNotice(''); setDraft({ name: '' }); }}><Plus className="mr-1 h-3 w-3" />Add Category</Button>
      <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
      <AdminWorkspaceLink href="/admin/threed/animation-slots" icon={Clapperboard}>Animation Slots</AdminWorkspaceLink>
      <AdminWorkspaceLink href="/admin/threed/animations" icon={Clapperboard}>Animations Library</AdminWorkspaceLink>
      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!draft} onClick={() => setRefresh(value => value + 1)}>Refresh</Button>
      <AdminWorkspaceLink href="/admin/threed/models" icon={Box}>Models</AdminWorkspaceLink>
      <AdminWorkspaceLink href="/admin/threed/characters" icon={Users}>Characters</AdminWorkspaceLink>
    </AdminWorkspaceHeader>
    {notice && <p role="status" className="text-sm text-green-500">{notice}</p>}{!draft && operationError && <p role="alert" className="text-sm text-destructive">{operationError}</p>}
    <Dialog open={!!draft} onOpenChange={open => { if (!open && !busy) { setDraft(null); } }}>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto gap-3 p-4 sm:max-w-lg [@media(pointer:coarse)]:[&_button]:min-h-11 [@media(pointer:coarse)]:[&_input]:min-h-11 [@media(pointer:coarse)]:[&_select]:min-h-11">
        <DialogHeader><DialogTitle>{draft?.id ? 'Edit Animation Category' : 'Add Animation Category'}</DialogTitle></DialogHeader>
        {draft && <form aria-label={draft.id ? 'Edit Animation Category' : 'New Animation Category'} onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-3">
      <fieldset disabled={busy} className="grid gap-3 [&_input]:h-8 [&_input]:text-xs">
        <label className="space-y-1 text-xs">Name<Input autoFocus required maxLength={120} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
        <div className="flex justify-end gap-2"><Button type="submit" size="sm" className="h-8 text-xs" disabled={!draft.name.trim()}>{draft.id ? 'Update Category' : 'Create Category'}</Button><Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setDraft(null); }}>Cancel</Button></div>
      </fieldset><p className="mt-2 text-xs text-muted-foreground">Categories organize clips and Action Slots. Renaming keeps assignments. Reassign Action Slots before deleting a Category. Deleting removes clip Category labels, not clips or action mappings.</p>
      {operationError && <p role="alert" className="text-sm text-destructive">{operationError}</p>}
    </form>}
      </DialogContent>
    </Dialog>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2"><span role="status">{loading ? 'Loading Categories…' : error ? 'Categories unavailable' : `${filtered.length ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, filtered.length)} of ${filtered.length} Categories`}</span><span>|</span><span>{selected.size} selected</span>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || !!draft || !selected.size} onClick={() => void remove(deletable.filter(category => selected.has(category.id)))}>Delete selected ({selected.size})</Button><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button></div>
      <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Animation Categories per page" className="rounded border bg-background p-1" disabled={busy || loading} value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}>{[25, 50, 100, 200].map(size => <option key={size}>{size}</option>)}</select></label>
        {(['First', 'Previous', 'Next', 'Last'] as const).map(text => <Button key={text} size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || (text === 'First' || text === 'Previous' ? page === 0 : page >= pages - 1)} onClick={() => setPage(text === 'First' ? 0 : text === 'Previous' ? page - 1 : text === 'Next' ? page + 1 : pages - 1)}>{text}</Button>)}<span>Page {page + 1} of {pages}</span></div>
    </div>
    <div role="region" aria-label="Animation Category records" tabIndex={0} className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible">
      <Table className="min-w-[700px]"><TableHeader className="sticky top-0 z-10 bg-background"><TableRow>
        <TableHead className="w-8"><input type="checkbox" aria-label="Select Categories without Slot references on this page" disabled={busy || loading || !!error || !deletable.length} checked={deletable.length > 0 && deletable.every(category => selected.has(category.id))} ref={input => { if (input) input.indeterminate = deletable.some(category => selected.has(category.id)) && !deletable.every(category => selected.has(category.id)); }} onChange={event => setSelected(event.target.checked ? new Set(deletable.map(category => category.id)) : new Set())} /></TableHead>
        {heading('name', 'Name')}{heading('references', 'References')}<TableHead className="text-right text-xs">Actions</TableHead>
      </TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={4}>Loading Animation Categories…</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={4}><div role="alert" className="text-destructive">{error} <Button size="sm" variant="outline" onClick={() => setRefresh(value => value + 1)}>Retry</Button></div></TableCell></TableRow> : !visible.length ? <TableRow><TableCell colSpan={4}>No Animation Categories found. Use Add Category to create a Category.</TableCell></TableRow> : visible.map(category => <TableRow key={category.id}>
        <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${category.name}`} disabled={busy || references(category) > 0} checked={selected.has(category.id)} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(category.id); else next.delete(category.id); return next; })} /></TableCell>
        <TableCell className="py-1 text-sm"><span className="flex items-center gap-2"><FolderTree aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-500" />{category.name}</span></TableCell><TableCell className="py-1 text-xs">{category.clipUsage} Clips · {category.slotUsage} Slots</TableCell>
        <TableCell className="py-1"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${category.name}`} disabled={busy || !!draft} onClick={() => { setOperationError(''); setNotice(''); setDraft({ id: category.id, name: category.name }); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Delete ${category.name}`} title={references(category) ? 'Reassign Action Slots before deleting' : 'Delete Category'} disabled={busy || !!draft || references(category) > 0} onClick={() => void remove([category])}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
      </TableRow>)}</TableBody></Table>
    </div>
  </div>;
}
