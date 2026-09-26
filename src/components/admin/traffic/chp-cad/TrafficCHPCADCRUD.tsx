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
  Search,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Building2,
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

// ✅ Types
interface TrafficCHPCADCRUDProps {
  moduleId?: number;
  onModuleUpdate?: () => void;
}

interface Center {
  id: number;
  centerId: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
}

interface Incident {
  id: number;
  incidentId: string;
  sourceId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  severity: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  chpDivision: string | null;
  chpOffice: string | null;
  centerId: number | null;
  logNumber: string | null;
  reportedAt: string;
  clearedAt: string | null;
  lastUpdated: string;
  units: any[];
  rawData: any;
  notes: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  incidentId: string;
  sourceId: string;
  title: string;
  description: string;
  type: string;
  status: string;
  severity: number;
  location: string;
  city: string;
  county: string;
  zipCode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  chpDivision: string;
  chpOffice: string;
  centerId: number | null;
  logNumber: string;
  notes: string;
  isActive: boolean;
  isPublic: boolean;
}

// ✅ Options
const INCIDENT_TYPE_OPTIONS = [
  { value: 'traffic_collision', label: 'Traffic Collision' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'road_closed', label: 'Road Closed' },
  { value: 'fire', label: 'Fire' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
];

const INCIDENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'pending', label: 'Pending' },
  { value: 'unknown', label: 'Unknown' },
];

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
    case 'active': return 'bg-green-100 text-green-700';
    case 'cleared': return 'bg-blue-100 text-blue-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'unknown': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// ✅ Type color mapping
