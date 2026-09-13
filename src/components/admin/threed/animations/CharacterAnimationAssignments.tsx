'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimationPresets } from './AnimationPresets';
import { useAnimationCategories } from './AnimationCategories';
import { LIBRARY_ACTIONS, type Assignment } from '@/lib/services/threed/animations/contracts';

type Clip = { id: number; name: string; fileName: string; clipIndex: number; isActive: boolean };
type Mapping = { modelId: number | null; assignments: Assignment[]; inherited: Assignment[]; animations: Clip[]; effective: { actionKey: string; source: string; state: string; animationId: number | null }[] };
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
      setNotice(`${label(actionKey)} assignment saved.`);
    } catch (err) { setNotice(`${err instanceof Error ? err.message : 'Could not save'}. Refresh assignments to verify before retrying.`); }
    finally { setBusy(false); }
  }
  const available = new Map([...clips, ...(mapping?.animations ?? [])].map(clip => [clip.id, clip]));
  return <div className={target === 'character' ? 'flex min-h-0 min-w-0 flex-1 flex-col gap-3' : 'space-y-3'}>
    <div className="shrink-0 space-y-2 text-xs text-muted-foreground">
      <p>{target === 'character'
        ? 'Choose an animation for an action → Preview animation → Save that action. Reload the Scene to use saved changes.'
        : 'Optionally assign shared animation defaults to this Model. Character overrides take precedence. Each Save stores one action.'}</p>
      {target === 'model' && <p>Static Models require no assignments; generic Scene Model playback is not implemented yet.</p>}
      <p>Use defaults keeps existing behavior. Disabled turns an action off. {target === 'character' && 'Preview requires an active uploaded animation and does not save changes.'}</p>
      {mapping && target === 'character' && <p>
        Character override → linked Model default → existing animation behavior.
        {mapping.modelId ? <> <Link className="underline" href={`/admin/threed/model-files?modelId=${mapping.modelId}`}>View linked Model #{mapping.modelId}</Link></> : ' No linked Model defaults.'}
      </p>}
    </div>
    {mapping && <AnimationPresets key={`${target}-${targetId}`} target={target} targetId={targetId} assignments={mapping.assignments} inherited={mapping.inherited} dirty={Object.entries(drafts).some(([key, value]) => value !== choice(mapping.assignments.find(row => row.actionKey === key)))} disabled={busy} onBusyChange={setBusy} onApplied={async () => { const result = await request(endpoint); setMapping(result.data); setDrafts({}); }} />}
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Input aria-label="Search animation choices" placeholder="Search animation files or names…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(0); }} className="h-8 min-w-0 basis-48 flex-1 text-xs" />
      <select aria-label="Filter animation choices by category" className="h-8 min-w-40 rounded border bg-background px-2 text-xs" value={category} disabled={busy || !!categoryError} onChange={e => { setCategory(e.target.value); setPage(0); }}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <Button asChild variant="outline" size="sm"><Link href="/admin/threed/animations">Animations Library</Link></Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => setReload(value => value + 1)}>Refresh assignments</Button>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs"><span>{loading ? 'Loading choices…' : `${total} matching clips · page ${page + 1}`}</span><Button size="sm" variant="ghost" disabled={busy || loading || page === 0} onClick={() => setPage(value => value - 1)}>Previous choices</Button><Button size="sm" variant="ghost" disabled={busy || loading || (page + 1) * 200 >= total} onClick={() => setPage(value => value + 1)}>Next choices</Button></div>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {categoryError && <p role="alert" className="text-xs text-orange-500">{categoryError}</p>}
    {(error || libraryError) && <p role="alert" className="text-sm text-destructive">{error || libraryError}</p>}
    <div className={target === 'character' ? 'grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:overflow-hidden' : ''}>
    {!mapping ? <p>{error ? 'Assignments unavailable. Use Refresh assignments to retry.' : 'Loading assignments…'}</p> : <div className="min-h-0 min-w-0 space-y-2 lg:overflow-y-auto lg:pr-2" aria-label="Animation action assignments">
      {LIBRARY_ACTIONS.map(actionKey => {
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
          <label className="text-sm font-medium" htmlFor={`animation-${target}-${targetId}-${actionKey}`}>{label(actionKey)}</label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <select id={`animation-${target}-${targetId}-${actionKey}`} className="h-8 w-full min-w-0 basis-full rounded border bg-background px-2 text-xs" disabled={busy || loading || !!libraryError} value={value} onChange={event => { setDrafts(previous => ({ ...previous, [actionKey]: event.target.value })); }}>
              <option value="inherit">{target === 'model' ? 'Use existing behavior (remove Model default)' : 'Use defaults (Model / existing behavior)'}</option><option value="disabled">Disabled</option>
              {!['inherit', 'disabled'].includes(value) && !options.some(clip => String(clip.id) === value) && <option value={value} disabled>Selected clip #{value} — not in current choices</option>}
              {options.map(clip => <option key={clip.id} value={clip.id} disabled={!clip.isActive}>{clip.name} · {clip.fileName} · Clip {clip.clipIndex + 1}{!clip.isActive ? ' (inactive)' : ''}</option>)}
            </select>
            {target === 'character' && <Button size="sm" variant="outline" className="h-8 text-xs" disabled={busy || loading || !!libraryError || !canPreview} onClick={() => { if (canPreview && previewId !== null) setPreview({ actionKey, animationId: previewId }); }}>Preview animation</Button>}
            <Button size="sm" className="h-8 text-xs" disabled={busy || value === saved || loading || !!libraryError} onClick={() => void save(actionKey, value)}>Save</Button>
          </div>
          {target === 'character' && <p className="mt-1 break-words text-xs text-muted-foreground">
            {canPreview ? `Preview ${value === 'inherit' ? 'Model default' : 'selection'}: ${previewClip.name} · ${previewClip.fileName}`
              : value === 'disabled' || (value === 'inherit' && inherited?.mode === 'disabled') ? 'This action is disabled. Select an animation to preview it.'
              : value === 'inherit' && !inherited ? 'Uses existing Scene behavior. Select a library animation to preview a replacement.'
              : 'Animation unavailable. Choose an active library animation or refresh assignments.'}
          </p>}
          <dl className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Saved source</dt>
            <dd>{!effective ? 'Unknown' : effective.source === 'legacy' ? 'Existing animation behavior' : effective.source === 'model' ? (target === 'model' ? 'Model default' : 'Inherited Model default') : 'Character override'}</dd>
            <dt className="text-muted-foreground">Saved state</dt>
            <dd className={effective?.state === 'unavailable' ? 'text-orange-500' : 'text-muted-foreground'}>
              {!effective ? 'Unavailable — refresh assignments' : effective.state === 'assigned' ? 'Assigned — playback not verified' : effective.state === 'disabled' ? 'Disabled — this action will not play' : effective.state === 'unavailable' ? 'Unavailable — replace or restore defaults before loading the Scene' : 'Use existing runtime behavior'}
            </dd>
          </dl>
          {value !== saved && <p className="mt-2 text-xs text-amber-500">Unsaved change — use this row's Save to apply it.</p>}
          {effective?.state === 'disabled' && ['idle', 'walk', 'run'].includes(actionKey) && <p className="mt-1 text-xs text-amber-500">Disabling this locomotion action can leave the Character without its expected pose or movement animation.</p>}

        </div>;
      })}
    </div>}
    {target === 'character' && <aside className="order-first flex min-h-[300px] min-w-0 flex-col rounded border bg-background/50 lg:order-last lg:min-h-0" aria-label="Character animation preview">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b p-3">
        <h3 className="text-sm font-medium">{preview ? `Preview: ${label(preview.actionKey)}` : 'Character Preview'}</h3>
        {preview && <Button size="sm" variant="outline" className="text-xs" onClick={() => setPreview(null)}>T-Pose</Button>}
      </div>
      <p className="break-words px-3 pt-2 text-xs text-muted-foreground">{preview ? available.get(preview.animationId)?.name : 'T-Pose · Choose an animation to preview.'}</p>
      <iframe ref={previewFrame} key={targetId} onLoad={() => previewFrame.current?.contentWindow?.postMessage({ type: 'threed-preview-animation', animationId: preview?.animationId ?? null }, window.location.origin)} title="Character animation preview" className="min-h-[360px] w-full flex-1 border-0 lg:min-h-0" src={`/threed/character-animation-preview?characterId=${targetId}`} />
    </aside>}
    </div>
  </div>;
}
