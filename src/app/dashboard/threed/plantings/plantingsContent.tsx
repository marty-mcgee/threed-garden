// src/app/dashboard/threed/plantings/plantingsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Info, Sprout, Calendar, MapPin, TrendingUp, Activity, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ModalConfirm } from '@/components/ui/modal-confirm';

interface Planting {
  planting: {
    id: number;
    plantingId: string;
    plantId: number;
    bedId: number;
    quantity: number;
    spacingInches: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    plantedDate: string;
    expectedGerminationDate: string;
    expectedHarvestDate: string;
    actualHarvestDate: string;
    status: string;
    growthStage: string;
    health: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  };
  plant: {
    id: number;
    commonName: string;
    scientificName: string;
    type: string;
    daysToMaturity: number;
  };
  bed: {
    id: number;
    name: string;
    shape: string;
  };
}

interface PlantOption {
  id: number;
  commonName: string;
}

interface BedOption {
  id: number;
  name: string;
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
          ({totalRecords} total plantings)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function PlantingsContent() {
  const { showToast, ToastComponent } = useToast();
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [filteredPlantings, setFilteredPlantings] = useState<Planting[]>([]);
  const [plants, setPlants] = useState<PlantOption[]>([]);
  const [beds, setBeds] = useState<BedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlanting, setSelectedPlanting] = useState<Planting | null>(null);
  const [formData, setFormData] = useState({
    plantId: '',
    bedId: '',
    quantity: 1,
    spacingInches: '',
    // plantedDate: new Date().toISOString().split('T')[0],
    plantedDate: new Date(), // Use Date object, not string
    status: 'planted',
    growthStage: 'seed',
    health: 'good',
    notes: '',
  });

  const fetchPlants = useCallback(async () => {
    const response = await fetch('/api/threed/plants?limit=500');
    const data = await response.json();
    if (data.success) {
      setPlants(data.data.map((p: any) => ({ id: p.id, commonName: p.commonName })));
    }
  }, []);

  const fetchBeds = useCallback(async () => {
    const response = await fetch('/api/threed/beds?limit=500&showAll=true');
    const data = await response.json();
    if (data.success) {
      setBeds(data.data.map((b: any) => ({ id: b.id, name: b.name })));
    }
  }, []);

