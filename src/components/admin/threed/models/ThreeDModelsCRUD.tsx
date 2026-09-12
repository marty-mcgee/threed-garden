// components/admin/threed/models/ThreeDModelsCRUD.tsx — v0.16.4-beta
// Full CRUD for the ThreeD `threed_models` library with relational file management
// (model files, textures, and supportive media) backed by Vercel Blob storage.
'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Box,
  MoreHorizontal,
  ExternalLink,
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
import { ThreeDModelsBulkImport } from './ThreeDModelsBulkImport';
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
    case 'active': return 'text-green-700 dark:text-green-400';
    case 'pending': return 'text-yellow-700 dark:text-yellow-400';
    case 'maintenance': return 'text-red-700 dark:text-red-400';
    case 'dormant': return 'text-gray-600 dark:text-gray-400';
    case 'retired': return 'text-gray-600 dark:text-gray-400';
    default: return 'text-gray-600 dark:text-gray-400';
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

type ModelSortField = 'name' | 'category' | 'options' | 'type' | 'status' | 'active' | 'size';
const modelOptions = (model: Model) => [
  model.isDefault && 'Default', model.isPublic && 'Public', model.isLibraryItem && 'Library',
  model.usedByPlants && 'Plants', model.usedByCharacters && 'Characters',
].filter((label): label is string => Boolean(label));
// ============================================
// COMPONENT
// ============================================
export function ThreeDModelsCRUD({ onModuleUpdate, scrollRecords = false }: { onModuleUpdate?: () => void; scrollRecords?: boolean }) {
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const listRequest = useRef(0);
  const listAbort = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<{ field: ModelSortField; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);
  const [deleteReport, setDeleteReport] = useState('');
  const [deleteFailures, setDeleteFailures] = useState<string[]>([]);
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
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
    void fetchModels();
    return () => { ++listRequest.current; listAbort.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchQuery, sort.field, sort.direction]);

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

  async function fetchModels(_showLoading = true) {
    const requestId = ++listRequest.current;
    listAbort.current?.abort();
    const controller = new AbortController();
    listAbort.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize),
        search: searchQuery, sort: sort.field, direction: sort.direction });
      const response = await fetch(`/api/threed/models?${params}`, { cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (requestId !== listRequest.current) return;
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch models');
      const count = Number(data.pagination?.total ?? 0);
      setTotal(count);
      const lastPage = Math.max(0, Math.ceil(count / pageSize) - 1);
      if (page > lastPage) { setPage(lastPage); return; }
      setModels(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      if (requestId !== listRequest.current || controller.signal.aborted) return;
      showToast(error instanceof Error ? error.message : 'Failed to fetch models', 'error');
      setModels([]);
      setTotal(0);
    } finally {
      if (requestId === listRequest.current) setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedIds((current) => new Set([...current].filter((id) => models.some((model) => model.id === id))));
  }, [models]);

  const filteredModels = models;
  const selectedModels = models.filter((model) => selectedIds.has(model.id));
  const allVisibleSelected = filteredModels.length > 0 && filteredModels.every((model) => selectedIds.has(model.id));
  const someVisibleSelected = filteredModels.some((model) => selectedIds.has(model.id));

  function sortHeading(field: ModelSortField, label: string) {
    const active = sort.field === field;
    const Icon = active ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="text-xs py-1" aria-sort={active ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
      <button type="button" className="flex items-center gap-1 py-1 whitespace-nowrap" disabled={deleting || loading} onClick={() => { setPage(0); setSelectedIds(new Set()); setSort((current) => ({ field, direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc' })); }}>
        {label}<Icon aria-hidden="true" className="h-3 w-3" />
      </button>
    </TableHead>;
  }

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

  async function handleDeleteModels(targets: Model[]) {
    if (deleteLock.current || !targets.length) return;
    const names = targets.map((model) => `• ${model.modelName} (#${model.id})`).join('\n');
    if (!confirm(`Delete ${targets.length} Model${targets.length === 1 ? '' : 's'}?\n\n${names}\n\nTheir attached files will also be removed using the existing Model deletion rules. This action cannot be undone.`)) return;
    deleteLock.current = true;
    setDeleting(true);
    setDeleteFailures([]);
    const deleted = new Set<number>();
    const failures: string[] = [];
    try {
      for (const [index, model] of targets.entries()) {
        setDeleteReport(`Deleting ${index + 1} of ${targets.length}: ${model.modelName}`);
        try {
          const response = await fetch(`/api/threed/models?id=${model.id}`, { method: 'DELETE', signal: AbortSignal.timeout(120_000) });
          const data = await response.json();
          if (!response.ok || data.success !== true) {
            failures.push(`${model.modelName} (#${model.id}): ${typeof data.error === 'string' ? data.error : 'Deletion was not confirmed.'}`);
            continue;
          }
          deleted.add(model.id);
          setModels((current) => current.filter((entry) => entry.id !== model.id));
          setSelectedIds((current) => { const next = new Set(current); next.delete(model.id); return next; });
        } catch {
          failures.push(`${model.modelName} (#${model.id}): Deletion was not confirmed. Refresh the page to check its saved state before trying again.`);
        }
      }
      setDeleteReport(`${deleted.size} of ${targets.length} Models deleted.${failures.length ? ` ${failures.length} deletions not confirmed; review the results below.` : ''}`);
      setDeleteFailures(failures);
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
    if (deleted.size) { await fetchModels(); onModuleUpdate?.(); }
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


  return (
    <div className={scrollRecords ? "flex h-full min-h-0 flex-col gap-2" : "space-y-2"}>
      {ToastComponent}

      <fieldset disabled={deleting} className="min-w-0 shrink-0">
      <AdminWorkspaceHeader
        icon={Box}
        title="Models"
        description="Import and manage reusable ThreeD Models"
      >
        <Badge variant="secondary" className="text-xs">{total}</Badge>
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or type..."
            value={searchQuery}
            onChange={(event) => { setPage(0); setSearchQuery(event.target.value); setSelectedIds(new Set()); }}
            className="h-7 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!onModuleUpdate && <ThreeDModelsBulkImport categories={categories} onComplete={async () => {
            // Keep the bulk queue mounted while refreshing saved Model summaries.
            await fetchModels(false);
          }} />}
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
                    description={formData.modelType === 'obj' ? 'OBJ geometry preview. Attach its MTL material library and referenced images in Model Files after creation to see the final materials.' : 'Upload a Model, then adjust its transform and inspect every change here before creation.'}
                    canvasClassName="h-[min(68vh,680px)] min-h-[420px]"
                  />
                </div>
                <div className="max-h-[calc(92vh-73px)] overflow-y-auto">
                  <div className="space-y-4 p-5">
                    {formData.modelType === 'obj' && (
                      <p className="rounded-md border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm">
                        Create this Model, then attach its .MTL files and referenced texture images in Model Files.
                        To prepare and preview the complete bundle before uploading, use Bulk Import Models — it also accepts a single OBJ.
                      </p>
                    )}
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
            <Link href="/admin/threed/animations">
              <Clapperboard className="mr-1 h-3 w-3" /> Animations Library
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
      </fieldset>

      {deleteReport && <p role="status" className="text-sm">{deleteReport}</p>}
      {deleteFailures.length > 0 && <ul className="list-inside list-disc text-sm text-destructive" aria-label="Model deletion results">{deleteFailures.map((failure) => <li key={failure}>{failure}</li>)}</ul>}

      <nav aria-label="Models pagination" className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span role="status">{loading ? 'Loading Models…' : total ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total} Models` : '0 Models'}</span>
          <span aria-hidden="true" className="text-muted-foreground">|</span>
          <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Bulk Model actions">
            <span>{selectedModels.length} selected</span>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={loading || deleting || !selectedModels.length} onClick={() => void handleDeleteModels(selectedModels)}>
              {deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}Delete selected ({selectedModels.length})
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={loading || deleting || !selectedModels.length} onClick={() => setSelectedIds(new Set())}>Clear selection</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label>Per page <select aria-label="Models per page" className="rounded border bg-background p-1" value={pageSize} disabled={deleting || loading}
            onChange={(event) => { setPage(0); setPageSize(Number(event.target.value)); setSelectedIds(new Set()); }}>
            {[25, 50, 100, 200].map((size) => <option key={size} value={size}>{size}</option>)}
          </select></label>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || page === 0} onClick={() => setPage(0)}>First</Button>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || page === 0} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || (page + 1) * pageSize >= total} onClick={() => setPage((current) => current + 1)}>Next</Button>
          <Button variant="outline" size="sm" className="text-xs" disabled={loading || deleting || (page + 1) * pageSize >= total} onClick={() => setPage(Math.max(0, Math.ceil(total / pageSize) - 1))}>Last</Button>
        </div>
      </nav>
      {/* Models table */}
      {loading ? <p className="py-4 text-sm text-muted-foreground">Loading Models…</p> : filteredModels.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No Models found</p>
          <Button variant="outline" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => handleCreateDialogChange(true)}>
            <Plus className="w-3 h-3 mr-1" /> Create your first model
          </Button>
        </div>
      ) : (
        <div role="region" aria-label="Model records" tabIndex={scrollRecords ? 0 : undefined}
          className={scrollRecords ? "min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible" : "border rounded-lg overflow-hidden"}>
          <Table className="min-w-[1000px]">
            <TableHeader className={scrollRecords ? "sticky top-0 z-10 bg-background" : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8 px-2 py-1">
                  <label className="flex items-center justify-center"><input type="checkbox" aria-label="Select all visible Models" disabled={deleting || loading} checked={allVisibleSelected}
                    ref={(element) => { if (element) element.indeterminate = someVisibleSelected && !allVisibleSelected; }}
                    onChange={(event) => { const checked = event.target.checked; setSelectedIds((current) => { const next = new Set(current); for (const model of filteredModels) { if (checked) next.add(model.id); else next.delete(model.id); } return next; }); }} /></label>
                </TableHead>
                {sortHeading('name', 'Name')}
                {sortHeading('category', 'Category')}
                {sortHeading('options', 'Options')}
                {sortHeading('type', 'Type')}
                {sortHeading('status', 'Status')}
                {sortHeading('active', 'Active')}
                {sortHeading('size', 'Size')}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => {
                const mainFileUrl = model.filePath?.trim() ?? '';
                const canOpenMainFile = /^https?:\/\//i.test(mainFileUrl);
                return (
                  <TableRow key={model.id} className="hover:bg-muted/50">
                    <TableCell className="w-8 px-2 py-1 text-center"><input type="checkbox" aria-label={`Bulk Edit ${model.modelName} (#${model.id})`} checked={selectedIds.has(model.id)} disabled={deleting || loading}
                      onChange={(event) => { const checked = event.target.checked; setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(model.id); else next.delete(model.id); return next; }); }} /></TableCell>
                    <TableCell className="py-1 text-sm font-medium">
                      <div className="flex items-center gap-2"><Box className="w-3.5 h-3.5 shrink-0 text-blue-500" />{model.modelName}</div>
                    </TableCell>
                    <TableCell className="py-1"><div className="flex flex-wrap gap-1">{model.categories?.length ? model.categories.map((category) => <Badge key={category.id} variant="secondary" className="text-[10px]">{category.name}</Badge>) : '—'}</div></TableCell>
                    <TableCell className="py-1"><div className="flex flex-wrap gap-1">{modelOptions(model).length ? modelOptions(model).map((label) => <Badge key={label} variant={label === 'Default' ? 'default' : 'outline'} className="text-[10px]">{label}</Badge>) : '—'}</div></TableCell>
                    <TableCell className="py-1">
                      <Badge variant="outline" className="text-[10px]">{getOptionLabel(MODEL_TYPE_OPTIONS, model.modelType)}</Badge>
                    </TableCell>
                    <TableCell className="py-1">
                      <span className={`text-xs ${getStatusColor(model.status)}`}>{getOptionLabel(MODEL_STATUS_OPTIONS, model.status)}</span>
                    </TableCell>
                    <TableCell className="text-center py-1">
                      <span className="inline-flex items-center" title={model.isActive ? 'Active' : 'Inactive'}>
                        {model.isActive ? <Check aria-hidden="true" className="h-4 w-4 text-green-700 dark:text-green-400" /> : <X aria-hidden="true" className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                        <span className="sr-only">{model.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-1 text-sm text-muted-foreground">{formatFileSize(model.fileSize)}</TableCell>
                    <TableCell className="py-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/threed/model-files?modelId=${model.id}`} title={`Manage files for ${model.modelName}`}>
                            <File className="w-4 h-4" />
                            <span className="sr-only">Manage files</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" disabled={deleting || loading} onClick={() => openEditDialog(model)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600" disabled={deleting || loading} onClick={() => void handleDeleteModels([model])}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {canOpenMainFile ? (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <a href={mainFileUrl} target="_blank" rel="noopener noreferrer"
                              title={`Open main file for ${model.modelName} (new tab)`}
                              aria-label={`Open main file for ${model.modelName} (new tab)`}>
                              <ExternalLink aria-hidden="true" className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button type="button" variant="ghost" size="icon" disabled
                            className="h-8 w-8 text-muted-foreground disabled:opacity-30"
                            title="No main file assigned" aria-label={`No main file assigned for ${model.modelName}`}>
                            <ExternalLink aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        )}
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
