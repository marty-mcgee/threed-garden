'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Album, 
  Music, 
  Link as LinkIcon,
  BarChart3,
  Settings,
  Headphones,
  Heart,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const navigationItems = [
  {
    name: 'Overview',
    href: '/dashboard/music',
    icon: LayoutDashboard,
  },
  {
    name: 'Library',
    href: '/dashboard/music/library',
    icon: Album,
  },
  {
    name: 'Now Playing',
    href: '/dashboard/music/now-playing',
    icon: Headphones,
  },
  {
    name: 'Favorites',
    href: '/dashboard/music/favorites',
    icon: Heart,
  },
  {
    name: 'Recently Played',
    href: '/dashboard/music/recent',
    icon: History,
  },
  {
    name: 'Links',
    href: '/dashboard/music/links',
    icon: LinkIcon,
  },
];

const adminItems = [
  {
    name: 'Manage Albums',
    href: '/dashboard/music/admin/albums',
    icon: Album,
  },
  {
    name: 'Manage Tracks',
    href: '/dashboard/music/admin/tracks',
    icon: Music,
  },
  {
    name: 'Manage Links',
    href: '/dashboard/music/admin/links',
    icon: LinkIcon,
  },
  {
    name: 'Analytics',
    href: '/dashboard/music/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/dashboard/music/admin/settings',
    icon: Settings,
  },
];

export default function MusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAdmin] = useState(pathname?.includes('/admin'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r sticky top-0 h-screen flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Music Studio
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Your personal music library</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              <div className="space-y-6">
                {/* Main Navigation */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                    Main
                  </h3>
                  <nav className="space-y-1">
                    {navigationItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                            isActive 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Admin Section */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                    Administration
                  </h3>
                  <nav className="space-y-1">
                    {adminItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                            isActive 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="container mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}