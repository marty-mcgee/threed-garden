'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
export function AnimationCategoryEditor({ animation, categories, onSaved, onClose }: { animation: { id: number; name: string; categoryIds?: number[] }; categories: AnimationCategory[]; onSaved: () => void; onClose: () => void }) {
  const [ids, setIds] = useState(animation.categoryIds ?? []), [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Categories — {animation.name}</DialogTitle></DialogHeader><section className="text-xs" aria-label="Assign Animation Categories">
    <div className="flex max-h-32 flex-wrap gap-3 overflow-auto">{categories.length ? categories.map(c => <label key={c.id} className="flex items-center gap-1"><input type="checkbox" disabled={busy} checked={ids.includes(c.id)} onChange={e => setIds(previous => e.target.checked ? [...previous, c.id] : previous.filter(id => id !== c.id))} />{c.name}</label>) : 'Create a category using Manage Categories first.'}</div>
    <div className="mt-2 flex gap-2"><Button size="sm" disabled={busy} onClick={async () => {
      setBusy(true); setError('');
      try { const response = await fetch('/api/threed/animation-categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ animationId: animation.id, categoryIds: ids }) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'Save failed'); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); } finally { setBusy(false); }
    }}>Save categories</Button><Button size="sm" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button></div>{error && <p role="alert" className="text-destructive">{error}</p>}
  </section></DialogContent></Dialog>;
}
