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
  Layers,
  Box,
  Users,
  Sprout,
  Palette,
  Type,
  Hash,
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

// ✅ Types
interface Layer {
  id: number;
  layerId: string;
  name: string;
}

interface Model {
  id: number;
  modelName: string;
  modelType: string;
}

interface Character {
  id: number;
  characterId: string;
  name: string;
}

interface Plant {
  id: number;
  plantId: string;
  commonName: string;
}

interface Bed {
  id: number;
  bedId: string;
  name: string;
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
  layer?: Layer;
  model?: Model;
  character?: Character;
  plant?: Plant;
  bed?: Bed;
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
  data: string;
  isVisible: boolean;
  isInteractive: boolean;
  isActive: boolean;
  isPublic: boolean;
  metadata: string;
}

// ✅ Options
const MARKER_TYPE_OPTIONS = [
  { value: 'plant', label: 'Plant' },
  { value: 'bed', label: 'Bed' },
  { value: 'farmbot', label: 'FarmBot' },
  { value: 'model', label: '3D Model' },
  { value: 'character', label: 'Character' },
  { value: 'task', label: 'Task' },
  { value: 'weather_station', label: 'Weather Station' },
  { value: 'traffic_incident', label: 'Traffic Incident' },
  { value: 'custom', label: 'Custom' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const COLOR_OPTIONS = [
  { value: '#ffffff', label: 'White' },
  { value: '#ef4444', label: 'Red' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#f97316', label: 'Orange' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#64748b', label: 'Gray' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getTypeColor = (type: string | null) => {
  if (!type) return 'bg-gray-100 text-gray-700';
  switch (type) {
    case 'plant': return 'bg-green-100 text-green-700';
    case 'bed': return 'bg-amber-100 text-amber-700';
    case 'farmbot': return 'bg-slate-100 text-slate-700';
    case 'model': return 'bg-blue-100 text-blue-700';
    case 'character': return 'bg-purple-100 text-purple-700';
    case 'task': return 'bg-orange-100 text-orange-700';
    case 'weather_station': return 'bg-cyan-100 text-cyan-700';
    case 'traffic_incident': return 'bg-red-100 text-red-700';
    case 'custom': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export function ThreeDMarkersCRUD({ onModuleUpdate }: { onModuleUpdate?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // ✅ Form state
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
    data: '{}',
    isVisible: true,
    isInteractive: false,
    isActive: true,
    isPublic: false,
    metadata: '{}',
  });

  // ✅ Fetch data
  useEffect(() => {
    fetchMarkers();
    fetchLayers();
    fetchModels();
    fetchCharacters();
    fetchPlants();
    fetchBeds();
  }, []);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/markers?limit=100');
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

  const fetchLayers = async () => {
    try {
      const response = await fetch('/api/threed/layers?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setLayers(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching layers:', error);
      setLayers([]);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/threed/models?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setModels(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/threed/characters?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setCharacters(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
      setCharacters([]);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/threed/plants?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setPlants(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
      setPlants([]);
    }
  };

  const fetchBeds = async () => {
    try {
      const response = await fetch('/api/threed/beds?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setBeds(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds([]);
    }
  };

  const filteredMarkers = markers.filter((marker) =>
    marker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    marker.markerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        data: JSON.parse(formData.data),
        metadata: JSON.parse(formData.metadata),
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
        data: JSON.parse(formData.data),
        metadata: JSON.parse(formData.metadata),
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
      data: '{}',
      isVisible: true,
      isInteractive: false,
      isActive: true,
      isPublic: false,
      metadata: '{}',
    });
  };

  const openEditDialog = (marker: Marker) => {
    setEditingMarker(marker);
    const position = marker.position || { x: 0, y: 0, z: 0 };
    const rotation = marker.rotation || { x: 0, y: 0, z: 0 };
    const scale = marker.scale || { x: 1, y: 1, z: 1 };

    setFormData({
      markerId: marker.markerId || '',
      name: marker.name,
      description: marker.description || '',
      positionX: String(position.x || 0),
      positionY: String(position.y || 0),
      positionZ: String(position.z || 0),
      rotationX: String(rotation.x || 0),
      rotationY: String(rotation.y || 0),
      rotationZ: String(rotation.z || 0),
      scaleX: String(scale.x || 1),
      scaleY: String(scale.y || 1),
      scaleZ: String(scale.z || 1),
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
      data: JSON.stringify(marker.data || {}),
      isVisible: marker.isVisible ?? true,
      isInteractive: marker.isInteractive ?? false,
      isActive: marker.isActive ?? true,
      isPublic: marker.isPublic ?? false,
      metadata: JSON.stringify(marker.metadata || {}),
    });
  };

  const renderActions = (marker: Marker) => (
    <div className="flex items-center justify-end gap-1">
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
          {marker.position && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                ({marker.position.x.toFixed(2)}, {marker.position.z.toFixed(2)})
              </span>
            </DropdownMenuItem>
          )}
          {marker.label && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Type className="w-3 h-3" />
                {marker.label}
              </span>
            </DropdownMenuItem>
          )}
          {marker.layer && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {marker.layer.name}
              </span>
            </DropdownMenuItem>
          )}
          {marker.model && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Box className="w-3 h-3" />
                {marker.model.modelName}
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
          <MapPin className="w-4 h-4 text-pink-500" />
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
              {/* Basic Info */}
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
                  placeholder="e.g., Garden Entrance"
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

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger>
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

              {/* 3D Position */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">3D Position</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label htmlFor="positionX" className="text-xs">X</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.01"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionY" className="text-xs">Y</Label>
                    <Input
                      id="positionY"
                      type="number"
                      step="0.01"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionZ" className="text-xs">Z</Label>
                    <Input
                      id="positionZ"
                      type="number"
                      step="0.01"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Rotation</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label htmlFor="rotationX" className="text-xs">X</Label>
                    <Input
                      id="rotationX"
                      type="number"
                      step="1"
                      value={formData.rotationX}
                      onChange={(e) => setFormData({ ...formData, rotationX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rotationY" className="text-xs">Y</Label>
                    <Input
                      id="rotationY"
                      type="number"
                      step="1"
                      value={formData.rotationY}
                      onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rotationZ" className="text-xs">Z</Label>
                    <Input
                      id="rotationZ"
                      type="number"
                      step="1"
                      value={formData.rotationZ}
                      onChange={(e) => setFormData({ ...formData, rotationZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Scale */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Scale</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label htmlFor="scaleX" className="text-xs">X</Label>
                    <Input
                      id="scaleX"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.scaleX}
                      onChange={(e) => setFormData({ ...formData, scaleX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scaleY" className="text-xs">Y</Label>
                    <Input
                      id="scaleY"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.scaleY}
                      onChange={(e) => setFormData({ ...formData, scaleY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scaleZ" className="text-xs">Z</Label>
                    <Input
                      id="scaleZ"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.scaleZ}
                      onChange={(e) => setFormData({ ...formData, scaleZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
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
                      <SelectTrigger>
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
                    <Label htmlFor="icon" className="text-xs">Icon</Label>
                    <Input
                      id="icon"
                      placeholder="e.g., star, heart, flag"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label htmlFor="label" className="text-xs">Display Label</Label>
                  <Input
                    id="label"
                    placeholder="Short display label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-2">
                  <Label htmlFor="content" className="text-xs">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Additional content..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Relationships */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Relationships</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="layerId" className="text-xs">Layer</Label>
                    <Select
                      value={formData.layerId}
                      onValueChange={(value) => setFormData({ ...formData, layerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a layer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {layers.map((layer) => (
                          <SelectItem key={layer.id} value={String(layer.id)}>
                            {layer.name} ({layer.layerId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="parentMarkerId" className="text-xs">Parent Marker</Label>
                    <Select
                      value={formData.parentMarkerId}
                      onValueChange={(value) => setFormData({ ...formData, parentMarkerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent marker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {markers.map((marker) => (
                          <SelectItem key={marker.id} value={String(marker.id)}>
                            {marker.name} ({marker.markerId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="modelId" className="text-xs">Model</Label>
                    <Select
                      value={formData.modelId}
                      onValueChange={(value) => setFormData({ ...formData, modelId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={String(model.id)}>
                            {model.modelName} ({model.modelType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="characterId" className="text-xs">Character</Label>
                    <Select
                      value={formData.characterId}
                      onValueChange={(value) => setFormData({ ...formData, characterId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a character" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {characters.map((character) => (
                          <SelectItem key={character.id} value={String(character.id)}>
                            {character.name} ({character.characterId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="plantId" className="text-xs">Plant</Label>
                    <Select
                      value={formData.plantId}
                      onValueChange={(value) => setFormData({ ...formData, plantId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {plants.map((plant) => (
                          <SelectItem key={plant.id} value={String(plant.id)}>
                            {plant.commonName} ({plant.plantId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bedId" className="text-xs">Bed</Label>
                    <Select
                      value={formData.bedId}
                      onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {beds.map((bed) => (
                          <SelectItem key={bed.id} value={String(bed.id)}>
                            {bed.name} ({bed.bedId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="data">Data (JSON)</Label>
                <Input
                  id="data"
                  placeholder='{"key": "value"}'
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="metadata">Metadata (JSON)</Label>
                <Input
                  id="metadata"
                  placeholder='{"key": "value"}'
                  value={formData.metadata}
                  onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Visibility & Status */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Visibility & Status</Label>
                <div className="space-y-2 mt-2">
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
            placeholder="Search by name, ID, label..."
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
            <SelectValue placeholder="Active" />
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
                      <MapPin className="w-3.5 h-3.5 text-pink-500" />
                      {marker.name}
                      {marker.label && (
                        <Badge variant="outline" className="text-[10px]">
                          {marker.label}
                        </Badge>
                      )}
                      {!marker.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {marker.markerId || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getTypeColor(marker.markerType)}`}>
                      {getOptionLabel(MARKER_TYPE_OPTIONS, marker.markerType || '')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {marker.position ? (
                      `(${marker.position.x.toFixed(2)}, ${marker.position.z.toFixed(2)})`
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

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="edit-size">Size</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData({ ...formData, size: value })}
                >
                  <SelectTrigger>
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

            {/* 3D Position */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">3D Position</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-positionX" className="text-xs">X</Label>
                  <Input
                    id="edit-positionX"
                    type="number"
                    step="0.01"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionY" className="text-xs">Y</Label>
                  <Input
                    id="edit-positionY"
                    type="number"
                    step="0.01"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionZ" className="text-xs">Z</Label>
                  <Input
                    id="edit-positionZ"
                    type="number"
                    step="0.01"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Rotation</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-rotationX" className="text-xs">X</Label>
                  <Input
                    id="edit-rotationX"
                    type="number"
                    step="1"
                    value={formData.rotationX}
                    onChange={(e) => setFormData({ ...formData, rotationX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rotationY" className="text-xs">Y</Label>
                  <Input
                    id="edit-rotationY"
                    type="number"
                    step="1"
                    value={formData.rotationY}
                    onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rotationZ" className="text-xs">Z</Label>
                  <Input
                    id="edit-rotationZ"
                    type="number"
                    step="1"
                    value={formData.rotationZ}
                    onChange={(e) => setFormData({ ...formData, rotationZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Scale</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-scaleX" className="text-xs">X</Label>
                  <Input
                    id="edit-scaleX"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.scaleX}
                    onChange={(e) => setFormData({ ...formData, scaleX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-scaleY" className="text-xs">Y</Label>
                  <Input
                    id="edit-scaleY"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.scaleY}
                    onChange={(e) => setFormData({ ...formData, scaleY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-scaleZ" className="text-xs">Z</Label>
                  <Input
                    id="edit-scaleZ"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.scaleZ}
                    onChange={(e) => setFormData({ ...formData, scaleZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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
                    <SelectTrigger>
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
                  <Label htmlFor="edit-icon" className="text-xs">Icon</Label>
                  <Input
                    id="edit-icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="edit-label" className="text-xs">Display Label</Label>
                <Input
                  id="edit-label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="mt-2">
                <Label htmlFor="edit-content" className="text-xs">Content</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Relationships */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Relationships</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-layerId" className="text-xs">Layer</Label>
                  <Select
                    value={formData.layerId}
                    onValueChange={(value) => setFormData({ ...formData, layerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a layer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {layers.map((layer) => (
                        <SelectItem key={layer.id} value={String(layer.id)}>
                          {layer.name} ({layer.layerId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-parentMarkerId" className="text-xs">Parent Marker</Label>
                  <Select
                    value={formData.parentMarkerId}
                    onValueChange={(value) => setFormData({ ...formData, parentMarkerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent marker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {markers.map((marker) => (
                        <SelectItem key={marker.id} value={String(marker.id)}>
                          {marker.name} ({marker.markerId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-modelId" className="text-xs">Model</Label>
                  <Select
                    value={formData.modelId}
                    onValueChange={(value) => setFormData({ ...formData, modelId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={String(model.id)}>
                          {model.modelName} ({model.modelType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-characterId" className="text-xs">Character</Label>
                  <Select
                    value={formData.characterId}
                    onValueChange={(value) => setFormData({ ...formData, characterId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a character" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {characters.map((character) => (
                        <SelectItem key={character.id} value={String(character.id)}>
                          {character.name} ({character.characterId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-plantId" className="text-xs">Plant</Label>
                  <Select
                    value={formData.plantId}
                    onValueChange={(value) => setFormData({ ...formData, plantId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={String(plant.id)}>
                          {plant.commonName} ({plant.plantId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-bedId" className="text-xs">Bed</Label>
                  <Select
                    value={formData.bedId}
                    onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {beds.map((bed) => (
                        <SelectItem key={bed.id} value={String(bed.id)}>
                          {bed.name} ({bed.bedId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-data">Data (JSON)</Label>
              <Input
                id="edit-data"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-metadata">Metadata (JSON)</Label>
              <Input
                id="edit-metadata"
                value={formData.metadata}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Visibility & Status */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Visibility & Status</Label>
              <div className="space-y-2 mt-2">
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