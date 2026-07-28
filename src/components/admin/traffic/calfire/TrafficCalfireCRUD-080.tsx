// components/admin/traffic/calfire/TrafficCalfireCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Flame,
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

interface CalfireIncident {
  id: number;
  incidentId: string;
  name: string;
  description: string | null;
  incidentType: string;
  status: string;
  severity: string;
  location: string;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  acresBurned: number | null;
  containment: number | null;
  reportedDate: string | null;
  updatedDate: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrafficCalfireCRUDProps {
  onModuleUpdate?: () => void;
}

export function TrafficCalfireCRUD({ onModuleUpdate }: TrafficCalfireCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [incidents, setIncidents] = useState<CalfireIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIncident, setEditingIncident] = useState<CalfireIncident | null>(null);
  const [formData, setFormData] = useState({
    incidentId: '',
    name: '',
    description: '',
    incidentType: 'wildfire',
    status: 'active',
    severity: 'moderate',
    location: '',
    county: '',
    latitude: 37.7749,
    longitude: -122.4194,
    acresBurned: 0,
    containment: 0,
    reportedDate: '',
    updatedDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/traffic/calfire');
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
    if (!formData.incidentId || !formData.name || !formData.location) {
      showToast('Incident ID, name, and location are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/calfire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: formData.incidentId,
          name: formData.name,
          description: formData.description || null,
          incidentType: formData.incidentType,
          status: formData.status,
          severity: formData.severity,
          location: formData.location,
          county: formData.county || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          acresBurned: formData.acresBurned || null,
          containment: formData.containment || null,
          reportedDate: formData.reportedDate || null,
          updatedDate: formData.updatedDate || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Incident created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          incidentId: '',
          name: '',
          description: '',
          incidentType: 'wildfire',
          status: 'active',
          severity: 'moderate',
          location: '',
          county: '',
          latitude: 37.7749,
          longitude: -122.4194,
          acresBurned: 0,
          containment: 0,
          reportedDate: '',
          updatedDate: '',
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
      const response = await fetch(`/api/traffic/calfire?id=${editingIncident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: formData.incidentId,
          name: formData.name,
          description: formData.description || null,
          incidentType: formData.incidentType,
          status: formData.status,
          severity: formData.severity,
          location: formData.location,
          county: formData.county || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          acresBurned: formData.acresBurned || null,
          containment: formData.containment || null,
          reportedDate: formData.reportedDate || null,
          updatedDate: formData.updatedDate || null,
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

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete incident "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/calfire?id=${id}`, {
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

  const renderActions = (incident: CalfireIncident) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewIncidentDetails(incident)}
      >
        <Flame className="w-4 h-4" />
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
            onClick={() => handleDelete(incident.id, incident.name)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const viewIncidentDetails = (incident: CalfireIncident) => {
    showToast(
      `${incident.name} - ${incident.location}`,
      'info'
    );
  };

  const openEditDialog = (incident: CalfireIncident) => {
    setEditingIncident(incident);
    setFormData({
      incidentId: incident.incidentId,
      name: incident.name,
      description: incident.description || '',
      incidentType: incident.incidentType || 'wildfire',
      status: incident.status || 'active',
      severity: incident.severity || 'moderate',
      location: incident.location,
      county: incident.county || '',
      latitude: incident.latitude || 37.7749,
      longitude: incident.longitude || -122.4194,
      acresBurned: incident.acresBurned || 0,
      containment: incident.containment || 0,
      reportedDate: incident.reportedDate || '',
      updatedDate: incident.updatedDate || '',
      isActive: incident.isActive !== false,
    });
  };

  const getIncidentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      wildfire: 'Wildfire',
      brush: 'Brush Fire',
      structure: 'Structure Fire',
      vehicle: 'Vehicle Fire',
      other: 'Other',
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
          <Flame className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">CalFire Incidents</span>
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
              <DialogTitle>Create New CalFire Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="incidentId">Incident ID *</Label>
                <Input
                  id="incidentId"
                  placeholder="e.g., CAL-2024-001"
                  value={formData.incidentId}
                  onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="name">Incident Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Oak Fire"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Incident description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
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
                    <SelectItem value="wildfire">Wildfire</SelectItem>
                    <SelectItem value="brush">Brush Fire</SelectItem>
                    <SelectItem value="structure">Structure Fire</SelectItem>
                    <SelectItem value="vehicle">Vehicle Fire</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Sierra Nevada Foothills"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  placeholder="e.g., Placer"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
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
                      <SelectItem value="contained">Contained</SelectItem>
                      <SelectItem value="controlled">Controlled</SelectItem>
                      <SelectItem value="extinguished">Extinguished</SelectItem>
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
                  <Label htmlFor="acresBurned">Acres Burned</Label>
                  <Input
                    id="acresBurned"
                    type="number"
                    placeholder="0"
                    value={formData.acresBurned}
                    onChange={(e) => setFormData({ ...formData, acresBurned: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="containment">Containment %</Label>
                  <Input
                    id="containment"
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={formData.containment}
                    onChange={(e) => setFormData({ ...formData, containment: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportedDate">Reported Date</Label>
                  <Input
                    id="reportedDate"
                    type="datetime-local"
                    value={formData.reportedDate}
                    onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="updatedDate">Updated Date</Label>
                  <Input
                    id="updatedDate"
                    type="datetime-local"
                    value={formData.updatedDate}
                    onChange={(e) => setFormData({ ...formData, updatedDate: e.target.value })}
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
                  'Create Incident'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                <TableHead className="text-xs py-1">Name</TableHead>
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
                    {incident.name}
                    {incident.severity && (
                      <Badge className={`ml-2 text-[10px] ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </Badge>
                    )}
                    {incident.containment !== null && incident.containment > 0 && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {incident.containment}% Contained
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {incident.location}
                    {incident.county && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({incident.county})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {getIncidentTypeLabel(incident.incidentType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      {incident.status === 'active' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                      ) : incident.status === 'contained' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-yellow-500" />
                      ) : incident.status === 'controlled' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
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
              <Label htmlFor="edit-incidentId">Incident ID *</Label>
              <Input
                id="edit-incidentId"
                value={formData.incidentId}
                onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Incident Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label htmlFor="edit-incidentType">Incident Type</Label>
              <Select
                value={formData.incidentType}
                onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wildfire">Wildfire</SelectItem>
                  <SelectItem value="brush">Brush Fire</SelectItem>
                  <SelectItem value="structure">Structure Fire</SelectItem>
                  <SelectItem value="vehicle">Vehicle Fire</SelectItem>
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
              <Label htmlFor="edit-county">County</Label>
              <Input
                id="edit-county"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
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
                    <SelectItem value="contained">Contained</SelectItem>
                    <SelectItem value="controlled">Controlled</SelectItem>
                    <SelectItem value="extinguished">Extinguished</SelectItem>
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
                <Label htmlFor="edit-acresBurned">Acres Burned</Label>
                <Input
                  id="edit-acresBurned"
                  type="number"
                  value={formData.acresBurned}
                  onChange={(e) => setFormData({ ...formData, acresBurned: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-containment">Containment %</Label>
                <Input
                  id="edit-containment"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.containment}
                  onChange={(e) => setFormData({ ...formData, containment: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-reportedDate">Reported Date</Label>
                <Input
                  id="edit-reportedDate"
                  type="datetime-local"
                  value={formData.reportedDate}
                  onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-updatedDate">Updated Date</Label>
                <Input
                  id="edit-updatedDate"
                  type="datetime-local"
                  value={formData.updatedDate}
                  onChange={(e) => setFormData({ ...formData, updatedDate: e.target.value })}
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