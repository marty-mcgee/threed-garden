import Link from 'next/link';

export default function HomePage() {
  const features = [
    {
      icon: "🎵",
      title: "Music Streaming",
      description: "Full-featured music player with waveform visualization",
      href: "/dashboard/music",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: "🌱",
      title: "ThreeD Garden",
      description: "Interactive 3D garden with FarmBot integration",
      href: "/dashboard/threed",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: "📻",
      title: "Traffic Monitor",
      description: "Real-time CHP, Caltrans, and wildfire tracking",
      href: "/dashboard",
      color: "from-blue-500 to-cyan-500",
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
    { value: "10+", label: "Albums", icon: "🎵" },
    { value: "50+", label: "Tracks", icon: "❤️" },
    { value: "5", label: "APIs", icon: "🗄️" },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-6 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/20 px-3 py-1 text-sm backdrop-blur-sm mb-3">
              🎵 Full-Stack Creator
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              Marty McGee
            </h1>
            <p className="text-lg lg:text-xl mb-6 text-blue-100">
              Musician • Developer • 3D Artist • Gardener • Broadcaster
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/dashboard/music"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 h-10 px-4 py-2 transition-colors"
              >
                <span className="mr-2">🎵</span>
                Listen to Music
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-white text-white hover:bg-white/20 h-10 px-4 py-2 transition-colors"
              >
                <span className="mr-2">📻</span>
                Live Traffic
              </Link>
              <Link
                href="/dashboard/threed"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-white text-white hover:bg-white/20 h-10 px-4 py-2 transition-colors"
              >
                <span className="mr-2">🌱</span>
                ThreeD Garden
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="py-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold mb-1">Tech Stack</h2>
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <a
                key={tech.name}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md"
              >
                <span>{tech.name}</span>
                <span className="text-xs opacity-50">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* About + Stats Row */}
      <div className="py-8">
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
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-muted-foreground text-xs mb-3">{feature.description}</p>
                {feature.external ? (
                  <a
                    href={feature.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Explore <span>↗</span>
                  </a>
                ) : (
                  <Link
                    href={feature.href}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Explore <span>→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Music Spotlight */}
      <div className="py-8">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-2 bg-secondary text-secondary-foreground">
                🎵 Latest Release
              </div>
              <h2 className="text-2xl font-bold mb-2">Featured Album</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Electronic, ambient, and acoustic elements. Available now for streaming.
              </p>
              <Link
                href="/dashboard/music"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 transition-colors"
              >
                <span className="mr-2">▶</span>
                Listen Now
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 max-w-[200px] mx-auto flex items-center justify-center">
                <span className="text-6xl opacity-50">🎵</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to Explore?</h2>
          <p className="text-sm mb-4 text-blue-100">
            Dive into my music, explore the 3D garden, or check out live traffic.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard/music"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 h-9 px-4 py-2 transition-colors"
            >
              <span className="mr-2">🎵</span>
              Start Listening
            </Link>
            <a
              href="https://github.com/marty-mcgee"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-white text-white hover:bg-white/20 h-9 px-4 py-2 transition-colors"
            >
              <span className="mr-2">🐙</span>
              GitHub
            </a>
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