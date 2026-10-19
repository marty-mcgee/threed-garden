// Dashboard Album browsing and playback.
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AlbumGrid } from '@/components/multimedia/AlbumGrid';
import { MultimediaPlayer } from '@/components/multimedia/MultimediaPlayer';
import { Button } from '@/components/ui/button';
import { MediaGallery } from './MediaGallery';
import { LatestDashboardRequest, loadDashboardAlbum, loadDashboardAlbums, readDashboardSelection, dashboardSelectionUrl, type DashboardSelection, type DashboardAlbum, type DashboardTrack } from '@/libraries/services/multimedia/dashboard';

export default function MultimediaContent() {
  const [albums, setAlbums] = useState<DashboardAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<DashboardAlbum | null>(null);
  const [tracks, setTracks] = useState<DashboardTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  
  const [listError, setListError] = useState('');
  const [albumError, setAlbumError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const nextOffset = useRef(0);
  const listRequests = useRef(new LatestDashboardRequest());
  const albumRequests = useRef(new LatestDashboardRequest());
  const selectedId = useRef<number | null>(null);
  const linkedSelection = useRef(false);
  const firstAlbum = useRef<DashboardAlbum | undefined>(undefined);
  firstAlbum.current = albums[0];

  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [mediaElement, setMediaElement] = useState<HTMLMediaElement | null>(null);
  const currentTrack = tracks[currentTrackIndex];

  const isVideo = currentTrack?.fileType?.startsWith('video/') ?? false;
  const playbackReady = mediaElement && (mediaElement.tagName === 'VIDEO') === isVideo;
  const [playbackError, setPlaybackError] = useState('');
  const activeMedia = useRef<HTMLMediaElement | null>(null);
  const onMediaPlay = useCallback((element: HTMLMediaElement) => {
    if (activeMedia.current && activeMedia.current !== element) activeMedia.current.pause();
    activeMedia.current = element;
  }, []);
  const videoRef = useCallback((element: HTMLVideoElement | null) => setMediaElement(element), []);

  // Fetch albums on load
  useEffect(() => {
    const openLocation = () => {
      const selection = readDashboardSelection(window.location.search);
      linkedSelection.current = Boolean(selection.albumId || selection.error);
      if (selection.error) {
        albumRequests.current.cancel(); activeMedia.current?.pause();
        setTracks([]); setSelectedAlbum(null); setIsPlaying(false); setLoadingAlbum(false);
        setAlbumError(selection.error); selectedId.current = null;
      } else if (selection.albumId) {
        void selectAlbum(selection.albumId, false, selection);
      } else if (firstAlbum.current) {
        void selectAlbum(firstAlbum.current);
      } else {
        albumRequests.current.cancel(); activeMedia.current?.pause();
        selectedId.current = null; setSelectedAlbum(null); setTracks([]);
        setIsPlaying(false); setLoadingAlbum(false); setAlbumError('');
      }
    };
    openLocation();
    void fetchAlbums(0);
    window.addEventListener('popstate', openLocation);
    return () => { window.removeEventListener('popstate', openLocation); listRequests.current.cancel(); albumRequests.current.cancel(); activeMedia.current?.pause(); };
  }, []);

  // Set up audio element
  useEffect(() => {
    if (isVideo) return;
    const audio = new Audio();
    setMediaElement(audio);
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [isVideo]);

  // Keep one selected Track element; switching type never loads into the old element.
  useEffect(() => {
    if (playbackReady && !currentTrack?.fileUrl) {
      mediaElement.pause(); mediaElement.src = ''; setIsPlaying(false);
      if (currentTrack) setPlaybackError('This Track has no available playback file.');
      return;
    }
    if (playbackReady && currentTrack?.fileUrl) {
      setPlaybackError(''); setCurrentTime(0); setDuration(0);
      mediaElement.src = currentTrack.fileUrl;
      mediaElement.load();
    }
  }, [currentTrack, mediaElement, playbackReady]);

  // Handle play/pause
  useEffect(() => {
    let active = true;
    if (mediaElement && playbackReady) {
      if (isPlaying && currentTrack?.fileUrl) {
        mediaElement.play().catch((error) => {
          if (active) { setIsPlaying(false); setPlaybackError('Playback could not start. Use Play to try again.'); }
        });
      } else {
        mediaElement.pause();
      }
    }
    return () => { active = false; };
  }, [isPlaying, currentTrack, mediaElement, playbackReady]);

  // Handle volume
  useEffect(() => {
    if (mediaElement && playbackReady) {
      mediaElement.volume = volume;
      mediaElement.muted = isMuted;
    }
  }, [volume, isMuted, mediaElement, playbackReady]);

  // Handle time updates and track ending
  useEffect(() => {
    if (mediaElement && playbackReady) {
      const handlePlay = () => { onMediaPlay(mediaElement); setIsPlaying(true); setPlaybackError(''); };
      const handlePause = () => setIsPlaying(false);
      const handleVolume = () => { setVolume(mediaElement.volume); setIsMuted(mediaElement.muted); };
      const handleError = () => { setIsPlaying(false); setPlaybackError('This file could not be played. Its format may not be supported or the file may be unavailable.'); };
      const handleTimeUpdate = () => setCurrentTime(mediaElement.currentTime);
      const handleDurationChange = () => setDuration(mediaElement.duration);
      const handleEnded = () => {
        const isLastTrack = currentTrackIndex === tracks.length - 1;
        
        if (isLastTrack) {
          const currentAlbumIndex = albums.findIndex(a => a.id === selectedAlbum?.id);
          const nextAlbum = albums[currentAlbumIndex + 1];
          
          if (nextAlbum) {
            handleSelectAlbum(nextAlbum.id);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
            if (mediaElement && playbackReady) {
              mediaElement.currentTime = 0;
            }
          }
        } else {
          const nextIndex = currentTrackIndex + 1;
          setCurrentTrackIndex(nextIndex);
          if (selectedAlbum) window.history.replaceState(null, '', dashboardSelectionUrl(selectedAlbum.id, tracks[nextIndex].id));
          setIsPlaying(true);
        }
      };

      mediaElement.addEventListener('volumechange', handleVolume);
      mediaElement.addEventListener('play', handlePlay);
      mediaElement.addEventListener('pause', handlePause);
      mediaElement.addEventListener('error', handleError);
      mediaElement.addEventListener('timeupdate', handleTimeUpdate);
      mediaElement.addEventListener('durationchange', handleDurationChange);
      mediaElement.addEventListener('ended', handleEnded);

      return () => {
        mediaElement.removeEventListener('volumechange', handleVolume);
        mediaElement.removeEventListener('play', handlePlay);
        mediaElement.removeEventListener('pause', handlePause);
        mediaElement.removeEventListener('error', handleError);
        mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
        mediaElement.removeEventListener('durationchange', handleDurationChange);
        mediaElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [mediaElement, playbackReady, currentTrackIndex, tracks.length, selectedAlbum, albums]);

  const fetchAlbums = async (offset: number) => {
    const request = listRequests.current.begin();
    setListError('');
    setLoadingMore(true);
    try {
      const page = await loadDashboardAlbums(offset, request.signal);
      if (!request.current()) return;
      setAlbums(previous => offset === 0 ? page.albums : [...previous, ...page.albums.filter(album => !previous.some(item => item.id === album.id))]);
      nextOffset.current = offset + page.albums.length;
      setHasMore(page.albums.length > 0 && nextOffset.current < page.total);
      if (!linkedSelection.current && selectedId.current === null && page.albums.length) void selectAlbum(page.albums[0]);
    } catch {
      if (request.current()) setListError('Unable to load Albums. Please retry.');
    } finally {
      if (request.current()) { setLoading(false); setLoadingMore(false); }
    }
  };

  const selectAlbum = async (album: DashboardAlbum | number, play = false, selection?: DashboardSelection) => {
    const id = typeof album === 'number' ? album : album.id;
    const request = albumRequests.current.begin();
    selectedId.current = id;
    setSelectedAlbum(typeof album === 'number' ? null : { ...album, tracks: [], links: [], media: [] });
    activeMedia.current?.pause();
    setPlaybackError('');
    setTracks([]);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (mediaElement && playbackReady) { mediaElement.pause(); mediaElement.src = ''; }
    setAlbumError('');
    setLoadingAlbum(true);
    try {
      const details = await loadDashboardAlbum(id, request.signal);
      if (!request.current()) return;
      let index = 0;
      if (selection?.trackId !== null && selection?.trackId !== undefined) index = details.tracks!.findIndex(track => track.id === selection.trackId);
      else if (selection?.trackNumber !== null && selection?.trackNumber !== undefined) {
        const matches = details.tracks!.map((track, index) => ({ track, index })).filter(item => item.track.trackNumber === selection.trackNumber);
        index = matches.length === 1 ? matches[0].index : -1;
      }
      if (index < 0) {
        setAlbumError('The requested Track is unavailable or its Track number is ambiguous.');
        setSelectedAlbum(details); setTracks([]); return;
      }
      setSelectedAlbum(details);
      setTracks(details.tracks || []);
      setCurrentTrackIndex(index);
      setIsPlaying(play && Boolean(details.tracks?.length));
    } catch {
      if (request.current()) setAlbumError('Unable to load this Album. It may no longer be available.');
    } finally {
      if (request.current()) setLoadingAlbum(false);
    }
  };

  const handleSelectAlbum = (id: number) => {
    const album = albums.find(item => item.id === id);
    if (album) { window.history.pushState(null, '', dashboardSelectionUrl(id)); void selectAlbum(album); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayPause = () => {
    if (currentTrack) { setPlaybackError(''); if (mediaElement?.error) mediaElement.load(); setIsPlaying(!isPlaying); }
  };
  
  const handleNext = () => {
    if (!tracks.length) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    if (selectedAlbum) window.history.pushState(null, '', dashboardSelectionUrl(selectedAlbum.id, tracks[nextIndex].id));
    setIsPlaying(true);
  };
  
  const handlePrevious = () => {
    if (!tracks.length) return;
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    if (selectedAlbum) window.history.pushState(null, '', dashboardSelectionUrl(selectedAlbum.id, tracks[prevIndex].id));
    setIsPlaying(true);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const handleToggleMute = () => setIsMuted(!isMuted);
  
  const handleSeek = (value: number[]) => {
    if (mediaElement && playbackReady) {
      mediaElement.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleTrackSelect = (index: number) => {
    if (!tracks[index] || !selectedAlbum) return;
    window.history.pushState(null, '', dashboardSelectionUrl(selectedAlbum.id, tracks[index].id));
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const handlePlayAlbum = (id: number) => {
    const album = albums.find(item => item.id === id);
    if (album) { window.history.pushState(null, '', dashboardSelectionUrl(id)); void selectAlbum(album, true); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full px-4 py-4">
        <header className="mb-4 flex min-h-9 flex-wrap items-center gap-2 border-b pb-2"><h1 className="text-sm font-semibold">Multimedia</h1><span className="rounded border px-1.5 py-0.5 text-xs">{albums.length} Albums loaded</span></header>

        {loadingAlbum && (
          <div className="mb-4 p-2 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
            Loading album...
          </div>
        )}

        {albumError && <div role="alert" className="mb-4">{albumError} {selectedId.current && <Button variant="outline" onClick={() => { const selection = readDashboardSelection(window.location.search); void selectAlbum(selectedId.current!, false, selection.error ? undefined : selection); }}>Retry Album</Button>}</div>}
        {!loadingAlbum && !albumError && selectedAlbum && !currentTrack && (
          <section className="mb-6 space-y-3">
            <h2 className="text-xl font-semibold">{selectedAlbum.title}</h2>
            <p>No active Tracks available for this Album.</p>
            <h3>Links</h3>
            {selectedAlbum.links?.length ? selectedAlbum.links.map(link => <a className="block underline" key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>) : <p>No Links available.</p>}
            {selectedAlbum.media?.length ? <MediaGallery key={selectedAlbum.id} media={selectedAlbum.media} onMediaPlay={onMediaPlay} /> : <p>No Media available.</p>}
          </section>
        )}

        {selectedAlbum && currentTrack && (
          <div id="music-player" className="mb-6">
            {playbackError && <p role="alert" className="mb-2 text-sm text-destructive">{playbackError}</p>}
            <MultimediaPlayer
              key={selectedAlbum.id}
              mediaPreview={isVideo ? <video ref={videoRef} controls playsInline preload="metadata" aria-label={currentTrack.title} className="aspect-video w-full rounded border bg-black" /> : undefined}
              onMediaPlay={onMediaPlay}
              track={currentTrack}
              album={{ ...selectedAlbum, tracks }}
              tracks={tracks}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSeek={handleSeek}
              onTrackSelect={handleTrackSelect}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
              formatTime={formatTime}
            />
          </div>
        )}

        {!albums.length && !listError && <p>No public Albums available.</p>}
        {listError && <div role="alert">{listError} <Button variant="outline" disabled={loadingMore} onClick={() => void fetchAlbums(nextOffset.current)}>Retry Albums</Button></div>}
        <AlbumGrid
          albums={albums}
          onSelectAlbum={handleSelectAlbum}
          selectedAlbumId={selectedAlbum?.id}
          onPlayAlbum={handlePlayAlbum}
        />
        {hasMore && <Button className="mt-6" variant="outline" disabled={loadingMore} onClick={() => void fetchAlbums(nextOffset.current)}>{loadingMore ? 'Loading Albums...' : 'Load more Albums'}</Button>}
      </div>
    </div>
  );
}
