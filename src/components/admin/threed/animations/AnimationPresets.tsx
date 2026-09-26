'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AnimationActionSlot } from '@/libraries/services/threed/animations/action-slots';
import type { Assignment } from '@/libraries/services/threed/animations/contracts';

type Preset = { id: number; name: string; description: string | null; revision: number };
type Review = { reviewToken: string; animations: { id: number; name: string }[]; review: (Assignment & { current: Assignment | null; source: string; outcome: string })[] };
async function request(url: string, method = 'GET', body?: unknown) {
  const response = await fetch(url, { method, cache: 'no-store', ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Preset request failed');
  return result.data;
}
export function AnimationPresets({ target, targetId, assignments, inherited, dirty, disabled, onBusyChange, onApplied, slots = [] }: {
  slots?: AnimationActionSlot[]; target: string; targetId: number; assignments: Assignment[]; inherited: Assignment[]; dirty: boolean; disabled: boolean; onBusyChange: (busy: boolean) => void; onApplied: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [presets, setPresets] = useState<Preset[]>([]), [selected, setSelected] = useState('');
  const [name, setName] = useState('Farmer Actions'), [strategy, setStrategy] = useState('fill');
  const [review, setReview] = useState<Review | null>(null);
  const current = presets.find(row => row.id === Number(selected));
  async function run(operation: () => Promise<void>) { setBusy(true); onBusyChange(true); setMessage(''); try { await operation(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Preset request failed'); } finally { setBusy(false); onBusyChange(false); } }
  async function refresh() { setPresets(await request('/api/threed/animation-presets')); setReview(null); }
  const rows = [...new Map([...inherited, ...assignments].map(row => [row.actionKey, { actionKey: row.actionKey, mode: row.mode, animationId: row.animationId }])).values()];
  const payload = { presetId: Number(selected), target, targetId, strategy };
  return <section className="min-w-0 shrink-0 text-xs">
    <Button size="sm" variant="outline" disabled={busy || disabled} onClick={() => { setOpen(!open); if (!open) void run(refresh); }}>Animation Mapping Presets</Button>
    {open && <div className="mt-2 space-y-2">
      <p>Save your saved mappings as a reusable preset. Inherited Model mappings are included; built-in fallback animations are omitted. Applied mappings remain independent of the preset.</p>
      {dirty && <p className="text-amber-500">Save or discard your changed action selections before using presets.</p>}
      <fieldset disabled={busy || disabled || dirty} className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Input aria-label="Preset name" value={name} maxLength={120} onChange={e => setName(e.target.value)} className="h-8 max-w-xs text-xs" />
          <Button size="sm" disabled={!rows.length || !name.trim()} onClick={() => void run(async () => { const saved = await request('/api/threed/animation-presets', 'POST', { name, entries: rows }); await refresh(); setSelected(String(saved.id)); setMessage('Preset saved.'); })}>Save Mappings as Preset</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Animation preset" className="h-8 min-w-48 rounded border bg-background px-2" value={selected} onChange={e => { setSelected(e.target.value); setName(presets.find(p => p.id === Number(e.target.value))?.name ?? 'Farmer Actions'); setReview(null); }}><option value="">Choose preset…</option>{presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select aria-label="Preset application mode" className="h-8 rounded border bg-background px-2" value={strategy} onChange={e => { setStrategy(e.target.value); setReview(null); }}><option value="fill">Fill unmapped actions</option><option value="replace">Replace matching actions</option></select>
          <Button size="sm" variant="outline" disabled={!current} onClick={() => void run(async () => setReview(await request('/api/threed/animation-presets/apply', 'POST', payload)))}>Review Apply Preset</Button>
          <Button size="sm" variant="outline" disabled={!current || !rows.length} onClick={() => { if (current && confirm(`Replace the saved entries in “${current.name}” with these saved mappings?`)) void run(async () => { await request('/api/threed/animation-presets', 'PUT', { id: current.id, revision: current.revision, name: name.trim() || current.name, description: current.description, entries: rows }); await refresh(); setMessage('Preset updated. Previously applied assignments are unchanged.'); }); }}>Update selected preset</Button>
          <Button size="sm" variant="outline" disabled={!current} onClick={() => { if (current && confirm(`Delete preset “${current.name}”? Applied assignments remain.`)) void run(async () => { await request(`/api/threed/animation-presets?id=${current.id}&revision=${current.revision}`, 'DELETE'); await refresh(); setSelected(''); }); }}>Delete preset</Button>
        </div>
        {review && <div className="max-h-64 overflow-auto rounded border p-2">
          <table className="w-full text-left"><thead><tr><th>Action</th><th>Current mapping</th><th>Preset mapping</th><th>Result</th></tr></thead><tbody>{review.review.map(row => {
            const clipName = (id: number | null) => review.animations.find(c => c.id === id)?.name || `Unavailable clip #${id}`;
            return <tr key={row.actionKey} className="border-t"><td className="py-1">{slots.find(slot => slot.actionKey === row.actionKey)?.name ?? row.actionKey.replace(/([a-z])([A-Z])/g, '$1 $2')}</td><td>{row.source}: {row.current ? row.current.mode === 'disabled' ? 'Disabled' : clipName(row.current.animationId) : 'Use existing behavior'}</td><td>{row.mode === 'disabled' ? 'Disabled' : clipName(row.animationId)}</td><td>{row.outcome}</td></tr>;
          })}</tbody></table>
          <Button size="sm" className="mt-2" disabled={review.review.some(r => r.outcome === 'conflict') || !review.review.some(r => r.outcome === 'apply')} onClick={() => void run(async () => { await request('/api/threed/animation-presets/apply', 'POST', { ...payload, reviewToken: review.reviewToken }); setReview(null); await onApplied(); setMessage('Preset applied. Reload the Scene to use saved mappings.'); })}>Apply reviewed mappings</Button>
        </div>}
      </fieldset>
    </div>}
    {message && <p role="status" className="mt-2">{message}</p>}
  </section>;
}
