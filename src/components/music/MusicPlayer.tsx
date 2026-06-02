'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
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
  Heart,
  Share2,
  Download,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  s3Key: string;
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
  onLike?: (trackId: number) => void;
}

export function MusicPlayer({ tracks, album, onTrackChange, onLike }: MusicPlayerProps) {
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
  const [isLiked, setIsLiked] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
        startProgressUpdate();
      } else {
        audioRef.current.pause();
        stopProgressUpdate();
      }
    }
    
    return () => stopProgressUpdate();
  }, [isPlaying, currentTrackIndex]);

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
    if (isShuffle) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * tracks.length);
      } while (newIndex === currentTrackIndex && tracks.length > 1);
      return newIndex;
    }
    return (currentTrackIndex + 1) % tracks.length;
  };

  const handlePlayPause = () => {
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
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
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

  if (!currentTrack || !album) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={`/api/music/stream/${currentTrack.id}`}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleTrackEnd}
      />
      
      {/* Mini Player (Visible when not expanded) */}
      {!isExpanded && (
        <Card className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-none border-t",
          "animate-in slide-in-from-bottom duration-300"
        )}>
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-4">
              {/* Album Art */}
              <img
                src={album.coverArt}
                alt={album.title}
                className="w-12 h-12 rounded-md object-cover cursor-pointer"
                onClick={() => setIsExpanded(true)}
              />
              
              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {album.title} - {album.artist}
                </p>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrevious}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handlePlayPause}
                  className="h-10 w-10 rounded-full"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Progress Bar */}
              <div className="hidden md:block w-32">
                <div className="relative h-1 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-primary transition-all duration-100"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
              
              {/* Expand Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Expanded Player Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="container mx-auto h-full flex items-center justify-center p-6">
            <Card className="w-full max-w-4xl overflow-hidden">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => setIsExpanded(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>

              <div className="grid md:grid-cols-2 gap-8 p-8">
                {/* Album Art Section */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src={album.coverArt}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{currentTrack.title}</h2>
                    <p className="text-muted-foreground">{album.title} • {album.artist}</p>
                  </div>
                </div>

                {/* Player Controls Section */}
                <div className="space-y-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 0}
                      step={1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Main Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsShuffle(!isShuffle)}
                      className={cn(isShuffle && "text-primary")}
                    >
                      <Shuffle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handlePrevious}>
                      <SkipBack className="h-6 w-6" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={handlePlayPause}
                      className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNext}>
                      <SkipForward className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsRepeat(!isRepeat)}
                      className={cn(isRepeat && "text-primary")}
                    >
                      <Repeat className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsLiked(!isLiked);
                        onLike?.(currentTrack.id);
                      }}
                      className={cn(isLiked && "text-red-500")}
                    >
                      <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current")} />
                      {isLiked ? "Liked" : "Like"}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  {/* Volume Control */}
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

                  {/* Playlist Toggle */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPlaylist(!showPlaylist)}
                  >
                    <ListMusic className="h-4 w-4 mr-2" />
                    {showPlaylist ? "Hide Playlist" : "Show Playlist"}
                  </Button>

                  {/* Playlist */}
                  {showPlaylist && (
                    <div className="mt-4 max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
                      {tracks.map((track, index) => (
                        <div
                          key={track.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                            currentTrackIndex === index ? "bg-primary/10" : "hover:bg-accent"
                          )}
                          onClick={() => {
                            setCurrentTrackIndex(index);
                            onTrackChange?.(index);
                            setIsPlaying(true);
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground w-8">
                              {track.trackNumber}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{track.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {currentTrackIndex === index && isPlaying && (
                              <Badge variant="secondary" className="text-xs">
                                Playing
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(track.duration || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}