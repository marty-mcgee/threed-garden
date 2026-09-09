'use client';

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ExternalLink, Files, Loader2, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { inspectThreeDModelPrimary } from '@/lib/services/threed/models/model-companion-core';
import { inspectThreeDGltfBundle } from '@/lib/services/threed/models/model-gltf-bundle-core';
import type { ThreeDModelCategoryOption } from './ThreeDModelCategoriesManager';
import {
  createBulkDefaults, createBulkDraft, defaultDestination, MAX_BULK_MODELS,
  prepareBulkModel, requirementKey, summarizeBulkGltfResources, validateBulkPrimary, validateBulkPreview, validateBulkCompanion, bulkCompanionType,
  type BulkDefaults, type BulkDraft, type BulkSource, type BulkExistingTexture, type BulkPreparedModel,
} from './model-bulk-preparation-core';
import { runBulkModel, type BulkImportResult } from './model-bulk-import-runner';
import { BULK_SCALE_PRESETS, createBulkPreferencesStorageKey, readBulkPreferences, serializeBulkPreferences } from './model-bulk-preferences-core';
import { createBulkModelPreviewSnapshot, openBulkModelPreview, type BulkModelPreviewSnapshot } from './model-bulk-preview-window';

const InlineModelPreview = lazy(() => import('./ThreeDModelImportPreview').then((module) => ({ default: module.ThreeDModelImportPreview })));

