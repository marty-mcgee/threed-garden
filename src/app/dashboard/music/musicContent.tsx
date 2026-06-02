'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MusicPlayer } from '@/components/music/MusicPlayer';
import { LinksManager } from '@/components/music/LinksManager';
import { AlbumGrid } from '@/components/music/AlbumGrid';
import { Music, TrendingUp, Headphones, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { MusicPollStats } from '@/lib/types/music';
import { MusicStats } from '@/components/music/MusicStats';
import { NowPlaying } from '@/components/music/NowPlaying';

export default function MusicContent() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MusicPollStats | null>(null);
  const [polling, setPolling] = useState(false);
  // Add state for now playing
  const [nowPlayingTrack, setNowPlayingTrack] = useState<any>(null);
  const [nowPlayingProgress, setNowPlayingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchAlbums();
    fetchStats();
  }, []);

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
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Music Library</h1>
            <p className="text-muted-foreground">
              {albums.length} albums • {tracks.length} tracks
            </p>
          </div>
          <Button onClick={handleManualPoll} disabled={polling}>
            <RefreshCw className={`h-4 w-4 mr-2 ${polling ? 'animate-spin' : ''}`} />
            {polling ? 'Syncing...' : 'Sync Music'}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <MusicStats stats={stats} loading={loading} />
        )}
        {false && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Albums</p>
                    <p className="text-2xl font-bold">{stats.totalAlbums}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.publishedAlbums} published
                    </p>
                  </div>
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tracks</p>
                    <p className="text-2xl font-bold">{stats.totalTracks}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.activeTracks} active
                    </p>
                  </div>
                  <Headphones className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Plays</p>
                    <p className="text-2xl font-bold">{stats.totalPlayCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All time
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Storage Used</p>
                    <p className="text-2xl font-bold">{stats.storageUsed}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.recentUploads} recent uploads
                    </p>
                  </div>
                  <LinkIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Polling Status */}
      {stats?.pollStatus === 'polling' && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">Syncing music library from storage...</span>
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
        />
      )}

      <NowPlaying
        track={nowPlayingTrack}
        album={selectedAlbum}
        isPlaying={isPlaying}
        progress={nowPlayingProgress}
        onPlayPause={() => {
          // Handle play/pause
        }}
        onClose={() => setNowPlayingTrack(null)}
      />
    </div>
  );
}