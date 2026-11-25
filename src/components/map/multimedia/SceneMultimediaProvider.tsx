'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectMediaViewer } from '../panels/ProjectMediaViewer';
import { useProjectPresentationReleased } from '../presentation/ProjectPresentationBoundary';
import { SceneMultimediaPlayer, type MultimediaScene, type ScenePlaybackState } from '@/libraries/services/threed/multimedia/scene-multimedia-player';
import { parseSceneMultimediaResponse, type SceneMultimediaQuery, type MultimediaAction } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';
import { parseProjectMultimediaPreview, type ProjectMultimediaPreviewQuery } from '@/libraries/services/project/multimedia-preview-contract';
import { referenceMediaFile, type ProjectReferenceFile } from '@/libraries/services/project/reference-media-file';
import type { ProjectMediaViewerState, ProjectMultimediaWorkspaceState, ProjectReferenceMediaWorkspaceState } from '@/libraries/services/threed/markers/project-view-state-core';

export type ProjectMultimediaSelection = Pick<ProjectMultimediaWorkspaceState, 'albumId' | 'trackId'>;
export type ProjectMultimediaCapture = Omit<ProjectMultimediaWorkspaceState, 'open'>;
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
  const data = parseProjectMultimediaPreview(body);
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
  const data = parseSceneMultimediaResponse(body);
  if (data.projectId !== query.projectId || data.markerId !== query.markerId || data.albumId !== query.albumId) throw Error('Project Multimedia response does not match the selection.');
  return data;
}

type View = {
  scope: string;
  state: ScenePlaybackState | null;
  busy: boolean;
  error: string;
};
type OpenReference = {
  scope: string;
  saved: ProjectReferenceMediaWorkspaceState;
  file?: ProjectReferenceFile;
  failed?: boolean;
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
  openReference: (file: ProjectReferenceFile, library?: boolean) => void;
  previewAlbum: (albumId: number, trackId?: number) => void;
  act: (action: MultimediaAction) => void;
  media: HTMLVideoElement | null;
  mediaTime: number;
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
  onRegisterWorkspace?: (capture: (() => ProjectMultimediaCapture) | null) => void;
  onOpenProjectPreview?: () => void;
}) {
  const { data: session, status } = useSession();
  const presentationReleased = useProjectPresentationReleased();
  const id = Number(projectId) || 0;
  const scope = `${id}:${status}:${session?.user?.id ?? 'public'}`;
  const currentScope = useRef(scope);
  const [reference, setReference] = useState<OpenReference | null>(null);
  const referenceRef = useRef<OpenReference | null>(null);
  const referenceTouched = useRef('');
  const [referenceAttempt, setReferenceAttempt] = useState(0);
  const viewerCapture = useRef<(() => ProjectMediaViewerState) | null>(null);
  const registerView = useCallback((capture: (() => ProjectMediaViewerState) | null) => {
    viewerCapture.current = capture;
  }, []);
  const showReference = useCallback((entry: OpenReference | null) => {
    viewerCapture.current = null;
    referenceRef.current = entry;
    setReference(entry);
  }, []);
  currentScope.current = scope;
  const projectRef = useRef(id);
  projectRef.current = id;
  const sceneRef = useRef<MultimediaScene | null>(null);
  const [mediaTime, setMediaTime] = useState(0);
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
    showReference(null);
    referenceTouched.current = '';
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
  }, [scope, player, showReference]);
  useEffect(() => {
    onRegisterWorkspace?.(() => {
      const entry = referenceRef.current;
      const album = selectionRef.current.scope === currentScope.current ? selectionRef.current : emptySelection;
      const snapshot: ProjectMultimediaCapture = {
        albumId: album.albumId,
        trackId: album.trackId,
      };
      if (entry?.scope === currentScope.current) {
        const view = viewerCapture.current?.();
        snapshot.reference = view ? { ...entry.saved, view } : entry.saved;
      }
      return snapshot;
    });
    return () => onRegisterWorkspace?.(null);
  }, [onRegisterWorkspace]);

  const savedReference = initialWorkspace?.reference;
  useEffect(() => {
    if (status !== 'authenticated' || !id || !workspaceSavedAt || referenceTouched.current === scope) return;
    if (!savedReference) {
      showReference(null);
      return;
    }
    const current = referenceRef.current;
    if (current?.scope === scope && current.file && current.saved.mediaId === savedReference.mediaId
      && current.saved.library === savedReference.library) return;
    const abort = new AbortController();
    const entry = {
      scope,
      saved: savedReference,
    };
    // Save can capture the intended file while its current URL is being resolved.
    showReference(entry);
    const params = new URLSearchParams({
      projectId: String(id),
      mediaId: String(savedReference.mediaId),
    });
    if (savedReference.library) params.set('library', '1');
    const stillCurrent = () => !abort.signal.aborted && currentScope.current === scope && referenceRef.current === entry;
    async function restore() {
      try {
        const response = await fetch(`/api/project/reference-media?${params}`, { signal: abort.signal, cache: 'no-store' });
        if ([401, 403, 404].includes(response.status)) {
          if (stillCurrent()) showReference(null);
          return;
        }
        if (!response.ok) throw Error('Reference Media lookup failed');
        const { items } = await response.json();
        if (!stillCurrent()) return;
        const item = items.find((row: { id: number }) => row.id === entry.saved.mediaId);
        const file = item && referenceMediaFile(item, window.location.origin);
        showReference(file ? { ...entry, file } : null);
      } catch {
        if (stillCurrent()) showReference({ ...entry, failed: true });
      }
    }
    void restore();
    return () => abort.abort();
  }, [id, scope, status, workspaceSavedAt, savedReference, referenceAttempt, showReference]);

  function openReference(file: ProjectReferenceFile, library = false) {
    referenceTouched.current = scope;
    const existing = referenceRef.current;
    if (existing?.scope === scope && existing.file?.id === file.id) return;
    showReference({
      scope,
      file,
      saved: library ? { mediaId: file.id, library: true } : { mediaId: file.id },
    });
  }
  function closeReference() {
    referenceTouched.current = scope;
    showReference(null);
  }
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
    onTimeUpdate={event => setMediaTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setMediaTime(event.currentTarget.currentTime)} onEmptied={() => setMediaTime(0)}
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
    openReference,
    previewAlbum,
    act,
    setMediaHost,
    media: mediaRef.current,
    mediaTime,
  }}>
    {children}
    {reference?.scope === scope && reference.file && <ProjectMediaViewer key={scope + ':' + reference.file.id}
      name={reference.file.name} src={reference.file.src} kind={reference.file.kind} initialView={reference.saved.view}
      presented={presentationReleased} onRegisterView={registerView} onClose={closeReference} />}
    {presentationReleased && reference?.scope === scope && reference.failed && <div role="alert" className="threed-workspace-panel threed-scene-panel-surface fixed bottom-4 right-4 z-[60] rounded-md border p-3 text-sm shadow-lg">
      <p>The saved Media file could not be loaded.</p>
      <div className="mt-2 flex gap-2">
        <Button type="button" size="sm" onClick={() => setReferenceAttempt(value => value + 1)}>Retry</Button>
        <Button type="button" size="sm" variant="ghost" onClick={closeReference}>Close</Button>
      </div>
    </div>}
    {mediaHost ? createPortal(mediaElement, mediaHost) : <div hidden>{mediaElement}</div>}
  </Context.Provider>;
}

