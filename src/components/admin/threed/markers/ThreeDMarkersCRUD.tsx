// components/admin/threed/markers/ThreeDMarkersCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  Box,
  Users,
  Sprout,
  Layers,
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

interface ThreeDMarkersCRUDProps {
  moduleId?: number;
  onModuleUpdate?: () => void;
}

interface Marker {
  id: number;
  markerId: string;
  name: string;
  description: string | null;
  position: any;
  rotation: any;
  scale: any;
  markerType: string | null;
  color: string | null;
  size: string | null;
  icon: string | null;
  label: string | null;
  content: string | null;
  layerId: number | null;
  parentMarkerId: number | null;
  modelId: number | null;
  characterId: number | null;
  plantId: number | null;
  bedId: number | null;
  data: any;
  isVisible: boolean;
  isInteractive: boolean;
  isActive: boolean;
  isPublic: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  markerId: string;
  name: string;
  description: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  rotationX: string;
  rotationY: string;
  rotationZ: string;
  scaleX: string;
  scaleY: string;
  scaleZ: string;
  markerType: string;
  color: string;
  size: string;
  icon: string;
  label: string;
  content: string;
  layerId: string;
  parentMarkerId: string;
  modelId: string;
  characterId: string;
  plantId: string;
  bedId: string;
  isVisible: boolean;
  isInteractive: boolean;
  isActive: boolean;
  isPublic: boolean;
  data: any;
  metadata: any;
}

