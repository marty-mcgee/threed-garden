// components/admin/threed/watering-schedules/ThreeDWateringSchedulesCRUD.tsx
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
  X,
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

// ✅ Import types from lib
import {
  ThreeDPlanting,
  ThreeDPlantingFormData,
  ThreeDRelatedEntity,
  PlantingStatus,
  GrowthStage,
  PLANTING_STATUS_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  PLANTING_HEALTH_OPTIONS,
} from '@/lib/types/threed';

interface ThreeDPlantingsCRUDProps {
  threedId?: number;
  onModuleUpdate?: () => void;
}

// ✅ Helper to get label from value
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

// ✅ Helper to format date for input
const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// ✅ Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'planted': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'growing': return 'bg-green-100 text-green-700 border-green-200';
    case 'harvesting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'harvested': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'failed': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// ✅ Growth stage color mapping
const getGrowthStageColor = (stage: string) => {
  switch (stage) {
    case 'seed': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'seedling': return 'bg-green-100 text-green-700 border-green-200';
    case 'vegetative': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'flowering': return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'fruiting': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'mature': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'dormant': return 'bg-gray-200 text-gray-700 border-gray-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function ThreeDWateringSchedulesCRUD({ threedId, onModuleUpdate }: ThreeDPlantingsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [plantings, setPlantings] = useState<ThreeDPlanting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlanting, setEditingPlanting] = useState<ThreeDPlanting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGrowthStage, setFilterGrowthStage] = useState<string>('all');

  // ✅ State for related entity options
  const [plants, setPlants] = useState<ThreeDRelatedEntity[]>([]);
  const [beds, setBeds] = useState<ThreeDRelatedEntity[]>([]);
  const [models, setModels] = useState<ThreeDRelatedEntity[]>([]);

  // ✅ Form state
  const [formData, setFormData] = useState<ThreeDPlantingFormData>({
    plantId: '',
    bedId: '',
    customModelId: '',
    modelScale: '1.0',
    quantity: '1',
    spacingInches: '',
    positionX: '0',
    positionY: '0',
    positionZ: '0',
    plantedDate: '',
    expectedGerminationDate: '',
    expectedHarvestDate: '',
    actualHarvestDate: '',
    status: PlantingStatus.PLANTED,
    growthStage: GrowthStage.SEED,
    health: 'good',
    notes: '',
    isActive: true,
  });

  // ✅ Track selected entities for display
  const [selectedPlant, setSelectedPlant] = useState<ThreeDRelatedEntity | null>(null);
  const [selectedBed, setSelectedBed] = useState<ThreeDRelatedEntity | null>(null);
  const [selectedModel, setSelectedModel] = useState<ThreeDRelatedEntity | null>(null);

  useEffect(() => {
    fetchPlantings();
    fetchRelatedEntities();
  }, [threedId]);

  const fetchPlantings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterGrowthStage !== 'all') params.append('growthStage', filterGrowthStage);
      if (threedId) params.append('moduleId', String(threedId));

      const response = await fetch(`/api/threed/plantings?${params.toString()}`);
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

  const fetchRelatedEntities = async () => {
    try {
      // ✅ Fetch plants
      const plantsRes = await fetch('/api/threed/plants?isActive=true');
      const plantsData = await plantsRes.json();
      if (plantsData.success) {
        setPlants(plantsData.data.map((p: any) => ({
          id: p.id,
          name: p.commonName || p.name || `Plant #${p.id}`,
          plantId: p.plantId,
          commonName: p.commonName,
        })));
      }

      // ✅ Fetch beds
      const bedsRes = await fetch('/api/threed/beds?isActive=true');
      const bedsData = await bedsRes.json();
      if (bedsData.success) {
        setBeds(bedsData.data.map((b: any) => ({
          id: b.id,
          name: b.name || `Bed #${b.id}`,
          bedId: b.bedId,
          description: b.description,
        })));
      }

      // ✅ Fetch models
      const modelsRes = await fetch('/api/threed/models?isActive=true');
      const modelsData = await modelsRes.json();
      if (modelsData.success) {
        setModels(modelsData.data.map((m: any) => ({
          id: m.id,
          name: m.modelName || `Model #${m.id}`,
          modelType: m.modelType,
        })));
      }
    } catch (error) {
      console.error('Error fetching related entities:', error);
    }
  };

  const filteredPlantings = plantings.filter((planting) =>
    planting.plantingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (planting.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.plantId) {
      showToast('Plant selection is required', 'error');
      return;
    }

    if (!formData.bedId) {
      showToast('Bed selection is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        plantId: parseInt(formData.plantId),
        bedId: parseInt(formData.bedId),
        customModelId: formData.customModelId ? parseInt(formData.customModelId) : null,
        modelScale: formData.modelScale ? parseFloat(formData.modelScale) : 1.0,
        quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        plantedDate: formData.plantedDate || null,
        expectedGerminationDate: formData.expectedGerminationDate || null,
        expectedHarvestDate: formData.expectedHarvestDate || null,
        actualHarvestDate: formData.actualHarvestDate || null,
        status: formData.status,
        growthStage: formData.growthStage,
        health: formData.health || 'good',
        notes: formData.notes || null,
      };

      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

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
    if (!formData.plantId) {
      showToast('Plant selection is required', 'error');
      return;
    }

    if (!formData.bedId) {
      showToast('Bed selection is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        plantId: parseInt(formData.plantId),
        bedId: parseInt(formData.bedId),
        customModelId: formData.customModelId ? parseInt(formData.customModelId) : null,
        modelScale: formData.modelScale ? parseFloat(formData.modelScale) : 1.0,
        quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        plantedDate: formData.plantedDate || null,
        expectedGerminationDate: formData.expectedGerminationDate || null,
        expectedHarvestDate: formData.expectedHarvestDate || null,
        actualHarvestDate: formData.actualHarvestDate || null,
        status: formData.status,
        growthStage: formData.growthStage,
        health: formData.health || 'good',
        notes: formData.notes || null,
      };

      const response = await fetch(`/api/threed/plantings?id=${editingPlanting.id}`, {
        method: 'PUT',
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

  const handleDelete = async (id: number, plantingId: string) => {
    if (!confirm(`Delete planting "${plantingId}"? This action cannot be undone.`)) return;

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
      plantId: '',
      bedId: '',
      customModelId: '',
      modelScale: '1.0',
      quantity: '1',
      spacingInches: '',
      positionX: '0',
      positionY: '0',
      positionZ: '0',
      plantedDate: '',
      expectedGerminationDate: '',
      expectedHarvestDate: '',
      actualHarvestDate: '',
      status: PlantingStatus.PLANTED,
      growthStage: GrowthStage.SEED,
      health: 'good',
      notes: '',
      isActive: true,
    });
    setSelectedPlant(null);
    setSelectedBed(null);
    setSelectedModel(null);
  };

  const openEditDialog = (planting: ThreeDPlanting) => {
    setEditingPlanting(planting);

    // ✅ Find selected entities
    const plant = plants.find(p => p.id === planting.plantId) || null;
    const bed = beds.find(b => b.id === planting.bedId) || null;
    const model = models.find(m => m.id === planting.customModelId) || null;

    setSelectedPlant(plant);
    setSelectedBed(bed);
    setSelectedModel(model);

    setFormData({
      plantId: planting.plantId ? String(planting.plantId) : '',
      bedId: planting.bedId ? String(planting.bedId) : '',
      customModelId: planting.customModelId ? String(planting.customModelId) : '',
      modelScale: planting.modelScale ? String(planting.modelScale) : '1.0',
      quantity: planting.quantity ? String(planting.quantity) : '1',
      spacingInches: planting.spacingInches ? String(planting.spacingInches) : '',
      positionX: planting.positionX ? String(planting.positionX) : '0',
      positionY: planting.positionY ? String(planting.positionY) : '0',
      positionZ: planting.positionZ ? String(planting.positionZ) : '0',
      plantedDate: formatDateForInput(planting.plantedDate),
      expectedGerminationDate: formatDateForInput(planting.expectedGerminationDate),
      expectedHarvestDate: formatDateForInput(planting.expectedHarvestDate),
      actualHarvestDate: formatDateForInput(planting.actualHarvestDate),
      status: planting.status || PlantingStatus.PLANTED,
      growthStage: planting.growthStage || GrowthStage.SEED,
      health: planting.health || 'good',
      notes: planting.notes || '',
      isActive: true,
    });
  };

  const renderActions = (planting: ThreeDPlanting) => (
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
          {planting.quantity && planting.quantity > 0 && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">Quantity: {planting.quantity}</span>
            </DropdownMenuItem>
          )}
          {planting.plantedDate && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">Planted: {new Date(planting.plantedDate).toLocaleDateString()}</span>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Planting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Plant Selection */}
              <div>
                <Label htmlFor="plantId">Plant *</Label>
                <Select
                  value={selectedPlant?.id ? String(selectedPlant.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedPlant(null);
                      setFormData({ ...formData, plantId: '' });
                    } else {
                      const plant = plants.find(p => String(p.id) === value);
                      setSelectedPlant(plant || null);
                      setFormData({ ...formData, plantId: plant ? String(plant.id) : '' });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plant..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={String(plant.id)}>
                        {plant.commonName || plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlant && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedPlant.commonName || selectedPlant.name}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlant(null);
                          setFormData({ ...formData, plantId: '' });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Bed Selection */}
              <div>
                <Label htmlFor="bedId">Bed *</Label>
                <Select
                  value={selectedBed?.id ? String(selectedBed.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedBed(null);
                      setFormData({ ...formData, bedId: '' });
                    } else {
                      const bed = beds.find(b => String(b.id) === value);
                      setSelectedBed(bed || null);
                      setFormData({ ...formData, bedId: bed ? String(bed.id) : '' });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bed..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {beds.map((bed) => (
                      <SelectItem key={bed.id} value={String(bed.id)}>
                        {bed.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBed && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedBed.name}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBed(null);
                          setFormData({ ...formData, bedId: '' });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Model Override */}
              <div>
                <Label htmlFor="customModelId">Custom Model (Optional)</Label>
                <Select
                  value={selectedModel?.id ? String(selectedModel.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedModel(null);
                      setFormData({ ...formData, customModelId: '' });
                    } else {
                      const model = models.find(m => String(m.id) === value);
                      setSelectedModel(model || null);
                      setFormData({ ...formData, customModelId: model ? String(model.id) : '' });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={String(model.id)}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedModel.name}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModel(null);
                          setFormData({ ...formData, customModelId: '' });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Model Scale */}
              <div>
                <Label htmlFor="modelScale">Model Scale</Label>
                <Input
                  id="modelScale"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={formData.modelScale}
                  onChange={(e) => setFormData({ ...formData, modelScale: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Quantity & Spacing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1"
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
                    placeholder="12"
                    value={formData.spacingInches}
                    onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <Label className="text-xs text-muted-foreground">3D Position</Label>
                <div className="grid grid-cols-3 gap-4 mt-1">
                  <div>
                    <Label htmlFor="positionX" className="text-[10px]">X</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionY" className="text-[10px]">Y</Label>
                    <Input
                      id="positionY"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionZ" className="text-[10px]">Z</Label>
                    <Input
                      id="positionZ"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plantedDate">Planted Date</Label>
                  <Input
                    id="plantedDate"
                    type="date"
                    value={formData.plantedDate}
                    onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="expectedGerminationDate">Expected Germination</Label>
                  <Input
                    id="expectedGerminationDate"
                    type="date"
                    value={formData.expectedGerminationDate}
                    onChange={(e) => setFormData({ ...formData, expectedGerminationDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expectedHarvestDate">Expected Harvest</Label>
                  <Input
                    id="expectedHarvestDate"
                    type="date"
                    value={formData.expectedHarvestDate}
                    onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="actualHarvestDate">Actual Harvest</Label>
                  <Input
                    id="actualHarvestDate"
                    type="date"
                    value={formData.actualHarvestDate}
                    onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Status & Growth */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as PlantingStatus })}
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
                  <Label htmlFor="growthStage">Growth Stage</Label>
                  <Select
                    value={formData.growthStage}
                    onValueChange={(value) => setFormData({ ...formData, growthStage: value as GrowthStage })}
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
              </div>

              {/* Health */}
              <div>
                <Label htmlFor="health">Health</Label>
                <Select
                  value={formData.health}
                  onValueChange={(value) => setFormData({ ...formData, health: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select health" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANTING_HEALTH_OPTIONS.map((health) => (
                      <SelectItem key={health.value} value={health.value}>
                        {health.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
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
            placeholder="Search plantings..."
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
        <Select value={filterGrowthStage} onValueChange={setFilterGrowthStage}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Growth Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {GROWTH_STAGE_OPTIONS.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterStatus('all');
            setFilterGrowthStage('all');
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
                <TableHead className="text-xs py-1">Planting ID</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Plant</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Status</TableHead>
                <TableHead className="text-center text-xs py-1">Growth Stage</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlantings.map((planting) => {
                const plant = plants.find(p => p.id === planting.plantId);
                return (
                  <TableRow key={planting.id} className="hover:bg-muted/50">
                    <TableCell className="py-1 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-3.5 h-3.5 text-green-500" />
                        {planting.plantingId}
                        {planting.quantity && planting.quantity > 1 && (
                          <Badge variant="outline" className="text-[10px]">
                            x{planting.quantity}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                      {plant?.commonName || plant?.name || `Plant #${planting.plantId}`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-1 text-sm">
                      <Badge className={`text-[10px] border ${getStatusColor(planting.status)}`}>
                        {planting.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-1">
                      <Badge className={`text-[10px] border ${getGrowthStageColor(planting.growthStage)}`}>
                        {planting.growthStage}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 text-right">{renderActions(planting)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPlanting} onOpenChange={(open) => !open && setEditingPlanting(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Planting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Plant Selection */}
            <div>
              <Label htmlFor="edit-plantId">Plant *</Label>
              <Select
                value={selectedPlant?.id ? String(selectedPlant.id) : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedPlant(null);
                    setFormData({ ...formData, plantId: '' });
                  } else {
                    const plant = plants.find(p => String(p.id) === value);
                    setSelectedPlant(plant || null);
                    setFormData({ ...formData, plantId: plant ? String(plant.id) : '' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plant..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {plants.map((plant) => (
                    <SelectItem key={plant.id} value={String(plant.id)}>
                      {plant.commonName || plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlant && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedPlant.commonName || selectedPlant.name}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlant(null);
                        setFormData({ ...formData, plantId: '' });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Bed Selection */}
            <div>
              <Label htmlFor="edit-bedId">Bed *</Label>
              <Select
                value={selectedBed?.id ? String(selectedBed.id) : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedBed(null);
                    setFormData({ ...formData, bedId: '' });
                  } else {
                    const bed = beds.find(b => String(b.id) === value);
                    setSelectedBed(bed || null);
                    setFormData({ ...formData, bedId: bed ? String(bed.id) : '' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bed..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {beds.map((bed) => (
                    <SelectItem key={bed.id} value={String(bed.id)}>
                      {bed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBed && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedBed.name}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBed(null);
                        setFormData({ ...formData, bedId: '' });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Model Override */}
            <div>
              <Label htmlFor="edit-customModelId">Custom Model (Optional)</Label>
              <Select
                value={selectedModel?.id ? String(selectedModel.id) : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedModel(null);
                    setFormData({ ...formData, customModelId: '' });
                  } else {
                    const model = models.find(m => String(m.id) === value);
                    setSelectedModel(model || null);
                    setFormData({ ...formData, customModelId: model ? String(model.id) : '' });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={String(model.id)}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModel && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedModel.name}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModel(null);
                        setFormData({ ...formData, customModelId: '' });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Model Scale */}
            <div>
              <Label htmlFor="edit-modelScale">Model Scale</Label>
              <Input
                id="edit-modelScale"
                type="number"
                step="0.1"
                value={formData.modelScale}
                onChange={(e) => setFormData({ ...formData, modelScale: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Quantity & Spacing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
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
                  value={formData.spacingInches}
                  onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <Label className="text-xs text-muted-foreground">3D Position</Label>
              <div className="grid grid-cols-3 gap-4 mt-1">
                <div>
                  <Label htmlFor="edit-positionX" className="text-[10px]">X</Label>
                  <Input
                    id="edit-positionX"
                    type="number"
                    step="0.5"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionY" className="text-[10px]">Y</Label>
                  <Input
                    id="edit-positionY"
                    type="number"
                    step="0.5"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionZ" className="text-[10px]">Z</Label>
                  <Input
                    id="edit-positionZ"
                    type="number"
                    step="0.5"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plantedDate">Planted Date</Label>
                <Input
                  id="edit-plantedDate"
                  type="date"
                  value={formData.plantedDate}
                  onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-expectedGerminationDate">Expected Germination</Label>
                <Input
                  id="edit-expectedGerminationDate"
                  type="date"
                  value={formData.expectedGerminationDate}
                  onChange={(e) => setFormData({ ...formData, expectedGerminationDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-expectedHarvestDate">Expected Harvest</Label>
                <Input
                  id="edit-expectedHarvestDate"
                  type="date"
                  value={formData.expectedHarvestDate}
                  onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-actualHarvestDate">Actual Harvest</Label>
                <Input
                  id="edit-actualHarvestDate"
                  type="date"
                  value={formData.actualHarvestDate}
                  onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Status & Growth */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as PlantingStatus })}
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
                <Label htmlFor="edit-growthStage">Growth Stage</Label>
                <Select
                  value={formData.growthStage}
                  onValueChange={(value) => setFormData({ ...formData, growthStage: value as GrowthStage })}
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
            </div>

            {/* Health */}
            <div>
              <Label htmlFor="edit-health">Health</Label>
              <Select
                value={formData.health}
                onValueChange={(value) => setFormData({ ...formData, health: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select health" />
                </SelectTrigger>
                <SelectContent>
                  {PLANTING_HEALTH_OPTIONS.map((health) => (
                    <SelectItem key={health.value} value={health.value}>
                      {health.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
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