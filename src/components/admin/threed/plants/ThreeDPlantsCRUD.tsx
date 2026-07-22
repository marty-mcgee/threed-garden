// components/admin/threed/plants/ThreeDPlantsCRUD.tsx - Consistent UI

'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Sprout,
  MoreHorizontal
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

interface Plant {
  id: number;
  commonName: string;
  scientificName: string | null;
  variety: string | null;
  growthStage: string;
  plantType: string;
  status: string;
  description: string | null;
  waterNeeds: string;
  sunlightNeeds: string;
  isEdible: boolean;
  isPerennial: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ThreeDPlantsCRUDProps {
  onModuleUpdate?: () => void;
}

export function ThreeDPlantsCRUD({ onModuleUpdate }: ThreeDPlantsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [formData, setFormData] = useState({
    commonName: '',
    scientificName: '',
    variety: '',
    growthStage: 'seedling',
    plantType: 'vegetable',
    status: 'active',
    description: '',
    waterNeeds: 'moderate',
    sunlightNeeds: 'full_sun',
    isEdible: true,
    isPerennial: false,
  });

  useEffect(() => {
    fetchPlants();
  }, []);

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
      showToast('Plant name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/threed/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commonName: formData.commonName,
          scientificName: formData.scientificName || null,
          variety: formData.variety || null,
          growthStage: formData.growthStage,
          plantType: formData.plantType,
          status: formData.status,
          description: formData.description || null,
          waterNeeds: formData.waterNeeds,
          sunlightNeeds: formData.sunlightNeeds,
          isEdible: formData.isEdible,
          isPerennial: formData.isPerennial,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Plant created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          commonName: '',
          scientificName: '',
          variety: '',
          growthStage: 'seedling',
          plantType: 'vegetable',
          status: 'active',
          description: '',
          waterNeeds: 'moderate',
          sunlightNeeds: 'full_sun',
          isEdible: true,
          isPerennial: false,
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
      const response = await fetch(`/api/threed/plants?id=${editingPlant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commonName: formData.commonName,
          scientificName: formData.scientificName || null,
          variety: formData.variety || null,
          growthStage: formData.growthStage,
          plantType: formData.plantType,
          status: formData.status,
          description: formData.description || null,
          waterNeeds: formData.waterNeeds,
          sunlightNeeds: formData.sunlightNeeds,
          isEdible: formData.isEdible,
          isPerennial: formData.isPerennial,
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

  const handleDelete = async (id: number, commonName: string) => {
    if (!confirm(`Delete "${commonName}"? This action cannot be undone.`)) return;

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

  const renderActions = (plant: Plant) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewPlantDetails(plant)}
      >
        <Sprout className="w-4 h-4" />
      </Button>
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

  const viewPlantDetails = (plant: Plant) => {
    showToast(
      `${plant.commonName} - ${plant.scientificName || 'No scientific name'}`,
      'info'
    );
  };

  const openEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      commonName: plant.commonName,
      scientificName: plant.scientificName || '',
      variety: plant.variety || '',
      growthStage: plant.growthStage || 'seedling',
      plantType: plant.plantType || 'vegetable',
      status: plant.status || 'active',
      description: plant.description || '',
      waterNeeds: plant.waterNeeds || 'moderate',
      sunlightNeeds: plant.sunlightNeeds || 'full_sun',
      isEdible: plant.isEdible || false,
      isPerennial: plant.isPerennial || false,
    });
  };

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">Plants</span>
          <Badge variant="secondary" className="text-xs">
            {plants.length}
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
              <div>
                <Label htmlFor="commonName">Plant Name *</Label>
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
                <Label htmlFor="growthStage">Growth Stage</Label>
                <Select
                  value={formData.growthStage}
                  onValueChange={(value) => setFormData({ ...formData, growthStage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select growth stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="seedling">Seedling</SelectItem>
                    <SelectItem value="vegetative">Vegetative</SelectItem>
                    <SelectItem value="flowering">Flowering</SelectItem>
                    <SelectItem value="fruiting">Fruiting</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="dormant">Dormant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plantType">Plant Type</Label>
                <Select
                  value={formData.plantType}
                  onValueChange={(value) => setFormData({ ...formData, plantType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plant type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetable">Vegetable</SelectItem>
                    <SelectItem value="fruit">Fruit</SelectItem>
                    <SelectItem value="herb">Herb</SelectItem>
                    <SelectItem value="flower">Flower</SelectItem>
                    <SelectItem value="tree">Tree</SelectItem>
                    <SelectItem value="shrub">Shrub</SelectItem>
                    <SelectItem value="succulent">Succulent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="dormant">Dormant</SelectItem>
                    <SelectItem value="dead">Dead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waterNeeds">Water Needs</Label>
                  <Select
                    value={formData.waterNeeds}
                    onValueChange={(value) => setFormData({ ...formData, waterNeeds: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sunlightNeeds">Sunlight Needs</Label>
                  <Select
                    value={formData.sunlightNeeds}
                    onValueChange={(value) => setFormData({ ...formData, sunlightNeeds: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_sun">Full Sun</SelectItem>
                      <SelectItem value="partial_shade">Partial Shade</SelectItem>
                      <SelectItem value="full_shade">Full Shade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isEdible"
                    checked={formData.isEdible}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEdible: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isEdible">Edible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPerennial"
                    checked={formData.isPerennial}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPerennial: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isPerennial">Perennial</Label>
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

      {plants.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Sprout className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No plants yet</p>
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
                <TableHead className="hidden sm:table-cell text-xs py-1">Scientific Name</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Growth Stage</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.map((plant) => (
                <TableRow key={plant.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    {plant.commonName}
                    {plant.isEdible && (
                      <Badge variant="outline" className="ml-2 text-[10px]">Edible</Badge>
                    )}
                    {plant.isPerennial && (
                      <Badge variant="outline" className="ml-1 text-[10px]">Perennial</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground italic">
                    {plant.scientificName || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {plant.growthStage || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      {plant.status === 'active' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs capitalize">
                        {plant.status || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-right">
                    {renderActions(plant)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editingPlant} onOpenChange={(open) => !open && setEditingPlant(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-commonName">Plant Name *</Label>
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
              <Label htmlFor="edit-growthStage">Growth Stage</Label>
              <Select
                value={formData.growthStage}
                onValueChange={(value) => setFormData({ ...formData, growthStage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select growth stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="seedling">Seedling</SelectItem>
                  <SelectItem value="vegetative">Vegetative</SelectItem>
                  <SelectItem value="flowering">Flowering</SelectItem>
                  <SelectItem value="fruiting">Fruiting</SelectItem>
                  <SelectItem value="harvesting">Harvesting</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="dead">Dead</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-waterNeeds">Water Needs</Label>
                <Select
                  value={formData.waterNeeds}
                  onValueChange={(value) => setFormData({ ...formData, waterNeeds: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-sunlightNeeds">Sunlight Needs</Label>
                <Select
                  value={formData.sunlightNeeds}
                  onValueChange={(value) => setFormData({ ...formData, sunlightNeeds: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_sun">Full Sun</SelectItem>
                    <SelectItem value="partial_shade">Partial Shade</SelectItem>
                    <SelectItem value="full_shade">Full Shade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isEdible"
                  checked={formData.isEdible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEdible: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isEdible">Edible</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isPerennial"
                  checked={formData.isPerennial}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPerennial: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isPerennial">Perennial</Label>
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