const getTypeColor = (type: string) => {
  switch (type) {
    case 'traffic_collision': return 'bg-red-100 text-red-700';
    case 'hazard': return 'bg-orange-100 text-orange-700';
    case 'road_closed': return 'bg-purple-100 text-purple-700';
    case 'fire': return 'bg-red-200 text-red-800';
    case 'emergency': return 'bg-pink-100 text-pink-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// ✅ Severity color mapping
const getSeverityColor = (severity: number) => {
  switch (severity) {
    case 1: return 'bg-green-100 text-green-700';
    case 2: return 'bg-yellow-100 text-yellow-700';
    case 3: return 'bg-orange-100 text-orange-700';
    case 4: return 'bg-red-100 text-red-700';
    case 5: return 'bg-red-200 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export function TrafficCHPCADCRUD({ moduleId, onModuleUpdate }: TrafficCHPCADCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    incidentId: '',
    sourceId: '',
    title: '',
    description: '',
    type: '',
    status: 'active',
    severity: 1,
    location: '',
    city: '',
    county: '',
    zipCode: '',
    address: '',
    latitude: null,
    longitude: null,
    chpDivision: '',
    chpOffice: '',
    centerId: null,
    logNumber: '',
    notes: '',
    isActive: true,
    isPublic: true,
  });

  // ✅ Fetch incidents and centers
  useEffect(() => {
    fetchIncidents();
    fetchCenters();
  }, [moduleId, filterStatus, filterType, filterSeverity]);

  const fetchCenters = async () => {
    setLoadingCenters(true);
    try {
      const response = await fetch('/api/traffic/chp-centers?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setCenters(Array.isArray(data.data) ? data.data : []);
      } else {
        console.error('Failed to fetch centers:', data.error);
        setCenters([]);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
      setCenters([]);
    } finally {
      setLoadingCenters(false);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);
      if (moduleId) params.append('moduleId', String(moduleId));

      const response = await fetch(`/api/traffic/chp-cad?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setIncidents(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch incidents', 'error');
        setIncidents([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      showToast('Failed to fetch incidents', 'error');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((incident) =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (incident.incidentId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (incident.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (incident.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // ✅ Get center name by ID
  const getCenterName = (centerId: number | null) => {
    if (!centerId) return 'None';
    const center = centers.find(c => c.id === centerId);
    return center ? center.name : `Center #${centerId}`;
  };

  const handleCreate = async () => {
    if (!formData.incidentId) {
      showToast('Incident ID (from CHP CAD) is required', 'error');
      return;
    }
    if (!formData.title) {
      showToast('Incident title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        sourceId: formData.sourceId || `src_${Date.now()}`,
        reportedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const response = await fetch('/api/traffic/chp-cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Incident created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
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
    if (!formData.incidentId) {
      showToast('Incident ID (from CHP CAD) is required', 'error');
      return;
    }
    if (!formData.title) {
      showToast('Incident title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      };

      const response = await fetch(`/api/traffic/chp-cad?id=${editingIncident.id}`, {
        method: 'PATCH',
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

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete incident "${title}"? This action cannot be undone.`)) return;

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

  const toggleActive = async (id: number, currentStatus: boolean, title: string) => {
    try {
      const response = await fetch(`/api/traffic/chp-cad?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Incident "${title}" ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        await fetchIncidents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      incidentId: '',
      sourceId: '',
      title: '',
      description: '',
      type: '',
      status: 'active',
      severity: 1,
      location: '',
      city: '',
      county: '',
      zipCode: '',
      address: '',
      latitude: null,
      longitude: null,
      chpDivision: '',
      chpOffice: '',
      centerId: null,
      logNumber: '',
      notes: '',
      isActive: true,
      isPublic: true,
    });
  };

  // ✅ Open edit dialog with form data
  const openEditDialog = (incident: Incident) => {
    setEditingIncident(incident);
    setFormData({
      incidentId: incident.incidentId || '',
      sourceId: incident.sourceId || '',
      title: incident.title,
      description: incident.description || '',
      type: incident.type || '',
      status: incident.status || 'active',
      severity: incident.severity || 1,
      location: incident.location || '',
      city: incident.city || '',
      county: incident.county || '',
      zipCode: incident.zipCode || '',
      address: incident.address || '',
      latitude: incident.latitude,
      longitude: incident.longitude,
      chpDivision: incident.chpDivision || '',
      chpOffice: incident.chpOffice || '',
      centerId: incident.centerId,
      logNumber: incident.logNumber || '',
      notes: incident.notes || '',
      isActive: incident.isActive ?? true,
      isPublic: incident.isPublic ?? true,
    });
  };

  const renderActions = (incident: Incident) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(incident)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleActive(incident.id, incident.isActive, incident.title)}
        title={incident.isActive ? 'Deactivate' : 'Activate'}
      >
        {incident.isActive ? (
          <Eye className="w-4 h-4 text-green-500" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {incident.incidentId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                CHP ID: {incident.incidentId}
              </span>
            </DropdownMenuItem>
          )}
          {incident.reportedAt && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Reported: {new Date(incident.reportedAt).toLocaleDateString()}
              </span>
            </DropdownMenuItem>
          )}
          {incident.location && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {incident.location}
              </span>
            </DropdownMenuItem>
          )}
          {incident.centerId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {getCenterName(incident.centerId)}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(incident.id, incident.title)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">CHP-CAD Incidents</span>
          <Badge variant="secondary" className="text-xs">
            {filteredIncidents.length}
          </Badge>
          {moduleId && (
            <Badge variant="outline" className="text-[10px]">
              Module #{moduleId}
            </Badge>
          )}
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
              {/* ✅ CHP CAD Incident ID (from 3rd party) - REQUIRED */}
              <div>
                <Label htmlFor="incidentId" className="flex items-center gap-1">
                  CHP CAD Incident ID *
                  <span className="text-[10px] text-muted-foreground">(from CHP CAD system)</span>
                </Label>
                <Input
                  id="incidentId"
                  placeholder="e.g., CHP-2024-001234"
                  value={formData.incidentId}
                  onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* ✅ Source ID (optional, auto-generated if not provided) */}
              <div>
                <Label htmlFor="sourceId" className="text-sm text-muted-foreground">
                  Source ID <span className="text-[10px]">(optional, auto-generated)</span>
                </Label>
                <Input
                  id="sourceId"
                  placeholder="Leave blank for auto-generation"
                  value={formData.sourceId}
                  onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* ✅ Incident Title */}
              <div>
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Multi-vehicle collision on I-80"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Incident description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
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
                      {INCIDENT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="severity">Severity (1-5)</Label>
                <Input
                  id="severity"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) || 1 })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Location */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Location</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Location description (e.g., I-80 EB mile 12.5)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="County"
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Zip Code"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude"
                      type="number"
                      step="0.0000001"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Longitude"
                      type="number"
                      step="0.0000001"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* CHP Details with Center Dropdown */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">CHP Details</Label>
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="CHP Division"
                      value={formData.chpDivision}
                      onChange={(e) => setFormData({ ...formData, chpDivision: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="CHP Office"
                      value={formData.chpOffice}
                      onChange={(e) => setFormData({ ...formData, chpOffice: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* ✅ CHP CAD Center Dropdown */}
                  <div>
                    <Label htmlFor="centerId" className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      CHP CAD Center
                    </Label>
                    <Select
                      value={formData.centerId ? String(formData.centerId) : 'none'}
                      onValueChange={(value) => {
                        setFormData({ ...formData, centerId: value === 'none' ? null : parseInt(value) });
                      }}
                      disabled={isSubmitting || loadingCenters}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingCenters ? 'Loading centers...' : 'Select a center'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {centers.map((center) => (
                          <SelectItem key={center.id} value={String(center.id)}>
                            {center.name} {center.city ? `(${center.city})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    placeholder="Log Number"
                    value={formData.logNumber}
                    onChange={(e) => setFormData({ ...formData, logNumber: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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

              {/* Visibility */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Visibility</Label>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isPublic">Public</Label>
                  </div>
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

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title, ID, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {INCIDENT_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INCIDENT_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="1">Severity 1</SelectItem>
            <SelectItem value="2">Severity 2</SelectItem>
            <SelectItem value="3">Severity 3</SelectItem>
            <SelectItem value="4">Severity 4</SelectItem>
            <SelectItem value="5">Severity 5</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterStatus('all');
            setFilterType('all');
            setFilterSeverity('all');
            fetchIncidents();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Incidents Table */}
      {filteredIncidents.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No incidents found</p>
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
                <TableHead className="text-xs py-1">CHP ID</TableHead>
                <TableHead className="text-xs py-1">Title</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Severity</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {incident.incidentId || '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {incident.status === 'active' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      ) : incident.status === 'cleared' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      {incident.title}
                      {incident.location && (
                        <span className="text-[10px] text-muted-foreground hidden xl:inline">
                          @ {incident.location}
                        </span>
                      )}
                      {!incident.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {incident.type ? (
                      <Badge className={`text-[10px] ${getTypeColor(incident.type)}`}>
                        {getOptionLabel(INCIDENT_TYPE_OPTIONS, incident.type)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getSeverityColor(incident.severity)}`}>
                      S{incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getStatusColor(incident.status)}`}>
                      {getOptionLabel(INCIDENT_STATUS_OPTIONS, incident.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(incident)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingIncident} onOpenChange={(open) => !open && setEditingIncident(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* ✅ CHP CAD Incident ID - REQUIRED (readonly in edit) */}
            <div>
              <Label htmlFor="edit-incidentId" className="flex items-center gap-1">
                CHP CAD Incident ID *
                <span className="text-[10px] text-muted-foreground">(from CHP CAD system)</span>
              </Label>
              <Input
                id="edit-incidentId"
                placeholder="e.g., CHP-2024-001234"
                value={formData.incidentId}
                onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-title">Incident Title *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
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
                    {INCIDENT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-severity">Severity (1-5)</Label>
              <Input
                id="edit-severity"
                type="number"
                min="1"
                max="5"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) || 1 })}
                disabled={isSubmitting}
              />
            </div>

            {/* Location */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Location</Label>
              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Location description"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={isSubmitting}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="County"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Zip Code"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Latitude"
                    type="number"
                    step="0.0000001"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Longitude"
                    type="number"
                    step="0.0000001"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* CHP Details with Center Dropdown */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">CHP Details</Label>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="CHP Division"
                    value={formData.chpDivision}
                    onChange={(e) => setFormData({ ...formData, chpDivision: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="CHP Office"
                    value={formData.chpOffice}
                    onChange={(e) => setFormData({ ...formData, chpOffice: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                {/* ✅ CHP CAD Center Dropdown */}
                <div>
                  <Label htmlFor="edit-centerId" className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    CHP CAD Center
                  </Label>
                  <Select
                    value={formData.centerId ? String(formData.centerId) : 'none'}
                    onValueChange={(value) => {
                      setFormData({ ...formData, centerId: value === 'none' ? null : parseInt(value) });
                    }}
                    disabled={isSubmitting || loadingCenters}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingCenters ? 'Loading centers...' : 'Select a center'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {centers.map((center) => (
                        <SelectItem key={center.id} value={String(center.id)}>
                          {center.name} {center.city ? `(${center.city})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  placeholder="Log Number"
                  value={formData.logNumber}
                  onChange={(e) => setFormData({ ...formData, logNumber: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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

            {/* Visibility */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Visibility</Label>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-isPublic">Public</Label>
                </div>
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