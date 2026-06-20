// src/app/dashboard/threed/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  Sprout, Box, Calendar, Apple, Droplets, Cpu, Activity, TrendingUp, 
  Thermometer, Wifi, Sun, CloudRain, Leaf, Flower2, Trees, 
  ArrowRight, RefreshCw, BarChart3, CheckSquare, Timer, Flame
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// // Dynamically import 3D viewer
// const ThreeDGarden = dynamic(() => import('@/components/threed/ThreeDGarden'), {
//   ssr: false,
//   loading: () => (
//     <div className="w-full h-[500px] bg-muted rounded-xl flex items-center justify-center">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//     </div>
//   ),
// });
import ThreeDGarden from '@/components/threed/ThreeDGarden'; // Regular import, NOT dynamic

// Import shared types
import { Bed, GardenPlantData, CharacterData, WeatherData } from '@/lib/types/threed';

interface DashboardStats {
  plants: { total: number; byType: Record<string, number> };
  beds: { total: number; active: number; totalSqFt: number };
  plantings: { total: number; growing: number; harvested: number };
  tasks: { pending: number; overdue: number; completed: number };
  harvests: { total: number; totalWeight: number; recentCount: number };
  weather: { temperature: number; condition: string; rainfall: number };
  farmbots: { total: number; online: number };
}

