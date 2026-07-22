// components/admin/threed/beds/ThreeDBedsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Box,
  MoreHorizontal
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

interface Bed {
  id: number;
  name: string;
  description: string | null;
  bedType: string;
  width: number;
  length: number;
  height: number | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  color: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ThreeDBedsCRUDProps {
  onModuleUpdate?: () => void;
}

export function ThreeDBedsCRUD({ onModuleUpdate }: ThreeDBedsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bedType: 'raised',
    width: 4,
    length: 8,
    height: 1.5,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    color: '#8B7355',
    isActive: true,
  });

  useEffect(() => {
    fetchBeds();
  }, []);

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
    if (!formData.name) {
      showToast('Bed name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/threed/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          bedType: formData.bedType,
          width: formData.width,
          length: formData.length,
          height: formData.height || null,
          positionX: formData.positionX,
          positionY: formData.positionY,
          positionZ: formData.positionZ,
          rotationX: formData.rotationX,
          rotationY: formData.rotationY,
          rotationZ: formData.rotationZ,
          color: formData.color || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Bed created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          bedType: 'raised',
          width: 4,
          length: 8,
          height: 1.5,
          positionX: 0,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          color: '#8B7355',
          isActive: true,
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
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          bedType: formData.bedType,
          width: formData.width,
          length: formData.length,
          height: formData.height || null,
          positionX: formData.positionX,
          positionY: formData.positionY,
          positionZ: formData.positionZ,
          rotationX: formData.rotationX,
          rotationY: formData.rotationY,
          rotationZ: formData.rotationZ,
          color: formData.color || null,
          isActive: formData.isActive,
        }),
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

  const renderActions = (bed: Bed) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewBedDetails(bed)}
      >
        <Box className="w-4 h-4" />
      </Button>
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
  );

  const viewBedDetails = (bed: Bed) => {
    showToast(
      `${bed.name} - ${bed.width}' x ${bed.length}' x ${bed.height || 0}'`,
      'info'
    );
  };

  const openEditDialog = (bed: Bed) => {
    setEditingBed(bed);
    setFormData({
      name: bed.name,
      description: bed.description || '',
      bedType: bed.bedType || 'raised',
      width: bed.width || 4,
      length: bed.length || 8,
      height: bed.height || 1.5,
      positionX: bed.positionX || 0,
      positionY: bed.positionY || 0,
      positionZ: bed.positionZ || 0,
      rotationX: bed.rotationX || 0,
      rotationY: bed.rotationY || 0,
      rotationZ: bed.rotationZ || 0,
      color: bed.color || '#8B7355',
      isActive: bed.isActive !== false,
    });
  };

  const getBedTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      raised: 'Raised Bed',
      ground: 'Ground Bed',
      container: 'Container',
      vertical: 'Vertical',
      hydroponic: 'Hydroponic',
    };
    return types[type] || type;
  };

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">Beds</span>
          <Badge variant="secondary" className="text-xs">
            {beds.length}
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
              <DialogTitle>Create New Garden Bed</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Bed Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Tomato Bed"
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
                <Label htmlFor="bedType">Bed Type</Label>
                <Select
                  value={formData.bedType}
                  onValueChange={(value) => setFormData({ ...formData, bedType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raised">Raised Bed</SelectItem>
                    <SelectItem value="ground">Ground Bed</SelectItem>
                    <SelectItem value="container">Container</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="hydroponic">Hydroponic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="width">Width (ft)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.5"
                    placeholder="4"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="length">Length (ft)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.5"
                    placeholder="8"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (ft)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.5"
                    placeholder="1.5"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10 p-1"
                    disabled={isSubmitting}
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                    placeholder="#8B7355"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">3D Position</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="positionX" className="text-xs">X</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: parseFloat(e.target.value) || 0 })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionY" className="text-xs">Y</Label>
                    <Input
                      id="positionY"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: parseFloat(e.target.value) || 0 })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionZ" className="text-xs">Z</Label>
                    <Input
                      id="positionZ"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: parseFloat(e.target.value) || 0 })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
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

      {beds.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No beds yet</p>
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
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Dimensions</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beds.map((bed) => (
                <TableRow key={bed.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: bed.color || '#8B7355' }}
                      />
                      {bed.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {getBedTypeLabel(bed.bedType)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {bed.width}' × {bed.length}' × {bed.height || 0}'
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      {bed.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs">
                        {bed.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-right">
                    {renderActions(bed)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
              <Label htmlFor="edit-bedType">Bed Type</Label>
              <Select
                value={formData.bedType}
                onValueChange={(value) => setFormData({ ...formData, bedType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bed type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raised">Raised Bed</SelectItem>
                  <SelectItem value="ground">Ground Bed</SelectItem>
                  <SelectItem value="container">Container</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="hydroponic">Hydroponic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-width">Width (ft)</Label>
                <Input
                  id="edit-width"
                  type="number"
                  step="0.5"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-length">Length (ft)</Label>
                <Input
                  id="edit-length"
                  type="number"
                  step="0.5"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-height">Height (ft)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  step="0.5"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label>3D Position</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="edit-positionX" className="text-xs">X</Label>
                  <Input
                    id="edit-positionX"
                    type="number"
                    step="0.5"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionY" className="text-xs">Y</Label>
                  <Input
                    id="edit-positionY"
                    type="number"
                    step="0.5"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionZ" className="text-xs">Z</Label>
                  <Input
                    id="edit-positionZ"
                    type="number"
                    step="0.5"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 p-1"
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