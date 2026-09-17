'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Clapperboard, Box, Users, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAnimationCategories } from './AnimationCategories';
import type { AnimationActionSlot } from '@/lib/services/threed/animations/action-slots';
type Slot = AnimationActionSlot & { modelUsage: number; characterUsage: number; presetUsage: number };
type Draft = { id?: number; name: string; categoryId: number | null; isActive: boolean };
type SortKey = 'name' | 'categoryName' | 'isActive' | 'references';
const references = (slot: Slot) => slot.modelUsage + slot.characterUsage + slot.presetUsage;
async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Animation Slots request failed');
  return result.data;
}
export function ThreeDAnimationSlotsWorkspace() {
  const [rows, setRows] = useState<Slot[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [search, setSearch] = useState(''), [page, setPage] = useState(0), [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set()), [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0), [notice, setNotice] = useState(''), [operationError, setOperationError] = useState('');
  const [categoryRefresh, setCategoryRefresh] = useState(0);
  const { categories, error: categoryError } = useAnimationCategories(categoryRefresh);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  async function createCategory() {
    if (!newCategory?.trim() || busy) return;
    setBusy(true); setOperationError('');
    try { const category = await request('/api/threed/animation-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory.trim() }) }); setCategoryRefresh(value => value + 1); setDraft(previous => previous ? { ...previous, categoryId: category.id } : previous); setNewCategory(null); }
    catch (cause) { setOperationError(cause instanceof Error ? cause.message : 'Could not create Category'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setSelected(new Set());
    request('/api/threed/animation-action-slots', { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setRows(data); })
      .catch(cause => { if (!controller.signal.aborted) { setRows([]); setError(cause instanceof Error ? cause.message : 'Slots unavailable'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const value = (slot: Slot): string | number => sort.key === 'references' ? references(slot) : sort.key === 'isActive' ? Number(slot.isActive) : (slot[sort.key] ?? 'Uncategorized').toLowerCase();
    return rows.filter(slot => `${slot.name} ${slot.categoryName ?? 'Uncategorized'}`.toLowerCase().includes(query)).sort((a, b) => {
      const left = value(a), right = value(b);
      const comparison = typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right);
      return comparison * (sort.direction === 'asc' ? 1 : -1) || a.id - b.id;
    });
  }, [rows, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setPage(value => Math.min(value, pages - 1)); setSelected(new Set()); }, [pages, page, pageSize, search, sort]);
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize), deletable = visible.filter(slot => references(slot) === 0);
  async function save() {
    if (!draft || busy) return;
    setBusy(true); setOperationError(''); setNotice('');
    try { await request('/api/threed/animation-action-slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) }); setDraft(null); setRefresh(value => value + 1); setNotice('Action slot saved. Reload the Scene to use changes.'); }
    catch (cause) { setOperationError(cause instanceof Error ? cause.message : 'Could not save slot'); }
    finally { setBusy(false); }
  }
  async function remove(targets: Slot[]) {
    if (busy || !targets.length || !confirm(`Delete ${targets.length} unreferenced Action slot(s)?`)) return;
    setBusy(true); setOperationError(''); setNotice('');
    let removed = 0; const failures: string[] = [];
    for (const slot of targets) {
      try { await request(`/api/threed/animation-action-slots?id=${slot.id}`, { method: 'DELETE' }); removed++; }
      catch (cause) { failures.push(`${slot.name}: ${cause instanceof Error ? cause.message : 'Deletion failed'}`); }
    }
    setNotice(`${removed} slot(s) deleted.`); setOperationError(failures.join(' ')); setSelected(new Set()); setRefresh(value => value + 1); setBusy(false);
  }
  function heading(key: SortKey, title: string) {
    return <TableHead aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={busy || loading} className="flex items-center gap-1 text-xs" onClick={() => { setSort(previous => ({ key, direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc' })); setPage(0); }}>{title}{sort.key !== key ? <ArrowUpDown className="h-3 w-3" /> : sort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</button></TableHead>;
  }
  return <div className="flex h-full min-h-0 flex-col gap-2">
    <AdminWorkspaceHeader icon={Clapperboard} title="Animation Slots" description="User-defined animation-only actions for Characters and Model defaults">
      <span className="rounded bg-muted px-2 text-xs">{error ? '—' : filtered.length}</span>
      <Input aria-label="Search Animation Slots" placeholder="Search slots by name or Category…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(0); }} className="h-7 min-w-48 flex-1 text-xs" />
      <Button size="sm" className="h-7 text-xs" disabled={busy || loading || !!draft || !!error} onClick={() => { setOperationError(''); setNotice(''); setNewCategory(null); setDraft({ name: '', categoryId: null, isActive: true }); }}><Plus className="mr-1 h-3 w-3" />Add Slot</Button>
      <AdminWorkspaceLink href="/admin/threed/animation-categories" icon={Clapperboard}>Animation Categories</AdminWorkspaceLink>
      <AdminWorkspaceLink href="/admin/threed/animations" icon={Clapperboard}>Animations Library</AdminWorkspaceLink>
      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!draft} onClick={() => setRefresh(value => value + 1)}>Refresh</Button>
      <AdminWorkspaceLink href="/admin/threed/models" icon={Box}>Models</AdminWorkspaceLink>
      <AdminWorkspaceLink href="/admin/threed/characters" icon={Users}>Characters</AdminWorkspaceLink>
    </AdminWorkspaceHeader>
    {notice && <p role="status" className="text-sm text-green-500">{notice}</p>}{!draft && operationError && <p role="alert" className="text-sm text-destructive">{operationError}</p>}
    <Dialog open={!!draft} onOpenChange={open => { if (!open && !busy) { setDraft(null); setNewCategory(null); } }}>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto gap-3 p-4 sm:max-w-lg [@media(pointer:coarse)]:[&_button]:min-h-11 [@media(pointer:coarse)]:[&_input]:min-h-11 [@media(pointer:coarse)]:[&_select]:min-h-11">
        <DialogHeader><DialogTitle>{draft?.id ? 'Edit Animation Slot' : 'Add Animation Slot'}</DialogTitle></DialogHeader>
        {draft && <form aria-label={draft.id ? 'Edit Animation Slot' : 'New Animation Slot'} onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-3">
      <fieldset disabled={busy} className="grid gap-3 [&_input]:h-8 [&_input]:text-xs">
        <label className="space-y-1 text-xs">Name<Input autoFocus required maxLength={120} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
        <label className="grid gap-1 text-xs">Category<select aria-label="Slot Category" className="h-8 rounded border bg-background px-2" disabled={!!categoryError} value={draft.categoryId ?? ''} onChange={event => setDraft({ ...draft, categoryId: event.target.value ? Number(event.target.value) : null })}><option value="">Uncategorized</option>{draft.categoryId && !categories.some(category => category.id === draft.categoryId) && <option value={draft.categoryId} disabled>Category #{draft.categoryId} — refresh Categories</option>}{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        {categoryError && <p role="alert" className="text-sm text-destructive">{categoryError}<Button type="button" variant="outline" size="sm" onClick={() => setCategoryRefresh(value => value + 1)}>Retry Categories</Button></p>}
        {newCategory === null ? <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => setNewCategory('')}>New Category</Button> : <div className="space-y-2 rounded border p-2"><label className="grid gap-1 text-xs">New Category name<Input value={newCategory} maxLength={120} onChange={event => setNewCategory(event.target.value)} /></label><div className="flex gap-2"><Button type="button" size="sm" disabled={!newCategory.trim()} onClick={() => void createCategory()}>Create Category</Button><Button type="button" size="sm" variant="outline" onClick={() => setNewCategory(null)}>Cancel Category</Button></div></div>}
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} />Enabled</label>
        <div className="flex justify-end gap-2"><Button type="submit" size="sm" className="h-8 text-xs" disabled={!draft.name.trim() || !!categoryError}>{draft.id ? 'Update Slot' : 'Create Slot'}</Button><Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setDraft(null); setNewCategory(null); }}>Cancel</Button></div>
      </fieldset><p className="mt-2 text-xs text-muted-foreground">Assign clips in Character/Model Animations & Preview. Disabling retains mappings; renaming preserves slot identity.</p>
      {operationError && <p role="alert" className="text-sm text-destructive">{operationError}</p>}
    </form>}
      </DialogContent>
    </Dialog>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2"><span role="status">{loading ? 'Loading slots…' : error ? 'Slots unavailable' : `${filtered.length ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, filtered.length)} of ${filtered.length} Slots`}</span><span>|</span><span>{selected.size} selected</span>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || !!draft || !selected.size} onClick={() => void remove(deletable.filter(slot => selected.has(slot.id)))}>Delete selected ({selected.size})</Button><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button></div>
      <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Slots per page" className="rounded border bg-background p-1" disabled={busy || loading} value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}>{[25, 50, 100, 200].map(size => <option key={size}>{size}</option>)}</select></label>
        {(['First', 'Previous', 'Next', 'Last'] as const).map(text => <Button key={text} size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || (text === 'First' || text === 'Previous' ? page === 0 : page >= pages - 1)} onClick={() => setPage(text === 'First' ? 0 : text === 'Previous' ? page - 1 : text === 'Next' ? page + 1 : pages - 1)}>{text}</Button>)}<span>Page {page + 1} of {pages}</span></div>
    </div>
    <div role="region" aria-label="Animation Slot records" tabIndex={0} className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible">
      <Table className="min-w-[700px]"><TableHeader className="sticky top-0 z-10 bg-background"><TableRow>
        <TableHead className="w-8"><input type="checkbox" aria-label="Select unreferenced slots on this page" disabled={busy || loading || !!error || !deletable.length} checked={deletable.length > 0 && deletable.every(slot => selected.has(slot.id))} ref={input => { if (input) input.indeterminate = deletable.some(slot => selected.has(slot.id)) && !deletable.every(slot => selected.has(slot.id)); }} onChange={event => setSelected(event.target.checked ? new Set(deletable.map(slot => slot.id)) : new Set())} /></TableHead>
        {heading('name', 'Name')}{heading('categoryName', 'Category')}{heading('isActive', 'Enabled')}{heading('references', 'References')}<TableHead className="text-right text-xs">Actions</TableHead>
      </TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={6}>Loading Animation Slots…</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={6}><div role="alert" className="text-destructive">{error} <Button size="sm" variant="outline" onClick={() => setRefresh(value => value + 1)}>Retry</Button></div></TableCell></TableRow> : !visible.length ? <TableRow><TableCell colSpan={6}>No Animation Slots found. Use Add Slot to create an action.</TableCell></TableRow> : visible.map(slot => <TableRow key={slot.id}>
        <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${slot.name}`} disabled={busy || references(slot) > 0} checked={selected.has(slot.id)} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(slot.id); else next.delete(slot.id); return next; })} /></TableCell>
        <TableCell className="py-1 text-sm"><span className="flex items-center gap-2"><Clapperboard aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-500" />{slot.name}</span></TableCell><TableCell className="py-1 text-xs">{slot.categoryName ?? 'Uncategorized'}</TableCell><TableCell className="py-1">{slot.isActive ? <Check aria-label="Enabled" className="h-4 w-4 text-green-500" /> : <X aria-label="Disabled" className="h-4 w-4 text-gray-500" />}</TableCell><TableCell className="py-1 text-xs">{slot.modelUsage} Models · {slot.characterUsage} Characters · {slot.presetUsage} Presets</TableCell>
        <TableCell className="py-1"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${slot.name}`} disabled={busy || !!draft} onClick={() => { setOperationError(''); setNotice(''); setNewCategory(null); setDraft({ id: slot.id, name: slot.name, categoryId: slot.categoryId, isActive: slot.isActive }); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Delete ${slot.name}`} title={references(slot) ? 'Remove mappings or disable this slot instead' : 'Delete unreferenced slot'} disabled={busy || !!draft || references(slot) > 0} onClick={() => void remove([slot])}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
      </TableRow>)}</TableBody></Table>
    </div>
  </div>;
}
