// components/admin/traffic/chp-cad/TrafficCHPCADCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  AlertTriangle,
  MoreHorizontal,
  MapPin,
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
import { useToast } from '@/components/ui/toast';
import { useSession } from 'next-auth/react';

interface CHPCADIncident {
  id: number;
  userId: string;
  incidentId: string;
  type: string;
  location: string;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
  logTime: string;
  createdAt: string;
  updatedAt: string;
}

interface TrafficCHPCADCRUDProps {
  onModuleUpdate?: () => void;
}

export function TrafficCHPCADCRUD({ onModuleUpdate }: TrafficCHPCADCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<CHPCADIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIncident, setEditingIncident] = useState<CHPCADIncident | null>(null);
  const [formData, setFormData] = useState({
    incidentId: '',
    type: '',
    location: '',
    description: '',
    severity: 'medium',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchIncidents();
    }
  }, [session]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      // ✅ No userId parameter needed - API uses session
      const response = await fetch('/api/traffic/chp-cad');
      const data = await response.json();
      if (data.success) {
        setIncidents(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch CHP-CAD incidents', 'error');
      }
    } catch (error) {
      console.error('Error fetching CHP-CAD incidents:', error);
      showToast('Failed to fetch CHP-CAD incidents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.incidentId || !formData.location) {
      showToast('Incident ID and location are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/chp-cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: formData.incidentId,
          type: formData.type,
          location: formData.location,
          description: formData.description,
          severity: formData.severity,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP-CAD incident created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          incidentId: '',
          type: '',
          location: '',
          description: '',
          severity: 'medium',
          latitude: '',
          longitude: '',
        });
        await fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create CHP-CAD incident', 'error');
      }
    } catch (error) {
      console.error('Error creating CHP-CAD incident:', error);
      showToast('Failed to create CHP-CAD incident', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingIncident) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/traffic/chp-cad?id=${editingIncident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: formData.incidentId,
          type: formData.type,
          location: formData.location,
          description: formData.description,
          severity: formData.severity,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP-CAD incident updated successfully', 'success');
        setEditingIncident(null);
        await fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update CHP-CAD incident', 'error');
      }
    } catch (error) {
      console.error('Error updating CHP-CAD incident:', error);
      showToast('Failed to update CHP-CAD incident', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, incidentId: string) => {
    if (!confirm(`Delete CHP-CAD incident "${incidentId}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/chp-cad?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP-CAD incident deleted successfully', 'success');
        await fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete CHP-CAD incident', 'error');
      }
    } catch (error) {
      console.error('Error deleting CHP-CAD incident:', error);
      showToast('Failed to delete CHP-CAD incident', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openEditDialog = (incident: CHPCADIncident) => {
    setEditingIncident(incident);
    setFormData({
      incidentId: incident.incidentId,
      type: incident.type || '',
      location: incident.location || '',
      description: incident.description || '',
      severity: incident.severity || 'medium',
      latitude: incident.latitude?.toString() || '',
      longitude: incident.longitude?.toString() || '',
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
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-semibold">CHP-CAD Incidents</h3>
          <Badge variant="secondary" className="ml-2">
            {incidents.length} {incidents.length === 1 ? 'incident' : 'incidents'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New CHP-CAD Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="incidentId">Incident ID *</Label>
                <Input
                  id="incidentId"
                  placeholder="e.g., CHP-12345"
                  value={formData.incidentId}
                  onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  placeholder="e.g., Collision, Traffic Stop"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Highway 101, Mile Marker 42"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Incident details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Incident'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Incidents Table */}
      {incidents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No CHP-CAD incidents yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first incident
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Incident ID</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="text-center">Severity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    {incident.incidentId}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {incident.type || '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {incident.location || '—'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={
                      incident.severity === 'critical' ? 'destructive' :
                      incident.severity === 'high' ? 'default' :
                      incident.severity === 'medium' ? 'secondary' :
                      'outline'
                    }
                  >
                    {incident.severity || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(incident)}
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
                        {incident.latitude && incident.longitude && (
                          <DropdownMenuItem 
                            onClick={() => window.open(`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Map
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(incident.id, incident.incidentId)}
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
      <Dialog open={!!editingIncident} onOpenChange={(open) => !open && setEditingIncident(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit CHP-CAD Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-incidentId">Incident ID *</Label>
              <Input
                id="edit-incidentId"
                value={formData.incidentId}
                onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Input
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={isSubmitting}
              />
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
              <Label htmlFor="edit-severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
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