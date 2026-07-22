// app/dashboard/music/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ✅ Keep your existing UI components and styles
// Just update the data fetching to use the new API

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  status: string;
  isPublic: boolean;
  description?: string | null;
}

export default function MusicDashboardPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/music/albums');
      const data = await response.json();
      
      if (data.success) {
        // ✅ Filter to only show published public albums
        const publishedAlbums = data.data.filter((album: Album) => 
          album.status === 'published' && album.isPublic === true
        );
        setAlbums(publishedAlbums);
      } else {
        setError(data.error || 'Failed to fetch albums');
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      setError('Failed to load music');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading music...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Music className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mt-4">{error}</p>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold mt-4">No Music Yet</h2>
        <p className="text-muted-foreground">Check back soon for new releases!</p>
      </div>
    );
  }

  // ✅ Keep your existing UI layout
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Music Library</h1>
        <p className="text-muted-foreground">Browse albums from Marty McGee</p>
      </div>

      {/* ✅ Use your existing grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {albums.map((album) => (
          <Link key={album.id} href={`/dashboard/music/album/${album.id}`}>
            <Card className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={album.coverArt}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-album.jpg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{album.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
                  {album.releaseYear && (
                    <p className="text-xs text-muted-foreground mt-1">{album.releaseYear}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}