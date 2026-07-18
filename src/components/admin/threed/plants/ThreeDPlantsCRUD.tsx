// components/admin/threed/plants/ThreeDPlantsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Leaf,
  MoreHorizontal,
  ExternalLink
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
import { useSession } from 'next-auth/react';

interface Plant {
  id: number;
  userId: string;
  plantId: string;
  commonName: string;
  scientificName: string;
  variety: string;
  family: string;
  type: string;
  status: string;
  modelId: number;
  growthHabit: string;
  daysToMaturity: number;
  daysToGermination: number;
  daysToHarvest: number;
  spacingInches: number;
  rowSpacingInches: number;
  plantingDepthInches: number;
  sunlight: string;
  waterNeeds: string;
  soilType: string;
  soilPH: number;
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
  createdAt: string;
  updatedAt: string;
}

interface ThreeDPlantsCRUDProps {
  onModuleUpdate?: () => void;
}

export function ThreeDPlantsCRUD({ onModuleUpdate }: ThreeDPlantsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const { data: session } = useSession();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [formData, setFormData] = useState({
    plantId: '',
    commonName: '',
    scientificName: '',
    variety: '',
    family: '',
    type: 'Vegetable',
    status: 'active',
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
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchPlants();
    }
  }, [session]);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/plants');
      const data = await response.json();
      if (data.success) {
        setPlants(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch plants', 'error');
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
      showToast('Failed to fetch plants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.commonName) {
      showToast('Common name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ Send all form fields
      const response = await fetch('/api/threed/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantId: formData.plantId || undefined,
          commonName: formData.commonName,
          scientificName: formData.scientificName || undefined,
          variety: formData.variety || undefined,
          family: formData.family || undefined,
          type: formData.type,
          status: formData.status,
          growthHabit: formData.growthHabit || undefined,
          daysToMaturity: formData.daysToMaturity || undefined,
          daysToGermination: formData.daysToGermination || undefined,
          daysToHarvest: formData.daysToHarvest || undefined,
          spacingInches: formData.spacingInches || undefined,
          rowSpacingInches: formData.rowSpacingInches || undefined,
          plantingDepthInches: formData.plantingDepthInches || undefined,
          sunlight: formData.sunlight,
          waterNeeds: formData.waterNeeds,
          soilType: formData.soilType || undefined,
          soilPH: formData.soilPH || undefined,
          hardinessZone: formData.hardinessZone || undefined,
          frostTolerant: formData.frostTolerant,
          perennial: formData.perennial,
          imageUrl: formData.imageUrl || undefined,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          description: formData.description || undefined,
          careInstructions: formData.careInstructions || undefined,
          harvestInstructions: formData.harvestInstructions || undefined,
          companionPlants: formData.companionPlants || undefined,
          avoidPlants: formData.avoidPlants || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Plant created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          plantId: '',
          commonName: '',
          scientificName: '',
          variety: '',
          family: '',
          type: 'Vegetable',
          status: 'active',
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
        });
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
    setIsSubmitting(true);
    try {
      // ✅ Send all form fields for update
      const response = await fetch(`/api/threed/plants?id=${editingPlant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commonName: formData.commonName,
          scientificName: formData.scientificName || undefined,
          variety: formData.variety || undefined,
          family: formData.family || undefined,
          type: formData.type,
          status: formData.status,
          growthHabit: formData.growthHabit || undefined,
          daysToMaturity: formData.daysToMaturity || undefined,
          daysToGermination: formData.daysToGermination || undefined,
          daysToHarvest: formData.daysToHarvest || undefined,
          spacingInches: formData.spacingInches || undefined,
          rowSpacingInches: formData.rowSpacingInches || undefined,
          plantingDepthInches: formData.plantingDepthInches || undefined,
          sunlight: formData.sunlight,
          waterNeeds: formData.waterNeeds,
          soilType: formData.soilType || undefined,
          soilPH: formData.soilPH || undefined,
          hardinessZone: formData.hardinessZone || undefined,
          frostTolerant: formData.frostTolerant,
          perennial: formData.perennial,
          imageUrl: formData.imageUrl || undefined,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          description: formData.description || undefined,
          careInstructions: formData.careInstructions || undefined,
          harvestInstructions: formData.harvestInstructions || undefined,
          companionPlants: formData.companionPlants || undefined,
          avoidPlants: formData.avoidPlants || undefined,
        }),
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
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      status: plant.status || 'active',
      growthHabit: plant.growthHabit || '',
      daysToMaturity: plant.daysToMaturity?.toString() || '',
      daysToGermination: plant.daysToGermination?.toString() || '',
      daysToHarvest: plant.daysToHarvest?.toString() || '',
      spacingInches: plant.spacingInches?.toString() || '',
      rowSpacingInches: plant.rowSpacingInches?.toString() || '',
      plantingDepthInches: plant.plantingDepthInches?.toString() || '',
      sunlight: plant.sunlight || 'Full Sun',
      waterNeeds: plant.waterNeeds || 'Medium',
      soilType: plant.soilType || '',
      soilPH: plant.soilPH?.toString() || '',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Leaf className="w-5 h-5 text-green-500" />
          <h3 className="text-sm font-semibold">Plants</h3>
          <Badge variant="secondary" className="ml-2">
            {plants.length} {plants.length === 1 ? 'plant' : 'plants'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Plant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Plant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plantId">Plant ID (optional)</Label>
                  <Input
                    id="plantId"
                    placeholder="Auto-generated if empty"
                    value={formData.plantId}
                    onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                    disabled={isSubmitting}
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
                  />
                </div>
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
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vegetable">Vegetable</SelectItem>
                      <SelectItem value="Fruit">Fruit</SelectItem>
                      <SelectItem value="Herb">Herb</SelectItem>
                      <SelectItem value="Flower">Flower</SelectItem>
                      <SelectItem value="Tree">Tree</SelectItem>
                      <SelectItem value="Shrub">Shrub</SelectItem>
                      <SelectItem value="CoverCrop">Cover Crop</SelectItem>
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
                    placeholder="e.g., 70"
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
                    placeholder="e.g., 7"
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
                    placeholder="e.g., 90"
                    value={formData.daysToHarvest}
                    onChange={(e) => setFormData({ ...formData, daysToHarvest: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Spacing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="spacingInches">Spacing (inches)</Label>
                  <Input
                    id="spacingInches"
                    type="number"
                    step="0.5"
                    placeholder="e.g., 24"
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
                    step="0.5"
                    placeholder="e.g., 36"
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
                    placeholder="e.g., 1.5"
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
                    onValueChange={(value) => setFormData({ ...formData, sunlight: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sunlight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Sun">Full Sun</SelectItem>
                      <SelectItem value="Partial Sun">Partial Sun</SelectItem>
                      <SelectItem value="Partial Shade">Partial Shade</SelectItem>
                      <SelectItem value="Full Shade">Full Shade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="waterNeeds">Water Needs</Label>
                  <Select
                    value={formData.waterNeeds}
                    onValueChange={(value) => setFormData({ ...formData, waterNeeds: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select water needs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Input
                    id="soilType"
                    placeholder="e.g., Loamy, Sandy"
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
                    placeholder="e.g., 6.5"
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
                    placeholder="e.g., 9a-11b"
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

              {/* Media & Descriptions */}
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Plant description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="careInstructions">Care Instructions</Label>
                  <Textarea
                    id="careInstructions"
                    placeholder="How to care for this plant..."
                    value={formData.careInstructions}
                    onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="harvestInstructions">Harvest Instructions</Label>
                  <Textarea
                    id="harvestInstructions"
                    placeholder="When and how to harvest..."
                    value={formData.harvestInstructions}
                    onChange={(e) => setFormData({ ...formData, harvestInstructions: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
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
                    placeholder="e.g., Corn, Potatoes"
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

      {/* Plants Table */}
      {plants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Leaf className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No plants yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first plant
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Common Name</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Scientific Name</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plants.map((plant) => (
              <TableRow key={plant.id}>
                <TableCell className="font-medium">
                  {plant.commonName}
                  {plant.variety && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({plant.variety})
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {plant.type}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {plant.scientificName || '—'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {plant.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm">
                      {plant.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(plant)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {plant.imageUrl && (
                          <DropdownMenuItem onClick={() => window.open(plant.imageUrl, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Image
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPlant} onOpenChange={(open) => !open && setEditingPlant(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Same fields as create dialog, but pre-filled */}
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vegetable">Vegetable</SelectItem>
                    <SelectItem value="Fruit">Fruit</SelectItem>
                    <SelectItem value="Herb">Herb</SelectItem>
                    <SelectItem value="Flower">Flower</SelectItem>
                    <SelectItem value="Tree">Tree</SelectItem>
                    <SelectItem value="Shrub">Shrub</SelectItem>
                    <SelectItem value="CoverCrop">Cover Crop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Growth Parameters */}
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

            {/* Spacing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-spacingInches">Spacing (inches)</Label>
                <Input
                  id="edit-spacingInches"
                  type="number"
                  step="0.5"
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
                  step="0.5"
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

            {/* Environmental */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-sunlight">Sunlight</Label>
                <Select
                  value={formData.sunlight}
                  onValueChange={(value) => setFormData({ ...formData, sunlight: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sunlight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Sun">Full Sun</SelectItem>
                    <SelectItem value="Partial Sun">Partial Sun</SelectItem>
                    <SelectItem value="Partial Shade">Partial Shade</SelectItem>
                    <SelectItem value="Full Shade">Full Shade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-waterNeeds">Water Needs</Label>
                <Select
                  value={formData.waterNeeds}
                  onValueChange={(value) => setFormData({ ...formData, waterNeeds: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select water needs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
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

            {/* Media */}
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="edit-careInstructions">Care Instructions</Label>
                <Textarea
                  id="edit-careInstructions"
                  value={formData.careInstructions}
                  onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-harvestInstructions">Harvest Instructions</Label>
                <Textarea
                  id="edit-harvestInstructions"
                  value={formData.harvestInstructions}
                  onChange={(e) => setFormData({ ...formData, harvestInstructions: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Companion Planting */}
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