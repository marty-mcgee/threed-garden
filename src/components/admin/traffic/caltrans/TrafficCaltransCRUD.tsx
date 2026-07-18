// components/admin/traffic/caltrans/TrafficCaltransCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Loader2, CheckCircle, XCircle, 
  Car, MoreHorizontal, MapPin, ExternalLink 
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
import { useSession } from 'next-auth/react';

interface Closure {
  id: number;
  userId: string;
  closureId: string;
  route: string;
  direction: string;
  description: string;
  latitude: number;
  longitude: number;
  startTimestamp: string;
  endTimestamp: string;
  status: string;
  closureType: string;
  district: string;
  createdAt: string;
  updatedAt: string;
}

interface TrafficCaltransCRUDProps {
  onModuleUpdate?: () => void;
}

export function TrafficCaltransCRUD({ onModuleUpdate }: TrafficCaltransCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const { data: session } = useSession();
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClosure, setEditingClosure] = useState<Closure | null>(null);
  const [formData, setFormData] = useState({
    closureId: '',
    route: '',
    direction: '',
    description: '',
    latitude: '',
    longitude: '',
    startTimestamp: '',
    endTimestamp: '',
    status: 'active',
    closureType: '',
    district: '',
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchClosures();
    }
  }, [session]);

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/traffic/caltrans');
      const data = await response.json();
      if (data.success) {
        setClosures(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch closures', 'error');
      }
    } catch (error) {
      console.error('Error fetching closures:', error);
      showToast('Failed to fetch closures', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.closureId || !formData.route) {
      showToast('Closure ID and route are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/caltrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans closure created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          closureId: '',
          route: '',
          direction: '',
          description: '',
          latitude: '',
          longitude: '',
          startTimestamp: '',
          endTimestamp: '',
          status: 'active',
          closureType: '',
          district: '',
        });
        await fetchClosures();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create closure', 'error');
      }
    } catch (error) {
      console.error('Error creating closure:', error);
      showToast('Failed to create closure', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingClosure) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/traffic/caltrans?id=${editingClosure.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Closure updated successfully', 'success');
        setEditingClosure(null);
        await fetchClosures();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update closure', 'error');
      }
    } catch (error) {
      console.error('Error updating closure:', error);
      showToast('Failed to update closure', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, closureId: string) => {
    if (!confirm(`Delete closure "${closureId}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/caltrans?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Closure deleted successfully', 'success');
        await fetchClosures();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete closure', 'error');
      }
    } catch (error) {
      console.error('Error deleting closure:', error);
      showToast('Failed to delete closure', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openEditDialog = (closure: Closure) => {
    setEditingClosure(closure);
    setFormData({
      closureId: closure.closureId,
      route: closure.route,
      direction: closure.direction || '',
      description: closure.description || '',
      latitude: closure.latitude?.toString() || '',
      longitude: closure.longitude?.toString() || '',
      startTimestamp: closure.startTimestamp || '',
      endTimestamp: closure.endTimestamp || '',
      status: closure.status || 'active',
      closureType: closure.closureType || '',
      district: closure.district || '',
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold">Caltrans Lane Closures</h3>
          <Badge variant="secondary" className="ml-2">
            {closures.length} {closures.length === 1 ? 'closure' : 'closures'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Closure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Caltrans Lane Closure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="closureId">Closure ID *</Label>
                <Input
                  id="closureId"
                  placeholder="e.g., CLOSURE-001"
                  value={formData.closureId}
                  onChange={(e) => setFormData({ ...formData, closureId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="route">Route *</Label>
                <Input
                  id="route"
                  placeholder="e.g., I-101, Highway 1"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="direction">Direction</Label>
                <Input
                  id="direction"
                  placeholder="e.g., Northbound, Southbound"
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Closure details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="37.7749"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="-122.4194"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTimestamp">Start Time</Label>
                  <Input
                    id="startTimestamp"
                    type="datetime-local"
                    value={formData.startTimestamp}
                    onChange={(e) => setFormData({ ...formData, startTimestamp: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="endTimestamp">End Time</Label>
                  <Input
                    id="endTimestamp"
                    type="datetime-local"
                    value={formData.endTimestamp}
                    onChange={(e) => setFormData({ ...formData, endTimestamp: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
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
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="closureType">Closure Type</Label>
                  <Input
                    id="closureType"
                    placeholder="e.g., Full, Partial"
                    value={formData.closureType}
                    onChange={(e) => setFormData({ ...formData, closureType: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="e.g., District 1"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
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
                  'Create Closure'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Closures Table */}
      {closures.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No Caltrans lane closures yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first closure
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead className="hidden sm:table-cell">Closure ID</TableHead>
              <TableHead className="hidden md:table-cell">Direction</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closures.map((closure) => (
              <TableRow key={closure.id}>
                <TableCell className="font-medium">
                  {closure.route}
                  <div className="text-xs text-muted-foreground">{closure.closureId}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {closure.closureId}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {closure.direction || '—'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={
                      closure.status === 'active' ? 'default' :
                      closure.status === 'completed' ? 'secondary' :
                      closure.status === 'scheduled' ? 'outline' :
                      'destructive'
                    }
                  >
                    {closure.status || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(closure)}
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
                        {closure.latitude && closure.longitude && (
                          <DropdownMenuItem 
                            onClick={() => window.open(`https://www.google.com/maps?q=${closure.latitude},${closure.longitude}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Map
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(closure.id, closure.closureId)}
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
      <Dialog open={!!editingClosure} onOpenChange={(open) => !open && setEditingClosure(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Caltrans Lane Closure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Same fields as create dialog, but pre-filled */}
            <div>
              <Label htmlFor="edit-closureId">Closure ID *</Label>
              <Input
                id="edit-closureId"
                value={formData.closureId}
                onChange={(e) => setFormData({ ...formData, closureId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-route">Route *</Label>
              <Input
                id="edit-route"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-direction">Direction</Label>
              <Input
                id="edit-direction"
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startTimestamp">Start Time</Label>
                <Input
                  id="edit-startTimestamp"
                  type="datetime-local"
                  value={formData.startTimestamp}
                  onChange={(e) => setFormData({ ...formData, startTimestamp: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-endTimestamp">End Time</Label>
                <Input
                  id="edit-endTimestamp"
                  type="datetime-local"
                  value={formData.endTimestamp}
                  onChange={(e) => setFormData({ ...formData, endTimestamp: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-closureType">Closure Type</Label>
                <Input
                  id="edit-closureType"
                  value={formData.closureType}
                  onChange={(e) => setFormData({ ...formData, closureType: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-district">District</Label>
              <Input
                id="edit-district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
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