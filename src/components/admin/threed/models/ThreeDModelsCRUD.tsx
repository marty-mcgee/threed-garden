// components/admin/threed/models/ThreeDModelsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Box,
  MoreHorizontal,
  Search,
  Filter,
  Image as ImageIcon,
  File,
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
  ThreeDModel,
  ThreeDModelFormData,
  ModelType,
  ModelStatus,
  MODEL_TYPE_OPTIONS,
  MODEL_STATUS_OPTIONS,
} from '@/lib/types/threed';

interface ThreeDModelsCRUDProps {
  threedId?: number;
  onModuleUpdate?: () => void;
}

export function ThreeDModelsCRUD({ threedId, onModuleUpdate }: ThreeDModelsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<ThreeDModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<ThreeDModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // ✅ Form state
  const [formData, setFormData] = useState<ThreeDModelFormData>({
    modelName: '',
    modelType: ModelType.CUSTOM,
    filePath: '',
    fileSize: '',
    thumbnailUrl: '',
    scale: '1',
    rotationY: '0',
    offsetX: '0',
    offsetY: '0',
    offsetZ: '0',
    hasLOD: false,
    animations: '',
    defaultAnimation: '',
    hasExternalFiles: false,
    textureCount: '0',
    isActive: true,
    isDefault: false,
    usedByPlants: false,
    usedByCharacters: false,
    uploadedBy: '',
  });

  useEffect(() => {
    fetchModels();
  }, [threedId]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('isActive', filterStatus === 'active' ? 'true' : 'false');
      if (filterType !== 'all') params.append('modelType', filterType);

      const response = await fetch(`/api/threed/models?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setModels(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch models', 'error');
        setModels([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      showToast('Failed to fetch models', 'error');
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter((model) =>
    model.modelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.modelName || !formData.filePath) {
      showToast('Model name and file path are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        modelName: formData.modelName.trim(),
        modelType: formData.modelType,
        filePath: formData.filePath.trim(),
        fileSize: formData.fileSize ? parseInt(formData.fileSize) : null,
        thumbnailUrl: formData.thumbnailUrl || null,
        scale: formData.scale ? parseFloat(formData.scale) : 1,
        rotationY: formData.rotationY ? parseFloat(formData.rotationY) : 0,
        offsetX: formData.offsetX ? parseFloat(formData.offsetX) : 0,
        offsetY: formData.offsetY ? parseFloat(formData.offsetY) : 0,
        offsetZ: formData.offsetZ ? parseFloat(formData.offsetZ) : 0,
        hasLOD: formData.hasLOD,
        animations: formData.animations ? formData.animations.split(',').map(s => s.trim()) : [],
        defaultAnimation: formData.defaultAnimation || null,
        hasExternalFiles: formData.hasExternalFiles,
        textureCount: formData.textureCount ? parseInt(formData.textureCount) : 0,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        usedByPlants: formData.usedByPlants,
        usedByCharacters: formData.usedByCharacters,
        uploadedBy: formData.uploadedBy || null,
      };

      // ✅ Include moduleId if provided
      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

      const response = await fetch('/api/threed/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchModels();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create model', 'error');
      }
    } catch (error) {
      console.error('Error creating model:', error);
      showToast('Failed to create model', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingModel) return;
    if (!formData.modelName || !formData.filePath) {
      showToast('Model name and file path are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        modelName: formData.modelName.trim(),
        modelType: formData.modelType,
        filePath: formData.filePath.trim(),
        fileSize: formData.fileSize ? parseInt(formData.fileSize) : null,
        thumbnailUrl: formData.thumbnailUrl || null,
        scale: formData.scale ? parseFloat(formData.scale) : 1,
        rotationY: formData.rotationY ? parseFloat(formData.rotationY) : 0,
        offsetX: formData.offsetX ? parseFloat(formData.offsetX) : 0,
        offsetY: formData.offsetY ? parseFloat(formData.offsetY) : 0,
        offsetZ: formData.offsetZ ? parseFloat(formData.offsetZ) : 0,
        hasLOD: formData.hasLOD,
        animations: formData.animations ? formData.animations.split(',').map(s => s.trim()) : [],
        defaultAnimation: formData.defaultAnimation || null,
        hasExternalFiles: formData.hasExternalFiles,
        textureCount: formData.textureCount ? parseInt(formData.textureCount) : 0,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        usedByPlants: formData.usedByPlants,
        usedByCharacters: formData.usedByCharacters,
        uploadedBy: formData.uploadedBy || null,
      };

      // ✅ Include moduleId if provided
      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

      const response = await fetch(`/api/threed/models?id=${editingModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model updated successfully', 'success');
        setEditingModel(null);
        await fetchModels();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update model', 'error');
      }
    } catch (error) {
      console.error('Error updating model:', error);
      showToast('Failed to update model', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, modelName: string) => {
    if (!confirm(`Delete model "${modelName}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/models?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model deleted successfully', 'success');
        await fetchModels();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete model', 'error');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      showToast('Failed to delete model', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      modelName: '',
      modelType: ModelType.CUSTOM,
      filePath: '',
      fileSize: '',
      thumbnailUrl: '',
      scale: '1',
      rotationY: '0',
      offsetX: '0',
      offsetY: '0',
      offsetZ: '0',
      hasLOD: false,
      animations: '',
      defaultAnimation: '',
      hasExternalFiles: false,
      textureCount: '0',
      isActive: true,
      isDefault: false,
      usedByPlants: false,
      usedByCharacters: false,
      uploadedBy: '',
    });
  };

  const openEditDialog = (model: ThreeDModel) => {
    setEditingModel(model);
    setFormData({
      modelName: model.modelName,
      modelType: model.modelType || ModelType.CUSTOM,
      filePath: model.filePath || '',
      fileSize: model.fileSize ? String(model.fileSize) : '',
      thumbnailUrl: model.thumbnailUrl || '',
      scale: model.scale ? String(model.scale) : '1',
      rotationY: model.rotationY ? String(model.rotationY) : '0',
      offsetX: model.offsetX ? String(model.offsetX) : '0',
      offsetY: model.offsetY ? String(model.offsetY) : '0',
      offsetZ: model.offsetZ ? String(model.offsetZ) : '0',
      hasLOD: model.hasLOD || false,
      animations: Array.isArray(model.animations) ? model.animations.join(', ') : '',
      defaultAnimation: model.defaultAnimation || '',
      hasExternalFiles: model.hasExternalFiles || false,
      textureCount: model.textureCount ? String(model.textureCount) : '0',
      isActive: model.isActive !== undefined ? model.isActive : true,
      isDefault: model.isDefault || false,
      usedByPlants: model.usedByPlants || false,
      usedByCharacters: model.usedByCharacters || false,
      uploadedBy: model.uploadedBy || '',
    });
  };

  const getTypeLabel = (type: string) => {
    const option = MODEL_TYPE_OPTIONS.find((t) => t.value === type);
    return option ? option.label : type;
  };

  const renderActions = (model: ThreeDModel) => (
    <div className="flex items-center justify-end gap-1">
      {model.thumbnailUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(model.thumbnailUrl || '', '_blank')}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(model)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.open(model.filePath, '_blank')}>
            <File className="w-4 h-4 mr-2" />
            View File
          </DropdownMenuItem>
          {model.isDefault && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">Default Model</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(model.id, model.modelName)}
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
          <Box className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">3D Models</span>
          <Badge variant="secondary" className="text-xs">
            {filteredModels.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New 3D Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="modelName">Model Name *</Label>
                <Input
                  id="modelName"
                  placeholder="e.g., Tomato Plant"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="modelType">Model Type</Label>
                <Select
                  value={formData.modelType}
                  onValueChange={(value) => setFormData({ ...formData, modelType: value as ModelType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filePath">File Path *</Label>
                <Input
                  id="filePath"
                  placeholder="/models/tomato.glb"
                  value={formData.filePath}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fileSize">File Size (bytes)</Label>
                  <Input
                    id="fileSize"
                    type="number"
                    placeholder="1024"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="textureCount">Texture Count</Label>
                  <Input
                    id="textureCount"
                    type="number"
                    placeholder="0"
                    value={formData.textureCount}
                    onChange={(e) => setFormData({ ...formData, textureCount: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  placeholder="https://example.com/thumb.jpg"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Transform</Label>
                <div className="grid grid-cols-3 gap-4 mt-1">
                  <div>
                    <Label htmlFor="scale" className="text-[10px]">Scale</Label>
                    <Input
                      id="scale"
                      type="number"
                      step="0.1"
                      placeholder="1"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rotationY" className="text-[10px]">Rotation Y</Label>
                    <Input
                      id="rotationY"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.rotationY}
                      onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="offsetX" className="text-[10px]">Offset X</Label>
                    <Input
                      id="offsetX"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.offsetX}
                      onChange={(e) => setFormData({ ...formData, offsetX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="animations">Animations (comma separated)</Label>
                <Input
                  id="animations"
                  placeholder="idle, walk, run"
                  value={formData.animations}
                  onChange={(e) => setFormData({ ...formData, animations: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="defaultAnimation">Default Animation</Label>
                <Input
                  id="defaultAnimation"
                  placeholder="idle"
                  value={formData.defaultAnimation}
                  onChange={(e) => setFormData({ ...formData, defaultAnimation: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="hasLOD"
                    checked={formData.hasLOD}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasLOD: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="hasLOD">Has LOD</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="hasExternalFiles"
                    checked={formData.hasExternalFiles}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasExternalFiles: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="hasExternalFiles">External Files</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isDefault">Default Model</Label>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="usedByPlants"
                    checked={formData.usedByPlants}
                    onCheckedChange={(checked) => setFormData({ ...formData, usedByPlants: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="usedByPlants">Used by Plants</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="usedByCharacters"
                    checked={formData.usedByCharacters}
                    onCheckedChange={(checked) => setFormData({ ...formData, usedByCharacters: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="usedByCharacters">Used by Characters</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="uploadedBy">Uploaded By</Label>
                <Input
                  id="uploadedBy"
                  placeholder="Username"
                  value={formData.uploadedBy}
                  onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Model'
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
            placeholder="Search models..."
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
            {MODEL_STATUS_OPTIONS.map((status) => (
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
            {MODEL_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
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
            fetchModels();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Models Table */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No models found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first model
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">File</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {model.thumbnailUrl ? (
                        <img
                          src={model.thumbnailUrl}
                          alt={model.modelName}
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : (
                        <Box className="w-4 h-4 text-purple-500" />
                      )}
                      {model.modelName}
                      {model.isDefault && (
                        <Badge variant="secondary" className="text-[10px]">Default</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {getTypeLabel(model.modelType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 truncate max-w-[150px]">
                      <File className="w-3 h-3" />
                      {model.filePath.split('/').pop()}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {model.isActive ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-700">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(model)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-modelName">Model Name *</Label>
              <Input
                id="edit-modelName"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-modelType">Model Type</Label>
              <Select
                value={formData.modelType}
                onValueChange={(value) => setFormData({ ...formData, modelType: value as ModelType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-filePath">File Path *</Label>
              <Input
                id="edit-filePath"
                value={formData.filePath}
                onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fileSize">File Size (bytes)</Label>
                <Input
                  id="edit-fileSize"
                  type="number"
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-textureCount">Texture Count</Label>
                <Input
                  id="edit-textureCount"
                  type="number"
                  value={formData.textureCount}
                  onChange={(e) => setFormData({ ...formData, textureCount: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="edit-thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Transform</Label>
              <div className="grid grid-cols-3 gap-4 mt-1">
                <div>
                  <Label htmlFor="edit-scale" className="text-[10px]">Scale</Label>
                  <Input
                    id="edit-scale"
                    type="number"
                    step="0.1"
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rotationY" className="text-[10px]">Rotation Y</Label>
                  <Input
                    id="edit-rotationY"
                    type="number"
                    step="0.1"
                    value={formData.rotationY}
                    onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-offsetX" className="text-[10px]">Offset X</Label>
                  <Input
                    id="edit-offsetX"
                    type="number"
                    step="0.1"
                    value={formData.offsetX}
                    onChange={(e) => setFormData({ ...formData, offsetX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-animations">Animations</Label>
              <Input
                id="edit-animations"
                value={formData.animations}
                onChange={(e) => setFormData({ ...formData, animations: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-defaultAnimation">Default Animation</Label>
              <Input
                id="edit-defaultAnimation"
                value={formData.defaultAnimation}
                onChange={(e) => setFormData({ ...formData, defaultAnimation: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-hasLOD"
                  checked={formData.hasLOD}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasLOD: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-hasLOD">Has LOD</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-hasExternalFiles"
                  checked={formData.hasExternalFiles}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasExternalFiles: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-hasExternalFiles">External Files</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isDefault">Default Model</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-usedByPlants"
                  checked={formData.usedByPlants}
                  onCheckedChange={(checked) => setFormData({ ...formData, usedByPlants: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-usedByPlants">Used by Plants</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-usedByCharacters"
                  checked={formData.usedByCharacters}
                  onCheckedChange={(checked) => setFormData({ ...formData, usedByCharacters: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-usedByCharacters">Used by Characters</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-uploadedBy">Uploaded By</Label>
              <Input
                id="edit-uploadedBy"
                value={formData.uploadedBy}
                onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
                disabled={isSubmitting}
              />
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