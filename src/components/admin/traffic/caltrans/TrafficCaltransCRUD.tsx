// components/admin/traffic/caltrans/TrafficCaltransCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  Route,
  Calendar,
  Building2,
  TrafficCone,
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
interface TrafficCaltransCRUDProps {
  // userId: string;
  // moduleId?: number;
  onModuleUpdate?: () => void;
}

interface District {
  id: number;
  districtId: string;
  name: string;
  districtNumber: number;
  region: string | null;
  isActive: boolean;
}

interface Closure {
  id: number;
  closureId: string;
  sourceId: string;
  title: string;
  description: string | null;
  closureType: string;
  route: string | null;
  direction: string | null;
  county: string | null;
  city: string | null;
  milepost: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string | null;
  expectedEndDate: string | null;
  lastUpdated: string;
  districtId: number | null;
  caltransId: string | null;
  reason: string | null;
  detour: string | null;
  notes: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  district?: District;
}

interface FormData {
  closureId: string;
  sourceId: string;
  title: string;
  description: string;
  closureType: string;
  route: string;
  direction: string;
  county: string;
  city: string;
  milepost: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  expectedEndDate: string;
  districtId: number | null;
  caltransId: string;
  reason: string;
  detour: string;
  notes: string;
  isActive: boolean;
  isPublic: boolean;
}

// ✅ Options
const CLOSURE_TYPE_OPTIONS = [
  { value: 'full', label: 'Full Closure' },
  { value: 'partial', label: 'Partial Closure' },
  { value: 'lane', label: 'Lane Closure' },
  { value: 'shoulder', label: 'Shoulder Closure' },
  { value: 'ramp', label: 'Ramp Closure' },
];

const DIRECTION_OPTIONS = [
  { value: 'northbound', label: 'Northbound' },
  { value: 'southbound', label: 'Southbound' },
  { value: 'eastbound', label: 'Eastbound' },
  { value: 'westbound', label: 'Westbound' },
  { value: 'both', label: 'Both Directions' },
];

// ✅ Helper to get label from value
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

