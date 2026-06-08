'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, Clock, Play, Heart, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
  tracks?: Track[];
}

interface AlbumGridProps {
  albums: Album[];
  onSelectAlbum: (albumId: number) => void;
  selectedAlbumId?: number;
  onPlayAlbum?: (albumId: number) => void;
}

export function AlbumGrid({ albums, onSelectAlbum, selectedAlbumId, onPlayAlbum }: AlbumGridProps) {
  const [hoveredAlbumId, setHoveredAlbumId] = useState<number | null>(null);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (tracks?: Track[]) => {
    if (!tracks || tracks.length === 0) return '0 min';
    const totalSeconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr ${remainingMinutes} min`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
      {albums.map((album) => (
        <Card
          key={album.id}
          className={cn(
            "group relative overflow-hidden transition-all duration-300 cursor-pointer",
            "hover:shadow-xl hover:scale-105",
            selectedAlbumId === album.id && "ring-2 ring-primary shadow-lg"
          )}
          onMouseEnter={() => setHoveredAlbumId(album.id)}
          onMouseLeave={() => setHoveredAlbumId(null)}
          onClick={() => onSelectAlbum(album.id)}
        >
          {/* Album Cover with Overlay */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
            <img
              src={album.coverArt}
              alt={album.title}
              className={cn(
                "w-full h-full object-contain",  // Changed from object-cover to object-contain
                "transition-transform duration-500",
                hoveredAlbumId === album.id && "scale-110"
              )}
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Cover';
              }}
            />
            
            {/* Gradient Overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
              "transition-opacity duration-300",
              hoveredAlbumId === album.id ? "opacity-100" : "opacity-0"
            )}>
              <div className="absolute bottom-4 left-4 right-4">
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayAlbum?.(album.id);
                  }}
                >
                  <Play className="h-4 w-4" />
                  Play Album
                </Button>
              </div>
            </div>

            {/* Play Button on Hover */}
            {/* <Button
              size="icon"
              className={cn(
                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
                "rounded-full w-16 h-16 transition-all duration-300",
                hoveredAlbumId === album.id ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onPlayAlbum?.(album.id);
              }}
            >
              <Play className="h-8 w-8" />
            </Button> */}
          </div>

          {/* Album Info */}
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{album.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    Add to Playlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    Share Album
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Album Details */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              {album.releaseYear && (
                <span>{album.releaseYear}</span>
              )}
              {album.tracks && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    <span>{album.tracks.length} tracks</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTotalDuration(album.tracks)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Track Preview (if tracks available) */}
            {album.tracks && album.tracks.length > 0 && hoveredAlbumId === album.id && (
              <div className="mt-3 pt-3 border-t space-y-1 animate-in slide-in-from-top-1">
                {album.tracks.slice(0, 3).map((track) => (
                  <div key={track.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-muted-foreground w-6">
                        {track.trackNumber}.
                      </span>
                      <span className="truncate">{track.title}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
                {album.tracks.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    +{album.tracks.length - 3} more tracks
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}