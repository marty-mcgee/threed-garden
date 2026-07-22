// components/admin/traffic/chp-cad/TrafficCHPCADCRUD.tsx - Consistent UI

'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
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

interface Incident {
  id: number;
  sourceId: string;
  incidentType: string;
  location: string;
  details: string | null;
  severity: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrafficCHPCADCRUDProps {
  onModuleUpdate?: () => void;
}

export function TrafficCHPCADCRUD({ onModuleUpdate }: TrafficCHPCADCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [formData, setFormData] = useState({
    sourceId: '',
    incidentType: 'traffic_collision',
    location: '',
    details: '',
    severity: 'moderate',
    status: 'active',
    latitude: 37.7749,
    longitude: -122.4194,
    isActive: true,
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/traffic/chp-cad');
      const data = await response.json();
      if (data.success) {
        setIncidents(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch incidents', 'error');
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      showToast('Failed to fetch incidents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.sourceId || !formData.location) {
      showToast('Source ID and location are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/chp-cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: formData.sourceId,
          incidentType: formData.incidentType,
          location: formData.location,
          details: formData.details || null,
          severity: formData.severity,
          status: formData.status,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Incident created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          sourceId: '',
          incidentType: 'traffic_collision',
          location: '',
          details: '',
          severity: 'moderate',
          status: 'active',
          latitude: 37.7749,
          longitude: -122.4194,
          isActive: true,
        });
        await fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create incident', 'error');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      showToast('Failed to create incident', 'error');
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
          sourceId: formData.sourceId,
          incidentType: formData.incidentType,
          location: formData.location,
          details: formData.details || null,
          severity: formData.severity,
          status: formData.status,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Incident updated successfully', 'success');
        setEditingIncident(null);
        await fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update incident', 'error');
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      showToast('Failed to update incident', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, sourceId: string) => {
    if (!confirm(`Delete incident "${sourceId}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/chp-cad?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Incident deleted successfully', 'success');
        await fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete incident', 'error');
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      showToast('Failed to delete incident', 'error');
    }
  };

  const renderActions = (incident: Incident) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewIncidentDetails(incident)}
      >
        <AlertTriangle className="w-4 h-4" />
      </Button>
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
            <DropdownMenuItem onClick={() => {
              window.open(
                `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`,
                '_blank'
              );
            }}>
              <MapPin className="w-4 h-4 mr-2" />
              View on Map
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(incident.id, incident.sourceId)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const viewIncidentDetails = (incident: Incident) => {
    showToast(
      `${incident.sourceId} - ${incident.location}`,
      'info'
    );
  };

  const openEditDialog = (incident: Incident) => {
    setEditingIncident(incident);
    setFormData({
      sourceId: incident.sourceId || '',
      incidentType: incident.incidentType || 'traffic_collision',
      location: incident.location || '',
      details: incident.details || '',
      severity: incident.severity || 'moderate',
      status: incident.status || 'active',
      latitude: incident.latitude || 37.7749,
      longitude: incident.longitude || -122.4194,
      isActive: incident.isActive !== false,
    });
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

  const getIncidentTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
          <AlertTriangle className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">CHP-CAD Incidents</span>
          <Badge variant="secondary" className="text-xs">
            {incidents.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="sourceId">Source ID *</Label>
                <Input
                  id="sourceId"
                  placeholder="e.g., CHP-2024-001"
                  value={formData.sourceId}
                  onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="incidentType">Incident Type</Label>
                <Select
                  value={formData.incidentType}
                  onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traffic_collision">Traffic Collision</SelectItem>
                    <SelectItem value="hazard">Hazard</SelectItem>
                    <SelectItem value="road_closure">Road Closure</SelectItem>
                    <SelectItem value="traffic_stop">Traffic Stop</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., I-80 near Berkeley"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="details">Details</Label>
                <Textarea
                  id="details"
                  placeholder="Incident details..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
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

      {incidents.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No incidents yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first incident
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Source ID</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Location</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    {incident.sourceId}
                    {incident.severity && (
                      <Badge className={`ml-2 text-[10px] ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {incident.location || 'Unknown'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {getIncidentTypeLabel(incident.incidentType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      {incident.status === 'active' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : incident.status === 'cleared' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs capitalize">
                        {incident.status || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-right">
                    {renderActions(incident)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editingIncident} onOpenChange={(open) => !open && setEditingIncident(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-sourceId">Source ID *</Label>
              <Input
                id="edit-sourceId"
                value={formData.sourceId}
                onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-incidentType">Incident Type</Label>
              <Select
                value={formData.incidentType}
                onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic_collision">Traffic Collision</SelectItem>
                  <SelectItem value="hazard">Hazard</SelectItem>
                  <SelectItem value="road_closure">Road Closure</SelectItem>
                  <SelectItem value="traffic_stop">Traffic Stop</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
              <Label htmlFor="edit-details">Details</Label>
              <Textarea
                id="edit-details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
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