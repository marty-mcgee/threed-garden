// components/admin/threed/models/ThreeDModelsCRUD.tsx — v0.16.4-beta
// Full CRUD for the ThreeD `threed_models` library with relational file management
// (model files, textures, and supportive media) backed by Vercel Blob storage.
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ModelAnimationAssignments } from '@/components/admin/threed/animations/CharacterAnimationAssignments';
import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThreeDModelFilesCRUD } from './ThreeDModelFilesCRUD';
import { useModelEditorTabs } from './use-model-editor-tabs';
import {
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  SquarePen,
  Trash2,
  Loader2,
  Box,
  EllipsisVertical,
  ExternalLink,
  Search,
  Files,
  Clapperboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  ThreeDModelPreviewImageFields,
  type ThreeDModelUploadAnalysis,
} from './ThreeDModelEditorFields';
import { ModelPreviewBatchExport } from './ModelPreviewBatchExport';
import { ModelPreviewImageExport } from './ModelPreviewImageExport';
import { ModelFieldHelp } from './ModelFieldHelp';
import { ThreeDModelAssetPreview, MODEL_WORKSPACE_PERSPECTIVE } from './ThreeDModelAssetPreview';
import { ThreeDModelsBulkImport } from './ThreeDModelsBulkImport';
import { BulkModelCategoriesDialog } from './BulkModelCategoriesDialog';
import { modelForPreview } from './model-preview-requirements';
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
  materialAssignments?: ModelData["materialAssignments"];
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
type ThreeDModelsCRUDProps = { onModuleUpdate?: () => void; scrollRecords?: boolean; linkedModelId?: number | null; view?: "list" | "create" | "edit" };

export function ThreeDModelsCRUD(props: ThreeDModelsCRUDProps) {
  return <Suspense fallback={<p role="status">Loading Models…</p>}><ThreeDModelsCRUDContent {...props} /></Suspense>;
}

