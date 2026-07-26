// components/admin/threed/beds/ThreeDBedsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Layout,
  MoreHorizontal,
  Search,
  Filter,
  Ruler,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

// ✅ Import types from lib
import {
  ThreeDBed,
  BedShape,
  BED_SHAPE_OPTIONS,
} from '@/lib/types/threed';

interface ThreeDBedsCRUDProps {
  threedId?: number;
  onModuleUpdate?: () => void;
}

// ✅ Helper to generate bed ID
const generateBedId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `bed_${timestamp}_${random}`;
};

export function ThreeDBedsCRUD({ threedId, onModuleUpdate }: ThreeDBedsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [beds, setBeds] = useState<ThreeDBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBed, setEditingBed] = useState<ThreeDBed | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShape, setFilterShape] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ✅ Form state - matches schema field names exactly
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shape: BedShape.RECTANGLE,
    widthFeet: '',
    lengthFeet: '',
    heightFeet: '',
    soilType: '',
    sunExposure: '',
    positionX: '',
    positionY: '',
    positionZ: '',
    rotation: '',
    scale: '',
    color: '#8B5E3C',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchBeds();
  }, [threedId]);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterShape !== 'all') params.append('shape', filterShape);
      if (filterStatus !== 'all') params.append('isActive', filterStatus === 'active' ? 'true' : 'false');

      const response = await fetch(`/api/threed/beds?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // ✅ Ensure we're setting the data correctly
        setBeds(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch beds', 'error');
        setBeds([]);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      showToast('Failed to fetch beds', 'error');
      setBeds([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBeds = beds.filter((bed) =>
    bed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bed.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.name) {
      showToast('Bed name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ Build payload with correct field names matching schema
      const payload: any = {
        bedId: generateBedId(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        shape: formData.shape,
        widthFeet: formData.widthFeet ? parseFloat(formData.widthFeet) : null,
        lengthFeet: formData.lengthFeet ? parseFloat(formData.lengthFeet) : null,
        heightFeet: formData.heightFeet ? parseFloat(formData.heightFeet) : null,
        soilType: formData.soilType?.trim() || null,
        sunExposure: formData.sunExposure?.trim() || null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        rotation: formData.rotation ? parseFloat(formData.rotation) : 0,
        scale: formData.scale ? parseFloat(formData.scale) : 1,
        color: formData.color || '#8B5E3C',
        notes: formData.notes?.trim() || null,
        isActive: formData.isActive,
      };

      console.log('[Beds] Creating with payload:', payload);

      const response = await fetch('/api/threed/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Bed created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchBeds();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create bed', 'error');
      }
    } catch (error) {
      console.error('Error creating bed:', error);
      showToast('Failed to create bed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingBed) {
      showToast('No bed selected to edit', 'error');
      return;
    }
    
    if (!formData.name) {
      showToast('Bed name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ Build payload with correct field names matching schema
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        shape: formData.shape,
        widthFeet: formData.widthFeet ? parseFloat(formData.widthFeet) : null,
        lengthFeet: formData.lengthFeet ? parseFloat(formData.lengthFeet) : null,
        heightFeet: formData.heightFeet ? parseFloat(formData.heightFeet) : null,
        soilType: formData.soilType?.trim() || null,
        sunExposure: formData.sunExposure?.trim() || null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        rotation: formData.rotation ? parseFloat(formData.rotation) : 0,
        scale: formData.scale ? parseFloat(formData.scale) : 1,
        color: formData.color || '#8B5E3C',
        notes: formData.notes?.trim() || null,
        isActive: formData.isActive,
      };

      console.log('[Beds] Updating bed:', editingBed.id, 'with payload:', payload);

      const response = await fetch(`/api/threed/beds?id=${editingBed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Bed updated successfully', 'success');
        setEditingBed(null);
        await fetchBeds();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update bed', 'error');
      }
    } catch (error) {
      console.error('Error updating bed:', error);
      showToast('Failed to update bed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete bed "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/beds?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Bed deleted successfully', 'success');
        await fetchBeds();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete bed', 'error');
      }
    } catch (error) {
      console.error('Error deleting bed:', error);
      showToast('Failed to delete bed', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shape: BedShape.RECTANGLE,
      widthFeet: '',
      lengthFeet: '',
      heightFeet: '',
      soilType: '',
      sunExposure: '',
      positionX: '',
      positionY: '',
      positionZ: '',
      rotation: '',
      scale: '',
      color: '#8B5E3C',
      notes: '',
      isActive: true,
    });
  };

  const openEditDialog = (bed: ThreeDBed) => {
    console.log('[Beds] Opening edit dialog for bed:', bed);
    setEditingBed(bed);
    setFormData({
      name: bed.name || '',
      description: bed.description || '',
      shape: bed.shape || BedShape.RECTANGLE,
      widthFeet: bed.widthFeet !== null && bed.widthFeet !== undefined ? String(bed.widthFeet) : '',
      lengthFeet: bed.lengthFeet !== null && bed.lengthFeet !== undefined ? String(bed.lengthFeet) : '',
      heightFeet: bed.heightFeet !== null && bed.heightFeet !== undefined ? String(bed.heightFeet) : '',
      soilType: bed.soilType || '',
      sunExposure: bed.sunExposure || '',
      positionX: bed.positionX !== null && bed.positionX !== undefined ? String(bed.positionX) : '',
      positionY: bed.positionY !== null && bed.positionY !== undefined ? String(bed.positionY) : '',
      positionZ: bed.positionZ !== null && bed.positionZ !== undefined ? String(bed.positionZ) : '',
      rotation: bed.rotation !== null && bed.rotation !== undefined ? String(bed.rotation) : '',
      scale: bed.scale !== null && bed.scale !== undefined ? String(bed.scale) : '',
      color: bed.color || '#8B5E3C',
      notes: bed.notes || '',
      isActive: bed.isActive !== undefined ? bed.isActive : true,
    });
  };

  const getShapeLabel = (shape: string) => {
    const option = BED_SHAPE_OPTIONS.find((s) => s.value === shape);
    return option ? option.label : shape;
  };

  const renderActions = (bed: ThreeDBed) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(bed)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {bed.bedId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">ID: {bed.bedId}</span>
            </DropdownMenuItem>
          )}
          {bed.squareFeet && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">{bed.squareFeet} sq ft</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(bed.id, bed.name)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Beds</span>
          <Badge variant="secondary" className="text-xs">
            {filteredBeds.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Bed
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bed</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Bed Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., North Garden Bed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Bed description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="shape">Shape</Label>
                <Select
                  value={formData.shape}
                  onValueChange={(value) => setFormData({ ...formData, shape: value as BedShape })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shape" />
                  </SelectTrigger>
                  <SelectContent>
                    {BED_SHAPE_OPTIONS.map((shape) => (
                      <SelectItem key={shape.value} value={shape.value}>
                        {shape.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="widthFeet">Width (ft)</Label>
                  <Input
                    id="widthFeet"
                    type="number"
                    step="0.5"
                    placeholder="4"
                    value={formData.widthFeet}
                    onChange={(e) => setFormData({ ...formData, widthFeet: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="lengthFeet">Length (ft)</Label>
                  <Input
                    id="lengthFeet"
                    type="number"
                    step="0.5"
                    placeholder="8"
                    value={formData.lengthFeet}
                    onChange={(e) => setFormData({ ...formData, lengthFeet: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="heightFeet">Height (ft)</Label>
                  <Input
                    id="heightFeet"
                    type="number"
                    step="0.5"
                    placeholder="1"
                    value={formData.heightFeet}
                    onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Input
                    id="soilType"
                    placeholder="e.g., Loamy"
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="sunExposure">Sun Exposure</Label>
                  <Input
                    id="sunExposure"
                    placeholder="e.g., Full Sun"
                    value={formData.sunExposure}
                    onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">3D Positioning</Label>
                <div className="grid grid-cols-3 gap-4 mt-1">
                  <div>
                    <Label htmlFor="positionX" className="text-[10px]">X</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionY" className="text-[10px]">Y</Label>
                    <Input
                      id="positionY"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionZ" className="text-[10px]">Z</Label>
                    <Input
                      id="positionZ"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rotation">Rotation</Label>
                  <Input
                    id="rotation"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.rotation}
                    onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="scale">Scale</Label>
                  <Input
                    id="scale"
                    type="number"
                    step="0.1"
                    placeholder="1"
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 p-1"
                    disabled={isSubmitting}
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#8B5E3C"
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Bed'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search beds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterShape} onValueChange={setFilterShape}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Shape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shapes</SelectItem>
            {BED_SHAPE_OPTIONS.map((shape) => (
              <SelectItem key={shape.value} value={shape.value}>
                {shape.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterShape('all');
            setFilterStatus('all');
            fetchBeds();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Beds Table */}
      {filteredBeds.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No beds found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first bed
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Shape</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Dimensions</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeds.map((bed) => (
                <TableRow key={bed.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bed.color || '#8B5E3C' }}
                      />
                      {bed.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {getShapeLabel(bed.shape)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {bed.widthFeet && bed.lengthFeet ? (
                      <div className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {bed.widthFeet}′ × {bed.lengthFeet}′
                        {bed.squareFeet && (
                          <span className="text-muted-foreground/60 ml-1">
                            ({bed.squareFeet} sq ft)
                          </span>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {bed.isActive ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-700">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(bed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBed} onOpenChange={(open) => !open && setEditingBed(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-name">Bed Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-shape">Shape</Label>
              <Select
                value={formData.shape}
                onValueChange={(value) => setFormData({ ...formData, shape: value as BedShape })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {BED_SHAPE_OPTIONS.map((shape) => (
                    <SelectItem key={shape.value} value={shape.value}>
                      {shape.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-widthFeet">Width (ft)</Label>
                <Input
                  id="edit-widthFeet"
                  type="number"
                  step="0.5"
                  value={formData.widthFeet}
                  onChange={(e) => setFormData({ ...formData, widthFeet: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-lengthFeet">Length (ft)</Label>
                <Input
                  id="edit-lengthFeet"
                  type="number"
                  step="0.5"
                  value={formData.lengthFeet}
                  onChange={(e) => setFormData({ ...formData, lengthFeet: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-heightFeet">Height (ft)</Label>
                <Input
                  id="edit-heightFeet"
                  type="number"
                  step="0.5"
                  value={formData.heightFeet}
                  onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-soilType">Soil Type</Label>
                <Input
                  id="edit-soilType"
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-sunExposure">Sun Exposure</Label>
                <Input
                  id="edit-sunExposure"
                  value={formData.sunExposure}
                  onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">3D Positioning</Label>
              <div className="grid grid-cols-3 gap-4 mt-1">
                <div>
                  <Label htmlFor="edit-positionX" className="text-[10px]">X</Label>
                  <Input
                    id="edit-positionX"
                    type="number"
                    step="0.1"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionY" className="text-[10px]">Y</Label>
                  <Input
                    id="edit-positionY"
                    type="number"
                    step="0.1"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionZ" className="text-[10px]">Z</Label>
                  <Input
                    id="edit-positionZ"
                    type="number"
                    step="0.1"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-rotation">Rotation</Label>
                <Input
                  id="edit-rotation"
                  type="number"
                  step="0.1"
                  value={formData.rotation}
                  onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-scale">Scale</Label>
                <Input
                  id="edit-scale"
                  type="number"
                  step="0.1"
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 p-1"
                  disabled={isSubmitting}
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <Button onClick={handleUpdate} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}