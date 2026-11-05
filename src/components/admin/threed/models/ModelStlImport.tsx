'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MAX_THREED_DIRECT_MODEL_BYTES, threeDModelUploadPolicy } from '@/libraries/services/threed/models/model-upload-policy-core';
import type { StlImportConversion, StlImportInspection, StlImportUnits, StlImportUpAxis } from '@/libraries/services/threed/models/stl-import';
import { modelForPreview } from './model-preview-requirements';
import { MODEL_WORKSPACE_PERSPECTIVE, ThreeDModelAssetPreview } from './ThreeDModelAssetPreview';

interface StlSource {
  bytes: ArrayBuffer;
  fileName: string;
  inspection: StlImportInspection;
}

interface PreparedStl {
  conversion: StlImportConversion;
  file: File;
  url: string;
}

interface ModelStlImportProps {
  onUseFile: (file: File) => Promise<boolean>;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  uploadNotice?: string;
  canCancelUpload?: boolean;
  onCancelUpload?: () => void;
}

const unitOptions: Array<{
  value: StlImportUnits;
  label: string;
}> = [
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
];

function dimensions(size: readonly number[]) {
  return size.map(value => Number(value.toFixed(6)).toLocaleString(undefined, { maximumFractionDigits: 6 })).join(' × ');
}

