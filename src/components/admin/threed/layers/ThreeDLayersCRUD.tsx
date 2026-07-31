// components/admin/threed/layers/ThreeDLayersCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Layers,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  Hash,
  Move,
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
  description: string | null;
  config: any;
  category: string | null;
  layerType: string | null;
  parentLayerId: number | null;
  orderIndex: number;
  isVisible: boolean;
  isLocked: boolean;
  isActive: boolean;
  isPublic: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  parentLayer?: Layer;
  childLayers?: Layer[];
}

interface FormData {
  layerId: string;
  name: string;
  description: string;
  configVisible: string;
  configOpacity: string;
  configColor: string;
  configTransformX: string;
  configTransformY: string;
  configTransformZ: string;
  configRotationX: string;
  configRotationY: string;
  configRotationZ: string;
  configScaleX: string;
  configScaleY: string;
  configScaleZ: string;
  category: string;
  layerType: string;
  parentLayerId: string;
  orderIndex: string;
  isVisible: boolean;
  isLocked: boolean;
  isActive: boolean;
  isPublic: boolean;
  metadata: string;
}

// ✅ Options
const LAYER_CATEGORY_OPTIONS = [
  { value: 'garden', label: 'Garden' },
  { value: 'plants', label: 'Plants' },
  { value: 'beds', label: 'Beds' },
  { value: 'farmbots', label: 'FarmBots' },
  { value: 'models', label: 'Models' },
  { value: 'characters', label: 'Characters' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'weather', label: 'Weather' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'custom', label: 'Custom' },
];

