// components/admin/traffic/chp-cad/TrafficCHPCADCRUD.tsx - Fixed with correct schema fields
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
  ExternalLink,
  X,
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
import { useToast } from '@/components/ui/toast';

// ✅ Match the schema exactly
interface Incident {
  id: number;
  sourceId: string;           // ✅ This is the unique identifier (was incidentId)
  trafficId: number | null;
  centerId: number | null;
  incidentType: string | null;
  location: string | null;
  city: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  logTime: string | null;
  details: string | null;
  status: string;
  fetchedAt: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
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
    sourceId: '',              // ✅ Changed from incidentId
    incidentType: 'traffic_collision',
    location: '',
    city: '',
    county: '',
    details: '',
    status: 'active',
    latitude: 37.7749,
    longitude: -122.4194,
    logTime: '',
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/traffic/chp-cad');
      const data = await response.json();
      
      console.log('📦 Raw API response for incidents:', data);
      
      if (data.success) {
        // ✅ Map the data to match our interface
        const mappedIncidents = (data.data || []).map((incident: any) => ({
          ...incident,
          sourceId: incident.sourceId || incident.source_id || `CHP-${incident.id}`,
          latitude: incident.latitude ? parseFloat(incident.latitude) : null,
          longitude: incident.longitude ? parseFloat(incident.longitude) : null,
        }));
        setIncidents(mappedIncidents);
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
    // ✅ Validate required fields
    if (!formData.sourceId) {
      showToast('Source ID is required', 'error');
      return;
    }
    if (!formData.location && !formData.city) {
      showToast('Location or City is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ Match the schema exactly
      const payload = {
        sourceId: formData.sourceId,
        incidentType: formData.incidentType,
        location: formData.location || null,
        city: formData.city || null,
        county: formData.county || null,
        details: formData.details || null,
        status: formData.status,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        logTime: formData.logTime || null,
      };

      console.log('📝 Creating incident with payload:', payload);

      const response = await fetch('/api/traffic/chp-cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📝 Create response:', data);
      
      if (data.success) {
        showToast('Incident created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          sourceId: '',
          incidentType: 'traffic_collision',
          location: '',
          city: '',
          county: '',
          details: '',
          status: 'active',
          latitude: 37.7749,
          longitude: -122.4194,
          logTime: '',
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
      const payload = {
        sourceId: formData.sourceId,
        incidentType: formData.incidentType,
        location: formData.location || null,
        city: formData.city || null,
        county: formData.county || null,
        details: formData.details || null,
        status: formData.status,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        logTime: formData.logTime || null,
      };

      console.log('📝 Updating incident with payload:', payload);

      const response = await fetch(`/api/traffic/chp-cad?id=${editingIncident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    const location = incident.location || incident.city || 'Unknown location';
    showToast(
      `${incident.sourceId} - ${location}`,
      'info'
    );
  };

  const openEditDialog = (incident: Incident) => {
    setEditingIncident(incident);
    setFormData({
      sourceId: incident.sourceId || '',
      incidentType: incident.incidentType || 'traffic_collision',
      location: incident.location || '',
      city: incident.city || '',
      county: incident.county || '',
      details: incident.details || '',
      status: incident.status || 'active',
      latitude: incident.latitude || 37.7749,
      longitude: incident.longitude || -122.4194,
      logTime: incident.logTime ? new Date(incident.logTime).toISOString().slice(0, 16) : '',
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
    if (!type) return 'Other';
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-500" />
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
                <Label htmlFor="sourceId">Source ID *</Label>
                <Input
                  id="sourceId"
                  placeholder="e.g., TEST-CHP-INCIDENT-001"
                  value={formData.sourceId}
                  onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique identifier for this incident (e.g., TEST-CHP-INCIDENT-001)
                </p>
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., I-80 near Berkeley"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Berkeley"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    placeholder="e.g., Alameda"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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
                <div>
                  <Label htmlFor="logTime">Log Time</Label>
                  <Input
                    id="logTime"
                    type="datetime-local"
                    value={formData.logTime}
                    onChange={(e) => setFormData({ ...formData, logTime: e.target.value })}
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
          <p>No incidents yet</p>
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
              <TableHead>Source ID</TableHead>
              <TableHead className="hidden sm:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">City</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">
                  {incident.sourceId}
                  {incident.logTime && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {new Date(incident.logTime).toLocaleDateString()}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {incident.location || 'Unknown'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {incident.city || '—'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {incident.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : incident.status === 'cleared' ? (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm capitalize">
                      {incident.status || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {renderActions(incident)}
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
            <DialogTitle>Edit Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-sourceId">Source ID *</Label>
              <Input
                id="edit-sourceId"
                placeholder="e.g., TEST-CHP-INCIDENT-001"
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
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-county">County</Label>
                <Input
                  id="edit-county"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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
              <div>
                <Label htmlFor="edit-logTime">Log Time</Label>
                <Input
                  id="edit-logTime"
                  type="datetime-local"
                  value={formData.logTime}
                  onChange={(e) => setFormData({ ...formData, logTime: e.target.value })}
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
                  placeholder="37.7749"
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
                  placeholder="-122.4194"
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