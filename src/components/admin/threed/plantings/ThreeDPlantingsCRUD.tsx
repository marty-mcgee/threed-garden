// components/admin/threed/plantings/ThreeDPlantingsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Sprout,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  Layers,
  Package,
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

// ✅ Types
interface Plant {
  id: number;
  plantId: string;
  commonName: string;
  scientificName: string | null;
}

interface Bed {
  id: number;
  bedId: string;
  name: string;
}

interface Model {
  id: number;
  modelName: string;
  modelType: string;
  files?: ModelFileRow[];
}

interface Planting {
  id: number;
  plantingId: string;
  plantId: number | null;
  bedId: number | null;
  customModelId: number | null;
  modelScale: string;
  modelOffset: any;
  quantity: number;
  spacingInches: number | null;
  positionX: string | null;
  positionY: string | null;
  positionZ: string | null;
  plantedDate: string | null;
  expectedGerminationDate: string | null;
  expectedHarvestDate: string | null;
  actualHarvestDate: string | null;
  isActive: boolean;
  status: string;
  growthStage: string;
  health: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  plant?: Plant;
  bed?: Bed;
  customModel?: Model;
}

interface FormData {
  plantingId: string;
  plantId: string;
  bedId: string;
  customModelId: string;
  modelScale: string;
  modelOffset: string;
  quantity: string;
  spacingInches: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  plantedDate: string;
  expectedGerminationDate: string;
  expectedHarvestDate: string;
  actualHarvestDate: string;
  isActive: boolean;
  status: string;
  growthStage: string;
  health: string;
  notes: string;
}

// ✅ Options
const PLANTING_STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'planted', label: 'Planted' },
  { value: 'growing', label: 'Growing' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'failed', label: 'Failed' },
];

