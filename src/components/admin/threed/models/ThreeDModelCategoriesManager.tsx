'use client';

import { useEffect, useState } from 'react';
import { Edit, FolderTree, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ThreeDModelCategoryOption[]>([]);
  const [editing, setEditing] = useState<ThreeDModelCategoryOption | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/model-categories');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load categories');
      setCategories(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void loadCategories();
  }, [open]);

  function beginCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function beginEdit(category: ThreeDModelCategoryOption) {
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
    if (!form.name.trim()) return showToast('Category name is required', 'error');
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
      beginCreate();
      await loadCategories();
      onChanged?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: ThreeDModelCategoryOption) {
    if (!confirm(`Delete category "${category.name}"? Model records will remain.`)) return;
    try {
      const response = await fetch(`/api/threed/model-categories?id=${category.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to delete category');
      showToast('Category deleted', 'success');
      if (editing?.id === category.id) beginCreate();
      await loadCategories();
      onChanged?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete category', 'error');
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs">
            <FolderTree className="mr-1 h-3 w-3" /> Categories
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>ThreeD Model Categories</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Taxonomy</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={beginCreate}>
                  <Plus className="mr-1 h-3 w-3" /> New
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : categories.length === 0 ? (
                <p className="rounded border p-3 text-xs text-muted-foreground">No categories yet.</p>
              ) : (
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{category.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{category.slug}{!category.isActive ? ' · inactive' : ''}</div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => beginEdit(category)} title="Edit category">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => void deleteCategory(category)} title="Delete category">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3 rounded border p-3">
              <Label>{editing ? `Edit ${editing.name}` : 'Create Category'}</Label>
              <Input value={form.name} placeholder="Name" onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <Input value={form.slug} placeholder="Slug (generated from name if empty)" onChange={(event) => setForm({ ...form, slug: event.target.value })} />
              <Input value={form.description} placeholder="Description" onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <Select value={form.parentId} onValueChange={(parentId) => setForm({ ...form, parentId })}>
                <SelectTrigger><SelectValue placeholder="Parent category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent</SelectItem>
                  {categories.filter((category) => category.id !== editing?.id).map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" value={form.sortOrder} placeholder="Sort order" onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} />
                <Label>Active</Label>
              </div>
              <Button type="button" className="w-full" disabled={saving} onClick={() => void saveCategory()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
