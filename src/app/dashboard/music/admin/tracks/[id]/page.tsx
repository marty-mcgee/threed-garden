'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MusicPlayer } from '@/components/music/MusicPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Music } from 'lucide-react';

export default function TrackPage() {
  const params = useParams();
  const trackId = params?.id as string;
  
  const [track, setTrack] = useState<any>(null);
  const [album, setAlbum] = useState<any>(null);
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

  useEffect(() => {
    if (trackId) {
      fetchTrack();
    }
  }, [trackId]);

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
    if (audioElement && track?.publicUrl) {
      audioElement.src = track.publicUrl;
      audioElement.load();
      if (isPlaying) {
        audioElement.play().catch(console.error);
      }
    }
  }, [track, audioElement]);

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
        setIsPlaying(true);
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
  }, [audioElement, currentTrackIndex, tracks]);

  const fetchTrack = async () => {
    try {
      const response = await fetch(`/api/music/tracks?id=${trackId}`);
      if (response.ok) {
        const data = await response.json();
        setTrack(data);
        
        // Fetch full album with all tracks
        if (data.albumId) {
          const albumResponse = await fetch(`/api/music/albums?id=${data.albumId}`);
          if (albumResponse.ok) {
            const albumData = await albumResponse.json();
            setAlbum(albumData);
            setTracks(albumData.tracks || []);
            // Find the index of this track in the album
            const trackIndex = (albumData.tracks || []).findIndex((t: any) => t.id === data.id);
            setCurrentTrackIndex(trackIndex >= 0 ? trackIndex : 0);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching track:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };
  const handlePrevious = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
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
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTrack = tracks[currentTrackIndex] || track;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading track...</p>
        </div>
      </div>
    );
  }

  if (!track || !album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Track Not Found</h2>
            <p className="text-muted-foreground mb-4">The track you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/dashboard/music">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Music Library
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/dashboard/music/album/${album.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Album
          </Link>
        </Button>

        {/* Album Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden shadow-lg">
              <img src={album.coverArt} alt={album.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{track.title}</h1>
              <p className="text-muted-foreground">
                {album.title} • {album.artist}
              </p>
              <p className="text-sm text-muted-foreground">
                Track {currentTrackIndex + 1} of {tracks.length}
              </p>
            </div>
          </div>
        </div>

        {/* Music Player */}
        {currentTrack && album && (
          <MusicPlayer
            track={currentTrack}
            album={album}
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
        )}
      </div>
    </div>
  );
}