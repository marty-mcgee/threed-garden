// components/admin/traffic/chp-centers/TrafficCHPCentersCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Building2,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
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
interface TrafficCHPCentersCRUDProps {
  onModuleUpdate?: () => void;
  onCenterSelect?: (centerId: number) => void;
}

interface Center {
  id: number;
  centerId: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  county: string | null;
  region: string | null;
  state: string | null;
  zipCode: string | null;
  type: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  centerId: string;
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  county: string;
  region: string;
  state: string;
  zipCode: string;
  type: string;
  phone: string;
  email: string;
  isActive: boolean;
  config: any;
}

// ✅ Options
const CENTER_TYPE_OPTIONS = [
  { value: 'headquarters', label: 'Headquarters' },
  { value: 'division', label: 'Division' },
  { value: 'office', label: 'Office' },
  { value: 'station', label: 'Station' },
  { value: 'other', label: 'Other' },
];

const STATE_OPTIONS = [
  { value: 'CA', label: 'California' },
  { value: 'NV', label: 'Nevada' },
  { value: 'OR', label: 'Oregon' },
  { value: 'AZ', label: 'Arizona' },
  // Add more states as needed
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

export function TrafficCHPCentersCRUD({ onModuleUpdate, onCenterSelect }: TrafficCHPCentersCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterCounty, setFilterCounty] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    centerId: '',
    name: '',
    description: '',
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    county: '',
    region: '',
    state: 'CA',
    zipCode: '',
    type: '',
    phone: '',
    email: '',
    isActive: true,
    config: {},
  });

  // ✅ Fetch centers
  useEffect(() => {
    fetchCenters();
  }, [filterType, filterActive, filterCounty]);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');
      if (filterCounty !== 'all') params.append('county', filterCounty);

      const response = await fetch(`/api/traffic/chp-centers?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCenters(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch centers', 'error');
        setCenters([]);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
      showToast('Failed to fetch centers', 'error');
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get unique counties for filter
  const counties = Array.from(
    new Set(centers.map(c => c.county).filter((county): county is string => Boolean(county)))
  );

  const filteredCenters = centers.filter((center) =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (center.centerId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (center.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (center.county?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (center.region?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (center.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.centerId) {
      showToast('Center ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Center name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/chp-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP Center created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchCenters();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create center', 'error');
      }
    } catch (error) {
      console.error('Error creating center:', error);
      showToast('Failed to create center', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCenter) return;
    if (!formData.centerId) {
      showToast('Center ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Center name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/traffic/chp-centers?id=${editingCenter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP Center updated successfully', 'success');
        setEditingCenter(null);
        await fetchCenters();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update center', 'error');
      }
    } catch (error) {
      console.error('Error updating center:', error);
      showToast('Failed to update center', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete CHP Center "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/chp-centers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('CHP Center deleted successfully', 'success');
        await fetchCenters();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete center', 'error');
      }
    } catch (error) {
      console.error('Error deleting center:', error);
      showToast('Failed to delete center', 'error');
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(`/api/traffic/chp-centers?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Center "${name}" ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        await fetchCenters();
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
      centerId: '',
      name: '',
      description: '',
      latitude: null,
      longitude: null,
      address: '',
      city: '',
      county: '',
      region: '',
      state: 'CA',
      zipCode: '',
      type: '',
      phone: '',
      email: '',
      isActive: true,
      config: {},
    });
  };

  const openEditDialog = (center: Center) => {
    setEditingCenter(center);
    setFormData({
      centerId: center.centerId || '',
      name: center.name,
      description: center.description || '',
      latitude: center.latitude,
      longitude: center.longitude,
      address: center.address || '',
      city: center.city || '',
      county: center.county || '',
      region: center.region || '',
      state: center.state || 'CA',
      zipCode: center.zipCode || '',
      type: center.type || '',
      phone: center.phone || '',
      email: center.email || '',
      isActive: center.isActive ?? true,
      config: center.config || {},
    });
  };

  const handleSelectCenter = (center: Center) => {
    if (onCenterSelect) {
      onCenterSelect(center.id);
    }
  };

  const renderActions = (center: Center) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(center)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleActive(center.id, center.isActive, center.name)}
        title={center.isActive ? 'Deactivate' : 'Activate'}
      >
        {center.isActive ? (
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
          {center.centerId && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                ID: {center.centerId}
              </span>
            </DropdownMenuItem>
          )}
          {center.city && center.state && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {center.city}, {center.state}
              </span>
            </DropdownMenuItem>
          )}
          {center.county && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                County: {center.county}
              </span>
            </DropdownMenuItem>
          )}
          {center.region && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Region: {center.region}
              </span>
            </DropdownMenuItem>
          )}
          {center.phone && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {center.phone}
              </span>
            </DropdownMenuItem>
          )}
          {center.email && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {center.email}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(center.id, center.name)}
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
          <Building2 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">CHP Centers</span>
          <Badge variant="secondary" className="text-xs">
            {filteredCenters.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Center
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create CHP Center</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="centerId">Center ID *</Label>
                <Input
                  id="centerId"
                  placeholder="e.g., CHP-001"
                  value={formData.centerId}
                  onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Center Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., San Francisco CHP Office"
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
                  placeholder="Center description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="type">Center Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CENTER_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_OPTIONS.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="County"
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <Input
                    placeholder="Zip Code"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
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
                  'Create Center'
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
            placeholder="Search by name, ID, city, county, region..."
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
            {CENTER_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {counties.length > 0 && (
          <Select value={filterCounty} onValueChange={setFilterCounty}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="County" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {counties.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
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
            setFilterType('all');
            setFilterActive('all');
            setFilterCounty('all');
            fetchCenters();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Centers Table */}
      {filteredCenters.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No CHP Centers found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first center
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">ID</TableHead>
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">County</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Region</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCenters.map((center) => (
                <TableRow 
                  key={center.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSelectCenter(center)}
                >
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {center.centerId || '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      {center.name}
                      {center.city && (
                        <span className="text-[10px] text-muted-foreground hidden xl:inline">
                          ({center.city})
                        </span>
                      )}
                      {!center.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {center.type ? (
                      <Badge variant="outline" className="text-[10px]">
                        {getOptionLabel(CENTER_TYPE_OPTIONS, center.type)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {center.county || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {center.region || '—'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${getStatusColor(center.isActive)}`}>
                      {center.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(center)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingCenter} onOpenChange={(open) => !open && setEditingCenter(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit CHP Center</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-centerId">Center ID *</Label>
              <Input
                id="edit-centerId"
                value={formData.centerId}
                onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">Center Name *</Label>
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

            <div>
              <Label htmlFor="edit-type">Center Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CENTER_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_OPTIONS.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="County"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <Input
                  placeholder="Zip Code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
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