const LAYER_TYPE_OPTIONS = [
  { value: 'garden', label: 'Garden' },
  { value: 'plants', label: 'Plants' },
  { value: 'beds', label: 'Beds' },
  { value: 'farmbots', label: 'FarmBots' },
  { value: 'models', label: 'Models' },
  { value: 'characters', label: 'Characters' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'weather', label: 'Weather' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'custom', label: 'Custom' },
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
  { value: '#000000', label: 'Black' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getStatusColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
};

export function ThreeDLayersCRUD({ onModuleUpdate }: { onModuleUpdate?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    layerId: '',
    name: '',
    description: '',
    configVisible: 'true',
    configOpacity: '1.0',
    configColor: '#ffffff',
    configTransformX: '0',
    configTransformY: '0',
    configTransformZ: '0',
    configRotationX: '0',
    configRotationY: '0',
    configRotationZ: '0',
    configScaleX: '1',
    configScaleY: '1',
    configScaleZ: '1',
    category: '',
    layerType: '',
    parentLayerId: '',
    orderIndex: '0',
    isVisible: true,
    isLocked: false,
    isActive: true,
    isPublic: false,
    metadata: '{}',
  });

  // ✅ Fetch layers
  useEffect(() => {
    fetchLayers();
  }, []);

  const fetchLayers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/layers?limit=100');
      const data = await response.json();
      if (data.success) {
        setLayers(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch layers', 'error');
        setLayers([]);
      }
    } catch (error) {
      console.error('Error fetching layers:', error);
      showToast('Failed to fetch layers', 'error');
      setLayers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLayers = layers.filter((layer) =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    layer.layerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (layer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.layerId) {
      showToast('Layer ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Layer name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        config: {
          visible: formData.configVisible === 'true',
          opacity: parseFloat(formData.configOpacity) || 1.0,
          color: formData.configColor || '#ffffff',
          transform: {
            position: {
              x: parseFloat(formData.configTransformX) || 0,
              y: parseFloat(formData.configTransformY) || 0,
              z: parseFloat(formData.configTransformZ) || 0,
            },
            rotation: {
              x: parseFloat(formData.configRotationX) || 0,
              y: parseFloat(formData.configRotationY) || 0,
              z: parseFloat(formData.configRotationZ) || 0,
            },
            scale: {
              x: parseFloat(formData.configScaleX) || 1,
              y: parseFloat(formData.configScaleY) || 1,
              z: parseFloat(formData.configScaleZ) || 1,
            },
          },
        },
        metadata: JSON.parse(formData.metadata),
        parentLayerId: formData.parentLayerId ? parseInt(formData.parentLayerId) : null,
        orderIndex: parseInt(formData.orderIndex) || 0,
      };

      const response = await fetch('/api/threed/layers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Layer created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchLayers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create layer', 'error');
      }
    } catch (error) {
      console.error('Error creating layer:', error);
      showToast('Failed to create layer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingLayer) return;
    if (!formData.layerId) {
      showToast('Layer ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Layer name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        config: {
          visible: formData.configVisible === 'true',
          opacity: parseFloat(formData.configOpacity) || 1.0,
          color: formData.configColor || '#ffffff',
          transform: {
            position: {
              x: parseFloat(formData.configTransformX) || 0,
              y: parseFloat(formData.configTransformY) || 0,
              z: parseFloat(formData.configTransformZ) || 0,
            },
            rotation: {
              x: parseFloat(formData.configRotationX) || 0,
              y: parseFloat(formData.configRotationY) || 0,
              z: parseFloat(formData.configRotationZ) || 0,
            },
            scale: {
              x: parseFloat(formData.configScaleX) || 1,
              y: parseFloat(formData.configScaleY) || 1,
              z: parseFloat(formData.configScaleZ) || 1,
            },
          },
        },
        metadata: JSON.parse(formData.metadata),
        parentLayerId: formData.parentLayerId ? parseInt(formData.parentLayerId) : null,
        orderIndex: parseInt(formData.orderIndex) || 0,
      };

      const response = await fetch(`/api/threed/layers?id=${editingLayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Layer updated successfully', 'success');
        setEditingLayer(null);
        await fetchLayers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update layer', 'error');
      }
    } catch (error) {
      console.error('Error updating layer:', error);
      showToast('Failed to update layer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete layer "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/layers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Layer deleted successfully', 'success');
        await fetchLayers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete layer', 'error');
      }
    } catch (error) {
      console.error('Error deleting layer:', error);
      showToast('Failed to delete layer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      layerId: '',
      name: '',
      description: '',
      configVisible: 'true',
      configOpacity: '1.0',
      configColor: '#ffffff',
      configTransformX: '0',
      configTransformY: '0',
      configTransformZ: '0',
      configRotationX: '0',
      configRotationY: '0',
      configRotationZ: '0',
      configScaleX: '1',
      configScaleY: '1',
      configScaleZ: '1',
      category: '',
      layerType: '',
      parentLayerId: '',
      orderIndex: '0',
      isVisible: true,
      isLocked: false,
      isActive: true,
      isPublic: false,
      metadata: '{}',
    });
  };

  const openEditDialog = (layer: Layer) => {
    setEditingLayer(layer);
    const config = layer.config || { visible: true, opacity: 1.0, color: '#ffffff', transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } };
    const transform = config.transform || { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };

    setFormData({
      layerId: layer.layerId || '',
      name: layer.name,
      description: layer.description || '',
      configVisible: String(config.visible ?? true),
      configOpacity: String(config.opacity ?? 1.0),
      configColor: config.color || '#ffffff',
      configTransformX: String(transform.position?.x ?? 0),
      configTransformY: String(transform.position?.y ?? 0),
      configTransformZ: String(transform.position?.z ?? 0),
      configRotationX: String(transform.rotation?.x ?? 0),
      configRotationY: String(transform.rotation?.y ?? 0),
      configRotationZ: String(transform.rotation?.z ?? 0),
      configScaleX: String(transform.scale?.x ?? 1),
      configScaleY: String(transform.scale?.y ?? 1),
      configScaleZ: String(transform.scale?.z ?? 1),
      category: layer.category || '',
      layerType: layer.layerType || '',
      parentLayerId: layer.parentLayerId ? String(layer.parentLayerId) : '',
      orderIndex: String(layer.orderIndex || 0),
      isVisible: layer.isVisible ?? true,
      isLocked: layer.isLocked ?? false,
      isActive: layer.isActive ?? true,
      isPublic: layer.isPublic ?? false,
      metadata: JSON.stringify(layer.metadata || {}),
    });
  };

  const renderActions = (layer: Layer) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Toggle visibility
          fetch(`/api/threed/layers?id=${layer.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isVisible: !layer.isVisible }),
          }).then(() => fetchLayers());
        }}
        title={layer.isVisible ? 'Hide' : 'Show'}
      >
        {layer.isVisible ? (
          <Eye className="w-4 h-4 text-green-500" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Toggle lock
          fetch(`/api/threed/layers?id=${layer.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isLocked: !layer.isLocked }),
          }).then(() => fetchLayers());
        }}
        title={layer.isLocked ? 'Unlock' : 'Lock'}
      >
        {layer.isLocked ? (
          <Lock className="w-4 h-4 text-red-500" />
        ) : (
          <Unlock className="w-4 h-4 text-gray-400" />
        )}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(layer)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {layer.orderIndex !== undefined && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Order: {layer.orderIndex}
              </span>
            </DropdownMenuItem>
          )}
          {layer.category && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Category: {layer.category}
              </span>
            </DropdownMenuItem>
          )}
          {layer.parentLayer && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Parent: {layer.parentLayer.name}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(layer.id, layer.name)}
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
          <Layers className="w-4 h-4 text-cyan-500" />
          <span className="text-sm font-medium">Layers</span>
          <Badge variant="secondary" className="text-xs">
            {filteredLayers.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Layer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Layer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="layerId">Layer ID *</Label>
                <Input
                  id="layerId"
                  placeholder="e.g., LAYER-001"
                  value={formData.layerId}
                  onChange={(e) => setFormData({ ...formData, layerId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Layer Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Garden Layer"
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
                  placeholder="Layer description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYER_CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="layerType">Layer Type</Label>
                  <Select
                    value={formData.layerType}
                    onValueChange={(value) => setFormData({ ...formData, layerType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYER_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="parentLayerId">Parent Layer</Label>
                <Select
                  value={formData.parentLayerId}
                  onValueChange={(value) => setFormData({ ...formData, parentLayerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent layer" />
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
                <Label htmlFor="orderIndex">Order Index</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Layer Configuration */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Layer Configuration</Label>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="configVisible" className="text-xs">Visible</Label>
                      <Select
                        value={formData.configVisible}
                        onValueChange={(value) => setFormData({ ...formData, configVisible: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Visible" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Visible</SelectItem>
                          <SelectItem value="false">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="configOpacity" className="text-xs">Opacity</Label>
                      <Input
                        id="configOpacity"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formData.configOpacity}
                        onChange={(e) => setFormData({ ...formData, configOpacity: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="configColor" className="text-xs">Color</Label>
                    <Select
                      value={formData.configColor}
                      onValueChange={(value) => setFormData({ ...formData, configColor: value })}
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
                </div>
              </div>

              {/* Transform */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Transform</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label className="text-xs">Position</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        placeholder="X"
                        type="number"
                        step="0.01"
                        value={formData.configTransformX}
                        onChange={(e) => setFormData({ ...formData, configTransformX: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Y"
                        type="number"
                        step="0.01"
                        value={formData.configTransformY}
                        onChange={(e) => setFormData({ ...formData, configTransformY: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Z"
                        type="number"
                        step="0.01"
                        value={formData.configTransformZ}
                        onChange={(e) => setFormData({ ...formData, configTransformZ: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Rotation</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        placeholder="X"
                        type="number"
                        step="1"
                        value={formData.configRotationX}
                        onChange={(e) => setFormData({ ...formData, configRotationX: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Y"
                        type="number"
                        step="1"
                        value={formData.configRotationY}
                        onChange={(e) => setFormData({ ...formData, configRotationY: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Z"
                        type="number"
                        step="1"
                        value={formData.configRotationZ}
                        onChange={(e) => setFormData({ ...formData, configRotationZ: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Scale</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        placeholder="X"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.configScaleX}
                        onChange={(e) => setFormData({ ...formData, configScaleX: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Y"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.configScaleY}
                        onChange={(e) => setFormData({ ...formData, configScaleY: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Z"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.configScaleZ}
                        onChange={(e) => setFormData({ ...formData, configScaleZ: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
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
                      id="isLocked"
                      checked={formData.isLocked}
                      onCheckedChange={(checked) => setFormData({ ...formData, isLocked: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isLocked">Locked</Label>
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
                  'Create Layer'
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
            placeholder="Search by name, ID, description..."
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
            {LAYER_TYPE_OPTIONS.map((type) => (
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
            fetchLayers();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Layers Table */}
      {filteredLayers.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No layers found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first layer
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
                <TableHead className="hidden lg:table-cell text-xs py-1">Order</TableHead>
                <TableHead className="text-center text-xs py-1">Visible</TableHead>
                <TableHead className="text-center text-xs py-1">Locked</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLayers.map((layer) => (
                <TableRow key={layer.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-cyan-500" />
                      {layer.name}
                      {!layer.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {layer.layerId || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {layer.layerType ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(LAYER_TYPE_OPTIONS, layer.layerType)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {layer.orderIndex !== undefined ? layer.orderIndex : '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {layer.isVisible ? (
                      <Eye className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {layer.isLocked ? (
                      <Lock className="w-4 h-4 text-red-500 mx-auto" />
                    ) : (
                      <Unlock className="w-4 h-4 text-gray-400 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getStatusColor(layer.isActive)}`}>
                      {layer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(layer)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingLayer} onOpenChange={(open) => !open && setEditingLayer(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Layer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-layerId">Layer ID *</Label>
              <Input
                id="edit-layerId"
                value={formData.layerId}
                onChange={(e) => setFormData({ ...formData, layerId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">Layer Name *</Label>
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
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYER_CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-layerType">Layer Type</Label>
                <Select
                  value={formData.layerType}
                  onValueChange={(value) => setFormData({ ...formData, layerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYER_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-parentLayerId">Parent Layer</Label>
              <Select
                value={formData.parentLayerId}
                onValueChange={(value) => setFormData({ ...formData, parentLayerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent layer" />
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
              <Label htmlFor="edit-orderIndex">Order Index</Label>
              <Input
                id="edit-orderIndex"
                type="number"
                min="0"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Layer Configuration */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Layer Configuration</Label>
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-configVisible" className="text-xs">Visible</Label>
                    <Select
                      value={formData.configVisible}
                      onValueChange={(value) => setFormData({ ...formData, configVisible: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Visible</SelectItem>
                        <SelectItem value="false">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-configOpacity" className="text-xs">Opacity</Label>
                    <Input
                      id="edit-configOpacity"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.configOpacity}
                      onChange={(e) => setFormData({ ...formData, configOpacity: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-configColor" className="text-xs">Color</Label>
                  <Select
                    value={formData.configColor}
                    onValueChange={(value) => setFormData({ ...formData, configColor: value })}
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
              </div>
            </div>

            {/* Transform */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Transform</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label className="text-xs">Position</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="X"
                      type="number"
                      step="0.01"
                      value={formData.configTransformX}
                      onChange={(e) => setFormData({ ...formData, configTransformX: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Y"
                      type="number"
                      step="0.01"
                      value={formData.configTransformY}
                      onChange={(e) => setFormData({ ...formData, configTransformY: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Z"
                      type="number"
                      step="0.01"
                      value={formData.configTransformZ}
                      onChange={(e) => setFormData({ ...formData, configTransformZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Rotation</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="X"
                      type="number"
                      step="1"
                      value={formData.configRotationX}
                      onChange={(e) => setFormData({ ...formData, configRotationX: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Y"
                      type="number"
                      step="1"
                      value={formData.configRotationY}
                      onChange={(e) => setFormData({ ...formData, configRotationY: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Z"
                      type="number"
                      step="1"
                      value={formData.configRotationZ}
                      onChange={(e) => setFormData({ ...formData, configRotationZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Scale</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="X"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.configScaleX}
                      onChange={(e) => setFormData({ ...formData, configScaleX: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Y"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.configScaleY}
                      onChange={(e) => setFormData({ ...formData, configScaleY: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Z"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.configScaleZ}
                      onChange={(e) => setFormData({ ...formData, configScaleZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
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
                    id="edit-isLocked"
                    checked={formData.isLocked}
                    onCheckedChange={(checked) => setFormData({ ...formData, isLocked: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-isLocked">Locked</Label>
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