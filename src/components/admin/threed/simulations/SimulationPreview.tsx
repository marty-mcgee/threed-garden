'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Play, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelFieldHelp } from '../models/ModelFieldHelp';
import { simulationActionLabel, type SimulationDefinition } from '@/libraries/services/threed/simulations/simulation-input';
import type { CharacterPreviewAction, CharacterPreviewClip } from '@/libraries/utils/character-preview-action';
import { defaultKickCollisionPoints } from '@/libraries/services/threed/physics/action-collision-core';
import type { SimulationChoices } from './SimulationDefinitionEditor';
import { loadSimulationPreviewAssets, type SimulationPreviewAsset } from './simulation-preview-data';
import { SimulationPreviewTimeline, simulationPreviewAction, type PreviewTimelineState } from './simulation-preview-timeline';
import type { SimulationPreviewCameraTools } from './SimulationPreviewCanvas';

const PreviewCanvas = dynamic(() => import('./SimulationPreviewCanvas'), { ssr: false, loading: () => <p role="status" className="p-3 text-xs">Loading Canvas…</p> });
export function SimulationPreview({ definition, choices, context, loading, error, busy }: {
  definition: SimulationDefinition; choices: SimulationChoices; context: string; loading: boolean; error: string; busy: boolean;
}) {
  const tools = useRef<SimulationPreviewCameraTools | null>(null);
  const [assets, setAssets] = useState<SimulationPreviewAsset[]>([]), [fetching, setFetching] = useState(false), [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(0), [clips, setClips] = useState<Record<string, CharacterPreviewClip[]>>({});
  const [states, setStates] = useState<Record<string, string | null>>({});
  const [playback, setPlayback] = useState<PreviewTimelineState>({ phase: 'idle', index: 0, message: '' });
  const [manual, setManual] = useState<{ actorId: string; action: string; id: string } | null>(null);
  const [resourceIssues, setResourceIssues] = useState<Record<string, string>>({});
  const timeline = useRef<SimulationPreviewTimeline | null>(null);
  if (!timeline.current) timeline.current = new SimulationPreviewTimeline(state => { setPlayback(state); setSelected(state.index); });
  const ids = [...new Set(definition.steps.flatMap(step => [step.actorMarkerId, step.targetMarkerId]).filter(Boolean))];
  const markers = choices.markers.filter(marker => ids.includes(marker.markerId));
  const sourceKey = JSON.stringify(markers), definitionKey = JSON.stringify(definition);
  useEffect(() => {
    timeline.current?.stop(false); setManual(null); setPlayback({ phase: 'idle', index: 0, message: '' });
    setAssets([]); setStates({}); setClips({}); setResourceIssues({});
    if (loading || error || !markers.length) { setFetching(false); return; }
    const controller = new AbortController(); setFetching(true);
    const deadline = setTimeout(() => {
      controller.abort(); setFetching(false);
      setAssets(markers.map(marker => ({ marker, error: 'Preview timed out. Retry loading.' })));
    }, 60000);
    loadSimulationPreviewAssets(markers, controller.signal).then(value => {
      if (!controller.signal.aborted) {
        setAssets(value);
        setStates(Object.fromEntries(value.filter(asset => asset.error || !asset.model || (asset.model.metadata as Record<string, unknown> | undefined)?.activeSource === 'shape')
          .map(asset => [asset.marker.markerId, asset.error ?? null])));
      }
    }).catch(cause => {
      if (!controller.signal.aborted) setAssets(markers.map(marker => ({ marker, error: cause instanceof Error ? cause.message : 'Preview unavailable.' })));
    }).finally(() => { clearTimeout(deadline); if (!controller.signal.aborted) setFetching(false); });
    return () => { clearTimeout(deadline); controller.abort(); };
    // The serialized selected projection cancels stale Project/source replies without loading on unrelated edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, sourceKey, loading, error, retry]);
  useEffect(() => {
    timeline.current?.stop(false); setManual(null); setPlayback({ phase: 'idle', index: 0, message: '' });
    setSelected(value => Math.min(value, Math.max(0, definition.steps.length - 1)));
    return () => timeline.current?.stop(false);
  }, [context, definitionKey, busy]);
  const onState = useCallback((markerId: string, message: string | null) => {
    setStates(value => Object.hasOwn(value, markerId) && value[markerId] === message ? value : { ...value, [markerId]: message });
    if (message) { timeline.current?.fail(message); setManual(null); }
  }, []);
  const onClips = useCallback((markerId: string, value: CharacterPreviewClip[]) => setClips(previous => ({ ...previous, [markerId]: value })), []);
  const onResourceIssue = useCallback((markerId: string, url: string, message: string) => setResourceIssues(previous => {
    const key = `${markerId}:${url}`;
    const value = message ? `${url.split('/').at(-1)?.split('?')[0] || 'Model resource'}: ${message}` : '';
    if ((previous[key] ?? '') === value) return previous;
    const next = { ...previous }; if (value) next[key] = value; else delete next[key]; return next;
  }), []);
  const contacted = useRef(new Set<string>());
  const kickRequests = useRef(new Set<string>());
  const onContact = useCallback((id: string) => { contacted.current.add(id); }, []);
  const onFinished = useCallback((id: string) => {
    if (kickRequests.current.has(id) && !contacted.current.has(id)) timeline.current?.fail('Kick missed the target. Check participant positions, scale and the assigned foot animation.');
    else timeline.current?.finish(id);
    contacted.current.delete(id); kickRequests.current.delete(id);
    setManual(value => value?.id === id ? null : value);
  }, []);
  const currentIndex = playback.phase === 'playing' ? playback.index : selected;
  const step = definition.steps[currentIndex];
  const actorAsset = assets.find(asset => asset.marker.markerId === step?.actorMarkerId);
  const selectedClip = step ? simulationPreviewAction(step, clips[step.actorMarkerId] ?? [], actorAsset?.mapping) : undefined;
  const problem = (actorId: string, targetId: string) => {
    for (const id of [actorId, targetId]) {
      const asset = assets.find(item => item.marker.markerId === id);
      if (!id) return 'Choose participants and targets in the form.';
      if (!asset) return `Unavailable participant: ${choices.markers.find(marker => marker.markerId === id)?.name ?? id}.`;
      if (asset.error) return `${asset.marker.name}: ${asset.error}`;
      if (!Object.hasOwn(states, id)) return `Loading ${asset.marker.name}…`;
      if (states[id]) return `${asset.marker.name}: ${states[id]}`;
    }
    return '';
  };
  const readiness = loading || fetching ? 'Loading participants and animations…' : error || definition.steps.map(item => {
    const asset = assets.find(asset => asset.marker.markerId === item.actorMarkerId);
    return problem(item.actorMarkerId, item.targetMarkerId) || (!simulationPreviewAction(item, clips[item.actorMarkerId] ?? [], asset?.mapping)
      ? `${simulationActionLabel(item.action)}: assign a compatible animation to the selected Character.` : '');
  }).find(Boolean) || '';
  const playing = playback.phase === 'playing' || !!manual;
  const request: CharacterPreviewAction | null = manual ? { id: manual.id, action: manual.action, approach: ['walk', 'run'].includes(manual.action.toLowerCase()) } : playback.phase === 'playing' && playback.requestId && selectedClip ? { id: playback.requestId, action: selectedClip.action, approach: step?.action === 'runToTarget' } : null;
  const activeActorId = manual?.actorId ?? step?.actorMarkerId;
  const activeAsset = assets.find(asset => asset.marker.markerId === activeActorId);
  const points = request ? defaultKickCollisionPoints(activeAsset?.mapping?.slots?.find(slot => slot.actionKey === request.action)?.name ?? request.action) : [];
  if (request && points.length && step?.targetMarkerId) {
    request.kick = { pointIds: points, context: { requestId: request.id, projectId: Number(context.split(':')[0]), actorMarkerId: activeActorId!, targetMarkerId: step.targetMarkerId, action: request.action } };
    kickRequests.current.add(request.id);
  }
  const runKey = useRef('');
  if ((playback.phase === 'playing' && playback.index === 0 && playback.requestId) || manual) runKey.current = manual?.id ?? playback.requestId!;
  const resetKey = `${context}:${definitionKey}:${retry}:${busy}:${playing || playback.phase === 'finished' ? runKey.current : 'rest'}`;
  // A stable request object keeps the clip playing across loading/status rerenders.
  const requestRef = useRef(request);
  if (requestRef.current?.id !== request?.id || requestRef.current?.action !== request?.action) requestRef.current = request;
  const visible = assets.filter(asset => !asset.error && asset.marker.preview?.visible);
  const ready = visible.length > 0 && visible.every(asset => Object.hasOwn(states, asset.marker.markerId));
  const framingKey = ready ? `${context}:${sourceKey}:${retry}` : '';
  function stop() { timeline.current?.stop(); setManual(null); }
  return <section className="admin-editor-panel flex min-h-0 flex-col gap-2 rounded-lg border" aria-label="Simulation preview">
    <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
      <Box className="h-3.5 w-3.5 text-blue-500" /><h2 className="text-xs font-semibold">Simulation Preview Canvas</h2>
      <ModelFieldHelp label="Simulation Preview Canvas">Preview approach movement and animated foot contact kicking the target. Ball motion stays in this Canvas; Scene collisions, Sensors and saved Results require Run Simulation in the Project. Stop restores saved positions. Fit and Reset move only the camera.</ModelFieldHelp>
      <div className="ml-auto flex gap-1"><Button type="button" variant="ghost" size="xs" disabled={!ready} onClick={() => tools.current?.fit()}>Fit</Button>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Reset preview camera" disabled={!ready} onClick={() => tools.current?.reset()}><RotateCcw /></Button></div>
    </div>
    <div className="relative h-[340px] shrink-0 sm:h-[440px] xl:h-[min(54vh,580px)]">
      <PreviewCanvas assets={assets} actorId={manual?.actorId ?? step?.actorMarkerId} targetId={step?.targetMarkerId}
        request={requestRef.current} resetKey={resetKey} tools={tools} framingKey={framingKey} onState={onState} onClips={onClips} onFinished={onFinished} onContact={onContact} onResourceIssue={onResourceIssue} />
      {!visible.length && <p role="status" className="pointer-events-none absolute inset-x-3 top-3 rounded bg-slate-950/80 p-2 text-xs text-white">{loading || fetching ? 'Loading participants…' : error || (definition.steps.length ? 'Choose available participants and targets to see their preview.' : 'Add Actions and choose participants to build your Simulation preview.')}</p>}
    </div>
    <div className="space-y-2 border-t p-3">
      <div className="flex flex-wrap items-center gap-1"><h3 className="text-xs font-semibold">Action Timeline ({definition.steps.length})</h3>
        <ModelFieldHelp label="Action Timeline">Actions play in order. Approach Actions loop locomotion until arrival; other Actions play one clip cycle. Timeout bounds the wait. Stop or definition changes cancel playback and restore saved positions.</ModelFieldHelp>
        <Button type="button" variant="success" size="xs" className="ml-auto" disabled={busy || playing || !definition.steps.length || !!readiness} onClick={() => { setManual(null); timeline.current?.play(definition.steps); }}><Play />Play Timeline</Button>
        <Button type="button" variant="outline" size="icon-xs" aria-label="Stop preview" disabled={!playing && playback.phase !== 'finished'} onClick={stop}><Square /></Button>
      </div>
      <ol className="flex max-h-36 gap-2 overflow-auto pb-1" aria-label="Ordered Simulation Actions">
        {definition.steps.map((item, index) => <li key={item.id} className="min-w-44 flex-1"><Button type="button" variant={currentIndex === index ? 'secondary' : 'outline'}
          className="h-auto w-full items-start justify-start whitespace-normal px-2 py-2 text-left text-xs" aria-pressed={currentIndex === index} disabled={playing} onClick={() => setSelected(index)}>
          <span className="text-emerald-600 dark:text-emerald-300">{index + 1}</span><span>{simulationActionLabel(item.action)}<span className="block text-[10px] font-normal text-muted-foreground">{choices.markers.find(marker => marker.markerId === item.actorMarkerId)?.name ?? 'Choose Character'} → {choices.markers.find(marker => marker.markerId === item.targetMarkerId)?.name ?? 'Choose target'}</span>
            <span className="block text-[10px] font-normal text-muted-foreground">Timeout {item.timeoutMs / 1000}s</span></span></Button></li>)}
      </ol>
      <p role="status" aria-live="polite" className={`text-xs ${playback.phase === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>{manual ? `Previewing ${manual.action}.` : playback.message || readiness || (definition.steps.length ? 'Ready to preview the Action timeline.' : 'No Actions yet.')}</p>
      {assets.some(asset => asset.error || states[asset.marker.markerId]) && <div className="space-y-1 text-xs text-destructive">{assets.filter(asset => asset.error || states[asset.marker.markerId]).map(asset => <p key={asset.marker.markerId}>{asset.marker.name}: {asset.error || states[asset.marker.markerId]}</p>)}
        <Button type="button" variant="outline" size="xs" disabled={busy || fetching || playing} onClick={() => setRetry(value => value + 1)}>Retry preview</Button></div>}
      {!!Object.keys(resourceIssues).length && <details className="rounded-md border p-2 text-xs text-amber-600 dark:text-amber-300"><summary className="cursor-pointer">Model texture warnings ({Object.keys(resourceIssues).length})</summary><p>Geometry remains available; some textures may be missing.</p>{Object.entries(resourceIssues).map(([key, message]) => <p key={key}>{message}</p>)}</details>}
      <details className="rounded-md border p-2"><summary className="cursor-pointer text-xs font-medium">Animations &amp; Actions ({Object.values(clips).reduce((sum, value) => sum + value.length, 0)})</summary>
        <div className="mt-2 space-y-2">{assets.filter(asset => asset.character).map(asset => <div key={asset.marker.markerId}>
          <span className="text-xs">{asset.marker.name}</span><select className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs" aria-label={`Preview Animation Action for ${asset.marker.name}`} disabled={busy || playing || !!states[asset.marker.markerId] || !clips[asset.marker.markerId]?.length}
            value="" onChange={event => { const action = event.target.value; if (clips[asset.marker.markerId]?.some(clip => clip.action === action)) { setPlayback({ phase: 'idle', index: selected, message: '' }); setManual({ actorId: asset.marker.markerId, action, id: crypto.randomUUID() }); } }}>
            <option value="">Choose an Animation Action to preview</option>{(clips[asset.marker.markerId] ?? []).map(clip => <option key={clip.action} value={clip.action}>{asset.mapping?.slots?.find(slot => slot.actionKey === clip.action)?.name ?? clip.action} · {clip.duration.toFixed(2)}s</option>)}</select>
          <Link className="text-xs text-blue-600 underline dark:text-blue-300" href={`/admin/threed/characters/${asset.marker.preview!.sourceAssetId}/animations`}>Character Animations &amp; Actions</Link>
        </div>)}<Link className="text-xs text-blue-600 underline dark:text-blue-300" href="/admin/threed/animations">Animations Library</Link></div>
      </details>
    </div>
  </section>;
}
