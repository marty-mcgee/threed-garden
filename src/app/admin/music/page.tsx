'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Album, 
  Link as LinkIcon, 
  PlayCircle, 
  TrendingUp, 
  Clock,
  Headphones,
  Activity,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminStats {
  albums: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  tracks: {
    total: number;
    totalPlays: number;
    avgDuration: number;
  };
  links: {
    total: number;
    active: number;
  };
  listeningHours: number;
  recentActivity: Array<{
    trackTitle: string;
    albumTitle: string;
    playedAt: string;
    completed: boolean;
    playDuration: number;
  }>;
  topTracks: Array<{
    id: number;
    title: string;
    playCount: number;
    albumTitle: string;
  }>;
}

export default function AdminMusicDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/music/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Albums',
      value: stats?.albums.total || 0,
      subtitle: `${stats?.albums.published || 0} published, ${stats?.albums.draft || 0} draft`,
      icon: Album,
      color: 'bg-blue-500',
      link: '/dashboard/music/admin/albums',
    },
    {
      title: 'Total Tracks',
      value: stats?.tracks.total || 0,
      subtitle: `${stats?.tracks.totalPlays?.toLocaleString() || 0} total plays`,
      icon: Music,
      color: 'bg-green-500',
      link: '/dashboard/music/admin/tracks',
    },
    {
      title: 'Total Links',
      value: stats?.links.total || 0,
      subtitle: `${stats?.links.active || 0} active links`,
      icon: LinkIcon,
      color: 'bg-purple-500',
      link: '/dashboard/music/admin/links',
    },
    {
      title: 'Listening Time',
      value: `${stats?.listeningHours || 0} hrs`,
      subtitle: 'Total listening time',
      icon: Headphones,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time music library statistics and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={stat.link ? "hover:shadow-lg transition-all cursor-pointer" : ""}>
              <Link href={stat.link || '#'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Top Tracks */}
      {stats?.topTracks && stats.topTracks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Played Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topTracks.map((track, index) => (
                <div key={track.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{track.title}</p>
                      <p className="text-xs text-muted-foreground">{track.albumTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{track.playCount} plays</Badge>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/music/admin/tracks?trackId=${track.id}`}>
                        <PlayCircle className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Listening Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{activity.trackTitle}</p>
                      <Badge variant={activity.completed ? "default" : "secondary"} className="text-xs">
                        {activity.completed ? 'Completed' : 'Partial'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.albumTitle}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(activity.playedAt)}
                      </span>
                      {activity.playDuration && (
                        <span className="text-xs text-muted-foreground">
                          Listened: {formatDuration(activity.playDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No listening activity yet</p>
              <p className="text-sm mt-1">Play some music to see activity here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button asChild className="justify-start">
              <Link href="/dashboard/music/admin/albums/new">
                <Album className="h-4 w-4 mr-2" />
                Create New Album
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/music/admin/tracks/new">
                <Music className="h-4 w-4 mr-2" />
                Add New Track
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/music/admin/links/new">
                <LinkIcon className="h-4 w-4 mr-2" />
                Add New Link
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Independent Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Your Music Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button variant="outline" className="justify-start gap-2" asChild>
              <a href="https://spotify.com" target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.36-.78.48-1.14.24-3.12-1.86-7.02-2.28-11.58-1.26-.48.12-.9-.18-1.02-.66-.12-.48.18-.9.66-1.02 4.98-1.14 9.36-.72 12.9 1.38.36.24.48.78.18 1.32zm1.44-3.3c-.3.42-.96.6-1.38.3-3.6-2.16-9.06-2.76-13.32-1.5-.54.18-1.08-.12-1.26-.66-.18-.54.12-1.08.66-1.26 4.86-1.44 10.86-.84 14.94 1.56.42.24.6.9.36 1.56zm.12-3.42c-4.32-2.52-11.28-2.76-15.36-1.5-.66.18-1.32-.24-1.5-.9-.18-.66.24-1.32.9-1.5 4.62-1.44 12.24-1.14 17.16 1.68.6.36.78 1.14.42 1.74-.3.48-1.02.66-1.62.48z"/>
                </svg>
                Spotify
              </a>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44 0 .796.645 1.44 1.441 1.44.795 0 1.439-.645 1.439-1.44 0-.795-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
            </Button>
            <Button variant="outline" className="justify-start gap-2" asChild>
              <a href="https://bandcamp.com" target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 0v24h24V0H0zm4.8 5.2h14.4v2.4H4.8V5.2zm0 4.8h14.4v2.4H4.8v-2.4zm0 4.8h14.4v2.4H4.8v-2.4zm0 4.8h14.4v2.4H4.8v-2.4z"/>
                </svg>
                Bandcamp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}