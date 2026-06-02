// src/app/dashboard/threed/harvests/harvestsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Info, Calendar, Weight, Package, Apple, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ModalConfirm } from '@/components/ui/modal-confirm';

interface Harvest {
  harvest: {
    id: number;
    harvestId: string;
    plantingId: number;
    plantId: number;
    quantity: number;
    unit: string;
    weightLbs: number;
    harvestDate: string;
    notes: string;
    imageUrl: string;
    createdAt: string;
  };
  planting: { id: number; plantingId: string };
  plant: { id: number; commonName: string; type: string };
  bed: { id: number; name: string };
}

function PaginationControls({ currentPage, totalPages, totalRecords, pageSize, onPageChange }: { 
  currentPage: number; totalPages: number; totalRecords: number; pageSize: number; onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-t bg-muted/30">
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft className="w-4 h-4 mr-1" /> Previous</Button>
      <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages} ({totalRecords} total harvests)</span>
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

export default function HarvestsContent() {
  const { showToast, ToastComponent } = useToast();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [filteredHarvests, setFilteredHarvests] = useState<Harvest[]>([]);
  const [plants, setPlants] = useState<{ id: number; commonName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantFilter, setPlantFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);
  const [formData, setFormData] = useState({ plantId: '', quantity: 1, unit: 'lbs', weightLbs: '', harvestDate: new Date().toISOString().split('T')[0], notes: '' });

  const fetchPlants = useCallback(async () => {
    const response = await fetch('/api/threed/plants?limit=500');
    const data = await response.json();
    if (data.success) setPlants(data.data.map((p: any) => ({ id: p.id, commonName: p.commonName })));
  }, []);

  const fetchHarvests = useCallback(async () => {
    try { setLoading(true); const response = await fetch('/api/threed/harvests?limit=500'); const data = await response.json(); if (data.success) setHarvests(data.data); } 
    catch (err) { console.error(err); showToast('Failed to load harvests', 'error'); } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchHarvests(); fetchPlants(); }, [fetchHarvests, fetchPlants]);

  useEffect(() => {
    let filtered = [...harvests];
    if (searchTerm) filtered = filtered.filter(h => h.plant?.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) || h.bed?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (plantFilter !== 'all') filtered = filtered.filter(h => h.plant?.type === plantFilter);
    setTotalRecords(filtered.length); setFilteredHarvests(filtered); setCurrentPage(0);
  }, [harvests, searchTerm, plantFilter]);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const getCurrentPageData = () => filteredHarvests.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const toggleRowExpansion = (id: number) => { const newExpanded = new Set(expandedRows); if (newExpanded.has(id)) newExpanded.delete(id); else newExpanded.add(id); setExpandedRows(newExpanded); };
  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const handleAddHarvest = async () => {
    try {
      const response = await fetch('/api/threed/harvests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) { showToast('Harvest recorded successfully', 'success'); setIsAddModalOpen(false); setFormData({ plantId: '', quantity: 1, unit: 'lbs', weightLbs: '', harvestDate: new Date().toISOString().split('T')[0], notes: '' }); fetchHarvests(); }
      else showToast('Failed to record harvest', 'error');
    } catch (error) { showToast('Failed to record harvest', 'error'); }
  };

  const handleUpdateHarvest = async () => {
    if (!selectedHarvest) return;
    try {
      const response = await fetch(`/api/threed/harvests?id=${selectedHarvest.harvest.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) { showToast('Harvest updated successfully', 'success'); setIsEditModalOpen(false); setSelectedHarvest(null); fetchHarvests(); }
      else showToast('Failed to update harvest', 'error');
    } catch (error) { showToast('Failed to update harvest', 'error'); }
  };

  const handleDeleteHarvest = async () => {
    if (!selectedHarvest) return;
    try {
      const response = await fetch(`/api/threed/harvests?id=${selectedHarvest.harvest.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) { showToast('Harvest deleted successfully', 'success'); setIsDeleteModalOpen(false); setSelectedHarvest(null); fetchHarvests(); }
      else showToast('Failed to delete harvest', 'error');
    } catch (error) { showToast('Failed to delete harvest', 'error'); }
  };

  const openEditModal = (harvest: Harvest) => { setSelectedHarvest(harvest); setFormData({ plantId: String(harvest.harvest.plantId), quantity: harvest.harvest.quantity, unit: harvest.harvest.unit, weightLbs: String(harvest.harvest.weightLbs || ''), harvestDate: harvest.harvest.harvestDate?.split('T')[0] || new Date().toISOString().split('T')[0], notes: harvest.harvest.notes || '' }); setIsEditModalOpen(true); };
  const openDeleteModal = (harvest: Harvest) => { setSelectedHarvest(harvest); setIsDeleteModalOpen(true); };

  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const totalWeight = harvests.reduce((sum, h) => sum + safeParseFloat(h.harvest.weightLbs), 0);
  const totalQuantity = harvests.reduce((sum, h) => sum + (h.harvest.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {ToastComponent}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h1 className="text-2xl font-bold">Harvests</h1><p className="text-sm text-muted-foreground">{totalRecords} total harvests • {currentPageData.length} on this page</p></div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Record Harvest</Button>
          <div className="relative"><Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="text" placeholder="Search harvests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-48" /></div>
          <select value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg bg-background"><option value="all">All Plants</option><option value="Vegetable">Vegetables</option><option value="Fruit">Fruits</option><option value="Herb">Herbs</option></select>
          <Button size="sm" onClick={fetchHarvests}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs">Total Harvests</p><p className="text-2xl font-bold">{totalRecords}</p></div><Apple className="w-5 h-5" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs">Total Weight</p><p className="text-2xl font-bold text-green-600">{totalWeight.toFixed(1)} lbs</p></div><Weight className="w-5 h-5 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs">Total Items</p><p className="text-2xl font-bold text-blue-600">{totalQuantity}</p></div><Package className="w-5 h-5 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs">Avg per Harvest</p><p className="text-2xl font-bold text-purple-600">{(totalWeight / (totalRecords || 1)).toFixed(1)} lbs</p></div><TrendingUp className="w-5 h-5 text-purple-600" /></div></CardContent></Card>
      </div>

      <Card>
        {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b"><tr><th className="px-4 py-3 w-8"></th><th className="px-4 py-3 text-left text-xs uppercase">Plant</th><th className="px-4 py-3 text-left text-xs uppercase">Bed</th><th className="px-4 py-3 text-left text-xs uppercase">Quantity</th><th className="px-4 py-3 text-left text-xs uppercase">Weight</th><th className="px-4 py-3 text-left text-xs uppercase">Harvest Date</th><th className="px-4 py-3 text-left text-xs uppercase">Unit</th><th className="px-4 py-3 text-left text-xs uppercase">Actions</th></tr></thead>
            <tbody className="divide-y">
              {currentPageData.map((item) => (
                <React.Fragment key={item.harvest.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.harvest.id)}><Info className="w-4 h-4 text-muted-foreground cursor-pointer" /></td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.harvest.id)}><span className="font-medium">{item.plant?.commonName || 'Unknown'}</span>{item.plant?.type && <Badge variant="outline" className="ml-2">{item.plant.type}</Badge>}</td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.harvest.id)}>{item.bed?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.harvest.id)}>{item.harvest.quantity || 1}</td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.harvest.id)}>{safeParseFloat(item.harvest.weightLbs).toFixed(1)} lbs</td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.harvest.id)}>{formatDate(item.harvest.harvestDate)}</td>
                    <td className="px-4 py-3 text-sm capitalize">{item.harvest.unit || 'each'}</td>
                    <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEditModal(item)}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => openDeleteModal(item)}><Trash2 className="w-4 h-4" /></Button></div></td>
                  </tr>
                  {expandedRows.has(item.harvest.id) && (
                    <tr className="bg-muted/30"><td colSpan={8} className="px-4 py-3"><div className="text-sm space-y-2"><div><p className="font-medium">Notes</p><p>{item.harvest.notes || 'No notes'}</p></div><div className="grid grid-cols-2 gap-4"><div><p className="font-medium">Harvest ID</p><p className="font-mono text-xs">{item.harvest.harvestId}</p></div><div><p className="font-medium">Recorded</p><p>{formatDate(item.harvest.createdAt)}</p></div></div></div></td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />}
        {totalRecords === 0 && !loading && <div className="text-center py-12"><Apple className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No harvests recorded yet</p><p className="text-sm mt-1">Start tracking your garden yields</p></div>}
      </Card>

      {/* Add Harvest Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Harvest">
        <div className="space-y-4">
          <div><Label>Plant *</Label><select value={formData.plantId} onChange={(e) => setFormData({ ...formData, plantId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background" required><option value="">Select a plant...</option>{plants.map(p => <option key={p.id} value={p.id}>{p.commonName}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} min="1" /></div><div><Label>Unit</Label><select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="lbs">Pounds (lbs)</option><option value="oz">Ounces (oz)</option><option value="each">Each</option><option value="bunch">Bunch</option></select></div></div>
          <div><Label>Weight (lbs)</Label><Input type="number" step="0.1" value={formData.weightLbs} onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })} /></div>
          <div><Label>Harvest Date</Label><Input type="date" value={formData.harvestDate} onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })} /></div>
          <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={handleAddHarvest}>Record Harvest</Button></div>
        </div>
      </Modal>

      <ModalConfirm isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteHarvest} title="Delete Harvest" message="Are you sure you want to delete this harvest record? This action cannot be undone." />
    </div>
  );
}