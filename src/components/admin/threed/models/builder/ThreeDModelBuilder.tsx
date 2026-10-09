'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Hammer, Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ModelFieldHelp } from '../ModelFieldHelp';
import { ThreeDModelAssetPreview } from '../ThreeDModelAssetPreview';
import { ModelPreviewImageExport } from '../ModelPreviewImageExport';
import { loadBulkGltfBundle } from '../model-gltf-bundle-inspection';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { createThreeDModelMaterialInventory } from '@/libraries/services/threed/models/model-material-inventory-core';
import { uploadThreeDPrimaryFile } from '@/libraries/services/threed/models/model-primary-upload-client';
import { createCottage } from '@/libraries/services/threed/model-builder/cottage';
import { COTTAGE_DEFAULTS, COTTAGE_PARAMETER_FIELDS, canonicalCottageParameters } from '@/libraries/services/threed/model-builder/parameters';
import { exportCottageGlb, type BrowserCottageExport } from '@/libraries/services/threed/model-builder/export';
import {
  BuilderUnconfirmedWriteError, newBuilderRegistration, registerBuilderModel,
  type BuilderImage, type BuilderRegistrationInput, type BuilderRegistrationProgress, type BuilderTextureChannel,
} from '@/libraries/services/threed/model-builder/registration';
import type { CottageParameters, GeneratedModelBundle } from '@/libraries/services/threed/model-builder/types';

interface PreparedCottage {
  exported: BrowserCottageExport; model: ModelData; url: string; canonical: string;
  registrationInput: BuilderRegistrationInput; progress: BuilderRegistrationProgress;
  pendingPrimaryCleanup?: NonNullable<BuilderRegistrationProgress['primary']>;
}
const groups = [
  { title: 'Building dimensions', match: /^(main_|front_section|front_wall|rear_wall|wing_|porch_|floor_|wall_)/ },
  { title: 'Roofs and skylights', match: /roof|skylight|chimney/ },
  { title: 'Doors, windows and trim', match: /door|window|glazing|frame|walkway/ },
  { title: 'Interior', match: /interior|partition|hall/ },
  { title: 'Materials and generation', match: /./ },
];
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Only confirmed, unregistered uploads are eligible for the existing guarded cleanup. */
async function discardBuilderStagedPrimary(draft: PreparedCottage, keepalive = false) {
  const progress = draft.progress;
  const primary = draft.pendingPrimaryCleanup ?? progress.primary;
  if (!primary || progress.modelId || progress.uncertain) return;
  // DELETE can finish even if its reply is lost. Never reuse potentially deleted bytes.
  draft.pendingPrimaryCleanup = primary;
  progress.primary = undefined;
  const response = await fetch('/api/threed/models/upload', { method: 'DELETE', cache: 'no-store', keepalive,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: primary.url }),
    signal: AbortSignal.timeout(15_000) }).catch(() => null);
  const result = await response?.json().catch(() => null);
  if (!response?.ok || result?.success !== true) {
    throw new Error('Staged Model upload cleanup is unconfirmed. The previous preview is retained. Retry Generate Preview to retry cleanup before saving or replacing it.');
  }
  draft.pendingPrimaryCleanup = undefined;
}

