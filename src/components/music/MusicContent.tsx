// components/music/MusicContent.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlbumGrid } from '@/components/music/AlbumGrid';
import { MusicPlayer } from '@/components/music/MusicPlayer';
import { Skeleton } from '@/components/ui/skeleton';

export default function MusicContent() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  
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

  // Handle audio source changes
  useEffect(() => {
    if (audioElement && currentTrack?.publicUrl) {
      const wasPlaying = isPlaying;
      audioElement.src = currentTrack.publicUrl;
      audioElement.load();
      
      if (wasPlaying) {
        audioElement.play().catch((error) => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack, audioElement]);

  // Handle play/pause
  useEffect(() => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.play().catch((error) => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
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

  // Handle time updates and track ending
  useEffect(() => {
    if (audioElement) {
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
      const handleDurationChange = () => setDuration(audioElement.duration);
      const handleEnded = () => {
        const isLastTrack = currentTrackIndex === tracks.length - 1;
        
        if (isLastTrack) {
          // Last track ended - find and load next album
          const currentAlbumIndex = albums.findIndex(a => a.id === selectedAlbum?.id);
          const nextAlbum = albums[currentAlbumIndex + 1];
          
          if (nextAlbum) {
            // Load next album and auto-play
            fetchFullAlbum(nextAlbum.id);
          } else {
            // No more albums, just stop
            setIsPlaying(false);
            setCurrentTime(0);
            if (audioElement) {
              audioElement.currentTime = 0;
            }
          }
        } else {
          // Not last track - play next track in same album
          const nextIndex = currentTrackIndex + 1;
          setCurrentTrackIndex(nextIndex);
          setIsPlaying(true);
        }
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
  }, [audioElement, currentTrackIndex, tracks.length, selectedAlbum, albums]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/music/albums?includeTracks=true');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Filter to only show published albums
          const publishedAlbums = data.data.filter((album: any) => 
            album.status === 'published' && album.isPublic === true
          );
          setAlbums(publishedAlbums);
          
          // ✅ Select the first album automatically
          if (publishedAlbums.length > 0 && !selectedAlbum) {
            const firstAlbum = publishedAlbums[0];
            // ✅ Use the full album data (which already includes tracks from the API)
            if (firstAlbum.tracks) {
              setSelectedAlbum(firstAlbum);
              setTracks(firstAlbum.tracks);
              setCurrentTrackIndex(0);
            } else {
              // Fallback: fetch full album details
              await fetchFullAlbum(firstAlbum.id);
            }
          }
        } else {
          console.error('Unexpected API response format:', data);
          setAlbums([]);
        }
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Properly fetch full album details
  const fetchFullAlbum = useCallback(async (albumId: number) => {
    setLoadingAlbum(true);
    try {
      const response = await fetch(`/api/music/albums?id=${albumId}&includeTracks=true&includeLinks=true&includeMedia=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const fullAlbum = data.data;
          // ✅ Update selected album with full data
          setSelectedAlbum(fullAlbum);
          if (fullAlbum.tracks && fullAlbum.tracks.length > 0) {
            setTracks(fullAlbum.tracks);
            setCurrentTrackIndex(0);
          }
          // ✅ Reset player state
          setIsPlaying(false);
          setCurrentTime(0);
          if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
          }
        } else {
          console.error('Unexpected album detail response:', data);
        }
      }
    } catch (error) {
      console.error('Error fetching full album:', error);
    } finally {
      setLoadingAlbum(false);
    }
  }, [audioElement]);

  // ✅ FIX: Handle album selection
  const handleSelectAlbum = (id: number) => {
    // ✅ Find the album in the existing list first
    const existingAlbum = albums.find(a => a.id === id);
    if (existingAlbum && existingAlbum.tracks) {
      // ✅ Use the cached album data
      setSelectedAlbum(existingAlbum);
      setTracks(existingAlbum.tracks);
      setCurrentTrackIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    } else {
      // ✅ Fetch full album details
      fetchFullAlbum(id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };
  
  const handlePrevious = () => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
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

  const handlePlayAlbum = (albumId: number) => {
    const album = albums.find(a => a.id === albumId);
    if (album) {
      if (album.tracks) {
        setSelectedAlbum(album);
        setTracks(album.tracks);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
        setCurrentTime(0);
        if (audioElement) {
          audioElement.currentTime = 0;
        }
      } else {
        fetchFullAlbum(albumId);
        // We'll let fetchFullAlbum handle the player state
        // after it loads the tracks
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      <div className="container mx-auto px-4 py-4">
        {/* Simple Header */}
        <h1 className="text-3xl font-bold mb-6">Music Library</h1>

        {/* Loading indicator for album switching */}
        {loadingAlbum && (
          <div className="mb-4 p-2 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
            Loading album...
          </div>
        )}

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

        {/* Album Grid */}
        <AlbumGrid
          albums={albums}
          onSelectAlbum={handleSelectAlbum}
          selectedAlbumId={selectedAlbum?.id}
          onPlayAlbum={handlePlayAlbum}
        />
      </div>
    </div>
  );
}