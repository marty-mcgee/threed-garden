// components/admin/traffic/chp-cad/TrafficCHPCADCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Pencil, Trash, Eye } from 'lucide-react';

interface TrafficCHPCADIncident {
  id: number;
  incidentId: string;
  logNumber: string;
  cadNumber: string;
  type: string;
  subtype: string;
  status: 'active' | 'cleared' | 'pending' | 'closed';
  priority: string;
  location: string;
  city: string;
  county: string;
  state: string;
  latitude: string;
  longitude: string;
  chpUnit: string;
  respondingUnits: any[];
  logText: string;
  reportedAt: string;
  clearedAt: string;
  lastUpdated: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrafficCHPCADCRUDProps {
  userId: string;
  projectId?: number;
  onModuleUpdate?: () => void;
  moduleId?: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-800',
  cleared: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-800',
};

export function TrafficCHPCADCRUD({
  userId,
  projectId,
  onModuleUpdate,
  moduleId,
}: TrafficCHPCADCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [incidents, setIncidents] = useState<TrafficCHPCADIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<TrafficCHPCADIncident>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchIncidents();
  }, [userId]);

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/traffic/chp-cad');
      const data = await response.json();
      if (data.success) {
        setIncidents(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(
          'Error',
          data.error || 'Failed to fetch incidents',
        );
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      // showToast(
      //   'Error',
      //   error,
      // );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/traffic/chp-cad?id=${editingId}`
        : '/api/traffic/chp-cad';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: editingId
            ? 'Incident updated successfully'
            : 'Incident created successfully',
        });
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({});
        fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Operation failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to save incident',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    try {
      const response = await fetch(`/api/traffic/chp-cad?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Incident deleted successfully',
        });
        fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete incident',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete incident',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (incident: TrafficCHPCADIncident) => {
    setEditingId(incident.id);
    setFormData(incident);
    setIsDialogOpen(true);
  };

  const handleAddToProject = async (incidentId: number) => {
    if (!projectId || !moduleId) {
      toast({
        title: 'Error',
        description: 'No project or module selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/project/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          moduleId,
          assetType: 'traffic_chp_cad_incident',
          assetId: incidentId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Incident added to project successfully',
        });
        if (onModuleUpdate) onModuleUpdate();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to add incident to project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding incident to project:', error);
      toast({
        title: 'Error',
        description: 'Failed to add incident to project',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    return <Badge className={colorClass}>{status}</Badge>;
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.county?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || incident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Incident
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Incident ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>County</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No incidents found
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-mono text-xs">
                    {incident.incidentId}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{incident.type}</div>
                    {incident.subtype && (
                      <div className="text-xs text-gray-500">
                        {incident.subtype}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {incident.location}
                  </TableCell>
                  <TableCell>{incident.county}</TableCell>
                  <TableCell>{getStatusBadge(incident.status)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(incident.reportedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(incident)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {projectId && moduleId && (
                          <DropdownMenuItem
                            onClick={() => handleAddToProject(incident.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Project
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(incident.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Incident' : 'Create New Incident'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incidentId">Incident ID *</Label>
                <Input
                  id="incidentId"
                  value={formData.incidentId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, incidentId: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Input
                  id="type"
                  value={formData.type || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={formData.county || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, county: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  value={formData.priority || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chpUnit">CHP Unit</Label>
                <Input
                  id="chpUnit"
                  value={formData.chpUnit || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, chpUnit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logText">Log Text</Label>
                <Input
                  id="logText"
                  value={formData.logText || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, logText: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportedAt">Reported At *</Label>
                <Input
                  id="reportedAt"
                  type="datetime-local"
                  value={
                    formData.reportedAt
                      ? new Date(formData.reportedAt).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, reportedAt: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clearedAt">Cleared At</Label>
                <Input
                  id="clearedAt"
                  type="datetime-local"
                  value={
                    formData.clearedAt
                      ? new Date(formData.clearedAt).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, clearedAt: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingId(null);
                  setFormData({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}