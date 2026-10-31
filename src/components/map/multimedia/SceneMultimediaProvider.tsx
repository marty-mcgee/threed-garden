'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { SceneMultimediaPlayer, type MultimediaScene, type ScenePlaybackState } from '@/libraries/services/threed/multimedia/scene-multimedia-player';
import { sceneMultimediaResponseSchema, type SceneMultimediaQuery, type MultimediaAction } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';
import { projectMultimediaPreviewSchema, type ProjectMultimediaPreviewQuery } from '@/libraries/services/project/multimedia-preview-contract';
import type { ProjectMultimediaWorkspaceState } from '@/libraries/services/threed/markers/project-view-state-core';

export type ProjectMultimediaSelection = Pick<ProjectMultimediaWorkspaceState, 'albumId' | 'trackId'>;
const emptySelection: ProjectMultimediaSelection = {
  albumId: null,
  trackId: null,
};

export async function loadProjectMultimediaPreview(query: ProjectMultimediaPreviewQuery, signal: AbortSignal) {
  const params = new URLSearchParams({
    projectId: String(query.projectId),
    albumId: String(query.albumId),
    offset: String(query.offset),
  });
  if (query.trackId) params.set('trackId', String(query.trackId));
  const response = await fetch(`/api/project/multimedia-preview?${params}`, { signal, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw Error(body.error || 'Project Multimedia is unavailable.');
  const data = projectMultimediaPreviewSchema.parse(body);
  if (data.projectId !== query.projectId || data.albumId !== query.albumId) throw Error('Project Multimedia response does not match the selection.');
  return data;
}

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
  selection: ProjectMultimediaSelection;
  select: (selection: ProjectMultimediaSelection) => void;
  canOpenPreview: boolean;
  previewAlbum: (albumId: number, trackId?: number) => void;
  act: (action: MultimediaAction) => void;
  setMediaHost: (host: HTMLDivElement | null) => void;
};
const Context = createContext<Context | null>(null);
export const useSceneMultimedia = () => useContext(Context);

/** Project-owned media lifetime stays outside DetailsCard and the Canvas. */
export function SceneMultimediaProvider({ projectId, children, initialWorkspace, workspaceSavedAt, onRegisterWorkspace, onOpenProjectPreview }: {
  projectId?: string | number | null;
  children: ReactNode;
  initialWorkspace?: ProjectMultimediaWorkspaceState;
  workspaceSavedAt?: string;
  onRegisterWorkspace?: (capture: (() => ProjectMultimediaSelection) | null) => void;
  onOpenProjectPreview?: () => void;
}) {
  const { data: session, status } = useSession();
  const id = Number(projectId) || 0;
  const scope = `${id}:${status}:${session?.user?.id ?? 'public'}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const projectRef = useRef(id);
  projectRef.current = id;
  const sceneRef = useRef<MultimediaScene | null>(null);
  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const [mediaHost, setMediaHost] = useState<HTMLDivElement | null>(null);
  const selectionRef = useRef({ scope, ...emptySelection });
  const [selectionState, setSelectionState] = useState(selectionRef.current);
  const touched = useRef('');
  const restored = useRef('');
  const restoreRequest = useRef<string | null>(null);
  const lastPlaybackSelection = useRef('');
  const remember = (selection: ProjectMultimediaSelection) => {
    const next = { scope: currentScope.current, ...selection };
    selectionRef.current = next;
    setSelectionState(current => current.scope === next.scope && current.albumId === next.albumId && current.trackId === next.trackId ? current : next);
  };
  const [view, setView] = useState<View>({
    scope,
    state: null,
    busy: false,
    error: '',
  });
  const playerRef = useRef<SceneMultimediaPlayer | null>(null);
  if (!playerRef.current) playerRef.current = new SceneMultimediaPlayer({
    projectId: () => projectRef.current,
    readProject: async (query, signal) => {
      const requestedScope = currentScope.current;
      const data = await loadProjectMultimediaPreview(query, signal);
      if (requestedScope !== currentScope.current) throw Error('Project or session changed.');
      return data;
    },
    read: async (query, signal) => {
      const requestedScope = currentScope.current;
      const data = await loadSceneMultimedia(query, signal);
      if (requestedScope !== currentScope.current) throw Error('Project or session changed.');
      return data;
    },
    media: () => mediaRef.current,
    scene: () => sceneRef.current,
    update: (state, busy, error) => {
      const identity = state?.markerId === null ? `${currentScope.current}:${state.albumId}:${state.track.id}` : '';
      if (identity && identity !== lastPlaybackSelection.current) remember({
        albumId: state!.albumId,
        trackId: state!.track.id,
      });
      lastPlaybackSelection.current = identity;
      setView({
        scope: currentScope.current,
        state,
        busy,
        error,
      });
    },
  });
  const player = playerRef.current;
  const setScene = useCallback((value: MultimediaScene | null) => { sceneRef.current = value; }, []);
  const scene = useCallback(() => sceneRef.current, []);
  useEffect(() => {
    player.clear();
    touched.current = '';
    remember(emptySelection);
    const check = setInterval(() => player.checkScene(), 300);
    const stop = () => player.clear();
    window.addEventListener('pagehide', stop);
    return () => {
      clearInterval(check);
      window.removeEventListener('pagehide', stop);
      player.clear();
    };
  }, [scope, player]);
  useEffect(() => {
    onRegisterWorkspace?.(() => selectionRef.current.scope === currentScope.current ? {
      albumId: selectionRef.current.albumId,
      trackId: selectionRef.current.trackId,
    } : emptySelection);
    return () => onRegisterWorkspace?.(null);
  }, [onRegisterWorkspace]);
  useEffect(() => {
    if (!initialWorkspace || !workspaceSavedAt || status === 'loading' || !id) return;
    const key = `${scope}:${workspaceSavedAt}`;
    if (restored.current === key || touched.current === scope) return;
    restored.current = key;
    remember({ albumId: initialWorkspace.albumId, trackId: initialWorkspace.trackId });
    const request = `restore:${crypto.randomUUID()}`;
    restoreRequest.current = request;
    if (initialWorkspace.albumId) void player.restoreProject({
      projectId: id,
      albumId: initialWorkspace.albumId,
      ...(initialWorkspace.trackId ? { trackId: initialWorkspace.trackId } : {}),
      action: 'playMultimedia',
    }, request).catch(() => {}); // The player exposes denied/unavailable saved references.
    return () => {
      player.cancel(request);
      if (restoreRequest.current === request) restoreRequest.current = null;
      if (restored.current === key) restored.current = '';
    };
  }, [scope, workspaceSavedAt, initialWorkspace, player, status, id]);
  const current = view.scope === scope ? view : {
    state: null,
    busy: false,
    error: ''
  };
  const video = current.state?.track.fileType.startsWith('video') || /\.(mp4|webm|mov)(?:\?|$)/i.test(current.state?.track.fileUrl ?? '');
  const act = (action: MultimediaAction) => {
    if (!current.state) return;
    const command = {
      projectId: id,
      albumId: current.state.albumId,
      action,
    };
    const operation = current.state.markerId === null
      ? player.executeProject(command, crypto.randomUUID())
      : player.execute({ ...command, markerId: current.state.markerId }, crypto.randomUUID());
    void operation.catch(error => {
      if (currentScope.current !== scope) return;
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Multimedia Action cancelled.')) return;
      setView(previous => ({
        ...previous,
        scope,
        error: previous.error || (error instanceof Error ? error.message : 'Multimedia Action failed.'),
      }));
    });
  };
  const select = (selection: ProjectMultimediaSelection) => {
    touched.current = currentScope.current;
    if (restoreRequest.current) player.cancel(restoreRequest.current);
    remember(selection);
  };
  const previewAlbum = (albumId: number, trackId?: number) => {
    if (!id || !onOpenProjectPreview) return;
    const selected = selectionRef.current;
    select({
      albumId,
      trackId: trackId ?? (selected.scope === scope && selected.albumId === albumId ? selected.trackId : null),
    });
    onOpenProjectPreview();
  };
  const mediaElement = <video ref={mediaRef} hidden={!video} controls playsInline preload="none" className="max-h-48 w-full rounded" aria-label="Scene Multimedia"
    onPlay={() => player.mediaChanged()} onPause={() => player.mediaChanged()} onEnded={() => player.mediaChanged('', true)}
    onError={() => { if (mediaRef.current?.getAttribute('src')) player.mediaChanged('Media could not be loaded. Select the Track and retry Play.'); }} />;
  return <Context.Provider value={{
    ...current,
    scope,
    projectId: id,
    player,
    scene,
    setScene,
    selection: selectionState.scope === scope ? selectionState : emptySelection,
    select,
    canOpenPreview: Boolean(id && onOpenProjectPreview),
    previewAlbum,
    act,
    setMediaHost,
  }}>
    {children}
    {mediaHost ? createPortal(mediaElement, mediaHost) : <div hidden>{mediaElement}</div>}
  </Context.Provider>;
}

/** Mounted inside the persistent Project menu; hiding the menu never replaces its media element. */
export function ProjectMultimediaPlayback({ selectionChosen, selectionReady, onPlaySelection }: {
  selectionChosen: boolean;
  selectionReady: boolean;
  onPlaySelection: () => void;
}) {
  const multimedia = useSceneMultimedia();
  if (!multimedia) return null;
  const { state, busy, error, act, setMediaHost } = multimedia;
  return <section aria-label="Project Multimedia player" className="space-y-2 border-t pt-3" hidden={!state && !error && !selectionChosen}>
    {state && <div>
      <p className="font-semibold">Current Album: {state.albumTitle}</p>
      <p role="status">{state.track.title} · <span className="capitalize">{state.status}</span></p>
    </div>}
    <div ref={setMediaHost} />
    <div className="flex flex-wrap gap-1">
      <Button type="button" size="xs" variant="outline" disabled={busy || (selectionChosen ? !selectionReady : !state)} onClick={() => selectionChosen ? onPlaySelection() : act('playMultimedia')}>Play</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('pauseMultimedia')}>Pause</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('stopMultimedia')}>Stop</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('rewindMultimedia')}>Rewind</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('nextTrack')}>Next Track</Button>
    </div>
    {state?.markerId === null && multimedia.canOpenPreview && <Button type="button" size="xs" variant="ghost" onClick={() => multimedia.previewAlbum(state.albumId, state.track.id)}>Show current Album</Button>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
