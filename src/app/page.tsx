'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import GardenHero from '@/components/home/GardenHero';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { MultimediaPlayer } from '@/components/multimedia/MultimediaPlayer';
import { AlbumLyrics } from '@/components/multimedia/AlbumLyrics';
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

  const features = [
    {
      moduleKey: 'threed',
      title: 'ThreeD',
      description: 'Explore spaces through linked plans and 3D Scenes, with Models, Characters and garden layouts.',
      href: '/dashboard',
      action: 'Browse Projects',
      detail: 'Discover Projects available to you.',
    },
    {
      moduleKey: 'multimedia',
      title: 'Multimedia',
      description: 'Find an Album, choose a Track and enjoy music, video and lyrics in one place.',
      href: '/dashboard/multimedia',
      action: 'Explore Multimedia',
      detail: 'Browse published Albums and available media.',
    },
    {
      moduleKey: 'traffic',
      title: 'Traffic',
      description: 'Explore maps and reports from CHP, Caltrans, CalFire and Bay Area 511.',
      href: '/dashboard/traffic',
      action: 'Explore Traffic',
      detail: 'Coverage and updates depend on each provider.',
    },
    {
      moduleKey: 'learn',
      title: 'Learn',
      description: 'Get to know the App with task-based guides for Projects, Design, Models and more.',
      href: '/learn',
      action: 'Find a guide',
      detail: 'Read public guides at your own pace.',
    },
  ] as const;

  const techStack = [
    {
      name: 'TypeScript',
      url: 'https://www.typescriptlang.org',
    },
    {
      name: 'React',
      url: 'https://react.org',
    },
    {
      name: 'Next.js',
      url: 'https://nextjs.org',
    },
    {
      name: 'Three.js',
      url: 'https://threejs.org',
    },
    {
      name: 'React-Three',
      url: 'https://r3f.docs.pmnd.rs/next',
    },
    {
      name: 'Postgres',
      url: 'https://www.postgresql.org/about',
    },
    {
      name: 'Neon',
      url: 'https://neon.tech',
    },
    {
      name: 'Drizzle ORM',
      url: 'https://orm.drizzle.team',
    },
    {
      name: 'AWS S3',
      url: 'https://aws.amazon.com/s3',
    },
    {
      name: 'Vercel',
      url: 'https://vercel.com',
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="threed-presentation min-h-screen">
      <AppHeader surface="dashboard" />
      <main>
        <section aria-labelledby="home-title" className="threed-presentation-surface threed-presentation-featured overflow-hidden border-b">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-14 lg:py-20">
            <div className="min-w-0">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[.16em] text-emerald-800 dark:text-emerald-200">ThreeD Garden &middot; An open-source workspace</p>
              <h1 id="home-title" className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">Plan your space.<br /><span className="text-emerald-800 dark:text-emerald-200">Build your world.</span></h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground/85">Explore garden layouts, architectural ideas and interactive Scenes in ThreeD App.</p>
              <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">Start with a look around. Rotate the garden preview, discover public Projects or follow a guide to see what you can create.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="success" className={largeActionClassName}><a href="#garden-demo">Explore a Demo<ArrowRight aria-hidden="true" /></a></Button>
                <Button asChild variant="outline" className={largeActionClassName + ' ' + greenOutlineClassName}><Link href="/learn">Learn ThreeD</Link></Button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">No account needed for this illustrative garden preview. Creating and saving your own Projects requires sign-in.</p>
            </div>
            <div id="garden-demo" tabIndex={-1} className="min-w-0 scroll-mt-20 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500"><GardenHero /></div>
          </div>
        </section>
        <section aria-labelledby="explore-title" className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Four ways to explore</p>
            <h2 id="explore-title" className="text-3xl font-bold tracking-tight sm:text-4xl">Where will your curiosity take you?</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">Plan a space, discover media, explore a map or learn something new. Choose a place to begin.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(feature => (
              <article key={feature.moduleKey} className="threed-presentation-surface flex min-w-0 flex-col rounded-2xl border p-6">
                <ModuleIcon moduleKey={feature.moduleKey} className="mb-6 size-8" />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mb-5 mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <p className="mb-5 mt-auto text-xs leading-relaxed text-muted-foreground">{feature.detail}</p>
                <Button asChild variant="outline" className="h-auto min-h-12 justify-between gap-2 whitespace-normal rounded-xl px-4 py-3 text-left"><Link href={feature.href}>{feature.action}<ArrowRight aria-hidden="true" className="size-4 shrink-0" /></Link></Button>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">Guests can explore public content. Private Projects and editing tools remain available only to authorized accounts.</p>
        </section>
        <section aria-labelledby="home-possibilities" className="mx-auto grid max-w-7xl gap-6 border-t px-6 py-10 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <h2 id="home-possibilities" className="text-2xl font-semibold tracking-tight sm:text-3xl">From a first idea to a space you can explore.</h2>
          <p className="text-base leading-relaxed text-muted-foreground">Bring editable plans, reusable Models, maps and Multimedia together in a Project. Explore a garden arrangement, explain an architectural concept or bring a Scene to life with supported Characters and Actions. Learn guides help you take the next step.</p>
        </section>
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
              lyricsPanel={<AlbumLyrics albumId={selectedAlbum.id} albumTitle={selectedAlbum.title} />}
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


        <section aria-labelledby="home-developers" className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-6 border-t pt-10">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">For developers and curious minds</p>
              <h2 id="home-developers" className="text-2xl font-semibold tracking-tight">Open source. Open to your ideas.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Explore how ThreeD App works, read the documentation and build on the code. Application code is MIT-licensed; third-party assets may have their own terms.</p>
            </div>
            <Button asChild variant="outline" className="min-h-12 rounded-xl"><a href="https://github.com/marty-mcgee/threed-garden" target="_blank" rel="noopener noreferrer">Explore on GitHub<span aria-hidden="true">&nearr;</span></a></Button>
          </div>
          <div aria-label="Built with" className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {techStack.map(tech => <a key={tech.name} href={tech.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{tech.name}</a>)}
          </div>
        </section>
        <section aria-labelledby="home-next" className="threed-presentation-surface threed-presentation-featured border-y px-6 py-12 text-center sm:py-16">
          <h2 id="home-next" className="text-3xl font-bold tracking-tight">Your next idea starts with a little exploring.</h2>
          <p className="mx-auto mb-6 mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">Try the garden preview or find a guide. Sign in when you are ready to create and save your own Projects.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="success" className={largeActionClassName}><a href="#garden-demo">Explore a Demo<ArrowRight aria-hidden="true" /></a></Button>
            <Button asChild variant="outline" className={largeActionClassName}><Link href="/learn">Learn ThreeD</Link></Button>
          </div>
          <Link href="/auth/sign-in" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Sign in to your account</Link>
        </section>
      </main>
      <footer className="bg-background/40 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>ThreeD Garden &copy; 2026 Marty McGee</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
            {features.map(feature => <Link key={feature.moduleKey} href={feature.href} className="inline-flex min-h-11 items-center hover:text-foreground">{feature.title}</Link>)}
            <a href="https://github.com/marty-mcgee/threed-garden" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:text-foreground">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
