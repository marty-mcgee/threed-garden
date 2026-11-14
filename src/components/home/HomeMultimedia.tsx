'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { MultimediaPlayer } from '@/components/multimedia/MultimediaPlayer';
import { AlbumLyrics } from '@/components/multimedia/AlbumLyrics';
import { Button } from '@/components/ui/button';

type PlayerProps = ComponentProps<typeof MultimediaPlayer>;
type Album = PlayerProps['album'];
type Track = PlayerProps['track'];

export function HomeMultimedia() {
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setPlaybackError('');
    setIsPlaying(false);
    setAlbum(null);
    setTracks([]);
    const load = async () => {
      try {
        const response = await fetch('/api/multimedia/albums?scope=public', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Albums unavailable');
        const albumResult = await response.json();
        if (!albumResult.success || !Array.isArray(albumResult.data)) throw new Error('Invalid Albums');
        const albums: Album[] = albumResult.data;
        if (!albums.length) return;
        const selected = albums[0];
        if (!Number.isSafeInteger(selected.id) || selected.id <= 0) throw new Error('Invalid Album');
        const trackResponse = await fetch(`/api/multimedia/tracks?scope=public&albumId=${selected.id}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!trackResponse.ok) throw new Error('Tracks unavailable');
        const trackResult = await trackResponse.json();
        if (!trackResult.success || !Array.isArray(trackResult.data)) throw new Error('Invalid Tracks');
        const nextTracks: Track[] = trackResult.data;
        if (controller.signal.aborted) return;
        setAlbum(selected);
        setTracks(nextTracks);
        setCurrentTrackIndex(0);
      } catch {
        if (!controller.signal.aborted) setError('Featured Multimedia could not be loaded. Please retry or explore the library.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const element = new Audio();
    element.preload = 'metadata';
    setAudio(element);
    return () => {
      element.pause();
      element.removeAttribute('src');
      element.load();
    };
  }, []);

  useEffect(() => {
    if (!audio) return;
    audio.pause();
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError('');
    if (currentTrack?.fileUrl) audio.src = currentTrack.fileUrl;
    else audio.removeAttribute('src');
    audio.load();
  }, [audio, currentTrack]);

  useEffect(() => {
    if (!audio) return;
    let cancelled = false;
    if (isPlaying && currentTrack?.fileUrl) {
      void audio.play().catch(() => {
        if (cancelled) return;
        setIsPlaying(false);
        setPlaybackError('Playback could not start. Try Play again, or reload the featured media.');
      });
    } else audio.pause();
    return () => { cancelled = true; };
  }, [audio, currentTrack, isPlaying]);

  useEffect(() => {
    if (audio) audio.volume = isMuted ? 0 : volume;
  }, [audio, isMuted, volume]);

  useEffect(() => {
    if (!audio) return;
    const time = () => setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    const metadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const ended = () => {
      if (tracks.length > 1) setCurrentTrackIndex(index => (index + 1) % tracks.length);
      else setIsPlaying(false);
    };
    const failed = () => {
      if (!audio.getAttribute('src')) return;
      setIsPlaying(false);
      setPlaybackError('This Track could not be played. Reload the featured media to retry.');
    };
    audio.addEventListener('timeupdate', time);
    audio.addEventListener('durationchange', metadata);
    audio.addEventListener('ended', ended);
    audio.addEventListener('error', failed);
    return () => {
      audio.removeEventListener('timeupdate', time);
      audio.removeEventListener('durationchange', metadata);
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('error', failed);
    };
  }, [audio, tracks.length]);

  const selectTrack = (index: number) => {
    if (!tracks[index]) return;
    setCurrentTrackIndex(index);
    setPlaybackError('');
    setIsPlaying(true);
  };
  const retry = () => {
    audio?.pause();
    setIsPlaying(false);
    setAttempt(value => value + 1);
  };
  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
  };

  return <section aria-labelledby="home-multimedia-title" className="threed-presentation-surface border-y px-6 py-12">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><h2 id="home-multimedia-title" className="text-3xl font-semibold tracking-tight">Take a moment to listen.</h2><p className="mt-3 text-muted-foreground">Featured Multimedia from the public library. Playback starts when you choose Play.</p></div>
        <Link href="/dashboard/multimedia" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">Explore Multimedia</Link>
      </div>
      {loading && <p role="status" className="py-8 text-muted-foreground">Loading featured Multimedia…</p>}
      {!loading && error && <div className="flex flex-wrap items-center gap-3"><p role="alert">{error}</p><Button variant="outline" onClick={retry}>Retry Multimedia</Button></div>}
      {!loading && !error && (!album || !currentTrack) && <div className="flex flex-wrap items-center gap-3"><p role="status" className="text-muted-foreground">No featured Tracks are available right now. Explore the library for more media.</p><Button variant="outline" onClick={retry}>Refresh Multimedia</Button></div>}
      {!loading && !error && album && currentTrack && <>
        <h3 className="mb-1 text-xl font-semibold">{album.title}</h3><p className="mb-5 text-sm text-muted-foreground">{album.artist}</p>
        {(playbackError || !currentTrack.fileUrl) && <div className="mb-4 flex flex-wrap items-center gap-3"><p role="alert">{playbackError || 'This Track has no playable audio. Choose another Track or explore the library.'}</p><Button variant="outline" onClick={retry}>Reload featured media</Button></div>}
        <MultimediaPlayer
          lyricsPanel={<AlbumLyrics albumId={album.id} albumTitle={album.title} />}
          track={currentTrack}
          album={album}
          tracks={tracks}
          isPlaying={isPlaying && Boolean(currentTrack.fileUrl)}
          onPlayPause={() => { setPlaybackError(''); setIsPlaying(value => !value); }}
          onNext={() => selectTrack((currentTrackIndex + 1) % tracks.length)}
          onPrevious={() => selectTrack((currentTrackIndex - 1 + tracks.length) % tracks.length)}
          onSeek={value => { if (audio && Number.isFinite(value[0])) { audio.currentTime = value[0]; setCurrentTime(value[0]); } }}
          onTrackSelect={selectTrack}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={value => { setVolume(value[0]); setIsMuted(value[0] === 0); }}
          onToggleMute={() => setIsMuted(value => !value)}
          formatTime={formatTime}
        />
      </>}
    </div>
  </section>;
}
