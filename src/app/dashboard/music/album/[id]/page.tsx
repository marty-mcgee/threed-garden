// src/app/dashboard/music/album/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMusicPlayer, Track } from '@/lib/stores/music-player-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Heart, Share2, Clock, Link2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { formatTime, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface Link {
  id: number;
  title: string;
  url: string;
  type: string;
  icon?: string;
}

interface Media {
  id: number;
  url: string;
  type: string;
  isPrimary?: boolean;
  title?: string;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt?: string;
  year?: number;
  genre?: string;
  status: string;
  isPublic: boolean;
  tracks?: Track[];
  links?: Link[];
  media?: Media[];
  description?: string;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params?.id as string;
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playAlbum, playTrack, isPlaying, currentTrack, resetPlayer } = useMusicPlayer();
  const [isLiked, setIsLiked] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    setAlbum(null);
    setIsLoading(true);

    if (!albumId) {
      setIsLoading(false);
      return;
    }

    const fetchAlbum = async () => {
      try {
        const parsedAlbumId = parseInt(albumId);
        console.log('[Album Detail] 🔍 Fetching album with ID:', parsedAlbumId);
        
        // ✅ Include links and media in the request
        const response = await fetch(
          `/api/music/albums?scope=public&id=${albumId}&includeTracks=true&includeLinks=true&includeMedia=true`
        );
        const data = await response.json();
        
        console.log('[Album Detail] 📦 Raw API response:', data);
        
        if (data.success && data.data) {
          const albumData = data.data;
          
          console.log('[Album Detail] 📀 Album data:', {
            id: albumData.id,
            title: albumData.title,
            artist: albumData.artist,
            tracksCount: albumData.tracks?.length || 0,
            linksCount: albumData.links?.length || 0,
            mediaCount: albumData.media?.length || 0,
          });
          
          // ✅ Filter tracks to only include those with matching albumId
          let validTracks: Track[] = [];
          
          if (albumData.tracks && albumData.tracks.length > 0) {
            validTracks = albumData.tracks
              .filter((track: any) => track.albumId === albumData.id)
              .map((track: any) => ({
                ...track,
                s3Url: track.fileUrl || track.s3Url || track.audioUrl || track.url || '',
                albumTitle: albumData.title,
                albumArt: albumData.coverArt,
                artist: track.artist || albumData.artist,
              }));
            
            console.log('[Album Detail] ✅ Valid tracks:', validTracks.length);
          }
          
          setAlbum({
            ...albumData,
            tracks: validTracks,
            links: albumData.links || [],
            media: albumData.media || [],
          });
        } else {
          console.error('[Album Detail] ❌ Failed to fetch album:', data.error);
          showToast('Failed to load album', 'error');
        }
      } catch (error) {
        console.error('[Album Detail] ❌ Error fetching album:', error);
        showToast('Error loading album', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId, showToast]);

  const handlePlayAll = () => {
    if (!album?.tracks || album.tracks.length === 0) {
      showToast('This album has no valid tracks to play', 'error');
      return;
    }

    const tracksWithUrls = album.tracks.map(track => ({
      ...track,
      s3Url: track.s3Url || '',
      albumTitle: album.title,
      albumArt: album.coverArt,
      artist: track.artist || album.artist,
    }));

    const playableTracks = tracksWithUrls.filter(t => t.s3Url && t.s3Url.length > 0);
    
    if (playableTracks.length === 0) {
      showToast('None of the tracks have audio files available', 'error');
      return;
    }

    resetPlayer();
    setTimeout(() => {
      playAlbum(playableTracks);
      showToast(`Playing "${album.title}"`, 'success');
    }, 50);
  };

  const handlePlayTrack = (track: Track) => {
    const trackToPlay = {
      ...track,
      s3Url: track.s3Url || '',
      albumTitle: track.albumTitle || album?.title || '',
      albumArt: track.albumArt || album?.coverArt || '',
      artist: track.artist || album?.artist || '',
    };

    if (!trackToPlay.s3Url || trackToPlay.s3Url.length === 0) {
      showToast('This track has no audio file available', 'error');
      return;
    }

    resetPlayer();
    setTimeout(() => {
      playTrack(trackToPlay);
      showToast(`Playing "${trackToPlay.title}"`, 'info');
    }, 50);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold">Album Not Found</h2>
        <p className="text-muted-foreground">This album may not exist or is private.</p>
        <Button className="mt-4" onClick={() => window.location.href = '/dashboard/music'}>
          Back to Music
        </Button>
      </div>
    );
  }

  const isCurrentlyPlaying = currentTrack && album.tracks?.some(t => t.id === currentTrack.id);

  return (
    <div className="space-y-8">
      {ToastComponent}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-muted/30 to-background">
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Album Art */}
          <div className="relative h-48 w-48 md:h-56 md:w-56 flex-shrink-0 overflow-hidden rounded-lg shadow-xl">
            {album.coverArt ? (
              <Image
                src={album.coverArt}
                alt={album.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                {album.title.charAt(0)}
              </div>
            )}
          </div>

          {/* Album Info */}
          <div className="flex flex-col justify-end flex-1 min-w-0">
            <Badge variant="secondary" className="w-fit mb-2">
              {album.status}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold truncate">{album.title}</h1>
            <p className="text-lg text-muted-foreground">{album.artist}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {album.year && <span>{album.year}</span>}
              {album.genre && <span>• {album.genre}</span>}
              <span>• {album.tracks?.length || 0} tracks</span>
              {album.links && album.links.length > 0 && (
                <span>• {album.links.length} links</span>
              )}
            </div>
            {album.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{album.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 px-6 md:px-8 pb-6 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="gap-2"
            onClick={handlePlayAll}
            disabled={!album.tracks || album.tracks.length === 0}
          >
            {isCurrentlyPlaying && isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            {isCurrentlyPlaying && isPlaying ? 'Pause' : 'Play All'}
          </Button>
          
          <Button variant="outline" size="lg" className="gap-2" onClick={() => {
            setIsLiked(!isLiked);
            showToast(isLiked ? 'Removed from favorites' : 'Added to favorites', 'info');
          }}>
            <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
            Like
          </Button>
          
          <Button variant="outline" size="lg" className="gap-2" onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            showToast('Link copied to clipboard!', 'success');
          }}>
            <Share2 className="h-5 w-5" />
            Share
          </Button>
        </div>
      </div>

      {/* Tracklist */}
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tracklist</h2>
          {album.tracks && album.tracks.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {album.tracks.filter(t => t.s3Url && t.s3Url.length > 0).length} of {album.tracks.length} tracks have audio
            </p>
          )}
        </div>
        <div className="divide-y">
          {album.tracks && album.tracks.length > 0 ? (
            album.tracks.map((track, index) => {
              const isTrackPlaying = currentTrack?.id === track.id;
              const hasAudio = !!track.s3Url && track.s3Url.length > 0;
              
              return (
                <div
                  key={`${track.id}-${album.id}`}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer group",
                    isTrackPlaying && "bg-accent/30",
                    !hasAudio && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => hasAudio && handlePlayTrack(track)}
                >
                  <div className="w-8 text-center text-sm text-muted-foreground group-hover:hidden">
                    {index + 1}
                  </div>
                  <div className="w-8 text-center hidden group-hover:block">
                    {!hasAudio ? (
                      <span className="text-xs text-muted-foreground">🔇</span>
                    ) : isTrackPlaying && isPlaying ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn("truncate", isTrackPlaying && "text-primary font-medium")}>
                      {track.title}
                      {!hasAudio && (
                        <span className="ml-2 text-xs text-muted-foreground">(no audio)</span>
                      )}
                    </div>
                    {track.artist && track.artist !== album.artist && (
                      <div className="text-xs text-muted-foreground truncate">
                        {track.artist}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(track.duration || 0)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No valid tracks available for this album.
            </div>
          )}
        </div>
      </div>

      {/* ✅ Links Section - Debug Version */}
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Links ({album.links?.length || 0})
          </h2>
        </div>
        <div className="p-4">
          {album.links && album.links.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {album.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate group-hover:text-primary transition-colors">
                    {link.title || link.url}
                  </span>
                  <span className="text-xs text-muted-foreground">↗</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No links available for this album.</p>
          )}
        </div>
      </div>

      {/* ✅ Media Gallery - Debug Version */}
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media Gallery ({album.media?.length || 0})
          </h2>
        </div>
        <div className="p-4">
          {album.media && album.media.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {album.media.map((media) => (
                <div
                  key={media.id}
                  className="aspect-square rounded-lg overflow-hidden relative group"
                >
                  {media.url ? (
                    <Image
                      src={media.url}
                      alt={media.title || 'Media'}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {media.isPrimary && (
                    <Badge className="absolute top-2 right-2 text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No media available for this album.</p>
          )}
        </div>
      </div>
    </div>
  );
}
