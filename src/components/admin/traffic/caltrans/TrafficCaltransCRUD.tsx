// components/admin/traffic/caltrans/TrafficCaltransCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Route,
  MoreHorizontal,
  MapPin
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

interface CaltransClosure {
  id: number;
  closureId: string;
  route: string;
  direction: string;
  location: string;
  description: string | null;
  closureType: string;
  status: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrafficCaltransCRUDProps {
  onModuleUpdate?: () => void;
}

export function TrafficCaltransCRUD({ onModuleUpdate }: TrafficCaltransCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [closures, setClosures] = useState<CaltransClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClosure, setEditingClosure] = useState<CaltransClosure | null>(null);
  const [formData, setFormData] = useState({
    closureId: '',
    route: '',
    direction: 'northbound',
    location: '',
    description: '',
    closureType: 'lane_closure',
    status: 'active',
    severity: 'moderate',
    latitude: 37.7749,
    longitude: -122.4194,
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchClosures();
  }, []);

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
    if (!formData.closureId || !formData.route || !formData.location) {
      showToast('Closure ID, route, and location are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/caltrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closureId: formData.closureId,
          route: formData.route,
          direction: formData.direction,
          location: formData.location,
          description: formData.description || null,
          closureType: formData.closureType,
          status: formData.status,
          severity: formData.severity,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Closure created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          closureId: '',
          route: '',
          direction: 'northbound',
          location: '',
          description: '',
          closureType: 'lane_closure',
          status: 'active',
          severity: 'moderate',
          latitude: 37.7749,
          longitude: -122.4194,
          startDate: '',
          endDate: '',
          isActive: true,
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
        body: JSON.stringify({
          closureId: formData.closureId,
          route: formData.route,
          direction: formData.direction,
          location: formData.location,
          description: formData.description || null,
          closureType: formData.closureType,
          status: formData.status,
          severity: formData.severity,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          isActive: formData.isActive,
        }),
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

  const renderActions = (closure: CaltransClosure) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewClosureDetails(closure)}
      >
        <Route className="w-4 h-4" />
      </Button>
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
            <DropdownMenuItem onClick={() => {
              window.open(
                `https://www.google.com/maps?q=${closure.latitude},${closure.longitude}`,
                '_blank'
              );
            }}>
              <MapPin className="w-4 h-4 mr-2" />
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
  );

  const viewClosureDetails = (closure: CaltransClosure) => {
    showToast(
      `${closure.closureId} - ${closure.route} ${closure.direction}`,
      'info'
    );
  };

  const openEditDialog = (closure: CaltransClosure) => {
    setEditingClosure(closure);
    setFormData({
      closureId: closure.closureId,
      route: closure.route,
      direction: closure.direction || 'northbound',
      location: closure.location,
      description: closure.description || '',
      closureType: closure.closureType || 'lane_closure',
      status: closure.status || 'active',
      severity: closure.severity || 'moderate',
      latitude: closure.latitude || 37.7749,
      longitude: closure.longitude || -122.4194,
      startDate: closure.startDate || '',
      endDate: closure.endDate || '',
      isActive: closure.isActive !== false,
    });
  };

  const getClosureTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      lane_closure: 'Lane Closure',
      road_closure: 'Road Closure',
      ramp_closure: 'Ramp Closure',
      shoulder_closure: 'Shoulder Closure',
      construction: 'Construction',
      accident: 'Accident',
    };
    return types[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
          <Route className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Caltrans Closures</span>
          <Badge variant="secondary" className="text-xs">
            {closures.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Closure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Caltrans Closure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="closureId">Closure ID *</Label>
                <Input
                  id="closureId"
                  placeholder="e.g., CAL-2024-001"
                  value={formData.closureId}
                  onChange={(e) => setFormData({ ...formData, closureId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="route">Route *</Label>
                <Input
                  id="route"
                  placeholder="e.g., I-80"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="direction">Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value) => setFormData({ ...formData, direction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="northbound">Northbound</SelectItem>
                    <SelectItem value="southbound">Southbound</SelectItem>
                    <SelectItem value="eastbound">Eastbound</SelectItem>
                    <SelectItem value="westbound">Westbound</SelectItem>
                    <SelectItem value="both">Both Directions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Mile marker 12.5"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Closure description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="closureType">Closure Type</Label>
                <Select
                  value={formData.closureType}
                  onValueChange={(value) => setFormData({ ...formData, closureType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select closure type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lane_closure">Lane Closure</SelectItem>
                    <SelectItem value="road_closure">Road Closure</SelectItem>
                    <SelectItem value="ramp_closure">Ramp Closure</SelectItem>
                    <SelectItem value="shoulder_closure">Shoulder Closure</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="37.7749"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="-122.4194"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive">Active</Label>
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

      {closures.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Route className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No closures yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first closure
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Closure ID</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Route</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closures.map((closure) => (
                <TableRow key={closure.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    {closure.closureId}
                    {closure.severity && (
                      <Badge className={`ml-2 text-[10px] ${getSeverityColor(closure.severity)}`}>
                        {closure.severity.charAt(0).toUpperCase() + closure.severity.slice(1)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {closure.route} {closure.direction}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {getClosureTypeLabel(closure.closureType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      {closure.status === 'active' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : closure.status === 'cleared' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs capitalize">
                        {closure.status || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-right">
                    {renderActions(closure)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editingClosure} onOpenChange={(open) => !open && setEditingClosure(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Closure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
              <Select
                value={formData.direction}
                onValueChange={(value) => setFormData({ ...formData, direction: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="northbound">Northbound</SelectItem>
                  <SelectItem value="southbound">Southbound</SelectItem>
                  <SelectItem value="eastbound">Eastbound</SelectItem>
                  <SelectItem value="westbound">Westbound</SelectItem>
                  <SelectItem value="both">Both Directions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
              <Label htmlFor="edit-closureType">Closure Type</Label>
              <Select
                value={formData.closureType}
                onValueChange={(value) => setFormData({ ...formData, closureType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select closure type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lane_closure">Lane Closure</SelectItem>
                  <SelectItem value="road_closure">Road Closure</SelectItem>
                  <SelectItem value="ramp_closure">Ramp Closure</SelectItem>
                  <SelectItem value="shoulder_closure">Shoulder Closure</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
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