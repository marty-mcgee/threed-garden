// components/admin/threed/plants/ThreeDPlantsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Box,
  Edit,
  Trash2,
  Loader2,
  Sprout,
  MoreHorizontal,
  Eye,
  EyeOff,
  Ruler,
  Sun,
  Droplet,
  Thermometer,
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
import { ModelFileList, ModelFileRow } from '@/components/admin/threed/models/ModelFileList';

import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';

// ✅ Types
interface Model {
  id: number;
  modelName: string;
  modelType: string;
  files?: ModelFileRow[];
}

interface Plant {
  id: number;
  plantId: string;
  commonName: string;
  scientificName: string | null;
  variety: string | null;
  family: string | null;
  type: string;
  isActive: boolean;
  status: string;
  modelId: number | null;
  growthHabit: string | null;
  daysToMaturity: number | null;
  daysToGermination: number | null;
  daysToHarvest: number | null;
  spacingInches: number | null;
  rowSpacingInches: number | null;
  plantingDepthInches: string | null;
  sunlight: string | null;
  waterNeeds: string | null;
  soilType: string | null;
  soilPH: string | null;
  hardinessZone: string | null;
  frostTolerant: boolean;
  perennial: boolean;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  careInstructions: string | null;
  harvestInstructions: string | null;
  companionPlants: string | null;
  avoidPlants: string | null;
  source: string | null;
  rawData: any;
  createdAt: string;
  updatedAt: string;
  model?: Model;
}

interface FormData {
  plantId: string;
  commonName: string;
  scientificName: string;
  variety: string;
  family: string;
  type: string;
  isActive: boolean;
  status: string;
  modelId: string;
  growthHabit: string;
  daysToMaturity: string;
  daysToGermination: string;
  daysToHarvest: string;
  spacingInches: string;
  rowSpacingInches: string;
  plantingDepthInches: string;
  sunlight: string;
  waterNeeds: string;
  soilType: string;
  soilPH: string;
  hardinessZone: string;
  frostTolerant: boolean;
  perennial: boolean;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  careInstructions: string;
  harvestInstructions: string;
  companionPlants: string;
  avoidPlants: string;
  source: string;
  rawData: string;
}

// ✅ Options
const PLANT_TYPE_OPTIONS = [
  { value: 'Vegetable', label: 'Vegetable' },
  { value: 'Fruit', label: 'Fruit' },
  { value: 'Herb', label: 'Herb' },
  { value: 'Flower', label: 'Flower' },
  { value: 'Tree', label: 'Tree' },
  { value: 'Shrub', label: 'Shrub' },
  { value: 'CoverCrop', label: 'Cover Crop' },
];

const PLANT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const SUNLIGHT_OPTIONS = [
  { value: 'Full Sun', label: 'Full Sun' },
  { value: 'Partial Sun', label: 'Partial Sun' },
  { value: 'Partial Shade', label: 'Partial Shade' },
  { value: 'Full Shade', label: 'Full Shade' },
];

const WATER_NEEDS_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Vegetable': return 'border-green-500/50 text-green-700 dark:text-green-400';
    case 'Fruit': return 'border-orange-500/50 text-orange-700 dark:text-orange-400';
    case 'Herb': return 'border-lime-500/50 text-lime-700 dark:text-lime-400';
    case 'Flower': return 'border-pink-500/50 text-pink-700 dark:text-pink-400';
    case 'Tree': return 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400';
    case 'Shrub': return 'border-amber-500/50 text-amber-700 dark:text-amber-400';
    case 'CoverCrop': return 'border-teal-500/50 text-teal-700 dark:text-teal-400';
    default: return 'border-gray-500/50 text-gray-700 dark:text-gray-400';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'inactive': return 'bg-gray-100 text-gray-700';
    case 'archived': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};



