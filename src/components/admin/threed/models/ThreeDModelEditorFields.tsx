'use client';

import { MODEL_FALLBACK_SHAPES, readModelFallbackShape, setModelFallbackShape, type ModelFallbackShape } from '@/libraries/services/threed/models/model-fallback-core';
import { readModelLightBoost, setModelLightBoost } from '@/libraries/services/threed/models/model-lighting-core';
import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ThreeDModelCategoryOption } from './ThreeDModelCategoriesManager';
import type { ThreeDModelAdminFormData } from './model-admin-form-core';
import { readModelSource, setModelSource, type ModelSource } from '@/libraries/services/threed/models/model-source-core';
import { ModelFieldHelp } from './ModelFieldHelp';

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
  filePath: string;
  fileSize: number | null;
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
  modelId?: number;
  previewImageAction?: React.ReactNode;
  showPreviewImage?: boolean;
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
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

export function ThreeDModelEditorFields({
  mode,
  modelId,
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
  previewImageAction,
  showPreviewImage = true,
}: ThreeDModelEditorFieldsProps) {
  let fallbackMetadata: unknown = {};
  let fallbackMetadataValid = true;
  try {
    fallbackMetadata = JSON.parse(form.metadata || '{}');
    fallbackMetadataValid = Boolean(fallbackMetadata) && typeof fallbackMetadata === 'object' && !Array.isArray(fallbackMetadata);
  } catch { fallbackMetadataValid = false; }
  const prefix = mode === 'edit' ? 'edit-' : 'create-';
  const id = (name: string) => `${prefix}${name}`;
  const disabled = isSubmitting || uploadingPrimary || uploadingThumbnail;
  const modelFiles = files.filter((file) => file.fileType === 'model');
  const textureCount = files.filter((file) => file.fileType === 'texture').length;
  const primaryFile = modelFiles.find((file) => String(file.id) === form.mainModelFileId);
  const source = readModelSource({ ...form, metadata: fallbackMetadata });
  const fileFreeProcedural = source === 'shape';
  const geometrySource = source === 'shape' ? 'procedural' : 'model-file';
  const activeCategories = categories.filter(category => category.isActive);
  const assignedCategories = categories.filter(category => form.categoryIds.includes(category.id));
  const activeCategoryIds = new Set(activeCategories.map(category => category.id));
  const renderedCategoryIds = new Set<number>();

  function renderCategory(category: ThreeDModelCategoryOption): React.ReactNode {
    if (renderedCategoryIds.has(category.id)) return null;
    renderedCategoryIds.add(category.id);
    const children = activeCategories.filter(child => child.parentId === category.id);
    return <li key={category.id} className="space-y-1">
      <label className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
        <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => update('categoryIds', form.categoryIds.includes(category.id) ? form.categoryIds.filter(categoryId => categoryId !== category.id) : [...form.categoryIds, category.id])} disabled={disabled} />
        <span className="min-w-0 break-words">{category.name}</span>
      </label>
      {children.length > 0 && <ul className="ml-3 space-y-1 border-l pl-3">{children.map(renderCategory)}</ul>}
    </li>;
  }

  function update<K extends keyof ThreeDModelAdminFormData>(key: K, value: ThreeDModelAdminFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseFile(inputId: string) {
    document.getElementById(inputId)?.click();
  }

  const shapeFields = <>
    <div className="flex items-center gap-1"><Label htmlFor={id('fallbackShape')} className="text-xs">{fileFreeProcedural ? 'Procedural shape' : 'File recovery shape'}</Label><ModelFieldHelp label="Geometry shape">{fileFreeProcedural ? 'This is the active geometry. No Model file is used.' : 'Used only when imported geometry is unavailable in the generic Model viewer. Unconfigured Character fallbacks retain their Cylinder. Select Source: Shape to use this geometry for assigned Characters too.'}</ModelFieldHelp></div>
    <Select value={readModelFallbackShape(fallbackMetadata)} disabled={disabled || !fallbackMetadataValid}
      onValueChange={(value) => update('metadata', setModelFallbackShape(form.metadata, value as ModelFallbackShape))}>
      <SelectTrigger id={id('fallbackShape')}><SelectValue /></SelectTrigger>
      <SelectContent>{MODEL_FALLBACK_SHAPES.map((shape) => (
        <SelectItem key={shape} value={shape}>{shape === 'box' ? 'Box / Block' : shape[0].toUpperCase() + shape.slice(1)}</SelectItem>
      ))}</SelectContent>
    </Select>
    {!fallbackMetadataValid && <p className="text-xs text-amber-500">Correct the Metadata JSON below before choosing a shape.</p>}
  </>;

  return (
    <div className="space-y-4 [&_[role=switch]]:h-4 [&_[role=switch]]:w-7 [&_[role=switch]>span]:h-3 [&_[role=switch]>span]:w-3 [&_[role=switch]>span[data-state=checked]]:translate-x-3">
      <div className="rounded-md border p-3">
        <div>
          <div className="flex items-center gap-1"><Label htmlFor={id('modelName')}>Model Name *</Label><ModelFieldHelp label="Model name">Name of the reusable Model. Project instance names are separate. Changes apply on Save.</ModelFieldHelp></div>
          <Input id={id('modelName')} value={form.modelName} onChange={(event) => update('modelName', event.target.value)} disabled={disabled} />
        </div>
      </div>
      <Section title="Geometry">
        <div>
          <div className="flex items-center gap-1"><Label htmlFor={id('geometrySource')}>Source *</Label><ModelFieldHelp label="Geometry source">Model uses saved geometry; Shape uses the selected procedural shape, including assigned Characters; Character restores the saved rig in its existing runtime. All files, rig and animation settings are retained. Save applies the active source.</ModelFieldHelp></div>
          <Select value={source} onValueChange={value => setForm(current => ({ ...current, metadata: setModelSource(current.metadata, value as ModelSource), usedByCharacters: value === 'character' ? true : current.usedByCharacters, modelType: current.modelType || (value === 'shape' ? 'procedural' : 'glb') }))} disabled={disabled || !fallbackMetadataValid}>
            <SelectTrigger id={id('geometrySource')}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="model">Model</SelectItem><SelectItem value="shape">Shape</SelectItem><SelectItem value="character">Character</SelectItem><SelectItem value="other" disabled>Other [...]</SelectItem></SelectContent>
          </Select>
        </div>
        {geometrySource === 'model-file' && <div>
          {mode === 'edit' ? <Badge variant="outline" aria-label="File format">{form.modelType.toUpperCase()}</Badge> : <>
          <Label htmlFor={id('modelType')}>Model Format *</Label>
          <Select value={form.modelType} onValueChange={(value) => update('modelType', value)} disabled={disabled || Boolean(form.filePath)}>
            <SelectTrigger id={id('modelType')}><SelectValue placeholder="Select the Model file format" /></SelectTrigger>
            <SelectContent>{MODEL_TYPE_OPTIONS.filter((option) => ['glb', 'gltf', 'fbx', 'obj', 'usdz', form.modelType].includes(option.value) && option.value !== 'procedural').map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
          </>}
        </div>}
      {mode === 'edit' && geometrySource === 'model-file' && <div className="space-y-2">
        <div className="flex items-center gap-1"><Label htmlFor={id('primaryFile')}>Primary geometry file</Label><ModelFieldHelp label="Primary geometry file">Choose an existing attachment. Selection changes the primary geometry on Save; uploading alone does not select it. Select Source: Shape to stop using a file without clearing its saved configuration.</ModelFieldHelp></div>
        <Select value={form.mainModelFileId} disabled={disabled} onValueChange={value => {
          const file = modelFiles.find(item => String(item.id) === value);
          if (file) setForm(current => ({ ...current, mainModelFileId: value, filePath: file.filePath, fileSize: String(file.fileSize ?? ''), modelType: file.fileName.split('.').at(-1)?.toLowerCase() ?? current.modelType }));
        }}>
          <SelectTrigger id={id('primaryFile')}><SelectValue placeholder="Choose an attached Model file" /></SelectTrigger>
          <SelectContent>{modelFiles.map(file => <SelectItem key={file.id} value={String(file.id)} disabled={!file.filePath.trim() || !file.fileSize || file.fileSize <= 0}>{file.fileName}</SelectItem>)}</SelectContent>
        </Select>
      </div>}

        <div className="space-y-2 border-t pt-3">{shapeFields}</div>
      </Section>

      {mode === 'create' && geometrySource === 'model-file' && <Section title="Primary Model File">
        <div>
          <Label htmlFor={id('filePath')}>Primary Model File URL</Label>
          <Input id={id('filePath')} value={form.filePath} readOnly disabled={disabled} placeholder="Upload a Model File" />
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
            Upload Model File
          </Button>
          {form.filePath && <span className="truncate text-xs text-muted-foreground">✓ file selected</span>}
        </div>
        {uploadAnalysis && (
          <div className="rounded-md border border-cyan-500/30 bg-cyan-500/10 p-3">
            <div className="flex items-start gap-2">
              {uploadAnalysis.status === 'analyzed'
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
              <div>
                <p className="text-xs font-medium">
                  {uploadAnalysis.status === 'analyzed' ? 'Model analyzed and ready to configure' : 'Model uploaded; limited analysis'}
                </p>
                {uploadAnalysis.message && uploadAnalysis.status !== 'analyzed' && <p className="text-[11px] text-muted-foreground">{uploadAnalysis.message}</p>}
              </div>
            </div>
            {uploadAnalysis.status === 'analyzed' && (
              <details className="mt-2 text-[11px] text-muted-foreground">
                <summary className="cursor-pointer select-none">Technical analysis</summary>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  <span>Meshes</span><span className="text-right text-foreground">{uploadAnalysis.meshCount?.toLocaleString() ?? '—'}</span>
                  <span>Triangles</span><span className="text-right text-foreground">{uploadAnalysis.triangleCount?.toLocaleString() ?? '—'}</span>
                  <span>Components</span><span className="text-right text-foreground">{uploadAnalysis.componentCount?.toLocaleString() ?? '—'}</span>
                  <span>Geometry</span><span className="text-right capitalize text-foreground">{uploadAnalysis.geometryStatus?.replace('_', ' ') ?? '—'}</span>
                </div>
                {(uploadAnalysis.skinnedMeshCount ?? 0) > 0 && <p className="mt-2">Includes {uploadAnalysis.skinnedMeshCount?.toLocaleString()} skinned mesh(es).</p>}
                {(uploadAnalysis.reasons?.length ?? 0) > 0 && <p className="mt-1">{uploadAnalysis.reasons?.join(' · ')}</p>}
              </details>
            )}
          </div>
        )}
      </Section>}

      {showPreviewImage && <ThreeDModelPreviewImageFields mode={mode} form={form} setForm={setForm} isSubmitting={isSubmitting} uploadingPrimary={uploadingPrimary} uploadingThumbnail={uploadingThumbnail} onThumbnail={onThumbnail} previewImageAction={previewImageAction} />}

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
          ['usedByCharacters', 'Character runtime Model'],
        ] as const).map(([key, label]) => <div key={key} className="flex items-center gap-2"><Switch id={id(key)} checked={form[key]} onCheckedChange={(value) => update(key, value)} disabled={disabled} /><Label htmlFor={id(key)}>{label}</Label>{key === 'usedByCharacters' && <ModelFieldHelp label="Character runtime Model">
          {form.usedByCharacters
            ? 'Character runtime Models are excluded from the Dashboard Model Library and use the separate Character Library.'
            : 'Leave Character runtime Model off for ordinary props, buildings, environments, and other placeable Models.'}
        </ModelFieldHelp>}</div>)}
      </Section>

      <details className="space-y-2 rounded-md border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Categories{' '}
          {assignedCategories.length > 0 ? <span role="list" aria-label="Assigned categories" className="ml-2 inline-flex max-w-full flex-wrap gap-1 align-middle text-xs font-normal">
            {assignedCategories.map(category => <span key={category.id} role="listitem" className="rounded border bg-muted px-2 py-0.5 break-words">{category.name}</span>)}
          </span> : <span className="ml-2 text-xs font-normal text-muted-foreground">None assigned</span>}
        </summary>
        {activeCategories.length === 0 ? (
          <p className="text-xs text-muted-foreground">Create an active Model category before assigning taxonomy.</p>
        ) : (
          <ul className="space-y-2" aria-label="Model category hierarchy">
            {activeCategories.filter(category => category.parentId === null || !activeCategoryIds.has(category.parentId)).map(renderCategory)}
            {activeCategories.filter(category => !renderedCategoryIds.has(category.id)).map(renderCategory)}
          </ul>
        )}
      </details>
      {mode === 'edit' && (
        <Section title="Model Files">
          <p className="text-xs text-muted-foreground">
            {primaryFile
              ? <>Primary: <span className="text-foreground">{primaryFile.fileName}</span>{!primaryFile.filePath?.trim() && ' · missing file URL'}</>
              : fileFreeProcedural ? 'This procedural shape needs no Model file.' : 'No primary Model file is assigned.'}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">{files.length} attached file{files.length === 1 ? '' : 's'}</Badge>
            <Badge variant="outline" className="text-[10px]">{textureCount} texture{textureCount === 1 ? '' : 's'}</Badge>
          </div>
          {modelId && <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href={`/admin/threed/models/${modelId}?tab=files`}>Manage Model Files</Link>
          </Button>}
        </Section>
      )}

      <details className="rounded-md border p-3">
        <summary className="cursor-pointer text-sm font-medium">Advanced settings</summary>
        <div className="mt-3 space-y-4">
      <Section title="Technical metadata">
        <div><Label htmlFor={id('uploadedBy')} className="text-xs">Uploaded By</Label><Input id={id('uploadedBy')} value={form.uploadedBy} onChange={(event) => update('uploadedBy', event.target.value)} disabled={disabled} /></div>
        <div><Label htmlFor={id('metadata')} className="text-xs">Metadata (JSON object)</Label><Input id={id('metadata')} value={form.metadata} onChange={(event) => update('metadata', event.target.value)} disabled={disabled} /></div>
      </Section>
      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor={id('scale')} className="text-xs">Scale</Label><Input id={id('scale')} type="number" step="0.01" min="0.01" value={form.scale} onChange={(event) => update('scale', event.target.value)} disabled={disabled} /></div>
          <div><Label htmlFor={id('rotationY')} className="text-xs">Rotation Y (degrees)</Label><Input id={id('rotationY')} type="number" step="1" value={form.rotationY} onChange={(event) => update('rotationY', event.target.value)} disabled={disabled} /></div>
        </div>
        <div>
          <Label className="text-xs">Offset (X / Y / Z)</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(['offsetX', 'offsetY', 'offsetZ'] as const).map((key) => <Input key={key} aria-label={key} placeholder={key.slice(-1)} type="number" step="0.01" value={form[key]} onChange={(event) => update(key, event.target.value)} disabled={disabled} />)}
          </div>
        </div>
      </Section>

      <Section title="Model Lighting">
        <Label htmlFor={id('lightBoost')} className="text-xs">Light boost: {Math.round(readModelLightBoost(fallbackMetadata) * 100)}%</Label>
        <Input id={id('lightBoost')} type="range" min="0" max="1" step="0.05"
          value={readModelLightBoost(fallbackMetadata)}
          onChange={(event) => update('metadata', setModelLightBoost(form.metadata, Number(event.target.value)))}
          disabled={disabled || !fallbackMetadataValid || fileFreeProcedural} />
        <p className="text-xs text-muted-foreground">For file-based Models, adds brightness to this Model's lit materials in every Project that uses it. 0% keeps the GLB's original appearance; this does not illuminate nearby objects.</p>
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
        </div>
      </details>
    </div>
  );
}

