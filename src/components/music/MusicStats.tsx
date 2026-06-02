'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Headphones, Link as LinkIcon, Database, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicStatsProps {
  stats: {
    totalAlbums: number;
    totalTracks: number;
    totalLinks: number;
    totalPlayCount: number;
    publishedAlbums: number;
    activeTracks: number;
    activeLinks: number;
    recentUploads: number;
    storageUsed: string;
    lastPollTime: Date | null;
  } | null;
  loading?: boolean;
}

const statCards = [
  {
    title: 'Total Albums',
    key: 'totalAlbums',
    icon: Music,
    gradient: 'from-blue-500 to-cyan-500',
    subtitle: (stats: any) => `${stats?.publishedAlbums || 0} published`,
  },
  {
    title: 'Total Tracks',
    key: 'totalTracks',
    icon: Headphones,
    gradient: 'from-purple-500 to-pink-500',
    subtitle: (stats: any) => `${stats?.activeTracks || 0} active`,
  },
  {
    title: 'Total Plays',
    key: 'totalPlayCount',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-500',
    subtitle: () => 'All time',
    format: (value: number) => value.toLocaleString(),
  },
  {
    title: 'Storage Used',
    key: 'storageUsed',
    icon: Database,
    gradient: 'from-orange-500 to-red-500',
    subtitle: (stats: any) => `${stats?.recentUploads || 0} recent uploads`,
  },
];

export function MusicStats({ stats, loading }: MusicStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats?.[card.key as keyof typeof stats];
        const formattedValue = card.format && typeof value === 'number' 
          ? card.format(value) 
          : value;
        
        return (
          <Card key={card.title} className="relative overflow-hidden group">
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
              card.gradient,
              "group-hover:opacity-5"
            )} />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{formattedValue || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle(stats)}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-full bg-gradient-to-br",
                  card.gradient
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Last Poll Time Card */}
      {stats?.lastPollTime && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">
                  {new Date(stats.lastPollTime).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}