// components/admin/threed/models/ThreeDModelsCRUD.tsx — v0.16.4-beta
// Full CRUD for the ThreeD `threed_models` library with relational file management
// (model files, textures, and supportive media) backed by Vercel Blob storage.
'use client';

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
  Image,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

// ============================================
// TYPES
// ============================================
interface ModelFile {
  id: number;
  fileName: string;
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
  uploadedBy: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  files?: ModelFile[];
}

interface FormData {
  modelName: string;
  modelType: string;
  filePath: string;
  fileSize: string;
  thumbnailUrl: string;
  scale: string;
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  hasLOD: boolean;
  lodLevels: string;
  animations: string;
  defaultAnimation: string;
  mainModelFileId: string;
  isActive: boolean;
  status: string;
  isDefault: boolean;
  uploadedBy: string;
  metadata: string;
}

// ============================================
// OPTIONS
// ============================================
const MODEL_TYPE_OPTIONS = [
  { value: 'procedural', label: 'Procedural' },
  { value: 'gltf', label: 'GLTF' },
  { value: 'glb', label: 'GLB' },
  { value: 'fbx', label: 'FBX' },
  { value: 'usdz', label: 'USDZ' },
  { value: 'obj', label: 'OBJ' },
  { value: 'herb-generic', label: 'Herb - Generic' },
  { value: 'vegetable-generic', label: 'Vegetable - Generic' },
  { value: 'flower-generic', label: 'Flower - Generic' },
  { value: 'fruit-generic', label: 'Fruit - Generic' },
  { value: 'tree-generic', label: 'Tree - Generic' },
  { value: 'custom', label: 'Custom' },
];

const MODEL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'dormant', label: 'Dormant' },
  { value: 'retired', label: 'Retired' },
];

const ANIMATION_OPTIONS = [
  { value: 'idle', label: 'Idle' },
  { value: 'grow', label: 'Grow' },
  { value: 'flower', label: 'Flower' },
  { value: 'sway', label: 'Sway' },
];

const FILE_CATEGORY_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'model', label: 'Model File' },
  { value: 'texture', label: 'Texture' },
  { value: 'binary', label: 'Binary Buffer (.bin)' },
  { value: 'other', label: 'Supportive Media / Other' },
];

const FILE_TYPE_META: Record<string, { icon: 'box' | 'image' | 'file'; color: string }> = {
  model: { icon: 'box', color: 'text-blue-500' },
  texture: { icon: 'image', color: 'text-green-500' },
  binary: { icon: 'file', color: 'text-orange-500' },
  other: { icon: 'file', color: 'text-gray-500' },
};

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

