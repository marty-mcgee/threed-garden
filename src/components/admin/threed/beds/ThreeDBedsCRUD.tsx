// components/admin/threed/beds/ThreeDBedsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Loader2, CheckCircle, XCircle, 
  Square, MoreHorizontal, ExternalLink 
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
import { useToast } from '@/components/ui/toast';
import { useSession } from 'next-auth/react';

interface Bed {
  id: number;
  userId: string;
  bedId: string;
  name: string;
  description: string;
  shape: string;
  widthFeet: number;
  lengthFeet: number;
  heightFeet: number;
  soilType: string;
  sunExposure: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scale: number;
  color: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ThreeDBedsCRUDProps {
  onModuleUpdate?: () => void;
}

export function ThreeDBedsCRUD({ onModuleUpdate }: ThreeDBedsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const { data: session } = useSession();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [formData, setFormData] = useState({
    bedId: '',
    name: '',
    description: '',
    shape: 'rectangle',
    widthFeet: '',
    lengthFeet: '',
    heightFeet: '1',
    soilType: '',
    sunExposure: '',
    positionX: '0',
    positionY: '0',
    positionZ: '0',
    rotation: '0',
    scale: '1',
    color: '#8B5E3C',
    notes: '',
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchBeds();
    }
  }, [session]);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/beds');
      const data = await response.json();
      if (data.success) {
        setBeds(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch beds', 'error');
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      showToast('Failed to fetch beds', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.bedId || !formData.name) {
      showToast('Bed ID and name are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/threed/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Bed created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          bedId: '',
          name: '',
          description: '',
          shape: 'rectangle',
          widthFeet: '',
          lengthFeet: '',
          heightFeet: '1',
          soilType: '',
          sunExposure: '',
          positionX: '0',
          positionY: '0',
          positionZ: '0',
          rotation: '0',
          scale: '1',
          color: '#8B5E3C',
          notes: '',
        });
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
    if (!editingBed) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threed/beds?id=${editingBed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openEditDialog = (bed: Bed) => {
    setEditingBed(bed);
    setFormData({
      bedId: bed.bedId,
      name: bed.name,
      description: bed.description || '',
      shape: bed.shape || 'rectangle',
      widthFeet: bed.widthFeet?.toString() || '',
      lengthFeet: bed.lengthFeet?.toString() || '',
      heightFeet: bed.heightFeet?.toString() || '1',
      soilType: bed.soilType || '',
      sunExposure: bed.sunExposure || '',
      positionX: bed.positionX?.toString() || '0',
      positionY: bed.positionY?.toString() || '0',
      positionZ: bed.positionZ?.toString() || '0',
      rotation: bed.rotation?.toString() || '0',
      scale: bed.scale?.toString() || '1',
      color: bed.color || '#8B5E3C',
      notes: bed.notes || '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Square className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold">Beds</h3>
          <Badge variant="secondary" className="ml-2">
            {beds.length} {beds.length === 1 ? 'bed' : 'beds'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Bed
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bed</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedId">Bed ID *</Label>
                  <Input
                    id="bedId"
                    placeholder="e.g., BED-001"
                    value={formData.bedId}
                    onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Garden Bed"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="widthFeet">Width (feet)</Label>
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
                  <Label htmlFor="lengthFeet">Length (feet)</Label>
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
                  <Label htmlFor="heightFeet">Height (feet)</Label>
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

              {/* Shape and Soil */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shape">Shape</Label>
                  <Select
                    value={formData.shape}
                    onValueChange={(value) => setFormData({ ...formData, shape: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="raised">Raised</SelectItem>
                      <SelectItem value="container">Container</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Input
                    id="soilType"
                    placeholder="e.g., Loamy, Sandy"
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 3D Positioning */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="positionX">Position X</Label>
                  <Input
                    id="positionX"
                    type="number"
                    step="0.1"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="positionY">Position Y</Label>
                  <Input
                    id="positionY"
                    type="number"
                    step="0.1"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="positionZ">Position Z</Label>
                  <Input
                    id="positionZ"
                    type="number"
                    step="0.1"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Color and Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 p-1"
                      disabled={isSubmitting}
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sunExposure">Sun Exposure</Label>
                  <Input
                    id="sunExposure"
                    placeholder="e.g., Full Sun, Partial Shade"
                    value={formData.sunExposure}
                    onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
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

      {/* Beds Table */}
      {beds.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Square className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No beds yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first bed
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Shape</TableHead>
              <TableHead className="hidden md:table-cell">Dimensions</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beds.map((bed) => (
              <TableRow key={bed.id}>
                <TableCell className="font-medium">
                  {bed.name}
                  <div className="text-xs text-muted-foreground">{bed.bedId}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {bed.shape}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {bed.widthFeet}′ × {bed.lengthFeet}′
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {bed.isActive ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm">
                      {bed.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(bed)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBed} onOpenChange={(open) => !open && setEditingBed(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Same fields as create dialog, but pre-filled */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-bedId">Bed ID *</Label>
                <Input
                  id="edit-bedId"
                  value={formData.bedId}
                  onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-widthFeet">Width (feet)</Label>
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
                <Label htmlFor="edit-lengthFeet">Length (feet)</Label>
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
                <Label htmlFor="edit-heightFeet">Height (feet)</Label>
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
                <Label htmlFor="edit-shape">Shape</Label>
                <Select
                  value={formData.shape}
                  onValueChange={(value) => setFormData({ ...formData, shape: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="raised">Raised</SelectItem>
                    <SelectItem value="container">Container</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-soilType">Soil Type</Label>
                <Input
                  id="edit-soilType"
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-positionX">Position X</Label>
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
                <Label htmlFor="edit-positionY">Position Y</Label>
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
                <Label htmlFor="edit-positionZ">Position Z</Label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 p-1"
                    disabled={isSubmitting}
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                </div>
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
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                disabled={isSubmitting}
              />
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