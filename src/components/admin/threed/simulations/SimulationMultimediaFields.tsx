'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadSceneMultimedia } from '@/components/map/multimedia/SceneMultimediaProvider';
import type { SimulationStep } from '@/libraries/services/threed/simulations/simulation-input';
import type { SceneMultimediaResponse } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';

export function SimulationMultimediaFields({ projectId, step, onChange }: {
  projectId?: number;
  step: SimulationStep;
  onChange: (selection: NonNullable<SimulationStep['multimedia']>) => void;
}) {
  const [page, setPage] = useState({
    key: '',
    offset: 0
  });
  const [retry, setRetry] = useState(0);
  const scope = `${projectId}:${step.actorMarkerId}:${step.targetMarkerId}:${step.multimedia?.albumId}`;
  const offset = page.key === scope ? page.offset : 0;
  const key = `${scope}:${offset}:${step.multimedia?.trackId}:${retry}`;
  const [result, setResult] = useState<{
    key: string;
    data: SceneMultimediaResponse | null;
    error: string
  } | null>(null);
  useEffect(() => {
    if (!projectId || !step.targetMarkerId || !step.actorMarkerId) return;
    const abort = new AbortController();
    void loadSceneMultimedia({
      projectId,
      markerId: step.targetMarkerId,
      actorMarkerId: step.actorMarkerId,
      albumId: step.multimedia?.albumId || null,
      trackId: step.multimedia?.trackId ?? null,
      offset,
    }, abort.signal).then(data => { if (!abort.signal.aborted) setResult({
      key,
      data,
      error: ''
    }); })
      .catch(cause => { if (!abort.signal.aborted) setResult({
        key,
        data: null,
        error: cause instanceof Error ? cause.message : 'Multimedia unavailable.'
      }); });
    return () => abort.abort();
  }, [projectId, step.actorMarkerId, step.targetMarkerId, step.multimedia?.albumId, step.multimedia?.trackId, offset, retry, key]);
  const current = result?.key === key ? result : null;
  return <div className="space-y-2 rounded border p-2 text-xs">
    {!projectId || !step.targetMarkerId || !step.actorMarkerId ? <p>Choose the Project, Character and target to load its available Albums.</p>
      : !current ? <p role="status">Loading target Albums…</p> : current.error ? <p role="alert">{current.error}</p> : <>
        <label className="block">Project Album<select aria-label={`Album for Action ${step.id}`} className="mt-1 block w-full rounded border bg-background p-1" value={step.multimedia?.albumId ?? ''} onChange={event => onChange({ albumId: Number(event.target.value) })}>
          <option value="">Choose an Album</option>{current.data?.albums.map(album => <option key={album.id} value={album.id}>{album.title} — {album.artist}</option>)}
        </select></label>
        {step.action === 'playMultimedia' && !!step.multimedia?.albumId && <>
          <label className="block">Track<select aria-label={`Track for Action ${step.id}`} className="mt-1 block w-full rounded border bg-background p-1" value={step.multimedia.trackId ?? ''} onChange={event => onChange({
            albumId: step.multimedia!.albumId,
            ...(event.target.value ? { trackId: Number(event.target.value) } : {})
          })}>
            <option value="">Resume / first available Track</option>{current.data?.tracks.map(track => <option key={track.id} value={track.id}>{track.title}</option>)}
          </select></label>
          <div className="flex gap-1"><Button type="button" size="xs" variant="ghost" disabled={!offset} onClick={() => { onChange({ albumId: step.multimedia!.albumId }); setPage({
            key: scope,
            offset: Math.max(0, offset - 50)
          }); }}>Previous Tracks</Button><Button type="button" size="xs" variant="ghost" disabled={!current.data?.hasMore} onClick={() => { onChange({ albumId: step.multimedia!.albumId }); setPage({
            key: scope,
            offset: (current.data?.offset ?? offset) + 50
          }); }}>More Tracks</Button></div>
        </>}
      </>}
    <Button type="button" size="xs" variant="ghost" onClick={() => setRetry(value => value + 1)}>Reload Albums</Button>
    <p>Albums must be related to the target and assigned to this Project. Track selection stays inside the Album.</p>
  </div>;
}
