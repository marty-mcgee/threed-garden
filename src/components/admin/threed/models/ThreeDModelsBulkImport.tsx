'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Files, Loader2, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { inspectThreeDModelPrimary } from '@/lib/services/threed/models/model-companion-core';
import type { ThreeDModelCategoryOption } from './ThreeDModelCategoriesManager';
import {
  createBulkDefaults, createBulkDraft, defaultDestination, MAX_BULK_MODELS,
  prepareBulkModel, requirementKey, validateBulkPrimary, validateBulkPreview, validateBulkTexture,
  type BulkDefaults, type BulkDraft, type BulkSource, type BulkExistingTexture,
} from './model-bulk-preparation-core';
import { runBulkModel, type BulkImportResult } from './model-bulk-import-runner';

const TEXTURE_ACCEPT = '.png,.jpg,.jpeg,.webp,.tga,.bmp';
const FLAGS = [
  ['isLibraryItem', 'Library Item'], ['isPublic', 'Public'], ['usedByPlants', 'Used by Plants'],
  ['usedByCharacters', 'Used by Characters'], ['isActive', 'Active after import'],
] as const;
const selectClass = 'h-8 w-full rounded border bg-background px-2 text-xs';
const sizeLabel = (bytes: number) => bytes < 1024 * 1024
  ? `${(bytes / 1024).toFixed(1)} KiB` : `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
const possibleRepeat = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export function ThreeDModelsBulkImport({ categories, onComplete }: {
  categories: ThreeDModelCategoryOption[];
  onComplete: (summary: { created: number; failed: number }) => void | Promise<void>;
}) {
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
  const [results, setResults] = useState<Record<string, BulkImportResult>>({});
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
  const activeCategories = categories.filter((category) => category.isActive);
  const activeTextures = existingTextures.filter((texture) => texture.isActive);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; previewCheckRef.current += 1; };
  }, []);
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
  }
  function updateDraft(id: string, update: Partial<BulkDraft>) {
    if (busyRef.current) return;
    changeDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...update } : draft));
  }
  const prepared = useMemo(() => new Map(drafts.map((draft) => [draft.id, prepareBulkModel(draft, defaults, pool, texturesReady ? existingTextures : undefined)])), [drafts, defaults, pool, texturesReady, existingTextures]);
  const eligible = drafts.filter((draft) => !results[draft.id] && prepared.get(draft.id)?.ready);
  const selected = drafts.find((draft) => draft.id === selectedId) ?? drafts[0];
  const selectedPlan = selected && prepared.get(selected.id);
  const result = selected && results[selected.id];
  const locked = importing || !!result;

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
          const requirements = inspectThreeDModelPrimary(draft.source.file.name, new Uint8Array(await draft.source.file.arrayBuffer()));
          if (requirements.length > 500) throw new Error('More than 500 texture references detected. Review this file with Add Model.');
          changeDrafts((current) => current.map((entry) => entry.id === draft.id ? { ...entry, inspecting: false, requirements } : entry));
        } catch {
          changeDrafts((current) => current.map((entry) => entry.id === draft.id ? {
            ...entry, inspecting: false, inspectionError: 'Unable to scan this FBX within the bulk limits. Review it with Add Model.',
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
      const error = validateBulkTexture(file);
      if (error || pool.length + additions.length >= 500) {
        skipped.push(`${file.name}: ${error ?? '500-file texture selection limit reached'}`);
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
    const run = eligible.map((draft) => ({ draft, plan: prepared.get(draft.id)! }));
    let created = 0;
    let failed = 0;
    try {
      for (const { draft, plan } of run) {
        const outcome = await runBulkModel({
          file: draft.source.file, modelName: draft.modelName, settings: plan.settings,
          rotationY: draft.rotationY, offsetX: draft.offsetX, offsetY: draft.offsetY, offsetZ: draft.offsetZ,
          configureLater: draft.configureLater, previewFile: draft.previewFile,
          attachments: plan.attachments.map((attachment) => ({ file: attachment.source.file, relativePath: attachment.relativePath })),
        }, (label) => { if (mountedRef.current) setProgress((current) => ({ ...current, [draft.id]: label })); });
        if (outcome.modelId) created += 1;
        if (outcome.status !== 'imported') failed += 1;
        if (mountedRef.current) {
          setResults((current) => ({ ...current, [draft.id]: outcome }));
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
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs"><Files className="mr-1 h-3 w-3" />Bulk Import FBX</Button></DialogTrigger>
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[min(96vw,1150px)]">
      <DialogHeader>
        <DialogTitle>Bulk Import FBX</DialogTitle>
        <DialogDescription>Prepare Models and match textures, then import ready rows. Files upload only when you start importing.</DialogDescription>
      </DialogHeader>
      <input ref={primaryRef} aria-label="Select FBX files" type="file" multiple accept=".fbx" className="hidden" disabled={importing}
        onChange={(event) => { addPrimaries(event.target.files); event.target.value = ''; }} />
      <input ref={textureRef} aria-label="Select shared texture files" type="file" multiple accept={TEXTURE_ACCEPT} className="hidden" disabled={importing}
        onChange={(event) => { addTextures(event.target.files); event.target.value = ''; }} />
      <input ref={previewRef} aria-label="Select preview image" type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" disabled={locked || checkingPreview}
        onChange={(event) => { if (selected) void choosePreview(event.target.files?.[0], selected.id); event.target.value = ''; }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={importing || drafts.length >= MAX_BULK_MODELS} onClick={() => primaryRef.current?.click()}><Upload className="mr-1 h-3 w-3" />Choose FBX files</Button>
        <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => textureRef.current?.click()}>Add texture files</Button>
        <Badge variant="secondary">{drafts.length}/100 Models</Badge>
        <span className="text-xs text-muted-foreground">Up to 4 MiB per file for bulk uploads.</span>
      </div>
      {notice && <p role="alert" className="break-words rounded border border-amber-500/40 p-2 text-xs">{notice}</p>}
      <details className="rounded border p-3">
        <summary className="cursor-pointer text-sm font-medium">Batch defaults</summary>
        <fieldset disabled={importing} className="mt-3 space-y-3">
          <label className="block max-w-40 text-xs">Scale<Input aria-label="Batch scale" type="number" min="0.01" step="0.01" value={defaults.scale} onChange={(event) => setDefaults((current) => ({ ...current, scale: event.target.value }))} /></label>
          <div className="flex flex-wrap gap-3">{FLAGS.map(([key, label]) => <label key={key} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={defaults[key]} onChange={(event) => setDefaults((current) => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div>
          <CategoryChoices categories={activeCategories} value={defaults.categoryIds} onChange={(categoryIds) => setDefaults((current) => ({ ...current, categoryIds }))} />
          <label className="block text-xs">Assign Existing Texture File
            <select aria-label="Batch existing Texture" className={selectClass} value={defaults.existingTextureId ?? ''}
              onChange={(event) => setDefaults((current) => ({ ...current, existingTextureId: event.target.value ? Number(event.target.value) : null }))}>
              <option value="">None</option>
              <ExistingTextureOptions textures={activeTextures} selectedId={defaults.existingTextureId} />
            </select>
          </label>
          <p className="text-xs text-muted-foreground">Use this Texture as Base Color for all material slots in each inheriting Model. The saved Texture file is reused during import.</p>
          <p className="text-xs text-muted-foreground">Changes apply to inherited values. Models stay inactive unless activation is requested and their saved dependency audit succeeds.</p>
        </fieldset>
      </details>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground" role="status">{texturesLoading ? 'Loading existing Textures…' : textureError || `${activeTextures.length} active existing Textures available`}</span>
        <Button type="button" variant="outline" size="sm" disabled={importing || texturesLoading} onClick={() => setTextureRefresh((value) => value + 1)}>Refresh existing Textures</Button>
      </div>
      <details className="rounded border p-3" open={pool.length > 0 && pool.length <= 6}>
        <summary className="cursor-pointer text-sm font-medium">Shared texture files ({pool.length}/500)</summary>
        <p className="my-2 text-xs text-muted-foreground">Select local files once to resolve named texture references. Use Assign Existing Texture File in the batch defaults or a Model’s settings to reuse a saved Base Color Texture.</p>
        <div className="max-h-36 space-y-1 overflow-y-auto">{pool.map((source, index) => <div key={source.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="break-all">#{index + 1} {source.sourcePath} · {sizeLabel(source.file.size)}</span>
          <Button type="button" variant="ghost" size="sm" disabled={importing} aria-label={`Remove texture ${index + 1}: ${source.file.name}`} onClick={() => setPool((current) => current.filter((entry) => entry.id !== source.id))}><Trash2 className="h-3 w-3" /></Button>
        </div>)}</div>
      </details>
      {drafts.length > 0 && <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.5fr)]">
        <div className="max-h-[50vh] space-y-1 overflow-y-auto" aria-label="Queued Models">{drafts.map((draft, index) => <div key={draft.id} className={`flex items-center gap-1 rounded border ${selected?.id === draft.id ? 'border-primary bg-muted' : ''}`}>
          <button type="button" className="min-w-0 flex-1 p-2 text-left" aria-pressed={selected?.id === draft.id} onClick={() => setSelectedId(draft.id)}>
            <span className="block truncate text-xs font-medium">{index + 1}. {draft.modelName || draft.source.file.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{draft.source.sourcePath} · {sizeLabel(draft.source.file.size)}</span>
            <span className="block text-[11px]">{status(draft)}</span>
            {drafts.some((other) => other.id !== draft.id && possibleRepeat(other.source.file, draft.source.file)) && <span className="block text-[11px] text-amber-700">Possible duplicate — review both files</span>}
          </button>
          {!results[draft.id] && <Button type="button" variant="ghost" size="sm" disabled={importing} aria-label={`Remove Model ${index + 1}`} onClick={() => changeDrafts((current) => current.filter((entry) => entry.id !== draft.id))}><Trash2 className="h-3 w-3" /></Button>}
        </div>)}</div>
        {selected && selectedPlan && <div className="min-w-0 space-y-3 rounded border p-3">
          <h3 className="break-words text-sm font-medium">{selected.source.file.name}</h3>
          {result ? <div className="space-y-3" role="status">
            <p className="text-sm">{result.message}</p>
            {result.modelId ? <a className="text-sm underline" href={`/admin/threed/model-files?modelId=${result.modelId}`} target="_blank" rel="noreferrer">Review Model files (new tab)</a>
              : result.status === 'unknown' && <a className="text-sm underline" href="/admin/threed/models" target="_blank" rel="noreferrer">Check Models (new tab)</a>}
            {result.canRetry && !result.modelId && <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => setResults((current) => { const next = { ...current }; delete next[selected.id]; return next; })}>Correct and retry</Button>}
          </div> : <>
            <fieldset disabled={locked || checkingPreview} className="space-y-3">
              <label className="block text-xs">Model name<Input value={selected.modelName} onChange={(event) => updateDraft(selected.id, { modelName: event.target.value })} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">Scale {selected.overrides.scale === undefined && '(batch)'}<Input type="number" min="0.01" step="0.01" value={selectedPlan.settings.scale} onChange={(event) => override('scale', event.target.value)} /></label>
                <label className="text-xs">Y rotation (degrees)<Input type="number" step="any" value={selected.rotationY} onChange={(event) => updateDraft(selected.id, { rotationY: event.target.value })} /></label>
              </div>
              {selected.overrides.scale !== undefined && <button type="button" className="text-xs underline" onClick={() => resetOverride('scale')}>Use batch scale</button>}
              <div className="grid grid-cols-3 gap-2">{(['offsetX', 'offsetY', 'offsetZ'] as const).map((key) => <label key={key} className="text-xs">{key.replace('offset', '')} offset<Input type="number" step="any" value={selected[key]} onChange={(event) => updateDraft(selected.id, { [key]: event.target.value })} /></label>)}</div>
              <div className="grid gap-2 sm:grid-cols-2">{FLAGS.map(([key, label]) => <label key={key} className="text-xs">{label}<select className={selectClass} value={selected.overrides[key] === undefined ? 'inherit' : String(selected.overrides[key])} disabled={key === 'isActive' && selected.configureLater} onChange={(event) => event.target.value === 'inherit' ? resetOverride(key) : override(key, event.target.value === 'true')}>
                <option value="inherit">Batch ({defaults[key] ? 'On' : 'Off'})</option><option value="true">On</option><option value="false">Off</option>
              </select></label>)}</div>
              <CategoryChoices categories={activeCategories} value={selectedPlan.settings.categoryIds} onChange={(categoryIds) => override('categoryIds', categoryIds)} />
              <p className="text-xs text-muted-foreground">{selected.overrides.categoryIds === undefined ? 'Categories inherit batch defaults.' : <button type="button" className="underline" onClick={() => resetOverride('categoryIds')}>Use batch categories</button>}</p>
              <label className="block text-xs">Assign Existing Texture File
                <select aria-label="Model existing Texture" className={selectClass} value={selected.overrides.existingTextureId === undefined ? 'inherit' : selected.overrides.existingTextureId ?? ''}
                  onChange={(event) => event.target.value === 'inherit' ? resetOverride('existingTextureId') : override('existingTextureId', event.target.value ? Number(event.target.value) : null)}>
                  <option value="inherit">Batch ({defaults.existingTextureId == null ? 'None' : existingTextures.find((texture) => texture.id === defaults.existingTextureId)?.textureName ?? 'Unavailable Texture'})</option>
                  <option value="">None</option>
                  <ExistingTextureOptions textures={activeTextures} selectedId={selected.overrides.existingTextureId ?? null} />
                </select>
              </label>
              <p className="text-xs text-muted-foreground">Assigns Base Color to all material slots during import. Named texture files below are checked separately.</p>
              <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => previewRef.current?.click()}>Choose preview image</Button>
                {selected.previewFile && <><span className="text-xs">{selected.previewFile.name}</span><button type="button" className="text-xs underline" onClick={() => updateDraft(selected.id, { previewFile: undefined })}>Remove preview</button></>}
              </div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.configureLater} onChange={(event) => updateDraft(selected.id, { configureLater: event.target.checked })} />Resolve missing texture files later (keep inactive)</label>
              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-medium">Texture matches</h4>
                {!selected.inspecting && !selected.requirements.length && <p className="text-xs text-muted-foreground">No named textures detected — review after import. This scan does not verify FBX structure or appearance.</p>}
                {selectedPlan.matches.map((match) => <div key={requirementKey(match.requirement)} className="space-y-1 rounded border p-2">
                  <p className="break-all text-xs">{match.requirement.relativePath}</p>
                  <select aria-label={`Texture for ${match.requirement.relativePath}`} className={selectClass} value={pool.some((entry) => entry.id === match.sourceId) ? match.sourceId : ''}
                    onChange={(event) => updateDraft(selected.id, { choices: { ...selected.choices, [requirementKey(match.requirement)]: { sourceId: event.target.value, relativePath: match.relativePath || defaultDestination(match.requirement.relativePath) } } })}>
                    <option value="">Choose texture / leave unresolved</option>{pool.map((source, index) => <option key={source.id} value={source.id}>#{index + 1} {source.sourcePath} ({sizeLabel(source.file.size)})</option>)}
                  </select>
                  <Input aria-label={`Destination for ${match.requirement.relativePath}`} value={match.relativePath} onChange={(event) => updateDraft(selected.id, { choices: { ...selected.choices, [requirementKey(match.requirement)]: { sourceId: match.sourceId, relativePath: event.target.value } } })} />
                  <p className="text-[11px] text-muted-foreground">{match.issue || (match.automatic ? 'Suggested match — change if needed' : match.sourceId ? 'Selected explicitly' : 'Missing or ambiguous') }</p>
                  {selected.choices[requirementKey(match.requirement)] && <button type="button" className="text-[11px] underline" onClick={() => { const choices = { ...selected.choices }; delete choices[requirementKey(match.requirement)]; updateDraft(selected.id, { choices }); }}>Use suggested match</button>}
                </div>)}
                <h4 className="text-xs font-medium">Additional texture attachments</h4>
                {(selected.extras ?? []).map((extra) => <div key={extra.id} className="flex items-center gap-1">
                  <span className="max-w-28 truncate text-xs">{pool.find((source) => source.id === extra.sourceId)?.file.name ?? 'File removed'}</span>
                  <Input aria-label="Additional texture destination" value={extra.relativePath} onChange={(event) => updateDraft(selected.id, { extras: selected.extras?.map((entry) => entry.id === extra.id ? { ...entry, relativePath: event.target.value } : entry) })} />
                  <button type="button" className="text-xs underline" onClick={() => updateDraft(selected.id, { extras: selected.extras?.filter((entry) => entry.id !== extra.id) })}>Remove</button>
                </div>)}
                <select aria-label="Add additional texture attachment" className={selectClass} value="" onChange={(event) => { const source = pool.find((entry) => entry.id === event.target.value); if (source) updateDraft(selected.id, { extras: [...(selected.extras ?? []), { id: crypto.randomUUID(), sourceId: source.id, relativePath: defaultDestination(source.file.name) }] }); }}>
                  <option value="">Attach another selected texture…</option>{pool.map((source, index) => <option key={source.id} value={source.id}>#{index + 1} {source.sourcePath}</option>)}
                </select>
              </div>
            </fieldset>
            {(selectedPlan.issues.length > 0 || selectedPlan.unresolved.length > 0) && <div className="space-y-1 text-xs" role="status">
              {selectedPlan.issues.map((issue, index) => <p key={`issue-${index}`} className="text-red-600">{issue}</p>)}
              {selectedPlan.unresolved.map((issue, index) => <p key={`unresolved-${index}`} className="text-amber-700">{issue}{selected.configureLater ? ' — configure after import' : ''}</p>)}
            </div>}
          </>}
        </div>}
      </div>}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t bg-background py-3">
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
  </label>)}{categories.length === 0 && <span className="text-xs text-muted-foreground">No active categories.</span>}</div></div>;
}
