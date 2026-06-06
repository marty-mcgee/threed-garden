'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Album, 
  Music, 
  Link as LinkIcon,
  BarChart3,
  Settings,
  ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard/music/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Albums',
    href: '/dashboard/music/admin/albums',
    icon: Album,
  },
  {
    name: 'Tracks',
    href: '/dashboard/music/admin/tracks',
    icon: Music,
  },
  {
    name: 'Links',
    href: '/dashboard/music/admin/links',
    icon: LinkIcon,
  },
  {
    name: 'Media',  // Add this
    href: '/dashboard/music/admin/media',
    icon: ImageIcon, // You'll need to import this
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

export default function AdminMusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r min-h-screen sticky top-0">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Music Admin</h2>
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}