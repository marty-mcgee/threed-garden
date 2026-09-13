'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export type AnimationCategory = { id: number; name: string };
export function useAnimationCategories(refresh = 0) {
  const [categories, setCategories] = useState<AnimationCategory[]>([]), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/threed/animation-categories', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Categories unavailable');
      if (!controller.signal.aborted) { setCategories(result.data); setError(''); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [refresh]);
  return { categories, error };
}
export function AnimationCategoryManager({ categories, onChanged }: { categories: AnimationCategory[]; onChanged: () => void }) {
  const [name, setName] = useState(''), [id, setId] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function save(remove = false) {
    if (remove && !confirm('Delete this category? Animations and action mappings remain unchanged.')) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/threed/animation-categories${remove ? `?id=${id}` : ''}`, { method: remove ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, ...(remove ? {} : { body: JSON.stringify({ name, ...(id ? { id: Number(id) } : {}) }) }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Category update failed');
      setName(''); setId(''); onChanged();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Category update failed'); } finally { setBusy(false); }
  }
  return <section className="shrink-0 rounded border p-2 text-xs" aria-label="Manage Animation Categories">
    <p className="mb-2">Categories organize clips. They do not assign actions or guarantee rig compatibility.</p>
    <div className="flex flex-wrap gap-2"><select aria-label="Category to edit" className="h-8 min-w-48 rounded border bg-background px-2" value={id} disabled={busy} onChange={e => { setId(e.target.value); setName(categories.find(c => c.id === Number(e.target.value))?.name ?? ''); }}><option value="">New category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <Input aria-label="Category name" placeholder="e.g. Farming" className="h-8 max-w-xs text-xs" value={name} maxLength={120} disabled={busy} onChange={e => setName(e.target.value)} />
      <Button size="sm" disabled={busy || !name.trim()} onClick={() => void save()}>{id ? 'Rename category' : 'Create category'}</Button><Button size="sm" variant="outline" disabled={busy || !id} onClick={() => void save(true)}>Delete category</Button>
    </div>{message && <p role="status">{message}</p>}
  </section>;
}
export function AnimationCategoryEditor({ animation, categories, onSaved, onClose }: { animation: { id: number; name: string; categoryIds?: number[] }; categories: AnimationCategory[]; onSaved: () => void; onClose: () => void }) {
  const [ids, setIds] = useState(animation.categoryIds ?? []), [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <section className="shrink-0 rounded border p-2 text-xs" aria-label="Assign Animation Categories"><p className="mb-2 font-medium">Categories — {animation.name}</p>
    <div className="flex max-h-32 flex-wrap gap-3 overflow-auto">{categories.length ? categories.map(c => <label key={c.id} className="flex items-center gap-1"><input type="checkbox" disabled={busy} checked={ids.includes(c.id)} onChange={e => setIds(previous => e.target.checked ? [...previous, c.id] : previous.filter(id => id !== c.id))} />{c.name}</label>) : 'Create a category using Manage Categories first.'}</div>
    <div className="mt-2 flex gap-2"><Button size="sm" disabled={busy} onClick={async () => {
      setBusy(true); setError('');
      try { const response = await fetch('/api/threed/animation-categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ animationId: animation.id, categoryIds: ids }) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'Save failed'); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); } finally { setBusy(false); }
    }}>Save categories</Button><Button size="sm" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button></div>{error && <p role="alert">{error}</p>}
  </section>;
}
