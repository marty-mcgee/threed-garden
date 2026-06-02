// import { AdminMusicManager } from '@/components/music/AdminMusicManager';

// export default function AdminMusicPage() {
//   return (
//     <div className="container mx-auto p-6">
//       <AdminMusicManager />
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Album, Link as LinkIcon, PlayCircle, TrendingUp, Users } from 'lucide-react';

interface Stats {
  totalAlbums: number;
  totalTracks: number;
  totalLinks: number;
  totalPlayCount: number;
  publishedAlbums: number;
  activeTracks: number;
  activeLinks: number;
  recentUploads: number;
}

export default function AdminMusicDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/music?action=stats');
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

  const statCards = [
    {
      title: 'Total Albums',
      value: stats?.totalAlbums || 0,
      subtitle: `${stats?.publishedAlbums || 0} published`,
      icon: Album,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Tracks',
      value: stats?.totalTracks || 0,
      subtitle: `${stats?.activeTracks || 0} active`,
      icon: Music,
      color: 'bg-green-500',
    },
    {
      title: 'Total Links',
      value: stats?.totalLinks || 0,
      subtitle: `${stats?.activeLinks || 0} active`,
      icon: LinkIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Plays',
      value: stats?.totalPlayCount?.toLocaleString() || 0,
      subtitle: 'All time',
      icon: PlayCircle,
      color: 'bg-orange-500',
    },
  ];

  const recentActivity = [
    { action: 'Album Published', item: 'Midnight Dreams', time: '2 hours ago' },
    { action: 'Track Added', item: 'Urban Echoes - Track 5', time: '5 hours ago' },
    { action: 'Link Created', item: 'Spotify Profile', time: '1 day ago' },
    { action: 'Album Updated', item: 'Acoustic Sessions', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your music library, tracks, and links</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.item}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/dashboard/music/admin/albums/new">
                <Album className="h-4 w-4 mr-2" />
                Create New Album
              </Link>
            </Button>
            <Button className="w-full justify-start" asChild variant="outline">
              <Link href="/dashboard/music/admin/tracks/new">
                <Music className="h-4 w-4 mr-2" />
                Add New Track
              </Link>
            </Button>
            <Button className="w-full justify-start" asChild variant="outline">
              <Link href="/dashboard/music/admin/links/new">
                <LinkIcon className="h-4 w-4 mr-2" />
                Add New Link
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}