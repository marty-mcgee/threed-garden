// components/admin/traffic/calfire/TrafficCalfireCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Flame,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  AlertTriangle,
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
interface TrafficCalfireCRUDProps {
  userId: string;
  moduleId?: number;
  onModuleUpdate?: () => void;
}

interface Incident {
  id: number;
  incidentId: string;
  sourceId: string;
  title: string;
  description: string | null;
  incidentType: string;
  status: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  county: string | null;
  acreage: number | null;
  containment: number | null;
  cause: string | null;
  fireType: string | null;
  evacuations: any;
  reportedAt: string;
  containedAt: string | null;
  lastUpdated: string;
  rawData: any;
  notes: string | null;
  isActive: boolean;
  isPublic: boolean;
  severity: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  incidentId: string;
  sourceId: string;
  title: string;
  description: string;
  incidentType: string;
  status: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  county: string;
  acreage: string;
  containment: string;
  cause: string;
  fireType: string;
  evacuations: string;
  reportedAt: string;
  containedAt: string;
  notes: string;
  isActive: boolean;
  isPublic: boolean;
  severity: number;
}

// ✅ Options
const INCIDENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'contained', label: 'Contained' },
  { value: 'pending', label: 'Pending' },
  { value: 'unknown', label: 'Unknown' },
];

const FIRE_TYPE_OPTIONS = [
  { value: 'wildfire', label: 'Wildfire' },
  { value: 'prescribed_burn', label: 'Prescribed Burn' },
  { value: 'structure_fire', label: 'Structure Fire' },
  { value: 'vegetation_fire', label: 'Vegetation Fire' },
  { value: 'other', label: 'Other' },
];

const CAUSE_OPTIONS = [
  { value: 'lightning', label: 'Lightning' },
  { value: 'human', label: 'Human Caused' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'arson', label: 'Arson' },
  { value: 'unknown', label: 'Unknown' },
];

// ✅ Helper to get label from value
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

// ✅ Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-red-100 text-red-700';
    case 'contained': return 'bg-yellow-100 text-yellow-700';
    case 'cleared': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-blue-100 text-blue-700';
    case 'unknown': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

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

const getActiveStatusColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
};

