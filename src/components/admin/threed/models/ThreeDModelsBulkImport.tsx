'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, FileImage, Files, Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  inspectThreeDModelMaterial,
  inspectThreeDModelPrimary,
  isThreeDModelRequirementSatisfied,
  normalizeThreeDModelRelativePath,
  type ThreeDModelCompanionRequirement,
} from '@/lib/services/threed/models/model-companion-core';
import type { ThreeDModelCategoryOption } from './ThreeDModelCategoriesManager';

const MAX_QUEUE_SIZE = 100;
const ACCEPTED_EXTENSIONS = new Set(['fbx', 'glb', 'gltf', 'obj']);
const COMPANION_ACCEPT = '.mtl,.bin,.png,.jpg,.jpeg,.webp,.tga,.bmp';
type QueueStatus = 'inspecting' | 'pending' | 'uploading' | 'creating' | 'attaching' | 'finalizing' | 'created' | 'failed';

interface PrimaryUpload { fileSize: number; modelType: string; url: string }
interface CompanionAttachment { file: File; relativePath: string }
interface QueueItem {
  companionFiles: CompanionAttachment[];
  error?: string;
  file: File;
  id: string;
  inspectionError?: string;
  modelId?: number;
  modelName: string;
  previewFile?: File;
  primaryUpload?: PrimaryUpload;
  requirements: ThreeDModelCompanionRequirement[];
  scale: string;
  status: QueueStatus;
  thumbnailUrl?: string;
  uploadedCompanionNames: string[];
}
interface BulkDefaults {
  categoryIds: number[];
  isActive: boolean;
  isLibraryItem: boolean;
  isPublic: boolean;
  usedByCharacters: boolean;
  usedByPlants: boolean;
}
interface BulkImportSummary { created: number; failed: number }

