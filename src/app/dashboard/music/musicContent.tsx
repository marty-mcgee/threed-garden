'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MusicPlayer } from '@/components/music/MusicPlayer';
import { LinksManager } from '@/components/music/LinksManager';
import { AlbumGrid } from '@/components/music/AlbumGrid';
import { MusicStats } from '@/components/music/MusicStats';
import { Music, TrendingUp, Headphones, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { MusicPollStats } from '@/lib/types/music';

export default function MusicContent() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MusicPollStats | null>(null);
  const [polling, setPolling] = useState(false);

  // Wait for session to load
  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchAlbums();
      fetchStats();
    }
  }, [sessionLoading, session]);

  useEffect(() => {
    if (selectedAlbum) {
      fetchTracks(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/music');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data);
        if (data.length > 0 && !selectedAlbum) {
          setSelectedAlbum(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async (albumId: number) => {
    try {
      const response = await fetch(`/api/music/tracks?albumId=${albumId}`);
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/music?action=stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleManualPoll = async () => {
    setPolling(true);
    try {
      const response = await fetch('/api/music/poll', { method: 'GET' });
      if (response.ok) {
        const result = await response.json();
        console.log('Poll result:', result);
        await fetchAlbums();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error during poll:', error);
    } finally {
      setPolling(false);
    }
  };

  // Show loading while session is loading
  if (sessionLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">Sign in to access your music</h2>
              <p className="text-muted-foreground">
                Please sign in to view and manage your music library
              </p>
              <Button onClick={() => window.location.href = '/sign-in'}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-32">
      {/* User Info */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Music Library</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name || session.user.email}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {albums.length} albums • {tracks.length} tracks
            </p>
          </div>
          <Button onClick={handleManualPoll} disabled={polling}>
            <RefreshCw className={`h-4 w-4 mr-2 ${polling ? 'animate-spin' : ''}`} />
            {polling ? 'Syncing...' : 'Sync Music'}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && <MusicStats stats={stats} loading={loading} />}
      </div>

      {/* Polling Status */}
      {stats?.pollStatus === 'polling' && (
        <Card className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Syncing music library from storage...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="albums" className="space-y-6">
        <TabsList>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="space-y-6">
          <AlbumGrid
            albums={albums}
            onSelectAlbum={(id) => {
              const album = albums.find(a => a.id === id);
              setSelectedAlbum(album || null);
            }}
            selectedAlbumId={selectedAlbum?.id}
            onPlayAlbum={(albumId) => {
              const album = albums.find(a => a.id === albumId);
              setSelectedAlbum(album || null);
              // Auto-play first track
              if (album) {
                fetchTracks(album.id);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="links">
          <LinksManager isIndependent />
        </TabsContent>
      </Tabs>

      {/* Music Player */}
      {selectedAlbum && tracks.length > 0 && (
        <MusicPlayer
          tracks={tracks}
          album={selectedAlbum}
          onTrackChange={(index) => {
            console.log(`Now playing track ${index + 1}`);
          }}
          onLike={async (trackId) => {
            // Implement like functionality
            console.log(`Liked track ${trackId}`);
          }}
        />
      )}
    </div>
  );
}