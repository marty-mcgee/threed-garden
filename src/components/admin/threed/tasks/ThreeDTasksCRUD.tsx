// components/admin/threed/tasks/ThreeDTasksCRUD.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  ListTodo,
  MoreHorizontal,
  Search,
  Clock,
  X,
} from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
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
  ThreeDTask,
  ThreeDTaskFormData,
  ThreeDRelatedEntity,
  TaskType,
  TaskPriority,
  TaskStatus,
  TASK_TYPE_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '@/libraries/types/threed';

interface ThreeDTasksCRUDProps {
  threedId?: number;
  scrollRecords?: boolean;
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
    case 'pending': return 'text-yellow-600 dark:text-yellow-400';
    case 'in_progress': return 'text-blue-600 dark:text-blue-400';
    case 'completed': return 'text-green-600 dark:text-green-400';
    case 'cancelled': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

// ✅ Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'text-red-600 dark:text-red-400';
    case 'high': return 'text-orange-600 dark:text-orange-400';
    case 'medium': return 'text-blue-600 dark:text-blue-400';
    case 'low': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

export function ThreeDTasksCRUD({ threedId, onModuleUpdate, scrollRecords = false }: ThreeDTasksCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [tasks, setTasks] = useState<ThreeDTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<ThreeDTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('title');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const requestSequence = useRef(0);


  // ✅ State for related entity options
  const [plants, setPlants] = useState<ThreeDRelatedEntity[]>([]);
  const [beds, setBeds] = useState<ThreeDRelatedEntity[]>([]);
  const [plantings, setPlantings] = useState<ThreeDRelatedEntity[]>([]);
  const [wateringSchedules, setWateringSchedules] = useState<ThreeDRelatedEntity[]>([]);

  // ✅ Form state
  const [formData, setFormData] = useState<ThreeDTaskFormData>({
    title: '',
    description: '',
    type: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
    dueDate: '',
    assignedTo: '',
    notes: '',
    selectedPlant: null,
    selectedBed: null,
    selectedPlanting: null,
    selectedWateringSchedule: null,
    plantingId: '',
    plantId: '',
    bedId: '',
    wateringScheduleId: '',
    isActive: true,
  });

  // ✅ Fetch tasks and related entities
  useEffect(() => {
    fetchRelatedEntities();
  }, [threedId]);

  useEffect(() => {
    setSelected(new Set());
    void fetchTasks();
    return () => { requestSequence.current++; };
  }, [threedId, page, pageSize, searchQuery, sort, direction]);

  const fetchTasks = async () => {
    const request = ++requestSequence.current;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(pageSize));
      params.set('offset', String((page - 1) * pageSize));
      params.set('search', searchQuery);
      params.set('sort', sort);
      params.set('direction', direction);
      if (threedId) params.append('moduleId', String(threedId));

      const response = await fetch(`/api/threed/tasks?${params.toString()}`);
      const data = await response.json();

      if (request !== requestSequence.current) return;
      if (response.ok && data.success) {
        const count = Number(data.pagination?.total ?? 0);
        setSelected(new Set());
        setTotal(count);
        if (page > Math.max(1, Math.ceil(count / pageSize))) setPage(Math.max(1, Math.ceil(count / pageSize)));
        setTasks(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch tasks', 'error');
        setTasks([]);
      }
    } catch (error) {
      if (request !== requestSequence.current) return;
      console.error('Error fetching tasks:', error);
      showToast('Failed to fetch tasks', 'error');
      setTasks([]);
    } finally {
      if (request === requestSequence.current) setLoading(false);
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

      // ✅ Fetch plantings
      const plantingsRes = await fetch('/api/threed/plantings?isActive=true');
      const plantingsData = await plantingsRes.json();
      if (plantingsData.success) {
        setPlantings(plantingsData.data.map((p: any) => ({
          id: p.id,
          name: p.plantId ? `Planting #${p.id}` : `Planting #${p.id}`,
        })));
      }

      // ✅ Fetch watering schedules
      const schedulesRes = await fetch('/api/threed/watering-schedules?isActive=true');
      const schedulesData = await schedulesRes.json();
      if (schedulesData.success) {
        setWateringSchedules(schedulesData.data.map((s: any) => ({
          id: s.id,
          name: s.scheduleId || `Schedule #${s.id}`,
        })));
      }
    } catch (error) {
      console.error('Error fetching related entities:', error);
    }
  };