function ThreeDModelsCRUDContent({ onModuleUpdate, scrollRecords = false, linkedModelId = null, view = "list" }: ThreeDModelsCRUDProps) {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const listRequest = useRef(0);
  const listAbort = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationModel, setAnimationModel] = useState<Model | null>(null);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [linkedModelError, setLinkedModelError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<{ field: ModelSortField; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);
  const [deleteReport, setDeleteReport] = useState('');
  const [deleteFailures, setDeleteFailures] = useState<string[]>([]);
  const [categories, setCategories] = useState<ThreeDModelCategoryOption[]>([]);
  const [bulkCategoryTargets, setBulkCategoryTargets] = useState<{ id: number; modelName: string }[] | null>(null);

  // v0.16.4-alpha/beta: Vercel Blob upload state
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadAnalysis, setUploadAnalysis] = useState<ThreeDModelUploadAnalysis | null>(null);
  const [pendingPrimaryFile, setPendingPrimaryFile] = useState<PendingPrimaryModelFile | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ThreeDModelAdminFormData>(createEmptyThreeDModelAdminForm);
  const [savedForm, setSavedForm] = useState('');
  const [filesBusy, setFilesBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [detailsReady, setDetailsReady] = useState(true);
  const [refreshingDetails, setRefreshingDetails] = useState(false);
  const [detailsRefreshError, setDetailsRefreshError] = useState('');
  const refreshLock = useRef(false);
  const dirty = view === 'edit' && Boolean(editingModel) && (JSON.stringify(formData) !== savedForm || Boolean(pendingPrimaryFile));
  const tabs = useModelEditorTabs({
    enabled: view === 'edit', dirty,
    busy: isSubmitting || uploadingPrimary || uploadingThumbnail || filesBusy || exportOpen || refreshingDetails,
    save: handleUpdate,
    discard: async () => {
      if (!editingModel) return false;
      if (pendingPrimaryFile && !(await discardPendingPrimaryUpload(pendingPrimaryFile))) return false;
      loadModelForm(editingModel);
      return true;
    },
    refresh: refreshDetails,
  });
  useEffect(() => {
    if (view === 'edit' && tabs.tab === 'files') setDetailsReady(false);
  }, [view, tabs.tab]);
  const importerPreviewModel = useMemo<ModelData | null>(() => {
    if (!formData.modelType) return null;
    let metadata: unknown;
    try { metadata = JSON.parse(formData.metadata); } catch { metadata = {}; }
    return modelForPreview({
      id: editingModel?.id ?? 0,
      modelName: formData.modelName.trim() || pendingPrimaryFile?.fileName || 'New Model',
      modelType: formData.modelType,
      filePath: formData.filePath,
      metadata,
      scale: formData.scale,
      rotationY: formData.rotationY,
      offsetX: formData.offsetX,
      offsetY: formData.offsetY,
      offsetZ: formData.offsetZ,
      defaultAnimation: formData.defaultAnimation || null,
      files: editingModel?.files ?? [],
      materialAssignments: editingModel?.materialAssignments,
    });
  }, [
    formData.defaultAnimation,
    formData.filePath,
    formData.modelName,
    formData.modelType,
    formData.metadata,
    formData.offsetX,
    formData.offsetY,
    formData.offsetZ,
    formData.rotationY,
    formData.scale,
    pendingPrimaryFile?.fileName,
    editingModel,
  ]);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view !== "list") return;
    setSelectedIds(new Set());
    void fetchModels();
    return () => { ++listRequest.current; listAbort.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, page, pageSize, searchQuery, sort.field, sort.direction]);

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
    if (!file || uploadingPrimary || isSubmitting) return;
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
    if (isSubmitting || uploadingPrimary || uploadingThumbnail) return;
    setFormError(null);
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
        setPendingPrimaryFile(null);
        router.push(Number.isSafeInteger(data.data?.id) ? '/admin/threed/models/' + data.data.id : '/admin/threed/models');
      } else {
        showToast(data.error || 'Failed to create model', 'error');
      }
    } catch (error) {
      if (!(error instanceof ThreeDModelFormValidationError)) console.error('Error creating model:', error);
      showToast(
        error instanceof ThreeDModelFormValidationError ? error.message : 'Failed to create model',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(): Promise<boolean> {
    if (!editingModel || tabs.tab !== 'details' || isSubmitting || uploadingPrimary || uploadingThumbnail || !detailsReady || refreshingDetails || filesBusy || exportOpen) return false;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...buildThreeDModelAdminPayload(formData, 'edit'),
        primaryFile: pendingPrimaryFile,
      };

      const response = await fetch(`/api/threed/models?id=${editingModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data.success && data.data?.id === editingModel.id) {
        showToast('Model updated successfully', 'success');
        setPendingPrimaryFile(null);
        setUploadAnalysis(null);
        loadModelForm({ ...editingModel, ...data.data, categories: [...categories, ...(editingModel.categories ?? [])].filter((category, index, all) => formData.categoryIds.includes(category.id) && all.findIndex(item => item.id === category.id) === index), files: data.data.files ?? editingModel.files, materialAssignments: data.data.materialAssignments ?? editingModel.materialAssignments });
        return true;
      } else {
        setFormError(data.error || 'Failed to update model');
      }
    } catch (error) {
      if (error instanceof ThreeDModelFormValidationError) {
        setFormError(error.message);
        return false;
      }
      setFormError('Failed to update model. Your changes are still here; please try again.');
      console.error('Error updating model:', error);
      showToast(
        error instanceof ThreeDModelFormValidationError ? error.message : 'Failed to update model',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
    return false;
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

  function loadModelForm(model: Model) {
    setFormError(null);
    setUploadAnalysis(null);
    setPendingPrimaryFile(null);
    setEditingModel(model);
    const nextForm: ThreeDModelAdminFormData = {
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
    };
    setFormData(nextForm);
    setSavedForm(JSON.stringify(nextForm));
  }

  async function refreshDetails(): Promise<boolean> {
    if (!linkedModelId || refreshLock.current) return false;
    refreshLock.current = true;
    setDetailsReady(false);
    setRefreshingDetails(true);
    setDetailsRefreshError('');
    try {
      const response = await fetch('/api/threed/models?id=' + linkedModelId, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
      const result = await response.json();
      if (!response.ok || result.success !== true || result.data?.id !== linkedModelId || typeof result.data.userId !== 'string') throw new Error();
      loadModelForm(result.data as Model);
      setDetailsReady(true);
      return true;
    } catch {
      setDetailsRefreshError('Could not reload the saved Model. Details editing and Save Changes are disabled. Retry before making changes.');
      return false;
    } finally { refreshLock.current = false; setRefreshingDetails(false); }
  }

  async function leaveForm(destination = "/admin/threed/models") {
    if (isSubmitting || uploadingPrimary || uploadingThumbnail || filesBusy || exportOpen || refreshingDetails) return;
    if (dirty && !confirm("Leave Edit Model and discard unsaved Details changes? Saved Files changes remain saved.")) return;
    if (pendingPrimaryFile && !(await discardPendingPrimaryUpload(pendingPrimaryFile))) return;
    router.push(destination);
  }

  useEffect(() => {
    setLinkedModelError(null);
    if (view !== "edit" || !linkedModelId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/threed/models?id=${linkedModelId}`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        // The exact-ID API can also return a public library projection. Only its owner record has userId.
        if (!response.ok || data.success !== true || data.data?.id !== linkedModelId || typeof data.data.userId !== 'string') {
          throw new Error('This Model is unavailable in your Admin workspace.');
        }
        loadModelForm(data.data as Model);
      } catch {
        if (!controller.signal.aborted) setLinkedModelError(`Model #${linkedModelId} could not be opened in your Admin workspace.`);
      }
    })();
    return () => controller.abort();
    // Opening a linked Model is tied to URL identity, not list refreshes or form edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, linkedModelId]);

  const reportFilesBusy = useCallback((value: boolean) => setFilesBusy(value), []);

  if (view !== "list") {
    const busy = isSubmitting || uploadingPrimary || uploadingThumbnail || filesBusy || exportOpen || refreshingDetails || tabs.transitioning;
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
        {ToastComponent}
        <Tabs value={view === 'edit' ? tabs.tab : 'details'} onValueChange={value => tabs.requestTab(value === 'files' ? 'files' : 'details')} activationMode="manual" className="min-h-0 flex-1">
        <AdminWorkspaceHeader className="shrink-0" icon={Box} title={view === "create" ? "Add Model" : "Edit Model"}
          description={view === "create" ? "Create a reusable ThreeD Model" : "Model #" + linkedModelId + " · Reusable Model details"}>
          {editingModel && <span className="min-w-0 truncate text-xs text-muted-foreground" title={editingModel.modelName}>{editingModel.modelName} <Badge variant="outline">Model #{editingModel.id}</Badge></span>}
          {view === 'edit' && <TabsList className="ml-auto" aria-label="Model workspace"><TabsTrigger value="details" disabled={busy || !editingModel}>Details</TabsTrigger><TabsTrigger value="files" disabled={busy || !editingModel}>Files</TabsTrigger></TabsList>}
        </AdminWorkspaceHeader>

          {tabs.notice && <p role="status" className="text-sm text-muted-foreground">{tabs.notice}</p>}
          <TabsContent value="details" forceMount hidden={view === 'edit' && tabs.tab !== 'details'} className="min-h-0 min-w-0 flex flex-1 flex-col gap-2 data-[state=inactive]:hidden">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain lg:overflow-hidden">
              {linkedModelError ? <p role="alert" className="text-destructive">{linkedModelError}</p>
                : view === "edit" && !editingModel ? <p role="status">Loading Model…</p>
                : (
                  <div className="grid min-h-0 min-w-0 gap-3 lg:h-full lg:grid-cols-2">
                    <section aria-label="Model draft preview" tabIndex={0} className="min-h-0 min-w-0 lg:overflow-y-auto lg:pr-1">
                      <ThreeDModelAssetPreview
                        active={(view !== 'edit' || tabs.tab === 'details') && !exportOpen}
                        model={importerPreviewModel}
                        attachedDependencyCount={0}
                        dependencyCount={0}
                        preserveCameraOnEdit
                        centerAtOrigin
                        perspective={MODEL_WORKSPACE_PERSPECTIVE}
                        title="Draft Model Canvas"
                        headerHelp={<ModelFieldHelp label="Model Canvas Preview">{formData.modelType && formData.modelType !== 'procedural' && !formData.filePath.trim()
                          ? 'Recovery geometry only: choose a Model file to preview its geometry. Choose the recovery shape under Geometry.'
                          : 'Previewing unsaved shape, transform, and file lighting changes. Save to apply them to the reusable Model.'}</ModelFieldHelp>}
                        headerMeta={<Badge variant="outline">{formData.modelType || 'Choose a type'}</Badge>}
                        canvasClassName="h-[clamp(16rem,42dvh,30rem)]"
                      />
                      <fieldset aria-label="Library preview image" disabled={busy || !detailsReady} className="mt-3 min-w-0 rounded-lg border admin-editor-panel p-3">
                        <ThreeDModelPreviewImageFields mode={view === 'create' ? 'create' : 'edit'} form={formData} setForm={setFormData}
                          isSubmitting={isSubmitting} uploadingPrimary={uploadingPrimary} uploadingThumbnail={uploadingThumbnail} onThumbnail={handleThumbnailUpload}
                          previewImageAction={importerPreviewModel && <ModelPreviewImageExport key={editingModel?.id ?? 'draft'} model={importerPreviewModel} useDraftModel onOpenChange={setExportOpen} dependencyCount={0} attachedDependencyCount={0} disabled={busy} onUseImageUrl={url => setFormData(current => ({ ...current, thumbnailUrl: url }))} />} />
                      </fieldset>
                    </section>
                    <fieldset aria-label="Model details" tabIndex={0} disabled={busy || !detailsReady} className="min-h-0 min-w-0 rounded-lg border admin-editor-panel p-3 lg:overflow-y-auto [&_section]:rounded-md [&_section]:border [&_section]:p-3">
                      {view === 'create' && formData.modelType === 'obj' && (
                        <p className="mb-4 rounded-md border p-3 text-sm">Attach MTL files and referenced images in Model Files after creation. Use Bulk Import Models to prepare a complete OBJ bundle before uploading.</p>
                      )}
                      <ThreeDModelEditorFields
                        showPreviewImage={false}
                        mode={view === 'create' ? 'create' : 'edit'}
                        modelId={editingModel?.id}
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
                    </fieldset>
                  </div>
                )}
            </div>
            <div className="shrink-0 space-y-2 rounded-lg border admin-editor-panel p-2">
              {refreshingDetails && <p role="status" className="text-sm text-muted-foreground">Reloading saved Model…</p>}
              {detailsRefreshError && <div className="space-y-2"><p role="alert" className="text-sm text-destructive">{detailsRefreshError}</p><Button variant="outline" disabled={busy} onClick={() => void refreshDetails()}>Retry Model refresh</Button></div>}
              {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
              <div className="admin-editor-actions">
                <Button variant="success" onClick={view === "create" ? handleCreate : handleUpdate}
                  disabled={busy || !detailsReady || (view === "edit" && !editingModel) || (view === "create" && !formData.filePath.trim() && formData.modelType !== "procedural")}>
                  {refreshingDetails ? "Reloading…" : busy ? "Saving…" : view === "create" ? "Create Model" : "Save Changes"}
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => void leaveForm()}>Cancel</Button>
              </div>
            </div>
          </TabsContent>
          {view === 'edit' && editingModel && <TabsContent value="files" forceMount hidden={tabs.tab !== 'files'} className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border p-4 data-[state=inactive]:hidden">
            <p className="mb-3 text-xs text-muted-foreground">Files and appearance changes save separately. Saved uploads remain saved when you leave Edit Model.</p>
            <ThreeDModelFilesCRUD key={editingModel.id} initialModelId={editingModel.id} embedded active={tabs.tab === 'files'} onBusyChange={reportFilesBusy} />
          </TabsContent>}
        </Tabs>
        <Dialog open={tabs.pending !== null} onOpenChange={open => { if (!open && !busy) void tabs.resolve('stay'); }}>
          <DialogContent showCloseButton={!busy}>
            <DialogHeader><DialogTitle>Unsaved Model changes</DialogTitle><DialogDescription>Save or discard your Details changes before opening Files. Saved uploads remain saved.</DialogDescription></DialogHeader>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <DialogFooter><Button variant="outline" disabled={busy} onClick={() => void tabs.resolve('stay')}>Stay</Button><Button variant="outline" disabled={busy} onClick={() => void tabs.resolve('discard')}>Discard Changes</Button><Button variant="success" disabled={busy || !detailsReady} onClick={() => void tabs.resolve('save')}>{busy ? 'Saving…' : 'Save Changes'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
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
            aria-label="Search Models"
            placeholder="Search by name or type..."
            value={searchQuery}
            onChange={(event) => { setPage(0); setSearchQuery(event.target.value); setSelectedIds(new Set()); }}
            className="h-7 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ModelPreviewBatchExport onComplete={() => { void fetchModels(false); }} />
          {!onModuleUpdate && <ThreeDModelsBulkImport categories={categories} onComplete={async () => {
            // Keep the bulk queue mounted while refreshing saved Model summaries.
            await fetchModels(false);
          }} />}
          <Button asChild size="sm" className="h-7 px-2 text-xs">
            <Link href="/admin/threed/models/new"><Plus className="mr-1 h-3 w-3" /> Add Model</Link>
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
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={loading || deleting || !selectedModels.length} onClick={() => setBulkCategoryTargets(selectedModels.map(model => ({ id: model.id, modelName: model.modelName })))}>Update Categories ({selectedModels.length})</Button>
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
          <Button variant="outline" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => router.push("/admin/threed/models/new")}>
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
                {sortHeading('type', 'Type')}
                {sortHeading('size', 'Size')}
                {sortHeading('category', 'Category')}
                {sortHeading('options', 'Options')}
                <TableHead className="text-center text-xs py-1">Thumbnail</TableHead>
                {sortHeading('status', 'Status')}
                {sortHeading('active', 'Active')}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => {
                const hasThumbnail = Boolean(model.thumbnailUrl?.trim());
                const mainFileUrl = model.filePath?.trim() ?? '';
                const canOpenMainFile = /^https?:\/\//i.test(mainFileUrl);
                return (
                  <TableRow key={model.id} className="hover:bg-muted/50">
                    <TableCell className="w-8 px-2 py-1 text-center"><input type="checkbox" aria-label={`Bulk Edit ${model.modelName} (#${model.id})`} checked={selectedIds.has(model.id)} disabled={deleting || loading}
                      onChange={(event) => { const checked = event.target.checked; setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(model.id); else next.delete(model.id); return next; }); }} /></TableCell>
                    <TableCell className="py-1 text-sm font-medium">
                      <div className="flex items-center gap-2"><Box className="w-3.5 h-3.5 shrink-0 text-blue-500" />{model.modelName}<Link href={`/admin/threed/models/${model.id}`} className="text-xs font-normal text-muted-foreground underline-offset-2 hover:text-foreground hover:underline" aria-label={`Open Model #${model.id} details`}>#{model.id}</Link></div>
                    </TableCell>
                    <TableCell className="py-1">
                      <Badge variant="outline" className="text-[10px]">{getOptionLabel(MODEL_TYPE_OPTIONS, model.modelType)}</Badge>
                    </TableCell>
                    <TableCell className="py-1 text-sm text-muted-foreground">{formatFileSize(model.fileSize)}</TableCell>
                    <TableCell className="py-1"><div className="flex flex-wrap gap-1">{model.categories?.length ? model.categories.map((category) => <Badge key={category.id} variant="secondary" className="text-[10px]">{category.name}</Badge>) : '—'}</div></TableCell>
                    <TableCell className="py-1"><div className="flex flex-wrap gap-1">{modelOptions(model).length ? modelOptions(model).map((label) => <Badge key={label} variant={label === 'Default' ? 'secondary' : 'outline'} className="text-[10px]">{label}</Badge>) : '—'}</div></TableCell>
                    <TableCell className="text-center py-1">
                      <span className="inline-flex items-center" title={hasThumbnail ? 'Thumbnail assigned' : 'No thumbnail assigned'}>
                        {hasThumbnail ? <Check aria-hidden="true" className="h-4 w-4 text-green-700 dark:text-green-400" /> : <X aria-hidden="true" className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                        <span className="sr-only">{hasThumbnail ? 'Yes' : 'No'}</span>
                      </span>
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
                    <TableCell className="py-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700 focus-visible:bg-amber-500/10 focus-visible:text-amber-700 dark:hover:text-amber-400 dark:focus-visible:text-amber-400"
                          disabled={deleting || loading} onClick={() => router.push("/admin/threed/models/" + model.id)}
                          title={`Edit ${model.modelName}`} aria-label={`Edit ${model.modelName}`}>
                          <SquarePen aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button asChild variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-700 focus-visible:bg-blue-500/10 focus-visible:text-blue-700 dark:hover:text-blue-400 dark:focus-visible:text-blue-400">
                          <Link href={`/admin/threed/models/${model.id}?tab=files`} title={`Model Files for ${model.modelName}`} aria-label={`Model Files for ${model.modelName}`}>
                            <Files aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button type="button" variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-violet-500/10 hover:text-violet-700 focus-visible:bg-violet-500/10 focus-visible:text-violet-700 dark:hover:text-violet-400 dark:focus-visible:text-violet-400"
                          disabled={deleting || loading} onClick={() => setAnimationModel(model)} title={`Animations & Preview for ${model.modelName}`} aria-label={`Animations & Preview for ${model.modelName}`}>
                          <Clapperboard aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground"
                              title={`More actions for ${model.modelName}`} aria-label={`More actions for ${model.modelName}`}>
                              <EllipsisVertical aria-hidden="true" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canOpenMainFile ? (
                              <DropdownMenuItem asChild>
                                <a href={mainFileUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" /> Open Original Model File
                                  <span className="sr-only"> (new tab)</span>
                                </a>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" /> Open Original Model File (unavailable)
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:bg-red-500/10 focus:text-red-700 dark:text-red-400 dark:focus:text-red-400" disabled={deleting || loading} onClick={() => void handleDeleteModels([model])}>
                              <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" /> Delete Model
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

      <Dialog open={!!animationModel} onOpenChange={open => !open && setAnimationModel(null)}>
        <DialogContent className="flex h-[90dvh] w-[calc(100%-2rem)] min-w-0 flex-col overflow-hidden sm:max-w-7xl">
          <DialogHeader className="shrink-0 pr-8"><DialogTitle>Animations & Preview — {animationModel?.modelName}</DialogTitle></DialogHeader>
          {animationModel && <ModelAnimationAssignments key={animationModel.id} modelId={animationModel.id} />}
        </DialogContent>
      </Dialog>

      {bulkCategoryTargets && <BulkModelCategoriesDialog targets={bulkCategoryTargets} categories={categories} onClose={() => setBulkCategoryTargets(null)} onComplete={async result => {
        showToast(`${result.updated} of ${bulkCategoryTargets.length} Models updated.${result.failures.length ? ` ${result.failures.join(' · ')}` : ''}`, result.failures.length ? 'error' : 'success');
        setBulkCategoryTargets(null);
        setSelectedIds(new Set());
        await fetchModels();
        onModuleUpdate?.();
      }} />}


    </div>
  );
}
