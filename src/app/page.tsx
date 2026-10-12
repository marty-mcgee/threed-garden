'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import GardenHero from '@/components/home/GardenHero';
import { MusicPlayer } from '@/components/multimedia/MusicPlayer';

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
    if (audioElement && currentTrack?.fileUrl) {
      audioElement.src = currentTrack.fileUrl;
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
      const response = await fetch('/api/multimedia/albums?scope=public');
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
      const response = await fetch(`/api/multimedia/tracks?scope=public&albumId=${albumId}`);
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
      icon: "🌱",
      title: "ThreeD Garden",
      description: "Interactive 3D garden using real Physics, with FarmBot integration",
      href: "/dashboard/scene?projectId=8",
      // href: "https://threed-garden-neon.vercel.app/", 
      color: "from-green-500 to-emerald-500",
      external: false
    },
    {
      icon: "📻",
      title: "Traffic Monitor",
      description: "Real-time CHP, Caltrans, Calfire incident tracking",
      href: "/dashboard/traffic",
      // href: "https://mendocinocoast.news/traffic/", 
      color: "from-blue-500 to-cyan-500",
      external: false
    },
    {
      icon: "🎵",
      title: "Music Streaming",
      description: "Browse available albums and listen to tracks",
      href: "/dashboard/multimedia",
      color: "from-green-800 to-emerald-700",
      external: false
    },
    {
      icon: "💻",
      title: "Open-source project",
      description: "Explore the source and developer documentation",
      href: "https://github.com/marty-mcgee/threed-garden",
      color: "from-gray-500 to-gray-700",
      external: true
    },
  ];

  const techStack = [
    { name: "TypeScript", url: "https://www.typescriptlang.org" },
    { name: "Postgres", url: "https://www.postgresql.org/about/" },
    // { name: "Neon", url: "https://neon.tech" },
    { name: "Drizzle ORM", url: "https://orm.drizzle.team" },
    { name: "Next.js", url: "https://nextjs.org" },
    { name: "React", url: "https://react.org" },
    { name: "Three.js", url: "https://threejs.org" },
    { name: "React-Three", url: "https://r3f.docs.pmnd.rs/getting-started/introduction" },
    { name: "ThreeD Design", url: "https://threed.design" },
    { name: "AWS S3", url: "https://aws.amazon.com/s3" },
    { name: "Vercel", url: "https://vercel.com" },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">

      <AppHeader surface="dashboard" />
      {/* Garden studio hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-950 via-[#123e2c] to-emerald-950">
        {/* Content */}
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[.85fr_1.15fr] lg:py-20">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/20 px-3 py-1 text-sm backdrop-blur-sm mb-3">
              <a
                key={`THREED-GARDEN-MAIN`}
                href={`/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🥕 Interactive 3D Gardens
              </a>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              ThreeD Garden
            </h1>
            <p className="text-lg lg:text-xl mb-6 text-white/90">
              Plan spaces, build interactive scenes, and explore your ideas in 3D.
            </p>

            <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-emerald-100/75 lg:mx-0">Draw a room, arrange a garden layout, or explore a scene with Models and Characters. Begin with a small Project and inspect it from different views.</p>

            <div className="mb-4 flex flex-wrap justify-center gap-3 lg:justify-start"><Link href="#garden-demo" className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-green-950 focus-visible:outline-2 focus-visible:outline-white">Try the garden demo</Link><Link href="/learn" className="rounded-md border border-white/50 px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-white">Learn ThreeD</Link></div>
            {/* Hero CTA Buttons - Horizontal layout */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
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
          <div id="garden-demo" className="scroll-mt-16"><GardenHero /><p className="mt-3 text-sm text-emerald-100">Illustrative garden: practice orbit and zoom without an account. To draw and save, open your own Project from Dashboard.</p></div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="py-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full px-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold mb-1">Tech Stack</h2>
            <div className="w-8 h-0.5 bg-gradient-to-r from-green-800 to-emerald-600 mx-auto" />
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

      {/* Features Grid */}
      <div className="py-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-full px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Explore ThreeD Garden</h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-green-800 to-emerald-600 mx-auto" />
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

      {/* About + Stats */}
      <div className="py-8">
        <div className="w-full px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">About ThreeD Garden</h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-green-800 to-emerald-600 mx-auto md:mx-0 mb-4" />
              <p className="text-muted-foreground">Create interactive gardens with 3D models, characters, physics, and maps. Bring your projects to life in a shared workspace for nature, technology, and creativity.</p>
            </div>
            <div className="space-y-3 rounded-lg border p-5"><h3 className="font-semibold">Open source, ready to explore</h3><p className="text-sm text-muted-foreground">ThreeD Garden is available under the MIT License. Explore the source, follow a guide, or start a Project of your own.</p><a className="text-sm underline underline-offset-4" href="https://github.com/marty-mcgee/threed-garden">View the ThreeD Garden repository</a></div>
          </div>
        </div>
      </div>

      {/* Featured Music Player Section */}
      {selectedAlbum && currentTrack && !loading && (
        <div className="py-8 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="w-full px-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-700/20 px-3 py-1 text-xs text-green-300 mb-2">
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
          <div className="w-full px-6 text-center">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-gray-700 rounded mx-auto mb-2"></div>
              <div className="h-4 w-64 bg-gray-700 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="py-10 bg-gradient-to-r from-green-900 to-emerald-900 text-white">
        <div className="w-full px-6 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to Explore More?</h2>
          <p className="text-sm mb-4 text-green-100">Explore the 3D garden, discover the music library, or check out live traffic.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard/multimedia" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 h-9 px-4 py-2 transition-colors"><span className="mr-2">🎵</span>Full Library</Link>
            <a href="https://github.com/marty-mcgee/threed-garden" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-white text-white hover:bg-white/20 h-9 px-4 py-2 transition-colors"><span className="mr-2">🐙</span>GitHub</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t">
        <div className="w-full px-6 text-center text-xs text-muted-foreground">
          <p>ThreeD Garden · © 2026 Marty McGee. Built with Next.js, Neon, and 💚.</p>
          <div className="flex justify-center gap-3 mt-1">
            <Link href="/dashboard/multimedia" className="hover:text-foreground transition-colors">Music</Link>
            <Link href="/dashboard/threed" className="hover:text-foreground transition-colors">3D Garden</Link>
            <Link href="/dashboard/traffic" className="hover:text-foreground transition-colors">Traffic</Link>
            <Link href="/learn" className="hover:text-foreground transition-colors">Learn ThreeD</Link>
            <a href="https://github.com/marty-mcgee/threed-garden" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