/** Mounted inside the persistent Project menu; hiding the menu never replaces its media element. */
export function ProjectMultimediaPlayback({ selectionAlbumId, selectionTrackId, selectionChosen, selectionReady, onPlaySelection }: {
  selectionAlbumId?: number | null;
  selectionTrackId?: number | null;
  selectionChosen: boolean;
  selectionReady: boolean;
  onPlaySelection: () => void;
}) {
  const multimedia = useSceneMultimedia();
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const media = multimedia?.media;
    if (!media) return;
    const syncVolume = () => {
      setVolume(media.volume);
      setMuted(media.muted);
    };
    syncVolume();
    media.addEventListener('volumechange', syncVolume);
    return () => media.removeEventListener('volumechange', syncVolume);
  }, [multimedia?.media]);
  if (!multimedia) return null;
  const { state, busy, error, act, setMediaHost, media, mediaTime } = multimedia;
  const duration = media && Number.isFinite(media.duration) ? media.duration : 0;
  const formatTime = (time: number) => Math.floor(time / 60) + ':' + String(Math.floor(time % 60)).padStart(2, '0');
  return <section aria-label="Project Multimedia player" className="space-y-2 border-t pt-3" hidden={!state && !error && !selectionChosen}>
    {state && <div>
      {state.albumId !== selectionAlbumId && <p className="font-semibold">Playing from: {state.albumTitle}</p>}
      <p role="status">{state.track.title} · <span className="capitalize">{state.status}</span></p>
    </div>}
    <div ref={setMediaHost} />
    {state && <div className="space-y-2">
      <Slider aria-label="Playback position" min={0} max={duration || 1} step={0.1} value={[Math.min(mediaTime, duration)]} disabled={!duration || busy} onValueChange={([value]) => { if (media && duration) media.currentTime = value; }} />
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{formatTime(mediaTime)}</span><span>{formatTime(duration)}</span></div>
      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { if (media) { media.muted = !media.muted; setMuted(media.muted); } }}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
        <Slider aria-label="Volume" min={0} max={1} step={0.01} value={[muted ? 0 : volume]} onValueChange={([value]) => { if (media) { media.volume = value; media.muted = false; setVolume(value); setMuted(false); } }} />
      </div>
    </div>}
    <div className="flex flex-wrap gap-1">
      <Button type="button" size="xs" variant="outline" disabled={busy || (selectionChosen ? !selectionReady : !state)} onClick={() => selectionChosen ? onPlaySelection() : act('playMultimedia')}>Play</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('pauseMultimedia')}>Pause</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('stopMultimedia')}>Stop</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('rewindMultimedia')}>Rewind</Button>
      <Button type="button" size="xs" variant="outline" disabled={busy || !state} onClick={() => act('nextTrack')}>Next Track</Button>
    </div>
    {state?.markerId === null && multimedia.canOpenPreview && (state.albumId !== selectionAlbumId || state.track.id !== selectionTrackId) && <Button type="button" size="xs" variant="ghost" onClick={() => multimedia.previewAlbum(state.albumId, state.track.id)}>Show current Album</Button>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
