// src/app/dashboard/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  Sun, Moon, Sprout, Carrot, Settings, Radio, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NavDropdown from '@/components/navigation/NavDropdown';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md sticky top-0 z-10 py-0.5 border-b">
        <div className="w-full px-0 sm:px-1 lg:px-2 py-0.5">
          <div className="flex items-center justify-between">

            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-green-600 flex items-center justify-center shadow-lg">
                <Carrot className="w-5 h-5 text-orange-0" />
              </div>
              <div>
                <Link href="/" className="text-sm hover:text-primary">
                  <h1 className="text-xl font-bold text-foreground">
                    ThreeD Garden
                  </h1>
                </Link>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  3D Farming • Real-time Incidents • Audio
                </p>
              </div>
            </div>
            
            {/* Surface Switcher */}
            <div className="hidden sm:flex items-center gap-1 border rounded-lg p-0.5">
              <Button
                variant={pathname?.startsWith('/dashboard') ? 'secondary' : 'ghost'}
                size="sm"
                className={`h-7 px-3 text-xs ${pathname?.startsWith('/dashboard') ? '' : 'text-muted-foreground'}`}
                asChild
              >
                <Link href="/dashboard">
                  <Radio className="w-3.5 h-3.5 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant={pathname?.startsWith('/admin') ? 'secondary' : 'ghost'}
                size="sm"
                className={`h-7 px-3 text-xs ${pathname?.startsWith('/admin') ? '' : 'text-muted-foreground'}`}
                asChild
              >
                <Link href="/admin">
                  <Settings className="w-3.5 h-3.5 mr-1" />
                  Admin
                </Link>
              </Button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-0.5">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 mr-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">All Systems Live</span>
              </div>

              {/* Navigation Dropdown */}
              <NavDropdown />
              
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3 h-3 text-yellow-500" />
                ) : (
                  <Moon className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full px-0 md:px-0.5 lg:px-1 py-0">
        {/* Page Content */}
        <div className="bg-background/50 backdrop-blur-sm">
          {children}
        </div>
        
        {/* Footer */}
        {/* <footer className="py-1.5 text-center text-xs text-muted-foreground">
          <p className="">
            Built by Marty McGee with Next.js, Neon, Postgres, Drizzle ORM, shadcn/ui, Three.js, R3F Fiber + Drei
            @ <a href="https://github.com/marty-mcgee/marty-mcgee-neon" target="_blank">github</a>
          </p>
        </footer> */}
      </div>
    </div>
  );
}