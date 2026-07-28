// components/admin/traffic/caltrans-cctv/TrafficCaltransCctvCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Camera,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Building2,
  Image,
  Video,
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
interface TrafficCaltransCctvCRUDProps {
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

interface Camera {
  id: number;
  cameraId: string;
  sourceId: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  county: string | null;
  cameraType: string | null;
  direction: string | null;
  imageUrl: string | null;
  streamingUrl: string | null;
  status: string;
  districtId: number | null;
  caltransId: string | null;
  rawData: any;
  notes: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  district?: District;
}

interface FormData {
  cameraId: string;
  sourceId: string;
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  county: string;
  cameraType: string;
  direction: string;
  imageUrl: string;
  streamingUrl: string;
  status: string;
  districtId: number | null;
  caltransId: string;
  notes: string;
  isActive: boolean;
  isPublic: boolean;
}

// ✅ Options
const CAMERA_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'ptz', label: 'PTZ (Pan-Tilt-Zoom)' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'other', label: 'Other' },
];

const DIRECTION_OPTIONS = [
  { value: 'northbound', label: 'Northbound' },
  { value: 'southbound', label: 'Southbound' },
  { value: 'eastbound', label: 'Eastbound' },
  { value: 'westbound', label: 'Westbound' },
  { value: 'both', label: 'Both Directions' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offline', label: 'Offline' },
];

// ✅ Helper to get label from value
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

// ✅ Status color mapping
const getCameraStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'inactive': return 'bg-gray-100 text-gray-700';
    case 'maintenance': return 'bg-yellow-100 text-yellow-700';
    case 'offline': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getActiveStatusColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
};