export function ThreeDPlantsCRUD({ onModuleUpdate, scrollRecords = false }: { onModuleUpdate?: () => void; scrollRecords?: boolean }) {
  const { showToast, ToastComponent } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const fetchPlants = () => setRevision(value => value + 1);
  function resetList() { setPage(0); setSelected(new Set()); setLoading(true); }


  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    plantId: '',
    commonName: '',
    scientificName: '',
    variety: '',
    family: '',
    type: 'Vegetable',
    isActive: true,
    status: 'active',
    modelId: '',
    growthHabit: '',
    daysToMaturity: '',
    daysToGermination: '',
    daysToHarvest: '',
    spacingInches: '',
    rowSpacingInches: '',
    plantingDepthInches: '',
    sunlight: 'Full Sun',
    waterNeeds: 'Medium',
    soilType: '',
    soilPH: '',
    hardinessZone: '',
    frostTolerant: false,
    perennial: false,
    imageUrl: '',
    thumbnailUrl: '',
    description: '',
    careInstructions: '',
    harvestInstructions: '',
    companionPlants: '',
    avoidPlants: '',
    source: '',
    rawData: '{}',
  });

  useEffect(() => { void fetchModels(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(''); setSelected(new Set());
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search: searchQuery, sort: sort.key, direction: sort.direction });
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/plants?${params}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch Plants');
        if (controller.signal.aborted) return;
        setPlants(data.data); setTotal(Number(data.pagination.total));
        if (page > 0 && page * pageSize >= data.pagination.total) setPage(Math.max(0, Math.ceil(data.pagination.total / pageSize) - 1));
      } catch (error) {
        if (!controller.signal.aborted) { setLoadError(error instanceof Error ? error.message : 'Failed to fetch Plants'); setPlants([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, searchQuery, sort, revision]);

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

  const filteredPlants = plants;

  // Pre-queried model files for the currently selected model (threed_model_files).
  const selectedModel = models.find((m) => String(m.id) === formData.modelId);

  const handleCreate = async () => {
    if (!formData.plantId) {
      showToast('Plant ID is required', 'error');
      return;
    }
    if (!formData.commonName) {
      showToast('Common name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        modelId: formData.modelId ? parseInt(formData.modelId) : null,
        daysToMaturity: formData.daysToMaturity ? parseInt(formData.daysToMaturity) : null,
        daysToGermination: formData.daysToGermination ? parseInt(formData.daysToGermination) : null,
        daysToHarvest: formData.daysToHarvest ? parseInt(formData.daysToHarvest) : null,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        rowSpacingInches: formData.rowSpacingInches ? parseInt(formData.rowSpacingInches) : null,
        plantingDepthInches: formData.plantingDepthInches || null,
        soilPH: formData.soilPH || null,
        rawData: JSON.parse(formData.rawData),
      };

      const response = await fetch('/api/threed/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Plant created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchPlants();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create plant', 'error');
      }
    } catch (error) {
      console.error('Error creating plant:', error);
      showToast('Failed to create plant', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPlant) return;
    if (!formData.plantId) {
      showToast('Plant ID is required', 'error');
      return;
    }
    if (!formData.commonName) {
      showToast('Common name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        modelId: formData.modelId ? parseInt(formData.modelId) : null,
        daysToMaturity: formData.daysToMaturity ? parseInt(formData.daysToMaturity) : null,
        daysToGermination: formData.daysToGermination ? parseInt(formData.daysToGermination) : null,
        daysToHarvest: formData.daysToHarvest ? parseInt(formData.daysToHarvest) : null,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        rowSpacingInches: formData.rowSpacingInches ? parseInt(formData.rowSpacingInches) : null,
        plantingDepthInches: formData.plantingDepthInches || null,
        soilPH: formData.soilPH || null,
        rawData: JSON.parse(formData.rawData),
      };

      const response = await fetch(`/api/threed/plants?id=${editingPlant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Plant updated successfully', 'success');
        setEditingPlant(null);
        await fetchPlants();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update plant', 'error');
      }
    } catch (error) {
      console.error('Error updating plant:', error);
      showToast('Failed to update plant', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (bulkBusy || isSubmitting) return;
    if (!confirm(`Delete plant "${name}"? This action cannot be undone.`)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threed/plants?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Plant deleted successfully', 'success');
        await fetchPlants();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete plant', 'error');
      }
    } catch (error) {
      console.error('Error deleting plant:', error);
      showToast('Failed to delete plant', 'error');
    } finally { setIsSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({
      plantId: '',
      commonName: '',
      scientificName: '',
      variety: '',
      family: '',
      type: 'Vegetable',
      isActive: true,
      status: 'active',
      modelId: '',
      growthHabit: '',
      daysToMaturity: '',
      daysToGermination: '',
      daysToHarvest: '',
      spacingInches: '',
      rowSpacingInches: '',
      plantingDepthInches: '',
      sunlight: 'Full Sun',
      waterNeeds: 'Medium',
      soilType: '',
      soilPH: '',
      hardinessZone: '',
      frostTolerant: false,
      perennial: false,
      imageUrl: '',
      thumbnailUrl: '',
      description: '',
      careInstructions: '',
      harvestInstructions: '',
      companionPlants: '',
      avoidPlants: '',
      source: '',
      rawData: '{}',
    });
  };

  const openEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      plantId: plant.plantId || '',
      commonName: plant.commonName,
      scientificName: plant.scientificName || '',
      variety: plant.variety || '',
      family: plant.family || '',
      type: plant.type || 'Vegetable',
      isActive: plant.isActive ?? true,
      status: plant.status || 'active',
      modelId: plant.modelId ? String(plant.modelId) : '',
      growthHabit: plant.growthHabit || '',
      daysToMaturity: plant.daysToMaturity ? String(plant.daysToMaturity) : '',
      daysToGermination: plant.daysToGermination ? String(plant.daysToGermination) : '',
      daysToHarvest: plant.daysToHarvest ? String(plant.daysToHarvest) : '',
      spacingInches: plant.spacingInches ? String(plant.spacingInches) : '',
      rowSpacingInches: plant.rowSpacingInches ? String(plant.rowSpacingInches) : '',
      plantingDepthInches: plant.plantingDepthInches || '',
      sunlight: plant.sunlight || 'Full Sun',
      waterNeeds: plant.waterNeeds || 'Medium',
      soilType: plant.soilType || '',
      soilPH: plant.soilPH || '',
      hardinessZone: plant.hardinessZone || '',
      frostTolerant: plant.frostTolerant ?? false,
      perennial: plant.perennial ?? false,
      imageUrl: plant.imageUrl || '',
      thumbnailUrl: plant.thumbnailUrl || '',
      description: plant.description || '',
      careInstructions: plant.careInstructions || '',
      harvestInstructions: plant.harvestInstructions || '',
      companionPlants: plant.companionPlants || '',
      avoidPlants: plant.avoidPlants || '',
      source: plant.source || '',
      rawData: JSON.stringify(plant.rawData || {}),
    });
  };

  async function deleteSelected() {
    const targets = plants.filter(plant => selected.has(plant.id));
    if (bulkBusy || loading || isSubmitting || !targets.length || !confirm(`Delete ${targets.length} selected Plants? This action cannot be undone.`)) return;
    setBulkBusy(true); setBulkNotice('');
    let deleted = 0;
    const failures: string[] = [];
    for (const plant of targets) {
      try {
        const response = await fetch(`/api/threed/plants?id=${plant.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
        deleted++;
      } catch (error) { failures.push(`${plant.commonName}: ${error instanceof Error ? error.message : 'Delete failed'}`); }
    }
    setBulkNotice(`Deleted ${deleted} of ${targets.length} Plants.${failures.length ? ` ${failures.join('; ')} Check the refreshed list before retrying.` : ''}`);
    setBulkBusy(false); setSelected(new Set()); fetchPlants();
    if (deleted) onModuleUpdate?.();
  }
  function heading(key: string, title: string) {
    const Icon = sort.key === key ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={loading || bulkBusy} className="inline-flex items-center gap-1" onClick={() => { resetList(); setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{title}<Icon className="h-3 w-3" aria-hidden="true" /></button></TableHead>;
  }

  const renderActions = (plant: Plant) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" disabled={bulkBusy || isSubmitting} aria-label={`Edit ${plant.commonName}`} onClick={() => openEditDialog(plant)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {plant.model && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Model: {plant.model.modelName}
              </span>
            </DropdownMenuItem>
          )}
          {plant.daysToMaturity && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Maturity: {plant.daysToMaturity} days
              </span>
            </DropdownMenuItem>
          )}
          {plant.hardinessZone && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Zone: {plant.hardinessZone}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(plant.id, plant.commonName)}
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

      <AdminWorkspaceHeader icon={Sprout} title="Plants" description="Manage reusable Plants, Models and care instructions" className="shrink-0 [&>a]:text-[11px]">
        <Badge variant="secondary" className="text-xs">{loading || loadError ? '—' : total}</Badge>
        <Input aria-label="Search Plants" placeholder="Search Plants…" disabled={bulkBusy} value={searchQuery} onChange={event => { resetList(); setSearchQuery(event.target.value); }} className="h-7 min-w-48 flex-1 text-xs" />
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={bulkBusy} className="h-7 px-2 text-[11px]">
              <Plus className="w-3 h-3 mr-1" />
              Add Plant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Plant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="plantId">Plant ID *</Label>
                <Input
                  id="plantId"
                  placeholder="e.g., PLANT-001"
                  value={formData.plantId}
                  onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="commonName">Common Name *</Label>
                <Input
                  id="commonName"
                  placeholder="e.g., Tomato"
                  value={formData.commonName}
                  onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scientificName">Scientific Name</Label>
                  <Input
                    id="scientificName"
                    placeholder="e.g., Solanum lycopersicum"
                    value={formData.scientificName}
                    onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="variety">Variety</Label>
                  <Input
                    id="variety"
                    placeholder="e.g., Roma"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="family">Family</Label>
                  <Input
                    id="family"
                    placeholder="e.g., Solanaceae"
                    value={formData.family}
                    onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="modelId">Model</Label>
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
              </div>

              {/* Selected model files */}
              {selectedModel && (
                <ModelFileList
                  files={selectedModel.files ?? []}
                  emptyText="No files attached to this model (add them in Models)"
                />
              )}

              {/* Growth Parameters */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Growth Parameters</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="growthHabit" className="text-xs">Growth Habit</Label>
                    <Input
                      id="growthHabit"
                      placeholder="e.g., Determinate, Indeterminate"
                      value={formData.growthHabit}
                      onChange={(e) => setFormData({ ...formData, growthHabit: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="daysToMaturity" className="text-xs">Days to Maturity</Label>
                      <Input
                        id="daysToMaturity"
                        type="number"
                        min="0"
                        placeholder="70"
                        value={formData.daysToMaturity}
                        onChange={(e) => setFormData({ ...formData, daysToMaturity: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="daysToGermination" className="text-xs">Days to Germination</Label>
                      <Input
                        id="daysToGermination"
                        type="number"
                        min="0"
                        placeholder="7"
                        value={formData.daysToGermination}
                        onChange={(e) => setFormData({ ...formData, daysToGermination: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="daysToHarvest" className="text-xs">Days to Harvest</Label>
                      <Input
                        id="daysToHarvest"
                        type="number"
                        min="0"
                        placeholder="85"
                        value={formData.daysToHarvest}
                        onChange={(e) => setFormData({ ...formData, daysToHarvest: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Spacing (inches)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label htmlFor="spacingInches" className="text-xs">Spacing</Label>
                    <Input
                      id="spacingInches"
                      type="number"
                      min="0"
                      placeholder="12"
                      value={formData.spacingInches}
                      onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rowSpacingInches" className="text-xs">Row Spacing</Label>
                    <Input
                      id="rowSpacingInches"
                      type="number"
                      min="0"
                      placeholder="18"
                      value={formData.rowSpacingInches}
                      onChange={(e) => setFormData({ ...formData, rowSpacingInches: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="plantingDepthInches" className="text-xs">Planting Depth</Label>
                    <Input
                      id="plantingDepthInches"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0.5"
                      value={formData.plantingDepthInches}
                      onChange={(e) => setFormData({ ...formData, plantingDepthInches: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Environmental Needs */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Environmental Needs</Label>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="sunlight" className="text-xs">Sunlight</Label>
                      <Select
                        value={formData.sunlight}
                        onValueChange={(value) => setFormData({ ...formData, sunlight: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sunlight" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUNLIGHT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="waterNeeds" className="text-xs">Water Needs</Label>
                      <Select
                        value={formData.waterNeeds}
                        onValueChange={(value) => setFormData({ ...formData, waterNeeds: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select water needs" />
                        </SelectTrigger>
                        <SelectContent>
                          {WATER_NEEDS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="soilType" className="text-xs">Soil Type</Label>
                      <Input
                        id="soilType"
                        placeholder="e.g., Loam"
                        value={formData.soilType}
                        onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="soilPH" className="text-xs">Soil pH</Label>
                      <Input
                        id="soilPH"
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        placeholder="6.5"
                        value={formData.soilPH}
                        onChange={(e) => setFormData({ ...formData, soilPH: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="hardinessZone" className="text-xs">Hardiness Zone</Label>
                      <Input
                        id="hardinessZone"
                        placeholder="e.g., 9a"
                        value={formData.hardinessZone}
                        onChange={(e) => setFormData({ ...formData, hardinessZone: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="frostTolerant"
                          checked={formData.frostTolerant}
                          onCheckedChange={(checked) => setFormData({ ...formData, frostTolerant: checked })}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="frostTolerant" className="text-xs">Frost Tolerant</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="perennial"
                          checked={formData.perennial}
                          onCheckedChange={(checked) => setFormData({ ...formData, perennial: checked })}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="perennial" className="text-xs">Perennial</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Images</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="imageUrl" className="text-xs">Image URL</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="thumbnailUrl" className="text-xs">Thumbnail URL</Label>
                    <Input
                      id="thumbnailUrl"
                      placeholder="https://example.com/thumbnail.jpg"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Descriptions</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="description" className="text-xs">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Plant description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="careInstructions" className="text-xs">Care Instructions</Label>
                    <Textarea
                      id="careInstructions"
                      placeholder="Care instructions..."
                      value={formData.careInstructions}
                      onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="harvestInstructions" className="text-xs">Harvest Instructions</Label>
                    <Textarea
                      id="harvestInstructions"
                      placeholder="Harvest instructions..."
                      value={formData.harvestInstructions}
                      onChange={(e) => setFormData({ ...formData, harvestInstructions: e.target.value })}
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Companion Planting */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Companion Planting</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="companionPlants" className="text-xs">Companion Plants</Label>
                    <Input
                      id="companionPlants"
                      placeholder="e.g., Basil, Marigold"
                      value={formData.companionPlants}
                      onChange={(e) => setFormData({ ...formData, companionPlants: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avoidPlants" className="text-xs">Avoid Plants</Label>
                    <Input
                      id="avoidPlants"
                      placeholder="e.g., Fennel, Potatoes"
                      value={formData.avoidPlants}
                      onChange={(e) => setFormData({ ...formData, avoidPlants: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Source & Raw Data */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Source & Data</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="source" className="text-xs">Source</Label>
                    <Input
                      id="source"
                      placeholder="e.g., Seed catalog"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rawData" className="text-xs">Raw Data (JSON)</Label>
                    <Input
                      id="rawData"
                      placeholder='{"key": "value"}'
                      value={formData.rawData}
                      onChange={(e) => setFormData({ ...formData, rawData: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
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
                  'Create Plant'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <AdminWorkspaceLink href="/admin/threed/models" icon={Box}>Models</AdminWorkspaceLink>
        <AdminWorkspaceLink href="/admin/threed/plantings" icon={Sprout}>Plantings</AdminWorkspaceLink>
      </AdminWorkspaceHeader>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Plants unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Plants`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading || bulkBusy || isSubmitting || !!loadError || !selected.size} onClick={() => void deleteSelected()}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={bulkBusy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Plants per page" className="rounded border bg-background p-1 text-[11px]" value={pageSize} disabled={loading || bulkBusy} onChange={event => { resetList(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} size="sm" variant="outline" className="h-7 text-[11px]" disabled={loading || bulkBusy || !!loadError || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setSelected(new Set()); setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
        </div>
      </div>
      {bulkNotice && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{bulkNotice}</p>}

      {/* Plants Table */}
      <div className={scrollRecords ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible' : 'overflow-auto rounded-lg border'} role="region" aria-label="Plant records" tabIndex={0}>
          <Table className="min-w-[780px]">
            <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"><input type="checkbox" aria-label="Select Plants on this page" disabled={loading || bulkBusy || !!loadError || !plants.length} checked={plants.length > 0 && plants.every(plant => selected.has(plant.id))} ref={input => { if (input) input.indeterminate = plants.some(plant => selected.has(plant.id)) && !plants.every(plant => selected.has(plant.id)); }} onChange={event => setSelected(event.target.checked ? new Set(plants.map(plant => plant.id)) : new Set())} /></TableHead>
                {heading('name', 'Common Name')}{heading('plantId', 'ID')}{heading('type', 'Type')}{heading('maturity', 'Maturity')}{heading('status', 'Status')}{heading('active', 'Active')}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="py-4 text-sm"><span role="status">Loading Plants…</span></TableCell></TableRow> : loadError ? <TableRow><TableCell colSpan={8} className="py-4 text-sm"><span role="alert" className="text-destructive">{loadError}</span><Button variant="outline" size="sm" className="ml-2 h-7 text-xs" onClick={() => void fetchPlants()}>Retry</Button></TableCell></TableRow> : filteredPlants.length === 0 ? <TableRow><TableCell colSpan={8} className="py-4 text-sm">No Plants found.</TableCell></TableRow> : filteredPlants.map((plant) => (
                <TableRow key={plant.id} className="hover:bg-muted/50">
                  <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${plant.commonName}`} checked={selected.has(plant.id)} disabled={bulkBusy || loading} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(plant.id); else next.delete(plant.id); return next; })} /></TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Sprout aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      {plant.commonName}
                      {!plant.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {plant.plantId || '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className={`bg-transparent text-[10px] ${getTypeColor(plant.type)}`}>
                      {plant.type || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {plant.daysToMaturity ? `${plant.daysToMaturity}d` : '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    <span className={`text-xs ${plant.status === 'active' ? 'text-green-500' : plant.status === 'pending' ? 'text-yellow-500' : plant.status === 'maintenance' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {getOptionLabel(PLANT_STATUS_OPTIONS, plant.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {plant.isActive ? <Check aria-label="Active" className="mx-auto h-4 w-4 text-green-500" /> : <X aria-label="Inactive" className="mx-auto h-4 w-4 text-gray-500" />}
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(plant)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlant} onOpenChange={(open) => !open && setEditingPlant(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-plantId">Plant ID *</Label>
              <Input
                id="edit-plantId"
                value={formData.plantId}
                onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-commonName">Common Name *</Label>
              <Input
                id="edit-commonName"
                value={formData.commonName}
                onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-scientificName">Scientific Name</Label>
                <Input
                  id="edit-scientificName"
                  value={formData.scientificName}
                  onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-variety">Variety</Label>
                <Input
                  id="edit-variety"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-family">Family</Label>
                <Input
                  id="edit-family"
                  value={formData.family}
                  onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-modelId">Model</Label>
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
            </div>

            {/* Selected model files */}
            {selectedModel && (
              <ModelFileList
                files={selectedModel.files ?? []}
                emptyText="No files attached to this model (add them in Models)"
              />
            )}

            {/* Growth Parameters */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Growth Parameters</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-growthHabit" className="text-xs">Growth Habit</Label>
                  <Input
                    id="edit-growthHabit"
                    value={formData.growthHabit}
                    onChange={(e) => setFormData({ ...formData, growthHabit: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="edit-daysToMaturity" className="text-xs">Days to Maturity</Label>
                    <Input
                      id="edit-daysToMaturity"
                      type="number"
                      min="0"
                      value={formData.daysToMaturity}
                      onChange={(e) => setFormData({ ...formData, daysToMaturity: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-daysToGermination" className="text-xs">Days to Germination</Label>
                    <Input
                      id="edit-daysToGermination"
                      type="number"
                      min="0"
                      value={formData.daysToGermination}
                      onChange={(e) => setFormData({ ...formData, daysToGermination: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-daysToHarvest" className="text-xs">Days to Harvest</Label>
                    <Input
                      id="edit-daysToHarvest"
                      type="number"
                      min="0"
                      value={formData.daysToHarvest}
                      onChange={(e) => setFormData({ ...formData, daysToHarvest: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Spacing (inches)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-spacingInches" className="text-xs">Spacing</Label>
                  <Input
                    id="edit-spacingInches"
                    type="number"
                    min="0"
                    value={formData.spacingInches}
                    onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rowSpacingInches" className="text-xs">Row Spacing</Label>
                  <Input
                    id="edit-rowSpacingInches"
                    type="number"
                    min="0"
                    value={formData.rowSpacingInches}
                    onChange={(e) => setFormData({ ...formData, rowSpacingInches: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-plantingDepthInches" className="text-xs">Planting Depth</Label>
                  <Input
                    id="edit-plantingDepthInches"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.plantingDepthInches}
                    onChange={(e) => setFormData({ ...formData, plantingDepthInches: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Environmental Needs */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Environmental Needs</Label>
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-sunlight" className="text-xs">Sunlight</Label>
                    <Select
                      value={formData.sunlight}
                      onValueChange={(value) => setFormData({ ...formData, sunlight: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sunlight" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUNLIGHT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-waterNeeds" className="text-xs">Water Needs</Label>
                    <Select
                      value={formData.waterNeeds}
                      onValueChange={(value) => setFormData({ ...formData, waterNeeds: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select water needs" />
                      </SelectTrigger>
                      <SelectContent>
                        {WATER_NEEDS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-soilType" className="text-xs">Soil Type</Label>
                    <Input
                      id="edit-soilType"
                      value={formData.soilType}
                      onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-soilPH" className="text-xs">Soil pH</Label>
                    <Input
                      id="edit-soilPH"
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      value={formData.soilPH}
                      onChange={(e) => setFormData({ ...formData, soilPH: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-hardinessZone" className="text-xs">Hardiness Zone</Label>
                    <Input
                      id="edit-hardinessZone"
                      value={formData.hardinessZone}
                      onChange={(e) => setFormData({ ...formData, hardinessZone: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="edit-frostTolerant"
                        checked={formData.frostTolerant}
                        onCheckedChange={(checked) => setFormData({ ...formData, frostTolerant: checked })}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="edit-frostTolerant" className="text-xs">Frost Tolerant</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="edit-perennial"
                        checked={formData.perennial}
                        onCheckedChange={(checked) => setFormData({ ...formData, perennial: checked })}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="edit-perennial" className="text-xs">Perennial</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Images</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-imageUrl" className="text-xs">Image URL</Label>
                  <Input
                    id="edit-imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-thumbnailUrl" className="text-xs">Thumbnail URL</Label>
                  <Input
                    id="edit-thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Descriptions */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Descriptions</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-description" className="text-xs">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-careInstructions" className="text-xs">Care Instructions</Label>
                  <Textarea
                    id="edit-careInstructions"
                    value={formData.careInstructions}
                    onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-harvestInstructions" className="text-xs">Harvest Instructions</Label>
                  <Textarea
                    id="edit-harvestInstructions"
                    value={formData.harvestInstructions}
                    onChange={(e) => setFormData({ ...formData, harvestInstructions: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Companion Planting */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Companion Planting</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-companionPlants" className="text-xs">Companion Plants</Label>
                  <Input
                    id="edit-companionPlants"
                    value={formData.companionPlants}
                    onChange={(e) => setFormData({ ...formData, companionPlants: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-avoidPlants" className="text-xs">Avoid Plants</Label>
                  <Input
                    id="edit-avoidPlants"
                    value={formData.avoidPlants}
                    onChange={(e) => setFormData({ ...formData, avoidPlants: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Source & Raw Data */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Source & Data</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-source" className="text-xs">Source</Label>
                  <Input
                    id="edit-source"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rawData" className="text-xs">Raw Data (JSON)</Label>
                  <Input
                    id="edit-rawData"
                    value={formData.rawData}
                    onChange={(e) => setFormData({ ...formData, rawData: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
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