/** Converts local STL geometry before handing a GLB to the existing Model upload owner. */
export function ModelStlImport({
  onUseFile,
  disabled = false,
  onBusyChange,
  uploadNotice,
  canCancelUpload = false,
  onCancelUpload,
}: ModelStlImportProps) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const replacementInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const reading = useRef<AbortController | null>(null);
  const uploadLock = useRef(false);
  const previewUrls = useRef(new Set<string>());
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<StlSource | null>(null);
  const [units, setUnits] = useState<StlImportUnits | ''>('');
  const [upAxis, setUpAxis] = useState<StlImportUpAxis>('z');
  const [prepared, setPrepared] = useState<PreparedStl | null>(null);
  const [readingSource, setReadingSource] = useState(false);
  const [converting, setConverting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      reading.current?.abort();
      for (const url of previewUrls.current) URL.revokeObjectURL(url);
      previewUrls.current.clear();
    };
  }, []);

  useEffect(() => {
    onBusyChange?.(open);
    return () => onBusyChange?.(false);
  }, [open, onBusyChange]);

  useEffect(() => {
    if (!prepared) return;
    return () => {
      if (previewUrls.current.delete(prepared.url)) URL.revokeObjectURL(prepared.url);
    };
  }, [prepared]);

  useEffect(() => {
    setPrepared(null);
    setPreviewReady(false);
    if (!open || !source || !units) {
      setConverting(false);
      return;
    }
    const controller = new AbortController();
    setConverting(true);
    setError('');
    void (async () => {
      try {
        const { convertStlImport } = await import('@/libraries/services/threed/models/stl-import');
        const conversion = await convertStlImport(source.bytes, {
          units,
          upAxis,
        }, controller.signal);
        if (controller.signal.aborted || !mounted.current) return;
        const file = new File([conversion.bytes], source.fileName.replace(/\.stl$/i, '.glb'), { type: 'model/gltf-binary' });
        threeDModelUploadPolicy(file.name, file.size);
        const url = URL.createObjectURL(file);
        previewUrls.current.add(url);
        setPrepared({
          conversion,
          file,
          url,
        });
      } catch (cause) {
        if (!controller.signal.aborted && mounted.current) {
          setError(cause instanceof Error ? cause.message : 'Could not convert this STL.');
        }
      } finally {
        if (!controller.signal.aborted && mounted.current) setConverting(false);
      }
    })();
    return () => controller.abort();
  }, [open, source, units, upAxis]);

  const currentPreview = prepared?.conversion.units === units && prepared.conversion.upAxis === upAxis ? prepared : null;
  const model = useMemo(() => currentPreview ? modelForPreview({
    id: 0,
    modelName: source?.fileName ?? 'STL Model',
    modelType: 'glb',
    filePath: currentPreview.url,
    scale: 1,
    files: [],
  }) : null, [currentPreview, source?.fileName]);

  function close() {
    if (uploadLock.current) return;
    reading.current?.abort();
    reading.current = null;
    setOpen(false);
    setSource(null);
    setPrepared(null);
    setError('');
  }

  async function chooseSource(file: File) {
    if (uploadLock.current) return;
    reading.current?.abort();
    const controller = new AbortController();
    reading.current = controller;
    setOpen(true);
    setSource(null);
    setPrepared(null);
    setUnits('');
    setUpAxis('z');
    setError('');
    setReadingSource(true);
    try {
      if (!/\.stl$/i.test(file.name)) throw new Error('Choose an STL file.');
      if (!file.size || file.size > MAX_THREED_DIRECT_MODEL_BYTES) throw new Error('Choose an STL between 1 byte and 32 MiB.');
      threeDModelUploadPolicy(file.name.replace(/\.stl$/i, '.glb'), 1);
      const bytes = await file.arrayBuffer();
      if (controller.signal.aborted || !mounted.current) return;
      const { inspectStlImport } = await import('@/libraries/services/threed/models/stl-import');
      const inspection = inspectStlImport(bytes, controller.signal);
      if (controller.signal.aborted || !mounted.current) return;
      setSource({
        bytes,
        fileName: file.name,
        inspection,
      });
    } catch (cause) {
      if (!controller.signal.aborted && mounted.current) {
        setError(cause instanceof Error ? cause.message : 'Could not read this STL.');
      }
    } finally {
      if (!controller.signal.aborted && mounted.current) setReadingSource(false);
      if (reading.current === controller) reading.current = null;
    }
  }

  async function useFile() {
    if (!currentPreview || !previewReady || converting || uploadLock.current) return;
    uploadLock.current = true;
    setUploading(true);
    setError('');
    try {
      const accepted = await onUseFile(currentPreview.file);
      if (!mounted.current) return;
      if (accepted) {
        uploadLock.current = false;
        close();
      } else {
        setError('Upload was not completed. Your preview is retained; review the upload message and try again.');
      }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Could not upload the converted Model.');
    } finally {
      uploadLock.current = false;
      if (mounted.current) setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept=".stl"
        className="hidden"
        aria-label="Choose STL file"
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void chooseSource(file);
        }}
      />
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={disabled || open} onClick={() => input.current?.click()}>
        <FileUp className="mr-1 h-4 w-4" />Import STL
      </Button>
      <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) close(); }}>
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl"
          showCloseButton={!uploading}
          onPointerDownOutside={event => event.preventDefault()}
          onEscapeKeyDown={event => { if (uploadLock.current) event.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Import STL Model</DialogTitle>
            <DialogDescription>Choose the source units and upward axis, then review the converted Model before uploading.</DialogDescription>
          </DialogHeader>
          <input
            ref={replacementInput}
            type="file"
            accept=".stl"
            className="hidden"
            aria-label="Choose another STL file"
            disabled={uploading}
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void chooseSource(file);
            }}
          />
          {readingSource && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Reading STL…</p>}
          {source && <>
            <p className="break-words text-sm font-medium">{source.fileName} <span className="font-normal text-muted-foreground">· {source.inspection.triangleCount.toLocaleString()} triangles</span></p>
            <fieldset disabled={uploading} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`${inputId}-units`}>Source units</Label>
                <select id={`${inputId}-units`} aria-label="STL source units" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={units} onChange={event => setUnits(event.target.value as StlImportUnits | '')}>
                  <option value="">Choose units…</option>
                  {unitOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${inputId}-axis`}>Source up axis</Label>
                <select id={`${inputId}-axis`} aria-label="STL source up axis" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={upAxis} onChange={event => setUpAxis(event.target.value as StlImportUpAxis)}>
                  <option value="z">Z up</option>
                  <option value="y">Y up</option>
                </select>
              </div>
            </fieldset>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Source X × Y × Z: {dimensions(source.inspection.bounds.size)}{units ? ` ${units}` : ' (choose units)'}</p>
              {currentPreview && <>
                <p>Model width × height × depth: {dimensions(currentPreview.conversion.metresSize)} m</p>
                <p>Scene X × Y × Z: {dimensions(currentPreview.conversion.sceneSize)} units · Model scale 1</p>
              </>}
            </div>
            {converting ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Preparing preview…</p>
              : model ? <div className="min-w-0"><ThreeDModelAssetPreview
                key={currentPreview?.url}
                model={model}
                attachedDependencyCount={0}
                dependencyCount={0}
                transientResources
                centerAtOrigin
                perspective={MODEL_WORKSPACE_PERSPECTIVE}
                title="STL Model preview"
                description="Orbit and zoom to review the Model's orientation."
                canvasClassName="h-[min(42dvh,24rem)]"
                onCaptureReady={setPreviewReady}
              /></div>
                : <p className="text-sm text-muted-foreground">STL files do not declare units. Choose the units used when the file was created.</p>}
            <p className="text-xs text-muted-foreground">The converted GLB retains the geometry as one reusable Model. After upload, use Create Model to save it. Keep your original STL for CAD editing.</p>
          </>}
          {uploading && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 shrink-0 animate-spin" />{uploadNotice || 'Uploading converted Model…'}</p>}
          {error && <div role="alert" className="space-y-1 text-sm text-destructive"><p>{error}</p>{!uploading && uploadNotice && <p>{uploadNotice}</p>}</div>}
          <DialogFooter>
            {!source && !readingSource && <Button type="button" variant="outline" onClick={() => replacementInput.current?.click()}>Choose another STL</Button>}
            {uploading && canCancelUpload && onCancelUpload && <Button type="button" variant="outline" onClick={onCancelUpload}>Cancel upload</Button>}
            <Button type="button" variant="outline" disabled={uploading} onClick={close}>Cancel</Button>
            <Button type="button" variant="success" disabled={!currentPreview || !previewReady || converting || uploading} onClick={() => void useFile()}>
              Upload converted Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
