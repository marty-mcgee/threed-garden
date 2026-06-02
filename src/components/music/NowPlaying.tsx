'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Track {
  id: number;
  title: string;
  duration: number | null;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
}

interface NowPlayingProps {
  track: Track | null;
  album: Album | null;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onClose: () => void;
}

export function NowPlaying({ track, album, isPlaying, progress, onPlayPause, onClose }: NowPlayingProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPlaying && progress === 0) {
        setIsVisible(false);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isPlaying, progress]);

  if (!track || !album || !isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 animate-in slide-in-from-right-5 duration-300">
      <Card className="w-80 shadow-xl border-primary/20">
        <div className="p-3">
          <div className="flex gap-3">
            {/* Album Art */}
            <img
              src={album.coverArt}
              alt={album.title}
              className="w-12 h-12 rounded-md object-cover"
            />
            
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.title} • {album.artist}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-1"
                  onClick={onClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Progress Bar */}
              <Progress value={progress} className="h-1 mt-2" />
              
              {/* Controls */}
              <div className="flex justify-center mt-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={onPlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}