const MARKER_TYPE_OPTIONS = [
  { value: 'object', label: 'Object' },
  { value: 'waypoint', label: 'Waypoint' },
  { value: 'label', label: 'Label' },
  { value: 'model', label: '3D Model' },
  { value: 'plant', label: 'Plant' },
  { value: 'bed', label: 'Bed' },
  { value: 'character', label: 'Character' },
  { value: 'custom', label: 'Custom' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const COLOR_OPTIONS = [
  { value: '#ffffff', label: 'White' },
  { value: '#ff0000', label: 'Red' },
  { value: '#00ff00', label: 'Green' },
  { value: '#0000ff', label: 'Blue' },
  { value: '#ffff00', label: 'Yellow' },
  { value: '#ff8800', label: 'Orange' },
  { value: '#ff00ff', label: 'Magenta' },
  { value: '#00ffff', label: 'Cyan' },
];

const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

export function ThreeDMarkersCRUD({ moduleId, onModuleUpdate }: ThreeDMarkersCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [formData, setFormData] = useState<FormData>({
    markerId: '',
    name: '',
    description: '',
    positionX: '0',
    positionY: '0',
    positionZ: '0',
    rotationX: '0',
    rotationY: '0',
    rotationZ: '0',
    scaleX: '1',
    scaleY: '1',
    scaleZ: '1',
    markerType: '',
    color: '#ffffff',
    size: 'medium',
    icon: '',
    label: '',
    content: '',
    layerId: '',
    parentMarkerId: '',
    modelId: '',
    characterId: '',
    plantId: '',
    bedId: '',
    isVisible: true,
    isInteractive: false,
    isActive: true,
    isPublic: false,
    data: {},
    metadata: {},
  });

  useEffect(() => {
    fetchMarkers();
  }, [moduleId, filterType, filterActive]);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleId) params.append('moduleId', String(moduleId));
      if (filterType !== 'all') params.append('markerType', filterType);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');

      const response = await fetch(`/api/threed/markers?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMarkers(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch markers', 'error');
        setMarkers([]);
      }
    } catch (error) {
      console.error('Error fetching markers:', error);
      showToast('Failed to fetch markers', 'error');
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkers = markers.filter((marker) =>
    marker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (marker.markerId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (marker.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (marker.label?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.markerId) {
      showToast('Marker ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Marker name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        moduleId: moduleId || null,
        moduleType: 'threed',
        position: {
          x: parseFloat(formData.positionX) || 0,
          y: parseFloat(formData.positionY) || 0,
          z: parseFloat(formData.positionZ) || 0,
        },
        rotation: {
          x: parseFloat(formData.rotationX) || 0,
          y: parseFloat(formData.rotationY) || 0,
          z: parseFloat(formData.rotationZ) || 0,
        },
        scale: {
          x: parseFloat(formData.scaleX) || 1,
          y: parseFloat(formData.scaleY) || 1,
          z: parseFloat(formData.scaleZ) || 1,
        },
        layerId: formData.layerId ? parseInt(formData.layerId) : null,
        parentMarkerId: formData.parentMarkerId ? parseInt(formData.parentMarkerId) : null,
        modelId: formData.modelId ? parseInt(formData.modelId) : null,
        characterId: formData.characterId ? parseInt(formData.characterId) : null,
        plantId: formData.plantId ? parseInt(formData.plantId) : null,
        bedId: formData.bedId ? parseInt(formData.bedId) : null,
      };

      const response = await fetch('/api/threed/markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Marker created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchMarkers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create marker', 'error');
      }
    } catch (error) {
      console.error('Error creating marker:', error);
      showToast('Failed to create marker', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingMarker) return;
    if (!formData.markerId) {
      showToast('Marker ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Marker name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        position: {
          x: parseFloat(formData.positionX) || 0,
          y: parseFloat(formData.positionY) || 0,
          z: parseFloat(formData.positionZ) || 0,
        },
        rotation: {
          x: parseFloat(formData.rotationX) || 0,
          y: parseFloat(formData.rotationY) || 0,
          z: parseFloat(formData.rotationZ) || 0,
        },
        scale: {
          x: parseFloat(formData.scaleX) || 1,
          y: parseFloat(formData.scaleY) || 1,
          z: parseFloat(formData.scaleZ) || 1,
        },
        layerId: formData.layerId ? parseInt(formData.layerId) : null,
        parentMarkerId: formData.parentMarkerId ? parseInt(formData.parentMarkerId) : null,
        modelId: formData.modelId ? parseInt(formData.modelId) : null,
        characterId: formData.characterId ? parseInt(formData.characterId) : null,
        plantId: formData.plantId ? parseInt(formData.plantId) : null,
        bedId: formData.bedId ? parseInt(formData.bedId) : null,
      };

      const response = await fetch(`/api/threed/markers?id=${editingMarker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Marker updated successfully', 'success');
        setEditingMarker(null);
        await fetchMarkers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update marker', 'error');
      }
    } catch (error) {
      console.error('Error updating marker:', error);
      showToast('Failed to update marker', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete marker "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/markers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Marker deleted successfully', 'success');
        await fetchMarkers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete marker', 'error');
      }
    } catch (error) {
      console.error('Error deleting marker:', error);
      showToast('Failed to delete marker', 'error');
    }
  };

  const toggleVisibility = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(`/api/threed/markers?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Marker "${name}" ${!currentStatus ? 'shown' : 'hidden'}`, 'success');
        await fetchMarkers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update visibility', 'error');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showToast('Failed to update visibility', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      markerId: '',
      name: '',
      description: '',
      positionX: '0',
      positionY: '0',
      positionZ: '0',
      rotationX: '0',
      rotationY: '0',
      rotationZ: '0',
      scaleX: '1',
      scaleY: '1',
      scaleZ: '1',
      markerType: '',
      color: '#ffffff',
      size: 'medium',
      icon: '',
      label: '',
      content: '',
      layerId: '',
      parentMarkerId: '',
      modelId: '',
      characterId: '',
      plantId: '',
      bedId: '',
      isVisible: true,
      isInteractive: false,
      isActive: true,
      isPublic: false,
      data: {},
      metadata: {},
    });
  };

  const openEditDialog = (marker: Marker) => {
    setEditingMarker(marker);
    setFormData({
      markerId: marker.markerId || '',
      name: marker.name,
      description: marker.description || '',
      positionX: String(marker.position?.x || 0),
      positionY: String(marker.position?.y || 0),
      positionZ: String(marker.position?.z || 0),
      rotationX: String(marker.rotation?.x || 0),
      rotationY: String(marker.rotation?.y || 0),
      rotationZ: String(marker.rotation?.z || 0),
      scaleX: String(marker.scale?.x || 1),
      scaleY: String(marker.scale?.y || 1),
      scaleZ: String(marker.scale?.z || 1),
      markerType: marker.markerType || '',
      color: marker.color || '#ffffff',
      size: marker.size || 'medium',
      icon: marker.icon || '',
      label: marker.label || '',
      content: marker.content || '',
      layerId: marker.layerId ? String(marker.layerId) : '',
      parentMarkerId: marker.parentMarkerId ? String(marker.parentMarkerId) : '',
      modelId: marker.modelId ? String(marker.modelId) : '',
      characterId: marker.characterId ? String(marker.characterId) : '',
      plantId: marker.plantId ? String(marker.plantId) : '',
      bedId: marker.bedId ? String(marker.bedId) : '',
      isVisible: marker.isVisible ?? true,
      isInteractive: marker.isInteractive ?? false,
      isActive: marker.isActive ?? true,
      isPublic: marker.isPublic ?? false,
      data: marker.data || {},
      metadata: marker.metadata || {},
    });
  };

  const getMarkerTypeIcon = (type: string | null) => {
    switch (type) {
      case 'model': return <Box className="w-3.5 h-3.5" />;
      case 'plant': return <Sprout className="w-3.5 h-3.5" />;
      case 'bed': return <Layers className="w-3.5 h-3.5" />;
      case 'character': return <Users className="w-3.5 h-3.5" />;
      default: return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const renderActions = (marker: Marker) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleVisibility(marker.id, marker.isVisible, marker.name)}
        title={marker.isVisible ? 'Hide' : 'Show'}
      >
        {marker.isVisible ? (
          <Eye className="w-4 h-4 text-green-500" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(marker)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <span className="text-xs text-muted-foreground">
              ID: {marker.markerId}
            </span>
          </DropdownMenuItem>
          {marker.position && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Pos: ({marker.position.x}, {marker.position.y}, {marker.position.z})
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(marker.id, marker.name)}
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
          <MapPin className="w-4 h-4 text-violet-300" />
          <span className="text-sm font-medium">Markers</span>
          <Badge variant="secondary" className="text-xs">
            {filteredMarkers.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Marker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Marker</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="markerId">Marker ID *</Label>
                <Input
                  id="markerId"
                  placeholder="e.g., MARKER-001"
                  value={formData.markerId}
                  onChange={(e) => setFormData({ ...formData, markerId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Marker Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Entrance Gate"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Marker description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="markerType">Marker Type</Label>
                <Select
                  value={formData.markerType}
                  onValueChange={(value) => setFormData({ ...formData, markerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKER_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Position */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Position</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input
                    placeholder="X"
                    type="number"
                    step="0.01"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Y"
                    type="number"
                    step="0.01"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Z"
                    type="number"
                    step="0.01"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Rotation */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Rotation</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input
                    placeholder="X"
                    type="number"
                    step="0.01"
                    value={formData.rotationX}
                    onChange={(e) => setFormData({ ...formData, rotationX: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Y"
                    type="number"
                    step="0.01"
                    value={formData.rotationY}
                    onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Z"
                    type="number"
                    step="0.01"
                    value={formData.rotationZ}
                    onChange={(e) => setFormData({ ...formData, rotationZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Scale */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Scale</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input
                    placeholder="X"
                    type="number"
                    step="0.01"
                    value={formData.scaleX}
                    onChange={(e) => setFormData({ ...formData, scaleX: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Y"
                    type="number"
                    step="0.01"
                    value={formData.scaleY}
                    onChange={(e) => setFormData({ ...formData, scaleY: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Z"
                    type="number"
                    step="0.01"
                    value={formData.scaleZ}
                    onChange={(e) => setFormData({ ...formData, scaleZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Appearance */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Appearance</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="color" className="text-xs">Color</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => setFormData({ ...formData, color: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: color.value }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="size" className="text-xs">Size</Label>
                    <Select
                      value={formData.size}
                      onValueChange={(value) => setFormData({ ...formData, size: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Relationships */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Relationships</Label>
                <div className="space-y-2 mt-2">
                  <Input
                    placeholder="Layer ID (optional)"
                    value={formData.layerId}
                    onChange={(e) => setFormData({ ...formData, layerId: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Parent Marker ID (optional)"
                    value={formData.parentMarkerId}
                    onChange={(e) => setFormData({ ...formData, parentMarkerId: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Model ID (optional)"
                    value={formData.modelId}
                    onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Character ID (optional)"
                    value={formData.characterId}
                    onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Plant ID (optional)"
                    value={formData.plantId}
                    onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Bed ID (optional)"
                    value={formData.bedId}
                    onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="Display label (optional)"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Additional content..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Visibility & Status</Label>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isVisible"
                      checked={formData.isVisible}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isVisible">Visible</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isInteractive"
                      checked={formData.isInteractive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isInteractive: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isInteractive">Interactive</Label>
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
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isPublic">Public</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Marker'
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
            placeholder="Search markers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {MARKER_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterType('all');
            setFilterActive('all');
            fetchMarkers();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Markers Table */}
      {filteredMarkers.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No markers found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first marker
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">ID</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Position</TableHead>
                <TableHead className="text-center text-xs py-1">Visible</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarkers.map((marker) => (
                <TableRow key={marker.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {getMarkerTypeIcon(marker.markerType)}
                      {marker.name}
                      {!marker.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                      {marker.label && (
                        <Badge variant="outline" className="text-[10px]">
                          {marker.label}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {marker.markerId || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {marker.markerType ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(MARKER_TYPE_OPTIONS, marker.markerType)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {marker.position ? (
                      `(${marker.position.x.toFixed(2)}, ${marker.position.y.toFixed(2)}, ${marker.position.z.toFixed(2)})`
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {marker.isVisible ? (
                      <Eye className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${marker.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {marker.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(marker)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMarker} onOpenChange={(open) => !open && setEditingMarker(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Marker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-markerId">Marker ID *</Label>
              <Input
                id="edit-markerId"
                value={formData.markerId}
                onChange={(e) => setFormData({ ...formData, markerId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">Marker Name *</Label>
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
              <Label htmlFor="edit-markerType">Marker Type</Label>
              <Select
                value={formData.markerType}
                onValueChange={(value) => setFormData({ ...formData, markerType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MARKER_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Position</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input
                  placeholder="X"
                  type="number"
                  step="0.01"
                  value={formData.positionX}
                  onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Y"
                  type="number"
                  step="0.01"
                  value={formData.positionY}
                  onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Z"
                  type="number"
                  step="0.01"
                  value={formData.positionZ}
                  onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Rotation */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Rotation</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input
                  placeholder="X"
                  type="number"
                  step="0.01"
                  value={formData.rotationX}
                  onChange={(e) => setFormData({ ...formData, rotationX: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Y"
                  type="number"
                  step="0.01"
                  value={formData.rotationY}
                  onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Z"
                  type="number"
                  step="0.01"
                  value={formData.rotationZ}
                  onChange={(e) => setFormData({ ...formData, rotationZ: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Scale */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Scale</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input
                  placeholder="X"
                  type="number"
                  step="0.01"
                  value={formData.scaleX}
                  onChange={(e) => setFormData({ ...formData, scaleX: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Y"
                  type="number"
                  step="0.01"
                  value={formData.scaleY}
                  onChange={(e) => setFormData({ ...formData, scaleY: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Z"
                  type="number"
                  step="0.01"
                  value={formData.scaleZ}
                  onChange={(e) => setFormData({ ...formData, scaleZ: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Appearance</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-color" className="text-xs">Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-size" className="text-xs">Size</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Relationships */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Relationships</Label>
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Layer ID (optional)"
                  value={formData.layerId}
                  onChange={(e) => setFormData({ ...formData, layerId: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Parent Marker ID (optional)"
                  value={formData.parentMarkerId}
                  onChange={(e) => setFormData({ ...formData, parentMarkerId: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Model ID (optional)"
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Character ID (optional)"
                  value={formData.characterId}
                  onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Plant ID (optional)"
                  value={formData.plantId}
                  onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Bed ID (optional)"
                  value={formData.bedId}
                  onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Visibility & Status</Label>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isVisible"
                    checked={formData.isVisible}
                    onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-isVisible">Visible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isInteractive"
                    checked={formData.isInteractive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isInteractive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-isInteractive">Interactive</Label>
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
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-isPublic">Public</Label>
                </div>
              </div>
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