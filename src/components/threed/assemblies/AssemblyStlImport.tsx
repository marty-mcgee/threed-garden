'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Download, Eye, FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { modelForPreview } from '@/components/admin/threed/models/model-preview-requirements';
import { MODEL_WORKSPACE_PERSPECTIVE, ThreeDModelAssetPreview } from '@/components/admin/threed/models/ThreeDModelAssetPreview';
import { uploadThreeDPrimaryFile } from '@/libraries/services/threed/models/model-primary-upload-client';
import { MAX_THREED_DIRECT_MODEL_BYTES, threeDModelUploadPolicy } from '@/libraries/services/threed/models/model-upload-policy-core';
import { MAX_ASSEMBLY_COMPONENTS, type AssemblyDefinition } from '@/libraries/services/threed/models/assembly-group-core';
import type { StlImportUnits, StlImportUpAxis } from '@/libraries/services/threed/models/stl-import';
import type { StlPartGroup, StlPartsInspection } from '@/libraries/services/threed/models/stl-parts-import';
import {
  createStlAssemblyImportProgress,
  recoverStlAssemblyImportModel,
  saveStlAssemblyImport,
  stlAssemblyImportReceipt,
  type StlAssemblyImportBoundary,
  type StlAssemblyImportProgress,
} from './stl-assembly-import-client';

interface AssemblyStlImportProps {
  ownerId: string;
  disabled?: boolean;
  beforeOpen: () => boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (definition: AssemblyDefinition) => void;
}

interface Source {
  bytes: ArrayBuffer;
  name: string;
}

interface Review {
  source: Source;
  inspection: StlPartsInspection;
  url: string;
}

const unitsOptions = [
  {
    value: 'inches',
    label: 'Inches',
  },
  {
    value: 'millimetres',
    label: 'Millimetres',
  },
  {
    value: 'centimetres',
    label: 'Centimetres',
  },
  {
    value: 'metres',
    label: 'Metres',
  },
] as const;

function dimensions(size: number[]) {
  return size.map(value => Number(value.toFixed(5)).toLocaleString(undefined, { maximumFractionDigits: 5 })).join(' × ');
}

function initialGroups(inspection: StlPartsInspection): StlPartGroup[] {
  return inspection.islands.map((island, index) => ({
    id: island.id,
    label: `Part ${index + 1}`,
    islandIds: [island.id],
  }));
}