const COMPANION_ACCEPT = '.bin,.png,.jpg,.jpeg,.webp,.tga,.bmp';
const FLAGS = [
  ['isLibraryItem', 'Library Item'], ['isPublic', 'Public'], ['usedByPlants', 'Used by Plants'],
  ['usedByCharacters', 'Used by Characters'], ['isActive', 'Active after import'],
] as const;
const selectClass = 'h-8 w-full rounded border bg-background px-2 text-xs';
const sizeLabel = (bytes: number) => bytes < 1024 * 1024
  ? `${(bytes / 1024).toFixed(1)} KiB` : `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
const possibleRepeat = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

interface BulkResultView extends BulkImportResult {
  submitted: {
    draft: BulkDraft;
    plan: BulkPreparedModel;
    defaults: BulkDefaults;
    pool: BulkSource[];
    categories: ThreeDModelCategoryOption[];
    textures: BulkExistingTexture[];
  };
}

export function ThreeDModelsBulkImport({ categories, onComplete }: {
  categories: ThreeDModelCategoryOption[];
  onComplete: (summary: { created: number; failed: number }) => void | Promise<void>;
}) {
  const { data: session } = useSession();
  const preferenceKey = createBulkPreferencesStorageKey(session?.user?.id);
  const [preferencesLoaded, setPreferencesLoaded] = useState<string | null>(null);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<BulkDraft[]>([]);
  const draftsRef = useRef<BulkDraft[]>([]);
  const [pool, setPool] = useState<BulkSource[]>([]);
  const [defaults, setDefaults] = useState(createBulkDefaults);
  const [existingTextures, setExistingTextures] = useState<BulkExistingTexture[]>([]);
  const [texturesReady, setTexturesReady] = useState(false);
  const [texturesLoading, setTexturesLoading] = useState(false);
  const [textureError, setTextureError] = useState('');
  const [textureRefresh, setTextureRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, BulkResultView>>({});
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const busyRef = useRef(false);
  const [checkingPreview, setCheckingPreview] = useState(false);
  const previewCheckRef = useRef(0);
  const mountedRef = useRef(true);
  const scansRef = useRef<Promise<void>>(Promise.resolve());
  const primaryRef = useRef<HTMLInputElement>(null);
  const textureRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const [inlinePreview, setInlinePreview] = useState<{ draftId: string; snapshot: BulkModelPreviewSnapshot; revision: number } | null>(null);
  const previewRevisionRef = useRef(0);
  const previewWindowCleanupRef = useRef<(() => void) | null>(null);
  const activeCategories = categories.filter((category) => category.isActive);
  const activeTextures = existingTextures.filter((texture) => texture.isActive);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; previewCheckRef.current += 1; previewWindowCleanupRef.current?.(); };
  }, []);
  useEffect(() => {
    if (!preferenceKey) return;
    let restored: BulkDefaults | null = null;
    try { restored = readBulkPreferences(window.localStorage.getItem(preferenceKey)); } catch { /* Browser storage is optional. */ }
    setDefaults(restored ?? createBulkDefaults());
    setPreferencesLoaded(preferenceKey);
  }, [preferenceKey]);
  useEffect(() => {
    if (!preferenceKey || preferencesLoaded !== preferenceKey) return;
    const serialized = serializeBulkPreferences(defaults);
    if (!serialized) return;
    try { window.localStorage.setItem(preferenceKey, serialized); setPreferencesSaved(true); }
    catch { setPreferencesSaved(false); }
  }, [defaults, preferenceKey, preferencesLoaded]);
  useEffect(() => {
    const protectRun = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    if (importing) window.addEventListener('beforeunload', protectRun);
    return () => window.removeEventListener('beforeunload', protectRun);
  }, [importing]);
  useEffect(() => {
    if (!open) return;
    let current = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    setTexturesLoading(true);
    setTexturesReady(false);
    setTextureError('');
    void (async () => {
      try {
        const response = await fetch('/api/threed/model-textures', { signal: controller.signal, cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || payload?.success !== true || !Array.isArray(payload.data)) throw new Error('Unable to load');
        const textures: BulkExistingTexture[] = payload.data.filter((texture: Partial<BulkExistingTexture> | null) =>
          texture && Number.isSafeInteger(texture.id) && Number(texture.id) > 0
          && typeof texture.textureName === 'string' && typeof texture.fileName === 'string'
          && typeof texture.isActive === 'boolean');
        if (current) { setExistingTextures(textures); setTexturesReady(true); }
      } catch {
        if (current) setTextureError('Unable to load existing Textures. Refresh to try again.');
      } finally {
        window.clearTimeout(timeout);
        if (current) setTexturesLoading(false);
      }
    })();
    return () => { current = false; controller.abort(); window.clearTimeout(timeout); };
  }, [open, textureRefresh]);

  function changeDrafts(update: (current: BulkDraft[]) => BulkDraft[]) {
    if (!mountedRef.current) return;
    const next = update(draftsRef.current);
    draftsRef.current = next;
    setDrafts(next);
    setResults((current) => {
      const removed = Object.keys(current).filter((id) => !next.some((draft) => draft.id === id));
      if (!removed.length) return current;
      const remaining = { ...current };
      for (const id of removed) delete remaining[id];
      return remaining;
    });
  }
  function updateDraft(id: string, update: Partial<BulkDraft>) {
    if (busyRef.current) return;
    changeDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...update } : draft));
  }
  const prepared = useMemo(() => new Map(drafts.map((draft) => {
    const plan = prepareBulkModel(draft, defaults, pool, texturesReady ? existingTextures : undefined);
    if (plan.settings.categoryIds.some((id) => !categories.some((category) => category.id === id && category.isActive))) {
      plan.ready = false;
      plan.issues.push('A selected category is unavailable. Remove it or choose an active category.');
    }
    return [draft.id, plan];
  })), [drafts, defaults, pool, texturesReady, existingTextures, categories]);
  const eligible = drafts.filter((draft) => !results[draft.id] && prepared.get(draft.id)?.ready);
  const selectedDraft = drafts.find((draft) => draft.id === selectedId) ?? drafts[0];
  const result = selectedDraft && results[selectedDraft.id];
  const selected = result?.submitted.draft ?? selectedDraft;
  const selectedPlan = result?.submitted.plan ?? (selected && prepared.get(selected.id));
  const selectedDefaults = result?.submitted.defaults ?? defaults;
  const selectedPool = result?.submitted.pool ?? pool;
  const selectedCategories = result?.submitted.categories ?? activeCategories;
  const selectedTextures = result?.submitted.textures ?? activeTextures;
  const locked = importing || !!result;

  useEffect(() => { setInlinePreview(null); }, [selected?.id, open]);

  function previewSelectedModel(separateWindow = false) {
    if (!selected || !selectedPlan || selected.inspecting || selected.inspectionError) return;
    try {
      const snapshot = createBulkModelPreviewSnapshot(selected, selectedPlan);
      if (separateWindow) {
        previewWindowCleanupRef.current?.();
        previewWindowCleanupRef.current = openBulkModelPreview(snapshot, (message) => { if (mountedRef.current) setNotice(message); });
      } else {
        setInlinePreview({ draftId: selected.id, snapshot, revision: ++previewRevisionRef.current });
      }
      setNotice('');
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'The preview could not be opened.'); }
  }

  function addPrimaries(files: FileList | null) {
    if (!files || busyRef.current) return;
    const additions: BulkDraft[] = [];
    const skipped: string[] = [];
    const selectionRoot = crypto.randomUUID();
    for (const file of Array.from(files)) {
      if (draftsRef.current.some((draft) => draft.source.file === file)) continue;
      const error = validateBulkPrimary(file);
      if (error || draftsRef.current.length + additions.length >= MAX_BULK_MODELS) {
        skipped.push(`${file.name}: ${error ?? '100-Model queue limit reached'}`);
        continue;
      }
      const source: BulkSource = { id: crypto.randomUUID(), file, sourcePath: file.webkitRelativePath || file.name, selectionRoot };
      additions.push(createBulkDraft(source));
    }
    changeDrafts((current) => [...current, ...additions]);
    if (additions[0]) setSelectedId(additions[0].id);
    setNotice(skipped.join(' · '));
    // Serialize reads across every selection, not just files from one chooser event.
    scansRef.current = scansRef.current.then(async () => {
      for (const draft of additions) {
        if (!mountedRef.current || !draftsRef.current.some((entry) => entry.id === draft.id)) continue;
        try {
          const bytes = new Uint8Array(await draft.source.file.arrayBuffer());
          const gltf = /\.(?:glb|gltf)$/i.test(draft.source.file.name) ? inspectThreeDGltfBundle(draft.source.file.name, bytes) : undefined;
          const requirements = gltf?.requirements ?? inspectThreeDModelPrimary(draft.source.file.name, bytes);
          if (requirements.length > 500) throw new Error('More than 500 file references detected. Review this file with Add Model.');
          const gltfResources = gltf && summarizeBulkGltfResources(gltf);
          changeDrafts((current) => current.map((entry) => entry.id === draft.id ? { ...entry, inspecting: false, requirements, gltfResources } : entry));
        } catch (error) {
          changeDrafts((current) => current.map((entry) => entry.id === draft.id ? {
            ...entry, inspecting: false, inspectionError: error instanceof Error ? error.message.slice(0, 400) : 'Unable to inspect this Model within the bulk limits.',
          } : entry));
        }
      }
    });
  }

  function addTextures(files: FileList | null) {
    if (!files || busyRef.current) return;
    const selectionRoot = crypto.randomUUID();
    const skipped: string[] = [];
    const additions: BulkSource[] = [];
    for (const file of Array.from(files)) {
      if (pool.some((entry) => entry.file === file)) continue;
      const error = validateBulkCompanion(file);
      if (error || pool.length + additions.length >= 500) {
        skipped.push(`${file.name}: ${error ?? '500-file companion selection limit reached'}`);
        continue;
      }
      additions.push({ id: crypto.randomUUID(), file, sourcePath: file.webkitRelativePath || file.name, selectionRoot });
    }
    setPool((current) => [...current, ...additions]);
    setNotice(skipped.join(' · '));
  }

  async function choosePreview(file: File | undefined, id: string) {
    if (busyRef.current || !file) return;
    const check = ++previewCheckRef.current;
    setCheckingPreview(true);
    try {
      const error = await validateBulkPreview(file);
      if (!mountedRef.current || check !== previewCheckRef.current) return;
      if (error) setNotice(error);
      else { updateDraft(id, { previewFile: file }); setNotice(''); }
    } catch {
      if (mountedRef.current) setNotice('Unable to read the preview image.');
    } finally {
      if (mountedRef.current && check === previewCheckRef.current) setCheckingPreview(false);
    }
  }

  async function importReady() {
    if (busyRef.current || checkingPreview || !eligible.length) return;
    busyRef.current = true;
    setImporting(true);
    setNotice('');
    // Freeze reviewed settings/associations. Rows still scanning are excluded from this run.
    const run = eligible.map((draft) => {
      const plan = prepared.get(draft.id)!;
      const submitted: BulkResultView['submitted'] = {
        draft: { ...draft, overrides: { ...plan.settings, categoryIds: [...plan.settings.categoryIds] } },
        plan,
        defaults: { ...defaults, categoryIds: [...defaults.categoryIds] },
        pool: [...pool], categories: activeCategories.map((category) => ({ ...category })),
        textures: activeTextures.map((texture) => ({ ...texture })),
      };
      return { draft, plan, submitted };
    });
    let created = 0;
    let failed = 0;
    try {
      for (const { draft, plan, submitted } of run) {
        const outcome = await runBulkModel({
          file: draft.source.file, modelName: draft.modelName, settings: plan.settings,
          rotationY: draft.rotationY, offsetX: draft.offsetX, offsetY: draft.offsetY, offsetZ: draft.offsetZ,
          configureLater: draft.configureLater, previewFile: draft.previewFile,
          attachments: plan.attachments.map((attachment) => ({ file: attachment.source.file, relativePath: attachment.relativePath, fileType: attachment.fileType })),
        }, (label) => { if (mountedRef.current) setProgress((current) => ({ ...current, [draft.id]: label })); });
        if (outcome.modelId) created += 1;
        if (outcome.status !== 'imported') failed += 1;
        if (mountedRef.current) {
          setResults((current) => ({ ...current, [draft.id]: { ...outcome, submitted } }));
          setProgress((current) => { const next = { ...current }; delete next[draft.id]; return next; });
        }
      }
      await onComplete({ created, failed });
    } catch {
      if (mountedRef.current) setNotice('The batch stopped unexpectedly. Check Models before starting another import.');
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setImporting(false);
    }
  }

  function resetOverride(key: keyof BulkDefaults) {
    if (!selected) return;
    const overrides = { ...selected.overrides };
    delete overrides[key];
    updateDraft(selected.id, { overrides });
  }
  function override<K extends keyof BulkDefaults>(key: K, value: BulkDefaults[K]) {
    if (selected) updateDraft(selected.id, { overrides: { ...selected.overrides, [key]: value } });
  }
  function status(draft: BulkDraft) {
    if (progress[draft.id]) return progress[draft.id];
    const outcome = results[draft.id];
    if (outcome) return outcome.status === 'imported' ? 'Imported' : outcome.status === 'unknown' ? 'Check import result' : 'Import failed';
    if (draft.inspecting) return 'Scanning';
    return prepared.get(draft.id)?.ready ? draft.configureLater ? 'Ready — configure later' : 'Ready' : 'Needs attention';
  }

  return <Dialog open={open} onOpenChange={(value) => { if (!busyRef.current) setOpen(value); }}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs"><Files className="mr-1 h-3 w-3" />Bulk Import Models</Button></DialogTrigger>
    <DialogContent className="flex h-[92dvh] max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1150px)]">
      <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 sm:pl-6">
        <DialogTitle>Bulk Import Models</DialogTitle>
        <DialogDescription>Prepare FBX, GLB and GLTF Models with their textures and binary files, then import ready rows. Files upload only when you start importing.</DialogDescription>
      </DialogHeader>
      <div data-slot="bulk-import-body" role="region" aria-label="Bulk import configuration" tabIndex={0} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
      <input ref={primaryRef} aria-label="Select Model files" type="file" multiple accept=".fbx,.glb,.gltf" className="hidden" disabled={importing}
        onChange={(event) => { addPrimaries(event.target.files); event.target.value = ''; }} />
      <input ref={textureRef} aria-label="Select shared texture and binary files" type="file" multiple accept={COMPANION_ACCEPT} className="hidden" disabled={importing}
        onChange={(event) => { addTextures(event.target.files); event.target.value = ''; }} />
      <input ref={previewRef} aria-label="Select preview image" type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" disabled={locked || checkingPreview}
        onChange={(event) => { if (selected) void choosePreview(event.target.files?.[0], selected.id); event.target.value = ''; }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={importing || drafts.length >= MAX_BULK_MODELS} onClick={() => primaryRef.current?.click()}><Upload className="mr-1 h-3 w-3" />Choose Model files</Button>
        <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => textureRef.current?.click()}>Add textures / .bin files</Button>
        <Badge variant="secondary">{drafts.length}/100 Models</Badge>
        <span className="text-xs text-muted-foreground">Up to 4 MiB per file for bulk uploads.</span>
      </div>
      {notice && <p role="alert" className="break-words rounded border border-amber-500/40 p-2 text-xs">{notice}</p>}
      <section aria-label="Batch defaults" className="rounded border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="text-sm font-medium">Batch defaults</h3><p className="text-xs text-muted-foreground">{preferencesSaved ? 'Your batch defaults are remembered in this browser.' : 'Default preferences for this batch.'}</p></div>
          <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => setDefaults(createBulkDefaults())}>Reset defaults</Button>
        </div>
        <fieldset disabled={importing} className="mt-3 min-w-0 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block max-w-40 text-xs">Scale<Input aria-label="Batch scale" type="number" min="0.01" step="0.01" value={defaults.scale} onChange={(event) => setDefaults((current) => ({ ...current, scale: event.target.value }))} /></label>
            {BULK_SCALE_PRESETS.map((preset) => <Button key={preset.value} type="button" variant="outline" size="sm" aria-label={`Set batch scale to ${preset.label}`} onClick={() => setDefaults((current) => ({ ...current, scale: preset.value }))}>{preset.label}</Button>)}
          </div>
          <p className="text-xs text-muted-foreground">100% = scale 1. Choose a shortcut or enter a custom scale, then preview the resulting size.</p>
          <div className="flex flex-wrap gap-3">{FLAGS.map(([key, label]) => <label key={key} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={defaults[key]} onChange={(event) => setDefaults((current) => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div>
          <CategoryChoices categories={activeCategories} value={defaults.categoryIds} onChange={(categoryIds) => setDefaults((current) => ({ ...current, categoryIds }))} />
          <label className="block text-xs">Assign Existing Texture File
            <select aria-label="Batch existing Texture" className={selectClass} value={defaults.existingTextureId ?? ''}
              onChange={(event) => setDefaults((current) => ({ ...current, existingTextureId: event.target.value ? Number(event.target.value) : null }))}>
              <option value="">None — keep original materials and textures</option>
              <ExistingTextureOptions textures={activeTextures} selectedId={defaults.existingTextureId} />
            </select>
          </label>
          <p className="text-xs text-muted-foreground">None keeps each Model's original materials and textures. Choosing a saved Texture replaces Base Color on every material slot in inheriting Models; other authored maps are kept.</p>
          <p className="text-xs text-muted-foreground">Changes apply to inherited values. Models stay inactive unless activation is requested and their saved dependency audit succeeds.</p>
        </fieldset>
      </section>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground" role="status">{texturesLoading ? 'Loading existing Textures…' : textureError || `${activeTextures.length} active existing Textures available`}</span>
        <Button type="button" variant="outline" size="sm" disabled={importing || texturesLoading} onClick={() => setTextureRefresh((value) => value + 1)}>Refresh existing Textures</Button>
      </div>
      <section aria-label="Shared texture and binary files" className="rounded border p-3">
        <h3 className="text-sm font-medium">Shared texture and binary files ({pool.length}/500)</h3>
        <p className="my-2 text-xs text-muted-foreground">Select local images and .bin files to resolve Model dependencies. Use Assign Existing Texture File to reuse a saved Base Color Texture. Embedded GLB/GLTF resources need no extra attachment.</p>
        {pool.length === 0 && <p className="text-xs text-muted-foreground">No shared files selected.</p>}
        <div className="space-y-1">{pool.map((source, index) => <div key={source.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="break-all">#{index + 1} {source.sourcePath} · {sizeLabel(source.file.size)}</span>
          <Button type="button" variant="ghost" size="sm" disabled={importing} aria-label={`Remove companion ${index + 1}: ${source.file.name}`} onClick={() => setPool((current) => current.filter((entry) => entry.id !== source.id))}><Trash2 className="h-3 w-3" /></Button>
        </div>)}</div>
      </section>
      {drafts.length > 0 && <div className="grid min-w-0 items-start gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.5fr)]">
        <div className="min-w-0 space-y-4">
        <div className="min-w-0 space-y-1" aria-label="Queued Models"><h3 className="mb-2 text-sm font-medium">Queued Models</h3>{drafts.map((draft, index) => <div key={draft.id} className={`flex items-center gap-1 rounded border ${selected?.id === draft.id ? 'border-primary bg-muted' : ''}`}>
          <button type="button" className="min-w-0 flex-1 p-2 text-left" aria-pressed={selected?.id === draft.id} onClick={() => setSelectedId(draft.id)}>
            <span className="block truncate text-xs font-medium">{index + 1}. {draft.modelName || draft.source.file.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{draft.source.sourcePath} · {sizeLabel(draft.source.file.size)}</span>
            <span className="block text-[11px]">{status(draft)}</span>
            {drafts.some((other) => other.id !== draft.id && possibleRepeat(other.source.file, draft.source.file)) && <span className="block text-[11px] text-amber-800 dark:text-amber-300">Possible duplicate — review both files</span>}
          </button>
          {!results[draft.id] && <Button type="button" variant="ghost" size="sm" disabled={importing} aria-label={`Remove Model ${index + 1}`} onClick={() => changeDrafts((current) => current.filter((entry) => entry.id !== draft.id))}><Trash2 className="h-3 w-3" /></Button>}
        </div>)}</div>
        {selected && <section aria-label="Model preview" className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Model preview</h3>
            <Button type="button" variant="outline" size="sm" disabled={importing || selected.inspecting || !!selected.inspectionError} onClick={() => previewSelectedModel()}>{inlinePreview?.draftId === selected.id ? 'Refresh preview' : 'Preview Model'}</Button>
          </div>
          {open && inlinePreview?.draftId === selected.id
            ? <Suspense fallback={<p role="status" className="p-3 text-sm">Loading preview…</p>}><InlineModelPreview key={inlinePreview.revision} localSnapshot={inlinePreview.snapshot} onClose={() => setInlinePreview(null)} /></Suspense>
            : <p className="rounded border p-3 text-xs text-muted-foreground">Choose Preview Model to review {selected.modelName || selected.source.file.name} here with its current files and settings.</p>}
        </section>}
        </div>
        {selected && selectedPlan && <div data-slot="bulk-import-selected-model" className="min-w-0 space-y-3 rounded border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="min-w-0 break-words text-sm font-medium">{selected.source.file.name}</h3>
            <Button type="button" variant="outline" size="sm" disabled={importing || selected.inspecting || !!selected.inspectionError} onClick={() => previewSelectedModel(true)}><ExternalLink className="mr-2 h-4 w-4" />Open preview window</Button>
          </div>
          <p className="text-xs text-muted-foreground">Preview below Queued Models, or open a separate window. No upload is needed.</p>
          {result && <div className="space-y-3" role="status">
            <p className="text-sm">{result.message}</p>
            <p className="text-xs text-muted-foreground">Submitted files and settings are shown below.</p>
            {result.modelId ? <a className="text-sm underline" href={`/admin/threed/model-files?modelId=${result.modelId}`} target="_blank" rel="noreferrer">Review Model files (new tab)</a>
              : result.status === 'unknown' && <a className="text-sm underline" href="/admin/threed/models" target="_blank" rel="noreferrer">Check Models (new tab)</a>}
            {result.canRetry && !result.modelId && <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => setResults((current) => { const next = { ...current }; delete next[selected.id]; return next; })}>Correct and retry</Button>}
          </div>}
            {selected.gltfResources?.textures && <div className="space-y-2 break-words rounded border bg-muted/40 p-3 text-xs" role="region" aria-label="Model texture summary">
              <h4 className="font-medium">Model textures</h4>
              {selected.gltfResources.textures.embeddedImageCount > 0 && <p>{selected.gltfResources.textures.embeddedImageCount} embedded texture {selected.gltfResources.textures.embeddedImageCount === 1 ? 'image is' : 'images are'} included in this Model file.</p>}
              {selected.gltfResources.textures.bufferImageCount > 0 && <p>{selected.gltfResources.textures.bufferImageCount} texture {selected.gltfResources.textures.bufferImageCount === 1 ? 'image is' : 'images are'} stored in required external .bin files.</p>}
              {selected.gltfResources.textures.externalFileCount > 0 && <p>{selected.gltfResources.textures.externalFileCount} external texture {selected.gltfResources.textures.externalFileCount === 1 ? 'file' : 'files'} referenced.</p>}
              {selected.gltfResources.textures.embeddedImageCount + selected.gltfResources.textures.bufferImageCount + selected.gltfResources.textures.externalFileCount === 0 && <p>No texture images declared. This Model may use material colors.</p>}
              <p className="text-muted-foreground">{selected.requirements.length === 0
                ? 'No additional texture or binary files are needed.'
                : 'Review the external file requirements below.'}</p>
              <p className="font-medium">{selectedPlan.settings.existingTextureId == null
                ? 'Original materials and textures will be kept.'
                : `${selectedTextures.find((texture) => texture.id === selectedPlan.settings.existingTextureId)?.textureName ?? 'The selected Texture'} will replace Base Color on all material slots.`}</p>
            </div>}
            <fieldset disabled={locked || checkingPreview} className="min-w-0 space-y-3">
              <section data-slot="bulk-import-requirements" aria-label="File requirements" className={`space-y-3 rounded-lg border-2 p-3 ${selectedPlan.issues.length > 0 && !selected.inspecting
                ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100'
                : selectedPlan.unresolved.length > 0
                  ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100'
                  : 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">File requirements</h4>
                  <span className="text-xs font-medium" role="status">{result ? 'Submitted file requirements' : selected.inspecting ? 'Scanning files…'
                    : selectedPlan.issues.length > 0 ? 'Blocked — review below'
                    : selectedPlan.unresolved.length > 0 ? selected.configureLater ? 'Ready — missing textures deferred' : 'Missing files'
                    : 'Ready to import'}</span>
                </div>
                {!selected.inspecting && !selected.inspectionError && !selected.requirements.length && <p className="text-xs">{selected.gltfResources ? 'No external files required. Embedded resources stay in the Model file.' : 'No named textures detected — review after import. This scan does not verify FBX structure or appearance.'}</p>}
                {selectedPlan.matches.map((match) => <div key={requirementKey(match.requirement)} className="space-y-1 rounded border border-current/20 bg-background p-2 text-foreground">
                  <p className="break-all text-xs font-medium">{match.requirement.kind === 'buffer' ? 'Required binary buffer' : 'Texture'}: {match.requirement.relativePath}</p>
                  <select aria-label={`${match.requirement.kind === 'buffer' ? 'Buffer' : 'Texture'} for ${match.requirement.relativePath}`} className={selectClass} value={selectedPool.some((entry) => entry.id === match.sourceId) ? match.sourceId : ''}
                    onChange={(event) => updateDraft(selected.id, { choices: { ...selected.choices, [requirementKey(match.requirement)]: { sourceId: event.target.value, relativePath: match.relativePath || defaultDestination(match.requirement.relativePath) } } })}>
                    <option value="">Choose file / leave unresolved</option>{selectedPool.map((source, index) => ({ source, index })).filter(({ source }) => (match.requirement.kind === 'buffer') === (bulkCompanionType(source.file) === 'binary')).map(({ source, index }) => <option key={source.id} value={source.id}>#{index + 1} {source.sourcePath} ({sizeLabel(source.file.size)})</option>)}
                  </select>
                  <Input aria-label={`Destination for ${match.requirement.relativePath}`} value={match.relativePath} onChange={(event) => updateDraft(selected.id, { choices: { ...selected.choices, [requirementKey(match.requirement)]: { sourceId: match.sourceId, relativePath: event.target.value } } })} />
                  <p className={`text-[11px] ${match.issue || !match.sourceId ? 'font-medium text-amber-800 dark:text-amber-300' : 'text-muted-foreground'}`}>{match.issue || (match.automatic ? 'Suggested match — change if needed' : match.sourceId ? 'Selected explicitly' : 'Missing or ambiguous') }</p>
                  {selected.choices[requirementKey(match.requirement)] && <button type="button" className="text-[11px] underline" onClick={() => { const choices = { ...selected.choices }; delete choices[requirementKey(match.requirement)]; updateDraft(selected.id, { choices }); }}>Use suggested match</button>}
                </div>)}
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.configureLater} onChange={(event) => updateDraft(selected.id, { configureLater: event.target.checked })} />Resolve missing texture files later (keep inactive)</label>
                {selected.requirements.some((entry) => entry.kind === 'buffer') && <p className="text-xs">Required .bin files cannot be deferred, including files that contain texture images.</p>}
                {(selectedPlan.issues.length > 0 || selectedPlan.unresolved.length > 0) && <div className="space-y-1 text-xs" role="status">
                  {selectedPlan.issues.map((issue, index) => <p key={`issue-${index}`} className="break-words font-medium text-red-800 dark:text-red-300">{issue}</p>)}
                  {selectedPlan.unresolved.map((issue, index) => <p key={`unresolved-${index}`} className="break-words font-medium text-amber-800 dark:text-amber-300">{issue}{selected.configureLater && !selectedPlan.matches.some((match) => match.requirement.relativePath === issue && match.requirement.kind === 'buffer') ? ' — configure after import' : ''}</p>)}
                </div>}
                <div className="space-y-2 border-t border-current/20 pt-3">
                  <h4 className="text-xs font-medium">Additional file attachments</h4>
                  {(selected.extras ?? []).map((extra) => <div key={extra.id} className="flex items-center gap-1">
                    <span className="max-w-28 truncate text-xs">{selectedPool.find((source) => source.id === extra.sourceId)?.file.name ?? 'File removed'}</span>
                    <Input aria-label="Additional file destination" value={extra.relativePath} onChange={(event) => updateDraft(selected.id, { extras: selected.extras?.map((entry) => entry.id === extra.id ? { ...entry, relativePath: event.target.value } : entry) })} />
                    <button type="button" className="text-xs underline" onClick={() => updateDraft(selected.id, { extras: selected.extras?.filter((entry) => entry.id !== extra.id) })}>Remove</button>
                  </div>)}
                  <select aria-label="Add additional file attachment" className={selectClass} value="" onChange={(event) => { const source = pool.find((entry) => entry.id === event.target.value); if (source) updateDraft(selected.id, { extras: [...(selected.extras ?? []), { id: crypto.randomUUID(), sourceId: source.id, relativePath: defaultDestination(source.file.name) }] }); }}>
                    <option value="">Attach another selected file…</option>{selectedPool.map((source, index) => <option key={source.id} value={source.id}>#{index + 1} {source.sourcePath}</option>)}
                  </select>
                </div>
              </section>
              <h4 className="border-t pt-3 text-sm font-medium">Model configuration</h4>
              <label className="block text-xs">Model name<Input value={selected.modelName} onChange={(event) => updateDraft(selected.id, { modelName: event.target.value })} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">Scale {selected.overrides.scale === undefined && '(batch)'}<Input type="number" min="0.01" step="0.01" value={selectedPlan.settings.scale} onChange={(event) => override('scale', event.target.value)} /></label>
                <label className="text-xs">Y rotation (degrees)<Input type="number" step="any" value={selected.rotationY} onChange={(event) => updateDraft(selected.id, { rotationY: event.target.value })} /></label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {BULK_SCALE_PRESETS.map((preset) => <Button key={preset.value} type="button" variant="outline" size="sm" aria-label={`Set Model scale to ${preset.label}`} onClick={() => override('scale', preset.value)}>{preset.label}</Button>)}
                <button type="button" className="text-xs underline" disabled={selected.overrides.scale === undefined} onClick={() => resetOverride('scale')}>Use batch scale</button>
              </div>
              <div className="grid grid-cols-3 gap-2">{(['offsetX', 'offsetY', 'offsetZ'] as const).map((key) => <label key={key} className="text-xs">{key.replace('offset', '')} offset<Input type="number" step="any" value={selected[key]} onChange={(event) => updateDraft(selected.id, { [key]: event.target.value })} /></label>)}</div>
              <div className="grid gap-2 sm:grid-cols-2">{FLAGS.map(([key, label]) => <label key={key} className="text-xs">{label}<select className={selectClass} value={selected.overrides[key] === undefined ? 'inherit' : String(selected.overrides[key])} disabled={key === 'isActive' && selected.configureLater} onChange={(event) => event.target.value === 'inherit' ? resetOverride(key) : override(key, event.target.value === 'true')}>
                <option value="inherit">Batch ({selectedDefaults[key] ? 'On' : 'Off'})</option><option value="true">On</option><option value="false">Off</option>
              </select></label>)}</div>
              <CategoryChoices categories={selectedCategories} value={selectedPlan.settings.categoryIds} onChange={(categoryIds) => override('categoryIds', categoryIds)} />
              <p className="text-xs text-muted-foreground">{selected.overrides.categoryIds === undefined ? 'Categories inherit batch defaults.' : <button type="button" className="underline" onClick={() => resetOverride('categoryIds')}>Use batch categories</button>}</p>
              <label className="block text-xs">Assign Existing Texture File
                <select aria-label="Model existing Texture" className={selectClass} value={selected.overrides.existingTextureId === undefined ? 'inherit' : selected.overrides.existingTextureId ?? ''}
                  onChange={(event) => event.target.value === 'inherit' ? resetOverride('existingTextureId') : override('existingTextureId', event.target.value ? Number(event.target.value) : null)}>
                  <option value="inherit">Batch ({selectedDefaults.existingTextureId == null ? 'None — keep originals' : selectedTextures.find((texture) => texture.id === selectedDefaults.existingTextureId)?.textureName ?? 'Unavailable Texture'})</option>
                  <option value="">None — keep original materials and textures</option>
                  <ExistingTextureOptions textures={selectedTextures} selectedId={selected.overrides.existingTextureId ?? null} />
                </select>
              </label>
              <p className="text-xs text-muted-foreground">{selectedPlan.settings.existingTextureId == null
                ? "None keeps this Model's original materials and textures, including any embedded textures."
                : 'The selected Texture replaces Base Color on every material slot, including embedded Base Color textures. Other authored maps are kept.'}{selected.requirements.length > 0 && ' External file requirements are listed above.'}</p>
              <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => previewRef.current?.click()}>Choose thumbnail image</Button>
                {selected.previewFile && <><span className="text-xs">{selected.previewFile.name}</span><button type="button" className="text-xs underline" onClick={() => updateDraft(selected.id, { previewFile: undefined })}>Remove preview</button></>}
              </div>
            </fieldset>
        </div>}
      </div>}
      </div>
      <div data-slot="bulk-import-footer" className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-background px-4 py-3 sm:px-6">
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {eligible.length} ready · {eligible.filter((draft) => draft.configureLater).length} configure later · {drafts.filter((draft) => !results[draft.id] && !prepared.get(draft.id)?.ready).length} need attention
          <p>Queue and results stay in this tab until you leave or refresh.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={importing || !drafts.some((draft) => results[draft.id]?.status === 'imported')} onClick={() => changeDrafts((current) => current.filter((draft) => results[draft.id]?.status !== 'imported'))}>Clear imported rows</Button>
          <Button type="button" size="sm" disabled={importing || checkingPreview || eligible.length === 0} onClick={() => void importReady()}>{importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{importing ? 'Importing…' : `Import ${eligible.length} ready Models`}</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}

function ExistingTextureOptions({ textures, selectedId }: { textures: BulkExistingTexture[]; selectedId: number | null }) {
  return <>
    {selectedId != null && !textures.some((texture) => texture.id === selectedId) && <option value={selectedId} disabled>Unavailable Texture (choose another)</option>}
    {textures.map((texture) => <option key={texture.id} value={texture.id}>{texture.textureName} — {texture.fileName}</option>)}
  </>;
}

function CategoryChoices({ categories, value, onChange }: {
  categories: ThreeDModelCategoryOption[];
  value: number[];
  onChange: (value: number[]) => void;
}) {
  return <div className="space-y-1"><p className="text-xs font-medium">Categories</p><div className="flex flex-wrap gap-2">{categories.map((category) => <label key={category.id} className="flex items-center gap-1 text-xs">
    <input type="checkbox" checked={value.includes(category.id)} onChange={(event) => onChange(event.target.checked ? [...value, category.id] : value.filter((id) => id !== category.id))} />{category.name}
  </label>)}{value.filter((id) => !categories.some((category) => category.id === id)).map((id) => <label key={id} className="flex items-center gap-1 text-xs text-amber-800 dark:text-amber-300">
    <input type="checkbox" checked onChange={() => onChange(value.filter((selected) => selected !== id))} />Unavailable category #{id} (remove)
  </label>)}{categories.length === 0 && <span className="text-xs text-muted-foreground">No active categories.</span>}</div></div>;
}
