'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { loadProjectMultimediaPreview, ProjectMultimediaPlayback, useSceneMultimedia } from '../multimedia/SceneMultimediaProvider';
import type { ProjectMultimediaPreview } from '@/libraries/services/project/multimedia-preview-contract';
import type { MultimediaAction } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';

export function ProjectMultimediaToolbarButton({ open, onClick, triggerRef }: {
  open: boolean;
  onClick: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
  return <Button ref={triggerRef} type="button" variant={open ? 'secondary' : 'outline'} size="sm" className="h-7 gap-1 px-2 text-xs" aria-label="Project Multimedia" aria-expanded={open} aria-controls="project-multimedia-overlay" onClick={onClick} title="Project Multimedia">
    <ModuleIcon moduleKey="multimedia" inheritColor className="h-3.5 w-3.5" /><span className="hidden sm:inline">Multimedia</span>
  </Button>;
}

export function ProjectMultimediaOverlay({ projectId, onClose, open = true }: { projectId: string; onClose: () => void; open?: boolean }) {
  const { data: session, status } = useSession();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  return <section id="project-multimedia-overlay" hidden={!open} role="region" aria-labelledby="project-multimedia-title"
    className="threed-workspace-panel threed-scene-panel-surface absolute right-2 top-[38px] z-[46] flex max-h-[calc(100%-46px)] w-96 max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-md border shadow-xl backdrop-blur-md"
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
    <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
      <h2 id="project-multimedia-title" className="flex items-center gap-2 text-sm font-semibold"><ModuleIcon moduleKey="multimedia" className="h-4 w-4" />Project Multimedia</h2>
      <Button ref={closeRef} type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Close Project Multimedia" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
    </header>
    <div className="min-h-0 overflow-y-auto overscroll-contain p-3 text-xs">
      {status === 'loading' ? <p role="status">Checking Multimedia access…</p> : <ProjectMultimediaBrowser key={`${projectId}:${status}:${session?.user?.id ?? 'public'}`} projectId={Number(projectId)} />}
    </div>
  </section>;
}

type Album = {
  id: number;
  title: string;
  artist: string;
};
function ProjectMultimediaBrowser({ projectId }: { projectId: number }) {
  const multimedia = useSceneMultimedia();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const albumId = multimedia?.selection.albumId ?? null;
  const trackId = multimedia?.selection.trackId ?? null;
  const setAlbumId = (albumId: number | null) => multimedia?.select({ albumId, trackId: null });
  const setTrackId = (trackId: number | null) => multimedia?.select({ albumId, trackId });
  const [trackPage, setTrackPage] = useState<{ albumId: number | null; offset: number }>({
    albumId: null,
    offset: 0,
  });
  const trackOffset = trackPage.albumId === albumId ? trackPage.offset : 0;
  const setTrackOffset = (offset: number) => setTrackPage({
    albumId,
    offset,
  });
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState('');
  const [albums, setAlbums] = useState<{
    key: string;
    rows: Album[];
    hasMore: boolean;
    error: string;
  } | null>(null);
  const [tracks, setTracks] = useState<{
    key: string;
    data: ProjectMultimediaPreview | null;
    error: string;
  } | null>(null);
  const albumKey = `${projectId}:${search}:${offset}:${retry}`;
  const trackKey = `${projectId}:${albumId}:${trackOffset}:${retry}`;
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams({
      projectId: String(projectId),
      search,
      offset: String(offset),
    });
    void fetch(`/api/project/multimedia-albums?${query}`, {
      signal: abort.signal,
      cache: 'no-store',
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Albums could not be loaded.');
      if (!Array.isArray(data.albums)) throw Error('Albums returned an invalid page.');
      if (!abort.signal.aborted) setAlbums({
        key: albumKey,
        rows: data.albums,
        hasMore: data.hasMore === true,
        error: '',
      });
    }).catch(error => {
      if (!abort.signal.aborted) setAlbums({
        key: albumKey,
        rows: [],
        hasMore: false,
        error: error instanceof Error ? error.message : 'Albums could not be loaded.',
      });
    });
    return () => abort.abort();
  }, [albumKey, projectId, search, offset]);
  useEffect(() => {
    if (!albumId) return;
    const abort = new AbortController();
    void loadProjectMultimediaPreview({
      projectId,
      albumId,
      trackId,
      offset: trackOffset,
    }, abort.signal).then(data => {
      if (!abort.signal.aborted) setTracks({
        key: trackKey,
        data,
        error: '',
      });
    }).catch(error => {
      if (!abort.signal.aborted) setTracks({
        key: trackKey,
        data: null,
        error: error instanceof Error ? error.message : 'Tracks could not be loaded.',
      });
    });
    return () => abort.abort();
  }, [trackKey, projectId, albumId, trackId, trackOffset]);
  const currentAlbums = albums?.key === albumKey ? albums : null;
  const currentTracks = tracks?.key === trackKey ? tracks : null;
  const data = currentTracks?.data;
  const album = data?.albums.find(item => item.id === albumId);
  const selectedTrack = trackId ? data?.tracks.find(track => track.id === trackId) : data?.tracks[0];
  const pageOffset = data?.offset ?? trackOffset;
  useEffect(() => {
    if (trackId === null && albumId && selectedTrack) multimedia?.select({
      albumId,
      trackId: selectedTrack.id,
    });
  }, [trackId, albumId, selectedTrack?.id, multimedia?.select]);
  const ready = !!multimedia && !!selectedTrack && !multimedia.busy;
  const play = async (action: MultimediaAction) => {
    if (!albumId || !multimedia || !ready) return;
    setMessage('');
    try {
      await multimedia.player.executeProject({
        projectId,
        albumId,
        action,
        ...(action === 'playMultimedia' ? { trackId: selectedTrack!.id } : {}),
      }, crypto.randomUUID());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Preview failed.');
    }
  };
  return <div className="space-y-3">
    <p className="text-muted-foreground">Browse this Project’s Albums and preview their Tracks.</p>
    <Input aria-label="Search Project Albums" placeholder="Search Albums or artists…" maxLength={120} value={search} className="h-8 text-xs" onChange={event => { setSearch(event.target.value); setOffset(0); }} />
    {!currentAlbums && <p role="status">Loading Albums…</p>}
    {currentAlbums?.error && <p role="alert">{currentAlbums.error}</p>}
    {currentAlbums && !currentAlbums.error && !currentAlbums.rows.length && <p>{search ? 'No Albums match this search.' : 'No available Albums are assigned to this Project.'}</p>}
    <div className="space-y-1">{currentAlbums?.rows.map(item => <Button key={item.id} type="button" variant={albumId === item.id ? 'secondary' : 'ghost'} aria-pressed={albumId === item.id} className="h-auto w-full justify-start whitespace-normal px-2 py-2 text-left text-xs" onClick={() => { setAlbumId(item.id); setTrackOffset(0); setMessage(''); }}>
      <span className="min-w-0 break-words"><span className="block font-medium">{item.title}</span><span className="block text-muted-foreground">{item.artist}</span></span>
    </Button>)}</div>
    <div className="flex flex-wrap gap-1">
      <Button type="button" size="xs" variant="ghost" onClick={() => setRetry(value => value + 1)}>Refresh Albums</Button>
      {offset > 0 && <Button type="button" size="xs" variant="ghost" onClick={() => setOffset(Math.max(0, offset - 50))}>Previous Albums</Button>}
      {currentAlbums?.hasMore && <Button type="button" size="xs" variant="ghost" onClick={() => setOffset(offset + 50)}>More Albums</Button>}
    </div>
    {albumId && <div className="space-y-2 border-t pt-3">
      {!currentTracks && <p role="status">Loading Tracks…</p>}
      {currentTracks?.error && <p role="alert">{currentTracks.error}</p>}
      {album && <div className="flex items-start gap-2">
        {album.coverArt && <img key={album.coverArt} src={album.coverArt} alt={`${album.title} cover`} className="size-14 shrink-0 rounded object-cover" onError={event => { event.currentTarget.hidden = true; }} />}
        <div className="min-w-0 break-words"><p className="font-semibold">{album.title}</p><p className="text-muted-foreground">{album.artist}</p></div>
      </div>}
      {data && !data.tracks.length && <p>No playable active Tracks on this page.</p>}
      {!!data?.tracks.length && <label className="block">Track<select aria-label="Project Multimedia Track" className="mt-1 w-full rounded border bg-background p-1" value={selectedTrack?.id} onChange={event => setTrackId(Number(event.target.value))}>
        {data.tracks.map(track => <option key={track.id} value={track.id}>{track.trackNumber ?? '—'}. {track.title}</option>)}
      </select></label>}
      <div className="flex flex-wrap gap-1">
        {pageOffset > 0 && <Button type="button" size="xs" variant="ghost" onClick={() => { setTrackOffset(Math.max(0, pageOffset - 50)); setTrackId(null); }}>Previous Tracks</Button>}
        {data?.hasMore && <Button type="button" size="xs" variant="ghost" onClick={() => { setTrackOffset(pageOffset + 50); setTrackId(null); }}>More Tracks</Button>}
      </div>
      {message && <p role="alert">{message}</p>}
    </div>}
    <ProjectMultimediaPlayback selectionChosen={!!albumId} selectionReady={ready} onPlaySelection={() => void play('playMultimedia')} />
  </div>;
}
