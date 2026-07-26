// components/admin/threed/plants/ThreeDPlantsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Leaf,
  MoreHorizontal,
  ExternalLink,
  Search,
  Filter,
  Image as ImageIcon,
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
  ThreeDPlant,
  ThreeDPlantFormData,
  PlantType,
  PlantStatus,
  SunlightRequirement,
  WaterNeeds,
  GrowthHabit,
  PLANT_TYPE_OPTIONS,
  PLANT_STATUS_OPTIONS,
  SUNLIGHT_OPTIONS,
  WATER_NEEDS_OPTIONS,
  GROWTH_HABIT_OPTIONS,
} from '@/lib/types/threed';

interface ThreeDPlantsCRUDProps {
  threedId?: number;
  onModuleUpdate?: () => void;
}

export function ThreeDPlantsCRUD({ threedId, onModuleUpdate }: ThreeDPlantsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [plants, setPlants] = useState<ThreeDPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<ThreeDPlant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // ✅ Form state using imported type
  const [formData, setFormData] = useState<ThreeDPlantFormData>({
    commonName: '',
    scientificName: '',
    variety: '',
    family: '',
    type: PlantType.VEGETABLE,
    status: PlantStatus.ACTIVE,
    growthHabit: '',
    daysToMaturity: '',
    daysToGermination: '',
    daysToHarvest: '',
    spacingInches: '',
    rowSpacingInches: '',
    plantingDepthInches: '',
    sunlight: SunlightRequirement.FULL_SUN,
    waterNeeds: WaterNeeds.MEDIUM,
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
  });

  useEffect(() => {
    fetchPlants();
  }, [threedId]);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/threed/plants?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPlants(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch plants', 'error');
        setPlants([]);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
      showToast('Failed to fetch plants', 'error');
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter plants client-side for search
  const filteredPlants = plants.filter((plant) =>
    plant.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plant.scientificName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.commonName) {
      showToast('Common name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        commonName: formData.commonName,
        scientificName: formData.scientificName || null,
        variety: formData.variety || null,
        family: formData.family || null,
        type: formData.type,
        status: formData.status,
        growthHabit: formData.growthHabit || null,
        daysToMaturity: formData.daysToMaturity ? parseInt(formData.daysToMaturity) : null,
        daysToGermination: formData.daysToGermination ? parseInt(formData.daysToGermination) : null,
        daysToHarvest: formData.daysToHarvest ? parseInt(formData.daysToHarvest) : null,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        rowSpacingInches: formData.rowSpacingInches ? parseInt(formData.rowSpacingInches) : null,
        plantingDepthInches: formData.plantingDepthInches ? parseFloat(formData.plantingDepthInches) : null,
        sunlight: formData.sunlight,
        waterNeeds: formData.waterNeeds,
        soilType: formData.soilType || null,
        soilPH: formData.soilPH ? parseFloat(formData.soilPH) : null,
        hardinessZone: formData.hardinessZone || null,
        frostTolerant: formData.frostTolerant,
        perennial: formData.perennial,
        imageUrl: formData.imageUrl || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        description: formData.description || null,
        careInstructions: formData.careInstructions || null,
        harvestInstructions: formData.harvestInstructions || null,
        companionPlants: formData.companionPlants || null,
        avoidPlants: formData.avoidPlants || null,
        source: 'manual',
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
    if (!formData.commonName) {
      showToast('Common name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        commonName: formData.commonName,
        scientificName: formData.scientificName || null,
        variety: formData.variety || null,
        family: formData.family || null,
        type: formData.type,
        status: formData.status,
        growthHabit: formData.growthHabit || null,
        daysToMaturity: formData.daysToMaturity ? parseInt(formData.daysToMaturity) : null,
        daysToGermination: formData.daysToGermination ? parseInt(formData.daysToGermination) : null,
        daysToHarvest: formData.daysToHarvest ? parseInt(formData.daysToHarvest) : null,
        spacingInches: formData.spacingInches ? parseInt(formData.spacingInches) : null,
        rowSpacingInches: formData.rowSpacingInches ? parseInt(formData.rowSpacingInches) : null,
        plantingDepthInches: formData.plantingDepthInches ? parseFloat(formData.plantingDepthInches) : null,
        sunlight: formData.sunlight,
        waterNeeds: formData.waterNeeds,
        soilType: formData.soilType || null,
        soilPH: formData.soilPH ? parseFloat(formData.soilPH) : null,
        hardinessZone: formData.hardinessZone || null,
        frostTolerant: formData.frostTolerant,
        perennial: formData.perennial,
        imageUrl: formData.imageUrl || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        description: formData.description || null,
        careInstructions: formData.careInstructions || null,
        harvestInstructions: formData.harvestInstructions || null,
        companionPlants: formData.companionPlants || null,
        avoidPlants: formData.avoidPlants || null,
      };

      const response = await fetch(`/api/threed/plants?id=${editingPlant.id}`, {
        method: 'PUT',
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

  const handleDelete = async (id: number, commonName: string) => {
    if (!confirm(`Delete plant "${commonName}"? This action cannot be undone.`)) return;

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
    }
  };

  const resetForm = () => {
    setFormData({
      commonName: '',
      scientificName: '',
      variety: '',
      family: '',
      type: PlantType.VEGETABLE,
      status: PlantStatus.ACTIVE,
      growthHabit: '',
      daysToMaturity: '',
      daysToGermination: '',
      daysToHarvest: '',
      spacingInches: '',
      rowSpacingInches: '',
      plantingDepthInches: '',
      sunlight: SunlightRequirement.FULL_SUN,
      waterNeeds: WaterNeeds.MEDIUM,
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
    });
  };

  const openEditDialog = (plant: ThreeDPlant) => {
    setEditingPlant(plant);
    setFormData({
      commonName: plant.commonName,
      scientificName: plant.scientificName || '',
      variety: plant.variety || '',
      family: plant.family || '',
      type: plant.type as PlantType,
      status: plant.status as PlantStatus,
      growthHabit: plant.growthHabit || '',
      daysToMaturity: plant.daysToMaturity ? String(plant.daysToMaturity) : '',
      daysToGermination: plant.daysToGermination ? String(plant.daysToGermination) : '',
      daysToHarvest: plant.daysToHarvest ? String(plant.daysToHarvest) : '',
      spacingInches: plant.spacingInches ? String(plant.spacingInches) : '',
      rowSpacingInches: plant.rowSpacingInches ? String(plant.rowSpacingInches) : '',
      plantingDepthInches: plant.plantingDepthInches ? String(plant.plantingDepthInches) : '',
      sunlight: (plant.sunlight as SunlightRequirement) || SunlightRequirement.FULL_SUN,
      waterNeeds: (plant.waterNeeds as WaterNeeds) || WaterNeeds.MEDIUM,
      soilType: plant.soilType || '',
      soilPH: plant.soilPH ? String(plant.soilPH) : '',
      hardinessZone: plant.hardinessZone || '',
      frostTolerant: plant.frostTolerant || false,
      perennial: plant.perennial || false,
      imageUrl: plant.imageUrl || '',
      thumbnailUrl: plant.thumbnailUrl || '',
      description: plant.description || '',
      careInstructions: plant.careInstructions || '',
      harvestInstructions: plant.harvestInstructions || '',
      companionPlants: plant.companionPlants || '',
      avoidPlants: plant.avoidPlants || '',
    });
  };

  const getTypeLabel = (type: string) => {
    const option = PLANT_TYPE_OPTIONS.find((t) => t.value === type);
    return option ? option.label : type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'archived':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderActions = (plant: ThreeDPlant) => (
    <div className="flex items-center justify-end gap-1">
      {plant.imageUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(plant.imageUrl || '', '_blank')}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(plant)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {plant.plantId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">ID: {plant.plantId}</span>
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
          <Leaf className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">Plants</span>
          <Badge variant="secondary" className="text-xs">
            {filteredPlants.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
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
                <Label htmlFor="commonName">Common Name *</Label>
                <Input
                  id="commonName"
                  placeholder="e.g., Tomato"
                  value={formData.commonName}
                  onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Plant Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as PlantType })}
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
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as PlantStatus })}
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
              </div>

              {/* Growth Parameters */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="daysToMaturity">Days to Maturity</Label>
                  <Input
                    id="daysToMaturity"
                    type="number"
                    placeholder="90"
                    value={formData.daysToMaturity}
                    onChange={(e) => setFormData({ ...formData, daysToMaturity: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="daysToGermination">Days to Germination</Label>
                  <Input
                    id="daysToGermination"
                    type="number"
                    placeholder="7"
                    value={formData.daysToGermination}
                    onChange={(e) => setFormData({ ...formData, daysToGermination: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="daysToHarvest">Days to Harvest</Label>
                  <Input
                    id="daysToHarvest"
                    type="number"
                    placeholder="75"
                    value={formData.daysToHarvest}
                    onChange={(e) => setFormData({ ...formData, daysToHarvest: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="growthHabit">Growth Habit</Label>
                <Select
                  value={formData.growthHabit}
                  onValueChange={(value) => setFormData({ ...formData, growthHabit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select growth habit" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROWTH_HABIT_OPTIONS.map((habit) => (
                      <SelectItem key={habit.value} value={habit.value}>
                        {habit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Spacing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="spacingInches">Spacing (inches)</Label>
                  <Input
                    id="spacingInches"
                    type="number"
                    placeholder="24"
                    value={formData.spacingInches}
                    onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="rowSpacingInches">Row Spacing (inches)</Label>
                  <Input
                    id="rowSpacingInches"
                    type="number"
                    placeholder="36"
                    value={formData.rowSpacingInches}
                    onChange={(e) => setFormData({ ...formData, rowSpacingInches: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="plantingDepthInches">Planting Depth (inches)</Label>
                  <Input
                    id="plantingDepthInches"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={formData.plantingDepthInches}
                    onChange={(e) => setFormData({ ...formData, plantingDepthInches: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Environmental Needs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sunlight">Sunlight</Label>
                  <Select
                    value={formData.sunlight}
                    onValueChange={(value) => setFormData({ ...formData, sunlight: value as SunlightRequirement })}
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
                  <Label htmlFor="waterNeeds">Water Needs</Label>
                  <Select
                    value={formData.waterNeeds}
                    onValueChange={(value) => setFormData({ ...formData, waterNeeds: value as WaterNeeds })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Input
                    id="soilType"
                    placeholder="e.g., Loamy"
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="soilPH">Soil pH</Label>
                  <Input
                    id="soilPH"
                    type="number"
                    step="0.1"
                    placeholder="6.5"
                    value={formData.soilPH}
                    onChange={(e) => setFormData({ ...formData, soilPH: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hardinessZone">Hardiness Zone</Label>
                  <Input
                    id="hardinessZone"
                    placeholder="e.g., 5-9"
                    value={formData.hardinessZone}
                    onChange={(e) => setFormData({ ...formData, hardinessZone: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="frostTolerant"
                      checked={formData.frostTolerant}
                      onCheckedChange={(checked) => setFormData({ ...formData, frostTolerant: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="frostTolerant">Frost Tolerant</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="perennial"
                      checked={formData.perennial}
                      onCheckedChange={(checked) => setFormData({ ...formData, perennial: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="perennial">Perennial</Label>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/plant.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  placeholder="https://example.com/plant-thumb.jpg"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Descriptions */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Plant description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="careInstructions">Care Instructions</Label>
                <Textarea
                  id="careInstructions"
                  placeholder="Care instructions..."
                  value={formData.careInstructions}
                  onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="harvestInstructions">Harvest Instructions</Label>
                <Textarea
                  id="harvestInstructions"
                  placeholder="Harvest instructions..."
                  value={formData.harvestInstructions}
                  onChange={(e) => setFormData({ ...formData, harvestInstructions: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Companion Planting */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companionPlants">Companion Plants</Label>
                  <Input
                    id="companionPlants"
                    placeholder="e.g., Basil, Marigold"
                    value={formData.companionPlants}
                    onChange={(e) => setFormData({ ...formData, companionPlants: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="avoidPlants">Avoid Plants</Label>
                  <Input
                    id="avoidPlants"
                    placeholder="e.g., Potatoes, Peppers"
                    value={formData.avoidPlants}
                    onChange={(e) => setFormData({ ...formData, avoidPlants: e.target.value })}
                    disabled={isSubmitting}
                  />
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
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search plants..."
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
            {PLANT_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PLANT_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
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
            setFilterType('all');
            fetchPlants();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Plants Table */}
      {filteredPlants.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Leaf className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No plants found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first plant
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Scientific Name</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlants.map((plant) => (
                <TableRow key={plant.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {plant.thumbnailUrl ? (
                        <img
                          src={plant.thumbnailUrl}
                          alt={plant.commonName}
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : (
                        <Leaf className="w-4 h-4 text-green-500" />
                      )}
                      {plant.commonName}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {getTypeLabel(plant.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {plant.scientificName || '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getStatusColor(plant.status)}`}>
                      {plant.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(plant)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPlant} onOpenChange={(open) => !open && setEditingPlant(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-commonName">Common Name *</Label>
              <Input
                id="edit-commonName"
                value={formData.commonName}
                onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-scientificName">Scientific Name</Label>
              <Input
                id="edit-scientificName"
                value={formData.scientificName}
                onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-variety">Variety</Label>
                <Input
                  id="edit-variety"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-family">Family</Label>
                <Input
                  id="edit-family"
                  value={formData.family}
                  onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Plant Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as PlantType })}
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
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as PlantStatus })}
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-daysToMaturity">Days to Maturity</Label>
                <Input
                  id="edit-daysToMaturity"
                  type="number"
                  value={formData.daysToMaturity}
                  onChange={(e) => setFormData({ ...formData, daysToMaturity: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-daysToGermination">Days to Germination</Label>
                <Input
                  id="edit-daysToGermination"
                  type="number"
                  value={formData.daysToGermination}
                  onChange={(e) => setFormData({ ...formData, daysToGermination: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-daysToHarvest">Days to Harvest</Label>
                <Input
                  id="edit-daysToHarvest"
                  type="number"
                  value={formData.daysToHarvest}
                  onChange={(e) => setFormData({ ...formData, daysToHarvest: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-growthHabit">Growth Habit</Label>
              <Select
                value={formData.growthHabit}
                onValueChange={(value) => setFormData({ ...formData, growthHabit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select growth habit" />
                </SelectTrigger>
                <SelectContent>
                  {GROWTH_HABIT_OPTIONS.map((habit) => (
                    <SelectItem key={habit.value} value={habit.value}>
                      {habit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <Label htmlFor="edit-rowSpacingInches">Row Spacing (inches)</Label>
                <Input
                  id="edit-rowSpacingInches"
                  type="number"
                  value={formData.rowSpacingInches}
                  onChange={(e) => setFormData({ ...formData, rowSpacingInches: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-plantingDepthInches">Planting Depth (inches)</Label>
                <Input
                  id="edit-plantingDepthInches"
                  type="number"
                  step="0.1"
                  value={formData.plantingDepthInches}
                  onChange={(e) => setFormData({ ...formData, plantingDepthInches: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-sunlight">Sunlight</Label>
                <Select
                  value={formData.sunlight}
                  onValueChange={(value) => setFormData({ ...formData, sunlight: value as SunlightRequirement })}
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
                <Label htmlFor="edit-waterNeeds">Water Needs</Label>
                <Select
                  value={formData.waterNeeds}
                  onValueChange={(value) => setFormData({ ...formData, waterNeeds: value as WaterNeeds })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-soilType">Soil Type</Label>
                <Input
                  id="edit-soilType"
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-soilPH">Soil pH</Label>
                <Input
                  id="edit-soilPH"
                  type="number"
                  step="0.1"
                  value={formData.soilPH}
                  onChange={(e) => setFormData({ ...formData, soilPH: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-hardinessZone">Hardiness Zone</Label>
                <Input
                  id="edit-hardinessZone"
                  value={formData.hardinessZone}
                  onChange={(e) => setFormData({ ...formData, hardinessZone: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-frostTolerant"
                    checked={formData.frostTolerant}
                    onCheckedChange={(checked) => setFormData({ ...formData, frostTolerant: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-frostTolerant">Frost Tolerant</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-perennial"
                    checked={formData.perennial}
                    onCheckedChange={(checked) => setFormData({ ...formData, perennial: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-perennial">Perennial</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="edit-thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-careInstructions">Care Instructions</Label>
              <Textarea
                id="edit-careInstructions"
                value={formData.careInstructions}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-harvestInstructions">Harvest Instructions</Label>
              <Textarea
                id="edit-harvestInstructions"
                value={formData.harvestInstructions}
                onChange={(e) => setFormData({ ...formData, harvestInstructions: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-companionPlants">Companion Plants</Label>
                <Input
                  id="edit-companionPlants"
                  value={formData.companionPlants}
                  onChange={(e) => setFormData({ ...formData, companionPlants: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-avoidPlants">Avoid Plants</Label>
                <Input
                  id="edit-avoidPlants"
                  value={formData.avoidPlants}
                  onChange={(e) => setFormData({ ...formData, avoidPlants: e.target.value })}
                  disabled={isSubmitting}
                />
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