  const fetchPlantings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/plantings?limit=500`);
      const data = await response.json();
      if (data.success) {
        setPlantings(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load plantings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { 
    fetchPlantings(); 
    fetchPlants();
    fetchBeds();
  }, [fetchPlantings, fetchPlants, fetchBeds]);

  useEffect(() => {
    let filtered = [...plantings];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.plant?.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bed?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.planting.status === statusFilter);
    }
    
    if (stageFilter !== 'all') {
      filtered = filtered.filter(p => p.planting.growthStage === stageFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredPlantings(filtered);
    setCurrentPage(0);
  }, [plantings, searchTerm, statusFilter, stageFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredPlantings.slice(start, end);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const handleAddPlanting = async () => {
    try {    // Format dates to ISO string
      // const payload = {
      //   ...formData,
      //   plantedDate: formData.plantedDate ? new Date(formData.plantedDate).toISOString() : null,
      //   expectedGerminationDate: formData.expectedGerminationDate ? new Date(formData.expectedGerminationDate).toISOString() : null,
      //   expectedHarvestDate: formData.expectedHarvestDate ? new Date(formData.expectedHarvestDate).toISOString() : null,
      // };
      const response = await fetch('/api/threed/plantings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Planting added successfully', 'success');
        setIsAddModalOpen(false);
        setFormData({
          plantId: '',
          bedId: '',
          quantity: 1,
          spacingInches: '',
          plantedDate: new Date().toISOString().split('T')[0],
          status: 'planted',
          growthStage: 'seed',
          health: 'good',
          notes: '',
        });
        fetchPlantings();
      } else {
        showToast('Failed to add planting', 'error');
      }
    } catch (error) {
      showToast('Failed to add planting', 'error');
    }
  };

  const handleUpdatePlanting = async () => {
    if (!selectedPlanting) return;
    try {
      const response = await fetch(`/api/threed/plantings?id=${selectedPlanting.planting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Planting updated successfully', 'success');
        setIsEditModalOpen(false);
        setSelectedPlanting(null);
        fetchPlantings();
      } else {
        showToast('Failed to update planting', 'error');
      }
    } catch (error) {
      showToast('Failed to update planting', 'error');
    }
  };

  const handleDeletePlanting = async () => {
    if (!selectedPlanting) return;
    try {
      const response = await fetch(`/api/threed/plantings?id=${selectedPlanting.planting.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        showToast('Planting deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedPlanting(null);
        fetchPlantings();
      } else {
        showToast('Failed to delete planting', 'error');
      }
    } catch (error) {
      showToast('Failed to delete planting', 'error');
    }
  };

  const openEditModal = (planting: Planting) => {
    setSelectedPlanting(planting);
    setFormData({
      plantId: String(planting.planting.plantId),
      bedId: String(planting.planting.bedId),
      quantity: planting.planting.quantity,
      spacingInches: String(planting.planting.spacingInches || ''),
      plantedDate: planting.planting.plantedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: planting.planting.status,
      growthStage: planting.planting.growthStage,
      health: planting.planting.health,
      notes: planting.planting.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (planting: Planting) => {
    setSelectedPlanting(planting);
    setIsDeleteModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planted': return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400';
      case 'growing': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'harvesting': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'harvested': return 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400';
      case 'failed': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'seed': return 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400';
      case 'seedling': return 'bg-lime-100 dark:bg-lime-950/50 text-lime-700 dark:text-lime-400';
      case 'vegetative': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'flowering': return 'bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-400';
      case 'fruiting': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      case 'mature': return 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const growingCount = plantings.filter(p => p.planting.status === 'growing').length;
  const harvestedCount = plantings.filter(p => p.planting.status === 'harvested').length;
  const totalPlants = plantings.reduce((sum, p) => sum + (p.planting.quantity || 0), 0);
  const uniqueBeds = new Set(plantings.map(p => p.planting.bedId)).size;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plantings</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total plantings • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Planting
          </Button>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by plant or bed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Status</option>
            <option value="planted">Planted</option>
            <option value="growing">Growing</option>
            <option value="harvesting">Harvesting</option>
            <option value="harvested">Harvested</option>
            <option value="failed">Failed</option>
          </select>
          
          <select 
            value={stageFilter} 
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Stages</option>
            <option value="seed">Seed</option>
            <option value="seedling">Seedling</option>
            <option value="vegetative">Vegetative</option>
            <option value="flowering">Flowering</option>
            <option value="fruiting">Fruiting</option>
            <option value="mature">Mature</option>
          </select>
          
          <Button size="sm" onClick={fetchPlantings}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Total Plantings</p><p className="text-2xl font-bold text-foreground">{totalRecords}</p></div><Sprout className="w-5 h-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Growing</p><p className="text-2xl font-bold text-green-600">{growingCount}</p></div><TrendingUp className="w-5 h-5 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Harvested</p><p className="text-2xl font-bold text-purple-600">{harvestedCount}</p></div><Activity className="w-5 h-5 text-purple-600" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Beds Used</p><p className="text-2xl font-bold text-blue-600">{uniqueBeds}</p></div><MapPin className="w-5 h-5 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">Plants in Ground</p><p className="text-2xl font-bold text-amber-600">{totalPlants}</p></div><Calendar className="w-5 h-5 text-amber-600" /></div></CardContent></Card>
      </div>

      <Card>
        {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr><th className="px-4 py-3 w-8"></th><th className="px-4 py-3 text-left text-xs uppercase">Plant</th><th className="px-4 py-3 text-left text-xs uppercase">Bed</th><th className="px-4 py-3 text-left text-xs uppercase">Quantity</th><th className="px-4 py-3 text-left text-xs uppercase">Status</th><th className="px-4 py-3 text-left text-xs uppercase">Growth Stage</th><th className="px-4 py-3 text-left text-xs uppercase">Health</th><th className="px-4 py-3 text-left text-xs uppercase">Planted</th><th className="px-4 py-3 text-left text-xs uppercase">Actions</th></tr></thead>
            <tbody className="divide-y">
              {currentPageData.map((item) => (
                <React.Fragment key={item.planting.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.planting.id)}><Info className="w-4 h-4 text-muted-foreground cursor-pointer" /></td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.planting.id)}><span className="font-medium">{item.plant?.commonName || 'Unknown'}</span>{item.plant?.scientificName && <span className="text-xs text-muted-foreground italic ml-1">({item.plant.scientificName})</span>}</td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.planting.id)}>{item.bed?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.planting.id)}>{item.planting.quantity || 1} plants</td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.planting.id)}><span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(item.planting.status)}`}>{item.planting.status}</span></td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.planting.id)}><span className={`px-2 py-1 text-xs rounded-full ${getStageBadge(item.planting.growthStage)}`}>{item.planting.growthStage}</span></td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.planting.id)}><Badge variant="outline">{item.planting.health}</Badge></td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.planting.id)}>{formatDate(item.planting.plantedDate)}</td>
                    <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEditModal(item)}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => openDeleteModal(item)}><Trash2 className="w-4 h-4" /></Button></div></td>
                  </tr>
                  {expandedRows.has(item.planting.id) && (
                    <tr className="bg-muted/30"><td colSpan={9} className="px-4 py-3"><div className="text-sm space-y-2"><div><p className="font-medium">Notes</p><p>{item.planting.notes || 'No notes'}</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2"><div><p className="font-medium">Spacing</p><p>{safeParseFloat(item.planting.spacingInches)}"</p></div><div><p className="font-medium">Expected Harvest</p><p>{formatDate(item.planting.expectedHarvestDate)}</p></div><div><p className="font-medium">3D Position</p><p className="font-mono text-xs">X: {safeParseFloat(item.planting.positionX)}, Z: {safeParseFloat(item.planting.positionZ)}</p></div><div><p className="font-medium">Days to Maturity</p><p>{item.plant?.daysToMaturity || 'N/A'} days</p></div></div></div></td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} pageSize={pageSize} onPageChange={handlePageChange} />}
        
        {totalRecords === 0 && !loading && <div className="text-center py-12 text-muted-foreground"><Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No plantings found</p><p className="text-sm mt-1">Create your first planting to get started</p></div>}
      </Card>

      {/* Add Planting Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Planting">
        <div className="space-y-4">
          <div><Label>Plant *</Label><select value={formData.plantId} onChange={(e) => setFormData({ ...formData, plantId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background" required><option value="">Select a plant...</option>{plants.map(p => <option key={p.id} value={p.id}>{p.commonName}</option>)}</select></div>
          <div><Label>Bed *</Label><select value={formData.bedId} onChange={(e) => setFormData({ ...formData, bedId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background" required><option value="">Select a bed...</option>{beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} min="1" /></div><div><Label>Spacing (inches)</Label><Input type="number" value={formData.spacingInches} onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })} /></div></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Planted Date</Label><Input type="date"  value={formData.plantedDate instanceof Date ? formData.plantedDate.toISOString().split('T')[0] : ''}
  onChange={(e) => setFormData({ ...formData, plantedDate: new Date(e.target.value) })} /></div><div><Label>Status</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="planted">Planted</option><option value="growing">Growing</option><option value="harvesting">Harvesting</option><option value="harvested">Harvested</option><option value="failed">Failed</option></select></div></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Growth Stage</Label><select value={formData.growthStage} onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="seed">Seed</option><option value="seedling">Seedling</option><option value="vegetative">Vegetative</option><option value="flowering">Flowering</option><option value="fruiting">Fruiting</option><option value="mature">Mature</option></select></div><div><Label>Health</Label><select value={formData.health} onChange={(e) => setFormData({ ...formData, health: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="dead">Dead</option></select></div></div>
          <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={handleAddPlanting}>Add Planting</Button></div>
        </div>
      </Modal>

      {/* Edit Planting Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Planting">
        <div className="space-y-4">
          <div><Label>Plant *</Label><select value={formData.plantId} onChange={(e) => setFormData({ ...formData, plantId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="">Select a plant...</option>{plants.map(p => <option key={p.id} value={p.id}>{p.commonName}</option>)}</select></div>
          <div><Label>Bed *</Label><select value={formData.bedId} onChange={(e) => setFormData({ ...formData, bedId: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="">Select a bed...</option>{beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} min="1" /></div><div><Label>Spacing (inches)</Label><Input type="number" value={formData.spacingInches} onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })} /></div></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Planted Date</Label><Input type="date" value={formData.plantedDate} onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })} /></div><div><Label>Status</Label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="planted">Planted</option><option value="growing">Growing</option><option value="harvesting">Harvesting</option><option value="harvested">Harvested</option><option value="failed">Failed</option></select></div></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Growth Stage</Label><select value={formData.growthStage} onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="seed">Seed</option><option value="seedling">Seedling</option><option value="vegetative">Vegetative</option><option value="flowering">Flowering</option><option value="fruiting">Fruiting</option><option value="mature">Mature</option></select></div><div><Label>Health</Label><select value={formData.health} onChange={(e) => setFormData({ ...formData, health: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background"><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="dead">Dead</option></select></div></div>
          <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button onClick={handleUpdatePlanting}>Save Changes</Button></div>
        </div>
      </Modal>

      <ModalConfirm isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeletePlanting} title="Delete Planting" message={`Are you sure you want to delete this planting? This action cannot be undone.`} />
    </div>
  );
}