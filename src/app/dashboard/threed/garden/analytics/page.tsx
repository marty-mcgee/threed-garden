// src/app/dashboard/threed/garden/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, BarChart3, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface AnalyticsData {
  totalHarvests: number;
  totalWeight: number;
  totalQuantity: number;
  avgYieldPerPlant: number;
  monthlyTrend: Array<{ month: string; weight: number; count: number }>;
  topPlants: Array<{ name: string; weight: number }>;
  recentHarvests: Array<{ id: number; quantity: number; weightLbs: number; harvestDate: string }>;
}

export default function AnalyticsPage() {
  const { showToast, ToastComponent } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/threed/analytics');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          showToast('Failed to load analytics data', 'error');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        showToast('Failed to load analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [showToast]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">Garden Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your garden's performance and harvest trends</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Harvests</p>
                <p className="text-2xl font-bold text-foreground">{data?.totalHarvests || 0}</p>
              </div>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Yield</p>
                <p className="text-2xl font-bold text-green-600">{data?.totalWeight?.toFixed(1) || 0} lbs</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{data?.totalQuantity || 0}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Avg per Plant</p>
                <p className="text-2xl font-bold text-purple-600">{data?.avgYieldPerPlant?.toFixed(1) || 0} lbs</p>
              </div>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Trends */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Harvest Trends</h2>
          {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
            <div className="space-y-3">
              {data.monthlyTrend.map((trend) => (
                <div key={trend.month} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-muted-foreground">{trend.month}</div>
                  <div className="flex-1">
                    <div 
                      className="h-8 bg-green-500 rounded-lg transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (trend.weight / (data.totalWeight || 1)) * 100)}%`,
                        maxWidth: '100%'
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium">{trend.weight.toFixed(1)} lbs</div>
                  <div className="text-xs text-muted-foreground w-16">{trend.count} harvests</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No harvest data available yet</p>
          )}
        </CardContent>
      </Card>
      
      {/* Top Producing Plants */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Producing Plants</h2>
          {data?.topPlants && data.topPlants.length > 0 ? (
            <div className="space-y-3">
              {data.topPlants.map((plant, index) => (
                <div key={plant.name} className="flex items-center gap-4">
                  <div className="w-8 text-lg font-bold text-muted-foreground">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{plant.name}</span>
                      <span className="text-sm text-muted-foreground">{plant.weight.toFixed(1)} lbs</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${(plant.weight / (data.topPlants[0]?.weight || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No harvest data available yet</p>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Harvests */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Harvests</h2>
          {data?.recentHarvests && data.recentHarvests.length > 0 ? (
            <div className="space-y-2">
              {data.recentHarvests.map((harvest) => (
                <div key={harvest.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">Harvest #{harvest.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(harvest.harvestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{harvest.quantity} items</p>
                    <p className="text-xs text-muted-foreground">{harvest.weightLbs?.toFixed(1) || 0} lbs</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No harvests recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}