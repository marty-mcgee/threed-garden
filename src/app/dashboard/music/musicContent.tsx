'use client';

import { useState, useEffect } from 'react';
import { AlbumGrid } from '@/components/music/AlbumGrid';
import { LinksManager } from '@/components/music/LinksManager';
import { MusicStats } from '@/components/music/MusicStats';
import { MusicPlayer } from '@/components/music/MusicPlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Music, ListMusic, RefreshCw } from 'lucide-react';
import { MusicPollStats } from '@/lib/types/music';

export default function MusicContent() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const currentTrack = tracks[currentTrackIndex];

  // Fetch albums and stats on load
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
      const response = await fetch('/api/music/albums?includeTracks=true');
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
      const response = await fetch('/api/music/stats');
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
  
  const handleToggleMute = () => setIsMuted(!isMuted);
  
  const handleSeek = (value: number[]) => {
    if (audioElement) {
      audioElement.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-6 py-8">
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

        {/* Music Player */}
        {selectedAlbum && currentTrack && (
          <div id="music-player" className="mb-8">
            <MusicPlayer
              track={currentTrack}
              album={{ ...selectedAlbum, tracks }}
              tracks={tracks}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSeek={handleSeek}
              onTrackSelect={handleTrackSelect}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
              formatTime={formatTime}
            />
          </div>
        )}

        {/* Stats Cards */}
        {/* {stats && <MusicStats stats={stats} loading={loading} />} */}

        {/* Main Content Tabs */}
        {/* <Tabs defaultValue="albums" className="space-y-6 mt-8">
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
        </Tabs> */}
      </div>
    </div>
  );
}