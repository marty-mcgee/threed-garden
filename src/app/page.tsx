'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MusicPlayer } from '@/components/music/MusicPlayer';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
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

  // Fetch first album on mount
  useEffect(() => {
    setMounted(true);
    fetchFirstAlbum();
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
  }, [audioElement, currentTrackIndex, tracks.length]);

  const fetchFirstAlbum = async () => {
    try {
      const response = await fetch('/api/music/albums');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data);
        if (data.length > 0) {
          setSelectedAlbum(data[0]);
          await fetchTracks(data[0].id);
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

  // Content Links (features)
  const features = [
  { 
    icon: "🎵", 
    title: "Music Streaming", 
    description: "Full-featured music player with waveform visualization", 
    href: "/dashboard/music", 
    color: "from-purple-500 to-pink-500", 
    external: false 
  },
  { 
    icon: "🌱", 
    title: "ThreeD Garden", 
    description: "Interactive 3D garden with FarmBot integration", 
    // href: "/dashboard/threed",
    href: "https://threed-garden-neon.vercel.app/", 
    color: "from-green-500 to-emerald-500", 
    external: true 
  },
  { 
    icon: "📻", 
    title: "Traffic Monitor", 
    description: "Real-time CHP, Caltrans, and wildfire tracking", 
    // href: "/dashboard/traffic",
    href: "https://mendocinocoast.news/traffic/", 
    color: "from-blue-500 to-cyan-500", 
    external: true 
  },
  { 
    icon: "💻", 
    title: "Full-Stack Platform", 
    description: "Next.js 15, Neon, Drizzle, TypeScript, Three.js, R3F", 
    href: "https://github.com/marty-mcgee/marty-mcgee-neon", 
    color: "from-gray-500 to-gray-700", 
    external: true 
  },
];

  const stats = [
    { value: "8+", label: "Albums", icon: "🎵" },
    { value: "48+", label: "Tracks", icon: "🎵" },
    { value: "16", label: "APIs", icon: "🗄️" },
    { value: "24/7", label: "Live", icon: "📡" },
  ];

  const techStack = [
    { name: "Next.js 15", url: "https://nextjs.org" },
    { name: "TypeScript", url: "https://www.typescriptlang.org" },
    { name: "Neon", url: "https://neon.tech" },
    { name: "Drizzle", url: "https://orm.drizzle.team" },
    { name: "Three.js", url: "https://threejs.org" },
    { name: "Tailwind", url: "https://tailwindcss.com" },
    { name: "AWS S3", url: "https://aws.amazon.com/s3" },
    { name: "Vercel", url: "https://vercel.com" },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      
      {/* Hero Section with Blurred Background Image */}
      <div className="relative overflow-hidden">
        {/* Background Image with Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-md"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&h=1080&fit=crop')`,
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-pink-600/50" />
        
        {/* Content */}
        <div className="relative container mx-auto px-6 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/20 px-3 py-1 text-sm backdrop-blur-sm mb-3">
              🎵 Full-Stack Creator
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              Marty McGee
            </h1>
            <p className="text-lg lg:text-xl mb-6 text-white/90">
              Musician • Developer • 3D Artist • Gardener • Broadcaster
            </p>
            
            {/* Hero CTA Buttons - Horizontal layout */}
            <div className="flex flex-wrap gap-3 justify-center">
              {features.map((feature, index) => {
                const ButtonContent = (
                  <>
                    <span className="mr-2">{feature.icon}</span>
                    {feature.title}
                  </>
                );
                
                if (feature.external) {
                  return (
                    <a
                      key={index}
                      href={feature.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-black/40 text-white hover:bg-white/20 backdrop-blur-sm border border-white/30 h-10 px-4 py-2 transition-colors"
                    >
                      {ButtonContent}
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={index}
                    href={feature.href}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-black/40 text-white hover:bg-white/20 backdrop-blur-sm border border-white/30 h-10 px-4 py-2 transition-colors"
                  >
                    {ButtonContent}
                  </Link>
                );
              })}
            </div>



          </div>
        </div>

      </div>

      {/* Tech Stack */}
      <div className="py-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold mb-1">Tech Stack</h2>
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <a key={tech.name} href={tech.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md">
                <span>{tech.name}</span>
                <span className="text-xs opacity-50">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* About + Stats */}
      <div className="py-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">About Marty</h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto md:mx-0 mb-4" />
              <p className="text-muted-foreground">Multidisciplinary creator building immersive digital experiences that blend music, technology, and nature.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-3xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">What I Build</h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm p-4 group hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform`}>{feature.icon}</div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-muted-foreground text-xs mb-3">{feature.description}</p>
                {feature.external ? (
                  <a href={feature.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Explore <span>↗</span></a>
                ) : (
                  <Link href={feature.href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Explore <span>→</span></Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Music Player Section */}
      {selectedAlbum && currentTrack && !loading && (
        <div className="py-8 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="container mx-auto px-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1 text-xs text-purple-300 mb-2">
                🎵 Featured Release
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{selectedAlbum.title}</h2>
              <p className="text-gray-400 text-sm">{selectedAlbum.artist}</p>
            </div>
            <MusicPlayer
              track={currentTrack}
              album={selectedAlbum}
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
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-8 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="container mx-auto px-6 text-center">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-gray-700 rounded mx-auto mb-2"></div>
              <div className="h-4 w-64 bg-gray-700 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="py-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to Explore More?</h2>
          <p className="text-sm mb-4 text-blue-100">Dive into my full music library, explore the 3D garden, or check out live traffic.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard/music" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 h-9 px-4 py-2 transition-colors"><span className="mr-2">🎵</span>Full Library</Link>
            <a href="https://github.com/marty-mcgee" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-white text-white hover:bg-white/20 h-9 px-4 py-2 transition-colors"><span className="mr-2">🐙</span>GitHub</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
          <p>© 2026 Marty McGee. Built with Next.js, Neon, and 💜.</p>
          <div className="flex justify-center gap-3 mt-1">
            <Link href="/dashboard/music" className="hover:text-foreground transition-colors">Music</Link>
            <Link href="/dashboard/threed" className="hover:text-foreground transition-colors">3D Garden</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Traffic</Link>
            <a href="https://github.com/marty-mcgee" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}