// src/app/dashboard/music/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Clock, Music2 } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { TestLocalStorage } from '@/components/test/TestLocalStorage';
import { DirectStorageTest } from '@/components/test/DirectStorageTest';

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt?: string;
  year?: number;
  status: string;
  isPublic: boolean;
  trackCount?: number;
  totalDuration?: number;
  tracks?: any[];
}

export default function MusicDashboardPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        console.log('[Music Dashboard] Fetching albums...');
        const response = await fetch('/api/music/albums?scope=public&includeTracks=true&limit=50');
        const data = await response.json();
        
        console.log('[Music Dashboard] Albums response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          const processedAlbums = data.data.map((album: any) => ({
            ...album,
            tracks: album.tracks?.map((track: any) => ({
              ...track,
              s3Url: track.fileUrl || track.s3Url || track.audioUrl || track.url || '',
              albumTitle: album.title,
              albumArt: album.coverArt,
              artist: album.artist,
            })) || [],
          }));
          
          setAlbums(processedAlbums);
        } else {
          console.error('[Music Dashboard] Failed to fetch albums:', data.error);
          showToast('Failed to load music library', 'error');
        }
      } catch (error) {
        console.error('[Music Dashboard] Failed to fetch albums:', error);
        showToast('Error loading music library', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [showToast]);

  if (isLoading) {
    return (
      <>
        {ToastComponent}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-lg bg-muted" />
              <div className="h-4 w-3/4 mt-2 rounded bg-muted" />
              <div className="h-3 w-1/2 mt-1 rounded bg-muted" />
            </div>
          ))}
        </div>
      </>
    );
  }

  const publicAlbums = albums.filter(album => album.isPublic && album.status === 'published');

  if (publicAlbums.length === 0) {
    return (
      <>
        {ToastComponent}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Music2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold">No Music Yet</h2>
          <p className="text-muted-foreground mt-2">
            Albums will appear here once they're published and made public.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {ToastComponent}

      {/* ✅ Add the test component */}
      {/* <div className="mb-6">
        <TestLocalStorage />
      </div> */}
      {/* ✅ Add the direct storage test */}
      <div className="mb-6">
        <DirectStorageTest />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Music Library</h1>
          <p className="text-sm text-muted-foreground">
            {publicAlbums.length} album{publicAlbums.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {publicAlbums.map((album) => {
            return (
              <Link key={album.id} href={`/dashboard/music/album/${album.id}`}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      {album.coverArt ? (
                        <Image
                          src={album.coverArt}
                          alt={album.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center text-6xl font-bold text-muted-foreground">
                          {album.title.charAt(0)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-3 flex flex-col items-start gap-0.5">
                    <div className="truncate w-full text-sm font-medium">{album.title}</div>
                    <div className="truncate w-full text-xs text-muted-foreground">{album.artist}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{album.tracks?.length || 0} tracks</span>
                      {album.totalDuration && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTime(album.totalDuration)}
                          </span>
                        </>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
