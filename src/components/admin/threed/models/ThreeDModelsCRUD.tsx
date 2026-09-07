// components/admin/threed/models/ThreeDModelsCRUD.tsx — v0.16.4-beta
// Full CRUD for the ThreeD `threed_models` library with relational file management
// (model files, textures, and supportive media) backed by Vercel Blob storage.
'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Box,
  MoreHorizontal,
  Search,
  File,
  Clapperboard,
  FolderOpen,
  FolderTree,
  Images,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import type { ThreeDModelCategoryOption } from './ThreeDModelCategoriesManager';
import {
  buildThreeDModelAdminPayload,
  createEmptyThreeDModelAdminForm,
  ThreeDModelFormValidationError,
  type ThreeDModelAdminFormData,
} from './model-admin-form-core';
import {
  MODEL_STATUS_OPTIONS,
  MODEL_TYPE_OPTIONS,
  ThreeDModelEditorFields,
  type ThreeDModelUploadAnalysis,
} from './ThreeDModelEditorFields';
import { ThreeDModelAssetPreview } from './ThreeDModelAssetPreview';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';

// ============================================
// TYPES
// ============================================
interface ModelFile {
  id: number;
  fileName: string;
  relativePath: string;
  fileType: string;
  textureType: string | null;
  filePath: string;
  fileSize: number | null;
  isBinaryBuffer: boolean;
  loadOrder: number;
  createdAt: string;
}

interface Model {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  usedByPlants: boolean | null;
  usedByCharacters: boolean | null;
  scale: string;
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  hasLOD: boolean;
  lodLevels: any;
  animations: string[];
  defaultAnimation: string | null;
  hasExternalFiles: boolean;
  textureCount: number;
  mainModelFileId: number | null;
  isActive: boolean;
  status: string;
  isDefault: boolean;
  isPublic: boolean;
  isLibraryItem: boolean;
  uploadedBy: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  files?: ModelFile[];
  categories?: ThreeDModelCategoryOption[];
}

interface PendingPrimaryModelFile {
  fileName: string;
  filePath: string;
  fileSize: number;
  modelType: string;
}

// ============================================
// HELPERS
// ============================================
const getOptionLabel = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'maintenance': return 'bg-orange-100 text-orange-700';
    case 'dormant': return 'bg-blue-100 text-blue-700';
    case 'retired': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const formatFileSize = (bytes: number | null): string =>
  bytes === null
    ? '—'
    : bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// ============================================
