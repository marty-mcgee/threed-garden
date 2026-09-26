// components/admin/traffic/caltrans-districts/TrafficCaltransDistrictsCRUD.tsx
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
  Phone,
  Mail,
  Globe,
  Building2,
  Grid3x2,
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
interface TrafficCaltransDistrictsCRUDProps {
  // userId: string;
  // moduleId?: number;
  onModuleUpdate?: () => void;
  onDistrictSelect?: (districtId: number) => void;
}

interface District {
  id: number;
  districtId: string;
  name: string;
  description: string | null;
  districtNumber: number;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isActive: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  districtId: string;
  name: string;
  description: string;
  districtNumber: string;
  latitude: number | null;
  longitude: number | null;
  region: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  config: any;
}

// ✅ Options
const REGION_OPTIONS = [
  { value: 'Northern', label: 'Northern California' },
  { value: 'Central', label: 'Central California' },
  { value: 'Southern', label: 'Southern California' },
  { value: 'Bay Area', label: 'Bay Area' },
  { value: 'Other', label: 'Other' },
];

// ✅ Helper to get label from value
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

// ✅ Status color mapping
const getStatusColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
};

export function TrafficCaltransDistrictsCRUD({ onModuleUpdate, onDistrictSelect }: TrafficCaltransDistrictsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    districtId: '',
    name: '',
    description: '',
    districtNumber: '',
    latitude: null,
    longitude: null,
    region: '',
    phone: '',
    email: '',
    website: '',
    isActive: true,
    config: {},
  });

  // ✅ Fetch districts
  useEffect(() => {
    fetchDistricts();
  }, [filterRegion, filterActive]);

  const fetchDistricts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRegion !== 'all') params.append('region', filterRegion);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');

      const response = await fetch(`/api/traffic/caltrans-districts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDistricts(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch districts', 'error');
        setDistricts([]);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      showToast('Failed to fetch districts', 'error');
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get unique regions for filter
  const regions = Array.from(
    new Set(districts.map(d => d.region).filter((region): region is string => Boolean(region)))
  );

  const filteredDistricts = districts.filter((district) =>
    district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (district.districtId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (district.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (district.region?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.districtId) {
      showToast('District ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('District name is required', 'error');
      return;
    }
    if (!formData.districtNumber) {
      showToast('District number is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/caltrans-districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans District created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchDistricts();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create district', 'error');
      }
    } catch (error) {
      console.error('Error creating district:', error);
      showToast('Failed to create district', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDistrict) return;
    if (!formData.districtId) {
      showToast('District ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('District name is required', 'error');
      return;
    }
    if (!formData.districtNumber) {
      showToast('District number is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/traffic/caltrans-districts?id=${editingDistrict.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans District updated successfully', 'success');
        setEditingDistrict(null);
        await fetchDistricts();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update district', 'error');
      }
    } catch (error) {
      console.error('Error updating district:', error);
      showToast('Failed to update district', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete Caltrans District "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/caltrans-districts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Caltrans District deleted successfully', 'success');
        await fetchDistricts();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete district', 'error');
      }
    } catch (error) {
      console.error('Error deleting district:', error);
      showToast('Failed to delete district', 'error');
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(`/api/traffic/caltrans-districts?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`District "${name}" ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        await fetchDistricts();
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
      districtId: '',
      name: '',
      description: '',
      districtNumber: '',
      latitude: null,
      longitude: null,
      region: '',
      phone: '',
      email: '',
      website: '',
      isActive: true,
      config: {},
    });
  };

  const openEditDialog = (district: District) => {
    setEditingDistrict(district);
    setFormData({
      districtId: district.districtId || '',
      name: district.name,
      description: district.description || '',
      districtNumber: String(district.districtNumber || ''),
      latitude: district.latitude,
      longitude: district.longitude,
      region: district.region || '',
      phone: district.phone || '',
      email: district.email || '',
      website: district.website || '',
      isActive: district.isActive ?? true,
      config: district.config || {},
    });
  };

  const handleSelectDistrict = (district: District) => {
    if (onDistrictSelect) {
      onDistrictSelect(district.id);
    }
  };

  const renderActions = (district: District) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(district)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleActive(district.id, district.isActive, district.name)}
        title={district.isActive ? 'Deactivate' : 'Activate'}
      >
        {district.isActive ? (
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
          {district.districtId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                ID: {district.districtId}
              </span>
            </DropdownMenuItem>
          )}
          {district.districtNumber && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                District #{district.districtNumber}
              </span>
            </DropdownMenuItem>
          )}
          {district.region && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {district.region}
              </span>
            </DropdownMenuItem>
          )}
          {district.phone && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {district.phone}
              </span>
            </DropdownMenuItem>
          )}
          {district.email && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {district.email}
              </span>
            </DropdownMenuItem>
          )}
          {district.website && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {district.website}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(district.id, district.name)}
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
          <Grid3x2 className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium">Caltrans Districts</span>
          <Badge variant="secondary" className="text-xs">
            {filteredDistricts.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add District
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Caltrans District</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="districtId">District ID *</Label>
                <Input
                  id="districtId"
                  placeholder="e.g., D-01"
                  value={formData.districtId}
                  onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">District Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Redding"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="districtNumber">District Number *</Label>
                <Input
                  id="districtNumber"
                  type="number"
                  placeholder="e.g., 1"
                  value={formData.districtNumber}
                  onChange={(e) => setFormData({ ...formData, districtNumber: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="District description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_OPTIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Location</Label>
                <div className="space-y-3 mt-2">
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

              {/* Contact */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Contact</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Email address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Website URL"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create District'
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
            placeholder="Search by name, ID, region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        {regions.length > 0 && (
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
            setFilterRegion('all');
            setFilterActive('all');
            fetchDistricts();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Districts Table */}
      {filteredDistricts.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Grid3x2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No Caltrans Districts found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first district
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">ID</TableHead>
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">#</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Region</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistricts.map((district) => (
                <TableRow 
                  key={district.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSelectDistrict(district)}
                >
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {district.districtId || '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Grid3x2 className="w-3.5 h-3.5 text-orange-400" />
                      {district.name}
                      {!district.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      #{district.districtNumber}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {district.region || '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getStatusColor(district.isActive)}`}>
                      {district.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(district)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDistrict} onOpenChange={(open) => !open && setEditingDistrict(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Caltrans District</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-districtId">District ID *</Label>
              <Input
                id="edit-districtId"
                value={formData.districtId}
                onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">District Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-districtNumber">District Number *</Label>
              <Input
                id="edit-districtNumber"
                type="number"
                value={formData.districtNumber}
                onChange={(e) => setFormData({ ...formData, districtNumber: e.target.value })}
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

            <div>
              <Label htmlFor="edit-region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Location</Label>
              <div className="space-y-3 mt-2">
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

            {/* Contact */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Contact</Label>
              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Email address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Website URL"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isActive">Active</Label>
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
