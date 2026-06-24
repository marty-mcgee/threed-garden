// src/app/dashboard/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  Sun, Moon, Radio
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
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-green-600 flex items-center justify-center shadow-lg">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <Link href="/" className="text-sm hover:text-primary">
                  <h1 className="text-xl font-bold text-foreground">
                    Marty McGee
                  </h1>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Track Dragon: Music Library • Real-time Traffic • ThreeD Integration
                </p>
              </div>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">All Systems Live</span>
              </div>
              
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>

              {/* Navigation Dropdown */}
              <NavDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Page Content */}
        <div className="rounded-2xl bg-background/50 backdrop-blur-sm">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="mt-8 py-4 text-center text-xs text-muted-foreground border-t">
          <p className="mt-1">
            Built by Marty McGee with Next.js, Neon, Postgres, Drizzle ORM, shadcn/ui, Three.js, R3Fiber
          </p>
        </footer>
      </div>
    </div>
  );
}