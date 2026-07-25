// src/components/music/NowPlayingBar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useMusicPlayer } from '@/lib/stores/music-player-store';
import { WaveformVisualizer } from '@/components/music/WaveformVisualizer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  ListMusic,
  X
} from 'lucide-react';
import Image from 'next/image';
import { formatTime, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface NowPlayingBarProps {
  className?: string;
}

export function NowPlayingBar({ className }: NowPlayingBarProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    togglePlayPause,
    setCurrentTime,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // Log state changes
  useEffect(() => {
    console.log('[NowPlayingBar] Current track:', currentTrack?.title || 'None');
    console.log('[NowPlayingBar] Is playing:', isPlaying);
    console.log('[NowPlayingBar] Queue length:', useMusicPlayer.getState().queue.length);
  }, [currentTrack, isPlaying]);

  // Initialize audio element - only once
  useEffect(() => {
    if (!audioRef.current) {
      console.log('[Player] Creating audio element');
      const audio = new Audio();
      audio.volume = volume;
      audio.preload = 'metadata';
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        console.log('[Player] Cleaning up audio element');
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Load new track when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[Player] No audio element');
      return;
    }

    if (!currentTrack) {
      console.log('[Player] No current track, pausing');
      audio.pause();
      audio.src = '';
      return;
    }

    console.log('[Player] Loading track:', currentTrack.title, 'URL:', currentTrack.s3Url);
    
    // Reset states
    setError(null);
    setIsLoading(true);
    
    // Set the source
    audio.src = currentTrack.s3Url;
    audio.load();
    
    // Handle metadata loaded
    const handleLoadedMetadata = () => {
      console.log('[Player] Metadata loaded for:', currentTrack.title);
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch((err) => {
          console.error('[Player] Play error:', err);
          setError(err.message);
          showToast('Failed to play track: ' + err.message, 'error');
        });
      }
    };

    // Handle can play
    const handleCanPlay = () => {
      console.log('[Player] Can play:', currentTrack.title);
      setIsLoading(false);
    };

    // Handle error
    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      console.error('[Player] Audio error:', target.error);
      const errorMsg = target.error?.message || 'Failed to load audio';
      setError(errorMsg);
      setIsLoading(false);
      showToast('Error loading track: ' + errorMsg, 'error');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, isPlaying, showToast]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    console.log('[Player] Play state changed:', isPlaying ? 'playing' : 'paused');
    
    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('[Player] Play error:', err);
        setError(err.message);
        showToast('Failed to play: ' + err.message, 'error');
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, showToast]);

  // Handle time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      console.log('[Player] Track ended, playing next');
      nextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextTrack, setCurrentTime]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Sync time when slider changes
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // If no track is playing, show a minimal state
  if (!currentTrack) {
    return (
      <>
        {ToastComponent}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}>
          <div className="flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
            <span>No track playing</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/dashboard/music'}
            >
              Browse Music
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {ToastComponent}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}>
        {/* Error message */}
        {error && (
          <div className="absolute bottom-full left-0 right-0 bg-destructive/10 text-destructive text-sm p-2 text-center border-b border-destructive/20">
            ⚠️ {error}
          </div>
        )}

        {/* ✅ Waveform Visualization (adds visual flair without affecting audio) */}
        {true && currentTrack && (
          <div className="px-4 pt-1 pb-0">
            <WaveformVisualizer
              audioUrl={currentTrack.s3Url}
              isPlaying={isPlaying}
              onTimeUpdate={setCurrentTime}
              height={40}
              className="w-full rounded-md overflow-hidden"
            />
          </div>
        )}

        <div className="container max-w-7xl mx-auto px-4 h-20 flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
              {currentTrack.albumArt ? (
                <Image
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  No Art
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium leading-tight">
                {currentTrack.title}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {currentTrack.artist || currentTrack.albumTitle || 'Unknown Artist'}
              </div>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex-1 flex flex-col items-center gap-1 px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={previousTrack}
                disabled={!currentTrack}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={togglePlayPause}
                disabled={!currentTrack || isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nextTrack}
                disabled={!currentTrack}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex w-full max-w-md items-center gap-2">
              <span className="text-xs text-muted-foreground tabular-nums min-w-[40px]">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={currentTrack.duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
                disabled={!currentTrack}
              />
              <span className="text-xs text-muted-foreground tabular-nums min-w-[40px]">
                {formatTime(currentTrack.duration || 0)}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 min-w-[120px] justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowQueue(!showQueue)}
            >
              <ListMusic className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => setVolume(value[0])}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Queue Panel */}
        {showQueue && <QueuePanel onClose={() => setShowQueue(false)} />}
      </div>
    </>
  );
}

// Queue Panel Component
function QueuePanel({ onClose }: { onClose: () => void }) {
  const { queue, currentIndex, currentTrack, playTrack, removeFromQueue, clearQueue } = useMusicPlayer();

  return (
    <div className="absolute bottom-full left-0 right-0 max-h-[60vh] overflow-y-auto border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg rounded-t-lg">
      <div className="container max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Queue ({queue.length} tracks)</h3>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearQueue}>
                Clear Queue
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Queue is empty</p>
        ) : (
          <ul className="space-y-1">
            {queue.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <li
                  key={`${track.id}-${index}`}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer",
                    isCurrent && "bg-accent/50"
                  )}
                  onClick={() => playTrack(track)}
                >
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {isCurrent ? '▶' : index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={cn("truncate", isCurrent && "text-primary font-medium")}>
                      {track.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {track.artist || track.albumTitle}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatTime(track.duration || 0)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}