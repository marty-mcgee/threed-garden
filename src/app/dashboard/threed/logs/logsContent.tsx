// src/app/dashboard/threed/logs/logsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Trash2, ChevronLeft, ChevronRight, Info, AlertCircle, CheckCircle, AlertTriangle, Info as InfoIcon, Calendar, Database, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ModalConfirm } from '@/components/ui/modal-confirm';

interface Log {
  id: number;
  level: string;
  source: string;
  message: string;
  details: any;
  loggedAt: string;
  createdAt: string;
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
          ({totalRecords} total logs)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function LogsContent() {
  const { showToast, ToastComponent } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/api/threed/logs?limit=1000${levelFilter !== 'all' ? `&level=${levelFilter}` : ''}${sourceFilter !== 'all' ? `&source=${sourceFilter}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [levelFilter, sourceFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/threed/logs/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/threed/logs?action=clear', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        showToast('All logs cleared successfully', 'success');
        setIsClearModalOpen(false);
        fetchLogs();
        fetchStats();
      } else {
        showToast('Failed to clear logs', 'error');
      }
    } catch (error) {
      showToast('Failed to clear logs', 'error');
    }
  };

  const handleDeleteLog = async () => {
    if (!selectedLog) return;
    try {
      const response = await fetch(`/api/threed/logs?id=${selectedLog.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Log entry deleted', 'success');
        setIsDeleteModalOpen(false);
        setSelectedLog(null);
        fetchLogs();
        fetchStats();
      } else {
        showToast('Failed to delete log', 'error');
      }
    } catch (error) {
      showToast('Failed to delete log', 'error');
    }
  };

  useEffect(() => { 
    fetchLogs(); 
    fetchStats();
  }, [fetchLogs, fetchStats]);

  useEffect(() => {
    let filtered = [...logs];
    
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.source?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setTotalRecords(filtered.length);
    setFilteredLogs(filtered);
    setCurrentPage(0);
  }, [logs, searchTerm]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredLogs.slice(start, end);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const getLevelIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <InfoIcon className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Database className="w-4 h-4 text-gray-500" />;
      default: return <InfoIcon className="w-4 h-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'info': return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400';
      case 'debug': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Logs</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total logs • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          
          <select 
            value={sourceFilter} 
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setIsClearModalOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear All
          </Button>
          
          <Button size="sm" onClick={fetchLogs}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
              </div>
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Last 24h</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.last24hCount || 0}</p>
              </div>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Errors (24h)</p>
                <p className="text-2xl font-bold text-red-600">{stats?.errorsLast24h || 0}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Info</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.byLevel?.find((l: any) => l.level === 'info')?.count || 0}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.byLevel?.find((l: any) => l.level === 'warning')?.count || 0}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
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
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left text-xs uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Message</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(log.id)}>
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(log.id)}>
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getLevelBadge(log.level)}`}>
                          {log.level || 'info'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(log.id)}>
                      <Badge variant="outline">{log.source || 'system'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate" onClick={() => toggleRowExpansion(log.id)}>
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground" onClick={() => toggleRowExpansion(log.id)}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(log.loggedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  {expandedRows.has(log.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div>
                            <p className="font-medium text-foreground">Full Message</p>
                            <p className="text-muted-foreground whitespace-pre-wrap">{log.message}</p>
                          </div>
                          {log.details && (
                            <div>
                              <p className="font-medium text-foreground">Details</p>
                              <pre className="text-xs text-muted-foreground bg-muted p-2 rounded-md overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="font-medium text-foreground">Log ID</p>
                              <p className="text-muted-foreground font-mono text-xs">{log.id}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Created</p>
                              <p className="text-muted-foreground">{formatDate(log.createdAt)}</p>
                            </div>
                          </div>
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
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No system logs found</p>
            <p className="text-sm mt-1">Logs will appear here as system events occur</p>
          </div>
        )}
      </Card>

      {/* Clear All Logs Confirmation Modal */}
      <ModalConfirm
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearLogs}
        title="Clear All Logs"
        message="Are you sure you want to clear ALL system logs? This action cannot be undone."
        confirmText="Clear All"
        variant="destructive"
      />

      {/* Delete Single Log Confirmation Modal */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteLog}
        title="Delete Log Entry"
        message={`Are you sure you want to delete this log entry? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}