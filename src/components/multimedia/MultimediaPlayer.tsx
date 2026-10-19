'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ListMusic, ExternalLink, Music, ShoppingBag, Youtube, Instagram, Globe, Image as ImageIcon } from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { MediaGallery } from './MediaGallery';
import { cn } from '@/libraries/utils';

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  fileUrl: string;
}

interface Link {
  id: number;
  title: string;
  url: string;
  type: string;
  icon: string | null;
  description: string | null;
}

interface MediaItem {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  isPrimary: boolean;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear?: number | null;
  description?: string | null;
  tracks?: Track[];
  links?: Link[];
  media?: MediaItem[];
}

interface MultimediaPlayerProps {
  mediaPreview?: ReactNode;
  onMediaPlay?: (element: HTMLMediaElement) => void;
  track: Track;
  album: Album;
  tracks: Track[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: number[]) => void;
  onTrackSelect: (index: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
  formatTime: (time: number) => string;
}

export function MultimediaPlayer({
  mediaPreview, onMediaPlay,
  track,
  album,
  tracks,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onTrackSelect,
  currentTime,
  duration,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  formatTime,
}: MultimediaPlayerProps) {
  const [activeTab, setActiveTab] = useState('tracks');

  // Reset to Track List tab when album changes
  useEffect(() => {
    setActiveTab('tracks');
  }, [album.id]);

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'stream': return <Music className="h-4 w-4" />;
      case 'buy': return <ShoppingBag className="h-4 w-4" />;
      case 'video': return <Youtube className="h-4 w-4" />;
      case 'social': return <Instagram className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="rounded-lg border bg-transparent text-foreground">
      <div className="p-4">
        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN - Album Art & Player Controls */}
          <div className="space-y-3">
            {/* Album Art */}
            {mediaPreview || <div className="flex justify-center">
              <div className="aspect-square w-full max-w-72 lg:max-w-[26rem] rounded-lg overflow-hidden shadow-2xl bg-muted">
                <img 
                  src={album.coverArt} 
                  alt={album.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/256x256?text=No+Cover';
                  }}
                />
              </div>
            </div>}

            {/* Track Info */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Now Playing</p>
              <h2 className="text-lg font-bold mt-1 truncate px-2">{track.title}</h2>
              <p className="text-muted-foreground text-sm truncate">{album.artist}</p>
              {album.releaseYear && (
                <p className="text-muted-foreground text-xs mt-1">Released: {album.releaseYear}</p>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2">
              <button 
                aria-label="Previous Track" onClick={onPrevious}
                className="p-2 hover:bg-muted/50 rounded-full transition-all"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button 
                aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onPlayPause}
                className="p-3 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              <button 
                aria-label="Next Track" onClick={onNext}
                className="p-2 hover:bg-muted/50 rounded-full transition-all"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
                <Slider
                  aria-label="Playback position" value={[currentTime]}
                  max={duration || 0}
                  step={1}
                  onValueChange={onSeek}
                  className="flex-1 cursor-pointer h-1"
                />
                <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-2">
              <button aria-label={isMuted ? 'Unmute' : 'Mute'} onClick={onToggleMute} className="p-1 hover:text-foreground">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                aria-label="Volume" value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={onVolumeChange}
                className="w-24 h-1"
              />
            </div>
          </div>

          {/* RIGHT COLUMN - Waveform + Tabs (Track List, Links, Media Gallery) */}
          <div className="min-w-0 space-y-4">
            {/* Waveform Visualization */}
            {!mediaPreview && <WaveformVisualizer
              audioUrl={track.fileUrl}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              height={100}
              className="w-full"
            />}

            {/* Tabs for Track List, Links, and Media Gallery */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="tracks" className="data-[state=active]:bg-muted gap-2">
                  <ListMusic className="h-4 w-4" />
                  Track List
                  <Badge variant="secondary" className="ml-1 bg-transparent border">
                    {tracks.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="links" className="data-[state=active]:bg-muted gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Links
                  <Badge variant="secondary" className="ml-1 bg-transparent border">
                    {album.links?.length || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:bg-muted gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Media
                  <Badge variant="secondary" className="ml-1 bg-transparent border">
                    {album.media?.length || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Track List Tab */}
              <TabsContent value="tracks" className="mt-4">
                <ScrollArea className="h-96 lg:h-[28rem]">
                  <div className="space-y-1 pr-2">
                    {tracks.map((t, idx) => {
                      const isCurrentTrack = track.id === t.id;
                      return (
                        <div
                          key={t.id}
                          role="button" tabIndex={0} aria-label={`Play ${t.title}`}
                          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onTrackSelect(idx); } }}
                          onClick={() => onTrackSelect(idx)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all group",
                            isCurrentTrack
                              ? "bg-accent border-l-2 border-primary"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 shrink-0 text-center">
                              <span className={cn(
                                "text-xs font-mono",
                                isCurrentTrack && "font-bold text-foreground"
                              )}>
                                {t.trackNumber ?? '—'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "truncate text-sm",
                                isCurrentTrack && "font-semibold text-foreground"
                              )}>
                                {t.title}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(t.duration || 0)}
                            </div>
                          </div>
                          {isCurrentTrack && isPlaying && (
                            <div className="flex gap-0.5 ml-2">
                              <div className="w-0.5 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-0.5 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-0.5 h-4 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-0.5 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-0.5 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Links Tab */}
              <TabsContent value="links" className="mt-4">
                <ScrollArea className="h-96 lg:h-[28rem]">
                  {album.links && album.links.length > 0 ? (
                    <div className="space-y-2 pr-2">
                      {album.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-accent rounded-lg transition-all group"
                        >
                          <div className="p-2 bg-muted/50 rounded-full">
                            {getLinkIcon(link.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{link.title}</p>
                            {link.description && (
                              <p className="text-xs text-muted-foreground">{link.description}</p>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <ExternalLink className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No links available for this album</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Media Gallery Tab */}
              <TabsContent value="media" className="mt-4">
                <ScrollArea className="h-96 lg:h-[28rem]">
                  {album.media && album.media.length > 0 ? (
                    <MediaGallery media={album.media} albumId={album.id} onMediaPlay={onMediaPlay} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No media available for this album</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back later for Media</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
