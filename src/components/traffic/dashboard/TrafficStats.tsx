// components/traffic/dashboard/TrafficStats.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Car, MapPin } from 'lucide-react';

interface TrafficStatsProps {
  userId: string;
}

interface Stats {
  totalIncidents: number;
  activeIncidents: number;
  clearedIncidents: number;
  totalCases: number;
  activeClosures: number;
  totalEvents: number;
}

export function TrafficStats({ userId }: TrafficStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/traffic/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching traffic stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Active Incidents',
      value: stats.activeIncidents,
      total: stats.totalIncidents,
      icon: AlertTriangle,
      color: 'text-red-500',
    },
    {
      title: 'Cleared Incidents',
      value: stats.clearedIncidents,
      total: stats.totalIncidents,
      icon: Activity,
      color: 'text-green-500',
    },
    {
      title: 'Historical Cases',
      value: stats.totalCases,
      icon: Car,
      color: 'text-blue-500',
    },
    {
      title: 'Active Closures',
      value: stats.activeClosures,
      total: stats.totalEvents,
      icon: MapPin,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.total !== undefined && (
              <p className="text-xs text-muted-foreground">
                {stat.total} total
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}