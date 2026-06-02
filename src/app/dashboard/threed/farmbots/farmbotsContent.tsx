// src/app/dashboard/threed/farmbots/farmbotsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Info, Wifi, WifiOff, Battery, Activity, Cpu } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ModalConfirm } from '@/components/ui/modal-confirm';

interface FarmBot {
  farmbot: {
    id: number;
    deviceId: string;
    name: string;
    status: string;
    bedId: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    lastSeen: string;
    batteryLevel: number;
    firmwareVersion: string;
    isActive: boolean;
    notes: string;
    createdAt: string;
    updatedAt: string;
  };
  bed: { id: number; name: string };
}

interface BedOption {
  id: number;
  name: string;
}

function PaginationControls({ currentPage, totalPages, totalRecords, pageSize, onPageChange }: { 
  currentPage: number; totalPages: number; totalRecords: number; pageSize: number; onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-t bg-muted/30">
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft className="w-4 h-4 mr-1" /> Previous</Button>
      <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages} ({totalRecords} total farmbots)</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
    </div>
  );
}

const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function FarmBotsContent() {
  const { showToast, ToastComponent } = useToast();
  const [farmbots, setFarmbots] = useState<FarmBot[]>([]);
  const [filteredFarmbots, setFilteredFarmbots] = useState<FarmBot[]>([]);
  const [beds, setBeds] = useState<BedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFarmbot, setSelectedFarmbot] = useState<FarmBot | null>(null);
  const [formData, setFormData] = useState({ name: '', deviceId: '', status: 'offline', bedId: '', firmwareVersion: '', notes: '' });

  const fetchBeds = useCallback(async () => {
    const response = await fetch('/api/threed/beds?limit=500&showAll=true');
    const data = await response.json();
    if (data.success) setBeds(data.data.map((b: any) => ({ id: b.id, name: b.name })));
  }, []);

  const fetchFarmbots = useCallback(async () => {
    try { setLoading(true); const response = await fetch('/api/threed/farmbots?limit=500'); const data = await response.json(); if (data.success) setFarmbots(data.data); } 
    catch (err) { console.error(err); showToast('Failed to load farmbots', 'error'); } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchFarmbots(); fetchBeds(); }, [fetchFarmbots, fetchBeds]);

  useEffect(() => {
    let filtered = [...farmbots];
    if (searchTerm) filtered = filtered.filter(f => f.farmbot.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.farmbot.deviceId.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== 'all') filtered = filtered.filter(f => f.farmbot.status === statusFilter);
    setTotalRecords(filtered.length); setFilteredFarmbots(filtered); setCurrentPage(0);
  }, [farmbots, searchTerm, statusFilter]);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const getCurrentPageData = () => filteredFarmbots.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const toggleRowExpansion = (id: number) => { const newExpanded = new Set(expandedRows); if (newExpanded.has(id)) newExpanded.delete(id); else newExpanded.add(id); setExpandedRows(newExpanded); };
  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const handleAddFarmbot = async () => {
    try {
      const response = await fetch('/api/threed/farmbots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) { showToast('FarmBot added successfully', 'success'); setIsAddModalOpen(false); setFormData({ name: '', deviceId: '', status: 'offline', bedId: '', firmwareVersion: '', notes: '' }); fetchFarmbots(); }
      else showToast('Failed to add farmbot', 'error');
    } catch (error) { showToast('Failed to add farmbot', 'error'); }
  };

  const handleUpdateFarmbot = async () => {
    if (!selectedFarmbot) return;
    try {
      const response = await fetch(`/api/threed/farmbots?id=${selectedFarmbot.farmbot.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) { showToast('FarmBot updated successfully', 'success'); setIsEditModalOpen(false); setSelectedFarmbot(null); fetchFarmbots(); }
      else showToast('Failed to update farmbot', 'error');
    } catch (error) { showToast('Failed to update farmbot', 'error'); }
  };

  const handleDeleteFarmbot = async () => {
    if (!selectedFarmbot) return;
    try {
      const response = await fetch(`/api/threed/farmbots?id=${selectedFarmbot.farmbot.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) { showToast('FarmBot deleted successfully', 'success'); setIsDeleteModalOpen(false); setSelectedFarmbot(null); fetchFarmbots(); }
      else showToast('Failed to delete farmbot', 'error');
    } catch (error) { showToast('Failed to delete farmbot', 'error'); }
  };

  const openEditModal = (farmbot: FarmBot) => { setSelectedFarmbot(farmbot); setFormData({ name: farmbot.farmbot.name, deviceId: farmbot.farmbot.deviceId, status: farmbot.farmbot.status, bedId: String(farmbot.farmbot.bedId || ''), firmwareVersion: farmbot.farmbot.firmwareVersion || '', notes: farmbot.farmbot.notes || '' }); setIsEditModalOpen(true); };
  const openDeleteModal = (farmbot: FarmBot) => { setSelectedFarmbot(farmbot); setIsDeleteModalOpen(true); };

  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleString() : 'Never';
  const getStatusBadge = (status: string) => {
    switch (status) { case 'online': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400'; case 'offline': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'; case 'maintenance': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400'; default: return 'bg-gray-100 dark:bg-gray-800'; }
  };
  const getStatusIcon = (status: string) => status === 'online' ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-gray-500" />;

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const onlineCount = farmbots.filter(f => f.farmbot.status === 'online').length;

  return (
    <div className="space-y-6">
      {ToastComponent}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h1 className="text-2xl font-bold">FarmBots</h1><p className="text-sm text-muted-foreground">{totalRecords} total farmbots • {currentPageData.length} on this page</p></div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Add FarmBot</Button>
          <div className="relative"><Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="text" placeholder="Search farmbots..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-48" /></div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg bg-background"><option value="all">All Status</option><option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Maintenance</option></select>
          <Button size="sm" onClick={fetchFarmbots}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs">Total Devices</p><p className="text-2xl font-bold">{totalRecords}</p></div><Cpu className="w-5 h-5" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs">Online</p><p className="text-2xl font-bold text-green-600">{onlineCount}</p></div><Wifi className="w-5 h-5 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs">Offline</p><p className="text-2xl font-bold text-gray-500">{totalRecords - onlineCount}</p></div><WifiOff className="w-5 h-5 text-gray-500" /></div></CardContent></Card>
      </div>

      <Card>
        {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b"><tr><th className="px-4 py-3 w-8"></th><th className="px-4 py-3 text-left text-xs uppercase">Name</th><th className="px-4 py-3 text-left text-xs uppercase">Device ID</th><th className="px-4 py-3 text-left text-xs uppercase">Status</th><th className="px-4 py-3 text-left text-xs uppercase">Bed</th><th className="px-4 py-3 text-left text-xs uppercase">Last Seen</th><th className="px-4 py-3 text-left text-xs uppercase">Battery</th><th className="px-4 py-3 text-left text-xs uppercase">Actions</th></tr></thead>
            <tbody className="divide-y">
              {currentPageData.map((item) => (
                <React.Fragment key={item.farmbot.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.farmbot.id)}><Info className="w-4 h-4 text-muted-foreground cursor-pointer" /></td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.farmbot.id)}><div className="flex items-center gap-2">{getStatusIcon(item.farmbot.status)}<span className="font-medium">{item.farmbot.name}</span></div></td>
                    <td className="px-4 py-3 text-sm font-mono" onClick={() => toggleRowExpansion(item.farmbot.id)}>{item.farmbot.deviceId}</td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.farmbot.id)}><span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(item.farmbot.status)}`}>{item.farmbot.status}</span></td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.farmbot.id)}>{item.bed?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground" onClick={() => toggleRowExpansion(item.farmbot.id)}>{formatDate(item.farmbot.lastSeen)}</td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.farmbot.id)}><div className="flex items-center gap-1"><Battery className="w-4 h-4" /><span>{safeParseFloat(item.farmbot.batteryLevel)}%</span></div></td>
                    <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEditModal(item)}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => openDeleteModal(item)}><Trash2 className="w-4 h-4" /></Button></div></td>
                  </tr>
                  {expandedRows.has(item.farmbot.id) && (
                    <tr className="bg-muted/30"><td colSpan={8} className="px-4 py-3"><div className="text-sm space-y-2"><div className="grid grid-cols-2 gap-4"><div><p className="font-medium">Firmware Version</p><p>{item.farmbot.firmwareVersion || 'Unknown'}</p></div><div><p className="font-medium">3D Position</p><p className="font-mono text-xs">X: {safeParseFloat(item.farmbot.positionX)}, Y: {safeParseFloat(item.farmbot.positionY)}, Z: {safeParseFloat(item.farmbot.positionZ)}</p></div></div>{item.farmbot.notes && <div><p className="font-medium">Notes</p><p>{item.farmbot.notes}</p></div>}<div><p className="font-medium">Created</p><p>{formatDate(item.farmbot.createdAt)}</p></div></div></td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />}
        {totalRecords === 0 && !loading && <div className="text-center py-12"><Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No farmbots configured</p><p className="text-sm mt-1">Add a FarmBot device to get started</p></div>}
      </Card>

      {/* Add/Edit/Delete Modals follow same pattern */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add FarmBot">
        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Garden Bot Alpha" required /></div>
          <div><Label>Device ID *</Label><Input value={formData.deviceId} onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })} placeholder="farmbot-001" required /></div>
          <div><Label>Status</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Maintenance</option></select></div>
          <div><Label>Bed (Optional)</Label><select value={formData.bedId} onChange={(e) => setFormData({ ...formData, bedId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="">None</option>{beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div><Label>Firmware Version</Label><Input value={formData.firmwareVersion} onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })} placeholder="v1.0.0" /></div>
          <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={handleAddFarmbot}>Add FarmBot</Button></div>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit FarmBot">
        <div className="space-y-4"><div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div><Label>Device ID *</Label><Input value={formData.deviceId} onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })} required /></div><div><Label>Status</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Maintenance</option></select></div><div><Label>Bed</Label><select value={formData.bedId} onChange={(e) => setFormData({ ...formData, bedId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="">None</option>{beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div><Label>Firmware Version</Label><Input value={formData.firmwareVersion} onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })} /></div><div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div><div className="flex justify-end gap-3 pt-4 border-t"><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button onClick={handleUpdateFarmbot}>Save Changes</Button></div></div>
      </Modal>

      <ModalConfirm isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteFarmbot} title="Delete FarmBot" message={`Are you sure you want to delete "${selectedFarmbot?.farmbot.name}"? This action cannot be undone.`} />
    </div>
  );
}