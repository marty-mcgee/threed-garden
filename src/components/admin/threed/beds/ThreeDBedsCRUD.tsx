// components/admin/threed/beds/ThreeDBedsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Sprout,
  Edit,
  Trash2,
  Loader2,
  Box,
  MoreHorizontal,
  Eye,
  EyeOff,
  MapPin,
  Ruler,
  Layers,
  Palette,
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

import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';

// ✅ Types
interface Bed {
  id: number;
  bedId: string;
  name: string;
  description: string | null;
  shape: string;
  widthFeet: string | null;
  lengthFeet: string | null;
  squareFeet: string | null;
  heightFeet: string;
  soilType: string | null;
  sunExposure: string | null;
  positionX: string;
  positionY: string;
  positionZ: string;
  rotation: string;
  scale: string;
  isActive: boolean;
  status: string;
  color: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  bedId: string;
  name: string;
  description: string;
  shape: string;
  widthFeet: string;
  lengthFeet: string;
  squareFeet: string;
  heightFeet: string;
  soilType: string;
  sunExposure: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  rotation: string;
  scale: string;
  isActive: boolean;
  status: string;
  color: string;
  notes: string;
}

// ✅ Options
const BED_SHAPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'raised', label: 'Raised' },
  { value: 'container', label: 'Container' },
  { value: 'custom', label: 'Custom' },
];

const BED_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'dormant', label: 'Dormant' },
  { value: 'retired', label: 'Retired' },
];

const SOIL_TYPE_OPTIONS = [
  { value: 'loam', label: 'Loam' },
  { value: 'clay', label: 'Clay' },
  { value: 'sandy', label: 'Sandy' },
  { value: 'silty', label: 'Silty' },
  { value: 'peaty', label: 'Peaty' },
  { value: 'chalky', label: 'Chalky' },
];

const SUN_EXPOSURE_OPTIONS = [
  { value: 'full_sun', label: 'Full Sun' },
  { value: 'partial_sun', label: 'Partial Sun' },
  { value: 'partial_shade', label: 'Partial Shade' },
  { value: 'full_shade', label: 'Full Shade' },
];

