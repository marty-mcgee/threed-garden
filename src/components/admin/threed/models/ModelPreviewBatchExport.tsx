'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { useModelPreviewSize, validPreviewSize } from '@/components/settings/ModelPreviewSettings';
import { resolvePreviewRequirements } from './model-preview-requirements';
import { ThreeDModelAssetPreview, type PreviewPerspective } from './ThreeDModelAssetPreview';

type Candidate = { id: number; modelName: string; thumbnailUrl?: string | null };
type Result = Candidate & { status: 'Saved' | 'Skipped' | 'Failed'; message: string };
const cameras: Record<string, [number, number, number]> = {
  'Front three-quarter': [4, 3, 6], Front: [0, 0, 8], Side: [8, 0, 0], Top: [0, 8, 0.001],
};
async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30000), cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Request failed.');
  return result;
}

export function ModelPreviewBatchExport({ onComplete }: { onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState('Front three-quarter');
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [message, setMessage] = useState('');
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [job, setJob] = useState<{ model: ModelData; token: number; total: number; attached: number; textures: number } | null>(null);
  const lock = useRef(false);
  const stop = useRef(false);
  const mounted = useRef(true);
  const sequence = useRef(0);
  const capture = useRef<{ token: number; resolve: (blob: Blob) => void; reject: (error: Error) => void } | null>(null);
  const defaults = useModelPreviewSize();
  const [size, setSize] = useState(defaults);
  const [limit, setLimit] = useState(10);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [checked, setChecked] = useState<number[]>([]);
  const [finding, setFinding] = useState(false);
  const [sampleId, setSampleId] = useState<number | null>(null);
  const [sample, setSample] = useState<{ model: ModelData; total: number; attached: number; missing: string[]; textures: number } | null>(null);
  const [sampleError, setSampleError] = useState('');
  const [previewReady, setPreviewReady] = useState(false);
  const [customView, setCustomView] = useState<PreviewPerspective | null>(null);
  const [draftView, setDraftView] = useState<PreviewPerspective | null>(null);
  const view = useMemo<PreviewPerspective>(() => customView ?? { direction: cameras[preset], distanceScale: 1 }, [customView, preset]);
  const validLimit = Number.isInteger(limit) && limit >= 1 && limit <= 1000;
  const dimensionsValid = validPreviewSize(size);
  const startReason = finding ? 'Finding Models…' : running ? 'Batch is running.'
    : !dimensionsValid ? 'Enter width and height from 64 to 2048 pixels.'
    : !validLimit ? 'Enter a batch limit from 1 to 1000.'
    : !checked.length ? 'Select at least one Model.'
    : draftView ? 'Choose Use this perspective to apply your camera changes before starting.'
    : sampleError || (!sample ? 'Choose Preview beside a Model to review the camera.'
      : sample.attached + sample.textures < sample.total ? 'The previewed Model has missing geometry or material files.'
      : !previewReady ? 'Waiting for the preview Model and textures to be ready.' : 'Camera preview is ready. Start will process the queued Models.');
  const queue = candidates.filter(item => checked.includes(item.id)).slice(0, validLimit ? limit : 0);
  useEffect(() => { if (!open) setSize(defaults); }, [defaults, open]);
  useEffect(() => {
    setSample(null); setSampleError(''); setPreviewReady(false);
    if (!open || sampleId === null) return;
    let active = true;
    void Promise.all([
      request(`/api/threed/models?id=${sampleId}`),
      request(`/api/threed/models/files/requirements?modelId=${sampleId}`),
    ]).then(([model, audit]) => {
      if (!Array.isArray(audit.data?.requirements)) throw new Error('Required files could not be checked.');
      const requirements = resolvePreviewRequirements(model.data, audit.data.requirements);
      if (active) setSample({ model: model.data, total: requirements.length,
        attached: requirements.filter(item => item.satisfied).length,
        textures: requirements.filter(item => !item.satisfied && item.kind === 'texture').length,
        missing: requirements.filter(item => !item.satisfied).map(item => item.relativePath) });
    }).catch(() => { if (active) setSampleError('Could not load this preview. Choose another Model or query again.'); });
    return () => { active = false; };
  }, [sampleId, open]);

  async function findModels() {
    if (lock.current) return;
    lock.current = true; setFinding(true); setMessage('Querying Models…');
    setCandidates([]); setChecked([]); setSampleId(null); setResults([]);
    try {
      const found = new Map<number, Candidate>();
      let offset = 0, catalogTotal = Infinity;
      while (offset < catalogTotal && mounted.current) {
        const page = await request(`/api/threed/models?limit=100&offset=${offset}&sort=createdAt&direction=asc`);
        if (!Array.isArray(page.data)) throw new Error('Invalid Model list response.');
        catalogTotal = Math.min(catalogTotal, Number(page.pagination?.total ?? page.data.length));
        for (const item of page.data as Candidate[]) if (!item.thumbnailUrl?.trim()) found.set(item.id, item);
        if (!page.data.length) break;
        offset += page.data.length;
      }
      if (mounted.current) {
        const items = [...found.values()];
        setCandidates(items); setChecked([]);
        setSampleId(items[0]?.id ?? null);
        setMessage(`${items.length} Models have no Library Preview Image. Review your selection before starting.`);
      }
    } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Query failed.'); }
    finally { lock.current = false; if (mounted.current) setFinding(false); }
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stop.current = true; capture.current?.reject(new Error('Batch closed.')); };
  }, []);

  async function run(selectedQueue = queue) {
    if (lock.current || !dimensionsValid || !validLimit || !previewReady || draftView || !selectedQueue.length) return;
    lock.current = true; stop.current = false;
    setRunning(true); setStopping(false); setResults([]); setTotal(0);
    setMessage('Starting selected Models…');
    try {
      const startReason = finding ? 'Finding Models…' : running ? 'Batch is running.'
    : !dimensionsValid ? 'Enter width and height from 64 to 2048 pixels.'
    : !validLimit ? 'Enter a batch limit from 1 to 1000.'
    : !checked.length ? 'Select at least one Model.'
    : draftView ? 'Choose Use this perspective to apply your camera changes before starting.'
    : sampleError || (!sample ? 'Choose Preview beside a Model to review the camera.'
      : sample.attached + sample.textures < sample.total ? 'The previewed Model has missing geometry or material files.'
      : !previewReady ? 'Waiting for the preview Model and textures to be ready.' : 'Camera preview is ready. Start will process the queued Models.');
  const queue = selectedQueue.slice(0, limit);
      if (!mounted.current) return;
      setTotal(queue.length);
      for (const candidate of queue) {
        if (stop.current) break;
        setMessage(`Rendering ${candidate.modelName}…`);
        let status: Result['status'] = 'Failed';
        let detail = '';
        try {
          const current = await request(`/api/threed/models?id=${candidate.id}`);
          if (current.data.thumbnailUrl?.trim()) { status = 'Skipped'; detail = 'Preview already exists.'; }
          else if (!['fbx', 'glb', 'gltf', 'obj'].includes(current.data.modelType) || !current.data.filePath) {
            status = 'Skipped'; detail = 'No supported Model file.';
          } else {
            const audit = await request(`/api/threed/models/files/requirements?modelId=${candidate.id}`);
            if (!mounted.current) throw new Error('Batch closed.');
            if (!Array.isArray(audit.data?.requirements)) throw new Error('Could not inspect required files.');
            const requirements = resolvePreviewRequirements(current.data, audit.data.requirements);
            if (requirements.some(item => !item.satisfied && item.kind !== 'texture')) {
              status = 'Skipped'; detail = 'Required files are missing.';
            } else {
              const token = ++sequence.current;
              const blob = await new Promise<Blob>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Preview did not become ready within 45 seconds.')), 45000);
                capture.current = { token,
                  resolve: value => { clearTimeout(timeout); resolve(value); },
                  reject: error => { clearTimeout(timeout); reject(error); },
                };
                setJob({ model: current.data, token, total: requirements.length, attached: requirements.filter(item => item.satisfied).length, textures: requirements.filter(item => !item.satisfied && item.kind === 'texture').length });
              });
              capture.current = null;
              setJob(null);
              const latest = await request(`/api/threed/models?id=${candidate.id}`);
              if (latest.data.thumbnailUrl?.trim()) { status = 'Skipped'; detail = 'Preview was added during capture.'; }
              else {
                if (!mounted.current) throw new Error('Batch closed.');
                const body = new FormData();
                body.append('purpose', 'thumbnail');
                body.append('file', blob, `model-${candidate.id}-preview.png`);
                const upload = await request('/api/threed/models/upload', { method: 'POST', body });
                if (typeof upload.data?.url !== 'string') throw new Error('Upload returned no image URL.');
                const beforeSave = await request(`/api/threed/models?id=${candidate.id}`);
                if (beforeSave.data.thumbnailUrl?.trim()) { status = 'Skipped'; detail = 'Preview was added during upload.'; }
                else {
                  if (!mounted.current) throw new Error('Batch closed.');
                  await request(`/api/threed/models?id=${candidate.id}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ thumbnailUrl: upload.data.url }),
                  });
                  status = 'Saved'; detail = `${size.width} × ${size.height} transparent PNG`;
                }
              }
            }
          }
        } catch (error) { detail = error instanceof Error ? error.message : 'Preview failed.'; }
        finally { capture.current = null; if (mounted.current) setJob(null); }
        if (!mounted.current) break;
        setResults(previous => [...previous, { ...candidate, status, message: detail }]);
      }
      if (mounted.current) setMessage(stop.current ? 'Stopped. Run again to process remaining missing previews.' : 'Batch complete.');
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'Batch failed.');
    } finally {
      lock.current = false;
      if (mounted.current) { setRunning(false); setJob(null); onComplete(); }
    }
  }

  return <Dialog open={open} onOpenChange={value => { if (!lock.current) setOpen(value); }}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="h-7 text-xs">Generate Missing Previews</Button></DialogTrigger>
    <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-5xl" showCloseButton={!running && !finding}>
      <DialogTitle>Generate Library Previews</DialogTitle>
      <DialogDescription>Find missing previews, select Models and review the camera before starting. PNGs retain transparency. Existing previews are skipped.</DialogDescription>
      <fieldset disabled={running || finding} className="grid gap-3 rounded border p-3 sm:grid-cols-4">
        <label className="text-sm">Starting view
          <select className="mt-1 block w-full rounded border bg-background p-2" value={preset} onChange={event => { setPreviewReady(false); setCustomView(null); setDraftView(null); setPreset(event.target.value); }}>
            {Object.keys(cameras).map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
        {(['width', 'height'] as const).map(axis => <label className="text-sm capitalize" key={axis}>{axis} (px)
          <input type="number" min={64} max={2048} step={1} className="mt-1 w-full rounded border bg-background p-2" value={size[axis] || ''} onChange={event => { setPreviewReady(false); setSize({ ...size, [axis]: Number(event.target.value) }); }} />
        </label>)}
        <label className="text-sm">Batch limit
          <input type="number" min={1} max={1000} step={1} className="mt-1 w-full rounded border bg-background p-2" value={limit || ''} onChange={event => setLimit(Number(event.target.value))} />
        </label>
      </fieldset>
      <p className="text-sm">{preset === 'Top' ? 'Top: looks down +Y toward the Model. Upright characters appear foreshortened; use Front or Front three-quarter for a portrait.' : preset === 'Front' ? 'Front: looks from +Z toward the Model.' : preset === 'Side' ? 'Side: looks from +X toward the Model.' : 'Front three-quarter: elevated view from +X and +Z.'}</p>
      <p className="text-xs text-muted-foreground">Image defaults: Admin → Settings → ThreeD Model Preview Images (this browser). Dimensions: 64–2048 px. Limit: 1–1000 Models. Views use Model axes and fitted framing.</p>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <section className="min-w-0 space-y-2 rounded border p-3">
          <h3 className="font-medium">1. Select Models</h3>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={running || finding} onClick={() => void findModels()}>{finding ? 'Finding…' : 'Find Models'}</Button>
            <Button type="button" variant="ghost" disabled={running || finding || !validLimit} onClick={() => setChecked(candidates.slice(0, limit).map(item => item.id))}>Select first {validLimit ? limit : '…'}</Button>
            <Button type="button" variant="ghost" disabled={running || finding} onClick={() => setChecked([])}>Clear</Button>
          </div>
          <p className="text-xs">{candidates.length} found · {checked.length} selected · {queue.length} will run (in list order)</p>
          <ul className="max-h-80 space-y-1 overflow-y-auto" aria-label="Models available for batch processing">
            {candidates.map(item => <li key={item.id} className="flex items-center gap-2 rounded border p-2 text-xs">
              <input type="checkbox" aria-label={`Include ${item.modelName} (#${item.id})`} checked={checked.includes(item.id)} disabled={running || finding} onChange={event => setChecked(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />
              <span className="min-w-0 flex-1 break-words">{item.modelName} · #{item.id} {queue.some(entry => entry.id === item.id) ? '· Queued' : ''}</span>
              <Button type="button" variant="ghost" size="sm" disabled={running || finding} onClick={() => setSampleId(item.id)} aria-pressed={sampleId === item.id}>Preview</Button>
            </li>)}
          </ul>
        </section>
        <section className="min-w-0 space-y-2 rounded border p-3">
          <h3 className="font-medium">2. Review camera and dimensions</h3>
          {job ? <ThreeDModelAssetPreview key={`job-${job.token}`} model={job.model} title="Generating preview"
            dependencyCount={job.total} attachedDependencyCount={job.attached} unresolvedTextureCount={job.textures} autoCapture perspective={view} captureCamera={view.direction} outputSize={size}
            canvasClassName="mx-auto w-full max-w-[400px]"
            onCaptureImage={blob => { if (capture.current?.token === job.token) capture.current.resolve(blob); }}
            onCaptureError={error => { if (capture.current?.token === job.token) capture.current.reject(new Error(error)); }}
          /> : !running && sample && dimensionsValid ? <ThreeDModelAssetPreview
            key={`sample-${sample.model.id}-${preset}-${size.width}-${size.height}`} model={sample.model}
            title={sample.model.modelName || 'Camera preview'} dependencyCount={sample.total} attachedDependencyCount={sample.attached}
            hideCaptureControls perspective={view} onPerspectiveChange={setDraftView} unresolvedTextureCount={sample.textures} captureCamera={view.direction} outputSize={size}
            canvasClassName="mx-auto w-full max-w-[400px]" onCaptureImage={() => {}} onCaptureReady={setPreviewReady}
          /> : <p className="p-8 text-sm text-muted-foreground">{sampleError || (sampleId ? 'Loading preview or waiting for valid dimensions…' : 'Find Models, then choose Preview beside a Model.')}</p>}
          {sample && !running && <div className="space-y-1 text-xs">
            {!previewReady && sample.missing?.length > 0 && <><p className="font-medium text-amber-400">Unresolved source references (checked against loaded assignments):</p><ul className="list-inside list-disc break-words">{sample.missing.map(path => <li key={path}>{path}</li>)}</ul></>}
            <a className="text-cyan-400 underline" href={`/admin/threed/model-files?modelId=${sample.model.id}`} target="_blank" rel="noreferrer">Open Model Files ↗</a>
          </div>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" disabled={running || !draftView} onClick={() => { setCustomView(draftView); setDraftView(null); }}>Use this perspective</Button>
            <span className="text-xs">{draftView ? 'Camera changed — apply this perspective before starting.' : customView ? 'Custom perspective applied to the batch.' : 'Starting view applied.'}</span>
          </div>
          <p className="text-xs text-muted-foreground">Drag to orbit and scroll to zoom, then choose Use this perspective. The same viewing direction and relative zoom are fitted to each Model.</p>
        </section>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Button type="button" disabled={running || finding || !dimensionsValid || !validLimit || !queue.length || !previewReady || Boolean(draftView)} onClick={() => void run()}>Start batch ({queue.length})</Button>
        {!running && results.some(item => item.status === 'Failed') && <Button type="button" variant="outline" disabled={finding || !dimensionsValid || !validLimit || !previewReady || Boolean(draftView)} onClick={() => void run(results.filter(item => item.status === 'Failed'))}>Retry failed (up to {limit})</Button>}
        {running && <Button type="button" variant="outline" disabled={stopping} onClick={() => { stop.current = true; setStopping(true); }}>{stopping ? 'Stopping after current…' : 'Cancel after current'}</Button>}
      </div>
      <p role="status" className="text-sm">{startReason}</p>
      <p role="status" className="text-sm">{message} {total > 0 && `${results.length}/${total}`}</p>
      <p className="text-xs text-muted-foreground">Keep this window open while processing. Avoid editing previews in another window during a batch.</p>
      <ul className="max-h-48 space-y-1 overflow-y-auto text-xs" aria-label="Batch results">
        {results.map(item => <li key={item.id}><strong>{item.status}</strong> · {item.modelName} (#{item.id}) — {item.message}</li>)}
      </ul>
    </DialogContent>
  </Dialog>;
}
