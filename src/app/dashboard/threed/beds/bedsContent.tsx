// src/app/dashboard/threed/beds/bedsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Info, Square, Circle, RectangleHorizontal, Box, Ruler, Sun } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ModalConfirm } from '@/components/ui/modal-confirm';

interface Bed {
  id: number;
  bedId: string;
  name: string;
  description: string;
  shape: string;
  widthFeet: number | string;
  lengthFeet: number | string;
  squareFeet: number | string;
  heightFeet: number | string;
  soilType: string;
  sunExposure: string;
  positionX: number | string;
  positionY: number | string;
  positionZ: number | string;
  rotation: number | string;
  scale: number | string;
  isActive: boolean;
  color: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
          ({totalRecords} total beds)
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
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function BedsContent() {
  const { showToast, ToastComponent } = useToast();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [filteredBeds, setFilteredBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [shapeFilter, setShapeFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [formData, setFormData] = useState<Partial<Bed>>({
    shape: 'rectangle',
    isActive: true,
    color: '#8B5E3C',
    widthFeet: 4,
    lengthFeet: 8,
    heightFeet: 1,
  });

  const fetchBeds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/beds?limit=500&showAll=${showInactive}`);
      const data = await response.json();
      if (data.success) {
        setBeds(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load beds', 'error');
    } finally {
      setLoading(false);
    }
  }, [showInactive, showToast]);

  useEffect(() => { fetchBeds(); }, [fetchBeds]);

  useEffect(() => {
    let filtered = [...beds];
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (shapeFilter !== 'all') {
      filtered = filtered.filter(b => b.shape === shapeFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredBeds(filtered);
    setCurrentPage(0);
  }, [beds, searchTerm, shapeFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredBeds.slice(start, end);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const handleAddBed = async () => {
    try {
      const response = await fetch('/api/threed/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Bed added successfully', 'success');
        setIsAddModalOpen(false);
        setFormData({ shape: 'rectangle', isActive: true, color: '#8B5E3C', widthFeet: 4, lengthFeet: 8, heightFeet: 1 });
        fetchBeds();
      } else {
        showToast('Failed to add bed', 'error');
      }
    } catch (error) {
      showToast('Failed to add bed', 'error');
    }
  };

  const handleUpdateBed = async () => {
    if (!selectedBed) return;
    try {
      const { createdAt, updatedAt, ...cleanData } = formData;
      const response = await fetch(`/api/threed/beds?id=${selectedBed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Bed updated successfully', 'success');
        setIsEditModalOpen(false);
        setSelectedBed(null);
        setFormData({});
        fetchBeds();
      } else {
        showToast('Failed to update bed', 'error');
      }
    } catch (error) {
      showToast('Failed to update bed', 'error');
    }
  };

  const handleDeleteBed = async () => {
    if (!selectedBed) return;
    try {
      const response = await fetch(`/api/threed/beds?id=${selectedBed.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        showToast('Bed deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedBed(null);
        fetchBeds();
      } else {
        showToast('Failed to delete bed', 'error');
      }
    } catch (error) {
      showToast('Failed to delete bed', 'error');
    }
  };

  const openEditModal = (bed: Bed) => {
    setSelectedBed(bed);
    const { createdAt, updatedAt, ...cleanBed } = bed;
    setFormData(cleanBed);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (bed: Bed) => {
    setSelectedBed(bed);
    setIsDeleteModalOpen(true);
  };

  const getShapeIcon = (shape: string) => {
    switch (shape?.toLowerCase()) {
      case 'rectangle': return <RectangleHorizontal className="w-4 h-4 text-blue-600" />;
      case 'square': return <Square className="w-4 h-4 text-emerald-600" />;
      case 'circle': return <Circle className="w-4 h-4 text-purple-600" />;
      case 'raised': return <Box className="w-4 h-4 text-amber-600" />;
      default: return <Square className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate stats with safe parsing
  const totalSqFt = beds.reduce((sum, b) => sum + safeParseFloat(b.squareFeet), 0);
  const activeBeds = beds.filter(b => b.isActive).length;
  const fullSunBeds = beds.filter(b => b.sunExposure === 'Full Sun').length;

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Garden Beds</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total beds • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Bed
          </Button>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search beds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <select 
            value={shapeFilter} 
            onChange={(e) => setShapeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Shapes</option>
            <option value="rectangle">Rectangle</option>
            <option value="square">Square</option>
            <option value="circle">Circle</option>
            <option value="raised">Raised</option>
          </select>
          
          <Button 
            variant={showInactive ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
          
          <Button size="sm" onClick={fetchBeds}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Beds</p>
                <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
              </div>
              <Square className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Active Beds</p>
                <p className="text-2xl font-bold text-green-600">{activeBeds}</p>
              </div>
              <Eye className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Sq Ft</p>
                <p className="text-2xl font-bold text-blue-600">{totalSqFt.toFixed(0)}</p>
              </div>
              <Ruler className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Full Sun</p>
                <p className="text-2xl font-bold text-amber-600">{fullSunBeds}</p>
              </div>
              <Sun className="w-5 h-5 text-amber-600" />
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
                <th className="px-4 py-3 text-left text-xs uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Shape</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Dimensions</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Sq Ft</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Sun Exposure</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((bed) => (
                <React.Fragment key={bed.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(bed.id)}>
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(bed.id)}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        {getShapeIcon(bed.shape)}
                        <span className="font-medium">{bed.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(bed.id)}>
                      <Badge variant="outline" className="capitalize">{bed.shape || 'rectangle'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(bed.id)}>
                      {safeParseFloat(bed.widthFeet)}' × {safeParseFloat(bed.lengthFeet)}'
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(bed.id)}>
                      {safeParseFloat(bed.squareFeet).toFixed(0)} sq ft
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(bed.id)}>
                      {bed.sunExposure || '—'}
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(bed.id)}>
                      <span className={`px-2 py-1 text-xs rounded-full ${bed.isActive ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {bed.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(bed)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(bed)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(bed.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div>
                            <p className="font-medium text-foreground">Description</p>
                            <p className="text-muted-foreground">{bed.description || 'No description available'}</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                            <div>
                              <p className="font-medium text-foreground">Height</p>
                              <p className="text-muted-foreground">{safeParseFloat(bed.heightFeet)} ft</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Soil Type</p>
                              <p className="text-muted-foreground">{bed.soilType || '—'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Color</p>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: bed.color || '#8B5E3C' }} />
                                <span className="text-muted-foreground">{bed.color || '#8B5E3C'}</span>
                              </div>
                            </div>
                          </div>
                          {bed.notes && (
                            <div>
                              <p className="font-medium text-foreground">Notes</p>
                              <p className="text-muted-foreground">{bed.notes}</p>
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
            <Square className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No garden beds found</p>
            <p className="text-sm mt-1">Create your first garden bed to get started</p>
          </div>
        )}
      </Card>

      {/* Add Bed Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Garden Bed">
        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Vegetable Bed"
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Shape</Label>
              <select
                value={formData.shape || 'rectangle'}
                onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="rectangle">Rectangle</option>
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="raised">Raised</option>
              </select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color || '#8B5E3C'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16"
                />
                <Input
                  value={formData.color || '#8B5E3C'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#8B5E3C"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Width (feet)</Label>
              <Input
                type="number"
                value={formData.widthFeet || 4}
                onChange={(e) => setFormData({ ...formData, widthFeet: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Length (feet)</Label>
              <Input
                type="number"
                value={formData.lengthFeet || 8}
                onChange={(e) => setFormData({ ...formData, lengthFeet: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Height (feet)</Label>
              <Input
                type="number"
                value={formData.heightFeet || 1}
                onChange={(e) => setFormData({ ...formData, heightFeet: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Sun Exposure</Label>
              <select
                value={formData.sunExposure || ''}
                onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Select...</option>
                <option value="Full Sun">Full Sun</option>
                <option value="Partial Sun">Partial Sun</option>
                <option value="Partial Shade">Partial Shade</option>
                <option value="Full Shade">Full Shade</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Soil Type</Label>
            <Input
              value={formData.soilType || ''}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              placeholder="e.g., Loam, Clay, Sandy"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBed}>Add Bed</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Bed Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Garden Bed">
        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Shape</Label>
              <select
                value={formData.shape || 'rectangle'}
                onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="rectangle">Rectangle</option>
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="raised">Raised</option>
              </select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color || '#8B5E3C'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16"
                />
                <Input
                  value={formData.color || '#8B5E3C'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Width (feet)</Label>
              <Input
                type="number"
                value={formData.widthFeet || 4}
                onChange={(e) => setFormData({ ...formData, widthFeet: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Length (feet)</Label>
              <Input
                type="number"
                value={formData.lengthFeet || 8}
                onChange={(e) => setFormData({ ...formData, lengthFeet: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Height (feet)</Label>
              <Input
                type="number"
                value={formData.heightFeet || 1}
                onChange={(e) => setFormData({ ...formData, heightFeet: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Sun Exposure</Label>
              <select
                value={formData.sunExposure || ''}
                onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Select...</option>
                <option value="Full Sun">Full Sun</option>
                <option value="Partial Sun">Partial Sun</option>
                <option value="Partial Shade">Partial Shade</option>
                <option value="Full Shade">Full Shade</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Soil Type</Label>
            <Input
              value={formData.soilType || ''}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateBed}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteBed}
        title="Delete Bed"
        message={`Are you sure you want to delete "${selectedBed?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}