export function TrafficCaltransCctvCRUD({ onModuleUpdate }: TrafficCaltransCctvCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    cameraId: '',
    sourceId: '',
    name: '',
    description: '',
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    county: '',
    cameraType: '',
    direction: '',
    imageUrl: '',
    streamingUrl: '',
    status: 'active',
    districtId: null,
    caltransId: '',
    notes: '',
    isActive: true,
    isPublic: true,
  });

  // ✅ Fetch cameras and districts
  useEffect(() => {
    fetchCameras();
    fetchDistricts();
  }, [filterStatus, filterActive, filterDistrict]);

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

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');
      if (filterDistrict !== 'all') params.append('districtId', filterDistrict);

      const response = await fetch(`/api/traffic/caltrans-cctv?${params.toString()}&includeDistrict=true`);
      const data = await response.json();

      if (data.success) {
        setCameras(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch cameras', 'error');
        setCameras([]);
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
      showToast('Failed to fetch cameras', 'error');
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get unique counties for filter
  const counties = Array.from(new Set(cameras.map(c => c.county).filter(Boolean)));

  const filteredCameras = cameras.filter((camera) =>
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (camera.cameraId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (camera.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (camera.county?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // ✅ Get district name by ID
  const getDistrictName = (districtId: number | null) => {
    if (!districtId) return 'None';
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : `District #${districtId}`;
  };

  const handleCreate = async () => {
    if (!formData.cameraId) {
      showToast('Camera ID is required', 'error');
      return;
    }
    if (!formData.sourceId) {
      showToast('Source ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Camera name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/caltrans-cctv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans CCTV camera created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchCameras();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create camera', 'error');
      }
    } catch (error) {
      console.error('Error creating camera:', error);
      showToast('Failed to create camera', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCamera) return;
    if (!formData.cameraId) {
      showToast('Camera ID is required', 'error');
      return;
    }
    if (!formData.sourceId) {
      showToast('Source ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Camera name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/traffic/caltrans-cctv?id=${editingCamera.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans CCTV camera updated successfully', 'success');
        setEditingCamera(null);
        await fetchCameras();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update camera', 'error');
      }
    } catch (error) {
      console.error('Error updating camera:', error);
      showToast('Failed to update camera', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete Caltrans CCTV camera "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/caltrans-cctv?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans CCTV camera deleted successfully', 'success');
        await fetchCameras();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete camera', 'error');
      }
    } catch (error) {
      console.error('Error deleting camera:', error);
      showToast('Failed to delete camera', 'error');
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(`/api/traffic/caltrans-cctv?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Camera "${name}" ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        await fetchCameras();
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
      cameraId: '',
      sourceId: '',
      name: '',
      description: '',
      latitude: null,
      longitude: null,
      address: '',
      city: '',
      county: '',
      cameraType: '',
      direction: '',
      imageUrl: '',
      streamingUrl: '',
      status: 'active',
      districtId: null,
      caltransId: '',
      notes: '',
      isActive: true,
      isPublic: true,
    });
  };

  const openEditDialog = (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      cameraId: camera.cameraId || '',
      sourceId: camera.sourceId || '',
      name: camera.name,
      description: camera.description || '',
      latitude: camera.latitude,
      longitude: camera.longitude,
      address: camera.address || '',
      city: camera.city || '',
      county: camera.county || '',
      cameraType: camera.cameraType || '',
      direction: camera.direction || '',
      imageUrl: camera.imageUrl || '',
      streamingUrl: camera.streamingUrl || '',
      status: camera.status || 'active',
      districtId: camera.districtId,
      caltransId: camera.caltransId || '',
      notes: camera.notes || '',
      isActive: camera.isActive ?? true,
      isPublic: camera.isPublic ?? true,
    });
  };

  const renderActions = (camera: Camera) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(camera)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleActive(camera.id, camera.isActive, camera.name)}
        title={camera.isActive ? 'Deactivate' : 'Activate'}
      >
        {camera.isActive ? (
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
          {camera.cameraId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                ID: {camera.cameraId}
              </span>
            </DropdownMenuItem>
          )}
          {camera.city && camera.county && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {camera.city}, {camera.county}
              </span>
            </DropdownMenuItem>
          )}
          {camera.districtId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {getDistrictName(camera.districtId)}
              </span>
            </DropdownMenuItem>
          )}
          {camera.imageUrl && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Image className="w-3 h-3" />
                Has Snapshot
              </span>
            </DropdownMenuItem>
          )}
          {camera.streamingUrl && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Video className="w-3 h-3" />
                Has Stream
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(camera.id, camera.name)}
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
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">Caltrans CCTV Cameras</span>
          <Badge variant="secondary" className="text-xs">
            {filteredCameras.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Camera
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Caltrans CCTV Camera</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="cameraId">Camera ID *</Label>
                <Input
                  id="cameraId"
                  placeholder="e.g., CAM-001"
                  value={formData.cameraId}
                  onChange={(e) => setFormData({ ...formData, cameraId: e.target.value })}
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
                <Label htmlFor="name">Camera Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., I-80 at Truckee"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Camera description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cameraType">Camera Type</Label>
                  <Select
                    value={formData.cameraType}
                    onValueChange={(value) => setFormData({ ...formData, cameraType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMERA_TYPE_OPTIONS.map((type) => (
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

              <div>
                <Label htmlFor="status">Camera Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Location</Label>
                <div className="space-y-3 mt-2">
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

              {/* URLs */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Media URLs</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Image URL (snapshot)"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Streaming URL (live video)"
                    type="url"
                    value={formData.streamingUrl}
                    onChange={(e) => setFormData({ ...formData, streamingUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
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
                  'Create Camera'
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
            placeholder="Search by name, ID, city..."
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
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
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
            setFilterActive('all');
            setFilterDistrict('all');
            fetchCameras();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Cameras Table */}
      {filteredCameras.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No Caltrans CCTV cameras found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first camera
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">ID</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">District</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCameras.map((camera) => (
                <TableRow key={camera.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      {camera.name}
                      {camera.city && (
                        <span className="text-[10px] text-muted-foreground hidden xl:inline">
                          ({camera.city})
                        </span>
                      )}
                      {!camera.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {camera.cameraId || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {camera.cameraType ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(CAMERA_TYPE_OPTIONS, camera.cameraType)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {camera.district ? camera.district.name : '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getCameraStatusColor(camera.status)}`}>
                      {getOptionLabel(STATUS_OPTIONS, camera.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getActiveStatusColor(camera.isActive)}`}>
                      {camera.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(camera)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingCamera} onOpenChange={(open) => !open && setEditingCamera(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Caltrans CCTV Camera</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-cameraId">Camera ID *</Label>
              <Input
                id="edit-cameraId"
                value={formData.cameraId}
                onChange={(e) => setFormData({ ...formData, cameraId: e.target.value })}
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
              <Label htmlFor="edit-name">Camera Name *</Label>
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
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-cameraType">Camera Type</Label>
                <Select
                  value={formData.cameraType}
                  onValueChange={(value) => setFormData({ ...formData, cameraType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERA_TYPE_OPTIONS.map((type) => (
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

            <div>
              <Label htmlFor="edit-status">Camera Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Location</Label>
              <div className="space-y-3 mt-2">
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

            {/* URLs */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Media URLs</Label>
              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Image URL (snapshot)"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Streaming URL (live video)"
                  type="url"
                  value={formData.streamingUrl}
                  onChange={(e) => setFormData({ ...formData, streamingUrl: e.target.value })}
                  disabled={isSubmitting}
                />
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