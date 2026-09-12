'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LIBRARY_ACTIONS, type Assignment } from '@/lib/services/threed/animations/contracts';

type Clip = { id: number; name: string; fileName: string; clipIndex: number; isActive: boolean };
type Mapping = { assignments: Assignment[]; inherited: Assignment[]; animations: Clip[]; effective: { actionKey: string; source: string; state: string; animationId: number | null }[] };
async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Animation assignment request failed');
  return result;
}
const label = (key: string) => key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, first => first.toUpperCase());
const choice = (assignment?: Assignment) => !assignment ? 'inherit' : assignment.mode === 'disabled' ? 'disabled' : String(assignment.animationId);

export function CharacterAnimationAssignments({ characterId }: { characterId: number }) {
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [clips, setClips] = useState<Clip[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [libraryError, setLibraryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const endpoint = `/api/threed/animation-assignments?target=character&targetId=${characterId}`;
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setMapping(null);
    request(endpoint, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) { setMapping(result.data); setDrafts({}); }
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [endpoint, reload]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setLibraryError('');
    const timer = setTimeout(() => {
      request(`/api/threed/animations?limit=200&offset=${page * 200}&search=${encodeURIComponent(search)}&sort=name&direction=asc`, { signal: controller.signal })
        .then(result => { if (!controller.signal.aborted) { setClips(result.data); setTotal(result.pagination.total); } })
        .catch(err => { if (!controller.signal.aborted) setLibraryError(err.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, search, reload]);
  async function save(actionKey: string, value: string) {
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      if (value === 'inherit') await request(`${endpoint}&actionKey=${encodeURIComponent(actionKey)}`, { method: 'DELETE' });
      else await request('/api/threed/animation-assignments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'character', targetId: characterId, actionKey, mode: value === 'disabled' ? 'disabled' : 'assigned', animationId: value === 'disabled' ? null : Number(value) }) });
      const result = await request(endpoint);
      setMapping(result.data);
      setDrafts(previous => { const next = { ...previous }; delete next[actionKey]; return next; });
      setNotice(`${label(actionKey)} assignment saved.`);
    } catch (err) { setNotice(`${err instanceof Error ? err.message : 'Could not save'}. Refresh assignments to verify before retrying.`); }
    finally { setBusy(false); }
  }
  const available = new Map([...clips, ...(mapping?.animations ?? [])].map(clip => [clip.id, clip]));
  return <div className="space-y-3">
    <p className="text-sm">Assign shared library clips to this Character's actions. Each Save stores one action; Use defaults restores the linked Model's mapping or the existing default behavior.</p>
    <p className="text-sm text-amber-500">Reload the Scene after saving assignments. Clips must match the Character's rig; incompatible clips cannot be automatically retargeted.</p>
    <div className="flex flex-wrap items-center gap-2">
      <Input aria-label="Search animation choices" placeholder="Search animation files or names…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(0); }} className="h-8 flex-1 text-xs" />
      <Button asChild variant="outline" size="sm"><Link href="/admin/threed/animations">Animations Library</Link></Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => setReload(value => value + 1)}>Refresh assignments</Button>
    </div>
    <div className="flex items-center gap-2 text-xs"><span>{loading ? 'Loading choices…' : `${total} matching clips · page ${page + 1}`}</span><Button size="sm" variant="ghost" disabled={busy || loading || page === 0} onClick={() => setPage(value => value - 1)}>Previous choices</Button><Button size="sm" variant="ghost" disabled={busy || loading || (page + 1) * 200 >= total} onClick={() => setPage(value => value + 1)}>Next choices</Button></div>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {(error || libraryError) && <p role="alert" className="text-sm text-destructive">{error || libraryError}</p>}
    {!mapping ? <p>{error ? 'Assignments unavailable. Use Refresh assignments to retry.' : 'Loading assignments…'}</p> : <div className="space-y-2">
      {LIBRARY_ACTIONS.map(actionKey => {
        const assigned = mapping.assignments.find(row => row.actionKey === actionKey);
        const saved = choice(assigned);
        const value = drafts[actionKey] ?? saved;
        const effective = mapping.effective.find(row => row.actionKey === actionKey);
        const options = [...available.values()].filter(clip => clip.isActive || String(clip.id) === value);
        return <div key={actionKey} className="rounded border p-2">
          <label className="text-sm font-medium" htmlFor={`animation-${characterId}-${actionKey}`}>{label(actionKey)}</label>
          <div className="mt-1 flex items-center gap-2">
            <select id={`animation-${characterId}-${actionKey}`} className="h-8 min-w-0 flex-1 rounded border bg-background px-2 text-xs" disabled={busy || loading || !!libraryError} value={value} onChange={event => setDrafts(previous => ({ ...previous, [actionKey]: event.target.value }))}>
              <option value="inherit">Use defaults (Model / existing behavior)</option><option value="disabled">Disabled</option>
              {!['inherit', 'disabled'].includes(value) && !options.some(clip => String(clip.id) === value) && <option value={value} disabled>Selected clip #{value} — not in current choices</option>}
              {options.map(clip => <option key={clip.id} value={clip.id} disabled={!clip.isActive}>{clip.name} · {clip.fileName} · Clip {clip.clipIndex + 1}{!clip.isActive ? ' (inactive)' : ''}</option>)}
            </select>
            <Button size="sm" className="h-8 text-xs" disabled={busy || value === saved || loading || !!libraryError} onClick={() => void save(actionKey, value)}>Save</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Saved: {effective?.source === 'legacy' ? 'Existing default behavior' : `${effective?.source === 'model' ? 'Model default' : 'Character override'} · ${effective?.state}`}{effective?.animationId ? ` · ${available.get(effective.animationId)?.name ?? `Clip #${effective.animationId}`}` : ''}</p>
        </div>;
      })}
    </div>}
  </div>;
}