function FileIcon({ type }: { type: string }) {
  const meta = FILE_TYPE_META[type] ?? { icon: 'file', color: 'text-gray-500' };
  if (meta.icon === 'box') return <Box className={`w-4 h-4 ${meta.color}`} />;
  if (meta.icon === 'image') return <Image className={`w-4 h-4 ${meta.color}`} />;
  return <File className={`w-4 h-4 ${meta.color}`} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-4">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="space-y-2 mt-2">{children}</div>
    </div>
  );
}

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
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [filesModel, setFilesModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // v0.16.4-alpha/beta: Vercel Blob upload state
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileCategory, setFileCategory] = useState<string>('auto');
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    modelName: '',
    modelType: '',
    filePath: '',
    fileSize: '',
    thumbnailUrl: '',
    scale: '1.0',
    rotationY: '0.0',
    offsetX: '0.0',
    offsetY: '0.0',
    offsetZ: '0.0',
    hasLOD: false,
    lodLevels: '{}',
    animations: '[]',
    defaultAnimation: '',
    mainModelFileId: '',
    isActive: true,
    status: 'active',
    isDefault: false,
    uploadedBy: '',
    metadata: '{}',
  });

  // Model files of type "model" (candidates for mainModelFileId) on the model being edited.
  const mainModelFileOptions = useMemo(
    () => (editingModel?.files ?? []).filter((f) => f.fileType === 'model'),
    [editingModel],
  );

  // Number of texture files on the currently-connected model (derived, not manually editable).
  const derivedTextureCount = useMemo(
    () => (editingModel?.files ?? filesModel?.files ?? []).filter((f) => f.fileType === 'texture').length,
    [editingModel, filesModel],
  );

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function fetchModelDetail(modelId: number) {
    try {
      const response = await fetch(`/api/threed/models?id=${modelId}`);
      const data = await response.json();
      if (data.success) {
        const model = data.data as Model;
        setFilesModel(model);
        setShowFilesDialog(true);
      } else {
        showToast(data.error || 'Failed to fetch model files', 'error');
      }
    } catch (error) {
      console.error('Error fetching model files:', error);
      showToast('Failed to fetch model files', 'error');
    }
  }

  const filteredModels = models.filter((model) =>
    model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.modelType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Upload the primary model file (GLB/GLTF/FBX/OBJ/USDZ) to Vercel Blob.
  async function handlePrimaryFileUpload(file: File) {
    if (!file) return;
    setUploadingPrimary(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await fetch('/api/threed/models/upload', { method: 'POST', body: fd });
      const data = await response.json();
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          filePath: data.data.url,
          fileSize: String(data.data.fileSize || ''),
          modelType: MODEL_TYPE_OPTIONS.some((o) => o.value === data.data.modelType)
            ? data.data.modelType
            : 'custom',
        }));
        showToast('Model file uploaded', 'success');
      } else {
        showToast(data.error || 'Failed to upload model file', 'error');
      }
    } catch (error) {
      console.error('Error uploading primary model file:', error);
      showToast('Failed to upload model file', 'error');
    } finally {
      setUploadingPrimary(false);
    }
  }

  // Upload additional files/textures/media to an existing model.
  async function handleModelFilesUpload(files: FileList | File[]) {
    if (!filesModel?.id || files.length === 0) return;
    setUploadingFiles(true);
    try {
      const fd = new FormData();
      fd.append('modelId', String(filesModel.id));
      if (fileCategory && fileCategory !== 'auto') fd.append('category', fileCategory);
      Array.from(files).forEach((f) => fd.append('files', f));
      const response = await fetch('/api/threed/models/files', { method: 'POST', body: fd });
      const data = await response.json();
      if (data.success) {
        showToast(`Added ${data.data?.length ?? 0} file(s)`, 'success');
        await fetchModelDetail(filesModel.id);
        await fetchModels();
      } else {
        showToast(data.error || 'Failed to upload model files', 'error');
      }
    } catch (error) {
      console.error('Error uploading model files:', error);
      showToast('Failed to upload model files', 'error');
    } finally {
      setUploadingFiles(false);
    }
  }

  // Delete a single model file (blob + record).
  async function handleDeleteFile(file: ModelFile) {
    if (!confirm(`Delete "${file.fileName}"?`)) return;
    setDeletingFileId(file.id);
    try {
      const response = await fetch(`/api/threed/models/files/${file.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('File deleted', 'success');
        if (filesModel?.id) await fetchModelDetail(filesModel.id);
        await fetchModels();
      } else {
        showToast(data.error || 'Failed to delete file', 'error');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast('Failed to delete file', 'error');
    } finally {
      setDeletingFileId(null);
    }
  }

  async function handleCreate() {
    if (!formData.modelName) return showToast('Model name is required', 'error');
    if (!formData.modelType) return showToast('Model type is required', 'error');
    if (!formData.filePath) return showToast('File path is required', 'error');

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        fileSize: formData.fileSize ? parseInt(formData.fileSize) : null,
        animations: JSON.parse(formData.animations),
        lodLevels: JSON.parse(formData.lodLevels),
        metadata: JSON.parse(formData.metadata),
        mainModelFileId: formData.mainModelFileId ? parseInt(formData.mainModelFileId) : null,
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
      showToast('Failed to create model', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editingModel) return;
    if (!formData.modelName) return showToast('Model name is required', 'error');
    if (!formData.modelType) return showToast('Model type is required', 'error');
    if (!formData.filePath) return showToast('File path is required', 'error');

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        fileSize: formData.fileSize ? parseInt(formData.fileSize) : null,
        animations: JSON.parse(formData.animations),
        lodLevels: JSON.parse(formData.lodLevels),
        metadata: JSON.parse(formData.metadata),
        mainModelFileId: formData.mainModelFileId ? parseInt(formData.mainModelFileId) : null,
      };

      const response = await fetch(`/api/threed/models?id=${editingModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Model updated successfully', 'success');
        setEditingModel(null);
        await fetchModels();
        onModuleUpdate?.();
      } else {
        showToast(data.error || 'Failed to update model', 'error');
      }
    } catch (error) {
      console.error('Error updating model:', error);
      showToast('Failed to update model', 'error');
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
    setFormData({
      modelName: '', modelType: '', filePath: '', fileSize: '', thumbnailUrl: '',
      scale: '1.0', rotationY: '0.0', offsetX: '0.0', offsetY: '0.0', offsetZ: '0.0',
      hasLOD: false, lodLevels: '{}', animations: '[]', defaultAnimation: '',
      mainModelFileId: '', isActive: true, status: 'active', isDefault: false,
      uploadedBy: '', metadata: '{}',
    });
  }

  function openEditDialog(model: Model) {
    setEditingModel(model);
    setFormData({
      modelName: model.modelName,
      modelType: model.modelType,
      filePath: model.filePath,
      fileSize: model.fileSize ? String(model.fileSize) : '',
      thumbnailUrl: model.thumbnailUrl || '',
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
      uploadedBy: model.uploadedBy || '',
      metadata: JSON.stringify(model.metadata || {}),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groupedFiles = (files: ModelFile[]) => {
    const groups: Record<string, ModelFile[]> = { model: [], texture: [], binary: [], other: [] };
    for (const f of files) {
      const key = groups[f.fileType] ? f.fileType : 'other';
      groups[key].push(f);
    }
    return groups;
  };

  return (
    <div className="space-y-2">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">3D Models</span>
          <Badge variant="secondary" className="text-xs">{filteredModels.length}</Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New 3D Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Section title="Basic Info">
                <div>
                  <Label htmlFor="modelName">Model Name *</Label>
                  <Input id="modelName" value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    disabled={isSubmitting} />
                </div>
                <div>
                  <Label htmlFor="modelType">Model Type *</Label>
                  <Select value={formData.modelType} onValueChange={(v) => setFormData({ ...formData, modelType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select model type" /></SelectTrigger>
                    <SelectContent>
                      {MODEL_TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </Section>

              <Section title="Model File">
                <div>
                  <Label htmlFor="filePath">File Path / URL *</Label>
                  <Input id="filePath" value={formData.filePath}
                    onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                    disabled={isSubmitting} placeholder="/models/tomato.glb" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="model-file-upload" type="file" className="hidden"
                    accept=".glb,.gltf,.fbx,.obj,.usdz"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePrimaryFileUpload(f); e.target.value = ''; }}
                    disabled={uploadingPrimary} />
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs"
                    onClick={() => document.getElementById('model-file-upload')?.click()} disabled={uploadingPrimary}>
                    {uploadingPrimary ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                    Upload Model File
                  </Button>
                  {formData.filePath && <span className="text-xs text-muted-foreground truncate">✓ uploaded</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fileSize" className="text-xs">File Size (bytes)</Label>
                    <Input id="fileSize" type="number" min="0" value={formData.fileSize}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="thumbnailUrl" className="text-xs">Thumbnail URL</Label>
                    <Input id="thumbnailUrl" value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} disabled={isSubmitting} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Add textures and supportive media after creating the model (via the Files dialog).
                </p>
              </Section>

              <Section title="Transform">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="scale" className="text-xs">Scale</Label>
                    <Input id="scale" type="number" step="0.01" min="0.01" value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="rotationY" className="text-xs">Rotation Y</Label>
                    <Input id="rotationY" type="number" step="1" value={formData.rotationY}
                      onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })} disabled={isSubmitting} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Offset (X / Y / Z)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input placeholder="X" type="number" step="0.01" value={formData.offsetX}
                      onChange={(e) => setFormData({ ...formData, offsetX: e.target.value })} disabled={isSubmitting} />
                    <Input placeholder="Y" type="number" step="0.01" value={formData.offsetY}
                      onChange={(e) => setFormData({ ...formData, offsetY: e.target.value })} disabled={isSubmitting} />
                    <Input placeholder="Z" type="number" step="0.01" value={formData.offsetZ}
                      onChange={(e) => setFormData({ ...formData, offsetZ: e.target.value })} disabled={isSubmitting} />
                  </div>
                </div>
              </Section>

              <Section title="LOD & Animation">
                <div className="flex items-center gap-2">
                  <Switch id="hasLOD" checked={formData.hasLOD}
                    onCheckedChange={(v) => setFormData({ ...formData, hasLOD: v })} disabled={isSubmitting} />
                  <Label htmlFor="hasLOD">Has LOD</Label>
                </div>
                <div>
                  <Label htmlFor="lodLevels" className="text-xs">LOD Levels (JSON)</Label>
                  <Input id="lodLevels" value={formData.lodLevels}
                    onChange={(e) => setFormData({ ...formData, lodLevels: e.target.value })} disabled={isSubmitting} />
                </div>
                <div>
                  <Label htmlFor="animations" className="text-xs">Animations (JSON array)</Label>
                  <Input id="animations" value={formData.animations}
                    onChange={(e) => setFormData({ ...formData, animations: e.target.value })} disabled={isSubmitting} />
                </div>
                <div>
                  <Label htmlFor="defaultAnimation" className="text-xs">Default Animation</Label>
                  <Select value={formData.defaultAnimation}
                    onValueChange={(v) => setFormData({ ...formData, defaultAnimation: v })}>
                    <SelectTrigger><SelectValue placeholder="Select default animation" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ANIMATION_OPTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </Section>

              <Section title="Status & Flags">
                <div>
                  <Label htmlFor="status" className="text-xs">Model Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODEL_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={formData.isActive}
                    onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} disabled={isSubmitting} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isDefault" checked={formData.isDefault}
                    onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })} disabled={isSubmitting} />
                  <Label htmlFor="isDefault">Default Model</Label>
                </div>
                <div>
                  <Label htmlFor="uploadedBy" className="text-xs">Uploaded By</Label>
                  <Input id="uploadedBy" value={formData.uploadedBy}
                    onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })} disabled={isSubmitting} />
                </div>
                <div>
                  <Label htmlFor="metadata" className="text-xs">Metadata (JSON)</Label>
                  <Input id="metadata" value={formData.metadata}
                    onChange={(e) => setFormData({ ...formData, metadata: e.target.value })} disabled={isSubmitting} />
                </div>
              </Section>

              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Model'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search by name or type..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} className="pl-7 h-8 text-xs" />
      </div>

      {/* Models table */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No 3D models found</p>
          <Button variant="outline" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => setShowCreateDialog(true)}>
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
                        <Button variant="ghost" size="sm" onClick={() => fetchModelDetail(model.id)} title="Files">
                          <File className="w-4 h-4" />
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
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit 3D Model</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Section title="Basic Info">
              <div>
                <Label htmlFor="edit-modelName">Model Name *</Label>
                <Input id="edit-modelName" value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="edit-modelType">Model Type *</Label>
                <Select value={formData.modelType} onValueChange={(v) => setFormData({ ...formData, modelType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section title="Model File">
              <div>
                <Label htmlFor="edit-filePath">File Path / URL *</Label>
                <Input id="edit-filePath" value={formData.filePath}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })} disabled={isSubmitting} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-fileSize" className="text-xs">File Size (bytes)</Label>
                  <Input id="edit-fileSize" type="number" min="0" value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })} disabled={isSubmitting} />
                </div>
                <div>
                  <Label htmlFor="edit-thumbnailUrl" className="text-xs">Thumbnail URL</Label>
                  <Input id="edit-thumbnailUrl" value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>
            </Section>

            <Section title="Related Model Files / Textures">
              <div>
                <Label htmlFor="edit-mainModelFileId" className="text-xs">Primary Model File (from associated files)</Label>
                <Select value={formData.mainModelFileId || 'none'} onValueChange={(v) => setFormData({ ...formData, mainModelFileId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select primary model file" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {mainModelFileOptions.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.fileName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded border px-2 py-1.5 bg-muted/30">
                <span className="text-xs text-muted-foreground">Associated texture files</span>
                <Badge variant="outline" className="text-[10px]">{derivedTextureCount}</Badge>
              </div>
              <div className="space-y-1">
                {(editingModel?.files ?? []).map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileIcon type={f.fileType} />
                    <span className="truncate flex-1">{f.fileName}</span>
                    <span className="text-[10px] capitalize">{f.fileType}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Transform">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-scale" className="text-xs">Scale</Label>
                  <Input id="edit-scale" type="number" step="0.01" min="0.01" value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })} disabled={isSubmitting} />
                </div>
                <div>
                  <Label htmlFor="edit-rotationY" className="text-xs">Rotation Y</Label>
                  <Input id="edit-rotationY" type="number" step="1" value={formData.rotationY}
                    onChange={(e) => setFormData({ ...formData, rotationY: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Offset (X / Y / Z)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Input placeholder="X" type="number" step="0.01" value={formData.offsetX}
                    onChange={(e) => setFormData({ ...formData, offsetX: e.target.value })} disabled={isSubmitting} />
                  <Input placeholder="Y" type="number" step="0.01" value={formData.offsetY}
                    onChange={(e) => setFormData({ ...formData, offsetY: e.target.value })} disabled={isSubmitting} />
                  <Input placeholder="Z" type="number" step="0.01" value={formData.offsetZ}
                    onChange={(e) => setFormData({ ...formData, offsetZ: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>
            </Section>

            <Section title="LOD & Animation">
              <div className="flex items-center gap-2">
                <Switch id="edit-hasLOD" checked={formData.hasLOD}
                  onCheckedChange={(v) => setFormData({ ...formData, hasLOD: v })} disabled={isSubmitting} />
                <Label htmlFor="edit-hasLOD">Has LOD</Label>
              </div>
              <div>
                <Label htmlFor="edit-lodLevels" className="text-xs">LOD Levels (JSON)</Label>
                <Input id="edit-lodLevels" value={formData.lodLevels}
                  onChange={(e) => setFormData({ ...formData, lodLevels: e.target.value })} disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="edit-animations" className="text-xs">Animations (JSON array)</Label>
                <Input id="edit-animations" value={formData.animations}
                  onChange={(e) => setFormData({ ...formData, animations: e.target.value })} disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="edit-defaultAnimation" className="text-xs">Default Animation</Label>
                <Select value={formData.defaultAnimation} onValueChange={(v) => setFormData({ ...formData, defaultAnimation: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {ANIMATION_OPTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section title="Status & Flags">
              <div>
                <Label htmlFor="edit-status" className="text-xs">Model Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODEL_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="edit-isActive" checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} disabled={isSubmitting} />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="edit-isDefault" checked={formData.isDefault}
                  onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })} disabled={isSubmitting} />
                <Label htmlFor="edit-isDefault">Default Model</Label>
              </div>
              <div>
                <Label htmlFor="edit-uploadedBy" className="text-xs">Uploaded By</Label>
                <Input id="edit-uploadedBy" value={formData.uploadedBy}
                  onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })} disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="edit-metadata" className="text-xs">Metadata (JSON)</Label>
                <Input id="edit-metadata" value={formData.metadata}
                  onChange={(e) => setFormData({ ...formData, metadata: e.target.value })} disabled={isSubmitting} />
              </div>
            </Section>

            <Button onClick={handleUpdate} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Model Files</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Select value={fileCategory} onValueChange={setFileCategory}>
                <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Auto-detect" /></SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <input id="model-files-upload" type="file" multiple className="hidden"
                accept=".glb,.gltf,.fbx,.obj,.usdz,.jpg,.jpeg,.png,.webp,.tga,.bmp,.bin"
                onChange={(e) => { const f = e.target.files; if (f && f.length) handleModelFilesUpload(f); e.target.value = ''; }}
                disabled={uploadingFiles} />
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1"
                onClick={() => document.getElementById('model-files-upload')?.click()} disabled={uploadingFiles}>
                {uploadingFiles ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                Upload
              </Button>
            </div>

            {(filesModel?.files ?? []).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No files associated with this model</p>
              </div>
            ) : (
              (['model', 'texture', 'binary', 'other'] as const).map((type) => {
                const group = groupedFiles(filesModel!.files!)[type];
                if (group.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="text-xs font-medium text-muted-foreground capitalize mb-1">{type}</div>
                    <div className="space-y-1">
                      {group.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 p-2 border rounded-lg">
                          <FileIcon type={file.fileType} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.textureType ? `${file.textureType} · ` : ''}{formatFileSize(file.fileSize)}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => handleDeleteFile(file)} disabled={deletingFileId === file.id}>
                            {deletingFileId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}