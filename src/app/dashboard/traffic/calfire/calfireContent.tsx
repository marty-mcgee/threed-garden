// src/app/dashboard/calfire/calfireContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, AlertTriangle, MapPin, Filter, X, Calendar, Clock, Flame, Info, Activity, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ExternalLink, Droplets } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SimpleMap = dynamic(() => import('@/components/map/simpleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-muted flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface CalFireIncident {
  id: number;
  uniqueId: string;
  name: string;
  type: string;
  status: string;
  county: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  acresBurned: number | null;
  percentContained: number | null;
  startedAt: string | null;
  updatedAt: string | null;
  extinguishedAt: string | null;
  adminUnit: string;
  url: string;
  isActive: boolean;
  isCalFireIncident: boolean;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Invalid date';
  }
};

const formatRelativeTime = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch {
    return 'N/A';
  }
};

const formatAcres = (acres: number | null) => {
  if (!acres) return 'N/A';
  if (acres >= 1000000) return `${(acres / 1000000).toFixed(1)}M`;
  if (acres >= 1000) return `${(acres / 1000).toFixed(1)}K`;
  return acres.toLocaleString();
  // return acres;
  // return 0
};

const CALIFORNIA_CENTER: [number, number] = [37.0, -120.0];

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
          ({totalRecords} total incidents)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function CalFireContent() {
  const { showToast, ToastComponent } = useToast();
  const [allIncidents, setAllIncidents] = useState<CalFireIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<CalFireIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // Add to state declarations
  const [showInactive, setShowInactive] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calfire?limit=500&showAll=${showInactive}`);
      const data = await response.json();
      if (data.success) {
        setAllIncidents(data.data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load CalFire incidents');
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  const pollData = async () => {
    setIsPolling(true);
    try {
      const response = await fetch('/api/calfire/poll?action=poll');
      const data = await response.json();
      if (data.success) {
        await fetchData();
        showToast(`Poll complete! ${data.stats?.newCount || 0} new, ${data.stats?.closedCount || 0} contained.`, 'success');
      } else {
        showToast('Poll failed', 'error');
      }
    } catch (err) {
      showToast('Poll failed', 'error');
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let filtered = [...allIncidents];
    
    if (countyFilter !== 'all') {
      filtered = filtered.filter(i => i.county === countyFilter);
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(i => i.isActive === true);
      } else if (statusFilter === 'contained') {
        filtered = filtered.filter(i => i.percentContained === 100);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(i => i.isActive === false && (i.percentContained || 0) < 100);
      }
    }
    
    setTotalRecords(filtered.length);
    setFilteredIncidents(filtered);
    setCurrentPage(0);
  }, [allIncidents, countyFilter, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredIncidents.slice(start, end);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();
  const currentPageWithCoords = currentPageData.filter(i => i.latitude && i.longitude);

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const activeCount = allIncidents.filter(i => i.isActive === true).length;
  const containedCount = allIncidents.filter(i => i.percentContained === 100).length;
  const totalAcres = '--' // allIncidents.filter(i => i.isActive === true).reduce((sum, i) => sum + (i.acresBurned || 0), 0);
  const uniqueCounties = [...new Set(allIncidents.map(i => i.county).filter(Boolean))].sort();
  const inactiveCount = allIncidents.filter(i => i.isActive === false).length;
  
  const getStatusBadge = (incident: CalFireIncident) => {
    if (!incident.isActive) return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    if (incident.percentContained === 100) return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
    if ((incident.percentContained || 0) >= 80) return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300';
  };

  const getStatusText = (incident: CalFireIncident) => {
    if (!incident.isActive) return 'Extinguished';
    if (incident.percentContained === 100) return 'Contained';
    return `${incident.percentContained || 0}% Contained`;
  };

  const mapEvents = currentPageWithCoords.map(i => ({
    id: i.id,
    latitude: i.latitude!,
    longitude: i.longitude!,
    roadwayName: i.location,
    eventType: `🔥 ${i.name}`,
    description: `${formatAcres(i.acresBurned)} acres • ${getStatusText(i)} • ${i.county}`,
    onClick: () => window.open(i.url, '_blank'),
  }));

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (error) return <div className="text-center py-12 text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p>{error}</p><Button onClick={fetchData} className="mt-4">Retry</Button></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CalFire Incidents</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total incidents • {currentPageData.length} on this page • {currentPageWithCoords.length} on map
            {lastUpdated && ` • Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">

          <Button 
            variant={showInactive ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowInactive(!showInactive)}
            >
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            {showInactive ? 'Showing All' : 'Active Only'}
          </Button>

          <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
          
          <Button size="sm" onClick={pollData} disabled={isPolling}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPolling ? 'animate-spin' : ''}`} />
            {isPolling ? 'Polling...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground">Filter Incidents</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">County</label>
                <select value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option value="all">All Counties</option>
                  {uniqueCounties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="contained">100% Contained</option>
                  <option value="inactive">Extinguished</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Active Fires</p><p className="text-2xl font-bold text-red-600 dark:text-red-400">{activeCount}</p></div><Flame className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Contained</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{containedCount}</p></div><Activity className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Total Acres</p><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatAcres(totalAcres)}</p></div><TrendingUp className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Counties</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uniqueCounties.length}</p></div><MapPin className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">On Map</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{currentPageWithCoords.length}</p></div><MapPin className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Inactive</p><p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{inactiveCount}</p></div><Activity className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
      </div>

      {showMap && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-xl">
            {mapEvents.length > 0 ? (
              <SimpleMap events={mapEvents} center={CALIFORNIA_CENTER} zoom={6} height="400px" />
            ) : (
              <div className="h-[400px] bg-muted flex flex-col items-center justify-center">
                <MapPin className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No incidents on this page have coordinates</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left text-xs uppercase">Fire Name</th>
                <th className="px-4 py-3 text-left text-xs uppercase">County</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Acres</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Containment</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Started</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((incident) => (
                <React.Fragment key={incident.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(incident.id)}>
                    <td className="px-4 py-3"><Info className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="px-4 py-3 text-sm font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {incident.name}
                    </td>
                    <td className="px-4 py-3 text-sm">{incident.county || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{formatAcres(incident.acresBurned)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(incident)}`}>
                        {getStatusText(incident)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {incident.startedAt ? new Date(incident.startedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatRelativeTime(incident.updatedAt)}
                    </td>
                  </tr>
                  {expandedRows.has(incident.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div className="flex gap-2">
                            <Info className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Location</p>
                              <p>{incident.location || 'Location not specified'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Droplets className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Admin Unit</p>
                              <p>{incident.adminUnit || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Timeline</p>
                              <p>Started: {formatDate(incident.startedAt)}</p>
                              {incident.extinguishedAt && <p>Extinguished: {formatDate(incident.extinguishedAt)}</p>}
                            </div>
                          </div>
                          {incident.url && (
                            <div className="flex gap-2">
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => window.open(incident.url, '_blank')}>
                                View on CalFire website →
                              </Button>
                            </div>
                          )}
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
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
        
        {totalRecords === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active fire incidents at this time</p>
            <p className="text-sm mt-1">Check back later for updates</p>
          </div>
        )}
      </Card>
    </div>
  );
}