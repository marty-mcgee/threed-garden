// components/admin/threed/models/ThreeDModelsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  MoreHorizontal,
  ExternalLink,
  Download
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

interface Model {
  id: number;
  modelName: string;
  description: string | null;
  modelType: string;
  filePath: string | null;
  thumbnailPath: string | null;
  scale: number;
  category: string;
  tags: string[] | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ThreeDModelsCRUDProps {
  onModuleUpdate?: () => void;
}

export function ThreeDModelsCRUD({ onModuleUpdate }: ThreeDModelsCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState({
    modelName: '',
    description: '',
    modelType: 'gltf',
    filePath: '',
    thumbnailPath: '',
    scale: 1,
    category: 'plant',
    tags: '',
    isActive: true,
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/models');
      const data = await response.json();
      if (data.success) {
        setModels(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch models', 'error');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      showToast('Failed to fetch models', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.modelName) {
      showToast('Model name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/threed/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: formData.modelName,
          description: formData.description || null,
          modelType: formData.modelType,
          filePath: formData.filePath || null,
          thumbnailPath: formData.thumbnailPath || null,
          scale: formData.scale,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          modelName: '',
          description: '',
          modelType: 'gltf',
          filePath: '',
          thumbnailPath: '',
          scale: 1,
          category: 'plant',
          tags: '',
          isActive: true,
        });
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
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threed/models?id=${editingModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: formData.modelName,
          description: formData.description || null,
          modelType: formData.modelType,
          filePath: formData.filePath || null,
          thumbnailPath: formData.thumbnailPath || null,
          scale: formData.scale,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
          isActive: formData.isActive,
        }),
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

  const renderActions = (model: Model) => (
    <div className="flex items-center justify-end gap-1">
      {model.thumbnailPath && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(model.thumbnailPath!, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openEditDialog(model)}
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
          {model.filePath && (
            <DropdownMenuItem onClick={() => window.open(model.filePath!, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Download Model
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

  const openEditDialog = (model: Model) => {
    setEditingModel(model);
    setFormData({
      modelName: model.modelName,
      description: model.description || '',
      modelType: model.modelType || 'gltf',
      filePath: model.filePath || '',
      thumbnailPath: model.thumbnailPath || '',
      scale: model.scale || 1,
      category: model.category || 'plant',
      tags: model.tags ? model.tags.join(', ') : '',
      isActive: model.isActive !== false,
    });
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      plant: 'Plant',
      tree: 'Tree',
      flower: 'Flower',
      building: 'Building',
      furniture: 'Furniture',
      tool: 'Tool',
      character: 'Character',
      animal: 'Animal',
      decorative: 'Decorative',
    };
    return categories[category] || category;
  };

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">3D Models</span>
          <Badge variant="secondary" className="text-xs">
            {models.length}
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Model description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="modelType">Model Type</Label>
                <Select
                  value={formData.modelType}
                  onValueChange={(value) => setFormData({ ...formData, modelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gltf">GLTF</SelectItem>
                    <SelectItem value="glb">GLB</SelectItem>
                    <SelectItem value="fbx">FBX</SelectItem>
                    <SelectItem value="obj">OBJ</SelectItem>
                    <SelectItem value="stl">STL</SelectItem>
                    <SelectItem value="threejs">Three.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plant">Plant</SelectItem>
                    <SelectItem value="tree">Tree</SelectItem>
                    <SelectItem value="flower">Flower</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="animal">Animal</SelectItem>
                    <SelectItem value="decorative">Decorative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filePath">File Path/URL</Label>
                <Input
                  id="filePath"
                  placeholder="https://example.com/model.gltf"
                  value={formData.filePath}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="thumbnailPath">Thumbnail URL</Label>
                <Input
                  id="thumbnailPath"
                  placeholder="https://example.com/thumbnail.jpg"
                  value={formData.thumbnailPath}
                  onChange={(e) => setFormData({ ...formData, thumbnailPath: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="scale">Scale</Label>
                <Input
                  id="scale"
                  type="number"
                  step="0.1"
                  placeholder="1"
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: parseFloat(e.target.value) || 1 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="plant, vegetable, green"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
                  'Create Model'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No 3D models yet</p>
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
                <TableHead className="hidden md:table-cell text-xs py-1">Category</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    {model.modelName}
                    {model.tags && model.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {model.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                        {model.tags.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{model.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground uppercase">
                    {model.modelType}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {getCategoryLabel(model.category)}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      {model.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs">
                        {model.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-right">
                    {renderActions(model)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit 3D Model</DialogTitle>
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
              <Label htmlFor="edit-modelType">Model Type</Label>
              <Select
                value={formData.modelType}
                onValueChange={(value) => setFormData({ ...formData, modelType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gltf">GLTF</SelectItem>
                  <SelectItem value="glb">GLB</SelectItem>
                  <SelectItem value="fbx">FBX</SelectItem>
                  <SelectItem value="obj">OBJ</SelectItem>
                  <SelectItem value="stl">STL</SelectItem>
                  <SelectItem value="threejs">Three.js</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plant">Plant</SelectItem>
                  <SelectItem value="tree">Tree</SelectItem>
                  <SelectItem value="flower">Flower</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="animal">Animal</SelectItem>
                  <SelectItem value="decorative">Decorative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-filePath">File Path/URL</Label>
              <Input
                id="edit-filePath"
                value={formData.filePath}
                onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-thumbnailPath">Thumbnail URL</Label>
              <Input
                id="edit-thumbnailPath"
                value={formData.thumbnailPath}
                onChange={(e) => setFormData({ ...formData, thumbnailPath: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-scale">Scale</Label>
              <Input
                id="edit-scale"
                type="number"
                step="0.1"
                value={formData.scale}
                onChange={(e) => setFormData({ ...formData, scale: parseFloat(e.target.value) || 1 })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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