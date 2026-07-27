// components/admin/threed/harvests/ThreeDHarvestsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Apple,
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
import { useToast } from '@/components/ui/toast';

// ✅ Import types from lib
import {
  ThreeDHarvest,
  ThreeDHarvestFormData,
  ThreeDRelatedEntity,
  HarvestUnit,
  HARVEST_UNIT_OPTIONS,
} from '@/lib/types/threed';

interface ThreeDHarvestsCRUDProps {
  threedId?: number;
  onModuleUpdate?: () => void;
}

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

export function ThreeDHarvestsCRUD({ threedId, onModuleUpdate }: ThreeDHarvestsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [harvests, setHarvests] = useState<ThreeDHarvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<ThreeDHarvest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // ✅ State for related entity options
  const [plants, setPlants] = useState<ThreeDRelatedEntity[]>([]);
  const [plantings, setPlantings] = useState<ThreeDRelatedEntity[]>([]);

  // ✅ Form state
  const [formData, setFormData] = useState<ThreeDHarvestFormData>({
    plantingId: '',
    plantId: '',
    quantity: '',
    unit: HarvestUnit.LBS,
    weightLbs: '',
    harvestDate: '',
    notes: '',
    imageUrl: '',
    isActive: true,
  });

  // ✅ Track selected entities for display
  const [selectedPlant, setSelectedPlant] = useState<ThreeDRelatedEntity | null>(null);
  const [selectedPlanting, setSelectedPlanting] = useState<ThreeDRelatedEntity | null>(null);

  useEffect(() => {
    fetchHarvests();
    fetchRelatedEntities();
  }, [threedId]);

  const fetchHarvests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUnit !== 'all') params.append('unit', filterUnit);
      if (threedId) params.append('moduleId', String(threedId));

      const response = await fetch(`/api/threed/harvests?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setHarvests(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch harvests', 'error');
        setHarvests([]);
      }
    } catch (error) {
      console.error('Error fetching harvests:', error);
      showToast('Failed to fetch harvests', 'error');
      setHarvests([]);
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

      // ✅ Fetch plantings
      const plantingsRes = await fetch('/api/threed/plantings?isActive=true');
      const plantingsData = await plantingsRes.json();
      if (plantingsData.success) {
        setPlantings(plantingsData.data.map((p: any) => ({
          id: p.id,
          name: p.plantingId || `Planting #${p.id}`,
        })));
      }
    } catch (error) {
      console.error('Error fetching related entities:', error);
    }
  };

  const filteredHarvests = harvests.filter((harvest) =>
    harvest.harvestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (harvest.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.plantId && !formData.plantingId) {
      showToast('Plant or Planting selection is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        plantingId: formData.plantingId ? parseInt(formData.plantingId) : null,
        plantId: formData.plantId ? parseInt(formData.plantId) : null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit: formData.unit || 'lbs',
        weightLbs: formData.weightLbs ? parseFloat(formData.weightLbs) : null,
        harvestDate: formData.harvestDate || null,
        notes: formData.notes || null,
        imageUrl: formData.imageUrl || null,
      };

      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

      const response = await fetch('/api/threed/harvests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Harvest created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchHarvests();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create harvest', 'error');
      }
    } catch (error) {
      console.error('Error creating harvest:', error);
      showToast('Failed to create harvest', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingHarvest) return;
    if (!formData.plantId && !formData.plantingId) {
      showToast('Plant or Planting selection is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        plantingId: formData.plantingId ? parseInt(formData.plantingId) : null,
        plantId: formData.plantId ? parseInt(formData.plantId) : null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit: formData.unit || 'lbs',
        weightLbs: formData.weightLbs ? parseFloat(formData.weightLbs) : null,
        harvestDate: formData.harvestDate || null,
        notes: formData.notes || null,
        imageUrl: formData.imageUrl || null,
      };

      const response = await fetch(`/api/threed/harvests?id=${editingHarvest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Harvest updated successfully', 'success');
        setEditingHarvest(null);
        await fetchHarvests();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update harvest', 'error');
      }
    } catch (error) {
      console.error('Error updating harvest:', error);
      showToast('Failed to update harvest', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, harvestId: string) => {
    if (!confirm(`Delete harvest "${harvestId}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/harvests?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Harvest deleted successfully', 'success');
        await fetchHarvests();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete harvest', 'error');
      }
    } catch (error) {
      console.error('Error deleting harvest:', error);
      showToast('Failed to delete harvest', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      plantingId: '',
      plantId: '',
      quantity: '',
      unit: HarvestUnit.LBS,
      weightLbs: '',
      harvestDate: '',
      notes: '',
      imageUrl: '',
      isActive: true,
    });
    setSelectedPlant(null);
    setSelectedPlanting(null);
  };

  const openEditDialog = (harvest: ThreeDHarvest) => {
    setEditingHarvest(harvest);

    // ✅ Find selected entities
    const plant = plants.find(p => p.id === harvest.plantId) || null;
    const planting = plantings.find(p => p.id === harvest.plantingId) || null;

    setSelectedPlant(plant);
    setSelectedPlanting(planting);

    setFormData({
      plantingId: harvest.plantingId ? String(harvest.plantingId) : '',
      plantId: harvest.plantId ? String(harvest.plantId) : '',
      quantity: harvest.quantity ? String(harvest.quantity) : '',
      unit: harvest.unit || HarvestUnit.LBS,
      weightLbs: harvest.weightLbs ? String(harvest.weightLbs) : '',
      harvestDate: formatDateForInput(harvest.harvestDate),
      notes: harvest.notes || '',
      imageUrl: harvest.imageUrl || '',
      isActive: true,
    });
  };

  const renderActions = (harvest: ThreeDHarvest) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(harvest)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {harvest.quantity && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Quantity: {harvest.quantity} {harvest.unit}
              </span>
            </DropdownMenuItem>
          )}
          {harvest.weightLbs && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">Weight: {harvest.weightLbs} lbs</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(harvest.id, harvest.harvestId)}
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
          <Apple className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">Harvests</span>
          <Badge variant="secondary" className="text-xs">
            {filteredHarvests.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Harvest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Harvest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Plant Selection */}
              <div>
                <Label htmlFor="plantId">Plant (Optional)</Label>
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

              {/* Planting Selection */}
              <div>
                <Label htmlFor="plantingId">Planting (Optional)</Label>
                <Select
                  value={selectedPlanting?.id ? String(selectedPlanting.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedPlanting(null);
                      setFormData({ ...formData, plantingId: '' });
                    } else {
                      const planting = plantings.find(p => String(p.id) === value);
                      setSelectedPlanting(planting || null);
                      setFormData({ ...formData, plantingId: planting ? String(planting.id) : '' });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a planting..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {plantings.map((planting) => (
                      <SelectItem key={planting.id} value={String(planting.id)}>
                        {planting.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlanting && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedPlanting.name}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanting(null);
                          setFormData({ ...formData, plantingId: '' });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Harvest Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="5.5"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {HARVEST_UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="weightLbs">Weight (lbs)</Label>
                <Input
                  id="weightLbs"
                  type="number"
                  step="0.01"
                  placeholder="2.5"
                  value={formData.weightLbs}
                  onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Harvest Date */}
              <div>
                <Label htmlFor="harvestDate">Harvest Date</Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Image URL */}
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/harvest.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this harvest..."
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
                  'Create Harvest'
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
            placeholder="Search harvests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {HARVEST_UNIT_OPTIONS.map((unit) => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
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
            setFilterUnit('all');
            fetchHarvests();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Harvests Table */}
      {filteredHarvests.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Apple className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No harvests found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first harvest
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Harvest ID</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Plant</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Quantity</TableHead>
                <TableHead className="text-center text-xs py-1">Date</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHarvests.map((harvest) => {
                const plant = plants.find(p => p.id === harvest.plantId);
                return (
                  <TableRow key={harvest.id} className="hover:bg-muted/50">
                    <TableCell className="py-1 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Apple className="w-3.5 h-3.5 text-red-500" />
                        {harvest.harvestId}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                      {plant?.commonName || plant?.name || `Plant #${harvest.plantId}`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                      {harvest.quantity ? `${harvest.quantity} ${harvest.unit}` : '—'}
                    </TableCell>
                    <TableCell className="text-center py-1 text-sm text-muted-foreground">
                      {harvest.harvestDate ? new Date(harvest.harvestDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="py-1 text-right">{renderActions(harvest)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingHarvest} onOpenChange={(open) => !open && setEditingHarvest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Harvest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Plant Selection */}
            <div>
              <Label htmlFor="edit-plantId">Plant (Optional)</Label>
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

            {/* Planting Selection */}
            <div>
              <Label htmlFor="edit-plantingId">Planting (Optional)</Label>
              <Select
                value={selectedPlanting?.id ? String(selectedPlanting.id) : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedPlanting(null);
                    setFormData({ ...formData, plantingId: '' });
                  } else {
                    const planting = plantings.find(p => String(p.id) === value);
                    setSelectedPlanting(planting || null);
                    setFormData({ ...formData, plantingId: planting ? String(planting.id) : '' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a planting..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {plantings.map((planting) => (
                    <SelectItem key={planting.id} value={String(planting.id)}>
                      {planting.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlanting && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedPlanting.name}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanting(null);
                        setFormData({ ...formData, plantingId: '' });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Harvest Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {HARVEST_UNIT_OPTIONS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-weightLbs">Weight (lbs)</Label>
              <Input
                id="edit-weightLbs"
                type="number"
                step="0.01"
                value={formData.weightLbs}
                onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Harvest Date */}
            <div>
              <Label htmlFor="edit-harvestDate">Harvest Date</Label>
              <Input
                id="edit-harvestDate"
                type="date"
                value={formData.harvestDate}
                onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Image URL */}
            <div>
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                disabled={isSubmitting}
              />
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