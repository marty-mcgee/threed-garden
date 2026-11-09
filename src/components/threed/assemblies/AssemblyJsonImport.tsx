'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { modelForPreview } from '@/components/admin/threed/models/model-preview-requirements';
import { MODEL_WORKSPACE_PERSPECTIVE, ThreeDModelAssetPreview } from '@/components/admin/threed/models/ThreeDModelAssetPreview';
import { uploadThreeDPrimaryFile } from '@/libraries/services/threed/models/model-primary-upload-client';
import type { AssemblyDefinition } from '@/libraries/services/threed/models/assembly-group-core';
import {
  assemblyJsonUnits,
  MAX_ASSEMBLY_JSON_BYTES,
  parseAssemblyJson,
  type AssemblyJsonDocument,
  type AssemblyJsonUnits,
  type ConvertedAssemblyJson,
} from '@/libraries/services/threed/models/assembly-json-import';
import {
  createAssemblyModelImportProgress,
  recoverStlAssemblyImportModel,
  saveStlAssemblyImport,
  stlAssemblyImportReceipt,
  type StlAssemblyImportBoundary,
  type StlAssemblyImportProgress,
} from './stl-assembly-import-client';

const examples = [
  {
    file: 'fortunate-cabin-v001.json',
    label: 'Fortunate Cabin',
  },
  {
    file: 'mcgee-home-garage-v001.json',
    label: 'McGee Home Garage',
  },
  {
    file: 'mcgee-home-garden-v001.json',
    label: 'McGee Home Garden',
  },
] as const;

interface Props {
  ownerId: string;
  disabled: boolean;
  beforeOpen: () => boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (definition: AssemblyDefinition) => void;
}

