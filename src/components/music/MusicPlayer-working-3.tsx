'use client';

import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

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
}

interface MusicPlayerProps {
  track: Track;
  album: Album;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: number[]) => void;
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
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  currentTime,
  duration,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  formatTime,
}: MusicPlayerProps) {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl rounded-lg mb-6">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Album Artwork */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
            <img 
              src={album.coverArt} 
              alt={album.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Track Info with Album Details */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs uppercase tracking-wider text-gray-400">Now Playing</p>
            <h2 className="text-xl md:text-2xl font-bold mt-1">{track.title}</h2>
            <p className="text-gray-400 text-sm">{album.title} • {album.artist}</p>
            {album.releaseYear && (
              <p className="text-gray-500 text-xs mt-1">Released: {album.releaseYear}</p>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
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
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              
              <button 
                onClick={onNext}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-64">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
                <Slider
                  value={[currentTime]}
                  max={duration || 0}
                  step={1}
                  onValueChange={onSeek}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button onClick={onToggleMute} className="p-1 hover:text-gray-300">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={onVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>

        {/* Track List - Optional, can be toggled */}
        {album.tracks && album.tracks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm font-medium mb-3">Track List ({album.tracks.length} tracks)</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {album.tracks.slice(0, 8).map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => {
                    // Handle track selection - you'll need to pass this down
                    console.log('Select track:', idx);
                  }}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                    track.id === t.id
                      ? 'bg-white text-gray-900'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {t.trackNumber}. {t.title}
                </button>
              ))}
              {album.tracks.length > 8 && (
                <span className="px-3 py-1 text-xs text-gray-400">
                  +{album.tracks.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}