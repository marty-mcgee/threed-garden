'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { AlbumGrid } from '@/components/music/AlbumGrid';
import { LinksManager } from '@/components/music/LinksManager';
import { MusicStats } from '@/components/music/MusicStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, ListMusic, RefreshCw } from 'lucide-react';
import { MusicPollStats } from '@/lib/types/music';

export default function MusicContent() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MusicPollStats | null>(null);
  const [polling, setPolling] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-select first album when loaded
  useEffect(() => {
    if (albums.length > 0 && !selectedAlbum) {
      setSelectedAlbum(albums[0]);
    }
  }, [albums]);

  // Fetch tracks when album is selected
  useEffect(() => {
    if (selectedAlbum) {
      fetchTracks(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  // Auto-start playing when tracks are loaded
  useEffect(() => {
    if (tracks.length > 0 && !isPlaying) {
      setIsPlaying(true);
    }
  }, [tracks]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/music/albums');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data);
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
        setCurrentTrackIndex(0);
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
        await fetchAlbums();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error during poll:', error);
    } finally {
      setPolling(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAlbums();
    fetchStats();
  }, []);

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your music...</p>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Prominent Media Player Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 py-8">
          {/* Player Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Music Player</h1>
              <p className="text-blue-100">Experience your music collection</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleManualPoll} 
              disabled={polling}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${polling ? 'animate-spin' : ''}`} />
              {polling ? 'Syncing...' : 'Sync Music'}
            </Button>
          </div>

          {/* The Media Player */}
          {selectedAlbum && tracks.length > 0 && currentTrack && (
            <div className="bg-black/20 rounded-2xl backdrop-blur-sm p-6">
              {/* Now Playing Info */}
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Album Art */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden shadow-xl flex-shrink-0">
                  <img 
                    src={selectedAlbum.coverArt} 
                    alt={selectedAlbum.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Track Info */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-sm uppercase tracking-wider text-blue-200">Now Playing</p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-1">{currentTrack.title}</h2>
                  <p className="text-blue-200 mt-1">{selectedAlbum.title} • {selectedAlbum.artist}</p>
                  
                  {/* Album Navigation */}
                  <div className="flex gap-2 mt-4 justify-center md:justify-start">
                    {albums.map((album) => (
                      <button
                        key={album.id}
                        onClick={() => setSelectedAlbum(album)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedAlbum.id === album.id
                            ? 'bg-white text-blue-600'
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        {album.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player Controls - Integrated into the prominent player */}
                <div className="flex flex-col items-center gap-3">
                  {/* Main Controls */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
                        setCurrentTrackIndex(prevIndex);
                      }}
                      className="p-2 hover:bg-white/20 rounded-full transition-all"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-4 bg-white text-blue-600 rounded-full hover:scale-105 transition-transform"
                    >
                      {isPlaying ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => {
                        const nextIndex = (currentTrackIndex + 1) % tracks.length;
                        setCurrentTrackIndex(nextIndex);
                      }}
                      className="p-2 hover:bg-white/20 rounded-full transition-all"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Track Progress */}
                  <div className="w-64">
                    <audio
                      key={currentTrack.id}
                      src={currentTrack.publicUrl}
                      autoPlay={isPlaying}
                      onEnded={() => {
                        const nextIndex = (currentTrackIndex + 1) % tracks.length;
                        setCurrentTrackIndex(nextIndex);
                      }}
                      className="hidden"
                      controls={false}
                    />
                    <div className="text-xs text-center text-blue-200">
                      {currentTrack.duration ? `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Track List for current album */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {tracks.map((track, idx) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                        currentTrackIndex === idx
                          ? 'bg-white text-blue-600'
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      {track.trackNumber}. {track.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rest of the page content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && <MusicStats stats={stats} loading={loading} />}

        {/* Main Content Tabs */}
        <Tabs defaultValue="albums" className="space-y-6 mt-8">
          <TabsList>
            <TabsTrigger value="albums" className="gap-2">
              <Music className="h-4 w-4" />
              All Albums
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <ListMusic className="h-4 w-4" />
              Links
            </TabsTrigger>
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
                if (album) {
                  fetchTracks(album.id);
                  setIsPlaying(true);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="links">
            <LinksManager isIndependent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}