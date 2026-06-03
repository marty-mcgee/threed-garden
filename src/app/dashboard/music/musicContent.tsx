'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { AlbumGrid } from '@/components/music/AlbumGrid';
import { LinksManager } from '@/components/music/LinksManager';
import { MusicStats } from '@/components/music/MusicStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Music, ListMusic, RefreshCw, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { MusicPollStats } from '@/lib/types/music';
import { cn } from '@/lib/utils';

export default function MusicContent() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MusicPollStats | null>(null);
  const [polling, setPolling] = useState(false);
  
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useState<HTMLAudioElement | null>(null)[0];
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  // Fetch albums on load
  useEffect(() => {
    fetchAlbums();
    fetchStats();
  }, []);

  // Set up audio element
  useEffect(() => {
    const audio = new Audio();
    setAudioElement(audio);
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Load tracks when album is selected
  useEffect(() => {
    if (selectedAlbum) {
      fetchTracks(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  // Handle audio source changes
  useEffect(() => {
    if (audioElement && currentTrack?.publicUrl) {
      audioElement.src = currentTrack.publicUrl;
      audioElement.load();
      if (isPlaying) {
        audioElement.play().catch(console.error);
      }
    }
  }, [currentTrack, audioElement]);

  // Handle play/pause
  useEffect(() => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.play().catch(console.error);
      } else {
        audioElement.pause();
      }
    }
  }, [isPlaying, audioElement]);

  // Handle volume
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audioElement]);

  // Handle time updates
  useEffect(() => {
    if (audioElement) {
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
      const handleDurationChange = () => setDuration(audioElement.duration);
      const handleEnded = () => {
        const nextIndex = (currentTrackIndex + 1) % tracks.length;
        setCurrentTrackIndex(nextIndex);
      };

      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('durationchange', handleDurationChange);
      audioElement.addEventListener('ended', handleEnded);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('durationchange', handleDurationChange);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioElement, currentTrackIndex, tracks.length]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/music/albums');
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

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };
  
  const handlePrevious = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => setIsMuted(!isMuted);
  
  const handleSeek = (value: number[]) => {
    if (audioElement) {
      audioElement.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Prominent Media Player - Only playback controls */}
      {selectedAlbum && currentTrack && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Album Artwork */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                <img 
                  src={selectedAlbum.coverArt} 
                  alt={selectedAlbum.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Track Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs uppercase tracking-wider text-gray-400">Now Playing</p>
                <h2 className="text-xl md:text-2xl font-bold mt-1">{currentTrack.title}</h2>
                <p className="text-gray-400 text-sm">{selectedAlbum.title} • {selectedAlbum.artist}</p>
              </div>

              {/* Playback Controls */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePrevious}
                    className="p-2 hover:bg-white/10 rounded-full transition-all"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button 
                    onClick={handlePlayPause}
                    className="p-3 bg-white text-gray-900 rounded-full hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                  
                  <button 
                    onClick={handleNext}
                    className="p-2 hover:bg-white/10 rounded-full transition-all"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-64">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
                    <Slider
                      value={[currentTime]}
                      max={duration || 0}
                      step={1}
                      onValueChange={handleSeek}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="p-1 hover:text-gray-300">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the page content */}
      <div className="container mx-auto px-6 py-0">
        {/* Header */}
        {/* <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Music Library</h1>
            <p className="text-muted-foreground mt-1">
              {albums.length} albums • {tracks.length} tracks
            </p>
          </div>
          <Button onClick={handleManualPoll} disabled={polling} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${polling ? 'animate-spin' : ''}`} />
            {polling ? 'Syncing...' : 'Sync Music'}
          </Button>
        </div> */}

        {/* Main Content Tabs */}
        <Tabs defaultValue="albums" className="space-y-6 mt-8">
          <TabsList>
            <TabsTrigger value="albums" className="gap-2">
              <Music className="h-4 w-4" />
              Albums
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
              }}
            />
          </TabsContent>

          <TabsContent value="links">
            <LinksManager isIndependent />
          </TabsContent>
        </Tabs>
        

        {/* Stats Cards */}
        {stats && <MusicStats stats={stats} loading={loading} />}


      </div>
    </div>
  );
}