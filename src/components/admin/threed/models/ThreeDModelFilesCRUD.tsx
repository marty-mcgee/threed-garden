// src/components/admin/threed/models/ThreeDModelFilesCRUD.tsx — v0.16.4-beta
// Dedicated admin surface for managing a ThreeD model's files (model files, textures,
// binary buffers, and supportive media). Full-featured UX:
//   - model selector + file-category auto-detection
//   - drag-and-drop & click-to-upload with per-file progress
//   - list / grid views, search, sort, grouped by type
//   - texture thumbnails, copy URL, open in new tab
//   - set-as-primary model file, delete with confirmation
//   - summary stats, skeleton/empty/error states
'use client';

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import {
  Box,
  Image,
  File,
  Upload,
  Trash2,
  Loader2,
  Search,
  Copy,
  Check,
  ExternalLink,
  BadgeCheck,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  X,
  AlertTriangle,
  Star,
  FolderTree,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  ThreeDModelAssetPreview,
  type ThreeDModelTextureLibraryItem,
} from './ThreeDModelAssetPreview';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';

// ============================================
// TYPES
// ============================================
interface ModelFileRow {
  id: number;
  fileName: string;
  relativePath: string | null;
  fileType: string;
  textureType: string | null;
  filePath: string;
  fileSize: number | null;
  isBinaryBuffer: boolean;
  loadOrder: number;
  createdAt?: string | null;
}

interface Model {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  files?: ModelFileRow[];
  mainModelFileId: number | null;
  textureCount: number;
  scale?: string | number | null;
  rotationY?: string | number | null;
  offsetX?: string | number | null;
  offsetY?: string | number | null;
  offsetZ?: string | number | null;
  defaultAnimation?: string | null;
  metadata?: unknown;
}

interface ThreeDModelFilesCRUDProps {
  initialModelId?: number | null;
}

interface UploadItem {
  name: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface ModelDependencyRequirement {
  fileName: string;
  kind: 'buffer' | 'material' | 'texture';
  relativePath: string;
  referencedBy: string;
  satisfied: boolean;
  matchedFileId: number | null;
  matchedRelativePath: string | null;
}

interface ModelDependencyAudit {
  status: 'analyzed' | 'missing_primary' | 'not_supported';
  primaryFileName?: string;
  complete?: boolean;
  requirements: ModelDependencyRequirement[];
}

type ViewMode = 'list' | 'grid';
type SortMode = 'name' | 'size' | 'type' | 'newest';

// ============================================
// OPTIONS / HELPERS
// ============================================
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size (largest first)' },
  { value: 'type', label: 'Type' },
  { value: 'newest', label: 'Newest' },
];

const TYPE_LABELS: Record<string, string> = {
  model: 'Model Files',
  texture: 'Textures',
  binary: 'Binary Buffers',
  other: 'Supportive Media',
};

const TYPE_ORDER = ['model', 'texture', 'binary', 'other'] as const;

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp', 'tga']);