const GROWTH_STAGE_OPTIONS = [
  { value: 'seed', label: 'Seed' },
  { value: 'seedling', label: 'Seedling' },
  { value: 'vegetative', label: 'Vegetative' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruiting', label: 'Fruiting' },
  { value: 'mature', label: 'Mature' },
  { value: 'dormant', label: 'Dormant' },
];

const HEALTH_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-blue-100 text-blue-700';
    case 'planted': return 'bg-green-100 text-green-700';
    case 'growing': return 'bg-yellow-100 text-yellow-700';
    case 'harvesting': return 'bg-orange-100 text-orange-700';
    case 'harvested': return 'bg-purple-100 text-purple-700';
    case 'failed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getGrowthStageColor = (stage: string) => {
  switch (stage) {
    case 'seed': return 'bg-gray-100 text-gray-700';
    case 'seedling': return 'bg-green-100 text-green-700';
    case 'vegetative': return 'bg-emerald-100 text-emerald-700';
    case 'flowering': return 'bg-pink-100 text-pink-700';
    case 'fruiting': return 'bg-orange-100 text-orange-700';
    case 'mature': return 'bg-purple-100 text-purple-700';
    case 'dormant': return 'bg-slate-100 text-slate-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export function ThreeDPlantingsCRUD({ onModuleUpdate }: { onModuleUpdate?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlanting, setEditingPlanting] = useState<Planting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    plantingId: '',
    plantId: '',
    bedId: '',
    customModelId: '',
    modelScale: '1.0',
    modelOffset: '{"x":0,"y":0,"z":0}',
    quantity: '1',
    spacingInches: '',
    positionX: '',
    positionY: '',
    positionZ: '',
    plantedDate: '',
    expectedGerminationDate: '',
    expectedHarvestDate: '',
    actualHarvestDate: '',
    isActive: true,
    status: 'planted',
    growthStage: 'seed',
    health: 'good',
    notes: '',
  });

  // ✅ Fetch data
  useEffect(() => {
    fetchPlantings();
    fetchPlants();
    fetchBeds();
    fetchModels();
  }, []);

  const fetchPlantings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/plantings?limit=100');
      const data = await response.json();
      if (data.success) {
        setPlantings(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch plantings', 'error');
        setPlantings([]);
      }
    } catch (error) {
      console.error('Error fetching plantings:', error);
      showToast('Failed to fetch plantings', 'error');
      setPlantings([]);
    } finally {
      setLoading(false);
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

  const filteredPlantings = plantings.filter((planting) =>
    (planting.plantingId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (planting.plant?.commonName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (planting.bed?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // Pre-queried model files for the currently selected custom model.
  const selectedModel = models.find((m) => String(m.id) === formData.customModelId);

  const handleCreate = async () => {
    if (!formData.plantingId) {
      showToast('Planting ID is required', 'error');
      return;
    }
    if (!formData.plantId) {
      showToast('Plant is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity) || 1,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        modelScale: formData.modelScale || '1.0',
        modelOffset: formData.modelOffset ? JSON.parse(formData.modelOffset) : { x: 0, y: 0, z: 0 },
        positionX: formData.positionX || null,
        positionY: formData.positionY || null,
        positionZ: formData.positionZ || null,
        plantedDate: formData.plantedDate || null,
        expectedGerminationDate: formData.expectedGerminationDate || null,
        expectedHarvestDate: formData.expectedHarvestDate || null,
        actualHarvestDate: formData.actualHarvestDate || null,
      };

      const response = await fetch('/api/threed/plantings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Planting created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchPlantings();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create planting', 'error');
      }
    } catch (error) {
      console.error('Error creating planting:', error);
      showToast('Failed to create planting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPlanting) return;
    if (!formData.plantingId) {
      showToast('Planting ID is required', 'error');
      return;
    }
    if (!formData.plantId) {
      showToast('Plant is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity) || 1,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        modelScale: formData.modelScale || '1.0',
        modelOffset: formData.modelOffset ? JSON.parse(formData.modelOffset) : { x: 0, y: 0, z: 0 },
        positionX: formData.positionX || null,
        positionY: formData.positionY || null,
        positionZ: formData.positionZ || null,
        plantedDate: formData.plantedDate || null,
        expectedGerminationDate: formData.expectedGerminationDate || null,
        expectedHarvestDate: formData.expectedHarvestDate || null,
        actualHarvestDate: formData.actualHarvestDate || null,
      };

      const response = await fetch(`/api/threed/plantings?id=${editingPlanting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Planting updated successfully', 'success');
        setEditingPlanting(null);
        await fetchPlantings();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update planting', 'error');
      }
    } catch (error) {
      console.error('Error updating planting:', error);
      showToast('Failed to update planting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete planting "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/plantings?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Planting deleted successfully', 'success');
        await fetchPlantings();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete planting', 'error');
      }
    } catch (error) {
      console.error('Error deleting planting:', error);
      showToast('Failed to delete planting', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      plantingId: '',
      plantId: '',
      bedId: '',
      customModelId: '',
      modelScale: '1.0',
      modelOffset: '{"x":0,"y":0,"z":0}',
      quantity: '1',
      spacingInches: '',
      positionX: '',
      positionY: '',
      positionZ: '',
      plantedDate: '',
      expectedGerminationDate: '',
      expectedHarvestDate: '',
      actualHarvestDate: '',
      isActive: true,
      status: 'planted',
      growthStage: 'seed',
      health: 'good',
      notes: '',
    });
  };

  const openEditDialog = (planting: Planting) => {
    setEditingPlanting(planting);
    setFormData({
      plantingId: planting.plantingId || '',
      plantId: planting.plantId ? String(planting.plantId) : '',
      bedId: planting.bedId ? String(planting.bedId) : '',
      customModelId: planting.customModelId ? String(planting.customModelId) : '',
      modelScale: planting.modelScale || '1.0',
      modelOffset: planting.modelOffset ? JSON.stringify(planting.modelOffset) : '{"x":0,"y":0,"z":0}',
      quantity: String(planting.quantity || 1),
      spacingInches: planting.spacingInches ? String(planting.spacingInches) : '',
      positionX: planting.positionX || '',
      positionY: planting.positionY || '',
      positionZ: planting.positionZ || '',
      plantedDate: planting.plantedDate ? new Date(planting.plantedDate).toISOString().split('T')[0] : '',
      expectedGerminationDate: planting.expectedGerminationDate ? new Date(planting.expectedGerminationDate).toISOString().split('T')[0] : '',
      expectedHarvestDate: planting.expectedHarvestDate ? new Date(planting.expectedHarvestDate).toISOString().split('T')[0] : '',
      actualHarvestDate: planting.actualHarvestDate ? new Date(planting.actualHarvestDate).toISOString().split('T')[0] : '',
      isActive: planting.isActive ?? true,
      status: planting.status || 'planted',
      growthStage: planting.growthStage || 'seed',
      health: planting.health || 'good',
      notes: planting.notes || '',
    });
  };

  const renderActions = (planting: Planting) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(planting)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {planting.positionX && planting.positionZ && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                ({planting.positionX}, {planting.positionZ})
              </span>
            </DropdownMenuItem>
          )}
          {planting.quantity && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Qty: {planting.quantity}
              </span>
            </DropdownMenuItem>
          )}
          {planting.plant && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Plant: {planting.plant.commonName}
              </span>
            </DropdownMenuItem>
          )}
          {planting.bed && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Bed: {planting.bed.name}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(planting.id, planting.plantingId)}
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
          <Sprout className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">Plantings</span>
          <Badge variant="secondary" className="text-xs">
            {filteredPlantings.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Planting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Planting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="plantingId">Planting ID *</Label>
                <Input
                  id="plantingId"
                  placeholder="e.g., PLANTING-001"
                  value={formData.plantingId}
                  onChange={(e) => setFormData({ ...formData, plantingId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="plantId">Plant *</Label>
                <Select
                  value={formData.plantId}
                  onValueChange={(value) => setFormData({ ...formData, plantId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plant" />
                  </SelectTrigger>
                  <SelectContent>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={String(plant.id)}>
                        {plant.commonName} {plant.scientificName ? `(${plant.scientificName})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bedId">Bed</Label>
                <Select
                  value={formData.bedId}
                  onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bed (optional)" />
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

              <div>
                <Label htmlFor="customModelId">Custom Model</Label>
                <Select
                  value={formData.customModelId}
                  onValueChange={(value) => setFormData({ ...formData, customModelId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model (optional)" />
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

              {selectedModel && (
                <ModelFileList
                  files={selectedModel.files ?? []}
                  emptyText="No files attached to this model (add them in 3D Models)"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="spacingInches">Spacing (inches)</Label>
                  <Input
                    id="spacingInches"
                    type="number"
                    min="0"
                    placeholder="e.g., 12"
                    value={formData.spacingInches}
                    onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                    disabled={isSubmitting}
                  />
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
              </div>

              {/* Model Settings */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Model Settings</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="modelScale" className="text-xs">Model Scale</Label>
                    <Input
                      id="modelScale"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.modelScale}
                      onChange={(e) => setFormData({ ...formData, modelScale: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="modelOffset" className="text-xs">Model Offset (JSON)</Label>
                    <Input
                      id="modelOffset"
                      placeholder='{"x":0,"y":0,"z":0}'
                      value={formData.modelOffset}
                      onChange={(e) => setFormData({ ...formData, modelOffset: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Growth */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Status & Growth</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="status" className="text-xs">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANTING_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="growthStage" className="text-xs">Growth Stage</Label>
                    <Select
                      value={formData.growthStage}
                      onValueChange={(value) => setFormData({ ...formData, growthStage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select growth stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {GROWTH_STAGE_OPTIONS.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="health" className="text-xs">Health</Label>
                    <Select
                      value={formData.health}
                      onValueChange={(value) => setFormData({ ...formData, health: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select health" />
                      </SelectTrigger>
                      <SelectContent>
                        {HEALTH_OPTIONS.map((health) => (
                          <SelectItem key={health.value} value={health.value}>
                            {health.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Dates</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="plantedDate" className="text-xs">Planted Date</Label>
                    <Input
                      id="plantedDate"
                      type="date"
                      value={formData.plantedDate}
                      onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedGerminationDate" className="text-xs">Expected Germination</Label>
                    <Input
                      id="expectedGerminationDate"
                      type="date"
                      value={formData.expectedGerminationDate}
                      onChange={(e) => setFormData({ ...formData, expectedGerminationDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedHarvestDate" className="text-xs">Expected Harvest</Label>
                    <Input
                      id="expectedHarvestDate"
                      type="date"
                      value={formData.expectedHarvestDate}
                      onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="actualHarvestDate" className="text-xs">Actual Harvest</Label>
                    <Input
                      id="actualHarvestDate"
                      type="date"
                      value={formData.actualHarvestDate}
                      onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })}
                      disabled={isSubmitting}
                    />
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
                  'Create Planting'
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
            placeholder="Search by ID, plant, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PLANTING_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
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
            setFilterStatus('all');
            setFilterActive('all');
            fetchPlantings();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Plantings Table */}
      {filteredPlantings.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Sprout className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No plantings found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first planting
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">ID</TableHead>
                <TableHead className="text-xs py-1">Plant</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Bed</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Growth</TableHead>
                <TableHead className="hidden xl:table-cell text-xs py-1">Position</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlantings.map((planting) => (
                <TableRow key={planting.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {planting.plantingId}
                  </TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-3.5 h-3.5 text-green-500" />
                      {planting.plant?.commonName || 'Unknown'}
                      {!planting.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {planting.bed?.name || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getStatusColor(planting.status)}`}>
                      {getOptionLabel(PLANTING_STATUS_OPTIONS, planting.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getGrowthStageColor(planting.growthStage)}`}>
                      {getOptionLabel(GROWTH_STAGE_OPTIONS, planting.growthStage)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {planting.positionX && planting.positionZ ? (
                      `(${planting.positionX}, ${planting.positionZ})`
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${planting.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {planting.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(planting)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPlanting} onOpenChange={(open) => !open && setEditingPlanting(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Planting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-plantingId">Planting ID *</Label>
              <Input
                id="edit-plantingId"
                value={formData.plantingId}
                onChange={(e) => setFormData({ ...formData, plantingId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-plantId">Plant *</Label>
              <Select
                value={formData.plantId}
                onValueChange={(value) => setFormData({ ...formData, plantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plant" />
                </SelectTrigger>
                <SelectContent>
                  {plants.map((plant) => (
                    <SelectItem key={plant.id} value={String(plant.id)}>
                      {plant.commonName} {plant.scientificName ? `(${plant.scientificName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-bedId">Bed</Label>
              <Select
                value={formData.bedId}
                onValueChange={(value) => setFormData({ ...formData, bedId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bed (optional)" />
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

            <div>
              <Label htmlFor="edit-customModelId">Custom Model</Label>
              <Select
                value={formData.customModelId}
                onValueChange={(value) => setFormData({ ...formData, customModelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model (optional)" />
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

            {selectedModel && (
              <ModelFileList
                files={selectedModel.files ?? []}
                emptyText="No files attached to this model (add them in 3D Models)"
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-spacingInches">Spacing (inches)</Label>
                <Input
                  id="edit-spacingInches"
                  type="number"
                  min="0"
                  value={formData.spacingInches}
                  onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                  disabled={isSubmitting}
                />
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
            </div>

            {/* Model Settings */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Model Settings</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-modelScale" className="text-xs">Model Scale</Label>
                  <Input
                    id="edit-modelScale"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.modelScale}
                    onChange={(e) => setFormData({ ...formData, modelScale: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-modelOffset" className="text-xs">Model Offset (JSON)</Label>
                  <Input
                    id="edit-modelOffset"
                    value={formData.modelOffset}
                    onChange={(e) => setFormData({ ...formData, modelOffset: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Status & Growth */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Status & Growth</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-status" className="text-xs">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANTING_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-growthStage" className="text-xs">Growth Stage</Label>
                  <Select
                    value={formData.growthStage}
                    onValueChange={(value) => setFormData({ ...formData, growthStage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select growth stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROWTH_STAGE_OPTIONS.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-health" className="text-xs">Health</Label>
                  <Select
                    value={formData.health}
                    onValueChange={(value) => setFormData({ ...formData, health: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select health" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEALTH_OPTIONS.map((health) => (
                        <SelectItem key={health.value} value={health.value}>
                          {health.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Dates</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-plantedDate" className="text-xs">Planted Date</Label>
                  <Input
                    id="edit-plantedDate"
                    type="date"
                    value={formData.plantedDate}
                    onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expectedGerminationDate" className="text-xs">Expected Germination</Label>
                  <Input
                    id="edit-expectedGerminationDate"
                    type="date"
                    value={formData.expectedGerminationDate}
                    onChange={(e) => setFormData({ ...formData, expectedGerminationDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expectedHarvestDate" className="text-xs">Expected Harvest</Label>
                  <Input
                    id="edit-expectedHarvestDate"
                    type="date"
                    value={formData.expectedHarvestDate}
                    onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-actualHarvestDate" className="text-xs">Actual Harvest</Label>
                  <Input
                    id="edit-actualHarvestDate"
                    type="date"
                    value={formData.actualHarvestDate}
                    onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })}
                    disabled={isSubmitting}
                  />
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