  const filteredTasks = tasks;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const toggleTask = (id: number) => setSelected(previous => {
    const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const deleteSelected = async () => {
    const ids = tasks.filter(task => selected.has(task.id)).map(task => task.id);
    if (!ids.length || !confirm(`Delete ${ids.length} selected tasks? This action cannot be undone.`)) return;
    setBulkBusy(true);
    let deleted = 0;
    for (const id of ids) {
      try {
        const response = await fetch(`/api/threed/tasks?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (response.ok && result.success) deleted++;
      } catch { /* Report partial failure after processing the selected page. */ }
    }
    setSelected(new Set());
    await fetchTasks();
    if (deleted) onModuleUpdate?.();
    showToast(`${deleted} deleted; ${ids.length - deleted} failed`, deleted === ids.length ? 'success' : 'error');
    setBulkBusy(false);
  };

  const handleCreate = async () => {
    if (!formData.title) {
      showToast('Task title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description || null,
        type: formData.type || null,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || null,
        assignedTo: formData.assignedTo || null,
        notes: formData.notes || null,
        plantingId: formData.selectedPlanting?.id || null,
        plantId: formData.selectedPlant?.id || null,
        bedId: formData.selectedBed?.id || null,
        wateringScheduleId: formData.selectedWateringSchedule?.id || null,
      };

      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

      const response = await fetch('/api/threed/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Task created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchTasks();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create task', 'error');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Failed to create task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTask) return;
    if (!formData.title) {
      showToast('Task title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description || null,
        type: formData.type || null,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || null,
        assignedTo: formData.assignedTo || null,
        notes: formData.notes || null,
        plantingId: formData.selectedPlanting?.id || null,
        plantId: formData.selectedPlant?.id || null,
        bedId: formData.selectedBed?.id || null,
        wateringScheduleId: formData.selectedWateringSchedule?.id || null,
      };

      const response = await fetch(`/api/threed/tasks?id=${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Task updated successfully', 'success');
        setEditingTask(null);
        await fetchTasks();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update task', 'error');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete task "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/tasks?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Task deleted successfully', 'success');
        await fetchTasks();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete task', 'error');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: '',
      assignedTo: '',
      notes: '',
      selectedPlant: null,
      selectedBed: null,
      selectedPlanting: null,
      selectedWateringSchedule: null,
      plantingId: '',
      plantId: '',
      bedId: '',
      wateringScheduleId: '',
      isActive: true,
    });
  };

  // ✅ FIX: Format date when opening edit dialog
  const openEditDialog = (task: ThreeDTask) => {
    setEditingTask(task);
    
    // ✅ Find selected entities
    const selectedPlant = plants.find(p => p.id === task.plantId) || null;
    const selectedBed = beds.find(b => b.id === task.bedId) || null;
    const selectedPlanting = plantings.find(p => p.id === task.plantingId) || null;
    const selectedWateringSchedule = wateringSchedules.find(w => w.id === task.wateringScheduleId) || null;

    setFormData({
      title: task.title,
      description: task.description || '',
      type: task.type || '',
      priority: task.priority || TaskPriority.MEDIUM,
      status: task.status || TaskStatus.PENDING,
      dueDate: formatDateForInput(task.dueDate),
      assignedTo: task.assignedTo || '',
      notes: task.notes || '',
      selectedPlant: selectedPlant,
      selectedBed: selectedBed,
      selectedPlanting: selectedPlanting,
      selectedWateringSchedule: selectedWateringSchedule,
      plantingId: task.plantingId ? String(task.plantingId) : '',
      plantId: task.plantId ? String(task.plantId) : '',
      bedId: task.bedId ? String(task.bedId) : '',
      wateringScheduleId: task.wateringScheduleId ? String(task.wateringScheduleId) : '',
      isActive: true,
    });
  };

  const renderActions = (task: ThreeDTask) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.dueDate && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </DropdownMenuItem>
          )}
          {task.assignedTo && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">Assigned to: {task.assignedTo}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(task.id, task.title)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );


  return (
    <div className={scrollRecords ? "flex h-full min-h-0 flex-col gap-2" : "space-y-2"}>
      {ToastComponent}

      {/* Header */}
      <AdminWorkspaceHeader icon={ListTodo} title="Tasks" description="Manage garden tasks and to-do items for your 3D garden" className="shrink-0">
        <Badge variant="secondary" className="text-xs">{total}</Badge>
        <div className="relative min-w-0 w-full flex-auto sm:w-auto sm:min-w-48 sm:flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            disabled={bulkBusy}
            onChange={(e) => { setPage(1); setSearchQuery(e.target.value); }}
            className="pl-7 h-7 text-xs"
          />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90dvh] gap-3 overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="grid min-w-0 grid-cols-1 items-start gap-3 pt-1 md:grid-cols-2 [&_input]:h-8 [&_input]:text-xs [&_textarea]:min-h-16 [&_textarea]:text-xs [&_label]:text-xs [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:text-xs [&>div]:min-w-0">
              {/* Basic Info */}
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Water tomato plants"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Task description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="type">Task Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="e.g., Farmer Joe"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
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

              {/* ✅ Related Entities - Dropdowns */}
              <div className="grid grid-cols-1 gap-3 rounded-md border p-3 md:col-span-2 sm:grid-cols-2 [&>label]:sm:col-span-2 [&>p]:sm:col-span-2 [&>div]:min-w-0">
                <Label className="text-sm font-medium">Related Entities</Label>
                <p className="text-xs text-muted-foreground">Select related entities for this task</p>

                {/* Plant */}
                <div className="min-w-0">
                  <Label htmlFor="plantId" className="text-xs">Plant</Label>
                  <Select
                    value={formData.selectedPlant?.id ? String(formData.selectedPlant.id) : 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({ ...formData, selectedPlant: null });
                      } else {
                        const plant = plants.find(p => String(p.id) === value);
                        setFormData({ ...formData, selectedPlant: plant || null });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-full min-w-0 text-xs">
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
                  {formData.selectedPlant && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {formData.selectedPlant.commonName || formData.selectedPlant.name}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, selectedPlant: null })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Bed */}
                <div className="min-w-0">
                  <Label htmlFor="bedId" className="text-xs">Bed</Label>
                  <Select
                    value={formData.selectedBed?.id ? String(formData.selectedBed.id) : 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({ ...formData, selectedBed: null });
                      } else {
                        const bed = beds.find(b => String(b.id) === value);
                        setFormData({ ...formData, selectedBed: bed || null });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-full min-w-0 text-xs">
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
                  {formData.selectedBed && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {formData.selectedBed.name}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, selectedBed: null })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Planting */}
                <div className="min-w-0">
                  <Label htmlFor="plantingId" className="text-xs">Planting</Label>
                  <Select
                    value={formData.selectedPlanting?.id ? String(formData.selectedPlanting.id) : 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({ ...formData, selectedPlanting: null });
                      } else {
                        const planting = plantings.find(p => String(p.id) === value);
                        setFormData({ ...formData, selectedPlanting: planting || null });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-full min-w-0 text-xs">
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
                  {formData.selectedPlanting && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {formData.selectedPlanting.name}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, selectedPlanting: null })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Watering Schedule */}
                <div className="min-w-0">
                  <Label htmlFor="wateringScheduleId" className="text-xs">Watering Schedule</Label>
                  <Select
                    value={formData.selectedWateringSchedule?.id ? String(formData.selectedWateringSchedule.id) : 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({ ...formData, selectedWateringSchedule: null });
                      } else {
                        const schedule = wateringSchedules.find(s => String(s.id) === value);
                        setFormData({ ...formData, selectedWateringSchedule: schedule || null });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-full min-w-0 text-xs">
                      <SelectValue placeholder="Select a schedule..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {wateringSchedules.map((schedule) => (
                        <SelectItem key={schedule.id} value={String(schedule.id)}>
                          {schedule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.selectedWateringSchedule && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {formData.selectedWateringSchedule.name}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, selectedWateringSchedule: null })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <Button onClick={handleCreate} className="h-8 w-full self-end text-xs md:col-span-2 md:w-auto md:justify-self-end" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AdminWorkspaceHeader>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span>{total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} of {total} Tasks</span>
          <span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!selected.size || bulkBusy || loading} onClick={deleteSelected}><Trash2 className="mr-1 h-3 w-3" />Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!selected.size || bulkBusy} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label>Per page <select aria-label="Tasks per page" className="rounded border bg-background p-1 text-xs" value={pageSize} disabled={bulkBusy} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>{[25,50,100].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1 || bulkBusy || loading} onClick={() => setPage(1)}>First</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1 || bulkBusy || loading} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= pages || bulkBusy || loading} onClick={() => setPage(page + 1)}>Next</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= pages || bulkBusy || loading} onClick={() => setPage(pages)}>Last</Button>
        </div>
      </div>
      {loading && <p role="status" className="text-xs text-muted-foreground">Loading Tasks…</p>}
      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-auto text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{loading ? 'Loading Tasks…' : 'No tasks found'}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first task
          </Button>
        </div>
      ) : (
        <div role="region" aria-label="Task records" tabIndex={scrollRecords ? 0 : undefined}
          className={scrollRecords ? "min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible" : "border rounded-lg overflow-auto"}>
          <Table className="min-w-[700px]">
            <TableHeader className={scrollRecords ? "sticky top-0 z-10 bg-background" : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"><input type="checkbox" aria-label="Select all Tasks on this page" disabled={bulkBusy || loading} checked={tasks.length > 0 && tasks.every(task => selected.has(task.id))} onChange={e => setSelected(e.target.checked ? new Set(tasks.map(task => task.id)) : new Set())} /></TableHead>
                {([['title', 'Title'], ['dueDate', 'Due Date'], ['assignedTo', 'Assigned To'], ['type', 'Type'], ['priority', 'Priority'], ['status', 'Status'], ['isActive', 'Active']] as const).map(([key, label]) => (
                  <TableHead key={key} className="text-xs py-1" aria-sort={sort === key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
                    <button className="inline-flex items-center gap-1 py-1" disabled={bulkBusy} onClick={() => {
                      setPage(1); setSelected(new Set());
                      setDirection(sort === key && direction === 'asc' ? 'desc' : 'asc'); setSort(key);
                    }}>{label}<span aria-hidden="true">{sort === key ? direction === 'asc' ? '↑' : '↓' : '↕'}</span></button>
                  </TableHead>
                ))}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell><input type="checkbox" aria-label={`Select ${task.title}`} checked={selected.has(task.id)} disabled={bulkBusy || loading} onChange={() => toggleTask(task.id)} /></TableCell>
                <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : task.status === 'in_progress' ? (
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <ListTodo className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      {task.title}

                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-xs whitespace-nowrap">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="py-1 text-xs">{task.assignedTo || '—'}</TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {task.type ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(TASK_TYPE_OPTIONS, task.type)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {getOptionLabel(TASK_PRIORITY_OPTIONS, task.priority)}
                    </span>
                  </TableCell>
                  <TableCell className="py-1">
                    <span className={`text-xs ${getStatusColor(task.status)}`}>
                      {getOptionLabel(TASK_STATUS_OPTIONS, task.status)}
                    </span>
                  </TableCell>
                  <TableCell className="py-1"><span aria-label={task.isActive ? 'Active' : 'Inactive'} title={task.isActive ? 'Active' : 'Inactive'} className={task.isActive ? 'text-green-500' : 'text-muted-foreground'}>{task.isActive ? '✓' : '×'}</span></TableCell>
                  <TableCell className="py-1 text-right">{renderActions(task)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90dvh] gap-3 overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 grid-cols-1 items-start gap-3 pt-1 md:grid-cols-2 [&_input]:h-8 [&_input]:text-xs [&_textarea]:min-h-16 [&_textarea]:text-xs [&_label]:text-xs [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:text-xs [&>div]:min-w-0">
            <div>
              <Label htmlFor="edit-title">Task Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
              />
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-type">Task Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-assignedTo">Assigned To</Label>
              <Input
                id="edit-assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
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

            {/* ✅ Related Entities - Dropdowns (Edit) */}
            <div className="grid grid-cols-1 gap-3 rounded-md border p-3 md:col-span-2 sm:grid-cols-2 [&>label]:sm:col-span-2 [&>p]:sm:col-span-2 [&>div]:min-w-0">
              <Label className="text-sm font-medium">Related Entities</Label>
              <p className="text-xs text-muted-foreground">Select related entities for this task</p>

              {/* Plant */}
              <div className="min-w-0">
                <Label htmlFor="edit-plantId" className="text-xs">Plant</Label>
                <Select
                  value={formData.selectedPlant?.id ? String(formData.selectedPlant.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setFormData({ ...formData, selectedPlant: null });
                    } else {
                      const plant = plants.find(p => String(p.id) === value);
                      setFormData({ ...formData, selectedPlant: plant || null });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 text-xs">
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
                {formData.selectedPlant && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {formData.selectedPlant.commonName || formData.selectedPlant.name}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedPlant: null })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Bed */}
              <div className="min-w-0">
                <Label htmlFor="edit-bedId" className="text-xs">Bed</Label>
                <Select
                  value={formData.selectedBed?.id ? String(formData.selectedBed.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setFormData({ ...formData, selectedBed: null });
                    } else {
                      const bed = beds.find(b => String(b.id) === value);
                      setFormData({ ...formData, selectedBed: bed || null });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 text-xs">
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
                {formData.selectedBed && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {formData.selectedBed.name}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedBed: null })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Planting */}
              <div className="min-w-0">
                <Label htmlFor="edit-plantingId" className="text-xs">Planting</Label>
                <Select
                  value={formData.selectedPlanting?.id ? String(formData.selectedPlanting.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setFormData({ ...formData, selectedPlanting: null });
                    } else {
                      const planting = plantings.find(p => String(p.id) === value);
                      setFormData({ ...formData, selectedPlanting: planting || null });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 text-xs">
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
                {formData.selectedPlanting && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {formData.selectedPlanting.name}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedPlanting: null })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Watering Schedule */}
              <div className="min-w-0">
                <Label htmlFor="edit-wateringScheduleId" className="text-xs">Watering Schedule</Label>
                <Select
                  value={formData.selectedWateringSchedule?.id ? String(formData.selectedWateringSchedule.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setFormData({ ...formData, selectedWateringSchedule: null });
                    } else {
                      const schedule = wateringSchedules.find(s => String(s.id) === value);
                      setFormData({ ...formData, selectedWateringSchedule: schedule || null });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 text-xs">
                    <SelectValue placeholder="Select a schedule..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {wateringSchedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={String(schedule.id)}>
                        {schedule.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.selectedWateringSchedule && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {formData.selectedWateringSchedule.name}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedWateringSchedule: null })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-isActive">Active</Label>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}