'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { SceneMultimediaPlayer, type MultimediaScene, type ScenePlaybackState } from '@/libraries/services/threed/multimedia/scene-multimedia-player';
import { sceneMultimediaResponseSchema, type SceneMultimediaQuery, type MultimediaAction } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';

export async function loadSceneMultimedia(query: SceneMultimediaQuery, signal: AbortSignal) {
  const params = new URLSearchParams({
    projectId: String(query.projectId),
    markerId: query.markerId,
    offset: String(query.offset),
  });
  if (query.albumId) params.set('albumId', String(query.albumId));
  if (query.trackId) params.set('trackId', String(query.trackId));
  if (query.actorMarkerId) params.set('actorMarkerId', query.actorMarkerId);
  const response = await fetch(`/api/project/multimedia-playback?${params}`, {
    signal,
    cache: 'no-store'
  });
  const body = await response.json();
  if (!response.ok) throw Error(body.error || 'Project Multimedia is unavailable.');
  const data = sceneMultimediaResponseSchema.parse(body);
  if (data.projectId !== query.projectId || data.markerId !== query.markerId || data.albumId !== query.albumId) throw Error('Project Multimedia response does not match the selection.');
  return data;
}

type View = {
  scope: string;
  state: ScenePlaybackState | null;
  busy: boolean;
  error: string;
};
type Context = Omit<View, 'scope'> & {
  scope: string;
  projectId: number;
  player: SceneMultimediaPlayer;
  scene: () => MultimediaScene | null;
  setScene: (scene: MultimediaScene | null) => void;
};
const Context = createContext<Context | null>(null);
export const useSceneMultimedia = () => useContext(Context);

/** Project-owned media lifetime stays outside DetailsCard and the Canvas. */
export function SceneMultimediaProvider({ projectId, children }: {
  projectId?: string | number | null;
  children: ReactNode
}) {
  const { data: session, status } = useSession();
  const id = Number(projectId) || 0;
  const scope = `${id}:${status}:${session?.user?.id ?? 'public'}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const sceneRef = useRef<MultimediaScene | null>(null);
  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const [view, setView] = useState<View>({
    scope,
    state: null,
    busy: false,
    error: '',
  });
  const playerRef = useRef<SceneMultimediaPlayer | null>(null);
  if (!playerRef.current) playerRef.current = new SceneMultimediaPlayer({
    read: async (query, signal) => {
      const requestedScope = currentScope.current;
      const data = await loadSceneMultimedia(query, signal);
      if (requestedScope !== currentScope.current) throw Error('Project or session changed.');
      return data;
    },
    media: () => mediaRef.current,
    scene: () => sceneRef.current,
    update: (state, busy, error) => setView({
      scope: currentScope.current,
      state,
      busy,
      error,
    }),
  });
  const player = playerRef.current;
  const setScene = useCallback((value: MultimediaScene | null) => { sceneRef.current = value; }, []);
  const scene = useCallback(() => sceneRef.current, []);
  useEffect(() => {
    player.clear();
    const check = setInterval(() => player.checkScene(), 300);
    const stop = () => player.clear();
    window.addEventListener('pagehide', stop);
    return () => {
      clearInterval(check);
      window.removeEventListener('pagehide', stop);
      player.clear();
    };
  }, [scope, player]);
  const current = view.scope === scope ? view : {
    state: null,
    busy: false,
    error: ''
  };
  const video = current.state?.track.fileType.startsWith('video') || /\.(mp4|webm|mov)(?:\?|$)/i.test(current.state?.track.fileUrl ?? '');
  const act = (action: MultimediaAction) => {
    if (!current.state) return;
    void player.execute({
      projectId: id,
      markerId: current.state.markerId,
      albumId: current.state.albumId,
      action,
    }, crypto.randomUUID()).catch(error => {
      if (currentScope.current !== scope) return;
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Multimedia Action cancelled.')) return;
      setView(previous => ({
        ...previous,
        scope,
        error: previous.error || (error instanceof Error ? error.message : 'Multimedia Action failed.'),
      }));
    });
  };
  return <Context.Provider value={{
    ...current,
    scope,
    projectId: id,
    player,
    scene,
    setScene
  }}>
    {children}
    <aside hidden={!current.state && !current.error} className="threed-workspace-panel fixed right-4 bottom-12 z-40 w-[min(340px,calc(100vw-2rem))] space-y-2 rounded-lg border p-3 text-xs shadow-lg" aria-label="Project Multimedia player">
      <p className="font-semibold">{current.state?.albumTitle || 'Project Multimedia'}</p>
      {current.state && <p role="status">{current.state.track.title} · <span className="capitalize">{current.state.status}</span></p>}
      <video ref={mediaRef} hidden={!video} controls playsInline preload="none" className="max-h-48 w-full rounded" aria-label="Scene Multimedia"
        onPlay={() => player.mediaChanged()} onPause={() => player.mediaChanged()} onEnded={() => player.mediaChanged('', true)}
        onError={() => { if (mediaRef.current?.getAttribute('src')) player.mediaChanged('Media could not be loaded. Select the Track and retry Play.'); }} />
      {current.state && <div className="flex flex-wrap gap-1">
        <Button size="xs" variant="outline" disabled={current.busy} onClick={() => act(current.state!.playing ? 'pauseMultimedia' : 'playMultimedia')}>{current.state.playing ? 'Pause' : 'Play'}</Button>
        <Button size="xs" variant="outline" disabled={current.busy} onClick={() => act('stopMultimedia')}>Stop</Button>
        <Button size="xs" variant="outline" disabled={current.busy} onClick={() => act('rewindMultimedia')}>Rewind</Button>
        <Button size="xs" variant="outline" disabled={current.busy} onClick={() => act('nextTrack')}>Next Track</Button>
      </div>}
      {current.error && <p role="alert">{current.error}</p>}
      <Button size="xs" variant="ghost" onClick={() => player.clear()}>Close player</Button>
    </aside>
  </Context.Provider>;
}