export function TrafficCalfireCRUD({ userId, moduleId, onModuleUpdate }: TrafficCalfireCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    incidentId: '',
    sourceId: '',
    title: '',
    description: '',
    incidentType: '',
    status: 'active',
    location: '',
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    county: '',
    acreage: '',
    containment: '',
    cause: '',
    fireType: '',
    evacuations: '',
    reportedAt: '',
    containedAt: '',
    notes: '',
    isActive: true,
    isPublic: true,
    severity: 1,
  });

  // ✅ Fetch incidents
  useEffect(() => {
    fetchIncidents();
  }, [filterStatus, filterActive, filterSeverity]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);

      const response = await fetch(`/api/traffic/calfire?${params.toString()}`);
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

  // ✅ Get unique counties for filter
  const counties = Array.from(new Set(incidents.map(i => i.county).filter(Boolean)));

  const filteredIncidents = incidents.filter((incident) =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (incident.incidentId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (incident.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (incident.county?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.incidentId) {
      showToast('Incident ID is required', 'error');
      return;
    }
    if (!formData.sourceId) {
      showToast('Source ID is required', 'error');
      return;
    }
    if (!formData.title) {
      showToast('Title is required', 'error');
      return;
    }
    if (!formData.reportedAt) {
      showToast('Reported date is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        acreage: formData.acreage || null,
        containment: formData.containment || null,
        evacuations: formData.evacuations ? JSON.parse(formData.evacuations) : null,
        lastUpdated: new Date().toISOString(),
      };

      const response = await fetch('/api/traffic/calfire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CalFire incident created successfully', 'success');
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
      showToast('Incident ID is required', 'error');
      return;
    }
    if (!formData.sourceId) {
      showToast('Source ID is required', 'error');
      return;
    }
    if (!formData.title) {
      showToast('Title is required', 'error');
      return;
    }
    if (!formData.reportedAt) {
      showToast('Reported date is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        acreage: formData.acreage || null,
        containment: formData.containment || null,
        evacuations: formData.evacuations ? JSON.parse(formData.evacuations) : null,
        lastUpdated: new Date().toISOString(),
      };

      const response = await fetch(`/api/traffic/calfire?id=${editingIncident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CalFire incident updated successfully', 'success');
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
    if (!confirm(`Delete CalFire incident "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/calfire?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('CalFire incident deleted successfully', 'success');
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
      const response = await fetch(`/api/traffic/calfire?id=${id}`, {
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
      incidentType: '',
      status: 'active',
      location: '',
      latitude: null,
      longitude: null,
      address: '',
      city: '',
      county: '',
      acreage: '',
      containment: '',
      cause: '',
      fireType: '',
      evacuations: '',
      reportedAt: '',
      containedAt: '',
      notes: '',
      isActive: true,
      isPublic: true,
      severity: 1,
    });
  };

  const openEditDialog = (incident: Incident) => {
    setEditingIncident(incident);
    setFormData({
      incidentId: incident.incidentId || '',
      sourceId: incident.sourceId || '',
      title: incident.title,
      description: incident.description || '',
      incidentType: incident.incidentType || '',
      status: incident.status || 'active',
      location: incident.location || '',
      latitude: incident.latitude,
      longitude: incident.longitude,
      address: incident.address || '',
      city: incident.city || '',
      county: incident.county || '',
      acreage: incident.acreage ? String(incident.acreage) : '',
      containment: incident.containment ? String(incident.containment) : '',
      cause: incident.cause || '',
      fireType: incident.fireType || '',
      evacuations: incident.evacuations ? JSON.stringify(incident.evacuations) : '',
      reportedAt: incident.reportedAt ? new Date(incident.reportedAt).toISOString().split('T')[0] : '',
      containedAt: incident.containedAt ? new Date(incident.containedAt).toISOString().split('T')[0] : '',
      notes: incident.notes || '',
      isActive: incident.isActive ?? true,
      isPublic: incident.isPublic ?? true,
      severity: incident.severity || 1,
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
                ID: {incident.incidentId}
              </span>
            </DropdownMenuItem>
          )}
          {incident.acreage && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Acres: {incident.acreage.toLocaleString()}
              </span>
            </DropdownMenuItem>
          )}
          {incident.containment !== null && incident.containment !== undefined && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Contained: {incident.containment}%
              </span>
            </DropdownMenuItem>
          )}
          {incident.county && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {incident.county}
              </span>
            </DropdownMenuItem>
          )}
          {incident.reportedAt && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Reported: {new Date(incident.reportedAt).toLocaleDateString()}
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
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">CalFire Incidents</span>
          <Badge variant="secondary" className="text-xs">
            {filteredIncidents.length}
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
              <DialogTitle>Create CalFire Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="incidentId">Incident ID *</Label>
                <Input
                  id="incidentId"
                  placeholder="e.g., CA-2024-001"
                  value={formData.incidentId}
                  onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sourceId">Source ID *</Label>
                <Input
                  id="sourceId"
                  placeholder="e.g., SRC-001"
                  value={formData.sourceId}
                  onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Oak Fire"
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
                  <Label htmlFor="incidentType">Incident Type</Label>
                  <Select
                    value={formData.incidentType}
                    onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wildfire">Wildfire</SelectItem>
                      <SelectItem value="prescribed_burn">Prescribed Burn</SelectItem>
                      <SelectItem value="structure_fire">Structure Fire</SelectItem>
                      <SelectItem value="vegetation_fire">Vegetation Fire</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fireType">Fire Type</Label>
                  <Select
                    value={formData.fireType}
                    onValueChange={(value) => setFormData({ ...formData, fireType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fire type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIRE_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                      {INCIDENT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="grid grid-cols-2 gap-2">
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

              {/* Fire Details */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Fire Details</Label>
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Acreage"
                      type="number"
                      value={formData.acreage}
                      onChange={(e) => setFormData({ ...formData, acreage: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Containment %"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.containment}
                      onChange={(e) => setFormData({ ...formData, containment: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cause">Cause</Label>
                    <Select
                      value={formData.cause}
                      onValueChange={(value) => setFormData({ ...formData, cause: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cause" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAUSE_OPTIONS.map((cause) => (
                          <SelectItem key={cause.value} value={cause.value}>
                            {cause.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Evacuations (JSON format)"
                    value={formData.evacuations}
                    onChange={(e) => setFormData({ ...formData, evacuations: e.target.value })}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Dates</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="reportedAt">Reported Date *</Label>
                    <Input
                      id="reportedAt"
                      type="date"
                      value={formData.reportedAt}
                      onChange={(e) => setFormData({ ...formData, reportedAt: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="containedAt">Contained Date</Label>
                    <Input
                      id="containedAt"
                      type="date"
                      value={formData.containedAt}
                      onChange={(e) => setFormData({ ...formData, containedAt: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
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
            placeholder="Search by title, ID, county..."
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
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1">S1</SelectItem>
            <SelectItem value="2">S2</SelectItem>
            <SelectItem value="3">S3</SelectItem>
            <SelectItem value="4">S4</SelectItem>
            <SelectItem value="5">S5</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Active" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterStatus('all');
            setFilterSeverity('all');
            setFilterActive('all');
            fetchIncidents();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Incidents Table */}
      {filteredIncidents.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No CalFire incidents found</p>
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
                <TableHead className="text-xs py-1">Title</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Status</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Severity</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Acres</TableHead>
                <TableHead className="hidden xl:table-cell text-xs py-1">Containment</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {incident.title}
                      {incident.county && (
                        <span className="text-[10px] text-muted-foreground hidden xl:inline">
                          ({incident.county})
                        </span>
                      )}
                      {!incident.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getStatusColor(incident.status)}`}>
                      {getOptionLabel(INCIDENT_STATUS_OPTIONS, incident.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getSeverityColor(incident.severity)}`}>
                      S{incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {incident.acreage ? incident.acreage.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-1 text-sm text-muted-foreground">
                    {incident.containment !== null && incident.containment !== undefined 
                      ? `${incident.containment}%` 
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getActiveStatusColor(incident.isActive)}`}>
                      {incident.isActive ? 'Active' : 'Inactive'}
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
            <DialogTitle>Edit CalFire Incident</DialogTitle>
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
              <Label htmlFor="edit-sourceId">Source ID *</Label>
              <Input
                id="edit-sourceId"
                value={formData.sourceId}
                onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-title">Title *</Label>
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
                <Label htmlFor="edit-incidentType">Incident Type</Label>
                <Select
                  value={formData.incidentType}
                  onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wildfire">Wildfire</SelectItem>
                    <SelectItem value="prescribed_burn">Prescribed Burn</SelectItem>
                    <SelectItem value="structure_fire">Structure Fire</SelectItem>
                    <SelectItem value="vegetation_fire">Vegetation Fire</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-fireType">Fire Type</Label>
                <Select
                  value={formData.fireType}
                  onValueChange={(value) => setFormData({ ...formData, fireType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fire type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIRE_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    {INCIDENT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <div className="grid grid-cols-2 gap-2">
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

            {/* Fire Details */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Fire Details</Label>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Acreage"
                    type="number"
                    value={formData.acreage}
                    onChange={(e) => setFormData({ ...formData, acreage: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Containment %"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.containment}
                    onChange={(e) => setFormData({ ...formData, containment: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cause">Cause</Label>
                  <Select
                    value={formData.cause}
                    onValueChange={(value) => setFormData({ ...formData, cause: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAUSE_OPTIONS.map((cause) => (
                        <SelectItem key={cause.value} value={cause.value}>
                          {cause.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Evacuations (JSON format)"
                  value={formData.evacuations}
                  onChange={(e) => setFormData({ ...formData, evacuations: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Dates</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="edit-reportedAt">Reported Date *</Label>
                  <Input
                    id="edit-reportedAt"
                    type="date"
                    value={formData.reportedAt}
                    onChange={(e) => setFormData({ ...formData, reportedAt: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-containedAt">Contained Date</Label>
                  <Input
                    id="edit-containedAt"
                    type="date"
                    value={formData.containedAt}
                    onChange={(e) => setFormData({ ...formData, containedAt: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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