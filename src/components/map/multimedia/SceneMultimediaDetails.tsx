'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { DetailsCardSection } from '../details/DetailsCardSection';
import type { MultimediaAction, SceneMultimediaResponse } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';
import { loadSceneMultimedia, useSceneMultimedia } from './SceneMultimediaProvider';

export function SceneMultimediaDetails({ markerId, controlledCharacterId }: {
  markerId: string;
  controlledCharacterId?: number | null
}) {
  const context = useSceneMultimedia();
  const [albumId, setAlbumId] = useState<number | null>(null);
  const [trackId, setTrackId] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [withCharacter, setWithCharacter] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{
    key: string;
    data: SceneMultimediaResponse | null;
    error: string
  } | null>(null);
  const key = `${context?.scope}:${markerId}:${albumId}:${offset}:${retry}`;
  useEffect(() => {
    if (!context?.projectId) return;
    const abort = new AbortController();
    void loadSceneMultimedia({
      projectId: context.projectId,
      markerId,
      actorMarkerId: undefined,
      albumId,
      trackId: null,
      offset,
    }, abort.signal).then(data => {
      if (!abort.signal.aborted) setResult({
        key,
        data,
        error: ''
      });
    }).catch(error => {
      if (!abort.signal.aborted) setResult({
        key,
        data: null,
        error: error instanceof Error ? error.message : 'Albums unavailable.'
      });
    });
    return () => abort.abort();
  }, [context?.scope, context?.projectId, markerId, albumId, offset, retry, key]);
  if (!context?.projectId) return null;
  const current = result?.key === key ? result : null;
  const data = current?.data;
  const actors = context.scene()?.markers.filter(marker => marker.type === 'characters' && Number(marker.data?.id) === controlledCharacterId) ?? [];
  const actorMarkerId = withCharacter && actors.length === 1 ? actors[0].id : undefined;
  const selection = {
    projectId: context.projectId,
    markerId,
    albumId: albumId ?? 0,
    ...(actorMarkerId ? { actorMarkerId } : {}),
  };
  const ready = !!data && !!albumId && !!data.tracks.length && (!withCharacter || !!actorMarkerId) && !context.busy;
  const same = context.state?.markerId === markerId && context.state.albumId === albumId;
  const selectedAlbum = data?.albums.find(album => album.id === albumId);
  const act = async (action: MultimediaAction) => {
    setMessage('');
    try {
      await context.player.execute({
        ...selection,
        action,
        ...(action === 'playMultimedia' && data?.tracks.length ? { trackId: trackId ?? data.tracks[0].id } : {})
      }, crypto.randomUUID());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Multimedia Action failed.');
    }
  };
  const armed = context.player.isCollisionArmed(markerId);
  return <DetailsCardSection title="Multimedia" className="order-3">
    <div className="space-y-2 text-xs">
      <p className="flex items-center gap-1"><ModuleIcon moduleKey="multimedia" className="size-3.5" />Albums related to this object and available in this Project.</p>
      {!current && <p role="status">Loading Albums…</p>}
      {current?.error && <p role="alert">{current.error}</p>}
      {data && !data.albums.length && <p>No readable related Albums are assigned to this Project. Save the object's Album relationships and add its Albums to Project Assets.</p>}
      {!!data?.albums.length && <label className="block">Album<select aria-label="Scene Album" className="mt-1 block w-full rounded border bg-background p-1" value={albumId ?? ''} onChange={event => { setAlbumId(Number(event.target.value) || null); setOffset(0); setTrackId(null); }}>
        <option value="">Choose an Album</option>{data.albums.map(album => <option key={album.id} value={album.id}>{album.title} — {album.artist}</option>)}
      </select></label>}
      {albumId && data && <>
        {selectedAlbum && <div className="flex items-start gap-2 rounded border border-foreground/10 p-2" aria-label="Selected Album information">
          {selectedAlbum.coverArt && <img key={selectedAlbum.coverArt} src={selectedAlbum.coverArt} alt={`${selectedAlbum.title} cover`} className="size-16 shrink-0 rounded object-cover" onError={event => { event.currentTarget.hidden = true; }} />}
          <div className="min-w-0 break-words">
            <p className="font-semibold">{selectedAlbum.title}</p>
            <p className="text-muted-foreground">{selectedAlbum.artist}</p>
          </div>
        </div>}
        {same && context.state && <p role="status">{context.state.track.title} · <span className="capitalize">{context.state.status}</span></p>}
        {!data.tracks.length && <p>No playable active Tracks on this page.</p>}
        {!!data.tracks.length && <label className="block">Track<select aria-label="Scene Track" className="mt-1 block w-full rounded border bg-background p-1" value={trackId ?? data.tracks[0].id} onChange={event => setTrackId(Number(event.target.value))}>{data.tracks.map(track => <option key={track.id} value={track.id}>{track.trackNumber ?? '—'}. {track.title}</option>)}</select></label>}
        <div className="flex gap-1">{offset > 0 && <Button size="xs" variant="ghost" onClick={() => { setOffset(Math.max(0, offset - 50)); setTrackId(null); }}>Previous Tracks</Button>}{data.hasMore && <Button size="xs" variant="ghost" onClick={() => { setOffset(offset + 50); setTrackId(null); }}>More Tracks</Button>}</div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={withCharacter} onChange={event => setWithCharacter(event.target.checked)} />Use controlled Character</label>
        {withCharacter && !actorMarkerId && <p>Take Control of one saved Character to run this Action.</p>}
        <div className="flex flex-wrap gap-1">
          <Button size="xs" variant="outline" disabled={!ready} onClick={() => void act('playMultimedia')}>Play Multimedia</Button>
          <Button size="xs" variant="outline" disabled={!ready || !same} onClick={() => void act('pauseMultimedia')}>Pause</Button>
          <Button size="xs" variant="outline" disabled={!ready || !same} onClick={() => void act('stopMultimedia')}>Stop</Button>
          <Button size="xs" variant="outline" disabled={!ready || !same} onClick={() => void act('rewindMultimedia')}>Rewind</Button>
          <Button size="xs" variant="outline" disabled={!ready || !same} onClick={() => void act('nextTrack')}>Next Track</Button>
        </div>
        <Button size="xs" variant="outline" disabled={!armed && (!ready || !actorMarkerId)} onClick={() => {
          try {
            context.player.armCollision(armed ? null : {
              ...selection,
              actorMarkerId,
              trackId: trackId ?? data.tracks[0]?.id,
              action: 'playMultimedia'
            }, markerId);
            setMessage(armed ? 'Collision playback disabled.' : 'Collision playback enabled for this Scene session. Use a Sensor on this object, or its existing contact events.');
          } catch (error) { setMessage(error instanceof Error ? error.message : 'Collision playback unavailable.'); }
        }}>{armed ? 'Disable collision playback' : 'Enable collision playback'}</Button>
      </>}
      <Button size="xs" variant="ghost" disabled={context.busy} onClick={() => setRetry(value => value + 1)}>Refresh Albums</Button>
      {message && <p role="status">{message}</p>}
    </div>
  </DetailsCardSection>;
}
