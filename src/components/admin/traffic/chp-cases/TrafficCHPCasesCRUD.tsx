// components/admin/traffic/chp-cases/TrafficCHPCasesCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  MoreHorizontal,
  ExternalLink,
  Calendar
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

interface CHPCase {
  id: number;
  caseId: string;
  incidentId: string | null;
  title: string;
  description: string | null;
  caseType: string;
  status: string;
  severity: string;
  location: string | null;
  city: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  reportedDate: string | null;
  resolvedDate: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrafficCHPCasesCRUDProps {
  onModuleUpdate?: () => void;
}

export function TrafficCHPCasesCRUD({ onModuleUpdate }: TrafficCHPCasesCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [cases, setCases] = useState<CHPCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCase, setEditingCase] = useState<CHPCase | null>(null);
  const [formData, setFormData] = useState({
    caseId: '',
    incidentId: '',
    title: '',
    description: '',
    caseType: 'collision',
    status: 'active',
    severity: 'moderate',
    location: '',
    city: '',
    county: '',
    latitude: 37.7749,
    longitude: -122.4194,
    reportedDate: '',
    resolvedDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/traffic/chp-cases');
      const data = await response.json();
      if (data.success) {
        setCases(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch cases', 'error');
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      showToast('Failed to fetch cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.caseId || !formData.title) {
      showToast('Case ID and title are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/chp-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: formData.caseId,
          incidentId: formData.incidentId || null,
          title: formData.title,
          description: formData.description || null,
          caseType: formData.caseType,
          status: formData.status,
          severity: formData.severity,
          location: formData.location || null,
          city: formData.city || null,
          county: formData.county || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          reportedDate: formData.reportedDate || null,
          resolvedDate: formData.resolvedDate || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Case created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          caseId: '',
          incidentId: '',
          title: '',
          description: '',
          caseType: 'collision',
          status: 'active',
          severity: 'moderate',
          location: '',
          city: '',
          county: '',
          latitude: 37.7749,
          longitude: -122.4194,
          reportedDate: '',
          resolvedDate: '',
          isActive: true,
        });
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
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/traffic/chp-cases?id=${editingCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: formData.caseId,
          incidentId: formData.incidentId || null,
          title: formData.title,
          description: formData.description || null,
          caseType: formData.caseType,
          status: formData.status,
          severity: formData.severity,
          location: formData.location || null,
          city: formData.city || null,
          county: formData.county || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          reportedDate: formData.reportedDate || null,
          resolvedDate: formData.resolvedDate || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Case updated successfully', 'success');
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

  const handleDelete = async (id: number, caseId: string) => {
    if (!confirm(`Delete case "${caseId}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/chp-cases?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Case deleted successfully', 'success');
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

  const renderActions = (chpCase: CHPCase) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewCaseDetails(chpCase)}
      >
        <FileText className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openEditDialog(chpCase)}
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
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(chpCase.id, chpCase.caseId)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const viewCaseDetails = (chpCase: CHPCase) => {
    showToast(
      `${chpCase.caseId} - ${chpCase.title}`,
      'info'
    );
  };

  const openEditDialog = (chpCase: CHPCase) => {
    setEditingCase(chpCase);
    setFormData({
      caseId: chpCase.caseId,
      incidentId: chpCase.incidentId || '',
      title: chpCase.title,
      description: chpCase.description || '',
      caseType: chpCase.caseType || 'collision',
      status: chpCase.status || 'active',
      severity: chpCase.severity || 'moderate',
      location: chpCase.location || '',
      city: chpCase.city || '',
      county: chpCase.county || '',
      latitude: chpCase.latitude || 37.7749,
      longitude: chpCase.longitude || -122.4194,
      reportedDate: chpCase.reportedDate || '',
      resolvedDate: chpCase.resolvedDate || '',
      isActive: chpCase.isActive !== false,
    });
  };

  const getCaseTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      collision: 'Collision',
      theft: 'Theft',
      vandalism: 'Vandalism',
      hit_and_run: 'Hit & Run',
      dui: 'DUI',
      pedestrian: 'Pedestrian',
      motorcycle: 'Motorcycle',
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-semibold">CHP Cases</h3>
          <Badge variant="secondary" className="ml-2">
            {cases.length} {cases.length === 1 ? 'case' : 'cases'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New CHP Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="caseId">Case ID *</Label>
                <Input
                  id="caseId"
                  placeholder="e.g., CHP-2024-001"
                  value={formData.caseId}
                  onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="incidentId">Incident ID</Label>
                <Input
                  id="incidentId"
                  placeholder="Related incident ID"
                  value={formData.incidentId}
                  onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Case title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Case description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="caseType">Case Type</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value) => setFormData({ ...formData, caseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collision">Collision</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="vandalism">Vandalism</SelectItem>
                    <SelectItem value="hit_and_run">Hit & Run</SelectItem>
                    <SelectItem value="dui">DUI</SelectItem>
                    <SelectItem value="pedestrian">Pedestrian</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
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
                  <Label htmlFor="resolvedDate">Resolved Date</Label>
                  <Input
                    id="resolvedDate"
                    type="datetime-local"
                    value={formData.resolvedDate}
                    onChange={(e) => setFormData({ ...formData, resolvedDate: e.target.value })}
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
                  'Create Case'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No cases yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first case
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead className="hidden sm:table-cell">Title</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((chpCase) => (
              <TableRow key={chpCase.id}>
                <TableCell className="font-medium">
                  {chpCase.caseId}
                  {chpCase.severity && (
                    <Badge className={`ml-2 text-xs ${getSeverityColor(chpCase.severity)}`}>
                      {chpCase.severity.charAt(0).toUpperCase() + chpCase.severity.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {chpCase.title}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {getCaseTypeLabel(chpCase.caseType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {chpCase.status === 'active' || chpCase.status === 'investigating' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm capitalize">
                      {chpCase.status || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {renderActions(chpCase)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingCase} onOpenChange={(open) => !open && setEditingCase(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Case</DialogTitle>
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
              <Label htmlFor="edit-incidentId">Incident ID</Label>
              <Input
                id="edit-incidentId"
                value={formData.incidentId}
                onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
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
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-caseType">Case Type</Label>
              <Select
                value={formData.caseType}
                onValueChange={(value) => setFormData({ ...formData, caseType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collision">Collision</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="hit_and_run">Hit & Run</SelectItem>
                  <SelectItem value="dui">DUI</SelectItem>
                  <SelectItem value="pedestrian">Pedestrian</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
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
                <Label htmlFor="edit-resolvedDate">Resolved Date</Label>
                <Input
                  id="edit-resolvedDate"
                  type="datetime-local"
                  value={formData.resolvedDate}
                  onChange={(e) => setFormData({ ...formData, resolvedDate: e.target.value })}
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