// src/app/dashboard/511org/511orgContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, AlertTriangle, MapPin, Radio, Construction, Car, Filter, X, Calendar, Clock, Route, Info, Activity, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface BayAreaEvent {
  id: number;
  sourceId: string;
  eventType: string;
  eventSubType: string;
  severity: string;
  description: string;
  title: string;
  roadwayName: string;
  directionOfTravel: string;
  lanesAffected: string;
  latitude: number | null;
  longitude: number | null;
  county: string | null;
  city: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const formatRelativeTime = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  } catch { return 'N/A'; }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try { return new Date(dateString).toLocaleString(); } catch { return 'Invalid date'; }
};

const BAY_AREA_CENTER: [number, number] = [37.8, -122.3];

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

export default function BayArea511Content() {
  const { showToast, ToastComponent } = useToast();
  const [allEvents, setAllEvents] = useState<BayAreaEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<BayAreaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bay-area-511?limit=2000&showAll=true`);
      const data = await response.json();
      if (data.success) {
        setAllEvents(data.data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load Bay Area events');
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const pollData = async () => {
    setIsPolling(true);
    try {
      const response = await fetch('/api/bay-area-511/poll?action=poll');
      const data = await response.json();
      if (data.success) {
        await fetchData();
        showToast(`Poll complete! ${data.stats?.newCount || 0} new, ${data.stats?.closedCount || 0} closed.`, 'success');
      } else {
        showToast('Poll failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Poll failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let filtered = [...allEvents];
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.eventType?.toLowerCase().includes(eventTypeFilter));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    setTotalRecords(filtered.length);
    setFilteredEvents(filtered);
    setCurrentPage(0);
  }, [allEvents, eventTypeFilter, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredEvents.slice(start, end);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();
  const currentPageWithCoords = currentPageData.filter(e => e.latitude && e.longitude);

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const activeCount = filteredEvents.filter(e => e.status === 'active').length;
  const closedCount = filteredEvents.filter(e => e.status === 'closed').length;
  const constructionCount = filteredEvents.filter(e => e.eventType?.toLowerCase().includes('construction')).length;
  const accidentCount = filteredEvents.filter(e => e.eventType?.toLowerCase().includes('accident')).length;

  const getEventTypeBadge = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('accident')) return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300';
    if (lowerType.includes('construction')) return 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300';
    if (lowerType.includes('roadwork')) return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  };

  const mapEvents = currentPageWithCoords.map(e => ({
    id: e.id,
    latitude: e.latitude!,
    longitude: e.longitude!,
    roadwayName: e.roadwayName,
    eventType: e.eventType,
    description: e.description?.substring(0, 100),
  }));

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (error) return <div className="text-center py-12 text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p>{error}</p><Button onClick={fetchData} className="mt-4">Retry</Button></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bay Area 511 Traffic Events</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total events • {currentPageData.length} on this page • {currentPageWithCoords.length} on map
            {lastUpdated && ` • Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filter {(eventTypeFilter !== 'all' || statusFilter !== 'all') && <Badge variant="secondary" className="ml-1">!</Badge>}
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
              <h3 className="font-semibold text-foreground">Filter Events</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Event Type</label>
                <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option value="all">All Types</option>
                  <option value="accident">Accidents / Collisions</option>
                  <option value="construction">Construction</option>
                  <option value="roadwork">Road Work</option>
                  <option value="closure">Closures</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-foreground">{totalRecords}</p></div><Radio className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{activeCount}</p></div><Activity className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">Closed</p><p className="text-xl font-bold text-gray-600 dark:text-gray-400">{closedCount}</p></div><CheckCircle className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">Construction</p><p className="text-xl font-bold text-amber-600 dark:text-amber-400">{constructionCount}</p></div><Construction className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">Accidents</p><p className="text-xl font-bold text-red-600 dark:text-red-400">{accidentCount}</p></div><AlertTriangle className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">On Map</p><p className="text-xl font-bold text-purple-600 dark:text-purple-400">{currentPageWithCoords.length}</p></div><MapPin className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
      </div>

      {showMap && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-xl">
            {mapEvents.length > 0 ? (
              <SimpleMap events={mapEvents} center={BAY_AREA_CENTER} zoom={9} height="400px" />
            ) : (
              <div className="h-[400px] bg-muted flex flex-col items-center justify-center">
                <MapPin className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No events on this page have coordinates</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        {totalPages > 1 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Roadway</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Direction</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Lanes</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((event) => (
                <React.Fragment key={event.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(event.id)}>
                    <td className="px-4 py-3"><Info className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${getEventTypeBadge(event.eventType)}`}>{event.eventType || 'Unknown'}</span></td>
                    <td className="px-4 py-3 text-sm font-medium">{event.roadwayName || 'N/A'}{event.eventSubType && <span className="ml-2 text-xs text-muted-foreground">{event.eventSubType}</span>}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{event.directionOfTravel || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{event.lanesAffected || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${event.status === 'active' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'}`}>{event.status}</span></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatRelativeTime(event.updatedAt || event.createdAt)}</td>
                  </tr>
                  {expandedRows.has(event.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div className="flex gap-2"><Info className="w-4 h-4 text-muted-foreground" /><div><p className="font-medium">Description</p><p>{event.description || 'No description available'}</p></div></div>
                          <div className="flex gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><div><p className="font-medium">Schedule</p><p>{formatDate(event.startTime)} → {formatDate(event.endTime)}</p></div></div>
                          <div className="flex gap-2"><Route className="w-4 h-4 text-muted-foreground" /><div><p className="font-medium">Location</p><p>{event.city || event.county || 'Location not specified'}</p></div></div>
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
          <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />
        )}
      </Card>
    </div>
  );
}