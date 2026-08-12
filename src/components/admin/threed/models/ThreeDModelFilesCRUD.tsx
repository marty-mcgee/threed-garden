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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

// ============================================
// TYPES
// ============================================
interface ModelFileRow {
  id: number;
  fileName: string;
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
}

interface ThreeDModelFilesCRUDProps {
  initialModelId?: number | null;
}

interface UploadItem {
  name: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

type ViewMode = 'list' | 'grid';
type SortMode = 'name' | 'size' | 'type' | 'newest';

// ============================================
// OPTIONS / HELPERS
// ============================================
const FILE_CATEGORY_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'model', label: 'Model File' },
  { value: 'texture', label: 'Texture' },
  { value: 'binary', label: 'Binary Buffer (.bin)' },
  { value: 'other', label: 'Supportive Media / Other' },
];

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
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>('auto');
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

  const selectedModel = useMemo(
    () => models.find((m) => String(m.id) === modelId) ?? null,
    [models, modelId],
  );
  const files = useMemo(() => modelDetail?.files ?? [], [modelDetail]);
  const mainModelFileId = modelDetail?.mainModelFileId ?? null;

  const uploading = uploadQueue.some((u) => u.status === 'uploading');

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

  useEffect(() => {
    if (modelId) {
      loadFiles(Number(modelId));
    } else {
      setModelDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  // ============================================
  // SELECTION-DERIVED DATA
  // ============================================
  const filteredFiles = useMemo(() => {
    const q = filter.toLowerCase();
    const list = files.filter(
      (f) => f.fileName.toLowerCase().includes(q) || f.fileType.toLowerCase().includes(q),
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
    async (fileList: File[], index: number) => {
      const file = fileList[index];
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

        const response = await fetch('/api/threed/models/files', { method: 'POST', body: fd });
        const data = await response.json();
        if (data.success) {
          setStatus('done');
        } else {
          setStatus('error', data.error || 'Upload failed');
        }
      } catch (err) {
        setStatus('error', String(err));
      }
    },
    [modelId, category],
  );

  const handleUpload = useCallback(
    async (input: FileList | File[]) => {
      const list = Array.from(input);
      if (!modelId || list.length === 0) return;

      setUploadQueue(list.map((f) => ({ name: f.name, status: 'uploading' as const })));

      // Upload all files in parallel, tracking each independently.
      await Promise.all(list.map((_, i) => uploadOne(list, i)));

      // Refresh the file list + model counts.
      await loadFiles(Number(modelId));
      await loadModels();

      const errors = uploadQueue.filter((u) => u.status === 'error');
      // Clear progress chips after showing the result.
      setTimeout(() => setUploadQueue([]), 1600);
      if (errors.length) {
        showToast(`${errors.length} file(s) failed`, 'error');
      }
    },
    [modelId, uploadOne, loadFiles, loadModels, showToast, uploadQueue],
  );

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const fl = e.target.files;
      if (fl && fl.length) handleUpload(fl);
      e.target.value = '';
    },
    [handleUpload],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const fl = e.dataTransfer.files;
      if (fl && fl.length) handleUpload(fl);
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
    [modelId, loadFiles, loadModels, showToast],
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
    [modelId, loadFiles, loadModels, showToast],
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
    fileInputRef.current?.click();
  }, []);

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

      {/* Controls: model + category */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="model-files-model" className="text-xs">Model</Label>
          <Select value={modelId} onValueChange={setModelId} disabled={loadingModels}>
            <SelectTrigger className="h-8 text-xs">
              {loadingModels ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.modelName} ({m.modelType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[190px]">
          <Label htmlFor="model-files-category" className="text-xs">File category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Auto-detect" />
            </SelectTrigger>
            <SelectContent>
              {FILE_CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="Refresh"
          onClick={() => {
            loadFiles(Number(modelId));
            loadModels();
          }}
          disabled={!modelId || loadingFiles}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected model summary */}
      {selectedModel && (
        <div className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 bg-muted/30">
          <FileIcon type="model" />
          <span className="text-xs font-medium">{selectedModel.modelName}</span>
          <Badge variant="outline" className="text-[10px]">{selectedModel.modelType}</Badge>
          <Badge variant="outline" className="text-[10px]">{stats.count} files</Badge>
          <Badge variant="outline" className="text-[10px]">{formatSize(stats.totalSize)}</Badge>
          <span className="text-[10px] text-muted-foreground truncate max-w-[240px]" title={selectedModel.filePath}>
            {selectedModel.filePath}
          </span>
        </div>
      )}

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
          accept=".glb,.gltf,.fbx,.obj,.usdz,.jpg,.jpeg,.png,.webp,.tga,.bmp,.bin"
          onChange={onFileInputChange}
          disabled={!modelId || uploading}
        />
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Drag & drop files here</p>
          <p className="text-xs text-muted-foreground mb-3">
            Model, texture, binary, and supportive media files
          </p>
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs"
            onClick={requestUpload}
            disabled={!modelId || uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            Choose Files
          </Button>
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

      {/* Toolbar: search / sort / view */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter files by name or type..."
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