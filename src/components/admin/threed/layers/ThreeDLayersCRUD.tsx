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

interface ThreeDLayersCRUDProps {
  moduleId?: number;
  onModuleUpdate?: () => void;
}

interface Layer {
  id: number;
  layerId: string;
  name: string;
  description: string | null;
  category: string | null;
  layerType: string | null;
  parentLayerId: number | null;
  orderIndex: number;
  isVisible: boolean;
  isLocked: boolean;
  isActive: boolean;
  isPublic: boolean;
  config: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  layerId: string;
  name: string;
  description: string;
  category: string;
  layerType: string;
  parentLayerId: string;
  orderIndex: string;
  isVisible: boolean;
  isLocked: boolean;
  isActive: boolean;
  isPublic: boolean;
  config: any;
  metadata: any;
}

const LAYER_TYPE_OPTIONS = [
  { value: 'base', label: 'Base Layer' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'annotation', label: 'Annotation' },
  { value: 'reference', label: 'Reference' },
  { value: 'custom', label: 'Custom' },
];

const CATEGORY_OPTIONS = [
  { value: 'plants', label: 'Plants' },
  { value: 'beds', label: 'Beds' },
  { value: 'buildings', label: 'Buildings' },
  { value: 'paths', label: 'Paths' },
  { value: 'water', label: 'Water' },
  { value: 'decorations', label: 'Decorations' },
  { value: 'custom', label: 'Custom' },
];

const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

export function ThreeDLayersCRUD({ moduleId, onModuleUpdate }: ThreeDLayersCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [formData, setFormData] = useState<FormData>({
    layerId: '',
    name: '',
    description: '',
    category: '',
    layerType: '',
    parentLayerId: '',
    orderIndex: '0',
    isVisible: true,
    isLocked: false,
    isActive: true,
    isPublic: false,
    config: { visible: true, opacity: 1.0, color: '#ffffff' },
    metadata: {},
  });

  useEffect(() => {
    fetchLayers();
  }, [moduleId, filterType, filterActive]);

  const fetchLayers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleId) params.append('moduleId', String(moduleId));
      if (filterType !== 'all') params.append('layerType', filterType);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');

      const response = await fetch(`/api/threed/layers?${params.toString()}`);
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
    (layer.layerId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
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
        moduleId: moduleId || null,
        moduleType: 'threed',
        orderIndex: parseInt(formData.orderIndex) || 0,
        parentLayerId: formData.parentLayerId ? parseInt(formData.parentLayerId) : null,
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
        orderIndex: parseInt(formData.orderIndex) || 0,
        parentLayerId: formData.parentLayerId ? parseInt(formData.parentLayerId) : null,
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

  const toggleVisibility = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(`/api/threed/layers?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Layer "${name}" ${!currentStatus ? 'shown' : 'hidden'}`, 'success');
        await fetchLayers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update visibility', 'error');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showToast('Failed to update visibility', 'error');
    }
  };

  const toggleLock = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(`/api/threed/layers?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Layer "${name}" ${!currentStatus ? 'locked' : 'unlocked'}`, 'success');
        await fetchLayers();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update lock status', 'error');
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
      showToast('Failed to update lock status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      layerId: '',
      name: '',
      description: '',
      category: '',
      layerType: '',
      parentLayerId: '',
      orderIndex: '0',
      isVisible: true,
      isLocked: false,
      isActive: true,
      isPublic: false,
      config: { visible: true, opacity: 1.0, color: '#ffffff' },
      metadata: {},
    });
  };

  const openEditDialog = (layer: Layer) => {
    setEditingLayer(layer);
    setFormData({
      layerId: layer.layerId || '',
      name: layer.name,
      description: layer.description || '',
      category: layer.category || '',
      layerType: layer.layerType || '',
      parentLayerId: layer.parentLayerId ? String(layer.parentLayerId) : '',
      orderIndex: String(layer.orderIndex || 0),
      isVisible: layer.isVisible ?? true,
      isLocked: layer.isLocked ?? false,
      isActive: layer.isActive ?? true,
      isPublic: layer.isPublic ?? false,
      config: layer.config || { visible: true, opacity: 1.0, color: '#ffffff' },
      metadata: layer.metadata || {},
    });
  };

  const renderActions = (layer: Layer) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleVisibility(layer.id, layer.isVisible, layer.name)}
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
        onClick={() => toggleLock(layer.id, layer.isLocked, layer.name)}
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
          <DropdownMenuItem>
            <span className="text-xs text-muted-foreground">
              ID: {layer.layerId}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="text-xs text-muted-foreground">
              Order: {layer.orderIndex}
            </span>
          </DropdownMenuItem>
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
          <Layers className="w-4 h-4 text-blue-500" />
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
                  placeholder="e.g., Garden Plants"
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
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderIndex">Order Index</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    placeholder="0"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="parentLayerId">Parent Layer</Label>
                  <Input
                    id="parentLayerId"
                    placeholder="Parent layer ID (optional)"
                    value={formData.parentLayerId}
                    onChange={(e) => setFormData({ ...formData, parentLayerId: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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
            placeholder="Search layers..."
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
                <TableHead className="hidden lg:table-cell text-xs py-1">Category</TableHead>
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
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
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
                    {layer.category ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(CATEGORY_OPTIONS, layer.category)}
                      </Badge>
                    ) : (
                      '—'
                    )}
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
                    <Badge className={`text-[10px] ${layer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
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
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-orderIndex">Order Index</Label>
                <Input
                  id="edit-orderIndex"
                  type="number"
                  placeholder="0"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-parentLayerId">Parent Layer</Label>
                <Input
                  id="edit-parentLayerId"
                  placeholder="Parent layer ID (optional)"
                  value={formData.parentLayerId}
                  onChange={(e) => setFormData({ ...formData, parentLayerId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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