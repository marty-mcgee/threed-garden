'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimationPresets } from './AnimationPresets';
import { useAnimationCategories } from './AnimationCategories';
import type { AnimationActionSlot } from '@/lib/services/threed/animations/action-slots';
import { LIBRARY_ACTIONS, type Assignment } from '@/lib/services/threed/animations/contracts';

type Clip = { id: number; name: string; fileName: string; clipIndex: number; isActive: boolean };
type Mapping = { slots?: AnimationActionSlot[]; modelId: number | null; assignments: Assignment[]; inherited: Assignment[]; animations: Clip[]; effective: { actionKey: string; source: string; state: string; animationId: number | null }[] };
async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Animation assignment request failed');
  return result;
}
const label = (key: string) => key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, first => first.toUpperCase());
const choice = (assignment?: Assignment) => !assignment ? 'inherit' : assignment.mode === 'disabled' ? 'disabled' : String(assignment.animationId);

type AssignmentTargetProps = { characterId: number; modelId?: never } | { modelId: number; characterId?: never };
export function ModelAnimationAssignments({ modelId }: { modelId: number }) {
  return <CharacterAnimationAssignments modelId={modelId} />;
}

export function CharacterAnimationAssignments(props: AssignmentTargetProps) {
  const target = props.modelId !== undefined ? 'model' : 'character';
  const targetId = props.modelId ?? props.characterId;
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [clips, setClips] = useState<Clip[]>([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const { categories, error: categoryError } = useAnimationCategories();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [libraryError, setLibraryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<{ actionKey: string; animationId: number } | null>(null);
  const previewFrame = useRef<HTMLIFrameElement>(null);
  const [previewClips, setPreviewClips] = useState<Clip[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewLibraryError, setPreviewLibraryError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setPreviewLoading(true); setPreviewLibraryError('');
    void (async () => {
      const collected = new Map<number, Clip>();
      let offset = 0;
      try {
        while (!controller.signal.aborted) {
          const result = await request(`/api/threed/animations?limit=200&offset=${offset}&sort=name&direction=asc`, { signal: controller.signal });
          if (controller.signal.aborted) return;
          for (const clip of result.data as Clip[]) collected.set(clip.id, clip);
          offset += result.data.length;
          if (offset >= result.pagination.total || !result.data.length) break;
        }
        if (!controller.signal.aborted) setPreviewClips([...collected.values()]);
      } catch (cause) {
        if (!controller.signal.aborted) setPreviewLibraryError(cause instanceof Error ? cause.message : 'Animation choices unavailable');
      } finally { if (!controller.signal.aborted) setPreviewLoading(false); }
    })();
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const send = () => previewFrame.current?.contentWindow?.postMessage({ type: 'threed-preview-animation', animationId: preview?.animationId ?? null }, window.location.origin);
    const ready = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === previewFrame.current?.contentWindow && event.data?.type === 'threed-preview-ready') send();
    };
    window.addEventListener('message', ready);
    send();
    return () => window.removeEventListener('message', ready);
  }, [preview]);
  const endpoint = `/api/threed/animation-assignments?target=${target}&targetId=${targetId}`;
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
      request(`/api/threed/animations?limit=200&offset=${page * 200}&search=${encodeURIComponent(search)}&sort=name&direction=asc${category ? `&categoryId=${category}` : ''}`, { signal: controller.signal })
        .then(result => { if (!controller.signal.aborted) { setClips(result.data); setTotal(result.pagination.total); } })
        .catch(err => { if (!controller.signal.aborted) setLibraryError(err.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, search, reload, category]);
  async function save(actionKey: string, value: string) {
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      if (value === 'inherit') await request(`${endpoint}&actionKey=${encodeURIComponent(actionKey)}`, { method: 'DELETE' });
      else await request('/api/threed/animation-assignments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, targetId, actionKey, mode: value === 'disabled' ? 'disabled' : 'assigned', animationId: value === 'disabled' ? null : Number(value) }) });
      const result = await request(endpoint);
      setMapping(result.data);
      setDrafts(previous => { const next = { ...previous }; delete next[actionKey]; return next; });
      setNotice(`${mapping?.slots?.find(slot => slot.actionKey === actionKey)?.name ?? label(actionKey)} assignment saved.`);
    } catch (err) { setNotice(`${err instanceof Error ? err.message : 'Could not save'}. Refresh assignments to verify before retrying.`); }
    finally { setBusy(false); }
  }
  const [slotSearch, setSlotSearch] = useState('');
  const [slotGroup, setSlotGroup] = useState('');
  const slotName = (key: string) => mapping?.slots?.find(slot => slot.actionKey === key)?.name ?? label(key);
  const actionKeys = [...new Set([...(mapping?.slots ?? []).slice().sort((a, b) => (a.categoryName ?? 'Uncategorized').localeCompare(b.categoryName ?? 'Uncategorized') || a.name.localeCompare(b.name)).map(slot => slot.actionKey), ...LIBRARY_ACTIONS, ...(mapping?.assignments ?? []).map(row => row.actionKey), ...(mapping?.inherited ?? []).map(row => row.actionKey)])].filter(key => {
    const slot = mapping?.slots?.find(slot => slot.actionKey === key);
    const group = slot ? slot.categoryName ?? 'Uncategorized' : 'Built-in Actions';
    return (!slotGroup || slotGroup === group) && `${slotName(key)} ${group}`.toLowerCase().includes(slotSearch.trim().toLowerCase());
  });
  const available = new Map([...previewClips, ...clips, ...(mapping?.animations ?? [])].map(clip => [clip.id, clip]));
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
    <div className="flex shrink-0 flex-wrap items-start gap-3">
    {mapping && <AnimationPresets key={`${target}-${targetId}`} target={target} targetId={targetId} slots={mapping.slots ?? []} assignments={mapping.assignments} inherited={mapping.inherited} dirty={Object.entries(drafts).some(([key, value]) => value !== choice(mapping.assignments.find(row => row.actionKey === key)))} disabled={busy} onBusyChange={setBusy} onApplied={async () => { const result = await request(endpoint); setMapping(result.data); setDrafts({}); }} />}
    <details className="shrink-0 text-xs text-muted-foreground">
      <summary className="cursor-pointer">Assignment help</summary>
    <div className="shrink-0 space-y-2 text-xs text-muted-foreground">
      <p>{target === 'character'
        ? 'Choose an animation for an action → Preview animation → Save that action. Reload the Scene to use saved changes.'
        : 'Optionally assign shared animation defaults to this Model. Character overrides take precedence. Each Save stores one action.'}</p>
      {target === 'model' && <p>Static Models require no assignments; generic Scene Model playback is not implemented yet.</p>}
      <p>Action slots are named behaviors; choose a clip and Save to assign it, Disabled to turn it off, or Use defaults to restore inheritance. Custom slots play animation only; they do not change the world. Mapping Presets save collections of slot assignments.</p>
      <p>Use defaults keeps existing behavior. Disabled turns an action off. {target === 'character' && 'Preview requires an active uploaded animation and does not save changes.'}</p>
      {mapping && target === 'character' && <p>
        Character override → linked Model default → existing animation behavior.
        {mapping.modelId ? <> <Link className="underline" href={`/admin/threed/model-files?modelId=${mapping.modelId}`}>View linked Model #{mapping.modelId}</Link></> : ' No linked Model defaults.'}
      </p>}
    </div>
    </details>
    </div>
    <Button asChild variant="outline" size="sm" className="self-start"><Link href="/admin/threed/animation-slots">Manage Slots</Link></Button>
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Input aria-label="Search animation choices" placeholder="Search animation files or names…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(0); }} className="h-8 min-w-0 w-64 max-w-full text-xs" />
      <select aria-label="Filter animation choices by category" className="h-8 min-w-40 rounded border bg-background px-2 text-xs" value={category} disabled={busy || !!categoryError} onChange={e => { setCategory(e.target.value); setPage(0); }}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <Button asChild variant="outline" size="sm"><Link href="/admin/threed/animations">Animations Library</Link></Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => setReload(value => value + 1)}>Refresh assignments</Button>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs"><span>{loading ? 'Loading choices…' : `${total} matching clips · page ${page + 1}`}</span><Button size="sm" variant="ghost" disabled={busy || loading || page === 0} onClick={() => setPage(value => value - 1)}>Previous choices</Button><Button size="sm" variant="ghost" disabled={busy || loading || (page + 1) * 200 >= total} onClick={() => setPage(value => value + 1)}>Next choices</Button></div>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {categoryError && <p role="alert" className="text-xs text-orange-500">{categoryError}</p>}
    {(error || libraryError) && <p role="alert" className="text-sm text-destructive">{error || libraryError}</p>}
    <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
    <aside className="flex min-h-[300px] min-w-0 flex-col rounded border bg-background/50 lg:min-h-0" aria-label={`${target} animation preview`}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b p-3">
        <h3 className="text-sm font-medium">{preview ? `Preview: ${slotName(preview.actionKey)}` : target === 'model' ? 'Model Preview' : 'Character Preview'}</h3>
        {preview && <Button size="sm" variant="outline" className="text-xs" onClick={() => setPreview(null)}>T-Pose</Button>}
      </div>
    <section className="shrink-0 border-b p-2" aria-label="Independent animation preview">
      <label className="block text-sm font-medium" htmlFor={`preview-animation-${target}-${targetId}`}>Preview any animation</label>
      <select id={`preview-animation-${target}-${targetId}`} className="mt-1 h-9 w-full rounded border bg-background px-2 text-sm"
        disabled={previewLoading || !!previewLibraryError} value={preview?.animationId ?? ''}
        onChange={event => setPreview(event.target.value ? { actionKey: 'Library animation', animationId: Number(event.target.value) } : null)}>
        <option value="">T-Pose</option>
        {preview && !previewClips.some(clip => clip.id === preview.animationId) && <option value={preview.animationId}>{available.get(preview.animationId)?.name ?? `Animation #${preview.animationId}`}</option>}
        {previewClips.map(clip => <option key={clip.id} value={clip.id} disabled={!clip.isActive}>{clip.name} · {clip.fileName} · Clip {clip.clipIndex + 1}{clip.isActive ? '' : ' (inactive)'}</option>)}
      </select>
      {previewLoading && <p role="status" className="mt-1 text-xs text-muted-foreground">Loading all animation choices…</p>}
      {previewLibraryError && <p role="alert" className="mt-1 text-xs text-destructive">{previewLibraryError}</p>}
      <p className="mt-1 text-xs text-muted-foreground">Preview only · Does not save Action assignments.</p>
    </section>
      <p className="break-words px-3 pt-2 text-xs text-muted-foreground">{preview ? available.get(preview.animationId)?.name : 'T-Pose · Choose an animation to preview.'}</p>
      <iframe ref={previewFrame} key={targetId} onLoad={() => previewFrame.current?.contentWindow?.postMessage({ type: 'threed-preview-animation', animationId: preview?.animationId ?? null }, window.location.origin)} title={`${target === 'model' ? 'Model' : 'Character'} animation preview`} className="min-h-[360px] w-full flex-1 border-0 lg:min-h-0" src={`/threed/character-animation-preview?${target}Id=${targetId}`} />
    </aside>
    {!mapping ? <p>{error ? 'Assignments unavailable. Use Refresh assignments to retry.' : 'Loading assignments…'}</p> : <div className="min-h-0 min-w-0 space-y-2 lg:overflow-y-auto lg:pr-2" aria-label="Animation action assignments">
      <div className="flex flex-wrap items-center gap-2 rounded border p-2">
        <Input aria-label="Search Action Slots" placeholder="Search action slots…" className="h-8 min-w-0 flex-1 text-xs" value={slotSearch} disabled={busy} onChange={event => setSlotSearch(event.target.value)} />
        <select aria-label="Filter Action Slots by category" className="h-8 max-w-full rounded border bg-background px-2 text-xs" value={slotGroup} disabled={busy} onChange={event => setSlotGroup(event.target.value)}><option value="">All action categories</option>{[...new Set(['Built-in Actions', ...(mapping.slots ?? []).map(slot => (slot.categoryName ?? 'Uncategorized')), ...(slotGroup ? [slotGroup] : [])])].map(group => <option key={group}>{group}</option>)}</select>
        <span className="text-xs text-muted-foreground">{actionKeys.length} slots</span>
      </div>
      {!actionKeys.length && <p className="p-2 text-sm text-muted-foreground">No Action Slots match these filters.</p>}
      {actionKeys.map(actionKey => {
        const slot = mapping.slots?.find(slot => slot.actionKey === actionKey);
        const assigned = mapping.assignments.find(row => row.actionKey === actionKey);
        const saved = choice(assigned);
        const value = drafts[actionKey] ?? saved;
        const effective = mapping.effective.find(row => row.actionKey === actionKey);
        const inherited = mapping.inherited.find(row => row.actionKey === actionKey);
        const previewId = value === 'inherit'
          ? (target === 'character' && inherited?.mode === 'assigned' ? inherited.animationId : null)
          : value === 'disabled' ? null : Number(value);
        const previewClip = previewId === null ? undefined : available.get(previewId);
        const canPreview = !!previewClip?.isActive;
        const options = [...available.values()].filter(clip => String(clip.id) === value || (clip.isActive && clips.some(candidate => candidate.id === clip.id)));
        return <div key={actionKey} className="rounded border p-2">
          <label className="text-sm font-medium" htmlFor={`animation-${target}-${targetId}-${actionKey}`}>{slotName(actionKey)}</label>
          {slot && <p className="text-xs text-muted-foreground">{(slot.categoryName ?? 'Uncategorized')} · Animation only{!slot.isActive ? ' · Slot disabled' : ''}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <select id={`animation-${target}-${targetId}-${actionKey}`} className="h-8 min-w-0 basis-full rounded border bg-background px-2 text-xs sm:basis-0 sm:flex-1" disabled={busy || loading || !!libraryError} value={value} onChange={event => { setDrafts(previous => ({ ...previous, [actionKey]: event.target.value })); }}>
              <option value="inherit">{target === 'model' ? 'Use existing behavior (remove Model default)' : 'Use defaults (Model / existing behavior)'}</option><option value="disabled">Disabled</option>
              {!['inherit', 'disabled'].includes(value) && !options.some(clip => String(clip.id) === value) && <option value={value} disabled>Selected clip #{value} — not in current choices</option>}
              {options.map(clip => <option key={clip.id} value={clip.id} disabled={!clip.isActive}>{clip.name} · {clip.fileName} · Clip {clip.clipIndex + 1}{!clip.isActive ? ' (inactive)' : ''}</option>)}
            </select>
            <Button size="sm" variant="outline" className="h-8 text-xs" disabled={busy || loading || !!libraryError || !canPreview} onClick={() => { if (canPreview && previewId !== null) setPreview({ actionKey, animationId: previewId }); }}>Preview animation</Button>
            <Button size="sm" className="h-8 text-xs" disabled={busy || value === saved || loading || !!libraryError} onClick={() => void save(actionKey, value)}>Save</Button>
          </div>
          <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Assignment details</summary>
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {canPreview ? `Preview ${value === 'inherit' ? 'Model default' : 'selection'}: ${previewClip.name} · ${previewClip.fileName}`
              : value === 'disabled' || (value === 'inherit' && inherited?.mode === 'disabled') ? 'This action is disabled. Select an animation to preview it.'
              : value === 'inherit' && !inherited ? slot ? 'No animation is assigned to this slot. Choose a clip and Save.' : 'Uses existing Scene behavior. Select a library animation to preview a replacement.'
              : 'Animation unavailable. Choose an active library animation or refresh assignments.'}
          </p>
          <dl className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Saved source</dt>
            <dd>{!effective ? 'Unknown' : effective.source === 'legacy' ? 'Existing animation behavior' : effective.source === 'model' ? (target === 'model' ? 'Model default' : 'Inherited Model default') : 'Character override'}</dd>
            <dt className="text-muted-foreground">Saved state</dt>
            <dd className={effective?.state === 'unavailable' ? 'text-orange-500' : 'text-muted-foreground'}>
              {!effective ? 'Unavailable — refresh assignments' : effective.state === 'assigned' ? 'Assigned — playback not verified' : effective.state === 'disabled' ? 'Disabled — this action will not play' : effective.state === 'unavailable' ? 'Unavailable — replace or restore defaults before loading the Scene' : 'Use existing runtime behavior'}
            </dd>
          </dl>
          </details>
          {value !== saved && <p className="mt-2 text-xs text-amber-500">Unsaved change — use this row's Save to apply it.</p>}
          {effective?.state === 'disabled' && ['idle', 'walk', 'run'].includes(actionKey) && <p className="mt-1 text-xs text-amber-500">Disabling this locomotion action can leave the Character without its expected pose or movement animation.</p>}

        </div>;
      })}
    </div>}
    </div>
  </div>;
}
