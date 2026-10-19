'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import GardenHero from '@/components/home/GardenHero';
import { MultimediaPlayer } from '@/components/multimedia/MultimediaPlayer';
import { Button } from '@/components/ui/button';

const largeActionClassName = 'h-auto min-h-14 whitespace-normal rounded-xl px-7 py-4 text-base [&_svg]:size-5';
const greenOutlineClassName = 'border-emerald-700/25 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 hover:text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-100';

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
      color: "border-emerald-500/20 bg-emerald-500/10",
      external: false
    },
    {
      icon: "📻",
      title: "Traffic Monitor",
      description: "Real-time CHP, Caltrans, Calfire incident tracking",
      href: "/dashboard/traffic",
      // href: "https://mendocinocoast.news/traffic/", 
      color: "border-cyan-500/20 bg-cyan-500/10",
      external: false
    },
    {
      icon: "🎵",
      title: "Music Streaming",
      description: "Browse available albums and listen to tracks",
      href: "/dashboard/multimedia",
      color: "border-violet-500/20 bg-violet-500/10",
      external: false
    },
    {
      icon: "💻",
      title: "Open-Source Project",
      description: "Explore the source and developer documentation",
      href: "https://github.com/marty-mcgee/threed-garden",
      color: "border-amber-500/20 bg-amber-500/10",
      external: true
    },
  ];

  const techStack = [
    { name: "TypeScript", url: "https://www.typescriptlang.org" },
    { name: "Postgres", url: "https://www.postgresql.org/about" },
    // { name: "Neon", url: "https://neon.tech" },
    { name: "Drizzle ORM", url: "https://orm.drizzle.team" },
    { name: "Next.js", url: "https://nextjs.org" },
    { name: "React", url: "https://react.org" },
    { name: "Three.js", url: "https://threejs.org" },
    { name: "React-Three", url: "https://r3f.docs.pmnd.rs/next" },
    { name: "ThreeD Design", url: "https://threed.design" },
    { name: "AWS S3", url: "https://aws.amazon.com/s3" },
    { name: "Vercel", url: "https://vercel.com" },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="threed-presentation min-h-screen">

      <AppHeader surface="dashboard" />
      {/* Garden studio hero */}
      <div className="threed-workspace-panel threed-presentation-surface threed-presentation-featured relative overflow-hidden border-b">
        {/* Content */}
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[.85fr_1.15fr] lg:py-20">
          <div className="text-center lg:text-left">
            <div className="mb-4 inline-flex items-center rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-800 dark:border-emerald-400/20 dark:text-emerald-200">
              <a
                key={`THREED-GARDEN-MAIN`}
                href={`/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🥕 Interactive 3D Gardens
              </a>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-6xl">
              ThreeD Garden
            </h1>


            <p className="mb-6 text-lg leading-relaxed text-foreground/85 lg:text-xl">
              Plan spaces, build interactive scenes, and explore your ideas in 3D.
            </p>

            <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-muted-foreground lg:mx-0">Draw a room, arrange a garden layout, or explore a scene with Models and Characters. Begin with a small Project and inspect it from different views.</p>

            {/* Hero CTA Buttons - Horizontal layout */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((feature, index) => {
                const ButtonContent = (
                  <>
                    <span aria-hidden="true" className="text-2xl">{feature.icon}</span>
                    <span className="flex-1">{feature.title}</span><ArrowRight aria-hidden="true" className="shrink-0" />
                  </>
                );

                if (feature.external) {
                  return (
                    <Button key={index} asChild variant="outline" className={`h-auto min-h-16 justify-start whitespace-normal rounded-xl px-4 py-4 text-left text-base ${greenOutlineClassName}`}>
                      <a href={feature.href} target="_blank" rel="noopener noreferrer">
                        {ButtonContent}
                      </a>
                    </Button>
                  );
                }

                return (
                  <Button key={index} asChild variant="outline" className={`h-auto min-h-16 justify-start whitespace-normal rounded-xl px-4 py-4 text-left text-base ${greenOutlineClassName}`}>
                    <Link href={feature.href}>
                      {ButtonContent}
                    </Link>
                  </Button>
                );
              })}
            </div>

          </div>
          <div id="garden-demo" className="min-w-0 scroll-mt-16"><GardenHero /></div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="threed-workspace-panel threed-presentation-surface border-b py-6">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold mb-1">Tech Stack</h2>
            <div className="w-8 h-0.5 bg-gradient-to-r from-green-800 to-emerald-600 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <a key={tech.name} href={tech.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-cyan-700/15 bg-cyan-500/5 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-cyan-500/15 hover:text-foreground dark:border-cyan-400/20">
                <span>{tech.name}</span>
                <span className="text-xs opacity-50">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Explore ThreeD Garden</h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-green-800 to-emerald-600 mx-auto" />
          </div>
          <p className="mb-8 text-center text-base text-muted-foreground">Choose where you want to go. Create, listen, explore or see how it works.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="threed-workspace-panel threed-presentation-surface flex flex-col rounded-2xl border p-6 sm:p-7">
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl border text-3xl ${feature.color}`}>{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                {feature.external ? (
                  <Button asChild variant="outline" className={`mt-auto min-h-12 w-full rounded-xl px-5 py-3 text-base ${greenOutlineClassName}`}><a href={feature.href} target="_blank" rel="noopener noreferrer">Explore <span>↗</span></a></Button>
                ) : (
                  <Button asChild variant="outline" className={`mt-auto min-h-12 w-full rounded-xl px-5 py-3 text-base ${greenOutlineClassName}`}><Link href={feature.href}>Explore <span>→</span></Link></Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About + Stats */}
      <div className="py-8">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">About ThreeD Garden</h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-green-800 to-emerald-600 mx-auto md:mx-0 mb-4" />
              <p className="leading-relaxed text-muted-foreground">Create interactive gardens with 3D models, characters, physics, and maps. Bring your projects to life in a shared workspace for nature, technology, and creativity.</p>
            </div>
            <div className="threed-workspace-panel threed-presentation-surface space-y-3 rounded-xl border p-6"><h3 className="font-semibold">Open source, ready to explore</h3><p className="text-sm leading-relaxed text-muted-foreground">ThreeD Garden is available under the MIT License. Explore the source, follow a guide, or start a Project of your own.</p><a className="text-sm text-emerald-800 underline underline-offset-4 hover:text-emerald-950 dark:text-emerald-200 dark:hover:text-emerald-100" href="https://github.com/marty-mcgee/threed-garden">View the ThreeD Garden repository</a></div>
          </div>
        </div>
      </div>

      {/* Featured Music Player Section */}
      {selectedAlbum && currentTrack && !loading && (
        <div className="threed-presentation-surface border-y py-8">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="text-center mb-4">
              <div className="mb-2 inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-800 dark:text-violet-200">
                🎵 Featured Release
              </div>
              <h2 className="mb-1 text-2xl font-bold text-foreground">{selectedAlbum.title}</h2>
              <p className="text-sm text-muted-foreground">{selectedAlbum.artist}</p>
            </div>
            <MultimediaPlayer
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
        <div className="threed-workspace-panel threed-presentation-surface border-y py-8">
          <div className="mx-auto w-full max-w-7xl px-6 text-center">
            <div className="animate-pulse motion-reduce:animate-none">
              <div className="mx-auto mb-2 h-8 w-48 rounded bg-foreground/10"></div>
              <div className="mx-auto h-4 w-64 rounded bg-foreground/10"></div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="threed-workspace-panel threed-presentation-surface threed-presentation-featured border-y py-10">
        <div className="mx-auto w-full max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to Explore More?</h2>
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">Explore the 3D garden, discover the music library, or check out live traffic.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="success" className={largeActionClassName}><Link href="/dashboard/multimedia"><span>🎵</span>Full Library</Link></Button>
            <Button asChild variant="outline" className={`${largeActionClassName} ${greenOutlineClassName}`}><a href="https://github.com/marty-mcgee/threed-garden" target="_blank" rel="noopener noreferrer"><span>🐙</span>GitHub</a></Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background/40 py-5">
        <div className="mx-auto w-full max-w-7xl px-6 text-center text-xs text-muted-foreground">
          <p>ThreeD Garden · © 2026 Marty McGee. Built with Next.js, Neon, and 💚.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
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
