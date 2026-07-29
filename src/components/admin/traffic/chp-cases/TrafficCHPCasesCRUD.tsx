// components/admin/traffic/chp-cases/TrafficCHPCasesCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  FileText,
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
interface TrafficCHPCasesCRUDProps {
  // userId: string;
  // moduleId?: number;
  onModuleUpdate?: () => void;
}

interface CHPCase {
  id: number;
  caseId: string;
  sourceId: string;
  title: string;
  description: string | null;
  type: string;
  severity: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  collisionType: string | null;
  weatherCondition: string | null;
  roadCondition: string | null;
  lightCondition: string | null;
  vehiclesInvolved: number;
  injuries: number;
  fatalities: number;
  occurredAt: string;
  reportedAt: string | null;
  rawData: any;
  notes: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  caseId: string;
  sourceId: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  county: string;
  zipCode: string;
  collisionType: string;
  weatherCondition: string;
  roadCondition: string;
  lightCondition: string;
  vehiclesInvolved: string;
  injuries: string;
  fatalities: string;
  occurredAt: string;
  reportedAt: string;
  notes: string;
  isActive: boolean;
  isPublic: boolean;
}

// ✅ Options
const CASE_TYPE_OPTIONS = [
  { value: 'traffic_collision', label: 'Traffic Collision' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'road_closed', label: 'Road Closed' },
  { value: 'fire', label: 'Fire' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: '1', label: 'Severity 1 (Low)' },
  { value: '2', label: 'Severity 2 (Moderate)' },
  { value: '3', label: 'Severity 3 (High)' },
  { value: '4', label: 'Severity 4 (Severe)' },
  { value: '5', label: 'Severity 5 (Critical)' },
];

const COLLISION_TYPE_OPTIONS = [
  { value: 'head_on', label: 'Head-On' },
  { value: 'rear_end', label: 'Rear-End' },
  { value: 'side_impact', label: 'Side Impact' },
  { value: 'hit_and_run', label: 'Hit and Run' },
  { value: 'pedestrian', label: 'Pedestrian' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'other', label: 'Other' },
];

const WEATHER_CONDITION_OPTIONS = [
  { value: 'clear', label: 'Clear' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'rain', label: 'Rain' },
  { value: 'fog', label: 'Fog' },
  { value: 'snow', label: 'Snow' },
  { value: 'windy', label: 'Windy' },
];

const ROAD_CONDITION_OPTIONS = [
  { value: 'dry', label: 'Dry' },
  { value: 'wet', label: 'Wet' },
  { value: 'icy', label: 'Icy' },
  { value: 'snow_covered', label: 'Snow Covered' },
  { value: 'construction', label: 'Construction' },
];

const LIGHT_CONDITION_OPTIONS = [
  { value: 'daylight', label: 'Daylight' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'dark_street_lit', label: 'Dark - Street Lit' },
  { value: 'dark_unlit', label: 'Dark - Unlit' },
  { value: 'other', label: 'Other' },
];

// ✅ Helper to get label from value
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

// ✅ Severity color mapping (for numbers 1-5)
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

// ✅ Severity label mapping
const getSeverityLabel = (severity: number): string => {
  switch (severity) {
    case 1: return 'S1';
    case 2: return 'S2';
    case 3: return 'S3';
    case 4: return 'S4';
    case 5: return 'S5';
    default: return `S${severity}`;
  }
};

const getActiveStatusColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
};

