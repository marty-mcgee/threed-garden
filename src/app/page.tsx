'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Code2, 
  Database, 
  ArrowRight,
  Play,
  Github,
  ExternalLink,
  Leaf,
  Radio,
  Palette,
  Heart,
  CodeXml
} from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [activeSkill, setActiveSkill] = useState(0);

  const skills = [
    { icon: Music, title: "Musician", description: "Creating immersive sonic experiences" },
    { icon: Code2, title: "Developer", description: "Full-stack Next.js applications" },
    { icon: Palette, title: "3D Designer", description: "Interactive Three.js gardens" },
    { icon: Leaf, title: "Gardener", description: "Smart garden automation with FarmBot" },
    { icon: Radio, title: "Broadcaster", description: "Local news and traffic updates" },
    { icon: Database, title: "Data Engineer", description: "Real-time data pipelines" },
  ];

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveSkill((prev) => (prev + 1) % skills.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [skills.length]);

  const features = [
    {
      icon: Music,
      title: "Music Streaming",
      description: "Full-featured music player with waveform visualization",
      href: "/dashboard/music",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Leaf,
      title: "ThreeD Garden",
      description: "Interactive 3D garden with FarmBot integration",
      href: "/dashboard/threed",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Radio,
      title: "Traffic Monitor",
      description: "Real-time CHP, Caltrans, and wildfire tracking",
      href: "/dashboard",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: CodeXml,
      title: "Full-Stack Platform",
      description: "Next.js 15, Neon, Drizzle, TypeScript, Three.js, R3F",
      href: "https://github.com/marty-mcgee/marty-mcgee-neon",
      color: "from-gray-500 to-gray-700",
      external: true
    },
  ];

  const stats = [
    { value: "10+", label: "Albums", icon: Music },
    { value: "50+", label: "Tracks", icon: Heart },
    { value: "5", label: "APIs", icon: Database },
    { value: "24/7", label: "Live", icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      
      {/* Hero Section - Compact */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-6 py-12 lg:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-3 bg-white/20 text-white border-none backdrop-blur-sm text-sm">
              🎵 Full-Stack Creator
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              Marty McGee
            </h1>
            <p className="text-lg lg:text-xl mb-6 text-blue-100">
              Musician • Developer • 3D Artist • Gardener • Broadcaster
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="default" className="bg-white text-gray-900 hover:bg-gray-100">
                <Link href="/dashboard/music">
                  <Music className="mr-2 h-4 w-4" />
                  Listen to Music
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link href="/dashboard">
                  <Radio className="mr-2 h-4 w-4" />
                  Live Traffic
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link href="/dashboard/threed">
                  <Leaf className="mr-2 h-4 w-4" />
                  3D Garden
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack - Compact */}
      <section className="py-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold mb-1">Tech Stack</h2>
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "Next.js 15", icon: "▲" },
              { name: "TypeScript", icon: "TS" },
              { name: "Neon", icon: "🐘" },
              { name: "Drizzle", icon: "💧" },
              { name: "Three.js", icon: "🎨" },
              { name: "Tailwind", icon: "🎨" },
              { name: "AWS S3", icon: "☁️" },
              { name: "Vercel", icon: "▲" },
            ].map((tech) => (
              <Badge key={tech.name} variant="secondary" className="text-xs">
                {tech.icon} {tech.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* About + Rotating Card - Compact 2-column layout */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">About Marty</h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto md:mx-0 mb-4" />
              <p className="text-muted-foreground">
                Multidisciplinary creator building immersive digital experiences that blend 
                music, technology, and nature.
              </p>
            </div>
            
            {/* Rotating Skills Card - Only render after mount */}
            {mounted && (
              <div>
                <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none shadow-lg">
                  <CardContent className="p-4 text-center">
                    <div className="mb-2">
                      {(() => {
                        const SkillIcon = skills[activeSkill].icon;
                        return <SkillIcon className="h-8 w-8 mx-auto text-purple-400" />;
                      })()}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{skills[activeSkill].title}</h3>
                    <p className="text-gray-300 text-sm">{skills[activeSkill].description}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section - Compact */}
      <section className="py-6 border-b">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid - 4 compact cards */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">What I Build</h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} p-2 mb-3 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs mb-3">{feature.description}</p>
                    <Button variant="ghost" size="sm" className="gap-1 px-0 h-7 text-xs" asChild>
                      {feature.external ? (
                        <a href={feature.href} target="_blank" rel="noopener noreferrer">
                          Explore <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Link href={feature.href}>
                          Explore <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Music Spotlight - Compact */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-2 text-xs">🎵 Latest Release</Badge>
              <h2 className="text-2xl font-bold mb-2">Featured Album</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Electronic, ambient, and acoustic elements. Available now for streaming.
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/music">
                  <Play className="mr-2 h-3 w-3" />
                  Listen Now
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 max-w-[200px] mx-auto">
                <img 
                  src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop"
                  alt="Featured Album"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Compact */}
      <section className="py-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to Explore?</h2>
          <p className="text-sm mb-4 text-blue-100">
            Dive into my music, explore the 3D garden, or check out live traffic.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard/music">
                <Music className="mr-2 h-4 w-4" />
                Start Listening
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white text-white hover:bg-white/20">
              <a href="https://github.com/marty-mcgee" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-4 border-t">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
          <p>© 2026 Marty McGee. Built with Next.js, Neon, and 💜.</p>
          <div className="flex justify-center gap-3 mt-1">
            <Link href="/dashboard/music" className="hover:text-foreground">Music</Link>
            <Link href="/dashboard/threed" className="hover:text-foreground">3D Garden</Link>
            <Link href="/dashboard" className="hover:text-foreground">Traffic</Link>
            <a href="https://github.com/marty-mcgee" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}