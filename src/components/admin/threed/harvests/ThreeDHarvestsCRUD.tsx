// components/admin/threed/harvests/ThreeDHarvestsCRUD.tsx
'use client';
import { EntityAlbumsSection } from '../multimedia/EntityAlbumsSection';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { AdminRelationshipBadge } from '@/components/admin/shared/AdminRelationshipBadge';
import { useAdminListQueryState } from '@/components/admin/shared/use-admin-list-query-state';

import { useState, useEffect, useRef } from 'react';
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
  GripVertical,
  RefreshCw,
  Search,
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
import { harvestUnits as UNIT_OPTIONS } from '@/libraries/services/threed/harvests/harvest-edit';
import { HarvestBulkEditDialog, type HarvestSelection } from './HarvestBulkEditDialog';

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
  sortOrder?: number | null;
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
  updatedAt: string | null;
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
// ✅ Helper
const getOptionLabel = (options: readonly { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};
const dateLabel = (date: string | null) => date ? new Date(date).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '—';

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
  const [searchQuery, setSearchQuery] = useAdminListQueryState('/admin/threed/harvests', 'search', '', {enabled: scrollRecords});
  const [filterProject, setFilterProject] = useAdminListQueryState<string>('/admin/threed/harvests', 'projectId', 'all', {enabled: scrollRecords});

  const [page, setPage] = useAdminListQueryState('/admin/threed/harvests', 'page', 0, {enabled: scrollRecords});
  const [pageSize, setPageSize] = useAdminListQueryState('/admin/threed/harvests', 'limit', 25, {enabled: scrollRecords});
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useAdminListQueryState('/admin/threed/harvests', 'sort', scrollRecords ? { key: 'sortOrder', direction: 'asc' } : { key: 'date', direction: 'desc' },
    { enabled: scrollRecords, values: ['harvestId', 'plant', 'id', 'quantity', 'weight', 'date', 'active', 'sortOrder'] });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState('');
  const [bulkEdit, setBulkEdit] = useState<{ selection: HarvestSelection; projectId: string; rank?: number } | null>(null);
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: number; after: boolean } | null>(null);
  const dragSource = useRef<number | null>(null);
  const moveLock = useRef(false);
  const focusAfterMove = useRef<number | null>(null);
  const [revision, setRevision] = useState(0);
  const ranksReady = harvests.length > 0 && harvests.every(harvest => typeof harvest.sortOrder === 'number');
  const reorderMode = sort.key === 'sortOrder' && sort.direction === 'asc' && !searchQuery.trim() && filterProject === 'all';
  const canReorder = scrollRecords && reorderMode && ranksReady && harvests.length > 1 && !loading && !moving && !bulkBusy && !isSubmitting && !bulkEdit && !editingHarvest && !showCreateDialog;
  const reorderHelp = !ranksReady ? 'Sort Order is unavailable' : harvests.length < 2 ? 'At least two records are needed to reorder'
    : reorderMode ? 'Drag or use Arrow Up and Arrow Down' : 'Use Reorder to return to Sort Order';
  const columnCount = scrollRecords ? 10 : 9;
  const fetchHarvests = () => setRevision(value => value + 1);
  function resetList() { setPage(0); setSelected(new Set()); setLoading(true); }
  const clearDrag = () => { dragSource.current = null; setDragging(null); setDropTarget(null); };
  function startReordering() {
    resetList();
    setSearchQuery('');
    setFilterProject('all');
    setSort({ key: 'sortOrder', direction: 'asc' });
  }
  function openBulkEdit(rows: Harvest[], rank?: number) {
    setBulkNotice('');
    setBulkEdit({ selection: rows.map(row => ({ id: row.id, expectedUpdatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null })), projectId: filterProject, rank });
  }
  async function moveHarvest(sourceId: number, targetId: number, after: boolean, keyboard = false) {
    clearDrag();
    if (!canReorder || moveLock.current || sourceId === targetId) return;
    moveLock.current = true;
    setMoving(true);
    setBulkNotice('');
    try {
      const response = await fetch('/api/threed/harvests/manage', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ action: 'move', sourceId, targetId, after }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !Number.isInteger(result.data?.updated)) throw new Error(result.error || 'Failed to reorder Harvests.');
      if (!result.data.updated) return;
      if (keyboard) focusAfterMove.current = sourceId;
      setBulkNotice('Sort Order saved.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to reorder Harvests.', 'error');
    } finally {
      moveLock.current = false;
      setMoving(false);
      setLoading(true);
      fetchHarvests();
    }
  }


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
    setLoading(true); setLoadError(false); setSelected(new Set()); clearDrag();
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search: searchQuery, sort: sort.key, direction: sort.direction });
    if (filterProject !== 'all') params.set('projectId', filterProject);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/harvests?${params}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch Harvests');
        if (controller.signal.aborted) return;
        setHarvests(data.data); setTotal(Number(data.pagination.total));
        if (page > 0 && page * pageSize >= data.pagination.total) setPage(() => Math.max(0, Math.ceil(data.pagination.total / pageSize) - 1), {replace: true});
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
    return <TableHead className="py-1 text-xs" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" disabled={loading || bulkBusy || moving} className="inline-flex items-center gap-1 py-1" onClick={() => { resetList(); setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{title}<Icon className="h-3 w-3" aria-hidden="true" /></button></TableHead>;
  }

  const renderActions = (harvest: Harvest) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" aria-label={`Edit ${harvest.harvestId}`} onClick={() => openEditDialog(harvest)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`More actions for ${harvest.harvestId}`}>
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
                Harvested: {dateLabel(harvest.harvestDate)}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => handleDelete(harvest.id, harvest.harvestId)}
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
      <AdminWorkspaceHeader iconColor="orange" icon={Package} title="Harvests" description="Log and manage harvest records from your garden" showModuleAlbums={!scrollRecords} className="shrink-0">
        <Badge variant="secondary" className="text-xs">{loading || loadError ? '—' : total}</Badge>
        <div className="relative min-w-0 w-full flex-auto sm:w-auto sm:min-w-48 sm:flex-1">
          <Search aria-hidden="true" className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input aria-label="Search Harvests" placeholder="Search Harvests…" maxLength={200} value={searchQuery}
            disabled={bulkBusy || moving} onChange={event => { resetList(); setSearchQuery(event.target.value); }} className="pl-7 h-7 text-xs" />
        </div>
        <Select value={filterProject} disabled={bulkBusy || moving} onValueChange={value => { resetList(); setFilterProject(value); }}>
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
            <Button variant="success" size="sm" className="h-7 px-2 text-xs" disabled={bulkBusy || moving}>
              <Plus className="w-3 h-3 mr-1" />
              Add Harvest
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90dvh] gap-3 overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle>Create New Harvest</DialogTitle>
            </DialogHeader>
            <div className="grid min-w-0 grid-cols-1 items-start gap-3 pt-1 md:grid-cols-2 [&_input]:h-8 [&_input]:text-xs [&_textarea]:min-h-16 [&_textarea]:text-xs [&_label]:text-xs [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:text-xs [&>div]:min-w-0">
              <div>
                <Label htmlFor="projectId">Project</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Standalone harvest" /></SelectTrigger>
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
                  <SelectTrigger className="w-full min-w-0">
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
                  <SelectTrigger className="w-full min-w-0">
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <SelectTrigger className="w-full min-w-0">
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
              <div className="rounded-md border p-3">
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

              <Button variant="success" onClick={handleCreate} className="h-8 w-full self-end text-xs md:col-span-2 md:w-auto md:justify-self-end" disabled={isSubmitting}>
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
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading || bulkBusy || moving} onClick={fetchHarvests}><RefreshCw className="mr-1 size-3" />Refresh</Button>
        {!scrollRecords && <AdminWorkspaceLink href="/admin/threed/plantings" icon={Sprout}>Plantings</AdminWorkspaceLink>}
      </AdminWorkspaceHeader>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Harvests unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Harvests`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span>
          {scrollRecords && <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading || moving || bulkBusy || isSubmitting || loadError || !selected.size}
            onClick={() => openBulkEdit(harvests.filter(harvest => selected.has(harvest.id)))}><Edit className="mr-1 size-3" />Bulk Edit</Button>}
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading || moving || bulkBusy || isSubmitting || !!loadError || !selected.size} onClick={() => void deleteSelected()}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={bulkBusy || moving || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
          {scrollRecords && !reorderMode && <Button variant="outline" size="sm" className="h-7 text-xs" disabled={loading || moving || bulkBusy}
            title="Clear search and Project filters and sort by Sort Order" onClick={startReordering}><GripVertical className="size-3" />Reorder</Button>}
        </div>
        <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Harvests per page" className="rounded border bg-background p-1 text-xs" value={pageSize} disabled={loading || bulkBusy || moving} onChange={event => { resetList(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} size="sm" variant="outline" className="h-7 text-xs" disabled={loading || bulkBusy || moving || !!loadError || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setSelected(new Set()); setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
        </div>
      </div>
      {bulkNotice && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{bulkNotice}</p>}

      <div className={scrollRecords
        ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible'
        : 'overflow-auto rounded-lg border'} role="region" aria-label="Harvest records" tabIndex={0}>
          <Table className="min-w-[850px]">
            <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"><input type="checkbox" aria-label="Select Harvests on this page" disabled={loading || moving || bulkBusy || !!loadError || !harvests.length} checked={harvests.length > 0 && harvests.every(harvest => selected.has(harvest.id))} ref={input => { if (input) input.indeterminate = harvests.some(harvest => selected.has(harvest.id)) && !harvests.every(harvest => selected.has(harvest.id)); }} onChange={event => setSelected(event.target.checked ? new Set(harvests.map(harvest => harvest.id)) : new Set())} /></TableHead>
                {heading('harvestId', 'Harvest Name')}
                {scrollRecords && heading('sortOrder', 'Sort Order')}
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
              {loading ? <TableRow><TableCell colSpan={columnCount} className="py-4 text-xs text-muted-foreground"><span role="status">Loading Harvests…</span></TableCell></TableRow>
                : loadError ? <TableRow><TableCell colSpan={columnCount} className="py-4 text-center">
                  <p className="text-sm text-destructive">Unable to load Harvests.</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={fetchHarvests}>Retry</Button>
                </TableCell></TableRow>
                : filteredHarvests.length === 0 ? <TableRow><TableCell colSpan={columnCount} className="py-4 text-center text-sm text-muted-foreground">No Harvests found.</TableCell></TableRow>
                : filteredHarvests.map((harvest, index) => (
                <TableRow key={harvest.id} className={dragging === harvest.id ? 'opacity-50' : dropTarget?.id === harvest.id
                  ? (dropTarget.after ? 'border-b-2 border-b-emerald-500 bg-emerald-500/10' : 'border-t-2 border-t-emerald-500 bg-emerald-500/10') : 'hover:bg-muted/50'}
                  onDragOver={event => {
                    if (!canReorder || dragSource.current === null || dragSource.current === harvest.id) { setDropTarget(null); return; }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    const rect = event.currentTarget.getBoundingClientRect();
                    const after = event.clientY >= rect.top + rect.height / 2;
                    setDropTarget(previous => previous?.id === harvest.id && previous.after === after ? previous : { id: harvest.id, after });
                  }} onDrop={event => {
                    const sourceId = dragSource.current;
                    if (!canReorder || sourceId === null || sourceId === harvest.id) return;
                    event.preventDefault();
                    const rect = event.currentTarget.getBoundingClientRect();
                    void moveHarvest(sourceId, harvest.id, event.clientY >= rect.top + rect.height / 2);
                  }}>
                  <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${harvest.harvestId}`} checked={selected.has(harvest.id)} disabled={bulkBusy || loading || moving} onChange={event => {
                    const checked = event.target.checked;
                    setSelected(previous => { const next = new Set(previous); if (checked) next.add(harvest.id); else next.delete(harvest.id); return next; });
                  }} /></TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {scrollRecords && <span title={reorderHelp}>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 cursor-grab" aria-label={`Reorder ${harvest.harvestId}`}
                          draggable={canReorder} disabled={!canReorder && !moving} aria-disabled={!canReorder} ref={button => {
                            if (button && focusAfterMove.current === harvest.id) { focusAfterMove.current = null; button.focus(); }
                          }} onDragStart={event => {
                            if (!canReorder) { event.preventDefault(); return; }
                            dragSource.current = harvest.id;
                            setDragging(harvest.id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(harvest.id));
                          }} onDragEnd={clearDrag} onKeyDown={event => {
                            if (!canReorder || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                            event.preventDefault();
                            const after = event.key === 'ArrowDown';
                            const target = filteredHarvests[index + (after ? 1 : -1)];
                            if (target) void moveHarvest(harvest.id, target.id, after, true);
                          }}><GripVertical className="size-4" /></Button>
                      </span>}
                      <ModuleIcon moduleKey="harvests" className="h-3.5 w-3.5 shrink-0" />
                      {harvest.harvestId}
                      {harvest.source === 'world-action' && (
                        <Badge variant="outline" className="text-[10px] text-purple-600">
                          <WandSparkles className="w-3 h-3 mr-1" /> World Action
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {scrollRecords && <TableCell className="py-1 text-xs tabular-nums">{typeof harvest.sortOrder === 'number'
                    ? <button type="button" className="hover:underline" disabled={moving || bulkBusy || isSubmitting} aria-label={`Edit Sort Order for ${harvest.harvestId}`} onClick={() => openBulkEdit([harvest], harvest.sortOrder ?? 0)}>{harvest.sortOrder}</button>
                    : <span title="Apply the Harvests Sort Order migration">—</span>}</TableCell>}
                  <TableCell className="py-1 text-sm"><AdminRelationshipBadge kind="plant" id={harvest.plantId} label={harvest.plant?.commonName} /></TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">{harvest.id}</TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {harvest.quantity} {harvest.unit}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {harvest.weightLbs ? `${harvest.weightLbs} lbs` : '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {dateLabel(harvest.harvestDate)}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <span aria-label={harvest.isActive ? 'Active' : 'Inactive'} title={harvest.isActive ? 'Active' : 'Inactive'} className={harvest.isActive ? 'text-green-500' : 'text-muted-foreground'}>{harvest.isActive ? '✓' : '×'}</span>
                  </TableCell>
                  <TableCell className="py-1 text-right">{!bulkBusy && !moving && !isSubmitting && renderActions(harvest)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      {scrollRecords && bulkEdit && <HarvestBulkEditDialog selection={bulkEdit.selection} rank={bulkEdit.rank} ranksReady={ranksReady} projectId={bulkEdit.projectId}
        onClose={() => setBulkEdit(null)} onSaved={() => {
          setBulkNotice(`Updated ${bulkEdit.selection.length} ${bulkEdit.selection.length === 1 ? 'Harvest' : 'Harvests'}.`);
          setBulkEdit(null);
          setLoading(true);
          fetchHarvests();
          onModuleUpdate?.();
        }} />}

      {/* Edit Dialog */}
      <Dialog open={!!editingHarvest} onOpenChange={(open) => !open && setEditingHarvest(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90dvh] gap-3 overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Edit Harvest</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 grid-cols-1 items-start gap-3 pt-1 md:grid-cols-2 [&_input]:h-8 [&_input]:text-xs [&_textarea]:min-h-16 [&_textarea]:text-xs [&_label]:text-xs [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:text-xs [&>div]:min-w-0">
            <div className="rounded border bg-muted/30 px-3 py-2 text-xs text-muted-foreground md:col-span-2">
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
                <SelectTrigger className="w-full min-w-0">
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
                <SelectTrigger className="w-full min-w-0">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <SelectTrigger className="w-full min-w-0">
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
            <div className="rounded-md border p-3">
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

            <Button onClick={handleUpdate} className="h-8 w-full self-end text-xs md:col-span-2 md:w-auto md:justify-self-end" disabled={isSubmitting}>
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
          {editingHarvest && <EntityAlbumsSection key={editingHarvest.id} moduleType="harvest" entityId={editingHarvest.id} disabled={isSubmitting} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
