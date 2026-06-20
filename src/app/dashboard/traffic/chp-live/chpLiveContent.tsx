// src/app/dashboard/chp-live/chpLiveContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, AlertTriangle, MapPin, Filter, X, Calendar, Clock, Route, Info, Activity, Radio, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SimpleMap = dynamic(() => import('@/components/map/simpleMap'), { ssr: false, loading: () => <div className="h-[400px] bg-muted flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div> });

interface CHPIncident {
  id: number;
  sourceId: string;
  incidentType: string;
  location: string;
  city: string;
  county: string;
  logTime: string;
  details: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  centerName: string;
}

const formatRelativeTime = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  } catch { return 'N/A'; }
};

// Reusable Pagination Controls Component
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
        <span className="hidden sm:inline ml-2">({totalRecords} total records)</span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function CHPLiveContent() {
  const { showToast, ToastComponent } = useToast();
  const [incidents, setIncidents] = useState<CHPIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<CHPIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chp-cad?limit=500');
      const data = await response.json();
      if (data.success) { 
        setIncidents(data.data); 
        setLastUpdated(new Date());
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const pollData = async () => {
    setIsPolling(true);
    try {
      const response = await fetch('/api/chp-cad/poll?action=poll');
      const data = await response.json();
      if (data.success) { 
        await fetchData(); 
        showToast(`Poll complete! ${data.stats?.newCount || 0} new incidents.`, 'success');
      } else { showToast('Poll failed', 'error'); }
    } catch (err) { showToast('Poll failed', 'error'); } finally { setIsPolling(false); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let filtered = [...incidents];
    if (typeFilter !== 'all') filtered = filtered.filter(i => i.incidentType?.toLowerCase().includes(typeFilter));
    
    setTotalRecords(filtered.length);
    setFilteredIncidents(filtered);
    setCurrentPage(0);
  }, [incidents, typeFilter]);

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

  const activeCount = filteredIncidents.filter(i => i.status === 'active').length;
  const incidentTypes = [...new Set(incidents.map(i => i.incidentType?.toLowerCase()).filter(Boolean))];

  const getIncidentTypeBadge = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('collision') || lowerType.includes('accident')) return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300';
    if (lowerType.includes('hazard')) return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300';
    if (lowerType.includes('fire')) return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  };

  const mapEvents = currentPageWithCoords.map(i => ({ 
    id: i.id, 
    latitude: i.latitude!, 
    longitude: i.longitude!, 
    roadwayName: i.location, 
    eventType: i.incidentType, 
    description: i.details 
  }));

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CHP Live Incidents</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total incidents • {currentPageData.length} on this page • {currentPageWithCoords.length} on map
            {lastUpdated && ` • Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg bg-background">
            <option value="all">All Types</option>
            {incidentTypes.map(t => <option key={t} value={t}>{t?.toUpperCase()}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
            <MapPin className="w-3.5 h-3.5 mr-1.5" />{showMap ? 'Hide Map' : 'Show Map'}
          </Button>
          <Button size="sm" onClick={pollData} disabled={isPolling}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPolling ? 'animate-spin' : ''}`} />{isPolling ? 'Polling...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-foreground">{totalRecords}</p></div><AlertTriangle className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{activeCount}</p></div><Activity className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">On Map</p><p className="text-xl font-bold text-purple-600 dark:text-purple-400">{currentPageWithCoords.length}</p></div><MapPin className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Centers</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{new Set(incidents.map(i => i.centerName)).size}</p></div><Radio className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
      </div>

      {showMap && mapEvents.length > 0 && (
        <Card><CardContent className="p-0 overflow-hidden rounded-xl"><SimpleMap events={mapEvents} center={[39.3, -123.5]} zoom={10} height="400px" /></CardContent></Card>
      )}

      <Card>
        {totalPages > 1 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr><th className="px-4 py-3 w-8"></th><th className="px-4 py-3 text-left text-xs uppercase">Type</th><th className="px-4 py-3 text-left text-xs uppercase">Location</th><th className="px-4 py-3 text-left text-xs uppercase">Center</th><th className="px-4 py-3 text-left text-xs uppercase">Time</th><th className="px-4 py-3 text-left text-xs uppercase">Status</th></tr></thead>
            <tbody className="divide-y">
              {currentPageData.map((incident) => (
                <React.Fragment key={incident.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(incident.id)}>
                    <td className="px-4 py-3"><Info className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${getIncidentTypeBadge(incident.incidentType)}`}>{incident.incidentType || 'Unknown'}</span></td>
                    <td className="px-4 py-3 text-sm">{incident.location?.substring(0, 50)}</td>
                    <td className="px-4 py-3 text-sm">{incident.centerName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatRelativeTime(incident.logTime)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${incident.status === 'active' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800'}`}>{incident.status}</span></td>
                  </tr>
                  {expandedRows.has(incident.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div className="flex gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><p className="font-medium">Details</p><p>{incident.details || 'No details'}</p></div></div>
                          <div className="flex gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><div><p className="font-medium">Location</p><p>{incident.location}, {incident.city}, {incident.county}</p></div></div>
                          <div className="flex gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><div><p className="font-medium">Log Time</p><p>{incident.logTime ? new Date(incident.logTime).toLocaleString() : 'N/A'}</p></div></div>
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