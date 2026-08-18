// components/admin/threed/harvests/ThreeDHarvestsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Package,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  Sprout,
  WandSparkles,
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

// ✅ Types
interface Plant {
  id: number;
  plantId: string;
  commonName: string;
}

interface Planting {
  id: number;
  plantingId: string;
  plantId: number | null;
  plant?: Plant;
}

interface Harvest {
  id: number;
  harvestId: string;
  plantingId: number | null;
  plantId: number | null;
  quantity: string;
  unit: string;
  weightLbs: string | null;
  harvestDate: string | null;
  notes: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  planting?: Planting;
  plant?: Plant;
  source?: 'manual' | 'world-action';
  projectAssociations?: Array<{ projectId: number | null; moduleId: number; config?: unknown }>;
}

interface Project { id: number; name: string; }

interface FormData {
  projectId: string;
  harvestId: string;
  plantingId: string;
  plantId: string;
  quantity: string;
  unit: string;
  weightLbs: string;
  harvestDate: string;
  notes: string;
  imageUrl: string;
  isActive: boolean;
}

// ✅ Options
const UNIT_OPTIONS = [
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'each', label: 'Each' },
  { value: 'bunch', label: 'Bunch' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

export function ThreeDHarvestsCRUD({ onModuleUpdate }: { onModuleUpdate?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    projectId: '',
    harvestId: '',
    plantingId: '',
    plantId: '',
    quantity: '',
    unit: 'lbs',
    weightLbs: '',
    harvestDate: '',
    notes: '',
    imageUrl: '',
    isActive: true,
  });

  // ✅ Fetch data
  useEffect(() => {
    fetchHarvests();
    fetchPlants();
    fetchPlantings();
    fetchProjects();
  }, []);

  const fetchHarvests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/harvests?limit=100');
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

  const fetchPlantings = async () => {
    try {
      const response = await fetch('/api/threed/plantings?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setPlantings(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching plantings:', error);
      setPlantings([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/project');
      const data = await response.json();
      setProjects(data.success && Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const filteredHarvests = harvests.filter((harvest) => {
    const matchesSearch = harvest.harvestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (harvest.plant?.commonName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (harvest.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesActive = filterActive === 'all' || String(harvest.isActive) === filterActive;
    const matchesProject = filterProject === 'all' || harvest.projectAssociations?.some(
      (association) => String(association.projectId) === filterProject,
    );
    return matchesSearch && matchesActive && matchesProject;
  });

  const handleCreate = async () => {
    if (!formData.harvestId) {
      showToast('Harvest ID is required', 'error');
      return;
    }
    if (!formData.quantity) {
      showToast('Quantity is required', 'error');
      return;
    }
    if (formData.projectId && !formData.plantingId) {
      showToast('Select a planting for a project-scoped harvest', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        plantingId: formData.plantingId ? parseInt(formData.plantingId) : null,
        plantId: formData.plantId ? parseInt(formData.plantId) : null,
        quantity: parseFloat(formData.quantity) || 0,
        weightLbs: formData.weightLbs ? parseFloat(formData.weightLbs) : null,
        harvestDate: formData.harvestDate || null,
      };

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
    if (!formData.harvestId) {
      showToast('Harvest ID is required', 'error');
      return;
    }
    if (!formData.quantity) {
      showToast('Quantity is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        plantingId: formData.plantingId ? parseInt(formData.plantingId) : null,
        plantId: formData.plantId ? parseInt(formData.plantId) : null,
        quantity: parseFloat(formData.quantity) || 0,
        weightLbs: formData.weightLbs ? parseFloat(formData.weightLbs) : null,
        harvestDate: formData.harvestDate || null,
      };

      const response = await fetch(`/api/threed/harvests?id=${editingHarvest.id}`, {
        method: 'PATCH',
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

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete harvest "${name}"? This action cannot be undone.`)) return;

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
      projectId: '',
      harvestId: '',
      plantingId: '',
      plantId: '',
      quantity: '',
      unit: 'lbs',
      weightLbs: '',
      harvestDate: '',
      notes: '',
      imageUrl: '',
      isActive: true,
    });
  };

  const openEditDialog = (harvest: Harvest) => {
    setEditingHarvest(harvest);
    setFormData({
      projectId: harvest.projectAssociations?.[0]?.projectId ? String(harvest.projectAssociations[0].projectId) : '',
      harvestId: harvest.harvestId || '',
      plantingId: harvest.plantingId ? String(harvest.plantingId) : '',
      plantId: harvest.plantId ? String(harvest.plantId) : '',
      quantity: harvest.quantity || '',
      unit: harvest.unit || 'lbs',
      weightLbs: harvest.weightLbs || '',
      harvestDate: harvest.harvestDate ? new Date(harvest.harvestDate).toISOString().split('T')[0] : '',
      notes: harvest.notes || '',
      imageUrl: harvest.imageUrl || '',
      isActive: harvest.isActive ?? true,
    });
  };

  const renderActions = (harvest: Harvest) => (
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
          {harvest.weightLbs && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Weight: {harvest.weightLbs} lbs
              </span>
            </DropdownMenuItem>
          )}
          {harvest.plant && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Plant: {harvest.plant.commonName}
              </span>
            </DropdownMenuItem>
          )}
          {harvest.harvestDate && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Harvested: {new Date(harvest.harvestDate).toLocaleDateString()}
              </span>
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
          <Package className="w-4 h-4 text-orange-500" />
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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Harvest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="projectId">Project</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Standalone harvest" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Standalone</SelectItem>
                    {projects.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Project-scoped records require a planting assigned to that project.
                </p>
              </div>
              <div>
                <Label htmlFor="harvestId">Harvest ID *</Label>
                <Input
                  id="harvestId"
                  placeholder="e.g., HARVEST-001"
                  value={formData.harvestId}
                  onChange={(e) => setFormData({ ...formData, harvestId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="plantId">Plant</Label>
                <Select
                  value={formData.plantId}
                  onValueChange={(value) => setFormData({ ...formData, plantId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={String(plant.id)}>
                        {plant.commonName} ({plant.plantId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="plantingId">Planting</Label>
                <Select
                  value={formData.plantingId}
                  onValueChange={(value) => {
                    const nextPlantingId = value === 'none' ? '' : value;
                    const nextPlanting = plantings.find((item) => String(item.id) === nextPlantingId);
                    setFormData({
                      ...formData,
                      plantingId: nextPlantingId,
                      plantId: nextPlanting?.plantId ? String(nextPlanting.plantId) : formData.plantId,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a planting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {plantings.map((planting) => (
                      <SelectItem key={planting.id} value={String(planting.id)}>
                        {planting.plantingId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    disabled={isSubmitting}
                    required
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
                      {UNIT_OPTIONS.map((unit) => (
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
                  min="0"
                  placeholder="2.5"
                  value={formData.weightLbs}
                  onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

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
            placeholder="Search by ID, plant, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
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
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterActive('all');
            setFilterProject('all');
            fetchHarvests();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Harvests Table */}
      {filteredHarvests.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                <TableHead className="text-xs py-1">ID</TableHead>
                <TableHead className="text-xs py-1">Plant</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Quantity</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Weight</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Date</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHarvests.map((harvest) => (
                <TableRow key={harvest.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {harvest.harvestId}
                  </TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                      {harvest.plant?.commonName || 'Unknown'}
                      {harvest.source === 'world-action' && (
                        <Badge variant="outline" className="text-[10px] text-purple-600">
                          <WandSparkles className="w-3 h-3 mr-1" /> World Action
                        </Badge>
                      )}
                      {!harvest.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {harvest.quantity} {harvest.unit}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {harvest.weightLbs ? `${harvest.weightLbs} lbs` : '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {harvest.harvestDate ? new Date(harvest.harvestDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${harvest.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {harvest.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(harvest)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingHarvest} onOpenChange={(open) => !open && setEditingHarvest(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Harvest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="rounded border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Source: <span className="font-medium text-foreground">{editingHarvest?.source === 'world-action' ? 'World Action' : 'Manual'}</span>
              {' · '}
              Project: <span className="font-medium text-foreground">
                {projects.find((item) => String(item.id) === formData.projectId)?.name || 'Standalone'}
              </span>
            </div>
            <div>
              <Label htmlFor="edit-harvestId">Harvest ID *</Label>
              <Input
                id="edit-harvestId"
                value={formData.harvestId}
                onChange={(e) => setFormData({ ...formData, harvestId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-plantId">Plant</Label>
              <Select
                value={formData.plantId}
                onValueChange={(value) => setFormData({ ...formData, plantId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {plants.map((plant) => (
                    <SelectItem key={plant.id} value={String(plant.id)}>
                      {plant.commonName} ({plant.plantId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-plantingId">Planting</Label>
              <Select
                value={formData.plantingId}
                onValueChange={(value) => setFormData({ ...formData, plantingId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a planting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {plantings.map((planting) => (
                    <SelectItem key={planting.id} value={String(planting.id)}>
                      {planting.plantingId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">Quantity *</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  step="0.01"
                  min="0"
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
                    {UNIT_OPTIONS.map((unit) => (
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
                min="0"
                value={formData.weightLbs}
                onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

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