// ✅ Status color mapping
const getClosureTypeColor = (type: string) => {
  switch (type) {
    case 'full': return 'bg-red-100 text-red-700';
    case 'partial': return 'bg-orange-100 text-orange-700';
    case 'lane': return 'bg-yellow-100 text-yellow-700';
    case 'shoulder': return 'bg-blue-100 text-blue-700';
    case 'ramp': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
};

export function TrafficCaltransCRUD({ onModuleUpdate }: TrafficCaltransCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [closures, setClosures] = useState<Closure[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClosure, setEditingClosure] = useState<Closure | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    closureId: '',
    sourceId: '',
    title: '',
    description: '',
    closureType: '',
    route: '',
    direction: '',
    county: '',
    city: '',
    milepost: '',
    latitude: null,
    longitude: null,
    startDate: '',
    endDate: '',
    expectedEndDate: '',
    districtId: null,
    caltransId: '',
    reason: '',
    detour: '',
    notes: '',
    isActive: true,
    isPublic: true,
  });

  // ✅ Fetch closures and districts
  useEffect(() => {
    fetchClosures();
    fetchDistricts();
  }, [filterType, filterActive, filterDistrict]);

  const fetchDistricts = async () => {
    setLoadingDistricts(true);
    try {
      const response = await fetch('/api/traffic/caltrans-districts?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setDistricts(Array.isArray(data.data) ? data.data : []);
      } else {
        console.error('Failed to fetch districts:', data.error);
        setDistricts([]);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('closureType', filterType);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');
      if (filterDistrict !== 'all') params.append('districtId', filterDistrict);

      const response = await fetch(`/api/traffic/caltrans?${params.toString()}&includeDistrict=true`);
      const data = await response.json();

      if (data.success) {
        setClosures(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch closures', 'error');
        setClosures([]);
      }
    } catch (error) {
      console.error('Error fetching closures:', error);
      showToast('Failed to fetch closures', 'error');
      setClosures([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get unique counties for filter
  const counties = Array.from(new Set(closures.map(c => c.county).filter(Boolean)));

  const filteredClosures = closures.filter((closure) =>
    closure.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (closure.closureId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (closure.route?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (closure.county?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (closure.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // ✅ Get district name by ID
  const getDistrictName = (districtId: number | null) => {
    if (!districtId) return 'None';
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : `District #${districtId}`;
  };

  const handleCreate = async () => {
    if (!formData.closureId) {
      showToast('Closure ID is required', 'error');
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
    if (!formData.startDate) {
      showToast('Start date is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      };

      const response = await fetch('/api/traffic/caltrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans closure created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
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
    if (!formData.closureId) {
      showToast('Closure ID is required', 'error');
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
    if (!formData.startDate) {
      showToast('Start date is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      };

      const response = await fetch(`/api/traffic/caltrans?id=${editingClosure.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans closure updated successfully', 'success');
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

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete closure "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/caltrans?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans closure deleted successfully', 'success');
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

  const toggleActive = async (id: number, currentStatus: boolean, title: string) => {
    try {
      const response = await fetch(`/api/traffic/caltrans?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Closure "${title}" ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        await fetchClosures();
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
      closureId: '',
      sourceId: '',
      title: '',
      description: '',
      closureType: '',
      route: '',
      direction: '',
      county: '',
      city: '',
      milepost: '',
      latitude: null,
      longitude: null,
      startDate: '',
      endDate: '',
      expectedEndDate: '',
      districtId: null,
      caltransId: '',
      reason: '',
      detour: '',
      notes: '',
      isActive: true,
      isPublic: true,
    });
  };

  const openEditDialog = (closure: Closure) => {
    setEditingClosure(closure);
    setFormData({
      closureId: closure.closureId || '',
      sourceId: closure.sourceId || '',
      title: closure.title,
      description: closure.description || '',
      closureType: closure.closureType || '',
      route: closure.route || '',
      direction: closure.direction || '',
      county: closure.county || '',
      city: closure.city || '',
      milepost: closure.milepost || '',
      latitude: closure.latitude,
      longitude: closure.longitude,
      startDate: closure.startDate ? new Date(closure.startDate).toISOString().split('T')[0] : '',
      endDate: closure.endDate ? new Date(closure.endDate).toISOString().split('T')[0] : '',
      expectedEndDate: closure.expectedEndDate ? new Date(closure.expectedEndDate).toISOString().split('T')[0] : '',
      districtId: closure.districtId,
      caltransId: closure.caltransId || '',
      reason: closure.reason || '',
      detour: closure.detour || '',
      notes: closure.notes || '',
      isActive: closure.isActive ?? true,
      isPublic: closure.isPublic ?? true,
    });
  };

  const renderActions = (closure: Closure) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(closure)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleActive(closure.id, closure.isActive, closure.title)}
        title={closure.isActive ? 'Deactivate' : 'Activate'}
      >
        {closure.isActive ? (
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
          {closure.closureId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                ID: {closure.closureId}
              </span>
            </DropdownMenuItem>
          )}
          {closure.route && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrafficCone className="w-3 h-3" />
                {closure.route} {closure.direction}
              </span>
            </DropdownMenuItem>
          )}
          {closure.county && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {closure.county}
              </span>
            </DropdownMenuItem>
          )}
          {closure.districtId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {getDistrictName(closure.districtId)}
              </span>
            </DropdownMenuItem>
          )}
          {closure.startDate && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Starts: {new Date(closure.startDate).toLocaleDateString()}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(closure.id, closure.title)}
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
          <TrafficCone className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium">Caltrans Lane Closures</span>
          <Badge variant="secondary" className="text-xs">
            {filteredClosures.length}
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
              <DialogTitle>Create Caltrans Closure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="closureId">Closure ID *</Label>
                <Input
                  id="closureId"
                  placeholder="e.g., CL-2024-001"
                  value={formData.closureId}
                  onChange={(e) => setFormData({ ...formData, closureId: e.target.value })}
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
                  placeholder="e.g., I-80 Lane Closure"
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
                  placeholder="Closure description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="closureType">Closure Type</Label>
                  <Select
                    value={formData.closureType}
                    onValueChange={(value) => setFormData({ ...formData, closureType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOSURE_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {DIRECTION_OPTIONS.map((dir) => (
                        <SelectItem key={dir.value} value={dir.value}>
                          {dir.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Route & Location */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Route & Location</Label>
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Route (e.g., I-80)"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Milepost"
                      value={formData.milepost}
                      onChange={(e) => setFormData({ ...formData, milepost: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
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

              {/* District & Caltrans Info */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Caltrans Info</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="districtId">Caltrans District</Label>
                    <Select
                      value={formData.districtId ? String(formData.districtId) : 'none'}
                      onValueChange={(value) => {
                        setFormData({ ...formData, districtId: value === 'none' ? null : parseInt(value) });
                      }}
                      disabled={isSubmitting || loadingDistricts}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingDistricts ? 'Loading districts...' : 'Select a district'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={String(district.id)}>
                            #{district.districtNumber} - {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Caltrans ID"
                    value={formData.caltransId}
                    onChange={(e) => setFormData({ ...formData, caltransId: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Dates</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedEndDate">Expected End Date</Label>
                    <Input
                      id="expectedEndDate"
                      type="date"
                      value={formData.expectedEndDate}
                      onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Reason & Detour */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Details</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Reason for closure"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Textarea
                    placeholder="Detour information"
                    value={formData.detour}
                    onChange={(e) => setFormData({ ...formData, detour: e.target.value })}
                    rows={2}
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
                  'Create Closure'
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
            placeholder="Search by title, route, county..."
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
            {CLOSURE_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDistrict} onValueChange={setFilterDistrict}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((district) => (
              <SelectItem key={district.id} value={String(district.id)}>
                #{district.districtNumber} - {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
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
            setFilterActive('all');
            setFilterDistrict('all');
            fetchClosures();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Closures Table */}
      {filteredClosures.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <TrafficCone className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No Caltrans closures found</p>
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
                <TableHead className="text-xs py-1">Title</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Route</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">County</TableHead>
                <TableHead className="hidden xl:table-cell text-xs py-1">District</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClosures.map((closure) => (
                <TableRow key={closure.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <TrafficCone className="w-3.5 h-3.5 text-orange-400" />
                      {closure.title}
                      {!closure.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getClosureTypeColor(closure.closureType)}`}>
                      {getOptionLabel(CLOSURE_TYPE_OPTIONS, closure.closureType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {closure.route || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {closure.county || '—'}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-1 text-sm text-muted-foreground">
                    {closure.district ? closure.district.name : '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getStatusColor(closure.isActive)}`}>
                      {closure.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(closure)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingClosure} onOpenChange={(open) => !open && setEditingClosure(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Caltrans Closure</DialogTitle>
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
                <Label htmlFor="edit-closureType">Closure Type</Label>
                <Select
                  value={formData.closureType}
                  onValueChange={(value) => setFormData({ ...formData, closureType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLOSURE_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {DIRECTION_OPTIONS.map((dir) => (
                      <SelectItem key={dir.value} value={dir.value}>
                        {dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Route & Location */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Route & Location</Label>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Route"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Milepost"
                    value={formData.milepost}
                    onChange={(e) => setFormData({ ...formData, milepost: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
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

            {/* District & Caltrans Info */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Caltrans Info</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="edit-districtId">Caltrans District</Label>
                  <Select
                    value={formData.districtId ? String(formData.districtId) : 'none'}
                    onValueChange={(value) => {
                      setFormData({ ...formData, districtId: value === 'none' ? null : parseInt(value) });
                    }}
                    disabled={isSubmitting || loadingDistricts}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingDistricts ? 'Loading districts...' : 'Select a district'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={String(district.id)}>
                          #{district.districtNumber} - {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Caltrans ID"
                  value={formData.caltransId}
                  onChange={(e) => setFormData({ ...formData, caltransId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Dates</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="edit-startDate">Start Date *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expectedEndDate">Expected End Date</Label>
                  <Input
                    id="edit-expectedEndDate"
                    type="date"
                    value={formData.expectedEndDate}
                    onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Reason & Detour */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Details</Label>
              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  disabled={isSubmitting}
                />
                <Textarea
                  placeholder="Detour"
                  value={formData.detour}
                  onChange={(e) => setFormData({ ...formData, detour: e.target.value })}
                  rows={2}
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