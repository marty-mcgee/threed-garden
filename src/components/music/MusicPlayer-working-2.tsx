'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  ListMusic,
  Maximize2,
  Minimize2,
  Heart,
  Clock,
  History,
  Plus,
  X,
  SkipForward as SkipForwardIcon,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { musicPoller } from '@/lib/services/music/MusicPoller'

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
  albumId: number;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
}

interface MusicPlayerProps {
  tracks: Track[];
  album: Album | null;
  onTrackChange?: (trackIndex: number) => void;
}

interface QueueItem {
  track: Track;
  album: Album;
  addedAt: Date;
}

export function MusicPlayer({ tracks, album, onTrackChange }: MusicPlayerProps) {
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New features state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('queue');

  // Add state for error tracking
  const [audioError, setAudioError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Add state for playback stats
  const [playStartTime, setPlayStartTime] = useState<Date | null>(null);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>(null);

  const currentTrack = tracks[currentTrackIndex];

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteTracks');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteTracks', JSON.stringify([...favorites]));
  }, [favorites]);

  // Set audio URL when track changes
  useEffect(() => {
    if (currentTrack?.publicUrl) {
      setAudioUrl(currentTrack.publicUrl);
      setIsLoading(false);

      // Add to recently played
      setRecentlyPlayed(prev => {
        const filtered = prev.filter(t => t.id !== currentTrack.id);
        return [currentTrack, ...filtered].slice(0, 20);
      });
    } else {
      setAudioUrl(null);
    }
  }, [currentTrack]);

  // Handle audio element playback
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
          toast.error('Failed to play track');
        });
        startProgressUpdate();
      } else {
        audioRef.current.pause();
        stopProgressUpdate();
      }
    }

    return () => stopProgressUpdate();
  }, [isPlaying, audioUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space bar - play/pause
      if (e.code === 'Space' && !e.target?.matches('input, textarea, button')) {
        e.preventDefault();
        handlePlayPause();
      }
      // Left arrow - seek backward 5 seconds
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek([Math.max(0, currentTime - 5)]);
      }
      // Right arrow - seek forward 5 seconds
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek([Math.min(duration, currentTime + 5)]);
      }
      // Up arrow - volume up
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange([Math.min(1, volume + 0.1)]);
      }
      // Down arrow - volume down
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange([Math.max(0, volume - 0.1)]);
      }
      // N key - next track
      if (e.code === 'KeyN') {
        e.preventDefault();
        handleNext();
      }
      // P key - previous track
      if (e.code === 'KeyP') {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, duration, volume, isPlaying]);

  const startProgressUpdate = () => {
    stopProgressUpdate();
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
  };

  const stopProgressUpdate = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const getNextTrackIndex = () => {
    // Check queue first
    if (queue.length > 0) {
      const nextQueueItem = queue[0];
      const trackIndex = tracks.findIndex(t => t.id === nextQueueItem.track.id);
      if (trackIndex !== -1) {
        setQueue(prev => prev.slice(1));
        toast.success(`Now playing: ${nextQueueItem.track.title} (from queue)`);
        return trackIndex;
      }
    }

    if (isShuffle) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * tracks.length);
      } while (newIndex === currentTrackIndex && tracks.length > 1);
      return newIndex;
    }
    return (currentTrackIndex + 1) % tracks.length;
  };

  // Add function to track playback
  const trackPlayback = async (completed: boolean = false) => {
    if (!currentTrack || !selectedAlbum || hasTrackedPlay) return;
    
    try {
      await fetch('/api/music/playback/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: currentTrack.id,
          albumId: selectedAlbum.id,
          playDuration: playStartTime ? Math.floor((new Date().getTime() - playStartTime.getTime()) / 1000) : null,
          completed,
          source: 'music_player'
        }),
      });
      setHasTrackedPlay(true);
    } catch (error) {
      console.error('Failed to track playback:', error);
    }
  };

  const handlePlayPause = () => {
    if (!audioUrl) {
      toast.error('No audio source available for this track');
      return;
    }
    if (!isPlaying) {
    // Starting playback
    setPlayStartTime(new Date());
    setHasTrackedPlay(false);
  } else {
    // Pausing playback - track partial play
    trackPlayback(false);
  }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const nextIndex = getNextTrackIndex();
    setCurrentTrackIndex(nextIndex);
    onTrackChange?.(nextIndex);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } else {
      const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      onTrackChange?.(prevIndex);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      if (audioRef.current) {
        audioRef.current.volume = previousVolume;
      }
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
      setIsMuted(true);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleTrackEnd = () => {
    // Track completed playback
    trackPlayback(true);
    
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        audioRef.current.play();
        setPlayStartTime(new Date());
        setHasTrackedPlay(false);
      }
    } else {
      handleNext();
    }
  };

  // Add cleanup when track changes
  useEffect(() => {
    // Track partial play if track changes before finishing
    if (isPlaying && !hasTrackedPlay && playStartTime) {
      trackPlayback(false);
    }
    
    setPlayStartTime(null);
    setHasTrackedPlay(false);
  }, [currentTrack])

  const toggleFavorite = () => {
    if (!currentTrack) return;

    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(currentTrack.id)) {
        newFavorites.delete(currentTrack.id);
        toast.success(`Removed from favorites: ${currentTrack.title}`);
      } else {
        newFavorites.add(currentTrack.id);
        toast.success(`Added to favorites: ${currentTrack.title}`);
      }
      return newFavorites;
    });
  };

  const addToQueue = (track: Track, albumData: Album) => {
    setQueue(prev => [...prev, { track, album: albumData, addedAt: new Date() }]);
    toast.success(`Added to queue: ${track.title}`);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    toast.success('Removed from queue');
  };

  const playNow = (track: Track, albumData: Album) => {
    const trackIndex = tracks.findIndex(t => t.id === track.id);
    if (trackIndex !== -1) {
      setCurrentTrackIndex(trackIndex);
      onTrackChange?.(trackIndex);
      setIsPlaying(true);
      toast.success(`Now playing: ${track.title}`);
    }
  };

  const playNext = (track: Track, albumData: Album) => {
    setQueue(prev => [{ track, album: albumData, addedAt: new Date() }, ...prev]);
    toast.success(`Added to play next: ${track.title}`);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const shouldShowAudio = audioUrl && audioUrl.trim() !== '';



  // Handle audio errors gracefully
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    let errorMessage = 'Unable to play this track. ';

    // Get more details about the error without breaking the app
    if (audio.error) {
      switch (audio.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage += 'Playback was aborted.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage += 'Network error. Please check your connection.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage += 'Audio format not supported.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage += 'Audio source not found.';
          break;
        default:
          errorMessage += 'Unknown error occurred.';
      }
    } else {
      errorMessage += 'Could not load audio source.';
    }

    // Log to console for debugging (doesn't break the app)
    console.warn('Audio playback warning:', {
      track: currentTrack?.title,
      url: audioUrl,
      errorCode: audio.error?.code,
      errorMessage
    });

    // Show user-friendly toast
    toast.error(errorMessage);

    // Update state
    setAudioError(errorMessage);
    setIsPlaying(false);

    // Auto-retry once if it's a network error
    if (audio.error?.code === MediaError.MEDIA_ERR_NETWORK && retryCount < 1) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        toast.info('Retrying playback...');
        if (audioRef.current && audioUrl) {
          audioRef.current.load();
          if (isPlaying) {
            audioRef.current.play().catch(() => { });
          }
        }
      }, 2000);
    }
  };

  // Reset retry count when track changes
  useEffect(() => {
    setRetryCount(0);
    setAudioError(null);
  }, [currentTrack]);












  if (!currentTrack || !album) return null;

  return (
    <>
      {shouldShowAudio && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleTrackEnd}
          // Handle Audio File Error
          onError={handleAudioError}
          // Prevent React from throwing by catching and suppressing
          onLoadStart={() => {
            // Reset error state when loading starts
            setAudioError(null);
          }}
        />
      )}


      {/* Add a small warning indicator if there's an error */}
      {audioError && (
        <div className="fixed bottom-20 right-4 z-50">
          <Card className="p-3 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-4 w-4" />
              <span>{audioError}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setAudioError(null);
                  if (audioRef.current && audioUrl) {
                    audioRef.current.load();
                    toast.info('Retrying playback...');
                  }
                }}
              >
                Retry
              </Button>
            </div>
          </Card>
        </div>
      )}





      {/* Mini Player */}
      {!isExpanded && (
        <Card className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-none border-t",
          "animate-in slide-in-from-bottom duration-300"
        )}>
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-4">
              <img
                src={album.coverArt}
                alt={album.title}
                className="w-12 h-12 rounded-md object-cover cursor-pointer"
                onClick={() => setIsExpanded(true)}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={toggleFavorite}
                  >
                    <Heart className={cn("h-3 w-3", favorites.has(currentTrack.id) && "fill-red-500 text-red-500")} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {album.title} - {album.artist}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrevious}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handlePlayPause}
                  className="h-10 w-10 rounded-full"
                  disabled={isLoading || !shouldShowAudio}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="hidden md:block w-32">
                <div className="relative h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-primary transition-all duration-100"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Expanded Player */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="container mx-auto h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Now Playing</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                <Minimize2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
              {/* Left Panel - Album Art & Track Info */}
              <div className="lg:w-1/3 space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden shadow-2xl">
                  <img src={album.coverArt} alt={album.title} className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-bold">{currentTrack.title}</h2>
                    <Button variant="ghost" size="icon" onClick={toggleFavorite}>
                      <Heart className={cn("h-5 w-5", favorites.has(currentTrack.id) && "fill-red-500 text-red-500")} />
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{album.title} • {album.artist}</p>
                  {!shouldShowAudio && (
                    <p className="text-sm text-red-500 mt-2">No audio source available for this track</p>
                  )}
                </div>
              </div>

              {/* Right Panel - Player Controls & Queues */}
              <div className="lg:w-2/3 flex flex-col">
                {/* Player Controls */}
                <div className="space-y-6 mb-8">
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 0}
                      step={1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                      disabled={!shouldShowAudio}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsShuffle(!isShuffle)} className={cn(isShuffle && "text-primary")}>
                      <Shuffle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handlePrevious}>
                      <SkipBack className="h-6 w-6" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={handlePlayPause}
                      className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                      disabled={isLoading || !shouldShowAudio}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                      ) : isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8 ml-1" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNext}>
                      <SkipForward className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsRepeat(!isRepeat)} className={cn(isRepeat && "text-primary")}>
                      <Repeat className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 justify-center">
                    <Button variant="ghost" size="icon" onClick={toggleMute}>
                      {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="w-32"
                    />
                  </div>
                </div>

                {/* Tabs for Queue, History, Favorites */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="queue">
                      <ListMusic className="h-4 w-4 mr-2" />
                      Queue ({queue.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-2" />
                      Recently Played
                    </TabsTrigger>
                    <TabsTrigger value="favorites">
                      <Heart className="h-4 w-4 mr-2" />
                      Favorites ({favorites.size})
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="flex-1 mt-4 h-64">
                    <TabsContent value="queue" className="mt-0">
                      <div className="space-y-2">
                        {queue.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Queue is empty. Add tracks to play next!</p>
                        ) : (
                          queue.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                              <div className="flex-1">
                                <p className="font-medium">{item.track.title}</p>
                                <p className="text-xs text-muted-foreground">{item.album.title}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => playNow(item.track, item.album)}>
                                  <Play className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => removeFromQueue(index)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      <div className="space-y-2">
                        {recentlyPlayed.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No recently played tracks</p>
                        ) : (
                          recentlyPlayed.map((track, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                              <div className="flex-1">
                                <p className="font-medium">{track.title}</p>
                                <p className="text-xs text-muted-foreground">Track {track.trackNumber}</p>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => playNow(track, album)}>
                                <Play className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="favorites" className="mt-0">
                      <div className="space-y-2">
                        {favorites.size === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No favorite tracks yet. Click the heart icon to add!</p>
                        ) : (
                          tracks.filter(t => favorites.has(t.id)).map((track) => (
                            <div key={track.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                              <div className="flex-1">
                                <p className="font-medium">{track.title}</p>
                                <p className="text-xs text-muted-foreground">{album.title}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => playNow(track, album)}>
                                  <Play className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => addToQueue(track, album)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>

                {/* Add from current album section */}
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Add from this album:</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {tracks.map((track) => (
                      <Button
                        key={track.id}
                        size="sm"
                        variant="outline"
                        onClick={() => addToQueue(track, album)}
                        disabled={track.id === currentTrack.id}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {track.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-4 text-center text-xs text-muted-foreground">
              ⌨️ Keyboard shortcuts: Space (play/pause) • ← → (seek) • ↑ ↓ (volume) • N (next) • P (previous)
            </div>
          </div>
        </div>
      )}
    </>
  );
}