function extensionOf(name: string) { return name.split('.').pop()?.toLowerCase() ?? '' }
function modelNameFromFile(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function itemIdentity(file: File) { return `${file.name}\u0000${file.size}\u0000${file.lastModified}` }
function attachmentIdentity(attachment: CompanionAttachment) { return itemIdentity(attachment.file) }
function uniqueFiles(files: CompanionAttachment[]) {
  return [...new Map(files.map((attachment) => [attachmentIdentity(attachment), attachment])).values()];
}
function uniqueRequirements(entries: ThreeDModelCompanionRequirement[]) {
  return [...new Map(entries.map((entry) => [`${entry.kind}:${entry.relativePath.toLowerCase()}`, entry])).values()];
}
function selectedPaths(item: QueueItem) { return item.companionFiles.map((attachment) => attachment.relativePath) }
function missingRequirements(item: QueueItem) {
  const paths = selectedPaths(item);
  return item.requirements.filter((entry) => !isThreeDModelRequirementSatisfied(entry, paths));
}
function attachmentPathError(item: QueueItem): string | null {
  const normalized = item.companionFiles.map((attachment) => normalizeThreeDModelRelativePath(attachment.relativePath));
  const invalidIndex = normalized.findIndex((value) => !value);
  if (invalidIndex >= 0) return `Invalid relative path for ${item.companionFiles[invalidIndex].file.name}`;
  const duplicate = normalized.find((value, index) =>
    normalized.findIndex((candidate) => candidate?.toLowerCase() === value?.toLowerCase()) !== index);
  return duplicate ? `Duplicate relative path: ${duplicate}` : null;
}
async function readResponse(response: Response) {
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

export function ThreeDModelsBulkImport({ categories, onComplete }: {
  categories: ThreeDModelCategoryOption[];
  onComplete: (summary: BulkImportSummary) => void | Promise<void>;
}) {
  const primaryRef = useRef<HTMLInputElement>(null);
  const companionRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const [attachmentTargetId, setAttachmentTargetId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<BulkDefaults>({
    categoryIds: [], isActive: true, isLibraryItem: true, isPublic: false, usedByCharacters: false, usedByPlants: false,
  });
  const eligible = items.filter((item) => item.status === 'pending' || item.status === 'failed');
  const readyCount = eligible.filter((item) =>
    !item.inspectionError && !attachmentPathError(item) && missingRequirements(item).length === 0).length;
  const createdCount = items.filter((item) => item.status === 'created').length;
  const activeCategories = useMemo(() => categories.filter((category) => category.isActive), [categories]);

  async function addPrimaryFiles(files: FileList | null) {
    if (!files) return;
    setSelectionError(null);
    const identities = new Set(items.map((item) => item.id));
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_EXTENSIONS.has(extensionOf(file.name))) { rejected.push(file.name); continue }
      if (!identities.has(itemIdentity(file))) { identities.add(itemIdentity(file)); accepted.push(file) }
    }
    if (items.length + accepted.length > MAX_QUEUE_SIZE) {
      setSelectionError(`A bulk queue may contain at most ${MAX_QUEUE_SIZE} Models.`);
      return;
    }
    if (rejected.length) setSelectionError(`Unsupported primary files skipped: ${rejected.join(', ')}`);
    const additions: QueueItem[] = accepted.map((file) => ({
      companionFiles: [], file, id: itemIdentity(file), modelName: modelNameFromFile(file.name), requirements: [],
      scale: '1.00', status: 'inspecting', uploadedCompanionNames: [],
    }));
    setItems((current) => [...current, ...additions]);
    await Promise.all(additions.map(async (item) => {
      try {
        const requirements = inspectThreeDModelPrimary(item.file.name, new Uint8Array(await item.file.arrayBuffer()));
        setItems((current) => current.map((candidate) => candidate.id === item.id
          ? { ...candidate, requirements, status: 'pending' } : candidate));
      } catch (error) {
        setItems((current) => current.map((candidate) => candidate.id === item.id ? {
          ...candidate, inspectionError: error instanceof Error ? error.message : 'Unable to inspect primary file', status: 'failed',
        } : candidate));
      }
    }));
  }

  async function addCompanions(id: string, files: FileList | null) {
    if (!files) return;
    const target = items.find((item) => item.id === id);
    if (!target) return;
    const usedRequirementPaths = new Set(target.companionFiles.map((attachment) => attachment.relativePath.toLowerCase()));
    const additions = Array.from(files).map((file) => {
      const requirement = target.requirements.find((entry) =>
        entry.fileName.toLowerCase() === file.name.toLowerCase() && !usedRequirementPaths.has(entry.relativePath.toLowerCase()));
      const relativePath = requirement?.relativePath ?? file.name;
      usedRequirementPaths.add(relativePath.toLowerCase());
      return { file, relativePath };
    });
    const discovered: ThreeDModelCompanionRequirement[] = [];
    for (const attachment of additions) {
      if (extensionOf(attachment.file.name) === 'mtl') {
        discovered.push(...inspectThreeDModelMaterial(attachment.file.name, await attachment.file.text(), attachment.relativePath));
      }
    }
    setItems((current) => current.map((item) => item.id === id ? {
      ...item, companionFiles: uniqueFiles([...item.companionFiles, ...additions]), error: undefined,
      requirements: uniqueRequirements([...item.requirements, ...discovered]), status: item.status === 'failed' && !item.modelId ? 'pending' : item.status,
    } : item));
  }

  function updateItem(id: string, updates: Partial<Pick<QueueItem, 'modelName' | 'scale' | 'previewFile'>>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  }
  function toggleCategory(id: number) {
    setDefaults((current) => ({ ...current, categoryIds: current.categoryIds.includes(id)
      ? current.categoryIds.filter((value) => value !== id) : [...current.categoryIds, id] }));
  }
  async function uploadPrimary(item: QueueItem): Promise<PrimaryUpload> {
    if (item.primaryUpload) return item.primaryUpload;
    const form = new FormData(); form.append('file', item.file);
    const result = await readResponse(await fetch('/api/threed/models/upload', { method: 'POST', body: form }));
    const upload = { fileSize: result.data.fileSize, modelType: result.data.modelType, url: result.data.url };
    setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, primaryUpload: upload } : candidate));
    return upload;
  }
  async function uploadPreview(item: QueueItem) {
    if (!item.previewFile) return undefined;
    if (item.thumbnailUrl) return item.thumbnailUrl;
    const form = new FormData(); form.append('file', item.previewFile); form.append('purpose', 'thumbnail');
    const result = await readResponse(await fetch('/api/threed/models/upload', { method: 'POST', body: form }));
    setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, thumbnailUrl: result.data.url } : candidate));
    return result.data.url as string;
  }

  async function importQueue() {
    if (!eligible.length) return;
    const invalid = eligible.find((item) => item.inspectionError || attachmentPathError(item) || missingRequirements(item).length
      || !item.modelName.trim() || !Number.isFinite(Number(item.scale)) || Number(item.scale) <= 0);
    if (invalid) {
      const missing = missingRequirements(invalid);
      setSelectionError(invalid.inspectionError ? `${invalid.file.name}: ${invalid.inspectionError}`
        : attachmentPathError(invalid) ? `${invalid.file.name}: ${attachmentPathError(invalid)}`
        : missing.length ? `${invalid.file.name} still requires: ${missing.map((entry) => entry.relativePath).join(', ')}`
          : `Review the name and positive scale for ${invalid.file.name}.`);
      return;
    }
    setImporting(true); setSelectionError(null);
    let created = 0; let failed = 0;
    for (const queued of eligible) {
      try {
        let modelId = queued.modelId;
        if (!modelId) {
          setItems((current) => current.map((item) => item.id === queued.id ? { ...item, error: undefined, status: 'uploading' } : item));
          const upload = await uploadPrimary(queued);
          const thumbnailUrl = await uploadPreview(queued);
          setItems((current) => current.map((item) => item.id === queued.id ? { ...item, status: 'creating' } : item));
          const result = await readResponse(await fetch('/api/threed/models', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
              modelName: queued.modelName.trim(), modelType: upload.modelType, filePath: upload.url, fileSize: upload.fileSize,
              thumbnailUrl, categoryIds: defaults.categoryIds, scale: queued.scale, rotationY: '0.0', offsetX: '0.0',
              offsetY: '0.0', offsetZ: '0.0', isActive: false, status: 'pending', isPublic: defaults.isPublic,
              isLibraryItem: defaults.isLibraryItem, usedByPlants: defaults.usedByPlants, usedByCharacters: defaults.usedByCharacters,
              metadata: { bulkImportOriginalFileName: queued.file.name,
                companionFileNames: queued.companionFiles.map((attachment) => attachment.file.name),
                companionRelativePaths: queued.companionFiles.map((attachment) => attachment.relativePath),
                companionRequirementNames: queued.requirements.map((entry) => entry.relativePath) },
            }),
          }));
          modelId = result.data.id;
          queued.modelId = modelId;
          setItems((current) => current.map((item) => item.id === queued.id ? { ...item, modelId } : item));
        }
        for (const companion of queued.companionFiles) {
          const identity = attachmentIdentity(companion);
          if (queued.uploadedCompanionNames.includes(identity)) continue;
          setItems((current) => current.map((item) => item.id === queued.id ? { ...item, status: 'attaching' } : item));
          const form = new FormData();
          form.append('modelId', String(modelId));
          form.append('files', companion.file);
          form.append('relativePaths', companion.relativePath);
          await readResponse(await fetch('/api/threed/models/files', { method: 'POST', body: form }));
          queued.uploadedCompanionNames.push(identity);
          setItems((current) => current.map((item) => item.id === queued.id
            ? { ...item, uploadedCompanionNames: [...item.uploadedCompanionNames, identity] } : item));
        }
        setItems((current) => current.map((item) => item.id === queued.id ? { ...item, status: 'finalizing' } : item));
        await readResponse(await fetch(`/api/threed/models?id=${modelId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: defaults.isActive, status: 'active' }),
        }));
        created += 1;
        setItems((current) => current.map((item) => item.id === queued.id ? { ...item, modelId, status: 'created' } : item));
      } catch (error) {
        failed += 1;
        setItems((current) => current.map((item) => item.id === queued.id ? {
          ...item, error: error instanceof Error ? error.message : 'Import failed', status: 'failed',
        } : item));
      }
    }
    setImporting(false);
    await onComplete({ created, failed });
  }

  return <Dialog open={open} onOpenChange={(value) => { if (!importing) setOpen(value) }}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs"><Files className="mr-1 h-3 w-3" /> Bulk Add</Button></DialogTrigger>
    <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
      <DialogHeader><DialogTitle>Bulk Add ThreeD Models</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
          Select OBJ, FBX, GLTF, or GLB primary files. Each file is inspected for declared companions, and its Model remains inactive until all required attachments are selected and saved.
        </div>
        <input ref={primaryRef} type="file" multiple accept=".fbx,.glb,.gltf,.obj" className="hidden" disabled={importing}
          onChange={(event) => { void addPrimaryFiles(event.target.files); event.target.value = '' }} />
        <input ref={companionRef} type="file" multiple accept={COMPANION_ACCEPT} className="hidden" disabled={importing}
          onChange={(event) => { if (attachmentTargetId) void addCompanions(attachmentTargetId, event.target.files); event.target.value = '' }} />
        <input ref={previewRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" disabled={importing}
          onChange={(event) => { const file = event.target.files?.[0]; if (attachmentTargetId && file) updateItem(attachmentTargetId, { previewFile: file }); event.target.value = '' }} />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" className="h-8 text-xs" disabled={importing || items.length >= MAX_QUEUE_SIZE} onClick={() => primaryRef.current?.click()}><Upload className="mr-1 h-3.5 w-3.5" /> Select Primary Files</Button>
          <Badge variant="secondary" className="text-[10px]">{items.length}/{MAX_QUEUE_SIZE} queued</Badge>
          {!!items.length && <Button type="button" variant="ghost" size="sm" className="ml-auto h-8 text-xs" disabled={importing} onClick={() => { setItems([]); setSelectionError(null) }}>Clear Queue</Button>}
        </div>
        {selectionError && <div className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700"><AlertCircle className="h-4 w-4 shrink-0" />{selectionError}</div>}
        {!!items.length && <>
          <div className="grid gap-3 rounded border p-3 md:grid-cols-2">
            <div className="space-y-2"><Label className="text-xs">Categories applied to every queued Model</Label>
              {activeCategories.length ? <div className="grid grid-cols-2 gap-1.5">{activeCategories.map((category) => <label key={category.id} className="flex items-center gap-2 rounded border px-2 py-1 text-xs"><input type="checkbox" checked={defaults.categoryIds.includes(category.id)} disabled={importing} onChange={() => toggleCategory(category.id)} /><span className="truncate">{category.name}</span></label>)}</div>
                : <p className="text-xs text-muted-foreground">No active categories available.</p>}
            </div>
            <div className="grid grid-cols-2 content-start gap-2 text-xs">{([['isActive', 'Active after import'], ['isLibraryItem', 'Library Item'], ['isPublic', 'Public'], ['usedByPlants', 'Used by Plants'], ['usedByCharacters', 'Used by Characters']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2"><Switch checked={defaults[key]} disabled={importing} onCheckedChange={(checked) => setDefaults((current) => ({ ...current, [key]: checked }))} /><span>{label}</span></label>)}</div>
          </div>
          <div className="space-y-2">{items.map((item) => <QueueRow key={item.id} item={item} importing={importing}
            updateItem={updateItem} setItems={setItems}
            selectCompanions={() => { setAttachmentTargetId(item.id); companionRef.current?.click() }}
            selectPreview={() => { setAttachmentTargetId(item.id); previewRef.current?.click() }} />)}</div>
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">{createdCount} created · {readyCount} ready · {eligible.length - readyCount} needs review</p>
            <Button type="button" size="sm" disabled={importing || eligible.length === 0} onClick={() => void importQueue()}>{importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{importing ? 'Importing sequentially…' : `Import ${eligible.length} Model${eligible.length === 1 ? '' : 's'}`}</Button>
          </div>
        </>}
      </div>
    </DialogContent>
  </Dialog>;
}

function QueueRow({ item, importing, updateItem, setItems, selectCompanions, selectPreview }: {
  item: QueueItem;
  importing: boolean;
  updateItem: (id: string, updates: Partial<Pick<QueueItem, 'modelName' | 'scale' | 'previewFile'>>) => void;
  setItems: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  selectCompanions: () => void;
  selectPreview: () => void;
}) {
  const missing = missingRequirements(item);
  const pathError = attachmentPathError(item);
  const locked = importing || item.status === 'created' || !!item.modelId;
  return <div className="space-y-2 rounded border p-2.5">
    <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px_auto]">
      <div className="min-w-0"><p className="truncate text-xs font-medium">{item.file.name}</p><p className="text-[10px] text-muted-foreground">{extensionOf(item.file.name).toUpperCase()} · {formatFileSize(item.file.size)}</p></div>
      <Input value={item.modelName} className="h-7 text-xs" disabled={locked} onChange={(event) => updateItem(item.id, { modelName: event.target.value })} />
      <Input value={item.scale} type="number" min="0.01" step="0.01" className="h-7 text-xs" disabled={locked} onChange={(event) => updateItem(item.id, { scale: event.target.value })} />
      <div className="flex min-w-24 items-center justify-end gap-1">
        {item.status === 'created' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        {item.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600" />}
        {['inspecting', 'uploading', 'creating', 'attaching', 'finalizing'].includes(item.status) && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        <span className="text-[10px] capitalize text-muted-foreground">{item.status}</span>
        {(item.status === 'pending' || item.status === 'failed') && !locked && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" title="Remove from queue" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}><Trash2 className="h-3 w-3" /></Button>}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" disabled={locked} onClick={selectCompanions}><Paperclip className="mr-1 h-3 w-3" /> Companion Files</Button>
      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" disabled={locked} onClick={selectPreview}><FileImage className="mr-1 h-3 w-3" /> Preview</Button>
      {item.previewFile && <Badge variant="outline" className="gap-1 text-[10px]">{item.previewFile.name}{!locked && <button type="button" onClick={() => updateItem(item.id, { previewFile: undefined })}><X className="h-3 w-3" /></button>}</Badge>}
      {item.companionFiles.map((attachment) => <div key={attachmentIdentity(attachment)} className="flex items-center gap-1 rounded border p-1">
        <span className="max-w-32 truncate text-[10px]" title={attachment.file.name}>{attachment.file.name}</span>
        <span className="text-[10px] text-muted-foreground">→</span>
        <Input
          value={attachment.relativePath}
          disabled={locked}
          className="h-6 w-52 px-1.5 text-[10px]"
          aria-label={`Relative path for ${attachment.file.name}`}
          placeholder="textures/example.png"
          onChange={(event) => setItems((current) => current.map((candidate) => candidate.id === item.id ? {
            ...candidate,
            companionFiles: candidate.companionFiles.map((currentAttachment) =>
              attachmentIdentity(currentAttachment) === attachmentIdentity(attachment)
                ? { ...currentAttachment, relativePath: event.target.value }
                : currentAttachment),
          } : candidate))}
        />
        {!locked && <button type="button" aria-label={`Remove ${attachment.file.name}`} onClick={() => setItems((current) => current.map((candidate) => candidate.id === item.id ? {
          ...candidate,
          companionFiles: candidate.companionFiles.filter((currentAttachment) => attachmentIdentity(currentAttachment) !== attachmentIdentity(attachment)),
        } : candidate))}><X className="h-3 w-3" /></button>}
      </div>)}
    </div>
    {item.requirements.length === 0 && !item.inspectionError && item.status !== 'inspecting'
      ? <p className="text-[10px] text-muted-foreground">No external companion reference was detected. Additional support files may still be attached explicitly.</p>
      : <div className="flex flex-wrap gap-1.5">{item.requirements.map((requirement) => {
        const satisfied = isThreeDModelRequirementSatisfied(requirement, selectedPaths(item));
        return <Badge key={`${requirement.kind}:${requirement.relativePath}`} variant={satisfied ? 'secondary' : 'destructive'} className="gap-1 text-[10px]">{satisfied ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}{requirement.relativePath} · {requirement.kind}</Badge>;
      })}</div>}
    {!!missing.length && <p className="text-[10px] text-amber-700">Required before import: {missing.map((entry) => entry.relativePath).join(', ')}</p>}
    {pathError && <p className="text-[10px] text-red-600">{pathError}</p>}
    {item.inspectionError && <p className="text-[10px] text-red-600">Inspection blocked: {item.inspectionError}</p>}
    {item.error && <p className="text-[10px] text-red-600">{item.error}{item.modelId ? ' The inactive Model remains available for retry or repair.' : ''}</p>}
  </div>;
}
