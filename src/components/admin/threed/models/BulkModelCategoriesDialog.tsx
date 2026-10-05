'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ThreeDModelCategoryOption } from './ThreeDModelCategoriesManager';
import { buildCategoryTree, flattenCategoryTree } from './category-tree-core';
import { updateBulkModelCategories, type BulkCategoryMode } from './bulk-model-categories-core';

export function BulkModelCategoriesDialog({ targets, categories, onClose, onComplete }: {
  targets: { id: number; modelName: string }[]; categories: ThreeDModelCategoryOption[];
  onClose: () => void; onComplete: (result: { updated: number; failures: string[] }) => Promise<void>;
}) {
  const [mode, setMode] = useState<BulkCategoryMode>('add');
  const [chosen, setChosen] = useState<number[]>([]);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const rows = flattenCategoryTree(buildCategoryTree(categories.filter(category => category.isActive), '', { field: 'order', direction: 'asc' }), collapsed, category => category.id);
  async function apply() {
    if (lock.current || !targets.length || (mode !== 'replace' && !chosen.length)) return;
    lock.current = true; setBusy(true);
    try { await onComplete(await updateBulkModelCategories(targets, chosen, mode)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent showCloseButton={!busy} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }} className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>Update Categories — {targets.length} Models</DialogTitle><DialogDescription>Apply category assignments to the selected Models. Parent and child categories are independent.</DialogDescription></DialogHeader>
      <fieldset disabled={busy} className="space-y-3">
        <label className="block space-y-1 text-sm"><span>Update mode</span><select className="w-full rounded-md border bg-background p-2" value={mode} onChange={event => setMode(event.target.value as BulkCategoryMode)}>
          <option value="add">Add categories — keep existing assignments</option><option value="remove">Remove selected categories</option><option value="replace">Replace all categories</option>
        </select></label>
        {mode === 'replace' && <p className="text-sm text-muted-foreground">This replaces every selected Model’s categories. Selecting none clears all category assignments.</p>}
        <ul aria-label="Bulk Model category hierarchy" className="max-h-[40dvh] space-y-1 overflow-auto rounded-md border p-2">
          {rows.map(({ category, depth, hasChildren }) => <li key={category.id} style={{ paddingLeft: depth * 20 }} className="flex items-center gap-1 text-sm">
            {hasChildren ? <Button type="button" size="icon" variant="ghost" className="h-6 w-6 shrink-0" aria-expanded={!collapsed.has(category.id)} aria-label={`${collapsed.has(category.id) ? 'Expand' : 'Collapse'} ${category.name}`} onClick={() => setCollapsed(current => { const next = new Set(current); if (next.has(category.id)) next.delete(category.id); else next.add(category.id); return next; })}>{collapsed.has(category.id) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button> : <span className="w-6 shrink-0" />}
            <label className="flex items-center gap-2 py-1"><input type="checkbox" checked={chosen.includes(category.id)} onChange={() => setChosen(current => current.includes(category.id) ? current.filter(id => id !== category.id) : [...current, category.id])} />{category.name}</label>
          </li>)}
          {!rows.length && <li className="text-sm text-muted-foreground">No active categories available.</li>}
        </ul>
        <p className="text-xs text-muted-foreground">{chosen.length} categories selected. Updates save separately for each Model.</p>
      </fieldset>
      <DialogFooter className="sm:justify-start"><Button variant="success" disabled={busy || !targets.length || (mode !== 'replace' && !chosen.length)} onClick={() => void apply()}>{busy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Updating…</> : `Apply to ${targets.length} Models`}</Button><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