export function ThreeDModelPreviewImageFields({ mode, form, setForm, isSubmitting, uploadingPrimary, uploadingThumbnail, onThumbnail, previewImageAction }: Pick<ThreeDModelEditorFieldsProps, 'mode' | 'form' | 'setForm' | 'isSubmitting' | 'uploadingPrimary' | 'uploadingThumbnail' | 'onThumbnail' | 'previewImageAction'>) {
  const id = (name: string) => `${mode === 'edit' ? 'edit-' : 'create-'}${name}`;
  const disabled = isSubmitting || uploadingPrimary || uploadingThumbnail;
  const update = (key: 'thumbnailUrl', value: string) => setForm(current => ({ ...current, [key]: value }));
  const chooseFile = (inputId: string) => document.getElementById(inputId)?.click();
  return (
      <section className="space-y-2" aria-label="Library Preview Image">
        <div className="flex items-center gap-1"><h3 className="text-sm font-medium">Library Preview Image</h3><ModelFieldHelp label="Library image">JPG, PNG, or WebP up to 5 MB. Use a clear square image. The URL and Remove edit the Model draft; Save Changes applies them.</ModelFieldHelp></div>
        <div className="space-y-2">
          <details className="rounded-md border p-2">
            <summary className="cursor-pointer text-xs font-medium">Image location</summary>
            <Label htmlFor={id('thumbnailUrl')} className="mt-2 block text-xs">Image URL</Label>
            <Input id={id('thumbnailUrl')} value={form.thumbnailUrl} placeholder="HTTPS JPG, PNG, or WebP URL" onChange={(event) => update('thumbnailUrl', event.target.value)} disabled={disabled} />
          </details>
          {form.thumbnailUrl && <img src={form.thumbnailUrl} alt="Model Library preview" className="h-28 w-full rounded border bg-transparent object-contain" />}
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
            {previewImageAction}
            {form.thumbnailUrl && <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => update('thumbnailUrl', '')} disabled={uploadingThumbnail || disabled}><X className="mr-1 h-4 w-4" />Remove</Button>}
          </div>
        </div>
        {mode === 'create' && <p className="text-[10px] text-muted-foreground">Add textures and supporting media from Model Files after creating the Model.</p>}
      </section>

  );
}
