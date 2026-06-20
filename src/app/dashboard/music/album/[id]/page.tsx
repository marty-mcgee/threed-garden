'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Play } from 'lucide-react';

export default function AlbumPage() {
  const params = useParams();
  const albumId = params?.id as string;
  
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (albumId) {
      fetchAlbum();
    }
  }, [albumId]);

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/music/albums?id=${albumId}&includeTracks=true`);
      if (response.ok) {
        const data = await response.json();
        setAlbum(data);
      }
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Album Not Found</h2>
            <Button asChild>
              <Link href="/dashboard/music">Back to Music Library</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard/music">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Album Art */}
          <div className="md:col-span-1">
            <div className="sticky top-8">
              <img
                src={album.coverArt}
                alt={album.title}
                className="w-full rounded-lg shadow-xl"
              />
            </div>
          </div>

          {/* Track List */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{album.artist}</p>
            {album.releaseYear && (
              <p className="text-sm text-muted-foreground mb-6">Released: {album.releaseYear}</p>
            )}
            {album.description && (
              <p className="text-muted-foreground mb-6">{album.description}</p>
            )}

            <div className="space-y-2">
              <h2 className="text-lg font-semibold mb-3">Track List</h2>
              {album.tracks?.map((track: any, index: number) => (
                <Link
                  key={track.id}
                  href={`/dashboard/music/track/${track.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-8">{track.trackNumber || index + 1}</span>
                    <span className="font-medium">{track.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{formatTime(track.duration)}</span>
                    <Play className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}