export function AssemblyStlImport({ ownerId, disabled = false, beforeOpen, onOpenChange, onSaved }: AssemblyStlImportProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const replacementInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const owner = useRef<string | undefined>(ownerId);
  const operation = useRef<AbortController | null>(null);
  const working = useRef(false);
  const pause = useRef(false);
  const urls = useRef(new Set<string>());
  const progress = useRef<StlAssemblyImportProgress | null>(null);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [units, setUnits] = useState<StlImportUnits | ''>('');
  const [upAxis, setUpAxis] = useState<StlImportUpAxis>('z');
  const [name, setName] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [groups, setGroups] = useState<StlPartGroup[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewGroupId, setPreviewGroupId] = useState('');
  const [partPreview, setPartPreview] = useState<{ key: string; url: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [previewingPart, setPreviewingPart] = useState(false);
  const [readyPreviewUrl, setReadyPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recoveryId, setRecoveryId] = useState('');
  const [, refreshProgress] = useState(0);
  owner.current = ownerId;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      owner.current = undefined;
      pause.current = true;
      operation.current?.abort();
      for (const url of urls.current) URL.revokeObjectURL(url);
      urls.current.clear();
    };
  }, []);

  useEffect(() => {
    onOpenChange(open);
    return () => onOpenChange(false);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!working.current && !progress.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [open]);

  function retainUrl(bytes: ArrayBuffer) {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
    urls.current.add(url);
    return url;
  }

  function releaseUrl(url?: string) {
    if (url && urls.current.delete(url)) URL.revokeObjectURL(url);
  }

  useEffect(() => () => releaseUrl(review?.url), [review]);
  useEffect(() => () => releaseUrl(partPreview?.url), [partPreview]);

  useEffect(() => {
    setReview(null);
    setGroups([]);
    setSelected([]);
    setPreviewGroupId('');
    setPartPreview(null);
    setReadyPreviewUrl('');
    if (!open || !source || !units) {
      setPreparing(false);
      return;
    }
    const controller = new AbortController();
    setPreparing(true);
    setError('');
    void (async () => {
      try {
        const [{ inspectStlParts }, { convertStlImport }] = await Promise.all([
          import('@/libraries/services/threed/models/stl-parts-import'),
          import('@/libraries/services/threed/models/stl-import'),
        ]);
        const options = {
          units,
          upAxis,
        };
        const inspection = await inspectStlParts(source.bytes, options, controller.signal);
        const conversion = await convertStlImport(source.bytes, options, controller.signal);
        if (!mounted.current || controller.signal.aborted) return;
        setReview({
          source,
          inspection,
          url: retainUrl(conversion.bytes),
        });
        setGroups(initialGroups(inspection));
      } catch (cause) {
        if (mounted.current && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not inspect this STL.');
      } finally {
        if (mounted.current && !controller.signal.aborted) setPreparing(false);
      }
    })();
    return () => controller.abort();
  }, [open, source, units, upAxis]);

  const currentReview = review?.source === source && review.inspection.units === units && review.inspection.upAxis === upAxis ? review : null;
  const previewGroup = groups.find(group => group.id === previewGroupId);
  const previewKey = previewGroup ? `${previewGroup.id}:${previewGroup.islandIds.join(',')}` : '';
  useEffect(() => {
    setPartPreview(null);
    setReadyPreviewUrl('');
    if (!currentReview || !previewGroup) {
      setPreviewingPart(false);
      return;
    }
    const controller = new AbortController();
    setPreviewingPart(true);
    void (async () => {
      try {
        const { convertStlParts } = await import('@/libraries/services/threed/models/stl-parts-import');
        const converted = await convertStlParts(currentReview.source.bytes, currentReview.inspection, [{
          ...previewGroup,
          label: previewGroup.label.trim() || 'Part preview',
        }], controller.signal);
        if (!mounted.current || controller.signal.aborted) return;
        setPartPreview({
          key: previewKey,
          url: retainUrl(converted.parts[0].bytes),
        });
      } catch (cause) {
        if (mounted.current && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not preview this part.');
      } finally {
        if (mounted.current && !controller.signal.aborted) setPreviewingPart(false);
      }
    })();
    return () => controller.abort();
    // Names do not alter geometry. Changing units, grouping or the chosen part replaces the preview.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReview, previewKey]);

  const previewUrl = previewGroup ? (partPreview?.key === previewKey ? partPreview.url : '') : currentReview?.url;
  const previewReady = !!previewUrl && readyPreviewUrl === previewUrl;
  const model = useMemo(() => previewUrl ? modelForPreview({
    id: 0,
    modelName: 'STL Assembly preview',
    modelType: 'glb',
    filePath: previewUrl,
    scale: 1,
    files: [],
  }) : null, [previewUrl]);
  const frozen = !!progress.current;
  const pendingRecovery = progress.current?.parts.find(part => part.saveUnknown);
  const groupsValid = groups.length > 0 && groups.length <= MAX_ASSEMBLY_COMPONENTS && groups.every(group => group.label.trim());

  async function choose(file?: File) {
    if (!file || working.current || progress.current) return;
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    setOpen(true);
    setReading(true);
    setSource(null);
    setReview(null);
    setUnits('');
    setUpAxis('z');
    setError('');
    setName(file.name.replace(/\.stl$/i, '').slice(0, 255));
    try {
      if (!/\.stl$/i.test(file.name) || !file.size || file.size > MAX_THREED_DIRECT_MODEL_BYTES) throw new Error('Choose an STL between 1 byte and 32 MiB.');
      const bytes = await file.arrayBuffer();
      if (!mounted.current || controller.signal.aborted) return;
      setSource({
        bytes,
        name: file.name,
      });
    } catch (cause) {
      if (mounted.current && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not read this STL.');
    } finally {
      if (mounted.current && !controller.signal.aborted) setReading(false);
    }
  }

  function close(saved = false) {
    if (working.current) return;
    if (!saved && progress.current && !window.confirm('Close this import? Saved Models and uploaded files will remain. Download the import receipt first if you need to resume or review partial work.')) return;
    operation.current?.abort();
    progress.current = null;
    setOpen(false);
    setSource(null);
    setReview(null);
    setPartPreview(null);
    setError('');
    setRecoveryId('');
  }

  function combine() {
    if (frozen || selected.length < 2) return;
    const members = groups.filter(group => selected.includes(group.id));
    const first = members[0];
    if (!first) return;
    const islands = new Set(members.flatMap(group => group.islandIds));
    setGroups(rows => rows.flatMap(group => group.id === first.id ? [{
      ...group,
      islandIds: currentReview!.inspection.islands.filter(island => islands.has(island.id)).map(island => island.id),
    }] : selected.includes(group.id) ? [] : [group]));
    setSelected([]);
    setPreviewGroupId('');
    setError('');
  }

  function boundary(): StlAssemblyImportBoundary {
    return {
      fetch: (input, init) => fetch(input, init),
      currentOwner: () => mounted.current ? owner.current : undefined,
      onChange: () => { if (mounted.current) refreshProgress(value => value + 1); },
      shouldPause: () => pause.current,
      upload: file => uploadThreeDPrimaryFile(file, {
        onProgress: (percentage, phase) => {
          if (!mounted.current || !progress.current) return;
          progress.current.status = `${phase === 'verifying' ? 'Verifying' : `Uploading ${Math.round(percentage)}%`}: ${file.name}`;
          refreshProgress(value => value + 1);
        },
      }),
    };
  }

  async function save() {
    if (working.current || !currentReview || !units || !name.trim() || !groupsValid || (!progress.current && !previewReady)) return;
    working.current = true;
    pause.current = false;
    setBusy(true);
    setError('');
    const requestOwner = ownerId;
    const controller = new AbortController();
    operation.current = controller;
    try {
      if (!progress.current) {
        const { convertStlParts } = await import('@/libraries/services/threed/models/stl-parts-import');
        const converted = await convertStlParts(currentReview.source.bytes, currentReview.inspection, groups.map(group => ({
          ...group,
          label: group.label.trim(),
        })), controller.signal);
        if (!mounted.current || controller.signal.aborted || owner.current !== requestOwner) return;
        // Validate every generated file before starting the first upload.
        for (const [index, part] of converted.parts.entries()) threeDModelUploadPolicy(`part-${index + 1}.glb`, part.bytes.byteLength);
        progress.current = createStlAssemblyImportProgress(requestOwner, name, currentReview.source.name, converted);
        refreshProgress(value => value + 1);
      }
      const saved = await saveStlAssemblyImport(progress.current, boundary());
      if (saved && mounted.current && owner.current === requestOwner) {
        working.current = false;
        close(true);
        onSaved(saved);
      }
    } catch (cause) {
      if (mounted.current && owner.current === requestOwner) setError(cause instanceof Error ? cause.message : 'Import was interrupted. Completed parts are retained.');
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function recover() {
    if (working.current || !progress.current || !pendingRecovery) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      await recoverStlAssemblyImportModel(progress.current, pendingRecovery.id, Number(recoveryId), boundary());
      if (mounted.current) setRecoveryId('');
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Could not match the saved Model.');
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function downloadReceipt() {
    if (!progress.current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(stlAssemblyImportReceipt(progress.current), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stl-assembly-import-receipt.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <input ref={input} type="file" accept=".stl" className="hidden" aria-label="Choose Assembly STL file" onChange={event => {
      void choose(event.target.files?.[0]);
      event.target.value = '';
    }} />
    <Button type="button" variant="outline" className="h-7 text-xs" disabled={disabled || open} onClick={() => {
      if (beforeOpen()) input.current?.click();
    }}><FileUp className="size-3.5" />Import STL</Button>
    <Dialog open={open} onOpenChange={value => { if (!value) close(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-6xl" showCloseButton={!busy} onPointerDownOutside={event => event.preventDefault()} onEscapeKeyDown={event => { if (working.current) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Import STL as Assembly Group</DialogTitle>
          <DialogDescription>Review disconnected geometry, name the parts and combine islands that belong together before creating Models and an Assembly.</DialogDescription>
        </DialogHeader>
        <input ref={replacementInput} type="file" accept=".stl" className="hidden" aria-label="Choose another Assembly STL file" disabled={busy || frozen} onChange={event => {
          void choose(event.target.files?.[0]);
          event.target.value = '';
        }} />
        {source && <>
          <fieldset disabled={busy || frozen} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
            <label className="min-w-0 space-y-1 text-xs" htmlFor={`${id}-name`}>Assembly name<Input id={`${id}-name`} value={name} maxLength={255} onChange={event => setName(event.target.value)} /></label>
            <label className="space-y-1 text-xs" htmlFor={`${id}-units`}>Source units<select id={`${id}-units`} className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={units} onChange={event => setUnits(event.target.value as StlImportUnits | '')}>
              <option value="">Choose units…</option>
              {unitsOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select></label>
            <label className="space-y-1 text-xs" htmlFor={`${id}-axis`}>Source up axis<select id={`${id}-axis`} className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={upAxis} onChange={event => setUpAxis(event.target.value as StlImportUpAxis)}>
              <option value="z">Z up</option>
              <option value="y">Y up</option>
            </select></label>
          </fieldset>
          <p className="break-words text-xs text-muted-foreground">{source.name}{currentReview ? ` · ${currentReview.inspection.source.triangleCount.toLocaleString()} triangles · ${currentReview.inspection.islands.length} disconnected islands` : ' · Choose the units used when this STL was authored.'}</p>
        </>}
        {(reading || preparing) && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />{reading ? 'Reading STL…' : 'Inspecting geometry and preparing preview…'}</p>}
        {currentReview && <div className="grid min-w-0 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <section aria-label="Review STL parts" className="min-w-0 space-y-2 rounded-lg border p-2">
            <div className="flex items-center justify-between text-sm font-medium"><span>Parts · {groups.length}/{MAX_ASSEMBLY_COMPONENTS}</span><Button type="button" size="xs" variant="ghost" disabled={busy} onClick={() => setPreviewGroupId('')}>View all</Button></div>
            <p className="text-xs text-muted-foreground">Islands share no vertices. They may be fragments of one part; names and grouping are yours to decide. No CAD features are inferred.</p>
            <div className="flex flex-wrap gap-1">
              <Button type="button" size="xs" variant="outline" disabled={busy || frozen || selected.length < 2} onClick={combine}>Combine selected</Button>
              <Button type="button" size="xs" variant="ghost" disabled={busy || frozen || groups.length === currentReview.inspection.islands.length} onClick={() => {
                if (!window.confirm('Reset part names and separate all detected islands?')) return;
                setGroups(initialGroups(currentReview.inspection));
                setSelected([]);
                setPreviewGroupId('');
              }}>Reset grouping</Button>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto lg:max-h-[23rem]">{groups.map((group, index) => <div key={group.id} className={`space-y-1 rounded border p-2 ${previewGroupId === group.id ? 'border-cyan-500' : ''}`}>
              <div className="flex items-center gap-2">
                <input type="checkbox" aria-label={`Select part ${index + 1} for combining`} disabled={busy || frozen} checked={selected.includes(group.id)} onChange={event => setSelected(values => event.target.checked ? [...values, group.id] : values.filter(value => value !== group.id))} />
                <Input aria-label={`Part ${index + 1} name`} className="h-7 min-w-0 text-xs" value={group.label} maxLength={255} disabled={busy || frozen} onChange={event => setGroups(values => values.map(value => value.id === group.id ? { ...value, label: event.target.value } : value))} />
                <Button type="button" size="icon-xs" variant="ghost" aria-label={`Preview part ${index + 1}`} disabled={busy} onClick={() => setPreviewGroupId(group.id)}><Eye className="size-3.5" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">{group.islandIds.length} island{group.islandIds.length === 1 ? '' : 's'} · {currentReview.inspection.islands.filter(island => group.islandIds.includes(island.id)).reduce((sum, island) => sum + island.triangleCount, 0).toLocaleString()} triangles</p>
            </div>)}</div>
            {groups.length > MAX_ASSEMBLY_COMPONENTS && <p role="status" className="text-xs text-amber-600">Combine islands into at most {MAX_ASSEMBLY_COMPONENTS} parts before saving.</p>}
          </section>
          <section aria-label="STL Assembly visual review" className="min-w-0 space-y-2">
            {previewingPart ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />Preparing part preview…</p> : model && <div className="min-w-0"><ThreeDModelAssetPreview
              key={previewUrl}
              model={model}
              attachedDependencyCount={0}
              dependencyCount={0}
              transientResources
              centerAtOrigin
              perspective={MODEL_WORKSPACE_PERSPECTIVE}
              title={previewGroup ? `Part preview: ${previewGroup.label || 'Unnamed part'}` : 'Whole STL preview'}
              description="Orbit and zoom to review geometry and orientation."
              canvasClassName="h-[min(45dvh,28rem)]"
              onCaptureReady={ready => setReadyPreviewUrl(ready ? previewUrl ?? '' : '')}
            /></div>}
            <p className="text-xs text-muted-foreground">Assembly width × height × depth: {dimensions(currentReview.inspection.bounds.size.map(value => value * 0.3048))} m</p>
            <p className="text-xs text-muted-foreground">Each reviewed part becomes a private, reusable GLB Model with a primary File. The Assembly retains their relative positions. Original CAD constraints and editable Design walls are not imported.</p>
          </section>
        </div>}
        {progress.current && <section aria-label="STL import progress" className="space-y-2 rounded-lg border p-2 text-xs">
          <p role="status" className="flex items-center gap-2">{busy && <Loader2 className="size-4 animate-spin" />}{progress.current.status}</p>
          <p>{progress.current.parts.filter(part => part.modelId).length} of {progress.current.parts.length} Models saved. Successful parts are reused when continuing.</p>
          <div className="flex flex-wrap gap-2">{progress.current.parts.filter(part => part.modelId).map(part => <a key={part.id} href={`/admin/threed/models/${part.modelId}`} target="_blank" rel="noopener noreferrer" className="underline">{part.label} · #{part.modelId}</a>)}</div>
          {pendingRecovery && <div className="space-y-2 border-t pt-2">
            <p>Open <a href="/admin/threed/models" target="_blank" rel="noopener noreferrer" className="underline">All Models</a> and locate “{pendingRecovery.label}”. Only the Model with this exact uploaded primary File can be matched.</p>
            <p className="break-all text-muted-foreground">{pendingRecovery.upload?.url}</p>
            <div className="flex flex-wrap items-end gap-2"><label className="space-y-1">Saved Model ID<Input type="number" min="1" step="1" value={recoveryId} disabled={busy} onChange={event => setRecoveryId(event.target.value)} /></label><Button type="button" variant="outline" size="sm" disabled={busy || !recoveryId} onClick={() => void recover()}>Use saved Model</Button></div>
          </div>}
        </section>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="flex-wrap">
          {!frozen && <Button type="button" variant="outline" disabled={busy || reading} onClick={() => replacementInput.current?.click()}>Choose another STL</Button>}
          {frozen && <Button type="button" variant="outline" onClick={downloadReceipt}><Download className="size-4" />Import receipt</Button>}
          {busy && <Button type="button" variant="outline" onClick={() => {
            pause.current = true;
            if (!progress.current) operation.current?.abort();
          }}>Pause after current part</Button>}
          <Button type="button" variant="outline" disabled={busy} onClick={() => close()}>Cancel</Button>
          <Button type="button" variant="success" disabled={busy || !currentReview || !name.trim() || !groupsValid || (!frozen && (!previewReady || previewingPart)) || !!pendingRecovery || progress.current?.parts.some(part => part.cleanupUnknown)} onClick={() => void save()}>{frozen ? 'Continue import' : 'Create Models and Assembly'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