function extensionOf(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function isImageRow(file: ModelFileRow): boolean {
  return IMAGE_EXTENSIONS.has(extensionOf(file.fileName));
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString();
}

function normalizeAttachmentDirectory(directory: string): string {
  return directory.trim().replaceAll('\\', '/').replace(/\/+$/g, '').split('/').filter(Boolean).join('/');
}

function attachmentDirectoryProblem(directory: string): string | null {
  const raw = directory.trim().replaceAll('\\', '/');
  if (!raw) return 'An Attachment directory is required before uploading dependency files.';
  if (raw.length > 100) return 'Attachment directory cannot exceed 100 characters.';
  if (raw.startsWith('/') || /^[A-Za-z]:\//.test(raw)) return 'Attachment directory must be relative.';
  if (raw.includes('\0') || raw.includes('?') || raw.includes('#')) return 'Attachment directory contains unsupported characters.';
  if (raw.split('/').some((segment) => segment === '..')) return 'Parent directory traversal is not allowed.';
  return normalizeAttachmentDirectory(raw) ? null : 'An Attachment directory is required before uploading dependency files.';
}

function attachmentRelativePath(directory: string, fileName: string): string {
  const normalizedDirectory = normalizeAttachmentDirectory(directory);
  return normalizedDirectory ? `${normalizedDirectory}/${fileName}` : fileName;
}

function FileIcon({ type, className = 'w-4 h-4' }: { type: string; className?: string }) {
  if (type === 'model') return <Box className={`${className} text-blue-500`} />;
  if (type === 'texture') return <Image className={`${className} text-green-500`} />;
  if (type === 'binary') return <File className={`${className} text-orange-500`} />;
  return <File className={`${className} text-gray-500`} />;
}

function FileCardThumbnail({ file, className }: { file: ModelFileRow; className: string }) {
  const [errored, setErrored] = useState(false);
  if (isImageRow(file) && !errored) {
    return (
      <img
        src={file.filePath}
        alt={file.fileName}
        className={className}
        onError={() => setErrored(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div className={`${className} flex items-center justify-center bg-muted/40`}>
      <FileIcon type={file.fileType} className="w-8 h-8" />
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================
export function ThreeDModelFilesCRUD({ initialModelId = null }: ThreeDModelFilesCRUDProps) {
  const { showToast, ToastComponent } = useToast();

  const [models, setModels] = useState<Model[]>([]);
  const [modelId, setModelId] = useState<string>(initialModelId ? String(initialModelId) : '');
  const [modelDetail, setModelDetail] = useState<Model | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [dependencyAudit, setDependencyAudit] = useState<ModelDependencyAudit | null>(null);
  const [dependencyError, setDependencyError] = useState<string | null>(null);
  const [textureLibrary, setTextureLibrary] = useState<ThreeDModelTextureLibraryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>('auto');
  const [attachmentDirectory, setAttachmentDirectory] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<SortMode>('name');
  const [view, setView] = useState<ViewMode>('list');

  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelFileRow | null>(null);
  const [primaryFileId, setPrimaryFileId] = useState<number | null>(null);

  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingRequirementRef = useRef<ModelDependencyRequirement | null>(null);

  const selectedModel = useMemo(
    () => models.find((m) => String(m.id) === modelId) ?? null,
    [models, modelId],
  );
  const files = useMemo(() => modelDetail?.files ?? [], [modelDetail]);
  const previewModel = useMemo<ModelData | null>(() => {
    if (!modelDetail) return null;
    return {
      ...modelDetail,
      files: modelDetail.files?.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        relativePath: file.relativePath || file.fileName,
        filePath: file.filePath,
        fileType: file.fileType,
      })),
    };
  }, [modelDetail]);
  const mainModelFileId = modelDetail?.mainModelFileId ?? null;
  const missingRequirements = useMemo(
    () => dependencyAudit?.requirements.filter((item) => !item.satisfied) ?? [],
    [dependencyAudit],
  );

  const uploading = uploadQueue.some((u) => u.status === 'uploading');
  const normalizedAttachmentDirectory = normalizeAttachmentDirectory(attachmentDirectory);
  const directoryProblem = attachmentDirectoryProblem(attachmentDirectory);
  const directoryHasInput = attachmentDirectory.trim().length > 0;

  // ============================================
  // DATA LOADING
  // ============================================
  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    setError(null);
    try {
      const response = await fetch('/api/threed/models?limit=200');
      const data = await response.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? (data.data as Model[]) : [];
        setModels(list);
        if (!modelId && list.length > 0) {
          setModelId(String(list[0].id));
        }
      } else {
        const message = data.error || 'Failed to load models';
        setError(message);
        showToast(message, 'error');
        setModels([]);
      }
    } catch (err) {
      const message = 'Failed to load models';
      console.error(message, err);
      setError(message);
      showToast(message, 'error');
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const loadFiles = useCallback(
    async (id: number) => {
      setLoadingFiles(true);
      setError(null);
      try {
        const response = await fetch(`/api/threed/models?id=${id}`);
        const data = await response.json();
        if (data.success) {
          setModelDetail(data.data as Model);
        } else {
          const message = data.error || 'Failed to load files';
          setError(message);
          showToast(message, 'error');
          setModelDetail(null);
        }
      } catch (err) {
        const message = 'Failed to load files';
        console.error(message, err);
        setError(message);
        showToast(message, 'error');
        setModelDetail(null);
      } finally {
        setLoadingFiles(false);
      }
    },
    [showToast],
  );

  const loadDependencies = useCallback(async (id: number) => {
    setLoadingDependencies(true);
    setDependencyError(null);
    try {
      const response = await fetch(`/api/threed/models/files/requirements?modelId=${id}`);
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setDependencyAudit(null);
        setDependencyError(result?.error || 'Failed to inspect Model dependencies');
        return;
      }
      setDependencyAudit(result.data as ModelDependencyAudit);
    } catch {
      setDependencyAudit(null);
      setDependencyError('Failed to inspect Model dependencies');
    } finally {
      setLoadingDependencies(false);
    }
  }, []);

  const loadTextureLibrary = useCallback(async () => {
    const response = await fetch('/api/threed/model-textures');
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || 'Failed to load ThreeD Model Textures');
    }
    setTextureLibrary(Array.isArray(result.data) ? result.data : []);
  }, []);

  useEffect(() => {
    void loadTextureLibrary().catch((loadError) => {
      showToast(loadError instanceof Error ? loadError.message : 'Failed to load ThreeD Model Textures', 'error');
    });
  }, [loadTextureLibrary, showToast]);

  const saveMaterialAssignment = useCallback(async ({
    targetKeys,
    textureFileId,
    textureId,
  }: {
    targetKeys: string[];
    textureFileId?: number;
    textureId?: number;
  }) => {
    if (!modelId) throw new Error('Select a Model before saving a material assignment');
    const response = await fetch('/api/threed/models/files/requirements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: Number(modelId),
        targetKeys,
        channel: 'baseColor',
        ...(textureId ? { textureId } : { textureFileId }),
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || 'Failed to save material assignment');
    }
    await loadFiles(Number(modelId));
    await loadTextureLibrary();
    showToast(targetKeys.length > 1 ? `Base Color saved to ${targetKeys.length} material slots` : 'Base Color assignment saved', 'success');
  }, [loadFiles, loadTextureLibrary, modelId, showToast]);

  useEffect(() => {
    if (modelId) {
      setAttachmentDirectory((current) => current || 'textures');
      loadFiles(Number(modelId));
      loadDependencies(Number(modelId));
    } else {
      setModelDetail(null);
      setDependencyAudit(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, loadDependencies]);

  // ============================================
  // SELECTION-DERIVED DATA
  // ============================================
  const filteredFiles = useMemo(() => {
    const q = filter.toLowerCase();
    const list = files.filter(
      (f) => f.fileName.toLowerCase().includes(q)
        || (f.relativePath ?? '').toLowerCase().includes(q)
        || f.fileType.toLowerCase().includes(q),
    );
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case 'size':
          return (b.fileSize ?? 0) - (a.fileSize ?? 0);
        case 'type':
          return a.fileType.localeCompare(b.fileType) || a.fileName.localeCompare(b.fileName);
        case 'newest':
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case 'name':
        default:
          return a.fileName.localeCompare(b.fileName);
      }
    });
    return sorted;
  }, [files, filter, sort]);

  const groupedFiles = useMemo(() => {
    const groups: Record<string, ModelFileRow[]> = { model: [], texture: [], binary: [], other: [] };
    for (const f of filteredFiles) {
      const key = groups[f.fileType] ? f.fileType : 'other';
      groups[key].push(f);
    }
    return groups;
  }, [filteredFiles]);

  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, f) => sum + (f.fileSize ?? 0), 0);
    const byType = { model: 0, texture: 0, binary: 0, other: 0 } as Record<string, number>;
    for (const f of files) {
      const key = byType[f.fileType] !== undefined ? f.fileType : 'other';
      byType[key] += 1;
    }
    return { count: files.length, totalSize, byType };
  }, [files]);

  // ============================================
  // UPLOAD
  // ============================================
  const uploadOne = useCallback(
    async (fileList: File[], index: number, directory: string): Promise<boolean> => {
      const file = fileList[index];
      const relativePath = attachmentRelativePath(directory, file.name);
      const setStatus = (status: UploadItem['status'], errorText?: string) => {
        setUploadQueue((queue) =>
          queue.map((item, i) => (i === index ? { ...item, status, error: errorText } : item)),
        );
      };

      try {
        const fd = new FormData();
        fd.append('modelId', modelId);
        if (category && category !== 'auto') fd.append('category', category);
        fd.append('files', file);
        fd.append('relativePaths', relativePath);

        const response = await fetch('/api/threed/models/files', { method: 'POST', body: fd });
        const data = await response.json();
        if (data.success) {
          setStatus('done');
          return true;
        } else {
          setStatus('error', data.error || 'Upload failed');
          return false;
        }
      } catch (err) {
        setStatus('error', String(err));
        return false;
      }
    },
    [modelId, category],
  );

  const handleUpload = useCallback(
    async (input: FileList | File[], uploadDirectory = attachmentDirectory) => {
      const filesToUpload = Array.from(input);
      if (!modelId || filesToUpload.length === 0) return;
      const problem = attachmentDirectoryProblem(uploadDirectory);
      if (problem) {
        showToast(problem, 'error');
        return;
      }

      setUploadQueue(filesToUpload.map((file) => ({
        name: attachmentRelativePath(uploadDirectory, file.name),
        status: 'uploading' as const,
      })));

      // Upload all files in parallel, tracking each independently.
      const results = await Promise.all(filesToUpload.map((_, i) => uploadOne(filesToUpload, i, uploadDirectory)));

      // Refresh the file list + model counts.
      await loadFiles(Number(modelId));
      await loadModels();
      await loadDependencies(Number(modelId));

      const errorCount = results.filter((success) => !success).length;
      // Clear progress chips after showing the result.
      setTimeout(() => setUploadQueue([]), 1600);
      if (errorCount) {
        showToast(`${errorCount} file(s) failed`, 'error');
      } else {
        showToast(`${results.length} file(s) attached`, 'success');
      }
    },
    [modelId, uploadOne, loadFiles, loadModels, loadDependencies, showToast, attachmentDirectory],
  );

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const fl = e.target.files;
      const requirement = pendingRequirementRef.current;
      pendingRequirementRef.current = null;
      if (fl && fl.length && requirement) {
        const selectedFile = fl[0];
        if (fl.length !== 1 || selectedFile.name.toLowerCase() !== requirement.fileName.toLowerCase()) {
          showToast(`Choose the required file: ${requirement.fileName}`, 'error');
        } else {
          const requiredDirectory = requirement.relativePath.split('/').slice(0, -1).join('/') || 'dependencies';
          void handleUpload([selectedFile], requiredDirectory);
        }
      } else if (fl && fl.length) {
        void handleUpload(fl);
      }
      e.target.value = '';
    },
    [handleUpload, showToast],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const fl = e.dataTransfer.files;
      if (fl && fl.length) void handleUpload(fl);
    },
    [handleUpload],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ============================================
  // ACTIONS
  // ============================================
  const handleDelete = useCallback(
    async (file: ModelFileRow) => {
      setDeletingId(file.id);
      try {
        const response = await fetch(`/api/threed/models/files/${file.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          showToast('File deleted', 'success');
          await loadFiles(Number(modelId));
          await loadModels();
          await loadDependencies(Number(modelId));
        } else {
          showToast(data.error || 'Failed to delete file', 'error');
        }
      } catch (err) {
        console.error('Error deleting file:', err);
        showToast('Failed to delete file', 'error');
      } finally {
        setDeletingId(null);
        setDeleteTarget(null);
      }
    },
    [modelId, loadFiles, loadModels, loadDependencies, showToast],
  );

  const handleSetPrimary = useCallback(
    async (file: ModelFileRow) => {
      if (file.fileType !== 'model') return;
      setPrimaryFileId(file.id);
      try {
        const response = await fetch(`/api/threed/models?id=${modelId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mainModelFileId: file.id }),
        });
        const data = await response.json();
        if (data.success) {
          showToast('Set as primary model file', 'success');
          await loadFiles(Number(modelId));
          await loadModels();
          await loadDependencies(Number(modelId));
        } else {
          showToast(data.error || 'Failed to set primary file', 'error');
        }
      } catch (err) {
        console.error('Error setting primary file:', err);
        showToast('Failed to set primary file', 'error');
      } finally {
        setPrimaryFileId(null);
      }
    },
    [modelId, loadFiles, loadModels, loadDependencies, showToast],
  );

  const handleCopy = useCallback(
    async (file: ModelFileRow) => {
      try {
        await navigator.clipboard.writeText(file.filePath);
        setCopiedPath(file.filePath);
        showToast('URL copied to clipboard', 'success');
        setTimeout(() => setCopiedPath(null), 1500);
      } catch {
        showToast('Failed to copy URL', 'error');
      }
    },
    [showToast],
  );

  const requestUpload = useCallback(() => {
    const problem = attachmentDirectoryProblem(attachmentDirectory);
    if (problem) {
      showToast(problem, 'error');
      return;
    }
    pendingRequirementRef.current = null;
    fileInputRef.current?.click();
  }, [attachmentDirectory, showToast]);

  const requestRequirementUpload = useCallback((requirement: ModelDependencyRequirement) => {
    const directory = requirement.relativePath.split('/').slice(0, -1).join('/') || 'dependencies';
    if (directory.length > 100) {
      showToast('The required dependency directory exceeds the 100-character upload boundary.', 'error');
      return;
    }
    setAttachmentDirectory(directory);
    setCategory(requirement.kind === 'texture' ? 'texture' : requirement.kind === 'buffer' ? 'binary' : 'other');
    pendingRequirementRef.current = requirement;
    requestAnimationFrame(() => fileInputRef.current?.click());
  }, [showToast]);

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderFileActions = (file: ModelFileRow, compact = false) => (
    <div className="flex items-center gap-1 shrink-0">
      {file.fileType === 'model' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={file.id === mainModelFileId ? 'Primary model file' : 'Set as primary model file'}
          onClick={() => handleSetPrimary(file)}
          disabled={primaryFileId === file.id || file.id === mainModelFileId}
        >
          {file.id === mainModelFileId ? (
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          ) : primaryFileId === file.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Star className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title="Copy URL"
        onClick={() => handleCopy(file)}
      >
        {copiedPath === file.filePath ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
      <a
        href={file.filePath}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground"
        title="Open in new tab"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-red-500 hover:text-red-600"
        title="Delete"
        onClick={() => setDeleteTarget(file)}
        disabled={deletingId === file.id}
      >
        {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
    </div>
  );

  const renderListRow = (file: ModelFileRow) => (
    <div key={file.id} className="flex items-center gap-3 p-2 border rounded-lg">
      {isImageRow(file) ? (
        <img src={file.filePath} alt={file.fileName} className="w-10 h-10 rounded object-cover bg-muted/30" loading="lazy" />
      ) : (
        <div className="w-10 h-10 rounded bg-muted/40 flex items-center justify-center">
          <FileIcon type={file.fileType} className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.fileName}</p>
        {file.relativePath && file.relativePath !== file.fileName && (
          <p className="text-[11px] font-mono text-cyan-500/90 truncate" title={file.relativePath}>
            {file.relativePath}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground truncate">
          {file.textureType ? `${file.textureType} · ` : ''}
          {formatSize(file.fileSize)}
          {file.isBinaryBuffer ? ' · binary' : ''}
          {file.loadOrder != null ? ` · order ${file.loadOrder}` : ''}
          {file.createdAt ? ` · ${formatDate(file.createdAt)}` : ''}
        </p>
      </div>
      {file.id === mainModelFileId && <Badge className="text-[10px] bg-blue-500">Primary</Badge>}
      {renderFileActions(file)}
    </div>
  );

  const renderGridCard = (file: ModelFileRow) => (
    <div key={file.id} className="border rounded-lg overflow-hidden">
      <FileCardThumbnail file={file} className="w-full h-28 object-cover bg-muted/20" />
      <div className="p-2">
        <p className="text-sm font-medium truncate" title={file.fileName}>{file.fileName}</p>
        {file.relativePath && file.relativePath !== file.fileName && (
          <p className="text-[10px] font-mono text-cyan-500/90 truncate" title={file.relativePath}>
            {file.relativePath}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground truncate">
          {file.textureType ? `${file.textureType} · ` : ''}
          {formatSize(file.fileSize)}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          {file.id === mainModelFileId ? (
            <Badge className="text-[9px] bg-blue-500">Primary</Badge>
          ) : (
            <span />
          )}
          {renderFileActions(file, true)}
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-3">
      {ToastComponent}

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.85fr)]">
          <ThreeDModelAssetPreview
            model={previewModel}
            attachedDependencyCount={dependencyAudit?.requirements.filter((item) => item.satisfied).length ?? 0}
            dependencyCount={dependencyAudit?.requirements.length ?? 0}
            title="Model Importer Canvas"
            description="Preview the primary Model with every texture and supportive file currently available."
            headerMeta={selectedModel ? (
              <div className="flex min-w-0 items-center gap-2 border-l pl-3">
                <FileIcon type="model" />
                <span className="max-w-48 truncate text-xs font-medium" title={selectedModel.modelName}>{selectedModel.modelName}</span>
                <Badge variant="outline" className="text-[10px]">{selectedModel.modelType}</Badge>
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">Model #{selectedModel.id}</span>
              </div>
            ) : null}
            headerActions={selectedModel ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Refresh Model Files"
                onClick={() => {
                  loadFiles(Number(modelId));
                  loadModels();
                  loadDependencies(Number(modelId));
                }}
                disabled={!modelId || loadingFiles || loadingModels}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingFiles || loadingModels ? 'animate-spin' : ''}`} />
              </Button>
            ) : null}
            canvasClassName="h-[min(48vh,480px)] min-h-[340px]"
            showMaterialInspector={['fbx', 'obj'].includes(previewModel?.modelType.toLowerCase() ?? '')}
            splitMaterialInspector
            textureLibrary={textureLibrary}
            onSaveMaterialAssignment={saveMaterialAssignment}
          />

      {/* Primary-file dependency requirements and attachment resolution. */}
      <section className="order-2 rounded-lg border bg-muted/20 p-3 lg:col-start-2 lg:row-start-1" aria-labelledby="model-dependencies-title">
        <div className="flex flex-wrap items-center gap-2">
          <Link2 className="h-4 w-4 text-cyan-400" />
          <h2 id="model-dependencies-title" className="text-xs font-semibold">Required Model dependencies</h2>
          {loadingDependencies && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {dependencyAudit?.status === 'analyzed' && dependencyAudit.requirements.length > 0 && (
            <Badge variant={dependencyAudit.complete ? 'secondary' : 'destructive'} className="text-[10px]">
              {dependencyAudit.requirements.filter((item) => item.satisfied).length}/{dependencyAudit.requirements.length} attached
            </Badge>
          )}
        </div>
        {selectedModel?.modelType.toLowerCase() === 'obj' && (
          <p className="mt-2 text-[11px] text-muted-foreground">Attach each required .MTL material library first. Its referenced texture images will then appear below. Materials update in the preview when their files are attached.</p>
        )}
        {dependencyError ? (
          <p className="mt-2 text-[11px] text-amber-400">{dependencyError}</p>
        ) : dependencyAudit?.status === 'missing_primary' ? (
          <p className="mt-2 text-[11px] text-muted-foreground">Set a primary Model file before attaching its dependencies.</p>
        ) : dependencyAudit?.status === 'not_supported' ? (
          <p className="mt-2 text-[11px] text-muted-foreground">Dependency inspection supports FBX, GLB, GLTF and OBJ primary files.</p>
        ) : dependencyAudit?.status === 'analyzed' && dependencyAudit.requirements.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">{selectedModel?.modelType.toLowerCase() === 'fbx' ? 'This FBX does not expose texture filenames. Choose its texture images below and the preview will retry them by filename.' : 'No external files are referenced. Embedded resources, vertex colors or default materials remain in use.'}</p>
        ) : dependencyAudit?.status === 'analyzed' ? (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {dependencyAudit.requirements.map((requirement) => {
              return (
                <div key={`${requirement.kind}:${requirement.relativePath}`} className="flex min-w-0 items-center gap-2 rounded border bg-background/30 px-2 py-1.5">
                  {requirement.satisfied
                    ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[10px]" title={requirement.relativePath}>{requirement.relativePath}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {requirement.satisfied ? `Attached: ${requirement.matchedRelativePath}` : `Missing ${requirement.kind}`}
                    </p>
                  </div>
                  {!requirement.satisfied && (
                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => requestRequirementUpload(requirement)}>
                      <Upload className="mr-1 h-3 w-3" />
                      Upload needed file
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      {/* User-defined storage directory for newly attached files. */}
      <div id="model-texture-importer" className="mt-3 scroll-mt-4 border-t border-border/70 pt-3">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-cyan-400" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold">Provide Model textures</h2>
            <p className="text-[11px] text-muted-foreground">Attach this Model's required textures, buffers, and supportive files.</p>
          </div>
        </div>

        <details className="mt-2 rounded border bg-background/25 p-2 text-[11px]">
          <summary className="cursor-pointer select-none text-muted-foreground">
            Storage destination: <span className="font-mono text-cyan-500/90">models/{modelId || '<modelId>'}/attachments/{normalizedAttachmentDirectory}/</span>
          </summary>
          <div className="mt-2">
            <Label htmlFor="model-files-directory" className="text-xs">Relative texture directory</Label>
            <div className="relative mt-1">
              <FolderTree className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="model-files-directory"
                value={attachmentDirectory}
                onChange={(event) => setAttachmentDirectory(event.target.value)}
                maxLength={100}
                placeholder="textures/buildings"
                className="h-8 pl-8 pr-14 font-mono text-xs"
                disabled={!modelId || uploading}
                required
                aria-required="true"
                aria-invalid={directoryHasInput && directoryProblem ? 'true' : 'false'}
                aria-describedby="model-files-directory-help"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {attachmentDirectory.length}/100
              </span>
            </div>
            <p id="model-files-directory-help" className={`mt-1.5 ${directoryHasInput && directoryProblem ? 'text-amber-400' : 'text-muted-foreground'}`}>
              {!directoryHasInput ? 'A relative directory is required.' : directoryProblem ?? 'The App selected this Model-owned directory automatically.'}
            </p>
          </div>
        </details>
      </div>

      {/* Drag-and-drop upload zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-muted'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".glb,.gltf,.fbx,.obj,.usdz,.bin,.mtl,image/*"
          onChange={onFileInputChange}
          disabled={!modelId || uploading || !!directoryProblem}
        />
        <div className="flex items-center justify-center gap-3 px-3 py-3 text-center">
          <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium">Drop Model files here</p>
            <p className="text-[10px] text-muted-foreground">The App uses the selected destination.</p>
          </div>
        </div>
      </div>

      {/* Upload progress chips */}
      {uploadQueue.length > 0 && (
        <div className="space-y-1">
          {uploadQueue.map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex items-center gap-2 text-xs">
              {item.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              {item.status === 'done' && <Check className="w-3.5 h-3.5 text-green-500" />}
              {item.status === 'error' && <X className="w-3.5 h-3.5 text-red-500" />}
              <span className="truncate flex-1">{item.name}</span>
              {item.status === 'error' && <span className="text-red-500 truncate max-w-[200px]">{item.error}</span>}
            </div>
          ))}
        </div>
      )}
      </section>
      </div>

      <section className="rounded-lg border bg-muted/10" aria-labelledby="model-file-management-title">
        <div className="px-3 py-2 text-xs font-medium" id="model-file-management-title">
          Model files and attachments <span className="text-muted-foreground">({stats.count})</span>
        </div>
        <div className="space-y-3 border-t p-3">
      {/* Toolbar: search / sort / view */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter files by name, path, or type..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger className="w-[170px] h-8 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded border p-0.5">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            title="List view"
            onClick={() => setView('list')}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            title="Grid view"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
        <Button type="button" size="sm" className="h-8 text-xs" onClick={requestUpload} disabled={!modelId || uploading || !!directoryProblem}>
          {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
          Upload files
        </Button>
      </div>

      {/* Files content */}
      {!modelId ? (
        <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg">
          <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Select a model to view and manage its files</p>
        </div>
      ) : loadingFiles ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 border rounded-lg animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-sm border rounded-lg">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
          <p className="text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadFiles(Number(modelId))}>
            Retry
          </Button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg">
          <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{files.length === 0 ? 'No files attached to this model yet' : 'No files match your filter'}</p>
          <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={requestUpload}>
            <Upload className="w-3 h-3 mr-1" /> Upload files
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filteredFiles.map(renderGridCard)}
        </div>
      ) : (
        <div className="space-y-3">
          {TYPE_ORDER.map((type) => {
            const group = groupedFiles[type] ?? [];
            if (group.length === 0) return null;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {TYPE_LABELS[type]}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{group.length}</Badge>
                </div>
                <div className="space-y-1">{group.map(renderListRow)}</div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      </section>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete file?</DialogTitle>
            <DialogDescription>
              This will permanently remove "{deleteTarget?.fileName}" from storage and the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deletingId != null}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deletingId != null}
            >
              {deletingId != null ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
