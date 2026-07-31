// components/admin/threed/farmbots/ThreeDFarmbotsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Bot,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Battery,
  Wifi,
  Cpu,
  Clock,
  Zap,
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
interface Bed {
  id: number;
  bedId: string;
  name: string;
}

interface Farmbot {
  id: number;
  deviceId: string;
  name: string;
  isActive: boolean;
  status: string;
  bedId: number | null;
  positionX: string | null;
  positionY: string | null;
  positionZ: string | null;
  apiToken: string | null;
  apiUrl: string | null;
  lastSeen: string | null;
  batteryLevel: number | null;
  firmwareVersion: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  bed?: Bed;
}

interface FormData {
  deviceId: string;
  name: string;
  isActive: boolean;
  status: string;
  bedId: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  apiToken: string;
  apiUrl: string;
  lastSeen: string;
  batteryLevel: string;
  firmwareVersion: string;
  notes: string;
}

// ✅ Options
const FARMBOT_STATUS_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'error', label: 'Error' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-100 text-green-700';
    case 'offline': return 'bg-gray-100 text-gray-700';
    case 'maintenance': return 'bg-yellow-100 text-yellow-700';
    case 'error': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getBatteryColor = (level: number | null) => {
  if (level === null) return 'bg-gray-100 text-gray-700';
  if (level >= 70) return 'bg-green-100 text-green-700';
  if (level >= 30) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const getBatteryIcon = (level: number | null) => {
  if (level === null) return <Zap className="w-3 h-3" />;
  if (level >= 70) return <Battery className="w-3 h-3 text-green-500" />;
  if (level >= 30) return <Battery className="w-3 h-3 text-yellow-500" />;
  return <Battery className="w-3 h-3 text-red-500" />;
};

export function ThreeDFarmbotsCRUD({ onModuleUpdate }: { onModuleUpdate?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [farmbots, setFarmbots] = useState<Farmbot[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFarmbot, setEditingFarmbot] = useState<Farmbot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    deviceId: '',
    name: '',
    isActive: true,
    status: 'offline',
    bedId: '',
    positionX: '',
    positionY: '',
    positionZ: '',
    apiToken: '',
    apiUrl: '',
    lastSeen: '',
    batteryLevel: '',
    firmwareVersion: '',
    notes: '',
  });

  // ✅ Fetch data
  useEffect(() => {
    fetchFarmbots();
    fetchBeds();
  }, []);

  const fetchFarmbots = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/farmbots?limit=100');
      const data = await response.json();
      if (data.success) {
        setFarmbots(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch farmbots', 'error');
        setFarmbots([]);
      }
    } catch (error) {
      console.error('Error fetching farmbots:', error);
      showToast('Failed to fetch farmbots', 'error');
      setFarmbots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const response = await fetch('/api/threed/beds?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setBeds(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds([]);
    }
  };

  const filteredFarmbots = farmbots.filter((farmbot) =>
    farmbot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmbot.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (farmbot.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.deviceId) {
      showToast('Device ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('FarmBot name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        bedId: formData.bedId ? parseInt(formData.bedId) : null,
        batteryLevel: formData.batteryLevel ? parseInt(formData.batteryLevel) : null,
        positionX: formData.positionX || null,
        positionY: formData.positionY || null,
        positionZ: formData.positionZ || null,
        lastSeen: formData.lastSeen || null,
      };

      const response = await fetch('/api/threed/farmbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('FarmBot created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchFarmbots();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create farmbot', 'error');
      }
    } catch (error) {
      console.error('Error creating farmbot:', error);
      showToast('Failed to create farmbot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFarmbot) return;
    if (!formData.deviceId) {
      showToast('Device ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('FarmBot name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        bedId: formData.bedId ? parseInt(formData.bedId) : null,
        batteryLevel: formData.batteryLevel ? parseInt(formData.batteryLevel) : null,
        positionX: formData.positionX || null,
        positionY: formData.positionY || null,
        positionZ: formData.positionZ || null,
        lastSeen: formData.lastSeen || null,
      };

      const response = await fetch(`/api/threed/farmbots?id=${editingFarmbot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('FarmBot updated successfully', 'success');
        setEditingFarmbot(null);
        await fetchFarmbots();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update farmbot', 'error');
      }
    } catch (error) {
      console.error('Error updating farmbot:', error);
      showToast('Failed to update farmbot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete FarmBot "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/farmbots?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('FarmBot deleted successfully', 'success');
        await fetchFarmbots();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete farmbot', 'error');
      }
    } catch (error) {
      console.error('Error deleting farmbot:', error);
      showToast('Failed to delete farmbot', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      deviceId: '',
      name: '',
      isActive: true,
      status: 'offline',
      bedId: '',
      positionX: '',
      positionY: '',
      positionZ: '',
      apiToken: '',
      apiUrl: '',
      lastSeen: '',
      batteryLevel: '',
      firmwareVersion: '',
      notes: '',
    });
  };

  const openEditDialog = (farmbot: Farmbot) => {
    setEditingFarmbot(farmbot);
    setFormData({
      deviceId: farmbot.deviceId || '',
      name: farmbot.name,
      isActive: farmbot.isActive ?? true,
      status: farmbot.status || 'offline',
      bedId: farmbot.bedId ? String(farmbot.bedId) : '',
      positionX: farmbot.positionX || '',
      positionY: farmbot.positionY || '',
      positionZ: farmbot.positionZ || '',
      apiToken: farmbot.apiToken || '',
      apiUrl: farmbot.apiUrl || '',
      lastSeen: farmbot.lastSeen ? new Date(farmbot.lastSeen).toISOString().split('T')[0] : '',
      batteryLevel: farmbot.batteryLevel ? String(farmbot.batteryLevel) : '',
      firmwareVersion: farmbot.firmwareVersion || '',
      notes: farmbot.notes || '',
    });
  };

  const renderActions = (farmbot: Farmbot) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(farmbot)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {farmbot.positionX && farmbot.positionZ && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                ({farmbot.positionX}, {farmbot.positionZ})
              </span>
            </DropdownMenuItem>
          )}
          {farmbot.batteryLevel !== null && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Battery className="w-3 h-3" />
                {farmbot.batteryLevel}%
              </span>
            </DropdownMenuItem>
          )}
          {farmbot.firmwareVersion && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                FW: {farmbot.firmwareVersion}
              </span>
            </DropdownMenuItem>
          )}
          {farmbot.apiUrl && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                {farmbot.apiUrl}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(farmbot.id, farmbot.name)}
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
          <Bot className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium">FarmBots</span>
          <Badge variant="secondary" className="text-xs">
            {filteredFarmbots.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add FarmBot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New FarmBot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="deviceId">Device ID *</Label>
                <Input
                  id="deviceId"
                  placeholder="e.g., FARM-001"
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">FarmBot Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Garden Bot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  required
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
                      {FARMBOT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="batteryLevel">Battery Level (%)</Label>
                  <Input
                    id="batteryLevel"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85"
                    value={formData.batteryLevel}
                    onChange={(e) => setFormData({ ...formData, batteryLevel: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Location</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="bedId" className="text-xs">Bed</Label>
                    <Select
                      value={formData.bedId}
                      onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bed (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {beds.map((bed) => (
                          <SelectItem key={bed.id} value={String(bed.id)}>
                            {bed.name} ({bed.bedId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">3D Position</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        placeholder="X"
                        type="number"
                        step="0.01"
                        value={formData.positionX}
                        onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Y"
                        type="number"
                        step="0.01"
                        value={formData.positionY}
                        onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Z"
                        type="number"
                        step="0.01"
                        value={formData.positionZ}
                        onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">API Configuration</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="apiUrl" className="text-xs">API URL</Label>
                    <Input
                      id="apiUrl"
                      placeholder="https://my.farmbot.io/api"
                      value={formData.apiUrl}
                      onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiToken" className="text-xs">API Token</Label>
                    <Input
                      id="apiToken"
                      type="password"
                      placeholder="Enter API token"
                      value={formData.apiToken}
                      onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Firmware & Last Seen */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">System Info</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="firmwareVersion" className="text-xs">Firmware Version</Label>
                    <Input
                      id="firmwareVersion"
                      placeholder="v1.2.3"
                      value={formData.firmwareVersion}
                      onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastSeen" className="text-xs">Last Seen</Label>
                    <Input
                      id="lastSeen"
                      type="date"
                      value={formData.lastSeen}
                      onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
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
                  'Create FarmBot'
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
            placeholder="Search by name, device ID, notes..."
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
            {FARMBOT_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
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
            fetchFarmbots();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* FarmBots Table */}
      {filteredFarmbots.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No FarmBots found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first FarmBot
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Device ID</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Battery</TableHead>
                <TableHead className="hidden xl:table-cell text-xs py-1">Position</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmbots.map((farmbot) => (
                <TableRow key={farmbot.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-slate-500" />
                      {farmbot.name}
                      {!farmbot.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {farmbot.deviceId || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getStatusColor(farmbot.status)}`}>
                      {getOptionLabel(FARMBOT_STATUS_OPTIONS, farmbot.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {farmbot.batteryLevel !== null ? (
                      <div className="flex items-center gap-1.5">
                        {getBatteryIcon(farmbot.batteryLevel)}
                        <Badge className={`text-[10px] ${getBatteryColor(farmbot.batteryLevel)}`}>
                          {farmbot.batteryLevel}%
                        </Badge>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {farmbot.positionX && farmbot.positionZ ? (
                      `(${farmbot.positionX}, ${farmbot.positionZ})`
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${farmbot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {farmbot.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(farmbot)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingFarmbot} onOpenChange={(open) => !open && setEditingFarmbot(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FarmBot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-deviceId">Device ID *</Label>
              <Input
                id="edit-deviceId"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">FarmBot Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    {FARMBOT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-batteryLevel">Battery Level (%)</Label>
                <Input
                  id="edit-batteryLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryLevel}
                  onChange={(e) => setFormData({ ...formData, batteryLevel: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Location */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Location</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-bedId" className="text-xs">Bed</Label>
                  <Select
                    value={formData.bedId}
                    onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bed (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {beds.map((bed) => (
                        <SelectItem key={bed.id} value={String(bed.id)}>
                          {bed.name} ({bed.bedId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">3D Position</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="X"
                      type="number"
                      step="0.01"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Y"
                      type="number"
                      step="0.01"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Z"
                      type="number"
                      step="0.01"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* API Configuration */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">API Configuration</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-apiUrl" className="text-xs">API URL</Label>
                  <Input
                    id="edit-apiUrl"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-apiToken" className="text-xs">API Token</Label>
                  <Input
                    id="edit-apiToken"
                    type="password"
                    value={formData.apiToken}
                    onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Firmware & Last Seen */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">System Info</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-firmwareVersion" className="text-xs">Firmware Version</Label>
                  <Input
                    id="edit-firmwareVersion"
                    value={formData.firmwareVersion}
                    onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastSeen" className="text-xs">Last Seen</Label>
                  <Input
                    id="edit-lastSeen"
                    type="date"
                    value={formData.lastSeen}
                    onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
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