/** Creation POSTs are not blindly repeated when the network loses confirmation. */
async function writeJson(url: string, body: unknown, createsRecord = false) {
  let response: Response;
  try { response = await fetch(url, { method: createsRecord ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  catch { throw createsRecord ? new BuilderUnconfirmedWriteError('Save was not confirmed. Review saved records before trying again.') : new Error('Texture assignment was not confirmed; retry to reconcile it.'); }
  const result = await response.json().catch(() => null);
  if (!result || (createsRecord && response.status >= 500)) throw new BuilderUnconfirmedWriteError('Save was not confirmed. Review saved records before trying again.');
  if (!response.ok || result.success !== true) throw new Error(typeof result.error === 'string' ? result.error : 'The save was rejected.');
  return result.data;
}

export function ThreeDModelBuilder() {
  const [parameters, setParameters] = useState<CottageParameters>({ ...COTTAGE_DEFAULTS });
  const [name, setName] = useState('Cottage');
  const [prepared, setPrepared] = useState<PreparedCottage | null>(null);
  const [busy, setBusy] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [message, setMessage] = useState('Adjust the dimensions, then Generate Preview. All dimensions use inches; GLB exports use metres.');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const active = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const current = useRef<PreparedCottage | null>(null);
  const mounted = useRef(true);
  const skipGuard = useRef(false);
  const complete = Boolean(prepared?.progress.complete);
  let draftChanged = true;
  try { draftChanged = !prepared || canonicalCottageParameters(parameters) !== prepared.canonical; } catch { /* Generate shows bounded validation errors. */ }
  const dirty = complete && !draftChanged ? false : Boolean(prepared && !complete) || JSON.stringify(parameters) !== JSON.stringify(COTTAGE_DEFAULTS) || name !== 'Cottage';
  const guard = useRef({ dirty, busy }); guard.current = { dirty, busy: busy || captureOpen };
  useEffect(() => {
    mounted.current = true;
    const historyKey = 'threed:model-builder:guard';
    // A same-URL entry lets Back ask before Next unmounts an unsaved workspace.
    // Reuse it during Strict Mode's effect replay and on a history return.
    if (!window.history.state?.[historyKey]) {
      window.history.pushState({ ...window.history.state, [historyKey]: true }, '', window.location.href);
    }
    const back = (event: PopStateEvent) => {
      if (skipGuard.current) return;
      event.stopImmediatePropagation();
      if (event.state?.[historyKey]) return;
      if (guard.current.busy || (guard.current.dirty && !window.confirm('Leave the Model Builder? Unsaved parameters and local exports will be discarded.'))) {
        window.history.forward();
      } else {
        skipGuard.current = true;
        window.history.back();
      }
    };
    const unload = (event: BeforeUnloadEvent) => { if (!skipGuard.current && (guard.current.dirty || guard.current.busy)) { event.preventDefault(); event.returnValue = ''; } };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download') || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (guard.current.busy || (guard.current.dirty && !window.confirm('Leave the Model Builder? Unsaved parameters and local exports will be discarded.'))) {
        event.preventDefault(); event.stopImmediatePropagation(); return;
      }
      skipGuard.current = true;
      event.preventDefault(); event.stopImmediatePropagation(); window.location.assign(anchor.href);
    };
    window.addEventListener('beforeunload', unload); window.addEventListener('popstate', back, true); document.addEventListener('click', navigate, true);
    return () => {
      mounted.current = false; active.current?.abort();
      if (current.current) {
        URL.revokeObjectURL(current.current.url);
        // A pending creation may still commit after navigation; never delete its bytes.
        if (!lock.current) void discardBuilderStagedPrimary(current.current, true).catch(() => undefined);
      }
      window.removeEventListener('beforeunload', unload); window.removeEventListener('popstate', back, true); document.removeEventListener('click', navigate, true);
    };
  }, []);

  async function generate() {
    if (lock.current || captureOpen) return;
    if (prepared && !complete && !window.confirm('Replace this local generation? Any saved partial Model remains available in Models.')) return;
    lock.current = true; setBusy(true); setError(''); setUploadProgress(null);
    const controller = new AbortController(); active.current = controller;
    let bundle: GeneratedModelBundle | undefined;
    let lease: Awaited<ReturnType<typeof loadBulkGltfBundle>> | undefined;
    try {
      setMessage('Generating Cottage geometry and PBR textures…');
      await new Promise(resolve => setTimeout(resolve, 0));
      controller.signal.throwIfAborted();
      bundle = createCottage(parameters);
      setMessage('Exporting the complete GLB and checking it with the Model loader…');
      const exported = await exportCottageGlb(bundle, controller.signal);
      lease = await loadBulkGltfBundle(exported.file, [], false);
      controller.signal.throwIfAborted();
      const inventory = createThreeDModelMaterialInventory(lease.scene);
      if (inventory.omittedSlotCount || inventory.unavailableTextureSlotCount || !inventory.meshCount) throw new Error('The exported material inventory is incomplete. Try a smaller generation.');
      const images = new Map<string, BuilderImage>();
      for (const image of exported.images) {
        const existing = images.get(image.sha256) ?? { id: image.artifact.id, digest: image.sha256, file: image.file, bindings: [] };
        for (const recipe of bundle.materials) for (const [role, textureId] of Object.entries(recipe.textureBindings)) {
          if (textureId !== image.artifact.id) continue;
          const channel = (role === 'normal' ? 'normalMap' : role) as BuilderTextureChannel;
          const targetKeys = inventory.slots.filter(slot => slot.materialName === recipe.name).map(slot => slot.id);
          if (!targetKeys.length) throw new Error(`Exported material ${recipe.name} could not be matched to its saved texture bindings.`);
          const binding = existing.bindings.find(item => item.channel === channel);
          if (binding) binding.targetKeys = [...new Set([...binding.targetKeys, ...targetKeys])];
          else existing.bindings.push({ channel, targetKeys });
        }
        images.set(image.sha256, existing);
      }
      if (current.current) await discardBuilderStagedPrimary(current.current);
      controller.signal.throwIfAborted();
      const url = URL.createObjectURL(exported.file);
      const next: PreparedCottage = {
        exported, url, canonical: canonicalCottageParameters(bundle.parameters),
        progress: newBuilderRegistration(exported.sha256),
        model: { id: 0, modelName: name.trim() || 'Cottage', modelType: 'glb', filePath: url,
          scale: '1', rotationY: '0', offsetX: '0', offsetY: '0', offsetZ: '0', metadata: { activeSource: 'model', lightBoost: 0 },
          renderingAssetsResolved: true, files: [] },
        registrationInput: { file: exported.file, outputSha256: exported.sha256, images: [...images.values()],
          metadata: { activeSource: 'model', modelBuilder: { manifestVersion: 1, generator: bundle.identity,
            parameters: bundle.parameters, inputSha256: exported.inputSha256, outputSha256: exported.sha256,
            materials: exported.manifest.materials } } },
      };
      if (current.current) URL.revokeObjectURL(current.current.url);
      current.current = next; setPrepared(next);
      setMessage(`Preview ready · ${bundle.stats.meshCount} parts · ${bundle.stats.triangleCount.toLocaleString()} triangles · ${(exported.file.size / 1024 / 1024).toFixed(2)} MiB. Save creates a new private, inactive Model.`);
    } catch (failure) {
      if (mounted.current) {
        if (controller.signal.aborted) setMessage('Generation cancelled. The previous preview is retained.');
        else setError(failure instanceof Error ? failure.message : 'Generation failed.');
      }
    } finally {
      lease?.dispose(); bundle?.dispose(); lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function save() {
    if (!prepared || draftChanged || lock.current || captureOpen || prepared.pendingPrimaryCleanup) return;
    lock.current = true; setBusy(true); setError('');
    const controller = new AbortController(); active.current = controller;
    try {
      await registerBuilderModel(prepared.registrationInput, name, prepared.progress, {
        upload: (file, signal) => uploadThreeDPrimaryFile(file, { signal, onProgress: (value, phase) => {
          if (!mounted.current) return;
          setUploadProgress(value); setMessage(phase === 'verifying' ? 'Verifying uploaded Model…' : 'Uploading generated GLB…');
        } }),
        createModel: body => writeJson('/api/threed/models', body, true),
        createTexture: async (file, textureName) => {
          const body = new FormData(); body.append('file', file); body.append('textureName', textureName);
          let response: Response;
          try { response = await fetch('/api/threed/model-textures', { method: 'POST', body }); }
          catch { throw new BuilderUnconfirmedWriteError('Texture save was not confirmed.'); }
          const reply = await response.json().catch(() => null);
          if (!reply || response.status >= 500) throw new BuilderUnconfirmedWriteError('Texture save was not confirmed.');
          if (!response.ok || reply.success !== true) throw new Error(reply.error || 'Texture save failed.');
          return reply.data?.id;
        },
        assign: body => writeJson('/api/threed/models/files/requirements', body).then(() => undefined),
      }, { signal: controller.signal, onProgress: value => { if (mounted.current) setMessage(value); } });
    } catch (failure) {
      if (mounted.current) setError(prepared.progress.uncertain
        ? prepared.progress.uncertain
        : controller.signal.aborted ? 'Save stopped. Confirmed records are retained; Resume Save continues from them.' : failure instanceof Error ? failure.message : 'Save failed.');
    } finally {
      lock.current = false;
      if (mounted.current) { setBusy(false); setRevision(value => value + 1); setUploadProgress(null); }
    }
  }

  const assignedFields = new Set<string>();
  return <div className="flex h-full min-h-0 flex-col gap-2" data-builder-revision={revision}>
    <AdminWorkspaceHeader icon={Hammer} title="ThreeD Model Builder · Cottage" description="Generate a Cottage, review its PBR materials and save it as a new Model.">
      <ModelFieldHelp label="Model Builder">Generate locally in your browser. Saving creates a new private, inactive Model and reusable Model Textures. Activate and place it explicitly after review.</ModelFieldHelp>
      <div className="ml-auto"><AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Models</AdminWorkspaceLink></div>
    </AdminWorkspaceHeader>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="grid items-start gap-3 pb-3 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 space-y-2">
          <section className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <label className="block text-xs font-medium" htmlFor="builder-model-name">New Model name</label>
            <Input id="builder-model-name" value={name} maxLength={200} disabled={busy || Boolean(prepared?.progress.modelId)} onChange={event => setName(event.target.value)} />
            <p className="text-xs text-muted-foreground">Imperial inputs · metre GLB output · +Y up · front faces −Z.</p>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={parameters.interior_enabled} disabled={busy || captureOpen} onChange={event => setParameters(value => ({ ...value, interior_enabled: event.target.checked }))} />Include provisional interior</label>
          </section>
          {groups.map((group, index) => {
            const fields = COTTAGE_PARAMETER_FIELDS.filter(field => !assignedFields.has(field.key) && group.match.test(field.key));
            fields.forEach(field => assignedFields.add(field.key));
            return <details key={group.title} open={index === 0} className="rounded-lg border bg-muted/20 p-3">
              <summary className="cursor-pointer text-xs font-semibold">{group.title}</summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {fields.map(field => <label key={field.key} className="space-y-1 text-xs" htmlFor={`cottage-${field.key}`}>
                  <span className="block">{field.label}{field.unit === 'in' ? ' (in)' : field.unit === 'rise/12' ? ' (rise/12)' : ''}</span>
                  {field.key === 'texture_resolution' ? <select id={`cottage-${field.key}`} value={parameters.texture_resolution} disabled={busy || captureOpen} className="h-8 w-full rounded-md border bg-background px-2" onChange={event => setParameters(value => ({ ...value, texture_resolution: Number(event.target.value) }))}>
                    {[64,128,256].map(size => <option key={size} value={size}>{size} × {size}</option>)}
                  </select> : <Input id={`cottage-${field.key}`} type="number" className="h-8" min={field.min} max={field.max} step={field.step}
                    value={Number.isNaN(parameters[field.key]) ? '' : parameters[field.key]} disabled={busy || captureOpen}
                    onChange={event => setParameters(value => ({ ...value, [field.key]: event.target.value === '' ? NaN : Number(event.target.value) }))} />}
                </label>)}
              </div>
            </details>;
          })}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy || captureOpen} onClick={generate}><Hammer className="mr-1 h-4 w-4" />Generate Preview</Button>
            <Button type="button" variant="outline" disabled={busy || captureOpen} onClick={() => { setParameters({ ...COTTAGE_DEFAULTS }); setError(''); }}><RotateCcw className="mr-1 h-4 w-4" />Defaults</Button>
          </div>
        </div>
        <div className="min-w-0 space-y-2 lg:sticky lg:top-0">
          <ThreeDModelAssetPreview model={prepared?.model ?? null} title="Generated Model Preview" description="Preview the exported GLB through the existing Model loader. Project lighting can differ."
            attachedDependencyCount={0} dependencyCount={0} centerAtOrigin preserveCameraOnEdit showMaterialInspector materialInspectorReadOnly
            materialInspectorNotice="Embedded PBR textures. Save registers reusable images and role assignments in Model Textures."
            canvasClassName="h-[min(55dvh,520px)] min-h-[300px]" />
          {prepared && <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy || captureOpen || draftChanged} onClick={() => download(prepared.exported.file, prepared.exported.file.name)}><Download className="mr-1 h-4 w-4" />Download GLB</Button>
            <Button type="button" variant="outline" disabled={busy || captureOpen || draftChanged} onClick={() => download(new Blob([JSON.stringify({ ...prepared.exported.manifest, inputSha256: prepared.exported.inputSha256,
              registration: { modelId: prepared.progress.modelId ?? null, primaryModelFileId: prepared.progress.primaryModelFileId ?? null, textureIds: prepared.progress.textureIds, complete: prepared.progress.complete } }, null, 2)], { type: 'application/json' }), `cottage-${prepared.exported.sha256.slice(0,12)}.json`)}>Download Manifest</Button>
            <ModelPreviewImageExport key={prepared.exported.sha256} model={prepared.model} dependencyCount={0} attachedDependencyCount={0} disabled={busy || draftChanged || Boolean(prepared.progress.modelId)} useDraftModel onOpenChange={setCaptureOpen}
              onUseImageUrl={url => { prepared.registrationInput.thumbnailUrl = url; setMessage('Preview added to the local draft. Save as New Model persists it.'); setRevision(value => value + 1); }} />
          </div>}
          {prepared && <p className="break-all text-[10px] text-muted-foreground">GLB SHA-256: {prepared.exported.sha256}</p>}
        </div>
      </div>
    </div>
    <footer className="shrink-0 space-y-2 border-t pt-2">
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{draftChanged && prepared ? 'Parameters changed. Generate Preview again before downloading or saving.' : message}</p>
      {uploadProgress !== null && <progress aria-label="Model upload progress" className="h-1 w-full" max={100} value={uploadProgress} />}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={!prepared || draftChanged || busy || captureOpen || complete || Boolean(prepared.progress.uncertain) || Boolean(prepared.pendingPrimaryCleanup) || !name.trim()} onClick={save}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}{complete ? 'Model Saved' : prepared?.progress.modelId ? 'Resume Save' : 'Save as New Model'}
        </Button>
        {busy && <Button type="button" variant="outline" onClick={() => active.current?.abort()}>Stop</Button>}
        {prepared?.progress.modelId && <Button variant="outline" asChild><Link href={`/admin/threed/models/${prepared.progress.modelId}`}>Review Saved Model #{prepared.progress.modelId}</Link></Button>}
        {prepared?.progress.uncertain && <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Review Models</AdminWorkspaceLink>}
        {complete && <span className="text-xs text-emerald-400">Private and inactive. Review, activate, then place through the Project Model Library.</span>}
      </div>
    </footer>
  </div>;
}