export function AssemblyJsonImport({ ownerId, disabled, beforeOpen, onOpenChange, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<{ name: string; document: AssemblyJsonDocument } | null>(null);
  const [name, setName] = useState('');
  const [units, setUnits] = useState<AssemblyJsonUnits | ''>('');
  const [example, setExample] = useState<string>(examples[0].file);
  const [modelPage, setModelPage] = useState(0);
  const [review, setReview] = useState<{
    document: AssemblyJsonDocument;
    units: AssemblyJsonUnits;
    conversion: ConvertedAssemblyJson;
    url: string;
  } | null>(null);
  const [ready, setReady] = useState('');
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const [recoveryId, setRecoveryId] = useState('');
  const [, refresh] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const operation = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const currentOwner = useRef<string | undefined>(ownerId);
  const working = useRef(false);
  const pause = useRef(false);
  const progress = useRef<StlAssemblyImportProgress | null>(null);
  currentOwner.current = ownerId;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      currentOwner.current = undefined;
      pause.current = true;
      operation.current?.abort();
    };
  }, []);
  useEffect(() => {
    onOpenChange(open);
    return () => onOpenChange(false);
  }, [open, onOpenChange]);
  useEffect(() => {
    setReview(null);
    setReady('');
    setPreparing(false);
    if (!open || !source || !units) return;
    const controller = new AbortController();
    let url = '';
    setPreparing(true);
    setError('');
    void (async () => {
      try {
        const { convertAssemblyJson } = await import('@/libraries/services/threed/models/assembly-json-import');
        const conversion = await convertAssemblyJson(source.document, units, controller.signal);
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(new Blob([conversion.preview], { type: 'model/gltf-binary' }));
        setReview({
          document: source.document,
          units,
          conversion,
          url,
        });
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not prepare this Assembly.');
      } finally {
        if (!controller.signal.aborted) setPreparing(false);
      }
    })();
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, source, units]);

  const currentReview = review?.document === source?.document && review?.units === units ? review : null;
  const model = useMemo(() => currentReview ? modelForPreview({
    id: 0,
    modelName: 'JSON Assembly preview',
    modelType: 'glb',
    filePath: currentReview.url,
    scale: 1,
    files: [],
  }) : null, [currentReview]);
  const frozen = !!progress.current;
  const pendingRecovery = progress.current?.parts.find(part => part.saveUnknown);
  const savedCount = progress.current?.parts.filter(part => part.modelId).length ?? 0;
  const totalCount = progress.current?.parts.length ?? source?.document.parts.length ?? 0;
  const modelPageCount = Math.max(1, Math.ceil((source?.document.parts.length ?? 0) / 10));
  const importStatus = error || progress.current?.status || (preparing ? 'Preparing Assembly preview…' : 'Review the Model arrangement before creating the Assembly.');
  const handleCaptureReady = useCallback((value: boolean) => {
    setReady(value ? currentReview?.url ?? '' : '');
  }, [currentReview?.url]);

  async function choose(file?: File) {
    if (!file || working.current || progress.current) return;
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    const owner = ownerId;
    setBusy(true);
    setError('');
    try {
      if (!/\.json$/i.test(file.name) || !file.size || file.size > MAX_ASSEMBLY_JSON_BYTES) throw new Error('Choose a ThreeD Assembly JSON file between 1 byte and 32 MiB.');
      const document = parseAssemblyJson(JSON.parse(await file.text()));
      if (!mounted.current || controller.signal.aborted || currentOwner.current !== owner) return;
      setReview(null);
      setSource({
        name: file.name,
        document,
      });
      setName(document.name);
      setModelPage(0);
      setUnits(document.units ?? '');
    } catch (cause) {
      if (mounted.current && !controller.signal.aborted && currentOwner.current === owner) setError(cause instanceof Error ? cause.message : 'Could not read this JSON.');
    } finally {
      if (mounted.current && !controller.signal.aborted) setBusy(false);
    }
  }

  async function loadExample() {
    if (working.current || busy || frozen || !examples.some(item => item.file === example)) return;
    const controller = new AbortController();
    operation.current?.abort();
    operation.current = controller;
    const owner = ownerId;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/examples/assembly-groups/${example}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Could not load the example JSON.');
      const blob = await response.blob();
      if (!mounted.current || controller.signal.aborted || currentOwner.current !== owner) return;
      await choose(new File([blob], example, { type: 'application/json' }));
    } catch (cause) {
      if (mounted.current && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load this example.');
    } finally {
      if (mounted.current && operation.current === controller) setBusy(false);
    }
  }

  function boundary(): StlAssemblyImportBoundary {
    return {
      fetch: (input, init) => fetch(input, init),
      upload: file => uploadThreeDPrimaryFile(file),
      currentOwner: () => mounted.current ? currentOwner.current : undefined,
      shouldPause: () => pause.current,
      onChange: () => { if (mounted.current) refresh(value => value + 1); },
    };
  }

  function close(saved = false) {
    if (working.current) return;
    if (!saved && progress.current && !window.confirm('Close this import? Saved Models and uploads are retained. Download the import receipt to keep their references.')) return;
    operation.current?.abort();
    progress.current = null;
    setOpen(false);
    setSource(null);
    setReview(null);
    setBusy(false);
    setPreparing(false);
    setError('');
    setRecoveryId('');
  }

  async function save() {
    if (working.current || !source || !units || !currentReview || !name.trim() || (!progress.current && ready !== currentReview.url)) return;
    working.current = true;
    pause.current = false;
    setBusy(true);
    setError('');
    const owner = ownerId;
    try {
      progress.current ??= createAssemblyModelImportProgress(owner, name, source.name, currentReview.conversion.parts);
      const saved = await saveStlAssemblyImport(progress.current, boundary());
      if (saved && mounted.current && currentOwner.current === owner) {
        working.current = false;
        close(true);
        onSaved(saved);
      }
    } catch (cause) {
      if (mounted.current && currentOwner.current === owner) setError(cause instanceof Error ? cause.message : 'Import interrupted. Completed Models are retained.');
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

  function receipt() {
    if (!progress.current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(stlAssemblyImportReceipt(progress.current), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'assembly-json-import-receipt.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <Button type="button" variant="outline" className="h-7 text-xs" disabled={disabled || open} onClick={() => { if (beforeOpen()) setOpen(true); }}><FileUp className="size-3.5" />Import JSON</Button>
    <Dialog open={open} onOpenChange={value => { if (!value) close(); }}>
      <DialogContent className="flex h-[min(52rem,92dvh)] max-h-[92dvh] flex-col gap-2 overflow-hidden p-3 sm:max-w-5xl sm:p-4" onPointerDownOutside={event => event.preventDefault()} onEscapeKeyDown={event => { if (working.current) event.preventDefault(); }}>
        <DialogHeader className="shrink-0 pr-8">
          <div className="flex items-center gap-1">
            <DialogTitle>Import JSON as Assembly Group</DialogTitle>
            <ModelFieldHelp label="JSON Assembly import">{source?.document.description || 'Choose a JSON file or load an example, select its source units, then review the Models before saving.'}</ModelFieldHelp>
          </div>
          <DialogDescription className="sr-only">Review named Model parts and their arrangement before creating Models and an Assembly Group.</DialogDescription>
        </DialogHeader>
        <input ref={input} type="file" accept=".json,application/json" className="hidden" aria-label="Choose Assembly geometry JSON" onChange={event => { void choose(event.target.files?.[0]); event.target.value = ''; }} />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={busy || frozen} onClick={() => input.current?.click()}>Choose JSON file</Button>
          <select aria-label="Assembly JSON example" className="h-8 rounded-md border bg-background px-2 text-xs" disabled={busy || frozen} value={example} onChange={event => setExample(event.target.value)}>{examples.map(item => <option key={item.file} value={item.file}>{item.label}</option>)}</select>
          <Button type="button" variant="outline" disabled={busy || frozen} onClick={() => void loadExample()}>Load example</Button>
          <a className="text-xs underline" href="/examples/assembly-groups/template.json" download>JSON template</a>
        </div>
          <fieldset aria-label="Assembly import settings" disabled={busy || frozen || !source} className="grid shrink-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2">
            <label className="text-xs">Assembly name<Input aria-label="JSON Assembly name" maxLength={255} value={name} onChange={event => setName(event.target.value)} /></label>
            <label className="text-xs">Source units<select aria-label="JSON source units" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={units} onChange={event => setUnits(event.target.value as AssemblyJsonUnits | '')}><option value="">Choose units…</option>{assemblyJsonUnits.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></label>
          </fieldset>
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(7rem,0.7fr)_minmax(0,2fr)] gap-2 sm:grid-cols-[14rem_minmax(0,1fr)]">
            <div aria-label="Assembly import Models" className="flex min-h-0 min-w-0 flex-col gap-1 overflow-hidden rounded-lg border p-2">
              <p className="shrink-0 text-xs font-medium">Models · {source?.document.parts.length ?? 0}</p>
              <div className="grid min-h-0 flex-1 grid-rows-10 gap-1">
                {source?.document.parts.slice(modelPage * 10, modelPage * 10 + 10).map((part, index) => <p key={modelPage * 10 + index} title={part.label} className="flex min-h-0 min-w-0 items-center rounded border px-1.5 text-xs"><span className="truncate">{part.label}</span></p>)}
              </div>
              <div className="flex h-7 shrink-0 items-center justify-between gap-1">
                <Button type="button" variant="outline" size="icon-xs" aria-label="Previous Model names" disabled={modelPage === 0} onClick={() => setModelPage(value => value - 1)}><ChevronLeft className="size-3" /></Button>
                <span className="text-[10px] text-muted-foreground">{modelPage + 1}/{modelPageCount}</span>
                <Button type="button" variant="outline" size="icon-xs" aria-label="Next Model names" disabled={modelPage + 1 >= modelPageCount} onClick={() => setModelPage(value => value + 1)}><ChevronRight className="size-3" /></Button>
              </div>
            </div>
            <div aria-label="Assembly import preview" className="min-h-0 min-w-0 overflow-hidden [&>div]:h-full [&_section]:flex [&_section]:h-full [&_section]:min-h-0 [&_section]:flex-col">
              <ThreeDModelAssetPreview model={model} attachedDependencyCount={0} dependencyCount={0} transientResources centerAtOrigin perspective={MODEL_WORKSPACE_PERSPECTIVE} title="Assembly preview" description="Orbit and zoom to review the Models together." canvasClassName="min-h-0 flex-1" onCaptureReady={handleCaptureReady} />
            </div>
          </div>
        <section aria-label="Import progress" className="h-20 shrink-0 overflow-hidden rounded border p-2 text-xs">
          <p role={error ? 'alert' : 'status'} title={importStatus} className={`line-clamp-2 min-h-8 break-words leading-4 ${error ? 'text-destructive' : ''}`}>{importStatus}</p>
          <div className="flex h-8 items-center justify-between gap-2">
            {pendingRecovery && <div className="flex min-w-0 items-center gap-1"><Input aria-label="Recover JSON Model ID" placeholder="Model ID" className="h-7 w-24" type="number" min="1" disabled={busy} value={recoveryId} onChange={event => setRecoveryId(event.target.value)} /><Button type="button" variant="outline" size="xs" disabled={busy || !recoveryId} onClick={() => void recover()}>Match saved Model</Button></div>}
            <span>{savedCount}/{totalCount} Models saved</span>
            <progress aria-label="Models saved" max={Math.max(totalCount, 1)} value={savedCount} className="h-1.5 w-32 accent-emerald-500" />
          </div>
        </section>
        <DialogFooter className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button type="button" variant="outline" className="h-auto min-h-8 whitespace-normal px-2 text-xs" disabled={!frozen} onClick={receipt}><Download className="size-4" />Import receipt</Button>
          <Button type="button" variant="outline" className="h-auto min-h-8 whitespace-normal px-2 text-xs" disabled={!working.current || !frozen} onClick={() => { pause.current = true; }}>Pause after current Model</Button>
          <Button type="button" variant="outline" className="h-auto min-h-8 text-xs" disabled={busy} onClick={() => close()}>Cancel</Button>
          <Button type="button" variant="success" className="h-auto min-h-8 min-w-0 whitespace-normal px-2 text-xs sm:min-w-52" disabled={busy || preparing || !currentReview || !name.trim() || (!frozen && ready !== currentReview.url) || !!pendingRecovery || progress.current?.parts.some(part => part.cleanupUnknown)} onClick={() => void save()}>{frozen ? 'Continue import' : 'Create Models and Assembly'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
