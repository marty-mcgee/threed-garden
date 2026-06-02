// src/app/dashboard/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  Flame, Activity, Sun, Moon, MapPin, AlertTriangle, BarChart3, Radio, Car, Carrot, ScanEye,
  Gauge, TrendingUp, Droplets, Sprout, Box, Leaf, Apple, Cpu, Calendar, Image, BedDouble
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

// Traffic Services Tabs
const trafficTabs = [
  { path: '/dashboard', name: 'Overview', icon: MapPin, color: 'blue' },
  { path: '/dashboard/chp-live', name: 'CHP Live', icon: AlertTriangle, color: 'red' },
  { path: '/dashboard/511org', name: 'Bay Area 511', icon: Radio, color: 'emerald' },
  { path: '/dashboard/caltrans', name: 'Caltrans', icon: Car, color: 'blue' },
  { path: '/dashboard/calfire', name: 'CalFire', icon: Flame, color: 'orange' },
  { path: '/dashboard/chp-historical', name: 'CHP Historical', icon: BarChart3, color: 'purple' },
];

// ThreeD Garden Tabs
const gardenTabs = [
  { path: '/dashboard/threed', name: 'Dashboard', icon: ScanEye, color: 'green' },
  { path: '/dashboard/threed/plants', name: 'Plants', icon: Leaf, color: 'green' },
  { path: '/dashboard/threed/models', name: 'Models', icon: Box, color: 'yellow' },
  { path: '/dashboard/threed/characters', name: 'Characters', icon: Box, color: 'cyan' },
  { path: '/dashboard/threed/beds', name: 'Beds', icon: BedDouble, color: 'blue' },
  { path: '/dashboard/threed/plantings', name: 'Plantings', icon: Sprout, color: 'emerald' },
  { path: '/dashboard/threed/tasks', name: 'Tasks', icon: Calendar, color: 'orange' },
  { path: '/dashboard/threed/harvests', name: 'Harvests', icon: Apple, color: 'red' },
  { path: '/dashboard/threed/weather', name: 'Weather', icon: Droplets, color: 'cyan' },
  { path: '/dashboard/threed/farmbots', name: 'FarmBots', icon: Cpu, color: 'purple' },
  { path: '/dashboard/threed/garden/analytics', name: 'Analytics', icon: TrendingUp, color: 'amber' },
];

const getTabColor = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400',
    red: 'data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-950/30 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400',
    emerald: 'data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400',
    orange: 'data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/30 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400',
    purple: 'data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-950/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400',
    green: 'data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400',
    cyan: 'data-[state=active]:bg-cyan-50 dark:data-[state=active]:bg-cyan-950/30 data-[state=active]:text-cyan-700 dark:data-[state=active]:text-cyan-400',
    amber: 'data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/30 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400',
    yellow: 'data-[state=active]:bg-yellow-50 dark:data-[state=active]:bg-yellow-950/30 data-[state=active]:text-yellow-700 dark:data-[state=active]:text-yellow-400',
  };
  return colors[color] || colors.blue;
};

// Tab Group Component
function TabGroup({ tabs, currentPath, title, icon: Icon }: { 
  tabs: typeof trafficTabs; 
  currentPath: string; 
  title: string;
  icon: React.ElementType;
}) {
  const isActive = tabs.some(tab => currentPath === tab.path || currentPath.startsWith(tab.path + '/'));
  
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.path}
            value={tab.path}
            asChild
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              text-muted-foreground hover:text-foreground hover:bg-muted
              data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border
              ${getTabColor(tab.color)}
            `}
          >
            <Link href={tab.path} className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.name}</span>
              {currentPath === tab.path && (
                <span className="w-1.5 h-1.5 rounded-full bg-current ml-1" />
              )}
            </Link>
          </Tabs.Trigger>
        ))}
      </div>
    </div>
  );
}

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

  // Determine active tab for root selection
  const isTrafficActive = trafficTabs.some(tab => pathname === tab.path || pathname.startsWith(tab.path + '/'));
  const isGardenActive = gardenTabs.some(tab => pathname === tab.path || pathname.startsWith(tab.path + '/'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <Carrot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  ThreeD Garden
                </h1>
                <p className="text-xs text-muted-foreground">
                  Smart Garden Management • Real-time Traffic • FarmBot Integration
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <Tabs.Root value={pathname} className="mb-6">
          <Tabs.List className="flex flex-col space-y-4">
            {/* Traffic Services Section */}
            {/* <TabGroup 
              tabs={trafficTabs} 
              currentPath={pathname} 
              title="Traffic Services" 
              icon={Activity}
            /> */}
            
            {/* ThreeD Garden Section */}
            <TabGroup 
              tabs={gardenTabs} 
              currentPath={pathname} 
              // title="ThreeD Garden" 
              title="" 
              icon={Carrot}
            />
          </Tabs.List>
        </Tabs.Root>

        {/* Page Content */}
        <div className="rounded-2xl bg-background/50 backdrop-blur-sm border shadow-sm">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="mt-8 py-4 text-center text-xs text-muted-foreground border-t">
          <p>
            🌱 ThreeD Garden • 🚗 Traffic Monitor • 🤖 FarmBot Integration
          </p>
          <p className="mt-1">
            {/* Data sources: Caltrans, 511.org, CHP, CalFire, OpenWeatherMap, FarmBot API */}
            Data sources: OpenWeatherMap, FarmBot API
          </p>
          <p className="mt-1">
            Built with Next.js, Neon Postgres, Drizzle ORM, shadcn/ui, Three.js, R3Fiber
          </p>
        </footer>
      </div>
    </div>
  );
}