// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Flame, RefreshCw, Filter, X, Car, Radio, AlertTriangle, 
  Calendar, MapPin, Download, Globe, Eye, EyeOff, Layers, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================
// DYNAMIC IMPORTS
// ============================================

const ThreeDMap = dynamic(
  () => import('@/components/traffic/map/ThreeDMap').then(mod => mod.ThreeDMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] rounded-xl bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  }
);

// ============================================
// TYPES
// ============================================

type SourceFilter = 'all' | 'caltrans' | 'bayarea511' | 'chp-live' | 'chp-historical' | 'calfire';
type DateRange = '1d' | '7d' | '30d' | 'all';

interface MapEvent {
  id: string;
  source: string;
  type: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  severity?: string;
}

interface LayerConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  activeBgColor: string;
  enabled: boolean;
  count: number;
}

// ============================================
// PAGINATION CONTROLS
// ============================================

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
        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
        <span className="hidden sm:inline ml-2">({totalRecords} total events)</span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  
  // State
  const [allEvents, setAllEvents] = useState<MapEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [showFilters, setShowFilters] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Layer visibility
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'chp-live', name: 'CHP Live', icon: <AlertTriangle className="w-4 h-4 text-red-500" />, color: 'red', activeColor: 'text-red-600 dark:text-red-400', activeBgColor: 'bg-red-100 dark:bg-red-900/50', enabled: true, count: 0 },
    { id: 'bayarea511', name: '511.org', icon: <Radio className="w-4 h-4 text-emerald-500" />, color: 'emerald', activeColor: 'text-emerald-600 dark:text-emerald-400', activeBgColor: 'bg-emerald-100 dark:bg-emerald-900/50', enabled: true, count: 0 },
    { id: 'caltrans', name: 'Caltrans', icon: <Car className="w-4 h-4 text-blue-500" />, color: 'blue', activeColor: 'text-blue-600 dark:text-blue-400', activeBgColor: 'bg-blue-100 dark:bg-blue-900/50', enabled: true, count: 0 },
    { id: 'calfire', name: 'CalFire', icon: <Flame className="w-4 h-4 text-orange-500" />, color: 'orange', activeColor: 'text-orange-600 dark:text-orange-400', activeBgColor: 'bg-orange-100 dark:bg-orange-900/50', enabled: true, count: 0 },
    { id: 'chp-historical', name: 'Historical', icon: <Calendar className="w-4 h-4 text-purple-500" />, color: 'purple', activeColor: 'text-purple-600 dark:text-purple-400', activeBgColor: 'bg-purple-100 dark:bg-purple-900/50', enabled: false, count: 0 },
  ]);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchAllData = useCallback(async () => {
    try {
      const [caltransRes, bayAreaRes, chpLiveRes, chpHistoricalRes, calfireRes] = await Promise.all([
        fetch(`/api/traffic/caltrans/closures/raw?limit=100&showAll=${showAllRegions}`),
        fetch(`/api/traffic/bay-area-511?limit=100&showAll=${showAllRegions}`),
        fetch('/api/traffic/chp-cad?limit=100'),
        fetch(`/api/traffic/chp-historical/collisions?limit=100&showAll=${showAllRegions}`),
        fetch(`/api/traffic/calfire?limit=100&showAll=${showAllRegions}`),
      ]);
      
      const [caltransData, bayAreaData, chpLiveData, chpHistoricalData, calfireData] = await Promise.all([
        caltransRes.json(), bayAreaRes.json(), chpLiveRes.json(), chpHistoricalRes.json(), calfireRes.json()
      ]);
      
      const events: MapEvent[] = [];
      const counts = { caltrans: 0, bayarea511: 0, 'chp-live': 0, 'chp-historical': 0, calfire: 0 };
      
      // Process Caltrans
      (caltransData.data || []).forEach((item: any) => {
        if (item.latitude && item.longitude) {
          events.push({
            id: `caltrans_${item.closure_id}`,
            source: 'caltrans',
            type: item.closure_type || 'Lane Closure',
            location: item.route || 'Unknown',
            description: item.description || '',
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            timestamp: item.end_timestamp,
            severity: item.status,
          });
          counts.caltrans++;
        }
      });
      
      // Process Bay Area 511
      (bayAreaData.data || []).forEach((item: any) => {
        if (item.latitude && item.longitude) {
          events.push({
            id: `bayarea_${item.id}`,
            source: 'bayarea511',
            type: item.eventType || 'Traffic Event',
            location: item.roadwayName || 'Unknown',
            description: item.description || '',
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            timestamp: item.startTime,
            severity: item.severity,
          });
          counts.bayarea511++;
        }
      });
      
      // Process CHP Live
      (chpLiveData.data || []).forEach((item: any) => {
        if (item.latitude && item.longitude) {
          events.push({
            id: `chplive_${item.id}`,
            source: 'chp-live',
            type: item.incidentType || 'Incident',
            location: item.location || 'Unknown',
            description: item.details || '',
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            timestamp: item.logTime,
          });
          counts['chp-live']++;
        }
      });
      
      // Process CHP Historical
      if (showHistorical) {
        (chpHistoricalData.data || []).forEach((item: any) => {
          if (item.latitude && item.longitude) {
            events.push({
              id: `chphist_${item.id}`,
              source: 'chp-historical',
              type: 'Collision',
              location: item.location || 'Unknown',
              description: item.primaryFactor || '',
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
              timestamp: item.collisionDate,
              severity: item.severity,
            });
            counts['chp-historical']++;
          }
        });
      }

      // Process CalFire
      (calfireData.data || []).forEach((item: any) => {
        if (item.latitude && item.longitude) {
          events.push({
            id: `calfire_${item.id}`,
            source: 'calfire',
            type: item.type || 'Wildfire',
            location: `${item.name} - ${item.county}`,
            description: `${item.acresBurned ? `${item.acresBurned.toLocaleString()} acres` : ''} • ${item.percentContained || 0}% contained`,
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            timestamp: item.startedAt,
            severity: item.percentContained ? (item.percentContained < 30 ? 'critical' : item.percentContained < 80 ? 'warning' : 'monitoring') : 'unknown',
          });
          counts.calfire++;
        }
      });
      
      setAllEvents(events);
      setLastUpdated(new Date());
      
      // Update layer counts
      setLayers(prev => prev.map(layer => ({
        ...layer,
        count: counts[layer.id as keyof typeof counts] || 0
      })));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAllRegions, showHistorical, showToast]);

  // ============================================
  // FILTERS
  // ============================================

  const applyFilters = useCallback(() => {
    let filtered = [...allEvents];
    
    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(e => e.source === sourceFilter);
    }
    
    // Layer visibility
    const enabledSources = layers.filter(l => l.enabled).map(l => l.id);
    filtered = filtered.filter(e => enabledSources.includes(e.source));
    
    // Date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      switch (dateRange) {
        case '1d': cutoffDate.setDate(now.getDate() - 1); break;
        case '7d': cutoffDate.setDate(now.getDate() - 7); break;
        case '30d': cutoffDate.setDate(now.getDate() - 30); break;
      }
      filtered = filtered.filter(e => e.timestamp ? new Date(e.timestamp) > cutoffDate : true);
    }
    
    setFilteredEvents(filtered);
  }, [allEvents, sourceFilter, dateRange, layers]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => { fetchAllData(); }, [fetchAllData]);
  useEffect(() => { applyFilters(); }, [applyFilters]);
  
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllData]);

  // ============================================
  // HANDLERS
  // ============================================

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
    ));
  };

  const toggleAllLayers = () => {
    const allEnabled = layers.every(l => l.enabled);
    setLayers(prev => prev.map(layer => ({ ...layer, enabled: !allEnabled })));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    showToast('Dashboard refreshed', 'success');
  };

  const exportToCSV = () => {
    const headers = ['Source', 'Type', 'Location', 'Description', 'Latitude', 'Longitude', 'Timestamp', 'Severity'];
    const rows = filteredEvents.map(e => [
      e.source, e.type, e.location, e.description, e.latitude, e.longitude, e.timestamp || '', e.severity || ''
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export complete', 'success');
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  // ============================================
  // HELPERS
  // ============================================

  const getSourceBadge = (source: string) => {
    const map: Record<string, string> = {
      caltrans: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
      bayarea511: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
      'chp-live': 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
      'chp-historical': 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300',
      calfire: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300',
    };
    return map[source] || 'bg-gray-100 dark:bg-gray-800';
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  };

  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const currentPageData = getCurrentPageData();
  const currentPageWithCoords = currentPageData.filter(e => e.latitude && e.longitude);
  const totalEvents = filteredEvents.length;

  // Prepare events for 3D map
  const mapEvents = currentPageWithCoords.map(e => ({
    id: e.id,
    source: e.source,
    type: e.type,
    location: e.location,
    description: e.description,
    latitude: e.latitude,
    longitude: e.longitude,
    timestamp: e.timestamp,
    severity: e.severity,
  }));

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Traffic Map</h1>
          <p className="text-sm text-muted-foreground">
            {filteredEvents.length} total events • {currentPageData.length} on this page • {currentPageWithCoords.length} on map
            {lastUpdated && ` • Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button variant={sourceFilter !== 'all' || dateRange !== '7d' ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter
          </Button>
          <Button variant="outline" size="sm" onClick={toggleAllLayers}>
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            {layers.every(l => l.enabled) ? 'Hide All' : 'Show All'}
          </Button>
          <Button variant={showAllRegions ? "secondary" : "outline"} size="sm" onClick={() => setShowAllRegions(!showAllRegions)}>
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            {showAllRegions ? 'All Regions' : 'Local Only'}
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground">Filter Events</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Data Source</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { value: 'all', label: 'All', icon: <MapPin className="w-3.5 h-3.5" /> },
                    { value: 'caltrans', label: 'Caltrans', icon: <Car className="w-3.5 h-3.5 text-blue-500" /> },
                    { value: 'bayarea511', label: '511.org', icon: <Radio className="w-3.5 h-3.5 text-emerald-500" /> },
                    { value: 'chp-live', label: 'CHP Live', icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> },
                    { value: 'chp-historical', label: 'Historical', icon: <Calendar className="w-3.5 h-3.5 text-purple-500" /> },
                  ].map(filter => (
                    <Button
                      key={filter.value}
                      variant={sourceFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceFilter(filter.value as SourceFilter)}
                      className="justify-start"
                    >
                      {filter.icon}
                      <span className="ml-1">{filter.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date Range</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: '1d', label: '24h' },
                    { value: '7d', label: '7 days' },
                    { value: '30d', label: '30 days' },
                    { value: 'all', label: 'All' },
                  ].map(range => (
                    <Button
                      key={range.value}
                      variant={dateRange === range.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange(range.value as DateRange)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layer Toggle Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2">
        <Card className="text-center hover:shadow-md transition-shadow">
          <CardContent className="p-1">
            <p className="text-3xl font-bold text-foreground">{totalEvents}</p>
            <p className="text-xs text-muted-foreground">Current Events</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Eye className="w-3 h-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Visible</span>
            </div>
          </CardContent>
        </Card>
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={`rounded-xl p-1 text-center transition-all duration-200 hover:shadow-md ${
              layer.enabled 
                ? `${layer.activeBgColor} border-2 border-${layer.color}-400 dark:border-${layer.color}-500` 
                : 'bg-muted/30 border border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className={layer.enabled ? layer.activeColor : 'text-muted-foreground'}>
                {layer.icon}
              </span>
              <p className={`text-2xl font-bold ${layer.enabled ? layer.activeColor : 'text-muted-foreground'}`}>
                {layer.count}
              </p>
            </div>
            <p className={`text-sm font-medium ${layer.enabled ? layer.activeColor : 'text-muted-foreground'}`}>
              {layer.name}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {layer.enabled ? (
                <Eye className="w-3 h-3 text-green-500" />
              ) : (
                <EyeOff className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {layer.enabled ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 3D Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-xl">
          {mapEvents.length > 0 ? (
            <ThreeDMap 
              events={mapEvents} 
              center={[37.3, -119.5]} 
              height="600px"
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="h-[600px] bg-muted flex flex-col items-center justify-center">
              <MapPin className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No events with location data</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try enabling data layers above or adjusting filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredEvents.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Source</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((event) => (
                <React.Fragment key={event.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(event.id)}>
                    <td className="px-4 py-3 text-center">
                      <button className="text-muted-foreground hover:text-foreground" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSourceBadge(event.source)}`}>
                        {event.source === 'caltrans' ? 'Caltrans' : 
                         event.source === 'bayarea511' ? '511.org' : 
                         event.source === 'chp-live' ? 'CHP Live' : 
                         event.source === 'calfire' ? 'CalFire' : 'CHP Historical'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{event.type}</td>
                    <td className="px-4 py-3 text-sm">{event.location?.substring(0, 50)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {event.severity && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          event.severity === 'active' ? 'bg-green-100 text-green-800' :
                          event.severity === 'Fatal' ? 'bg-red-100 text-red-800' :
                          event.severity === 'Injury' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.severity}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedRows.has(event.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div>
                            <p className="font-medium text-foreground">Description</p>
                            <p className="text-muted-foreground">{event.description || 'No description available'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Coordinates</p>
                            <p className="text-muted-foreground font-mono text-xs">
                              {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/dashboard/${event.source === 'bayarea511' ? '511org' : event.source}`)}
                          >
                            View full details →
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredEvents.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
        
        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events match your filters</p>
            <p className="text-sm mt-1">Try adjusting your filter settings or toggling data layers</p>
          </div>
        )}
      </Card>
    </div>
  );
}