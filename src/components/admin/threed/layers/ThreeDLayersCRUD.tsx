'use client';

import { useState, useEffect } from 'react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Layers,
  MoreHorizontal,
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

// ✅ Types - Updated to match schema
interface Layer {
  id: number;
  layerId: string;
  name: string;
  description: string | null;
  config: {
    includeTypes?: string[];
    filters?: Record<string, any>;
    color?: string;
    opacity?: number;
    visible?: boolean;
  };
  category: string | null;
  layerType: string | null;
  orderIndex: number;
  isVisible: boolean;
  isActive: boolean;
  isPublic: boolean;
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
  includeTypes: string[];
  includeTypesInput: string;
  orderIndex: string;
  isVisible: boolean;
  isActive: boolean;
  isPublic: boolean;
  color: string;
  opacity: string;
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
  { value: 'harvests', label: 'Harvests' },
  { value: 'plantings', label: 'Plantings' },
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
  { value: 'harvests', label: 'Harvests' },
  { value: 'plantings', label: 'Plantings' },
  { value: 'custom', label: 'Custom' },
];

const AVAILABLE_TYPES = [
  { value: 'plant', label: 'Plants', icon: '🌱' },
  { value: 'bed', label: 'Beds', icon: '🧑‍🌾' },
  { value: 'task', label: 'Tasks', icon: '📋' },
  { value: 'farmbot', label: 'FarmBots', icon: '🤖' },
  { value: 'character', label: 'Characters', icon: '🧚' },
  { value: 'harvest', label: 'Harvests', icon: '🍎' },
  { value: 'weather', label: 'Weather', icon: '🌤️' },
  { value: 'planting', label: 'Plantings', icon: '🌿' },
  { value: 'model', label: 'Models', icon: '🗿' },
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

interface ThreeDLayersCRUDProps {
  onModuleUpdate?: () => void;
  userId?: string;
  projectId?: number;
  scrollRecords?: boolean;
}

export function ThreeDLayersCRUD({ onModuleUpdate, userId, projectId, scrollRecords = false }: ThreeDLayersCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const fetchLayers = () => setRevision(value => value + 1);
  function resetList() { setPage(0); setSelected(new Set()); setLoading(true); }


  // ✅ Form state - Simplified to match schema
  const [formData, setFormData] = useState<FormData>({
    layerId: '',
    name: '',
    description: '',
    category: '',
    layerType: '',
    includeTypes: ['plant', 'bed'],
    includeTypesInput: 'plant, bed',
    orderIndex: '0',
    isVisible: true,
    isActive: true,
    isPublic: false,
    color: '#ffffff',
    opacity: '1.0',
    metadata: '{}',
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(''); setSelected(new Set());
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search: searchQuery, sort: sort.key, direction: sort.direction });
    if (projectId !== undefined) params.set('projectId', String(projectId));
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/layers?${params}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch Layers');
        if (controller.signal.aborted) return;
        setLayers(data.data); setTotal(Number(data.pagination.total));
        if (page > 0 && page * pageSize >= data.pagination.total) setPage(Math.max(0, Math.ceil(data.pagination.total / pageSize) - 1));
      } catch (error) {
        if (!controller.signal.aborted) { setLoadError(error instanceof Error ? error.message : 'Failed to fetch Layers'); setLayers([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, searchQuery, sort, revision, projectId]);

  const filteredLayers = layers;

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
        layerId: formData.layerId,
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        layerType: formData.layerType || null,
        orderIndex: parseInt(formData.orderIndex) || 0,
        isVisible: formData.isVisible,
        isActive: formData.isActive,
        isPublic: formData.isPublic,
        config: {
          includeTypes: formData.includeTypes,
          color: formData.color,
          opacity: parseFloat(formData.opacity) || 1.0,
          visible: formData.isVisible,
        },
        metadata: formData.metadata ? JSON.parse(formData.metadata) : {},
        userId: userId,
        projectId: projectId || null,
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
        layerId: formData.layerId,
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        layerType: formData.layerType || null,
        orderIndex: parseInt(formData.orderIndex) || 0,
        isVisible: formData.isVisible,
        isActive: formData.isActive,
        isPublic: formData.isPublic,
        config: {
          includeTypes: formData.includeTypes,
          color: formData.color,
          opacity: parseFloat(formData.opacity) || 1.0,
          visible: formData.isVisible,
        },
        metadata: formData.metadata ? JSON.parse(formData.metadata) : {},
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
    if (bulkBusy || isSubmitting) return;
    if (!confirm(`Delete layer "${name}"? This action cannot be undone.`)) return;

    setIsSubmitting(true);
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
    } finally { setIsSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({
      layerId: '',
      name: '',
      description: '',
      category: '',
      layerType: '',
      includeTypes: ['plant', 'bed'],
      includeTypesInput: 'plant, bed',
      orderIndex: '0',
      isVisible: true,
      isActive: true,
      isPublic: false,
      color: '#ffffff',
      opacity: '1.0',
      metadata: '{}',
    });
  };

  const openEditDialog = (layer: Layer) => {
    setEditingLayer(layer);
    const config = layer.config || { includeTypes: ['plant', 'bed'], color: '#ffffff', opacity: 1.0, visible: true };

    setFormData({
      layerId: layer.layerId || '',
      name: layer.name,
      description: layer.description || '',
      category: layer.category || '',
      layerType: layer.layerType || '',
      includeTypes: config.includeTypes || ['plant', 'bed'],
      includeTypesInput: (config.includeTypes || ['plant', 'bed']).join(', '),
      orderIndex: String(layer.orderIndex || 0),
      isVisible: layer.isVisible ?? true,
      isActive: layer.isActive ?? true,
      isPublic: layer.isPublic ?? false,
      color: config.color || '#ffffff',
      opacity: String(config.opacity || 1.0),
      metadata: JSON.stringify(layer.metadata || {}),
    });
  };

  const toggleVisibility = async (layer: Layer) => {
    try {
      const response = await fetch(`/api/threed/layers?id=${layer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !layer.isVisible }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchLayers();
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const toggleLock = async (layer: Layer) => {
    // Lock is now tracked in metadata since we removed it from schema
    // We'll store it in metadata as a convenience
    try {
      const currentLock = layer.metadata?.isLocked || false;
      const response = await fetch(`/api/threed/layers?id=${layer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metadata: { ...layer.metadata, isLocked: !currentLock }
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchLayers();
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
    }
  };

  async function deleteSelected() {
    const targets = layers.filter(layer => selected.has(layer.id));
    if (bulkBusy || loading || isSubmitting || !targets.length || !confirm(`Delete ${targets.length} selected Layers? This action cannot be undone.`)) return;
    setBulkBusy(true); setBulkNotice('');
    let deleted = 0;
    const failures: string[] = [];
    for (const layer of targets) {
      try {
        const response = await fetch(`/api/threed/layers?id=${layer.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
        deleted++;
      } catch (error) { failures.push(`${layer.name}: ${error instanceof Error ? error.message : 'Delete failed'}`); }
    }
    setBulkNotice(`Deleted ${deleted} of ${targets.length} Layers.${failures.length ? ` ${failures.join('; ')} Check the refreshed list before retrying.` : ''}`);
    setBulkBusy(false); setSelected(new Set()); fetchLayers();
    if (deleted) onModuleUpdate?.();
  }
  function heading(key: string, title: string) {
    const Icon = sort.key === key ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={loading || bulkBusy} className="inline-flex items-center gap-1" onClick={() => { resetList(); setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{title}<Icon className="h-3 w-3" aria-hidden="true" /></button></TableHead>;
  }

  const renderActions = (layer: Layer) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={bulkBusy || isSubmitting}
        onClick={() => toggleVisibility(layer)}
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
        disabled={bulkBusy || isSubmitting}
        onClick={() => toggleLock(layer)}
        title={layer.metadata?.isLocked ? 'Unlock' : 'Lock'}
      >
        {layer.metadata?.isLocked ? (
          <Lock className="w-4 h-4 text-red-500" />
        ) : (
          <Unlock className="w-4 h-4 text-gray-400" />
        )}
      </Button>
      <Button variant="ghost" size="sm" disabled={bulkBusy || isSubmitting} aria-label={`Edit ${layer.name}`} onClick={() => openEditDialog(layer)}>
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
          {layer.config?.includeTypes && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Includes: {layer.config.includeTypes.join(', ')}
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

  return (
    <div className={scrollRecords ? 'flex h-full min-h-0 flex-col gap-2' : 'space-y-2'}>
      <AdminWorkspaceHeader icon={Layers} title="Layers" description="Manage Map 2D and ThreeD Layers" className="shrink-0 [&>div:first-child>svg]:text-cyan-500">
        <Badge variant="secondary" className="text-xs">{loading || loadError ? '—' : total}</Badge>
        <Input aria-label="Search Layers" placeholder="Search Layers by name, ID or description…" disabled={bulkBusy} value={searchQuery} onChange={event => { resetList(); setSearchQuery(event.target.value); }} className="h-7 min-w-48 flex-1 text-xs" />
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={bulkBusy} className="h-7 px-2 text-[11px]">
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

              {/* Include Types */}
              <div>
                <Label>Include Data Types</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {AVAILABLE_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={formData.includeTypes.includes(type.value) ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        const newTypes = formData.includeTypes.includes(type.value)
                          ? formData.includeTypes.filter(t => t !== type.value)
                          : [...formData.includeTypes, type.value];
                        setFormData({ ...formData, includeTypes: newTypes });
                      }}
                    >
                      {type.icon} {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Layer Configuration */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Layer Configuration</Label>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
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
                      <Label htmlFor="opacity" className="text-xs">Opacity</Label>
                      <Input
                        id="opacity"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formData.opacity}
                        onChange={(e) => setFormData({ ...formData, opacity: e.target.value })}
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
      </AdminWorkspaceHeader>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Layers unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Layers`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading || bulkBusy || isSubmitting || !!loadError || !selected.size} onClick={() => void deleteSelected()}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={bulkBusy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Layers per page" className="rounded border bg-background p-1 text-[11px]" value={pageSize} disabled={loading || bulkBusy} onChange={event => { resetList(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} size="sm" variant="outline" className="h-7 text-[11px]" disabled={loading || bulkBusy || !!loadError || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setSelected(new Set()); setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
        </div>
      </div>
      {bulkNotice && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{bulkNotice}</p>}

      <div className={scrollRecords ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible' : 'overflow-auto rounded-lg border'} role="region" aria-label="Layer records" tabIndex={0}>
          <Table className="min-w-[850px]">
            <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"><input type="checkbox" aria-label="Select Layers on this page" disabled={loading || bulkBusy || !!loadError || !layers.length} checked={layers.length > 0 && layers.every(layer => selected.has(layer.id))} ref={input => { if (input) input.indeterminate = layers.some(layer => selected.has(layer.id)) && !layers.every(layer => selected.has(layer.id)); }} onChange={event => setSelected(event.target.checked ? new Set(layers.map(layer => layer.id)) : new Set())} /></TableHead>
                {heading('name', 'Name')}
                {heading('layerId', 'ID')}
                {heading('type', 'Type')}
                <TableHead className="text-xs py-1">Includes</TableHead>
                {heading('visible', 'Visible')}
                {heading('locked', 'Locked')}
                {heading('active', 'Active')}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={9} className="py-4 text-sm"><span role="status">Loading Layers…</span></TableCell></TableRow> : loadError ? <TableRow><TableCell colSpan={9} className="py-4 text-sm"><span role="alert" className="text-destructive">{loadError}</span><Button size="sm" variant="outline" className="ml-2 h-7 text-[11px]" onClick={() => void fetchLayers()}>Retry</Button></TableCell></TableRow> : filteredLayers.length === 0 ? <TableRow><TableCell colSpan={9} className="py-4 text-sm">No Layers found.</TableCell></TableRow> : filteredLayers.map((layer) => (
                <TableRow key={layer.id} className="hover:bg-muted/50">
                  <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${layer.name}`} checked={selected.has(layer.id)} disabled={bulkBusy || loading} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(layer.id); else next.delete(layer.id); return next; })} /></TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.config?.color || '#ffffff' }}
                      />
                      {layer.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {layer.layerId || '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {layer.layerType ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(LAYER_TYPE_OPTIONS, layer.layerType)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-xs text-muted-foreground">
                    {layer.config?.includeTypes ? (
                      <div className="flex gap-1 flex-wrap">
                        {layer.config.includeTypes.slice(0, 3).map((type) => (
                          <span key={type} className="text-[10px] bg-muted px-1 rounded">
                            {type}
                          </span>
                        ))}
                        {layer.config.includeTypes.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{layer.config.includeTypes.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {layer.isVisible ? <Eye aria-label="Visible" className="w-4 h-4 text-green-500 mx-auto" /> : <EyeOff aria-label="Hidden" className="w-4 h-4 text-gray-400 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {layer.metadata?.isLocked ? <Lock aria-label="Locked" className="w-4 h-4 text-red-500 mx-auto" /> : <Unlock aria-label="Unlocked" className="w-4 h-4 text-gray-400 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {layer.isActive ? <Check aria-label="Active" className="mx-auto h-4 w-4 text-green-500" /> : <X aria-label="Inactive" className="mx-auto h-4 w-4 text-gray-500" />}
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(layer)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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

            {/* Include Types */}
            <div>
              <Label>Include Data Types</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {AVAILABLE_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={formData.includeTypes.includes(type.value) ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      const newTypes = formData.includeTypes.includes(type.value)
                        ? formData.includeTypes.filter(t => t !== type.value)
                        : [...formData.includeTypes, type.value];
                      setFormData({ ...formData, includeTypes: newTypes });
                    }}
                  >
                    {type.icon} {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Layer Configuration */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Layer Configuration</Label>
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
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
                    <Label htmlFor="edit-opacity" className="text-xs">Opacity</Label>
                    <Input
                      id="edit-opacity"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.opacity}
                      onChange={(e) => setFormData({ ...formData, opacity: e.target.value })}
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