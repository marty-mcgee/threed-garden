'use client';

import { useState, useEffect } from 'react';
import { AlbumGrid } from '@/components/music/AlbumGrid';
import { MusicPlayer } from '@/components/music/MusicPlayer';
import { Skeleton } from '@/components/ui/skeleton';

export default function MusicContent() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  // Load tracks when album is selected (but don't auto-play)
  useEffect(() => {
    if (selectedAlbum) {
      fetchTracks(selectedAlbum.id);
      // Reset playing state - user must press play
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      setCurrentTime(0);
    }
  }, [selectedAlbum]);

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
            setSelectedAlbum(nextAlbum);
            // Scroll to top to show the new album
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setAlbums(data);
        if (data.length > 0 && !selectedAlbum) {
          // setSelectedAlbum(data[0]);
          // Fetch full album data with links for the first album
          fetchFullAlbum(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

    // NEW: Fetch full album details including links
  const fetchFullAlbum = async (albumId: number) => {
    try {
      const response = await fetch(`/api/music/albums?id=${albumId}`);
      if (response.ok) {
        const fullAlbum = await response.json();
        setSelectedAlbum(fullAlbum);
        // Also update tracks from the full album data
        if (fullAlbum.tracks) {
          setTracks(fullAlbum.tracks);
          setCurrentTrackIndex(0);
        }
      }
    } catch (error) {
      console.error('Error fetching full album:', error);
    }
  };

  // Update the onSelectAlbum handler
  const handleSelectAlbum = (id: number) => {
    fetchFullAlbum(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchTracks = async (albumId: number) => {
    try {
      const response = await fetch(`/api/music/tracks?albumId=${albumId}`);
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
        setCurrentTrackIndex(0);
        // User must press play - no auto-play
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
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
      // setSelectedAlbum(album);
      fetchFullAlbum(albumId);
      // User must press play - no auto-play
      setIsPlaying(false);
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