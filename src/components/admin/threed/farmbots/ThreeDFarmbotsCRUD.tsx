// components/admin/threed/farmbots/ThreeDFarmbotsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Drone,
  MoreHorizontal,
  Search,
  Filter,
  X,
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

// ✅ Import types from lib
import {
  ThreeDFarmbot,
  ThreeDFarmbotFormData,
  ThreeDRelatedEntity,
  FarmbotStatus,
  FARMBOT_STATUS_OPTIONS,
} from '@/lib/types/threed';

interface ThreeDFarmbotsCRUDProps {
  threedId?: number;
  onModuleUpdate?: () => void;
}

// ✅ Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-100 text-green-700 border-green-200';
    case 'offline': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'error': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'online': return '🟢';
    case 'offline': return '🔴';
    case 'maintenance': return '🟡';
    case 'error': return '🔴';
    default: return '⚪';
  }
};

export function ThreeDFarmbotsCRUD({ threedId, onModuleUpdate }: ThreeDFarmbotsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [farmbots, setFarmbots] = useState<ThreeDFarmbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFarmbot, setEditingFarmbot] = useState<ThreeDFarmbot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // ✅ State for related entity options (Beds)
  const [beds, setBeds] = useState<ThreeDRelatedEntity[]>([]);

  // ✅ Form state
  const [formData, setFormData] = useState<ThreeDFarmbotFormData>({
    name: '',
    deviceId: '',
    status: FarmbotStatus.OFFLINE,
    bedId: '',
    positionX: '0',
    positionY: '0',
    positionZ: '0',
    apiToken: '',
    apiUrl: '',
    firmwareVersion: '',
    notes: '',
    isActive: true,
  });

  // ✅ Track selected bed for display
  const [selectedBed, setSelectedBed] = useState<ThreeDRelatedEntity | null>(null);

  useEffect(() => {
    fetchFarmbots();
    fetchBeds();
  }, [threedId]);

  const fetchFarmbots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      if (threedId) params.append('moduleId', String(threedId));

      const response = await fetch(`/api/threed/farmbots?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFarmbots(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch FarmBots', 'error');
        setFarmbots([]);
      }
    } catch (error) {
      console.error('Error fetching FarmBots:', error);
      showToast('Failed to fetch FarmBots', 'error');
      setFarmbots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const response = await fetch('/api/threed/beds?isActive=true');
      const data = await response.json();
      if (data.success) {
        setBeds(data.data.map((b: any) => ({
          id: b.id,
          name: b.name || `Bed #${b.id}`,
          bedId: b.bedId,
          description: b.description,
        })));
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
    if (!formData.name) {
      showToast('FarmBot name is required', 'error');
      return;
    }

    if (!formData.deviceId) {
      showToast('Device ID is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        deviceId: formData.deviceId.trim(),
        status: formData.status,
        bedId: selectedBed?.id || null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        apiToken: formData.apiToken || null,
        apiUrl: formData.apiUrl || null,
        firmwareVersion: formData.firmwareVersion || null,
        notes: formData.notes || null,
        isActive: formData.isActive,
      };

      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

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
        showToast(data.error || 'Failed to create FarmBot', 'error');
      }
    } catch (error) {
      console.error('Error creating FarmBot:', error);
      showToast('Failed to create FarmBot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFarmbot) return;
    if (!formData.name) {
      showToast('FarmBot name is required', 'error');
      return;
    }

    if (!formData.deviceId) {
      showToast('Device ID is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        deviceId: formData.deviceId.trim(),
        status: formData.status,
        bedId: selectedBed?.id || null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        apiToken: formData.apiToken || null,
        apiUrl: formData.apiUrl || null,
        firmwareVersion: formData.firmwareVersion || null,
        notes: formData.notes || null,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/threed/farmbots?id=${editingFarmbot.id}`, {
        method: 'PUT',
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
        showToast(data.error || 'Failed to update FarmBot', 'error');
      }
    } catch (error) {
      console.error('Error updating FarmBot:', error);
      showToast('Failed to update FarmBot', 'error');
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
        showToast(data.error || 'Failed to delete FarmBot', 'error');
      }
    } catch (error) {
      console.error('Error deleting FarmBot:', error);
      showToast('Failed to delete FarmBot', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      deviceId: '',
      status: FarmbotStatus.OFFLINE,
      bedId: '',
      positionX: '0',
      positionY: '0',
      positionZ: '0',
      apiToken: '',
      apiUrl: '',
      firmwareVersion: '',
      notes: '',
      isActive: true,
    });
    setSelectedBed(null);
  };

  const openEditDialog = (farmbot: ThreeDFarmbot) => {
    setEditingFarmbot(farmbot);
    
    // ✅ Find selected bed
    const bed = beds.find(b => b.id === farmbot.bedId) || null;
    setSelectedBed(bed);

    setFormData({
      name: farmbot.name,
      deviceId: farmbot.deviceId,
      status: farmbot.status || FarmbotStatus.OFFLINE,
      bedId: farmbot.bedId ? String(farmbot.bedId) : '',
      positionX: farmbot.positionX ? String(farmbot.positionX) : '0',
      positionY: farmbot.positionY ? String(farmbot.positionY) : '0',
      positionZ: farmbot.positionZ ? String(farmbot.positionZ) : '0',
      apiToken: farmbot.apiToken || '',
      apiUrl: farmbot.apiUrl || '',
      firmwareVersion: farmbot.firmwareVersion || '',
      notes: farmbot.notes || '',
      isActive: farmbot.isActive !== undefined ? farmbot.isActive : true,
    });
  };

  const renderActions = (farmbot: ThreeDFarmbot) => (
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
          {farmbot.batteryLevel !== null && farmbot.batteryLevel !== undefined && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">🔋 Battery: {farmbot.batteryLevel}%</span>
            </DropdownMenuItem>
          )}
          {farmbot.firmwareVersion && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">📦 Firmware: {farmbot.firmwareVersion}</span>
            </DropdownMenuItem>
          )}
          {farmbot.lastSeen && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">🕐 Last seen: {new Date(farmbot.lastSeen).toLocaleDateString()}</span>
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
          <Drone className="w-4 h-4 text-cyan-500" />
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
                <Label htmlFor="name">FarmBot Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Garden Bot 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="deviceId">Device ID *</Label>
                <Input
                  id="deviceId"
                  placeholder="e.g., fb-001"
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as FarmbotStatus })}
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

              {/* Bed Selection */}
              <div>
                <Label htmlFor="bedId" className="text-xs">Associated Bed</Label>
                <Select
                  value={selectedBed?.id ? String(selectedBed.id) : 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedBed(null);
                    } else {
                      const bed = beds.find(b => String(b.id) === value);
                      setSelectedBed(bed || null);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a bed..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {beds.map((bed) => (
                      <SelectItem key={bed.id} value={String(bed.id)}>
                        {bed.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBed && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedBed.name}
                      <button
                        type="button"
                        onClick={() => setSelectedBed(null)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Positioning */}
              <div>
                <Label className="text-xs text-muted-foreground">3D Position</Label>
                <div className="grid grid-cols-3 gap-4 mt-1">
                  <div>
                    <Label htmlFor="positionX" className="text-[10px]">X</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionY" className="text-[10px]">Y</Label>
                    <Input
                      id="positionY"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionZ" className="text-[10px]">Z</Label>
                    <Input
                      id="positionZ"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div>
                <Label htmlFor="apiToken">API Token</Label>
                <Input
                  id="apiToken"
                  type="password"
                  placeholder="FarmBot API token"
                  value={formData.apiToken}
                  onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  ⚠️ This will be stored in plain text in the database
                </p>
              </div>

              <div>
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  placeholder="https://my.farmbot.io/api"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="firmwareVersion">Firmware Version</Label>
                <Input
                  id="firmwareVersion"
                  placeholder="v1.0.0"
                  value={formData.firmwareVersion}
                  onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                  disabled={isSubmitting}
                />
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
            placeholder="Search FarmBots..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
          <Drone className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmbots.map((farmbot) => (
                <TableRow key={farmbot.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Drone className="w-3.5 h-3.5 text-cyan-500" />
                      {farmbot.name}
                      {farmbot.bedId && (
                        <Badge variant="outline" className="text-[10px]">
                          Bed #{farmbot.bedId}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {farmbot.deviceId}
                    </code>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm">
                    <Badge className={`text-[10px] border ${getStatusColor(farmbot.status)}`}>
                      {getStatusIcon(farmbot.status)} {farmbot.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {farmbot.isActive ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-700 border-gray-200">
                        Inactive
                      </Badge>
                    )}
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
              <Label htmlFor="edit-name">FarmBot Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

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
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as FarmbotStatus })}
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
              <Label htmlFor="edit-bedId" className="text-xs">Associated Bed</Label>
              <Select
                value={selectedBed?.id ? String(selectedBed.id) : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedBed(null);
                  } else {
                    const bed = beds.find(b => String(b.id) === value);
                    setSelectedBed(bed || null);
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a bed..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {beds.map((bed) => (
                    <SelectItem key={bed.id} value={String(bed.id)}>
                      {bed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBed && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedBed.name}
                    <button
                      type="button"
                      onClick={() => setSelectedBed(null)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">3D Position</Label>
              <div className="grid grid-cols-3 gap-4 mt-1">
                <div>
                  <Label htmlFor="edit-positionX" className="text-[10px]">X</Label>
                  <Input
                    id="edit-positionX"
                    type="number"
                    step="0.5"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionY" className="text-[10px]">Y</Label>
                  <Input
                    id="edit-positionY"
                    type="number"
                    step="0.5"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionZ" className="text-[10px]">Z</Label>
                  <Input
                    id="edit-positionZ"
                    type="number"
                    step="0.5"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-apiToken">API Token</Label>
              <Input
                id="edit-apiToken"
                type="password"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                ⚠️ This will be stored in plain text in the database
              </p>
            </div>

            <div>
              <Label htmlFor="edit-apiUrl">API URL</Label>
              <Input
                id="edit-apiUrl"
                value={formData.apiUrl}
                onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-firmwareVersion">Firmware Version</Label>
              <Input
                id="edit-firmwareVersion"
                value={formData.firmwareVersion}
                onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                disabled={isSubmitting}
              />
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