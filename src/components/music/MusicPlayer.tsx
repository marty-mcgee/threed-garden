'use client';

import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear?: number | null;
  description?: string | null;
  tracks?: Track[];
}

interface MusicPlayerProps {
  track: Track;
  album: Album;
  tracks: Track[];
  albums?: Album[];  // Add albums prop for next album functionality
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: number[]) => void;
  onTrackSelect: (index: number) => void;
  onTrackEnd?: () => void;  // Add callback for track end to go to next album
  onNextAlbum?: () => void;  // Add callback for next album
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
  formatTime: (time: number) => string;
}

export function MusicPlayer({
  track,
  album,
  tracks,
  albums,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onTrackSelect,
  onNextAlbum,
  currentTime,
  duration,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  formatTime,
}: MusicPlayerProps) {
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Analyze audio file for waveform
  useEffect(() => {
    if (track?.publicUrl) {
      analyzeAudioWaveform(track.publicUrl);
    }
  }, [track]);

  const analyzeAudioWaveform = async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      const sampleRate = Math.floor(channelData.length / 80);
      const waveform: number[] = [];
      
      for (let i = 0; i < 80; i++) {
        let sum = 0;
        for (let j = 0; j < sampleRate && i * sampleRate + j < channelData.length; j++) {
          sum += Math.abs(channelData[i * sampleRate + j]);
        }
        const average = sum / sampleRate;
        waveform.push(Math.min(1, average * 2));
      }
      
      setWaveformData(waveform);
    } catch (error) {
      console.error('Error analyzing waveform:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  // Handle track end - move to next track or next album
  const handleTrackEnd = () => {
    const currentIndex = tracks.findIndex(t => t.id === track.id);
    const isLastTrack = currentIndex === tracks.length - 1;
    
    if (isLastTrack) {
      // Last track finished - move to next album if available
      if (onNextAlbum && albums && albums.length > 0) {
        onNextAlbum();
      }
    } else {
      // Not last track - play next track in current album
      onNext();
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl rounded-lg mb-6">
      <div className="p-6">
        {/* 2-Column Layout - Compact, fits 100% height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN - Album Art & Player Controls */}
          <div className="space-y-4">
            {/* Album Art - Smaller, compact */}
            <div className="flex justify-center">
              <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-lg overflow-hidden shadow-2xl bg-gray-800">
                <img 
                  src={album.coverArt} 
                  alt={album.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/192x192?text=No+Cover';
                  }}
                />
              </div>
            </div>

            {/* Track Info - Compact */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-gray-400">Now Playing</p>
              <h2 className="text-lg lg:text-xl font-bold mt-1 truncate px-2">{track.title}</h2>
              <p className="text-gray-400 text-sm truncate">{album.title} • {album.artist}</p>
              {album.releaseYear && (
                <p className="text-gray-500 text-xs mt-1">Released: {album.releaseYear}</p>
              )}
            </div>

            {/* Playback Controls - Compact */}
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={onPrevious}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onPlayPause}
                className="p-3 bg-white text-gray-900 rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              <button 
                onClick={onNext}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar - Compact */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
                <Slider
                  value={[currentTime]}
                  max={duration || 0}
                  step={1}
                  onValueChange={onSeek}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-xs text-gray-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control - Compact */}
            <div className="flex items-center justify-center gap-2">
              <button onClick={onToggleMute} className="p-1 hover:text-gray-300">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={onVolumeChange}
                className="w-28"
              />
            </div>

            {/* Auto-play next album indicator */}
            {albums && albums.length > 1 && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">
                  ⏭️ Will auto-play next album after last track
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Waveform (Top) + Track List (Bottom) */}
          <div className="space-y-4">
            {/* Waveform Visualization - Now at top of right column */}
            {waveformData && (
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Audio Waveform</p>
                <div className="flex items-end gap-px h-12">
                  {waveformData.map((amplitude, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-300"
                      style={{ 
                        height: `${Math.max(8, amplitude * 35)}px`,
                        opacity: getProgressPercentage() > (index / 80) ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Track List - Scrollable, fits remaining space */}
            <div className="flex-1 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold">Track List</h3>
                  <Badge variant="outline" className="bg-white/10 text-xs">
                    {tracks.length}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="h-64 lg:h-72">
                <div className="space-y-1 pr-2">
                  {tracks.map((t, idx) => {
                    const isCurrentTrack = track.id === t.id;
                    const isLastTrack = idx === tracks.length - 1;
                    return (
                      <div
                        key={t.id}
                        onClick={() => onTrackSelect(idx)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all group",
                          isCurrentTrack
                            ? "bg-white/20 border-l-2 border-white"
                            : "hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-7 text-center">
                            <span className={cn(
                              "text-xs font-mono",
                              isCurrentTrack && "font-bold text-white"
                            )}>
                              {t.trackNumber || idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "truncate text-sm",
                              isCurrentTrack && "font-semibold text-white"
                            )}>
                              {t.title}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatTime(t.duration || 0)}
                          </div>
                        </div>
                        {isCurrentTrack && isPlaying && (
                          <div className="flex gap-0.5 ml-2">
                            <div className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-0.5 h-4 bg-white rounded-full animate-bounce"></div>
                            <div className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          </div>
                        )}
                        {isLastTrack && !isCurrentTrack && (
                          <div className="text-xs text-gray-500 ml-2">
                            ⏭️ Last track
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}