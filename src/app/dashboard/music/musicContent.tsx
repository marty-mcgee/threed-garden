'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
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
import { toast } from 'sonner';

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
      const response = await fetch('/api/music/albums', {
        credentials: 'include', // Important!
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAlbums(data);
        if (data.length > 0 && !selectedAlbum) {
          setSelectedAlbum(data[0]);
        }
      } 
      else if (response.status === 401) {
        console.error('Unauthorized - redirect to sign in');
        // router.push('/sign-in');
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
  
  const handleToggleMute = () => setIsMuted(!isMuted);
  
  const handleSeek = (value: number[]) => {
    if (audioElement) {
      audioElement.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  // Wrap the onPlayAlbum logic in a function
  const handlePlayAlbum = (albumId: number) => {
    const album = albums.find(a => a.id === albumId);
    if (album) {
      setSelectedAlbum(album);
      
      // // Auto-Scroll to music-player
      // setTimeout(() => {
      //   const playerElement = document.getElementById('music-player');
      //   if (playerElement) {
      //     playerElement.scrollIntoView({ 
      //       behavior: 'smooth', 
      //       block: 'start' 
      //     });
      //   }
      // }, 100);
      // Auto-Scroll to top
      setTimeout(() => {
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
      }, 50);

    }
  };

  // Add the onTrackSelect handler
  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    // Scroll to player
    const playerElement = document.getElementById('music-player');
    if (playerElement) {
      playerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // In musicContent.tsx, update your audio element event handlers

  // First, create a function that handles track end and auto-next album
 // Handle track end with auto-next album
  const handleTrackEnded = () => {

    if (!currentTrack || !selectedAlbum) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const isLastTrack = currentIndex === tracks.length - 1;
    
    console.log('Track ended:', { currentIndex, isLastTrack, tracksLength: tracks.length });
    console.log('🎵 Track ended!', {
      currentTrack: currentTrack?.title,
      currentIndex: tracks.findIndex(t => t.id === currentTrack?.id),
      totalTracks: tracks.length,
      currentAlbum: selectedAlbum?.title,
      albumIndex: albums.findIndex(a => a.id === selectedAlbum?.id)
    })
    
    if (isLastTrack) {
      // Last track finished - move to next album
      const currentAlbumIndex = albums.findIndex(a => a.id === selectedAlbum.id);
      const nextAlbumIndex = currentAlbumIndex + 1;
      
      console.log('Album navigation:', { currentAlbumIndex, nextAlbumIndex, totalAlbums: albums.length });
      
      if (nextAlbumIndex < albums.length) {
        const nextAlbum = albums[nextAlbumIndex];
        setSelectedAlbum(nextAlbum);
        
        // Show notification
        toast.success(`Auto-playing: ${nextAlbum.title}`);
        
        // Scroll to top
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        toast.info("You've reached the end of your library!");
      }
    } else {
      // Not last track - play next track
      const nextIndex = (currentIndex + 1) % tracks.length;
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  // Handle audio element events
  useEffect(() => {
    if (audioElement) {
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
      const handleDurationChange = () => setDuration(audioElement.duration);
      const handleEnded = handleTrackEnded;

      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('durationchange', handleDurationChange);
      audioElement.addEventListener('ended', handleEnded);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('durationchange', handleDurationChange);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioElement, currentTrack, tracks, selectedAlbum, albums]);

  // Add this function to your MusicContent component
  const handleNextAlbum = () => {
    if (!selectedAlbum || albums.length === 0) return;
    
    // Find current album index
    const currentIndex = albums.findIndex(a => a.id === selectedAlbum.id);
    const nextIndex = currentIndex + 1;
    
    // Check if there's a next album
    if (nextIndex < albums.length) {
      const nextAlbum = albums[nextIndex];
      setSelectedAlbum(nextAlbum);
      
      // Auto-scroll to top to show the new album
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      // Show a toast notification
      // toast.success(`Now playing: ${nextAlbum.title}`);
      console.log(`Now playing: ${nextAlbum.title}`);
    } else {
      // toast.info("You've reached the end of your library!");
      console.log("You've reached the end of your library!");
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

        {/* Music Player Component */}
        {selectedAlbum && currentTrack && (
          // <MusicPlayer
          //   track={currentTrack}
          //   album={{ ...selectedAlbum, tracks }}
          //   isPlaying={isPlaying}
          //   onPlayPause={handlePlayPause}
          //   onNext={handleNext}
          //   onPrevious={handlePrevious}
          //   onSeek={handleSeek}
          //   currentTime={currentTime}
          //   duration={duration}
          //   volume={volume}
          //   isMuted={isMuted}
          //   onVolumeChange={handleVolumeChange}
          //   onToggleMute={handleToggleMute}
          //   formatTime={formatTime}
          // />


          <div id="music-player">
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
              onNextAlbum={handleNextAlbum}
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
        <Tabs defaultValue="albums" className="space-y-6 mt-8">
          {/* <TabsList>
            <TabsTrigger value="albums" className="gap-2">
              <Music className="h-4 w-4" />
              Albums
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <ListMusic className="h-4 w-4" />
              Links
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="albums" className="space-y-6">
            <AlbumGrid
              albums={albums}
              onSelectAlbum={(id) => {
                const album = albums.find(a => a.id === id);
                setSelectedAlbum(album || null);
              }}
              selectedAlbumId={selectedAlbum?.id}
              // onPlayAlbum={(albumId) => {
              //   const album = albums.find(a => a.id === albumId);
              //   setSelectedAlbum(album || null);
                
              //   // Add auto-scroll to player with a small delay
              //   setTimeout(() => {
              //     const playerElement = document.getElementById('music-player');
              //     if (playerElement) {
              //       playerElement.scrollIntoView({ 
              //         behavior: 'smooth', 
              //         block: 'start' 
              //       });
              //     }
              //   }, 100);
              // }}
              onPlayAlbum={handlePlayAlbum}
            />
          </TabsContent>

          {/* <TabsContent value="links">
            <LinksManager isIndependent />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}