// COMPONENT
// ============================================
export function ThreeDModelsCRUD({ onModuleUpdate }: { onModuleUpdate?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<ThreeDModelCategoryOption[]>([]);

  // v0.16.4-alpha/beta: Vercel Blob upload state
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadAnalysis, setUploadAnalysis] = useState<ThreeDModelUploadAnalysis | null>(null);
  const [pendingPrimaryFile, setPendingPrimaryFile] = useState<PendingPrimaryModelFile | null>(null);

  const [formData, setFormData] = useState<ThreeDModelAdminFormData>(createEmptyThreeDModelAdminForm);
  const importerPreviewModel = useMemo<ModelData | null>(() => {
    if (!formData.filePath.trim()) return null;
    return {
      id: 0,
      modelName: formData.modelName.trim() || pendingPrimaryFile?.fileName || 'New Model',
      modelType: formData.modelType,
      filePath: formData.filePath,
      scale: formData.scale,
      rotationY: formData.rotationY,
      offsetX: formData.offsetX,
      offsetY: formData.offsetY,
      offsetZ: formData.offsetZ,
      defaultAnimation: formData.defaultAnimation || null,
      files: [],
    };
  }, [
    formData.defaultAnimation,
    formData.filePath,
    formData.modelName,
    formData.modelType,
    formData.offsetX,
    formData.offsetY,
    formData.offsetZ,
    formData.rotationY,
    formData.scale,
    pendingPrimaryFile?.fileName,
  ]);

  useEffect(() => {
    fetchModels();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch('/api/threed/model-categories');
      const data = await response.json();
      setCategories(response.ok && data.success && Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching Model categories:', error);
      setCategories([]);
    }
  }

  async function fetchModels() {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/models?limit=200');
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
  }

  const filteredModels = models.filter((model) =>
    model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.modelType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function discardPendingPrimaryUpload(file: PendingPrimaryModelFile): Promise<boolean> {
    try {
      const response = await fetch('/api/threed/models/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: file.filePath }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showToast(data.error || 'Failed to discard the previous Model upload', 'error');
        return false;
      }
      setPendingPrimaryFile((current) => current?.filePath === file.filePath ? null : current);
      return true;
    } catch (error) {
      console.error('Failed to discard staged primary Model upload', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToast('Failed to discard the previous Model upload', 'error');
      return false;
    }
  }

  // Upload the primary model file (GLB/GLTF/FBX/OBJ/USDZ) to Vercel Blob.
  async function handlePrimaryFileUpload(file: File) {
    if (!file) return;
    if (pendingPrimaryFile && !(await discardPendingPrimaryUpload(pendingPrimaryFile))) return;
    setUploadingPrimary(true);
    setUploadAnalysis(null);
    setPendingPrimaryFile(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await fetch('/api/threed/models/upload', { method: 'POST', body: fd });
      const data = await response.json();
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          modelName: prev.modelName.trim() ? prev.modelName : data.data.suggestedModelName,
          filePath: data.data.url,
          fileSize: String(data.data.fileSize || ''),
          modelType: MODEL_TYPE_OPTIONS.some((o) => o.value === data.data.modelType)
            ? data.data.modelType
            : 'custom',
        }));
        setUploadAnalysis(data.data.analysis ?? null);
        setPendingPrimaryFile({
          fileName: data.data.fileName,
          filePath: data.data.url,
          fileSize: data.data.fileSize,
          modelType: data.data.modelType,
        });
        showToast(
          data.data.analysis?.status === 'analyzed'
            ? 'Model uploaded and analyzed'
            : 'Model file uploaded',
          'success',
        );
      } else {
        setPendingPrimaryFile(null);
        showToast(data.error || 'Failed to upload model file', 'error');
      }
    } catch (error) {
      console.error('Error uploading primary model file:', error);
      showToast('Failed to upload model file', 'error');
    } finally {
      setUploadingPrimary(false);
    }
  }

  async function handleThumbnailUpload(file: File) {
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('purpose', 'thumbnail');
      const response = await fetch('/api/threed/models/upload', { method: 'POST', body: fd });
      const data = await response.json();
      if (data.success) {
        setFormData((current) => ({ ...current, thumbnailUrl: data.data.url }));
        showToast('Library preview image uploaded', 'success');
      } else {
        showToast(data.error || 'Failed to upload preview image', 'error');
      }
    } catch (error) {
      console.error('Error uploading Model preview image:', error);
      showToast('Failed to upload preview image', 'error');
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      const payload = {
        ...buildThreeDModelAdminPayload(formData),
        primaryFile: pendingPrimaryFile,
      };

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
        onModuleUpdate?.();
      } else {
        showToast(data.error || 'Failed to create model', 'error');
      }
    } catch (error) {
      console.error('Error creating model:', error);
      showToast(
        error instanceof ThreeDModelFormValidationError ? error.message : 'Failed to create model',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editingModel) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...buildThreeDModelAdminPayload(formData),
        primaryFile: pendingPrimaryFile,
      };

      const response = await fetch(`/api/threed/models?id=${editingModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Model updated successfully', 'success');
        setPendingPrimaryFile(null);
        setUploadAnalysis(null);
        setEditingModel(null);
        await fetchModels();
        onModuleUpdate?.();
      } else {
        showToast(data.error || 'Failed to update model', 'error');
      }
    } catch (error) {
      console.error('Error updating model:', error);
      showToast(
        error instanceof ThreeDModelFormValidationError ? error.message : 'Failed to update model',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete model "${name}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/threed/models?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Model deleted successfully', 'success');
        await fetchModels();
        onModuleUpdate?.();
      } else {
        showToast(data.error || 'Failed to delete model', 'error');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      showToast('Failed to delete model', 'error');
    }
  }

  function resetForm() {
    setFormData(createEmptyThreeDModelAdminForm());
    setUploadAnalysis(null);
    setPendingPrimaryFile(null);
  }

  function openEditDialog(model: Model) {
    setUploadAnalysis(null);
    setPendingPrimaryFile(null);
    setEditingModel(model);
    setFormData({
      modelName: model.modelName,
      modelType: model.modelType,
      filePath: model.filePath,
      fileSize: model.fileSize ? String(model.fileSize) : '',
      thumbnailUrl: model.thumbnailUrl || '',
      usedByPlants: model.usedByPlants ?? false,
      usedByCharacters: model.usedByCharacters ?? false,
      scale: model.scale || '1.0',
      rotationY: model.rotationY || '0.0',
      offsetX: model.offsetX || '0.0',
      offsetY: model.offsetY || '0.0',
      offsetZ: model.offsetZ || '0.0',
      hasLOD: model.hasLOD ?? false,
      lodLevels: JSON.stringify(model.lodLevels || {}),
      animations: JSON.stringify(model.animations || []),
      defaultAnimation: model.defaultAnimation || '',
      mainModelFileId: model.mainModelFileId ? String(model.mainModelFileId) : '',
      isActive: model.isActive ?? true,
      status: model.status || 'active',
      isDefault: model.isDefault ?? false,
      isPublic: model.isPublic ?? false,
      isLibraryItem: model.isLibraryItem ?? false,
      uploadedBy: model.uploadedBy || '',
      metadata: JSON.stringify(model.metadata || {}),
      categoryIds: (model.categories ?? []).map((category) => category.id),
    });
  }

  function handleCreateDialogChange(open: boolean) {
    if (open) {
      resetForm();
      setShowCreateDialog(true);
      return;
    }
    if (isSubmitting) return;
    const stagedFile = pendingPrimaryFile;
    setShowCreateDialog(false);
    resetForm();
    if (stagedFile) void discardPendingPrimaryUpload(stagedFile);
  }

  function handleEditDialogChange(open: boolean) {
    if (open || isSubmitting) return;
    const stagedFile = pendingPrimaryFile;
    setEditingModel(null);
    setUploadAnalysis(null);
    setPendingPrimaryFile(null);
    if (stagedFile) void discardPendingPrimaryUpload(stagedFile);
  }

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

      <AdminWorkspaceHeader
        icon={Box}
        title="Models"
        description="Add and manage one reusable ThreeD Model at a time"
      >
        <Badge variant="secondary" className="text-xs">{filteredModels.length}</Badge>
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or type..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Dialog open={showCreateDialog} onOpenChange={handleCreateDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 px-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]">
              <DialogHeader className="border-b px-5 py-4">
                <DialogTitle>Import New Model</DialogTitle>
              </DialogHeader>
              <div className="grid min-h-0 md:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                <div className="border-b bg-slate-950/40 p-4 md:border-b-0 md:border-r">
                  <ThreeDModelAssetPreview
                    model={importerPreviewModel}
                    attachedDependencyCount={0}
                    dependencyCount={0}
                    title="Importer Canvas"
                    description="Upload a Model, then adjust its transform and inspect every change here before creation."
                    canvasClassName="h-[min(68vh,680px)] min-h-[420px]"
                  />
                </div>
                <div className="max-h-[calc(92vh-73px)] overflow-y-auto">
                  <div className="space-y-4 p-5">
                    <ThreeDModelEditorFields
                      mode="create"
                      form={formData}
                      setForm={setFormData}
                      categories={categories}
                      isSubmitting={isSubmitting}
                      uploadingPrimary={uploadingPrimary}
                      uploadingThumbnail={uploadingThumbnail}
                      uploadAnalysis={uploadAnalysis}
                      onPrimaryFile={handlePrimaryFileUpload}
                      onThumbnail={handleThumbnailUpload}
                    />
                    <div className="sticky bottom-0 border-t bg-background/95 pt-3 backdrop-blur">
                      <Button onClick={handleCreate} className="w-full" disabled={isSubmitting || uploadingPrimary || !formData.filePath.trim()}>
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Model'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Link href="/admin/threed/model-categories">
              <FolderTree className="mr-1 h-3 w-3" /> Model Categories
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Link href="/admin/threed/model-animations">
              <Clapperboard className="mr-1 h-3 w-3" /> Model Animations
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Link href="/admin/threed/model-files">
              <FolderOpen className="mr-1 h-3 w-3" /> Model Files
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Link href="/admin/threed/model-textures">
              <Images className="mr-1 h-3 w-3" /> Model Textures
            </Link>
          </Button>
        </div>
      </AdminWorkspaceHeader>

      {/* Models table */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No Models found</p>
          <Button variant="outline" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => handleCreateDialogChange(true)}>
            <Plus className="w-3 h-3 mr-1" /> Create your first model
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Files</TableHead>
                <TableHead className="hidden xl:table-cell text-xs py-1">Size</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => {
                const files = model.files ?? [];
                const modelFiles = files.filter((f) => f.fileType === 'model').length;
                const texCount = files.filter((f) => f.fileType === 'texture').length;
                return (
                  <TableRow key={model.id} className="hover:bg-muted/50">
                    <TableCell className="py-1 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Box className="w-3.5 h-3.5 text-blue-500" />
                        {model.modelName}
                        {model.isDefault && <Badge variant="default" className="text-[10px]">Default</Badge>}
                        {model.isPublic && <Badge variant="outline" className="text-[10px]">Public</Badge>}
                        {model.isLibraryItem && <Badge variant="outline" className="text-[10px]">Library</Badge>}
                        {model.usedByPlants && <Badge variant="outline" className="text-[10px]">Plants</Badge>}
                        {model.usedByCharacters && <Badge variant="outline" className="text-[10px]">Characters</Badge>}
                        {(model.categories ?? []).map((category) => (
                          <Badge key={category.id} variant="secondary" className="text-[10px]">{category.name}</Badge>
                        ))}
                        {!model.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-1">
                      <Badge variant="outline" className="text-[10px]">{getOptionLabel(MODEL_TYPE_OPTIONS, model.modelType)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-1">
                      <Badge className={`text-[10px] ${getStatusColor(model.status)}`}>{getOptionLabel(MODEL_STATUS_OPTIONS, model.status)}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                      {modelFiles} model · {texCount} tex
                    </TableCell>
                    <TableCell className="hidden xl:table-cell py-1 text-sm text-muted-foreground">{formatFileSize(model.fileSize)}</TableCell>
                    <TableCell className="text-center py-1">
                      <Badge className={`text-[10px] ${model.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {model.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/threed/model-files?modelId=${model.id}`} title={`Manage files for ${model.modelName}`}>
                            <File className="w-4 h-4" />
                            <span className="sr-only">Manage files</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(model)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(model.id, model.modelName)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingModel} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit 3D Model</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <ThreeDModelEditorFields
              mode="edit"
              form={formData}
              setForm={setFormData}
              categories={categories}
              files={editingModel?.files}
              isSubmitting={isSubmitting}
              uploadingPrimary={uploadingPrimary}
              uploadingThumbnail={uploadingThumbnail}
              uploadAnalysis={uploadAnalysis}
              onPrimaryFile={handlePrimaryFileUpload}
              onThumbnail={handleThumbnailUpload}
            />

            <Button onClick={handleUpdate} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
