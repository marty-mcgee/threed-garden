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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Eye,
  EyeOff,
  Calendar,
  Sprout,
  WandSparkles,
} from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
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

export function ThreeDHarvestsCRUD({ onModuleUpdate, scrollRecords = false }: { onModuleUpdate?: () => void; scrollRecords?: boolean }) {
  const { showToast, ToastComponent } = useToast();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const fetchHarvests = () => setRevision(value => value + 1);
  function resetList() { setPage(0); setSelected(new Set()); setLoading(true); }


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
    fetchPlants();
    fetchPlantings();
    fetchProjects();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(false); setSelected(new Set());
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search: searchQuery, sort: sort.key, direction: sort.direction });
    if (filterProject !== 'all') params.set('projectId', filterProject);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/harvests?${params}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch Harvests');
        if (controller.signal.aborted) return;
        setHarvests(data.data); setTotal(Number(data.pagination.total));
        if (page > 0 && page * pageSize >= data.pagination.total) setPage(Math.max(0, Math.ceil(data.pagination.total / pageSize) - 1));
      } catch (error) {
        if (!controller.signal.aborted) { setLoadError(true); setHarvests([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, searchQuery, sort, revision, filterProject]);

  const filteredHarvests = harvests;

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
    if (isSubmitting || bulkBusy) return;
    if (!confirm(`Delete harvest "${name}"? This action cannot be undone.`)) return;

    setIsSubmitting(true);
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
    } finally { setIsSubmitting(false); }
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

  async function deleteSelected() {
    const targets = harvests.filter(harvest => selected.has(harvest.id));
    if (bulkBusy || loading || isSubmitting || !targets.length || !confirm(`Delete ${targets.length} selected Harvests? This action cannot be undone.`)) return;
    setBulkBusy(true); setBulkNotice('');
    let deleted = 0;
    const failures: string[] = [];
    for (const harvest of targets) {
      try {
        const response = await fetch(`/api/threed/harvests?id=${harvest.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
        deleted++;
      } catch (error) { failures.push(`${harvest.harvestId}: ${error instanceof Error ? error.message : 'Delete failed'}`); }
    }
    setBulkNotice(`Deleted ${deleted} of ${targets.length} Harvests.${failures.length ? ` ${failures.join('; ')} Check the refreshed list before retrying.` : ''}`);
    setBulkBusy(false); setSelected(new Set()); fetchHarvests();
    if (deleted) onModuleUpdate?.();
  }
  function heading(key: string, title: string) {
    const Icon = sort.key === key ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={loading || bulkBusy} className="inline-flex items-center gap-1" onClick={() => { resetList(); setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{title}<Icon className="h-3 w-3" aria-hidden="true" /></button></TableHead>;
  }

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

  return (
    <div className={scrollRecords ? 'flex h-full min-h-0 flex-col gap-2' : 'space-y-2'}>
      {ToastComponent}
      <AdminWorkspaceHeader icon={Package} title="Harvests" description="Log and manage harvest records from your garden" className="shrink-0 [&>a]:text-[11px] [&>div:first-child>svg]:text-orange-500">
        <Badge variant="secondary" className="text-xs">{loading || loadError ? '—' : total}</Badge>
        <Input aria-label="Search Harvests" placeholder="Search Harvests..." value={searchQuery}
          disabled={bulkBusy} onChange={(event) => { resetList(); setSearchQuery(event.target.value); }} className="h-7 min-w-48 flex-1 text-xs" />
        <Select value={filterProject} disabled={bulkBusy} onValueChange={value => { resetList(); setFilterProject(value); }}>
          <SelectTrigger aria-label="Filter Harvests by Project" className="h-7 w-auto min-w-48 text-[11px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-[11px]" disabled={bulkBusy}>
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
        <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading || bulkBusy} onClick={fetchHarvests}>Refresh</Button>
        <AdminWorkspaceLink href="/admin/threed/plantings" icon={Sprout}>Plantings</AdminWorkspaceLink>
      </AdminWorkspaceHeader>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Harvests unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Harvests`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading || bulkBusy || isSubmitting || !!loadError || !selected.size} onClick={() => void deleteSelected()}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={bulkBusy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Harvests per page" className="rounded border bg-background p-1 text-[11px]" value={pageSize} disabled={loading || bulkBusy} onChange={event => { resetList(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} size="sm" variant="outline" className="h-7 text-[11px]" disabled={loading || bulkBusy || !!loadError || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setSelected(new Set()); setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
        </div>
      </div>
      {bulkNotice && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{bulkNotice}</p>}

      <div className={scrollRecords
        ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible'
        : 'overflow-auto rounded-lg border'} role="region" aria-label="Harvest records" tabIndex={0}>
          <Table className="min-w-[850px]">
            <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"><input type="checkbox" aria-label="Select Harvests on this page" disabled={loading || bulkBusy || !!loadError || !harvests.length} checked={harvests.length > 0 && harvests.every(harvest => selected.has(harvest.id))} ref={input => { if (input) input.indeterminate = harvests.some(harvest => selected.has(harvest.id)) && !harvests.every(harvest => selected.has(harvest.id)); }} onChange={event => setSelected(event.target.checked ? new Set(harvests.map(harvest => harvest.id)) : new Set())} /></TableHead>
                {heading('harvestId', 'Harvest Name')}
                {heading('plant', 'Plant')}
                {heading('id', 'ID')}
                {heading('quantity', 'Quantity')}
                {heading('weight', 'Weight')}
                {heading('date', 'Date')}
                {heading('active', 'Active')}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={9} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading Harvests" /></TableCell></TableRow>
                : loadError ? <TableRow><TableCell colSpan={9} className="py-8 text-center">
                  <p className="text-sm text-destructive">Unable to load Harvests.</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={fetchHarvests}>Retry</Button>
                </TableCell></TableRow>
                : filteredHarvests.length === 0 ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No Harvests found. Use Add Harvest to create a record.</TableCell></TableRow>
                : filteredHarvests.map((harvest) => (
                <TableRow key={harvest.id} className="hover:bg-muted/50">
                  <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${harvest.harvestId}`} checked={selected.has(harvest.id)} disabled={bulkBusy || loading} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(harvest.id); else next.delete(harvest.id); return next; })} /></TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      {harvest.harvestId}
                      {harvest.source === 'world-action' && (
                        <Badge variant="outline" className="text-[10px] text-purple-600">
                          <WandSparkles className="w-3 h-3 mr-1" /> World Action
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-sm">{harvest.plant?.commonName || 'Unknown'}</TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">{harvest.id}</TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {harvest.quantity} {harvest.unit}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {harvest.weightLbs ? `${harvest.weightLbs} lbs` : '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {harvest.harvestDate ? new Date(harvest.harvestDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {harvest.isActive
                      ? <Check className="mx-auto h-4 w-4 text-green-500" aria-label="Active" />
                      : <X className="mx-auto h-4 w-4 text-gray-500" aria-label="Inactive" />}
                  </TableCell>
                  <TableCell className="py-1 text-right">{!bulkBusy && !isSubmitting && renderActions(harvest)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
