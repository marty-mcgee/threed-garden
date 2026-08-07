// components/music/MusicContent.tsx - FETCH TRACKS FOR ALL ALBUMS
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
          const currentAlbumIndex = albums.findIndex(a => a.id === selectedAlbum?.id);
          const nextAlbum = albums[currentAlbumIndex + 1];
          
          if (nextAlbum) {
            handleSelectAlbum(nextAlbum.id);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
            if (audioElement) {
              audioElement.currentTime = 0;
            }
          }
        } else {
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
      console.log('📀 Fetching albums...');
      const response = await fetch('/api/music/albums?includeTracks=false');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const publishedAlbums = data.data.filter((album: any) => 
            album.status === 'published' && album.isPublic === true
          );
          console.log(`📀 Found ${publishedAlbums.length} published albums`);
          
          // ✅ Store albums without tracks initially
          setAlbums(publishedAlbums);
          
          // ✅ Fetch tracks for ALL albums
          await fetchTracksForAllAlbums(publishedAlbums);
          
          if (publishedAlbums.length > 0 && !selectedAlbum) {
            const firstAlbum = publishedAlbums[0];
            console.log(`📀 Selecting first album: ${firstAlbum.title} (ID: ${firstAlbum.id})`);
            setSelectedAlbum(firstAlbum);
            // ✅ Set tracks for the first album
            const firstAlbumTracks = firstAlbum.tracks || [];
            setTracks(firstAlbumTracks);
            setCurrentTrackIndex(0);
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

  // ✅ NEW: Fetch tracks for ALL albums
  const fetchTracksForAllAlbums = async (albumList: any[]) => {
    console.log(`🎵 Fetching tracks for ${albumList.length} albums...`);
    
    // Fetch tracks for each album in parallel
    const albumPromises = albumList.map(async (album) => {
      try {
        const response = await fetch(`/api/music/tracks?albumId=${album.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            console.log(`🎵 Found ${data.data.length} tracks for album ${album.id} (${album.title})`);
            return { ...album, tracks: data.data };
          }
        }
        return { ...album, tracks: [] };
      } catch (error) {
        console.error(`Error fetching tracks for album ${album.id}:`, error);
        return { ...album, tracks: [] };
      }
    });

    const albumsWithTracks = await Promise.all(albumPromises);
    
    // ✅ Update albums state with tracks
    setAlbums(albumsWithTracks);
    
    console.log(`✅ Finished fetching tracks for all albums`);
  };

  // ✅ Fetch tracks for a specific album (used when selecting an album)
  const fetchTracksForAlbum = async (albumId: number) => {
    setLoadingAlbum(true);
    try {
      console.log(`🎵 Fetching tracks for album ${albumId}`);
      const response = await fetch(`/api/music/tracks?albumId=${albumId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const fetchedTracks = data.data;
          console.log(`🎵 Found ${fetchedTracks.length} tracks for album ${albumId}`);
          
          // ✅ Update the albums array with tracks
          setAlbums(prevAlbums => 
            prevAlbums.map(album => 
              album.id === albumId 
                ? { ...album, tracks: fetchedTracks }
                : album
            )
          );
          
          // ✅ Update selected album if it's the current one
          if (selectedAlbum?.id === albumId) {
            setSelectedAlbum(prev => ({ ...prev, tracks: fetchedTracks }));
          }
          
          setTracks(fetchedTracks);
          setCurrentTrackIndex(0);
          return fetchedTracks;
        } else {
          console.error('Unexpected tracks response:', data);
          setTracks([]);
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setTracks([]);
      return [];
    } finally {
      setLoadingAlbum(false);
    }
  };

  // ✅ Handle album selection
  const handleSelectAlbum = async (id: number) => {
    console.log(`🔄 Selecting album ${id}`);
    
    // Find the album in the list
    const album = albums.find(a => a.id === id);
    if (album) {
      console.log(`📀 Album found: ${album.title}`);
      setSelectedAlbum(album);
      
      // ✅ Check if album already has tracks
      if (album.tracks && album.tracks.length > 0) {
        console.log(`🎵 Using cached tracks for ${album.title}`);
        setTracks(album.tracks);
        setCurrentTrackIndex(0);
      } else {
        // ✅ Fetch tracks if not cached
        await fetchTracksForAlbum(id);
      }
    } else {
      // ✅ Fallback: fetch tracks if album not found
      await fetchTracksForAlbum(id);
    }
    
    // Reset player
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
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

  const handlePlayAlbum = async (albumId: number) => {
    const album = albums.find(a => a.id === albumId);
    if (album) {
      setSelectedAlbum(album);
      
      // Check if album already has tracks
      if (album.tracks && album.tracks.length > 0) {
        setTracks(album.tracks);
        setCurrentTrackIndex(0);
      } else {
        await fetchTracksForAlbum(albumId);
      }
      
      setIsPlaying(true);
      setCurrentTime(0);
      if (audioElement) {
        audioElement.currentTime = 0;
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
      <div className="w-full px-4 py-4">
        <h1 className="text-3xl font-bold mb-6">Music Library</h1>

        {loadingAlbum && (
          <div className="mb-4 p-2 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
            Loading album...
          </div>
        )}

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