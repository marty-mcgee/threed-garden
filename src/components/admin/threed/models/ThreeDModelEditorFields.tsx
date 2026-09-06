'use client';

import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle, Box, CheckCircle2, File, Image, Loader2, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ThreeDModelCategoryOption } from './ThreeDModelCategoriesManager';
import type { ThreeDModelAdminFormData } from './model-admin-form-core';

export const MODEL_TYPE_OPTIONS = [
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

export const MODEL_STATUS_OPTIONS = [
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

export interface ThreeDModelEditorFile {
  id: number;
  fileName: string;
  fileType: string;
}

export interface ThreeDModelUploadAnalysis {
  status: 'analyzed' | 'not_supported';
  message?: string;
  geometryStatus?: string;
  meshCount?: number;
  triangleCount?: number;
  skinnedMeshCount?: number;
  invalidMeshCount?: number;
  colliderEligible?: boolean;
  reasons?: string[];
  componentCount?: number;
  components?: Array<{ sourcePath: string; meshType: string; triangleCount: number }>;
}

interface ThreeDModelEditorFieldsProps {
  mode: 'create' | 'edit';
  form: ThreeDModelAdminFormData;
  setForm: Dispatch<SetStateAction<ThreeDModelAdminFormData>>;
  categories: ThreeDModelCategoryOption[];
  files?: ThreeDModelEditorFile[];
  isSubmitting: boolean;
  uploadingPrimary: boolean;
  uploadingThumbnail: boolean;
  uploadAnalysis?: ThreeDModelUploadAnalysis | null;
  onPrimaryFile: (file: globalThis.File) => void;
  onThumbnail: (file: globalThis.File) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t pt-4">
      <Label className="text-sm font-medium">{title}</Label>
      {children}
    </section>
  );
}

function AttachmentIcon({ type }: { type: string }) {
  if (type === 'model') return <Box className="h-4 w-4 text-blue-500" />;
  if (type === 'texture') return <Image className="h-4 w-4 text-green-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function ThreeDModelEditorFields({
  mode,
  form,
  setForm,
  categories,
  files = [],
  isSubmitting,
  uploadingPrimary,
  uploadingThumbnail,
  uploadAnalysis,
  onPrimaryFile,
  onThumbnail,
}: ThreeDModelEditorFieldsProps) {
  const prefix = mode === 'edit' ? 'edit-' : 'create-';
  const id = (name: string) => `${prefix}${name}`;
  const disabled = isSubmitting;
  const modelFiles = files.filter((file) => file.fileType === 'model');
  const textureCount = files.filter((file) => file.fileType === 'texture').length;

  function update<K extends keyof ThreeDModelAdminFormData>(key: K, value: ThreeDModelAdminFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseFile(inputId: string) {
    document.getElementById(inputId)?.click();
  }

  return (
    <div className="space-y-4">
      <Section title="Basic Information">
        <div>
          <Label htmlFor={id('modelName')}>Model Name *</Label>
          <Input id={id('modelName')} value={form.modelName} onChange={(event) => update('modelName', event.target.value)} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor={id('modelType')}>Model Type *</Label>
          <Select value={form.modelType} onValueChange={(value) => update('modelType', value)} disabled={disabled}>
            <SelectTrigger id={id('modelType')}><SelectValue placeholder="Select model type" /></SelectTrigger>
            <SelectContent>{MODEL_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Model File and Preview">
        <div>
          <Label htmlFor={id('filePath')}>File Path / URL *</Label>
          <Input id={id('filePath')} value={form.filePath} onChange={(event) => update('filePath', event.target.value)} disabled={disabled} placeholder="/models/example.glb" />
        </div>
        <div className="flex items-center gap-2">
          <input
            id={id('model-file-upload')}
            type="file"
            className="hidden"
            accept=".glb,.gltf,.fbx,.obj,.usdz"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onPrimaryFile(file);
              event.target.value = '';
            }}
            disabled={uploadingPrimary || disabled}
          />
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => chooseFile(id('model-file-upload'))} disabled={uploadingPrimary || disabled}>
            {uploadingPrimary ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
            {mode === 'edit' ? 'Upload Replacement File' : 'Upload Model File'}
          </Button>
          {form.filePath && <span className="truncate text-xs text-muted-foreground">✓ file selected</span>}
        </div>
        {uploadAnalysis && (
          <div className="space-y-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 p-3">
            <div className="flex items-start gap-2">
              {uploadAnalysis.status === 'analyzed'
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
              <div>
                <p className="text-xs font-medium">
                  {uploadAnalysis.status === 'analyzed' ? 'Model analyzed and ready to configure' : 'Model uploaded; limited analysis'}
                </p>
                {uploadAnalysis.message && <p className="text-[11px] text-muted-foreground">{uploadAnalysis.message}</p>}
              </div>
            </div>
            {uploadAnalysis.status === 'analyzed' && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded border bg-background/40 p-2"><p className="text-[10px] uppercase text-muted-foreground">Meshes</p><p className="text-sm font-semibold">{uploadAnalysis.meshCount?.toLocaleString() ?? '—'}</p></div>
                  <div className="rounded border bg-background/40 p-2"><p className="text-[10px] uppercase text-muted-foreground">Triangles</p><p className="text-sm font-semibold">{uploadAnalysis.triangleCount?.toLocaleString() ?? '—'}</p></div>
                  <div className="rounded border bg-background/40 p-2"><p className="text-[10px] uppercase text-muted-foreground">Components</p><p className="text-sm font-semibold">{uploadAnalysis.componentCount?.toLocaleString() ?? '—'}</p></div>
                  <div className="rounded border bg-background/40 p-2"><p className="text-[10px] uppercase text-muted-foreground">Geometry</p><p className="truncate text-sm font-semibold capitalize">{uploadAnalysis.geometryStatus?.replace('_', ' ') ?? '—'}</p></div>
                </div>
                {(uploadAnalysis.skinnedMeshCount ?? 0) > 0 && <p className="text-[11px] text-muted-foreground">Includes {uploadAnalysis.skinnedMeshCount?.toLocaleString()} skinned mesh(es); configure through the Character runtime when appropriate.</p>}
                {(uploadAnalysis.reasons?.length ?? 0) > 0 && <p className="text-[11px] text-muted-foreground">{uploadAnalysis.reasons?.join(' · ')}</p>}
              </>
            )}
          </div>
        )}
        {mode === 'edit' && <p className="text-[10px] text-muted-foreground">Uploading updates this form. Save Changes to persist the replacement file URL.</p>}
        <div>
          <Label htmlFor={id('fileSize')} className="text-xs">File Size (bytes)</Label>
          <Input id={id('fileSize')} type="number" min="0" value={form.fileSize} onChange={(event) => update('fileSize', event.target.value)} disabled={disabled} />
        </div>
        <div className="space-y-2 rounded border p-2">
          <div>
            <Label htmlFor={id('thumbnailUrl')} className="text-xs">Library Preview Image</Label>
            <Input id={id('thumbnailUrl')} value={form.thumbnailUrl} placeholder="HTTPS JPG, PNG, or WebP URL" onChange={(event) => update('thumbnailUrl', event.target.value)} disabled={disabled} />
          </div>
          {form.thumbnailUrl && <img src={form.thumbnailUrl} alt="Model Library preview" className="h-28 w-full rounded border bg-muted object-contain" />}
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={id('thumbnail-upload')}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onThumbnail(file);
                event.target.value = '';
              }}
              disabled={uploadingThumbnail || disabled}
            />
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => chooseFile(id('thumbnail-upload'))} disabled={uploadingThumbnail || disabled}>
              {uploadingThumbnail ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              {form.thumbnailUrl ? 'Replace Preview' : 'Upload Preview'}
            </Button>
            {form.thumbnailUrl && <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => update('thumbnailUrl', '')} disabled={uploadingThumbnail || disabled}><X className="mr-1 h-4 w-4" />Remove</Button>}
          </div>
          <p className="text-[10px] text-muted-foreground">JPG, PNG, or WebP up to 5 MB. A square top-view image is recommended.</p>
        </div>
        {mode === 'create' && <p className="text-[10px] text-muted-foreground">Add textures and supportive media from Model Files after creating the Model.</p>}
      </Section>

      {mode === 'edit' && (
        <Section title="Attached Files">
          <div>
            <Label htmlFor={id('mainModelFileId')} className="text-xs">Primary Model File</Label>
            <Select value={form.mainModelFileId || 'none'} onValueChange={(value) => update('mainModelFileId', value === 'none' ? '' : value)} disabled={disabled}>
              <SelectTrigger id={id('mainModelFileId')}><SelectValue placeholder="Select primary Model file" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {modelFiles.map((file) => <SelectItem key={file.id} value={String(file.id)}>{file.fileName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded border bg-muted/30 px-2 py-1.5">
            <span className="text-xs text-muted-foreground">Associated texture files</span>
            <Badge variant="outline" className="text-[10px]">{textureCount}</Badge>
          </div>
          <div className="space-y-1">
            {files.map((file) => <div key={file.id} className="flex items-center gap-2 text-xs text-muted-foreground"><AttachmentIcon type={file.fileType} /><span className="min-w-0 flex-1 truncate">{file.fileName}</span><span className="text-[10px] capitalize">{file.fileType}</span></div>)}
          </div>
        </Section>
      )}

      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor={id('scale')} className="text-xs">Scale</Label><Input id={id('scale')} type="number" step="0.01" min="0.01" value={form.scale} onChange={(event) => update('scale', event.target.value)} disabled={disabled} /></div>
          <div><Label htmlFor={id('rotationY')} className="text-xs">Rotation Y</Label><Input id={id('rotationY')} type="number" step="1" value={form.rotationY} onChange={(event) => update('rotationY', event.target.value)} disabled={disabled} /></div>
        </div>
        <div>
          <Label className="text-xs">Offset (X / Y / Z)</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(['offsetX', 'offsetY', 'offsetZ'] as const).map((key) => <Input key={key} aria-label={key} placeholder={key.slice(-1)} type="number" step="0.01" value={form[key]} onChange={(event) => update(key, event.target.value)} disabled={disabled} />)}
          </div>
        </div>
      </Section>

      <Section title="LOD and Animation">
        <div className="flex items-center gap-2"><Switch id={id('hasLOD')} checked={form.hasLOD} onCheckedChange={(value) => update('hasLOD', value)} disabled={disabled} /><Label htmlFor={id('hasLOD')}>Has LOD</Label></div>
        <div><Label htmlFor={id('lodLevels')} className="text-xs">LOD Levels (JSON object)</Label><Input id={id('lodLevels')} value={form.lodLevels} onChange={(event) => update('lodLevels', event.target.value)} disabled={disabled} /></div>
        <div><Label htmlFor={id('animations')} className="text-xs">Animations (JSON array)</Label><Input id={id('animations')} value={form.animations} onChange={(event) => update('animations', event.target.value)} disabled={disabled} /></div>
        <div>
          <Label htmlFor={id('defaultAnimation')} className="text-xs">Default Animation</Label>
          <Select value={form.defaultAnimation} onValueChange={(value) => update('defaultAnimation', value)} disabled={disabled}>
            <SelectTrigger id={id('defaultAnimation')}><SelectValue placeholder="Select default animation" /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{ANIMATION_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Publishing and Classification">
        <div>
          <Label htmlFor={id('status')} className="text-xs">Model Status</Label>
          <Select value={form.status} onValueChange={(value) => update('status', value)} disabled={disabled}>
            <SelectTrigger id={id('status')}><SelectValue /></SelectTrigger>
            <SelectContent>{MODEL_STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {([
          ['isActive', 'Active'],
          ['isDefault', 'Default Model'],
          ['isPublic', 'Public'],
          ['isLibraryItem', 'Model Library Item'],
          ['usedByPlants', 'Used by Plants'],
          ['usedByCharacters', 'Used by Characters'],
        ] as const).map(([key, label]) => <div key={key} className="flex items-center gap-2"><Switch id={id(key)} checked={form[key]} onCheckedChange={(value) => update(key, value)} disabled={disabled} /><Label htmlFor={id(key)}>{label}</Label></div>)}
        <p className="text-[10px] text-muted-foreground">Character Models use Character runtime rules and are excluded from direct Model Library placement.</p>
        <div><Label htmlFor={id('uploadedBy')} className="text-xs">Uploaded By</Label><Input id={id('uploadedBy')} value={form.uploadedBy} onChange={(event) => update('uploadedBy', event.target.value)} disabled={disabled} /></div>
        <div><Label htmlFor={id('metadata')} className="text-xs">Metadata (JSON object)</Label><Input id={id('metadata')} value={form.metadata} onChange={(event) => update('metadata', event.target.value)} disabled={disabled} /></div>
      </Section>

      <Section title="Categories">
        {categories.filter((category) => category.isActive).length === 0 ? (
          <p className="text-xs text-muted-foreground">Create an active Model category before assigning taxonomy.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {categories.filter((category) => category.isActive).map((category) => (
              <label key={category.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => update('categoryIds', form.categoryIds.includes(category.id) ? form.categoryIds.filter((categoryId) => categoryId !== category.id) : [...form.categoryIds, category.id])} disabled={disabled} />
                <span className="truncate">{category.name}</span>
              </label>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