export function TrafficCHPCasesCRUD({ onModuleUpdate }: TrafficCHPCasesCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [cases, setCases] = useState<CHPCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCase, setEditingCase] = useState<CHPCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    caseId: '',
    sourceId: '',
    title: '',
    description: '',
    type: '',
    severity: '1',
    location: '',
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    county: '',
    zipCode: '',
    collisionType: '',
    weatherCondition: '',
    roadCondition: '',
    lightCondition: '',
    vehiclesInvolved: '',
    injuries: '',
    fatalities: '',
    occurredAt: '',
    reportedAt: '',
    notes: '',
    isActive: true,
    isPublic: true,
  });

  // ✅ Fetch cases
  useEffect(() => {
    fetchCases();
  }, [filterType, filterActive, filterSeverity]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);

      const response = await fetch(`/api/traffic/chp-cases?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCases(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch cases', 'error');
        setCases([]);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      showToast('Failed to fetch cases', 'error');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get unique counties for filter
  const counties = Array.from(new Set(cases.map(c => c.county).filter(Boolean)));

  const filteredCases = cases.filter((chpCase) =>
    chpCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chpCase.caseId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (chpCase.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (chpCase.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (chpCase.county?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.caseId) {
      showToast('Case ID is required', 'error');
      return;
    }
    if (!formData.title) {
      showToast('Title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        severity: parseInt(formData.severity),
        vehiclesInvolved: parseInt(formData.vehiclesInvolved) || 1,
        injuries: parseInt(formData.injuries) || 0,
        fatalities: parseInt(formData.fatalities) || 0,
        occurredAt: formData.occurredAt || new Date().toISOString(),
      };

      const response = await fetch('/api/traffic/chp-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP case created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchCases();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create case', 'error');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      showToast('Failed to create case', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCase) return;
    if (!formData.caseId) {
      showToast('Case ID is required', 'error');
      return;
    }
    if (!formData.title) {
      showToast('Title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        severity: parseInt(formData.severity),
        vehiclesInvolved: parseInt(formData.vehiclesInvolved) || 1,
        injuries: parseInt(formData.injuries) || 0,
        fatalities: parseInt(formData.fatalities) || 0,
        occurredAt: formData.occurredAt || new Date().toISOString(),
      };

      const response = await fetch(`/api/traffic/chp-cases?id=${editingCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP case updated successfully', 'success');
        setEditingCase(null);
        await fetchCases();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update case', 'error');
      }
    } catch (error) {
      console.error('Error updating case:', error);
      showToast('Failed to update case', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete CHP case "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/chp-cases?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP case deleted successfully', 'success');
        await fetchCases();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete case', 'error');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      showToast('Failed to delete case', 'error');
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean, title: string) => {
    try {
      const response = await fetch(`/api/traffic/chp-cases?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Case "${title}" ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        await fetchCases();
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
      caseId: '',
      sourceId: '',
      title: '',
      description: '',
      type: '',
      severity: '1',
      location: '',
      latitude: null,
      longitude: null,
      address: '',
      city: '',
      county: '',
      zipCode: '',
      collisionType: '',
      weatherCondition: '',
      roadCondition: '',
      lightCondition: '',
      vehiclesInvolved: '',
      injuries: '',
      fatalities: '',
      occurredAt: '',
      reportedAt: '',
      notes: '',
      isActive: true,
      isPublic: true,
    });
  };

  const openEditDialog = (chpCase: CHPCase) => {
    setEditingCase(chpCase);
    setFormData({
      caseId: chpCase.caseId || '',
      sourceId: chpCase.sourceId || '',
      title: chpCase.title,
      description: chpCase.description || '',
      type: chpCase.type || '',
      severity: String(chpCase.severity || 1),
      location: chpCase.location || '',
      latitude: chpCase.latitude,
      longitude: chpCase.longitude,
      address: chpCase.address || '',
      city: chpCase.city || '',
      county: chpCase.county || '',
      zipCode: chpCase.zipCode || '',
      collisionType: chpCase.collisionType || '',
      weatherCondition: chpCase.weatherCondition || '',
      roadCondition: chpCase.roadCondition || '',
      lightCondition: chpCase.lightCondition || '',
      vehiclesInvolved: String(chpCase.vehiclesInvolved || 1),
      injuries: String(chpCase.injuries || 0),
      fatalities: String(chpCase.fatalities || 0),
      occurredAt: chpCase.occurredAt ? new Date(chpCase.occurredAt).toISOString().split('T')[0] : '',
      reportedAt: chpCase.reportedAt ? new Date(chpCase.reportedAt).toISOString().split('T')[0] : '',
      notes: chpCase.notes || '',
      isActive: chpCase.isActive ?? true,
      isPublic: chpCase.isPublic ?? true,
    });
  };

  const renderActions = (chpCase: CHPCase) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(chpCase)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleActive(chpCase.id, chpCase.isActive, chpCase.title)}
        title={chpCase.isActive ? 'Deactivate' : 'Activate'}
      >
        {chpCase.isActive ? (
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
          {chpCase.caseId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Case ID: {chpCase.caseId}
              </span>
            </DropdownMenuItem>
          )}
          {chpCase.vehiclesInvolved && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Vehicles: {chpCase.vehiclesInvolved}
              </span>
            </DropdownMenuItem>
          )}
          {chpCase.injuries !== undefined && chpCase.injuries > 0 && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Injuries: {chpCase.injuries}
              </span>
            </DropdownMenuItem>
          )}
          {chpCase.fatalities !== undefined && chpCase.fatalities > 0 && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground text-red-600">
                Fatalities: {chpCase.fatalities}
              </span>
            </DropdownMenuItem>
          )}
          {chpCase.county && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {chpCase.county}
              </span>
            </DropdownMenuItem>
          )}
          {chpCase.occurredAt && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Occurred: {new Date(chpCase.occurredAt).toLocaleDateString()}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(chpCase.id, chpCase.title)}
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
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">CHP Cases</span>
          <Badge variant="secondary" className="text-xs">
            {filteredCases.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create CHP Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="caseId">Case ID *</Label>
                <Input
                  id="caseId"
                  placeholder="e.g., CHP-CASE-001"
                  value={formData.caseId}
                  onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sourceId">Source ID</Label>
                <Input
                  id="sourceId"
                  placeholder="Leave blank for auto-generation"
                  value={formData.sourceId}
                  onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
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
                  placeholder="Case description..."
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
                      {CASE_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
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
                      {SEVERITY_OPTIONS.map((sev) => (
                        <SelectItem key={sev.value} value={sev.value}>
                          {sev.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Collision Details */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Collision Details</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="collisionType">Collision Type</Label>
                    <Select
                      value={formData.collisionType}
                      onValueChange={(value) => setFormData({ ...formData, collisionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select collision type" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLISION_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="weatherCondition">Weather</Label>
                      <Select
                        value={formData.weatherCondition}
                        onValueChange={(value) => setFormData({ ...formData, weatherCondition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Weather" />
                        </SelectTrigger>
                        <SelectContent>
                          {WEATHER_CONDITION_OPTIONS.map((cond) => (
                            <SelectItem key={cond.value} value={cond.value}>
                              {cond.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="roadCondition">Road</Label>
                      <Select
                        value={formData.roadCondition}
                        onValueChange={(value) => setFormData({ ...formData, roadCondition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Road" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROAD_CONDITION_OPTIONS.map((cond) => (
                            <SelectItem key={cond.value} value={cond.value}>
                              {cond.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lightCondition">Light</Label>
                      <Select
                        value={formData.lightCondition}
                        onValueChange={(value) => setFormData({ ...formData, lightCondition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Light" />
                        </SelectTrigger>
                        <SelectContent>
                          {LIGHT_CONDITION_OPTIONS.map((cond) => (
                            <SelectItem key={cond.value} value={cond.value}>
                              {cond.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Vehicles Involved"
                      type="number"
                      min="1"
                      value={formData.vehiclesInvolved}
                      onChange={(e) => setFormData({ ...formData, vehiclesInvolved: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Injuries"
                      type="number"
                      min="0"
                      value={formData.injuries}
                      onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Fatalities"
                      type="number"
                      min="0"
                      value={formData.fatalities}
                      onChange={(e) => setFormData({ ...formData, fatalities: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Dates</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="occurredAt">Occurred Date</Label>
                    <Input
                      id="occurredAt"
                      type="date"
                      value={formData.occurredAt}
                      onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportedAt">Reported Date</Label>
                    <Input
                      id="reportedAt"
                      type="date"
                      value={formData.reportedAt}
                      onChange={(e) => setFormData({ ...formData, reportedAt: e.target.value })}
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
                  'Create Case'
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CASE_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
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
            {SEVERITY_OPTIONS.map((sev) => (
              <SelectItem key={sev.value} value={sev.value}>
                {sev.label}
              </SelectItem>
            ))}
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
            setFilterType('all');
            setFilterSeverity('all');
            setFilterActive('all');
            fetchCases();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Cases Table */}
      {filteredCases.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No CHP cases found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first case
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Title</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Severity</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">County</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((chpCase) => (
                <TableRow key={chpCase.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {chpCase.title}
                      {chpCase.caseId && (
                        <span className="text-[10px] text-muted-foreground hidden xl:inline">
                          ({chpCase.caseId})
                        </span>
                      )}
                      {!chpCase.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {chpCase.type ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(CASE_TYPE_OPTIONS, chpCase.type)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {chpCase.severity ? (
                      <Badge className={`text-[10px] ${getSeverityColor(chpCase.severity)}`}>
                        {getSeverityLabel(chpCase.severity)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {chpCase.county || chpCase.city || '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getActiveStatusColor(chpCase.isActive)}`}>
                      {chpCase.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(chpCase)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog - same as create but with different title */}
      <Dialog open={!!editingCase} onOpenChange={(open) => !open && setEditingCase(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit CHP Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-caseId">Case ID *</Label>
              <Input
                id="edit-caseId"
                value={formData.caseId}
                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-sourceId">Source ID</Label>
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
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
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
                    {SEVERITY_OPTIONS.map((sev) => (
                      <SelectItem key={sev.value} value={sev.value}>
                        {sev.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Collision Details */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Collision Details</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="edit-collisionType">Collision Type</Label>
                  <Select
                    value={formData.collisionType}
                    onValueChange={(value) => setFormData({ ...formData, collisionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collision type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLISION_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="edit-weatherCondition">Weather</Label>
                    <Select
                      value={formData.weatherCondition}
                      onValueChange={(value) => setFormData({ ...formData, weatherCondition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Weather" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEATHER_CONDITION_OPTIONS.map((cond) => (
                          <SelectItem key={cond.value} value={cond.value}>
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-roadCondition">Road</Label>
                    <Select
                      value={formData.roadCondition}
                      onValueChange={(value) => setFormData({ ...formData, roadCondition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Road" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROAD_CONDITION_OPTIONS.map((cond) => (
                          <SelectItem key={cond.value} value={cond.value}>
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-lightCondition">Light</Label>
                    <Select
                      value={formData.lightCondition}
                      onValueChange={(value) => setFormData({ ...formData, lightCondition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Light" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIGHT_CONDITION_OPTIONS.map((cond) => (
                          <SelectItem key={cond.value} value={cond.value}>
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Vehicles Involved"
                    type="number"
                    min="1"
                    value={formData.vehiclesInvolved}
                    onChange={(e) => setFormData({ ...formData, vehiclesInvolved: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Injuries"
                    type="number"
                    min="0"
                    value={formData.injuries}
                    onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Fatalities"
                    type="number"
                    min="0"
                    value={formData.fatalities}
                    onChange={(e) => setFormData({ ...formData, fatalities: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Dates</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="edit-occurredAt">Occurred Date</Label>
                  <Input
                    id="edit-occurredAt"
                    type="date"
                    value={formData.occurredAt}
                    onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-reportedAt">Reported Date</Label>
                  <Input
                    id="edit-reportedAt"
                    type="date"
                    value={formData.reportedAt}
                    onChange={(e) => setFormData({ ...formData, reportedAt: e.target.value })}
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