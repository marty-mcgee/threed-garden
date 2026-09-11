'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Check, X, Clapperboard, FolderOpen, FolderTree, Images, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { CategorySortField } from '@/lib/services/threed/models/category-list-query';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

export interface ThreeDModelCategoryOption {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: '', slug: '', description: '', parentId: 'none', sortOrder: '0', isActive: true,
};

export function ThreeDModelCategoriesManager({ onChanged }: { onChanged?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [categories, setCategories] = useState<ThreeDModelCategoryOption[]>([]);
  const [editing, setEditing] = useState<ThreeDModelCategoryOption | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ThreeDModelCategoryOption[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: CategorySortField; direction: 'asc' | 'desc' }>({ field: 'order', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [report, setReport] = useState('');
  const [listError, setListError] = useState('');
  const [revision, setRevision] = useState(0);
  const mutationLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setListError('');
    setSelected(new Set());
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search, sort: sort.field, direction: sort.direction });
    void fetch(`/api/threed/model-categories?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!current) return;
        if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load categories');
        const count = Number(result.pagination.total);
        setTotal(count);
        const last = Math.max(0, Math.ceil(count / pageSize) - 1);
        if (page > last) { setPage(last); return; }
        setRows(result.data);
      }).catch((error) => { if (current) { setRows([]); setListError(error.message || 'Failed to load categories'); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; controller.abort(); };
  }, [page, pageSize, search, sort.field, sort.direction, revision]);

  async function loadCategories() {
    try {
      const response = await fetch('/api/threed/model-categories', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load categories');
      setCategories(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load categories', 'error');
    }
  }

  useEffect(() => {
    void loadCategories();
    // Category loading belongs to this mounted workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginCreate() {
    setOpen(true);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function beginEdit(category: ThreeDModelCategoryOption) {
    setOpen(true);
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentId: category.parentId ? String(category.parentId) : 'none',
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  async function saveCategory() {
    if (mutationLock.current) return;
    if (!form.name.trim()) return showToast('Category name is required', 'error');
    mutationLock.current = true;
    setSaving(true);
    try {
      const response = await fetch(`/api/threed/model-categories${editing ? `?id=${editing.id}` : ''}`, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || form.name,
          description: form.description,
          parentId: form.parentId === 'none' ? null : Number(form.parentId),
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save category');
      showToast(editing ? 'Category updated' : 'Category created', 'success');
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadCategories();
      setRevision((value) => value + 1);
      onChanged?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save category', 'error');
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  async function deleteCategories(targets: ThreeDModelCategoryOption[]) {
    if (mutationLock.current || !targets.length) return;
    if (!confirm(`Delete ${targets.length} categor${targets.length === 1 ? 'y' : 'ies'}?\n${targets.map((entry) => entry.name).join('\n')}\nModel records remain. Categories with children cannot be deleted.`)) return;
    mutationLock.current = true;
    setDeleting(true);
    const errors: string[] = [];
    let deleted = 0;
    try {
      for (const category of targets) {
        try {
          const response = await fetch(`/api/threed/model-categories?id=${category.id}`, { method: 'DELETE', signal: AbortSignal.timeout(30000) });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || 'Deletion not confirmed');
          deleted++;
        } catch (error) { errors.push(`${category.name}: ${error instanceof Error ? error.message : 'Deletion not confirmed'}`); }
      }
      setReport(`${deleted} of ${targets.length} deleted. ${errors.join(' · ')}`);
      await loadCategories();
      setRevision((value) => value + 1);
      if (deleted) onChanged?.();
    } finally { mutationLock.current = false; setDeleting(false); }
  }

  function heading(field: CategorySortField, label: string) {
    const active = sort.field === field;
    const Icon = active ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead aria-sort={active ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
      <button type="button" disabled={deleting || saving} className="flex items-center gap-1 text-xs" onClick={() => {
        setPage(0); setSelected(new Set()); setSort({ field, direction: active && sort.direction === 'asc' ? 'desc' : 'asc' });
      }}>{label}<Icon aria-hidden="true" className="h-3 w-3" /></button>
    </TableHead>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {ToastComponent}
      <fieldset disabled={deleting || saving} className="shrink-0 min-w-0">
        <AdminWorkspaceHeader icon={FolderTree} title="Model Categories" description="Organize reusable Models with owner-scoped relational taxonomy">
          <span className="rounded bg-muted px-2 text-xs">{total}</span>
          <Input aria-label="Search categories" placeholder="Search name, slug or description…" value={search} className="h-7 min-w-48 flex-1 text-xs" onChange={(event) => { setPage(0); setSelected(new Set()); setSearch(event.target.value); }} />
          <Button size="sm" className="h-7 text-xs" onClick={beginCreate}><Plus className="h-3 w-3" />Add Category</Button>
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-animations" icon={Clapperboard}>Model Animations</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-files" icon={FolderOpen}>Model Files</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-textures" icon={Images}>Model Textures</AdminWorkspaceLink>
        </AdminWorkspaceHeader>
      </fieldset>
      <nav aria-label="Category pagination" className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span role="status">{loading ? 'Loading…' : total ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total} Categories` : '0 Categories'}</span>
          <span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading || deleting || saving || !selected.size} onClick={() => void deleteCategories(rows.filter((row) => selected.has(row.id)))}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={deleting || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label>Per page <select aria-label="Categories per page" className="rounded border bg-background p-1" disabled={loading || deleting || saving} value={pageSize} onChange={(event) => { setPage(0); setPageSize(Number(event.target.value)); }}>
            {[25, 50, 100, 200].map((size) => <option key={size}>{size}</option>)}
          </select></label>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || saving || page === 0} onClick={() => setPage(0)}>First</Button>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || saving || page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <span>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || saving || (page + 1) * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</Button>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || saving || (page + 1) * pageSize >= total} onClick={() => setPage(Math.max(0, Math.ceil(total / pageSize) - 1))}>Last</Button>
        </div>
      </nav>
      {report && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{report}</p>}
      {listError && <p role="alert" className="text-sm text-destructive">{listError} <button className="underline" onClick={() => setRevision((value) => value + 1)}>Retry</button></p>}
      <div role="region" aria-label="Category records" tabIndex={0} className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[800px]">
          <TableHeader className="sticky top-0 z-10 bg-background"><TableRow>
            <TableHead className="w-8"><input type="checkbox" aria-label="Select all categories on this page" disabled={loading || deleting || saving || !rows.length} checked={rows.length > 0 && rows.every((row) => selected.has(row.id))}
              ref={(element) => { if (element) element.indeterminate = rows.some((row) => selected.has(row.id)) && !rows.every((row) => selected.has(row.id)); }}
              onChange={(event) => setSelected(event.target.checked ? new Set(rows.map((row) => row.id)) : new Set())} /></TableHead>
            {heading('name', 'Name')}{heading('slug', 'Slug')}{heading('parent', 'Parent')}{heading('order', 'Order')}{heading('active', 'Active')}<TableHead className="text-right text-xs">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7}>Loading categories…</TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={7}>{listError ? 'Categories could not be loaded.' : 'No categories found.'}</TableCell></TableRow> : rows.map((category) => <TableRow key={category.id}>
              <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${category.name}`} disabled={deleting || saving} checked={selected.has(category.id)} onChange={(event) => { const next = new Set(selected); if (event.target.checked) next.add(category.id); else next.delete(category.id); setSelected(next); }} /></TableCell>
              <TableCell className="py-1 text-sm"><span className="font-medium">{category.name}</span>{category.description && <p className="max-w-sm truncate text-xs text-muted-foreground" title={category.description}>{category.description}</p>}</TableCell>
              <TableCell className="py-1 text-xs">{category.slug}</TableCell><TableCell className="py-1 text-xs">{category.parentId ? categories.find((entry) => entry.id === category.parentId)?.name ?? `Category #${category.parentId}` : '—'}</TableCell>
              <TableCell className="py-1 text-xs">{category.sortOrder}</TableCell><TableCell className="py-1">{category.isActive ? <Check aria-label="Active" className="h-4 w-4 text-green-600" /> : <X aria-label="Inactive" className="h-4 w-4 text-gray-400" />}</TableCell>
              <TableCell className="py-1 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" disabled={deleting || saving} aria-label={`Edit ${category.name}`} onClick={() => beginEdit(category)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" disabled={deleting || saving} aria-label={`Delete ${category.name}`} onClick={() => void deleteCategories([category])}><Trash2 className="h-4 w-4" /></Button></TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? `Edit ${editing.name}` : 'Create Category'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
              <Input disabled={saving} value={form.name} aria-label="Category name" placeholder="Name" onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <Input disabled={saving} value={form.slug} aria-label="Category slug" placeholder="Slug (generated from name if empty)" onChange={(event) => setForm({ ...form, slug: event.target.value })} />
              <Input disabled={saving} value={form.description} aria-label="Category description" placeholder="Description" onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <Select disabled={saving} value={form.parentId} onValueChange={(parentId) => setForm({ ...form, parentId })}>
                <SelectTrigger aria-label="Parent category"><SelectValue placeholder="Parent category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent</SelectItem>
                  {categories.filter((category) => category.id !== editing?.id).map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input disabled={saving} type="number" value={form.sortOrder} aria-label="Category sort order" placeholder="Sort order" onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
              <div className="flex items-center gap-2">
                <Switch aria-label="Category active" disabled={saving} checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} />
                <Label>Active</Label>
              </div>
              <Button type="button" className="w-full" disabled={saving} onClick={() => void saveCategory()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? 'Update Category' : 'Create Category'}
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
