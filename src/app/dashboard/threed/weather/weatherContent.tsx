// src/app/dashboard/threed/weather/weatherContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Thermometer, Droplets, Wind, CloudRain, Sun, Snowflake, AlertTriangle, ChevronLeft, ChevronRight, Calendar, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WeatherLog {
  id: number;
  temperature: number | string;
  humidity: number | string;
  rainfallInches: number | string;
  windSpeed: number | string;
  recordedAt: string;
  frostWarning: boolean;
  heatWarning: boolean;
  droughtWarning: boolean;
  source: string;
}

function PaginationControls({ currentPage, totalPages, totalRecords, pageSize, onPageChange }: { 
  currentPage: number; 
  totalPages: number; 
  totalRecords: number; 
  pageSize: number; 
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-t bg-muted/30">
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
        <span className="hidden sm:inline ml-2">
          ({totalRecords} total records)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// Helper function to safely parse numeric values
const safeParseFloat = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function WeatherContent() {
  const { showToast, ToastComponent } = useToast();
  const [weatherLogs, setWeatherLogs] = useState<WeatherLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/weather?limit=500`);
      const data = await response.json();
      if (data.success) {
        setWeatherLogs(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load weather data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/threed/weather/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const pollWeather = async () => {
    setIsPolling(true);
    try {
      const response = await fetch('/api/threed/weather/poll');
      const data = await response.json();
      if (data.success) {
        await fetchWeather();
        await fetchStats();
        showToast(`Weather data updated! ${data.stats?.temperature || ''}°F`, 'success');
      } else {
        showToast('Weather poll failed', 'error');
      }
    } catch (err) {
      showToast('Weather poll failed', 'error');
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => { 
    fetchWeather(); 
    fetchStats();
  }, [fetchWeather, fetchStats]);

  useEffect(() => {
    setTotalRecords(weatherLogs.length);
    setFilteredLogs(weatherLogs);
    setCurrentPage(0);
  }, [weatherLogs]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredLogs.slice(start, end);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getTempColor = (temp: number) => {
    if (temp >= 90) return 'text-red-600';
    if (temp >= 80) return 'text-orange-500';
    if (temp >= 60) return 'text-green-600';
    if (temp >= 40) return 'text-blue-500';
    return 'text-blue-300';
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const latest = stats?.lastReading;
  const hasWarnings = latest?.frostWarning || latest?.heatWarning || latest?.droughtWarning;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Weather Logs</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total records • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={pollWeather} disabled={isPolling}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPolling ? 'animate-spin' : ''}`} />
            {isPolling ? 'Fetching...' : 'Update Weather'}
          </Button>
        </div>
      </div>

      {/* Current Conditions Card */}
      {latest && (
        <Card className={`border-2 ${hasWarnings ? 'border-red-500 dark:border-red-700' : 'border-green-500 dark:border-green-700'}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Current Conditions</h2>
                <p className="text-sm text-muted-foreground">{formatDate(latest.recordedAt)}</p>
              </div>
              {hasWarnings && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">Weather Alert</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="text-center">
                <Thermometer className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className={`text-2xl font-bold ${getTempColor(safeParseFloat(latest.temperature))}`}>
                  {safeParseFloat(latest.temperature)}°F
                </p>
                <p className="text-xs text-muted-foreground">Temperature</p>
              </div>
              <div className="text-center">
                <Droplets className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold text-blue-600">
                  {safeParseFloat(latest.humidity).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Humidity</p>
              </div>
              <div className="text-center">
                <CloudRain className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold text-cyan-600">
                  {safeParseFloat(latest.rainfallInches).toFixed(2)}"
                </p>
                <p className="text-xs text-muted-foreground">Rainfall</p>
              </div>
              <div className="text-center">
                <Wind className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold text-teal-600">
                  {safeParseFloat(latest.windSpeed).toFixed(1)} mph
                </p>
                <p className="text-xs text-muted-foreground">Wind Speed</p>
              </div>
              <div className="text-center">
                <Sun className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold text-amber-600">{latest.sunlightHours || '—'}</p>
                <p className="text-xs text-muted-foreground">Sunlight</p>
              </div>
            </div>
            
            {/* Warning indicators */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
              {latest.frostWarning && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-xs">
                  <Snowflake className="w-3 h-3" />
                  Frost Warning
                </div>
              )}
              {latest.heatWarning && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-xs">
                  <Thermometer className="w-3 h-3" />
                  Heat Warning
                </div>
              )}
              {latest.droughtWarning && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 text-xs">
                  <CloudRain className="w-3 h-3" />
                  Drought Warning
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
              </div>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Avg Temperature</p>
                <p className="text-2xl font-bold text-orange-600">{safeParseFloat(stats?.avgTemperatureF).toFixed(1)}°F</p>
              </div>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Avg Humidity</p>
                <p className="text-2xl font-bold text-blue-600">{safeParseFloat(stats?.avgHumidityPercent).toFixed(0)}%</p>
              </div>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Frost Days</p>
                <p className="text-2xl font-bold text-blue-400">{stats?.frostDays || 0}</p>
              </div>
              <Snowflake className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Heat Days</p>
                <p className="text-2xl font-bold text-red-500">{stats?.heatDays || 0}</p>
              </div>
              <Thermometer className="w-5 h-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Temp</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Humidity</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Rainfall</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Wind</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Warnings</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{formatDate(log.recordedAt)}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${getTempColor(safeParseFloat(log.temperature))}`}>
                    {safeParseFloat(log.temperature).toFixed(1)}°F
                  </td>
                  <td className="px-4 py-3 text-sm">{safeParseFloat(log.humidity).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-sm">{safeParseFloat(log.rainfallInches).toFixed(2)}"</td>
                  <td className="px-4 py-3 text-sm">{safeParseFloat(log.windSpeed).toFixed(1)} mph</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {log.frostWarning && <Snowflake className="w-4 h-4 text-blue-500" title="Frost Warning" />}
                      {log.heatWarning && <Thermometer className="w-4 h-4 text-red-500" title="Heat Warning" />}
                      {log.droughtWarning && <CloudRain className="w-4 h-4 text-yellow-500" title="Drought Warning" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
        
        {totalRecords === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <CloudRain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No weather data available</p>
            <p className="text-sm mt-1">Click "Update Weather" to fetch current conditions</p>
          </div>
        )}
      </Card>
    </div>
  );
}