export default function ThreeDMasterDashboard() {
  const { showToast, ToastComponent } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plants, setPlants] = useState([]);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [beds, setBeds] = useState([]);
  const [plantings, setPlantings] = useState([]);
  const [weather, setWeather] = useState<any>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Fetch stats data in parallel (no characters stats needed yet)
      const [
        plantsRes,
        bedsRes,
        plantingsRes,
        tasksRes,
        harvestsRes,
        weatherRes,
        farmbotsRes,
      ] = await Promise.all([
        fetch('/api/threed/plants/stats'),
        fetch('/api/threed/beds/stats'),
        fetch('/api/threed/plantings/stats'),
        fetch('/api/threed/tasks/stats'),
        fetch('/api/threed/harvests/stats'),
        fetch('/api/threed/weather/stats'),
        fetch('/api/threed/farmbots/stats'),
      ]);
      
      const plantsData = await plantsRes.json();
      const bedsData = await bedsRes.json();
      const plantingsData = await plantingsRes.json();
      const tasksData = await tasksRes.json();
      const harvestsData = await harvestsRes.json();
      const weatherData = await weatherRes.json();
      const farmbotsData = await farmbotsRes.json();
      
      setStats({
        plants: plantsData.data || { total: 0, byType: {} },
        beds: bedsData.data || { total: 0, active: 0, totalSqFt: 0 },
        plantings: plantingsData.data || { total: 0, growing: 0, harvested: 0 },
        tasks: tasksData.data || { pending: 0, overdue: 0, completed: 0 },
        harvests: harvestsData.data || { total: 0, totalWeight: 0, recentCount: 0 },
        weather: weatherData.data?.lastReading || { temperature: '--', condition: 'unknown', rainfall: 0 },
        farmbots: farmbotsData.data || { total: 0, online: 0 },
      });
      
      // Fetch FULL data for 3D view (beds, plantings, characters - all in parallel)
      const [
        bedsFullRes,
        plantingsFullRes,
        charactersFullRes,  // ADD THIS - fetch full character data
      ] = await Promise.all([
        fetch('/api/threed/beds?limit=100'),
        fetch('/api/threed/plantings?limit=500'),
        fetch('/api/threed/characters?limit=500&includeModel=true'),
      ]);

      // Fetch 3D data
      // const bedsFullRes = await fetch('/api/threed/beds?limit=100');
      const bedsFullData = await bedsFullRes.json();
      if (bedsFullData.success) {
        setBeds(bedsFullData.data);
      }
      
      // const plantingsFullRes = await fetch('/api/threed/plantings?limit=500');
      const plantingsFullData = await plantingsFullRes.json();
      if (plantingsFullData.success) {
        setPlantings(plantingsFullData.data);
      }

      const charactersFullData = await charactersFullRes.json();
      if (charactersFullData.success) {
        let charsData = charactersFullData.data;
        console.log('📦 Raw characters data:', charsData);
        
        // Extract character objects from nested structure if needed
        if (charsData && charsData.length > 0 && charsData[0].character) {
          charsData = charsData.map((item: any) => item.character);
        }
        
        console.log('📦 Processed characters:', charsData);
        setCharacters(charsData || []);
      }
      
      // Fetch recent activity (logs + recent tasks)
      const recentTasksRes = await fetch('/api/threed/tasks?limit=5&status=pending');
      const recentTasksData = await recentTasksRes.json();
      const recentHarvestsRes = await fetch('/api/threed/harvests?limit=5');
      const recentHarvestsData = await recentHarvestsRes.json();
      
      const activities = [];
      if (recentTasksData.data) {
        activities.push(...recentTasksData.data.map((t: any) => ({
          id: t.task.id,
          type: 'task',
          title: t.task.title,
          timestamp: t.task.dueDate,
          status: t.task.status,
        })));
      }
      if (recentHarvestsData.data) {
        activities.push(...recentHarvestsData.data.map((h: any) => ({
          id: h.harvest.id,
          type: 'harvest',
          title: `${h.plant?.commonName || 'Plant'} harvest`,
          quantity: h.harvest.quantity,
          weight: h.harvest.weightLbs,
          timestamp: h.harvest.harvestDate,
        })));
      }
      
      // Sort by timestamp descending and take first 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 5));
      
      // Set weather for 3D view
      if (weatherData.data?.lastReading) {
        setWeather({
          temperature: weatherData.data.lastReading.temperature,
          condition: weatherData.data.lastReading.temperature > 80 ? 'sunny' : 'cloudy',
          rainfall: weatherData.data.lastReading.rainfallInches || 0,
        });
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getWeatherIcon = () => {
    if (!stats?.weather) return <Sun className="w-5 h-5" />;
    if (stats.weather.rainfall > 0) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (stats.weather.temperature > 80) return <Sun className="w-5 h-5 text-yellow-500" />;
    if (stats.weather.temperature < 50) return <Thermometer className="w-5 h-5 text-blue-400" />;
    return <Sun className="w-5 h-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Plants', value: stats?.plants.total || 0, icon: <Leaf className="w-5 h-5" />, color: 'green', href: '/dashboard/threed/plants' },
    { title: 'Beds', value: stats?.beds.active || 0, sub: `${stats?.beds.totalSqFt || 0} sq ft`, icon: <Box className="w-5 h-5" />, color: 'blue', href: '/dashboard/threed/beds' },
    { title: 'Plantings', value: stats?.plantings.total || 0, sub: `${stats?.plantings.growing || 0} growing`, icon: <Sprout className="w-5 h-5" />, color: 'emerald', href: '/dashboard/threed/plantings' },
    { title: 'Tasks', value: stats?.tasks.pending || 0, sub: `${stats?.tasks.overdue || 0} overdue`, icon: <CheckSquare className="w-5 h-5" />, color: 'orange', href: '/dashboard/threed/tasks' },
    { title: 'Harvests', value: stats?.harvests.total || 0, sub: `${stats?.harvests.totalWeight || 0} lbs`, icon: <Apple className="w-5 h-5" />, color: 'red', href: '/dashboard/threed/harvests' },
    { title: 'FarmBots', value: stats?.farmbots.online || 0, sub: `${stats?.farmbots.total || 0} total`, icon: <Cpu className="w-5 h-5" />, color: 'purple', href: '/dashboard/threed/farmbots' },
  ];

  // Also log when rendering
  console.log('🎮 Rendering ThreeDGarden with characters:', characters);

  console.log('🎮 Rendering ThreeDGarden with:', {
    bedsCount: beds.length,
    sampleBed: beds[0],
    plantingsCount: plantings.length,
    samplePlanting: plantings[0],
    charactersCount: characters.length,
    sampleCharacter: characters[0]
  });

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ThreeD Garden Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your complete garden management system
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" onClick={fetchAllData} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>
        </div>
      </div>
      
      {/* Weather Bar */}
      {stats?.weather && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 dark:bg-black/20 rounded-full">
                  {getWeatherIcon()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Current Conditions</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.weather.temperature}°F • {stats.weather.rainfall > 0 ? `${stats.weather.rainfall} rain` : 'Dry'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Activity className="w-3 h-3" />
                  Garden Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
                  </div>
                  <div className={`text-${card.color}-500 opacity-70 group-hover:opacity-100 transition-opacity`}>
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* 3D Garden View */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-xl">
          {beds.length > 0 || plantings.length > 0 ? (
            // In the ThreeDGarden component call, add characters prop:
            <ThreeDGarden
              beds={beds}
              plantings={plantings}
              characters={characters}  // Make sure this is passed
              weather={weather}
              // onBedSelect={handleBedSelect}
              // onPlantSelect={handlePlantSelect}
              // onCharacterSelect={(character) => {
              //   console.log('Selected character:', character);
              //   showToast(`${character.name}: ${character.interactionMessage || 'Hello!'}`, 'info');
              // }}
            />
          ) : (
            <div className="h-[500px] bg-muted flex flex-col items-center justify-center">
              <Trees className="w-16 h-16 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No garden data available</p>
              <p className="text-sm text-muted-foreground mt-1">Add beds and plantings to see your 3D garden</p>
              <div className="flex gap-2 mt-4">
                <Link href="/dashboard/threed/beds">
                  <Button size="sm">Add Beds</Button>
                </Link>
                <Link href="/dashboard/threed/plants">
                  <Button size="sm" variant="outline">Add Plants</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard/threed/plantings/new">
                <Button variant="outline" className="w-full justify-start">
                  <Sprout className="w-4 h-4 mr-2" />
                  New Planting
                </Button>
              </Link>
              <Link href="/dashboard/threed/tasks/new">
                <Button variant="outline" className="w-full justify-start">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </Link>
              <Link href="/dashboard/threed/harvests/new">
                <Button variant="outline" className="w-full justify-start">
                  <Apple className="w-4 h-4 mr-2" />
                  Log Harvest
                </Button>
              </Link>
              <Link href="/dashboard/threed/garden/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 text-sm">
                    {activity.type === 'task' ? (
                      <CheckSquare className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Apple className="w-4 h-4 text-green-500" />
                    )}
                    <span className="flex-1 text-muted-foreground">
                      {activity.title}
                      {activity.quantity && ` (${activity.quantity} items, ${activity.weight?.toFixed(1)} lbs)`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Service Links */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Garden Services
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link href="/dashboard/threed/plants" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">🌱 Plants</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/dashboard/threed/beds" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">📐 Beds</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/dashboard/threed/plantings" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">🌿 Plantings</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/dashboard/threed/tasks" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">✅ Tasks</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/dashboard/threed/harvests" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">🍎 Harvests</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/dashboard/threed/weather" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">🌤️ Weather</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/dashboard/threed/farmbots" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">🤖 FarmBots</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/dashboard/threed/garden/analytics" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm">📊 Analytics</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}