const COLOR_OPTIONS = [
  { value: '#8B5E3C', label: 'Brown' },
  { value: '#2E7D32', label: 'Dark Green' },
  { value: '#4CAF50', label: 'Green' },
  { value: '#795548', label: 'Wood' },
  { value: '#607D8B', label: 'Gray' },
  { value: '#D32F2F', label: 'Red' },
  { value: '#1976D2', label: 'Blue' },
  { value: '#F57C00', label: 'Orange' },
  { value: '#9C27B0', label: 'Purple' },
  { value: '#000000', label: 'Black' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-500';
    case 'pending': return 'text-yellow-500';
    case 'maintenance': return 'text-red-500';
    case 'dormant': return 'text-muted-foreground';
    case 'retired': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

const getShapeIcon = (shape: string) => {
  switch (shape) {
    case 'rectangle': return '▭';
    case 'square': return '▢';
    case 'circle': return '◯';
    case 'raised': return '▤';
    case 'container': return '▣';
    default: return '▭';
  }
};

export function ThreeDBedsCRUD({ onModuleUpdate, scrollRecords = false }: { onModuleUpdate?: () => void; scrollRecords?: boolean }) {
  const { showToast, ToastComponent } = useToast();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const fetchBeds = () => setRevision(value => value + 1);
  function resetList() { setPage(0); setSelected(new Set()); setLoading(true); }


  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    bedId: '',
    name: '',
    description: '',
    shape: 'rectangle',
    widthFeet: '',
    lengthFeet: '',
    squareFeet: '',
    heightFeet: '1',
    soilType: '',
    sunExposure: '',
    positionX: '0',
    positionY: '0',
    positionZ: '0',
    rotation: '0',
    scale: '1',
    isActive: true,
    status: 'active',
    color: '#8B5E3C',
    notes: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(''); setSelected(new Set());
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search: searchQuery, sort: sort.key, direction: sort.direction });
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/beds?${params}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch Beds');
        if (controller.signal.aborted) return;
        setBeds(data.data); setTotal(Number(data.pagination.total));
        if (page > 0 && page * pageSize >= data.pagination.total) setPage(Math.max(0, Math.ceil(data.pagination.total / pageSize) - 1));
      } catch (error) {
        if (!controller.signal.aborted) { setLoadError(error instanceof Error ? error.message : 'Failed to fetch Beds'); setBeds([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, searchQuery, sort, revision]);

  const filteredBeds = beds;

  const handleCreate = async () => {
    if (!formData.bedId) {
      showToast('Bed ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Bed name is required', 'error');
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
    if (!editingBed) return;
    if (!formData.bedId) {
      showToast('Bed ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Bed name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threed/beds?id=${editingBed.id}`, {
        method: 'PATCH',
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
    if (bulkBusy || isSubmitting) return;
    if (!confirm(`Delete bed "${name}"? This action cannot be undone.`)) return;

    setIsSubmitting(true);
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
    } finally { setIsSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({
      bedId: '',
      name: '',
      description: '',
      shape: 'rectangle',
      widthFeet: '',
      lengthFeet: '',
      squareFeet: '',
      heightFeet: '1',
      soilType: '',
      sunExposure: '',
      positionX: '0',
      positionY: '0',
      positionZ: '0',
      rotation: '0',
      scale: '1',
      isActive: true,
      status: 'active',
      color: '#8B5E3C',
      notes: '',
    });
  };

  const openEditDialog = (bed: Bed) => {
    setEditingBed(bed);
    setFormData({
      bedId: bed.bedId || '',
      name: bed.name,
      description: bed.description || '',
      shape: bed.shape || 'rectangle',
      widthFeet: bed.widthFeet || '',
      lengthFeet: bed.lengthFeet || '',
      squareFeet: bed.squareFeet || '',
      heightFeet: bed.heightFeet || '1',
      soilType: bed.soilType || '',
      sunExposure: bed.sunExposure || '',
      positionX: bed.positionX || '0',
      positionY: bed.positionY || '0',
      positionZ: bed.positionZ || '0',
      rotation: bed.rotation || '0',
      scale: bed.scale || '1',
      isActive: bed.isActive ?? true,
      status: bed.status || 'active',
      color: bed.color || '#8B5E3C',
      notes: bed.notes || '',
    });
  };

  async function deleteSelected() {
    const targets = beds.filter(bed => selected.has(bed.id));
    if (bulkBusy || loading || isSubmitting || !targets.length || !confirm(`Delete ${targets.length} selected Beds? This action cannot be undone.`)) return;
    setBulkBusy(true); setBulkNotice('');
    let deleted = 0;
    const failures: string[] = [];
    for (const bed of targets) {
      try {
        const response = await fetch(`/api/threed/beds?id=${bed.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
        deleted++;
      } catch (error) { failures.push(`${bed.name}: ${error instanceof Error ? error.message : 'Delete failed'}`); }
    }
    setBulkNotice(`Deleted ${deleted} of ${targets.length} Beds.${failures.length ? ` ${failures.join('; ')} Check the refreshed list before retrying.` : ''}`);
    setBulkBusy(false); setSelected(new Set()); fetchBeds();
    if (deleted) onModuleUpdate?.();
  }
  function heading(key: string, title: string) {
    const Icon = sort.key === key ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={loading || bulkBusy} className="inline-flex items-center gap-1" onClick={() => { resetList(); setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{title}<Icon className="h-3 w-3" aria-hidden="true" /></button></TableHead>;
  }

  const renderActions = (bed: Bed) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" disabled={bulkBusy || isSubmitting} aria-label={`Edit ${bed.name}`} onClick={() => openEditDialog(bed)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {bed.positionX && bed.positionZ && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                ({bed.positionX}, {bed.positionZ})
              </span>
            </DropdownMenuItem>
          )}
          {bed.widthFeet && bed.lengthFeet && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Ruler className="w-3 h-3" />
                {bed.widthFeet} × {bed.lengthFeet} ft
              </span>
            </DropdownMenuItem>
          )}
          {bed.squareFeet && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                {bed.squareFeet} sq ft
              </span>
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

  return (
    <div className={scrollRecords ? 'flex h-full min-h-0 flex-col gap-2' : 'space-y-2'}>
      {ToastComponent}
      <AdminWorkspaceHeader icon={Box} title="Beds" description="Manage reusable Garden Beds and their dimensions" className="shrink-0 [&>a]:text-[11px]">
        <Badge variant="secondary" className="text-xs">{loading || loadError ? '—' : total}</Badge>
        <Input aria-label="Search Beds" placeholder="Search Beds…" disabled={bulkBusy} value={searchQuery} onChange={event => { resetList(); setSearchQuery(event.target.value); }} className="h-7 min-w-48 flex-1 text-xs" />
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={bulkBusy} className="h-7 px-2 text-[11px]">
              <Plus className="w-3 h-3 mr-1" />
              Add Bed
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bed</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="bedId">Bed ID *</Label>
                <Input
                  id="bedId"
                  placeholder="e.g., BED-001"
                  value={formData.bedId}
                  onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Bed Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Garden Bed"
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
                  placeholder="Bed description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shape">Shape</Label>
                  <Select
                    value={formData.shape}
                    onValueChange={(value) => setFormData({ ...formData, shape: value })}
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
                <div>
                  <Label htmlFor="color">Color</Label>
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
              </div>

              {/* Dimensions */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Dimensions (feet)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label htmlFor="widthFeet" className="text-xs">Width</Label>
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
                    <Label htmlFor="lengthFeet" className="text-xs">Length</Label>
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
                    <Label htmlFor="heightFeet" className="text-xs">Height</Label>
                    <Input
                      id="heightFeet"
                      type="number"
                      step="0.1"
                      placeholder="1"
                      value={formData.heightFeet}
                      onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label htmlFor="squareFeet" className="text-xs">Square Feet (auto-calculated)</Label>
                  <Input
                    id="squareFeet"
                    type="number"
                    step="0.1"
                    placeholder="Auto-calculated"
                    value={formData.squareFeet}
                    onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Soil & Environment */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Soil & Environment</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="soilType" className="text-xs">Soil Type</Label>
                    <Select
                      value={formData.soilType}
                      onValueChange={(value) => setFormData({ ...formData, soilType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select soil" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOIL_TYPE_OPTIONS.map((soil) => (
                          <SelectItem key={soil.value} value={soil.value}>
                            {soil.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sunExposure" className="text-xs">Sun Exposure</Label>
                    <Select
                      value={formData.sunExposure}
                      onValueChange={(value) => setFormData({ ...formData, sunExposure: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exposure" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUN_EXPOSURE_OPTIONS.map((exposure) => (
                          <SelectItem key={exposure.value} value={exposure.value}>
                            {exposure.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 3D Position */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">3D Position</Label>
                <p className="text-xs text-muted-foreground mb-2">Position in 3D space (for map and scene)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="positionX" className="text-xs">X (Longitude)</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionY" className="text-xs">Y (Height)</Label>
                    <Input
                      id="positionY"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionZ" className="text-xs">Z (Latitude)</Label>
                    <Input
                      id="positionZ"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="rotation" className="text-xs">Rotation</Label>
                    <Input
                      id="rotation"
                      type="number"
                      step="1"
                      placeholder="0"
                      value={formData.rotation}
                      onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scale" className="text-xs">Scale</Label>
                    <Input
                      id="scale"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="1"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="status" className="text-xs">Bed Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {BED_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

              {/* Active Status */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
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
        <AdminWorkspaceLink href="/admin/threed/plants" icon={Sprout}>Plants</AdminWorkspaceLink>
        <AdminWorkspaceLink href="/admin/threed/plantings" icon={Sprout}>Plantings</AdminWorkspaceLink>
      </AdminWorkspaceHeader>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Beds unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Beds`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading || bulkBusy || isSubmitting || !!loadError || !selected.size} onClick={() => void deleteSelected()}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={bulkBusy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Beds per page" className="rounded border bg-background p-1 text-[11px]" value={pageSize} disabled={loading || bulkBusy} onChange={event => { resetList(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} size="sm" variant="outline" className="h-7 text-[11px]" disabled={loading || bulkBusy || !!loadError || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setSelected(new Set()); setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
        </div>
      </div>
      {bulkNotice && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{bulkNotice}</p>}

      <div className={scrollRecords ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible' : 'overflow-auto rounded-lg border'} role="region" aria-label="Bed records" tabIndex={0}>
          <Table className="min-w-[850px]">
            <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"><input type="checkbox" aria-label="Select Beds on this page" disabled={loading || bulkBusy || !!loadError || !beds.length} checked={beds.length > 0 && beds.every(bed => selected.has(bed.id))} ref={input => { if (input) input.indeterminate = beds.some(bed => selected.has(bed.id)) && !beds.every(bed => selected.has(bed.id)); }} onChange={event => setSelected(event.target.checked ? new Set(beds.map(bed => bed.id)) : new Set())} /></TableHead>
                {heading('name', 'Name')}
                {heading('bedId', 'ID')}
                {heading('shape', 'Shape')}
                {heading('dimensions', 'Dimensions')}
                {heading('position', 'Position')}
                {heading('status', 'Status')}
                {heading('active', 'Active')}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={9} className="py-4 text-sm"><span role="status">Loading Beds…</span></TableCell></TableRow> : loadError ? <TableRow><TableCell colSpan={9} className="py-4 text-sm"><span role="alert" className="text-destructive">{loadError}</span><Button size="sm" variant="outline" className="ml-2 h-7 text-[11px]" onClick={() => void fetchBeds()}>Retry</Button></TableCell></TableRow> : filteredBeds.length === 0 ? <TableRow><TableCell colSpan={9} className="py-4 text-sm">No Beds found.</TableCell></TableRow> : filteredBeds.map((bed) => (
                <TableRow key={bed.id} className="hover:bg-muted/50">
                  <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${bed.name}`} checked={selected.has(bed.id)} disabled={bulkBusy || loading} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(bed.id); else next.delete(bed.id); return next; })} /></TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Box aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {bed.name}
                      {!bed.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {bed.bedId || '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className="border-amber-500/50 bg-transparent text-[10px] text-amber-700 dark:text-amber-400">
                      {getShapeIcon(bed.shape)} {getOptionLabel(BED_SHAPE_OPTIONS, bed.shape)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-xs text-muted-foreground">
                    {bed.widthFeet && bed.lengthFeet ? (
                      `${bed.widthFeet} × ${bed.lengthFeet} ft`
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {bed.positionX && bed.positionZ ? (
                      `(${bed.positionX}, ${bed.positionZ})`
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <span className={`text-xs ${getStatusColor(bed.status)}`}>
                      {getOptionLabel(BED_STATUS_OPTIONS, bed.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {bed.isActive ? <Check aria-label="Active" className="mx-auto h-4 w-4 text-green-500" /> : <X aria-label="Inactive" className="mx-auto h-4 w-4 text-gray-500" />}
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(bed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBed} onOpenChange={(open) => !open && setEditingBed(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-shape">Shape</Label>
                <Select
                  value={formData.shape}
                  onValueChange={(value) => setFormData({ ...formData, shape: value })}
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
              <div>
                <Label htmlFor="edit-color">Color</Label>
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
            </div>

            {/* Dimensions */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Dimensions (feet)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-widthFeet" className="text-xs">Width</Label>
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
                  <Label htmlFor="edit-lengthFeet" className="text-xs">Length</Label>
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
                  <Label htmlFor="edit-heightFeet" className="text-xs">Height</Label>
                  <Input
                    id="edit-heightFeet"
                    type="number"
                    step="0.1"
                    value={formData.heightFeet}
                    onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="edit-squareFeet" className="text-xs">Square Feet</Label>
                <Input
                  id="edit-squareFeet"
                  type="number"
                  step="0.1"
                  value={formData.squareFeet}
                  onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Soil & Environment */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Soil & Environment</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-soilType" className="text-xs">Soil Type</Label>
                  <Select
                    value={formData.soilType}
                    onValueChange={(value) => setFormData({ ...formData, soilType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select soil" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOIL_TYPE_OPTIONS.map((soil) => (
                        <SelectItem key={soil.value} value={soil.value}>
                          {soil.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-sunExposure" className="text-xs">Sun Exposure</Label>
                  <Select
                    value={formData.sunExposure}
                    onValueChange={(value) => setFormData({ ...formData, sunExposure: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exposure" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUN_EXPOSURE_OPTIONS.map((exposure) => (
                        <SelectItem key={exposure.value} value={exposure.value}>
                          {exposure.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3D Position */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">3D Position</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-positionX" className="text-xs">X (Longitude)</Label>
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
                  <Label htmlFor="edit-positionY" className="text-xs">Y (Height)</Label>
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
                  <Label htmlFor="edit-positionZ" className="text-xs">Z (Latitude)</Label>
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
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-rotation" className="text-xs">Rotation</Label>
                  <Input
                    id="edit-rotation"
                    type="number"
                    step="1"
                    value={formData.rotation}
                    onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-scale" className="text-xs">Scale</Label>
                  <Input
                    id="edit-scale"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Status</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-status" className="text-xs">Bed Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {BED_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

            {/* Active Status */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isActive">Active</Label>
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