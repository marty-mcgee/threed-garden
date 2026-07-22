// app/dashboard/music/album/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
  tracks?: Track[];
}

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = parseInt(params.id as string);
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbum();
  }, [albumId]);

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/music/albums?id=${albumId}&includeTracks=true`);
      const data = await response.json();
      
      if (data.success) {
        setAlbum(data.data);
      } else {
        setError(data.error || 'Failed to fetch album');
      }
    } catch (error) {
      console.error('Error fetching album:', error);
      setError('Failed to load album');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading album...</span>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="text-center py-12">
        <Music className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mt-4">{error || 'Album not found'}</p>
        <Link href="/dashboard/music">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Music
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/music">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Music
        </Button>
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Album Cover */}
        <Card>
          <CardContent className="p-4">
            <img
              src={album.coverArt}
              alt={album.title}
              className="w-full rounded-lg shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-album.jpg';
              }}
            />
          </CardContent>
        </Card>

        {/* Album Info & Tracks */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{album.title}</h1>
            <p className="text-xl text-muted-foreground">{album.artist}</p>
            {album.releaseYear && (
              <p className="text-sm text-muted-foreground mt-1">Released: {album.releaseYear}</p>
            )}
            {album.description && (
              <p className="mt-2 text-muted-foreground">{album.description}</p>
            )}
          </div>

          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">Tracks</h2>
              {album.tracks && album.tracks.length > 0 ? (
                <div className="space-y-2">
                  {album.tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6 text-right">
                          {track.trackNumber || '—'}
                        </span>
                        <span>{track.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No tracks available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}