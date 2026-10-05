'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, FolderOpen } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { MODEL_FILE_TEXTURE_TYPES, MAX_MODEL_FILE_LOAD_ORDER, parseModelFileEdit } from '@/libraries/services/threed/models/model-file-edit-core';
import { normalizeThreeDModelRelativePath } from '@/libraries/services/threed/models/model-companion-core';
import { runtimeModelTypeFromFileName } from '@/libraries/services/threed/models/model-file-integrity';
import type { EligibilityResult } from '@/libraries/services/threed/models/model-file-restoration-eligibility-core';
import { ThreeDModelAssetPreview, type PreviewPerspective } from './ThreeDModelAssetPreview';
import { ThreeDModelImportPreview } from './ThreeDModelImportPreview';
import { modelForPreview } from './model-preview-requirements';
import { ModelResourceInventory, type ModelResourceAudit } from './ModelResourceInventory';
import type { BulkModelPreviewSnapshot } from './model-bulk-preview-window';
import { ModelFileDependencyInspector } from './ModelFileDependencyInspector';

interface SavedFile {
  id: number; userId: string | null; modelId: number | null; fileName: string; relativePath: string;
  fileType: string; textureType: string | null; filePath: string; fileSize: number | null; loadOrder: number | null;
}
interface ParentModel extends ModelData { userId: string; mainModelFileId: number | null; files: SavedFile[] }
interface PendingFile { file: File; relativePath: string; saved: boolean; error?: string }

const FILE_PREVIEW_PERSPECTIVE: PreviewPerspective = { direction: [4, 2, 6], distanceScale: 1 };

function formatFileSize(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KiB` : `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function isEligibilityResult(value: unknown, modelId: number, fileId: number): value is EligibilityResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  const findings = (items: unknown) => Array.isArray(items) && items.every(item => item && typeof item === 'object'
    && typeof item.code === 'string' && typeof item.message === 'string');
  const checks = result.checks && typeof result.checks === 'object' ? result.checks as Record<string, unknown> : null;
  return result.modelId === modelId && result.fileId === fileId && result.restoreAllowed === false
    && result.candidateValidation === 'not_performed'
    && typeof result.state === 'string' && ['observed_candidate', 'blocked', 'unknown', 'stale'].includes(result.state)
    && typeof result.availability === 'string' && ['missing', 'present', 'unknown'].includes(result.availability)
    && typeof result.observedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(result.observedAt)
    && Number.isFinite(Date.parse(result.observedAt)) && (result.revision === null || typeof result.revision === 'string')
    && !!checks && ['target', 'references', 'storage', 'dependencies'].every(key => typeof checks[key] === 'string'
      && ['clear', 'blocked', 'unknown', 'not_checked'].includes(checks[key]))
    && typeof checks.consistency === 'string' && ['unchanged', 'stale', 'unknown', 'not_checked'].includes(checks.consistency)
    && findings(result.blockers) && findings(result.uncertainty);
}

const ELIGIBILITY_STATE_LABELS = { observed_candidate: 'Observed candidate', blocked: 'Blocked', unknown: 'Unknown', stale: 'Stale' } as const;
const AVAILABILITY_LABELS = { missing: 'Missing (observed)', present: 'Present (observed)', unknown: 'Unknown' } as const;

function useImageUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name)) { setUrl(null); return; }
    const current = URL.createObjectURL(file); setUrl(current);
    return () => URL.revokeObjectURL(current);
  }, [file]);
  return url;
}

export function ThreeDModelFileEditor({ modelId, fileId = null }: { modelId: number; fileId?: number | null }) {
  const router = useRouter();
  const base = `/admin/threed/models/${modelId}?tab=files`;
  const [model, setModel] = useState<ParentModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadOrder, setLoadOrder] = useState('0');
  const [textureType, setTextureType] = useState('');
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [directory, setDirectory] = useState('textures');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [audit, setAudit] = useState<ModelResourceAudit | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [textureLibrary, setTextureLibrary] = useState<Array<{ id: number; filePath: string; textureName: string }>>([]);
  const [textureLibraryError, setTextureLibraryError] = useState('');
  const eligibilityContext = `${modelId}:${fileId ?? 'new'}:${revision}`;
  const currentEligibilityContext = useRef(eligibilityContext);
  currentEligibilityContext.current = eligibilityContext;
  const eligibilityController = useRef<AbortController | null>(null);
  const eligibilityRequest = useRef(0);
  const [eligibility, setEligibility] = useState<{ context: string; result: EligibilityResult } | null>(null);
  const [eligibilityError, setEligibilityError] = useState<{ context: string; message: string } | null>(null);
  const [eligibilityChecking, setEligibilityChecking] = useState<string | null>(null);

  const clearEligibility = () => {
    eligibilityController.current?.abort(); eligibilityController.current = null; eligibilityRequest.current++;
    setEligibility(null); setEligibilityError(null); setEligibilityChecking(null);
  };

  useEffect(() => {
    eligibilityController.current?.abort(); eligibilityController.current = null; eligibilityRequest.current++;
    setEligibility(null); setEligibilityError(null); setEligibilityChecking(null);
    return () => { eligibilityController.current?.abort(); eligibilityController.current = null; eligibilityRequest.current++; };
  }, [eligibilityContext]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/threed/model-textures', { cache: 'no-store', signal: controller.signal })
      .then(async response => { const result = await response.json(); if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Shared Texture links could not be inspected.'); return result.data; })
      .then(value => { if (!controller.signal.aborted) setTextureLibrary(value); })
      .catch(() => { if (!controller.signal.aborted) setTextureLibraryError('Shared Texture attachment links could not be inspected. Saved material assignments remain listed.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    void (async () => {
      try {
        const response = await fetch(`/api/threed/models?id=${modelId}`, { cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success || result.data?.id !== modelId || typeof result.data.userId !== 'string') throw new Error('This Model is unavailable in your Admin workspace.');
        const parent = result.data as ParentModel;
        const selected = fileId === null ? null : parent.files.find(file => file.id === fileId && file.modelId === modelId && file.userId === parent.userId);
        if (fileId !== null && !selected) throw new Error('This File does not belong to the selected owned Model.');
        if (controller.signal.aborted) return;
        setModel(parent);
        if (selected) { setLoadOrder(String(selected.loadOrder ?? 0)); setTextureType(selected.textureType ?? ''); }
      } catch (cause) { if (!controller.signal.aborted) { setModel(null); setLoadError(cause instanceof Error ? cause.message : 'Unable to load Model'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [modelId, fileId, revision]);

  useEffect(() => {
    const controller = new AbortController(); setAuditLoading(true); setAudit(null); setAuditError(null);
    void fetch(`/api/threed/models/files/requirements?modelId=${modelId}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'Dependency inspection unavailable'); return result.data as ModelResourceAudit; })
      .then(value => { if (!controller.signal.aborted) setAudit(value); })
      .catch(cause => { if (!controller.signal.aborted) setAuditError(cause instanceof Error ? cause.message : 'Dependency inspection unavailable'); })
      .finally(() => { if (!controller.signal.aborted) setAuditLoading(false); });
    return () => controller.abort();
  }, [modelId, revision]);

  const selected = model?.files.find(file => file.id === fileId) ?? null;
  const selectedIsPrimary = Boolean(selected && selected.id === model?.mainModelFileId);
  const selectedPreviewType = selected?.fileType === 'model' ? runtimeModelTypeFromFileName(selected.fileName) : null;
  const selectedRole = selected?.fileType === 'model' ? selectedIsPrimary ? 'Primary geometry' : 'Alternate geometry' : 'Supporting attachment';
  const previewUsesPrimary = !(selectedPreviewType && selected?.filePath) || selectedIsPrimary;
  const eligibilityResult = eligibility?.context === eligibilityContext ? eligibility.result : null;
  const eligibilityFailure = eligibilityError?.context === eligibilityContext ? eligibilityError.message : null;
  const checkingEligibility = eligibilityChecking === eligibilityContext;

  const checkEligibility = async () => {
    if (!selected || selected.id !== fileId || model?.id !== modelId || loading || saving) return;
    clearEligibility();
    const controller = new AbortController(); eligibilityController.current = controller;
    const request = ++eligibilityRequest.current;
    const context = eligibilityContext;
    const isCurrent = () => !controller.signal.aborted && eligibilityRequest.current === request
      && currentEligibilityContext.current === context;
    setEligibilityChecking(context);
    try {
      const response = await fetch(`/api/threed/models/${modelId}/files/${selected.id}/restoration-eligibility`, {
        method: 'GET', cache: 'no-store', signal: controller.signal,
      });
      const result = await response.json();
      if (!isCurrent()) return;
      if (!response.ok || !result.success) {
        const message = response.status === 401 ? 'Sign in before checking this File.'
          : response.status === 404 ? 'This File is unavailable in the selected owned Model.'
          : 'Inspection could not be completed. Availability and eligibility remain unknown; check again manually.';
        setEligibilityError({ context, message }); return;
      }
      if (result.restoreAllowed !== false || !isEligibilityResult(result.data, modelId, selected.id)) {
        setEligibilityError({ context, message: 'Inspection returned an incomplete or mismatched observation. Availability and eligibility remain unknown; check again manually.' });
        return;
      }
      setEligibility({ context, result: result.data });
    } catch {
      if (isCurrent()) setEligibilityError({ context, message: 'Inspection could not be completed. Availability and eligibility remain unknown; check again manually.' });
    } finally {
      if (isCurrent()) { eligibilityController.current = null; setEligibilityChecking(null); }
    }
  };
  const localFile = pending[candidateIndex]?.file ?? null;
  const imageUrl = useImageUrl(localFile);
  const savedPreview = useMemo(() => {
    if (!model) return null;
    return modelForPreview(selectedPreviewType && selected?.filePath ? { ...model, modelType: selectedPreviewType, filePath: selected.filePath, metadata: { ...(model.metadata as Record<string, unknown> ?? {}), activeSource: 'model' } } : model);
  }, [model, selected, selectedPreviewType]);
  const localSnapshot = useMemo<BulkModelPreviewSnapshot | null>(() => {
    if (!model || !localFile || !/\.(glb|gltf|fbx|obj)$/i.test(localFile.name) || localFile.size > 4 * 1024 * 1024) return null;
    const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    return { file: localFile, modelName: `${model.modelName} · candidate ${localFile.name}`,
      attachments: pending.filter(item => item.file !== localFile && !/\.(glb|gltf|fbx|obj|usdz)$/i.test(item.file.name)).map(item => ({ file: item.file, relativePath: item.relativePath })),
      scale: Math.max(0.01, number(model.scale, 1)), rotationY: number(model.rotationY),
      offsetX: number(model.offsetX), offsetY: number(model.offsetY), offsetZ: number(model.offsetZ),
      existingTextureId: null, missingTexturePaths: [] };
  }, [model, localFile, pending]);

  const chooseFiles = (files: FileList | null) => {
    if (!files) return;
    setPending(Array.from(files).map(file => ({ file, relativePath: `${directory}/${file.webkitRelativePath || file.name}`, saved: false })));
    setCandidateIndex(0); setError(''); setMessage('');
  };

  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!model || saving) return;
    clearEligibility();
    setError(''); setMessage('');
    if (selected) {
      let updates: ReturnType<typeof parseModelFileEdit>;
      try { updates = parseModelFileEdit({ loadOrder: loadOrder.trim() ? Number(loadOrder) : NaN,
        ...(selected.fileType === 'texture' ? { textureType: textureType || null } : {}) }); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid settings'); return; }
      setSaving(true);
      try {
        const response = await fetch(`/api/threed/models/${modelId}/files/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'File settings could not be saved');
        router.push(base);
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'File settings could not be saved'); }
      finally { setSaving(false); }
      return;
    }
    const unsaved = pending.filter(item => !item.saved);
    if (!unsaved.length) { setError('Choose files before saving.'); return; }
    const paths = pending.map(item => normalizeThreeDModelRelativePath(item.relativePath));
    if (paths.some((path, index) => !path || path !== pending[index].relativePath || !path.includes('/')
      || path.split('/').slice(0, -1).join('/').length > 100 || path.split('/').at(-1) !== pending[index].file.name)
      || new Set(paths.map(path => path?.toLowerCase())).size !== paths.length) {
      setError('Use unique Model-relative paths with a directory up to 100 characters and the original filename.'); return;
    }
    // Stage 2 adds resources only; existing attachment identities are not replaced.
    if (unsaved.some(item => model.files.some(file => (file.relativePath || file.fileName).toLowerCase() === item.relativePath.toLowerCase()))) {
      setError('An attachment already uses a selected path. Replacement is deferred; choose another path.'); return;
    }
    setSaving(true);
    let failures = 0;
    for (const item of unsaved) {
      try {
        const body = new FormData(); body.append('modelId', String(modelId)); body.append('files', item.file); body.append('relativePaths', item.relativePath);
        const response = await fetch('/api/threed/models/files', { method: 'POST', body });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Upload failed');
        setPending(current => current.map(entry => entry.file === item.file ? { ...entry, saved: true, error: undefined } : entry));
      } catch (cause) {
        failures++;
        setPending(current => current.map(entry => entry.file === item.file ? { ...entry, error: cause instanceof Error ? cause.message : 'Upload failed' } : entry));
      }
    }
    setSaving(false);
    if (failures) { setError(`${failures} upload(s) failed. Successful uploads remain saved; retry sends only failed files.`); setRevision(value => value + 1); }
    else router.push(base);
  };

  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
    <AdminWorkspaceHeader className="shrink-0" icon={FolderOpen} title={fileId ? 'Edit Model File' : 'Add Model Files'} description={model ? `${model.modelName} · Model #${modelId}${selected ? ` · File #${selected.id}` : ''}` : `Model #${modelId}`}>
      <nav aria-label="Model workspace" className="ml-auto flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm" className="h-7 gap-1.5 text-xs"><Link href={`/admin/threed/models/${modelId}`}><ArrowLeft className="h-3.5 w-3.5" />Edit Model</Link></Button>
        <Button asChild variant="outline" size="sm" className="h-7 gap-1.5 text-xs"><Link href={base}><FolderOpen className="h-3.5 w-3.5" />Model Files</Link></Button>
      </nav>
    </AdminWorkspaceHeader>
    <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="min-w-0 truncate font-medium text-foreground">{model?.modelName || `Model #${modelId}`}</span>
      <span>Model #{modelId}</span>
      <Badge variant="outline" aria-current="page">{fileId ? `File #${fileId}` : 'New attachments'}</Badge>
      {selected && <Badge variant="secondary">{selectedRole}</Badge>}
    </div>
    {loading ? <p role="status" className="rounded-lg border admin-editor-panel p-4 text-sm">Loading selected Model and File…</p> : loadError ? <p role="alert" className="rounded-lg border admin-editor-panel p-4 text-sm text-destructive">{loadError}</p> : model && <>
      <div className="grid min-h-0 min-w-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
        <section aria-label="Preview and saved appearance" tabIndex={0} className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:pr-1">
          <ThreeDModelAssetPreview model={savedPreview} preserveCameraOnEdit centerAtOrigin perspective={FILE_PREVIEW_PERSPECTIVE}
            attachedDependencyCount={previewUsesPrimary ? audit?.requirements.filter(item => item.satisfied).length ?? 0 : 0}
            dependencyCount={previewUsesPrimary ? audit?.requirements.length ?? 0 : 0}
            canvasClassName="h-[clamp(16rem,42dvh,30rem)]"
            title={selectedPreviewType && selected?.filePath ? 'Selected File Preview' : 'Parent Model Preview'}
            description="Drag to orbit, scroll to zoom. Reset returns to the initial three-quarter view."
            showMaterialInspector materialInspectorReadOnly />
          {selected?.fileType === 'model' && !selectedIsPrimary && <p className="rounded-lg border admin-editor-panel p-3 text-xs text-muted-foreground">{selectedPreviewType && selected.filePath ? `Previewing File #${selected.id}.` : 'Selected geometry has no supported preview source; showing the parent Model.'} The primary geometry and its dependency check are listed in the parent Model resources; this preview does not change the primary file.</p>}
          {localSnapshot && <ThreeDModelImportPreview localSnapshot={localSnapshot} onClose={() => setCandidateIndex(-1)} />}
          {localFile && /\.(glb|gltf|fbx|obj)$/i.test(localFile.name) && !localSnapshot && <p>Local candidate preview supports files up to 4 MiB. This limit does not change the existing upload API.</p>}
        </section>
        <form id="model-file-settings" onSubmit={save} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border admin-editor-panel">
          <div aria-label="File details and parent resources" tabIndex={0} className="min-w-0 space-y-4 p-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="flex min-w-0 items-start gap-2 border-b pb-3"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" /><div className="min-w-0"><h2 className="break-words text-sm font-semibold">{selected ? selected.fileName : 'New attachments'}</h2><p className="mt-1 text-xs text-muted-foreground">{selected ? 'Edit this saved File’s settings. Appearance is managed on the parent Model.' : 'Choose local resources for this Model, then save the attachments.'}</p></div></div>
          {selected ? <>
            <dl className="grid grid-cols-2 gap-3 rounded-md border admin-editor-panel p-3 text-xs"><div><dt className="text-muted-foreground">File type</dt><dd className="mt-1 font-medium">{selected.fileType}</dd></div><div><dt className="text-muted-foreground">Size</dt><dd className="mt-1 font-medium" title={selected.fileSize === null ? undefined : `${selected.fileSize} bytes`}>{formatFileSize(selected.fileSize)}</dd></div><div className="col-span-2 min-w-0"><dt className="text-muted-foreground">Dependency path</dt><dd className="mt-1 break-all font-mono">{selected.relativePath || selected.fileName}</dd></div></dl>
            <details className="rounded-md border p-3 text-xs"><summary className="cursor-pointer font-medium">File location</summary><Label htmlFor="file-source-url" className="mt-3 block text-xs text-muted-foreground">Saved source URL</Label><Input id="file-source-url" className="mt-1 font-mono text-xs" readOnly value={selected.filePath || 'No saved URL'} /></details>
            <div className="space-y-1.5"><Label htmlFor="file-load-order" className="text-xs">Load order</Label><Input id="file-load-order" type="number" min={0} max={MAX_MODEL_FILE_LOAD_ORDER} step={1} required disabled={saving} value={loadOrder} onChange={event => setLoadOrder(event.target.value)} /><p className="text-xs text-muted-foreground">Saved ordering for this attachment. This does not choose the primary geometry.</p></div>
            {selected.fileType === 'texture' && <div><Label htmlFor="file-texture-type">Texture type</Label><select id="file-texture-type" className="w-full rounded border bg-background p-2" value={textureType} disabled={saving} onChange={event => setTextureType(event.target.value)}><option value="">Unspecified</option>{MODEL_FILE_TEXTURE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}{textureType && !MODEL_FILE_TEXTURE_TYPES.some(type => type === textureType) && <option value={textureType} disabled>Unsupported saved value: {textureType}</option>}</select><p className="text-xs text-muted-foreground">Attachment classification; this does not change material assignments or the shared Texture record.</p></div>}
          </> : <>
            <div><Label htmlFor="file-directory">Model-relative attachment directory</Label><Input id="file-directory" value={directory} maxLength={100} disabled={saving} onChange={event => setDirectory(event.target.value)} /><p className="text-xs text-muted-foreground">Used for new selections. Review each dependency path below before Save.</p></div>
            <div><Label htmlFor="new-model-files">Choose geometry or supporting files</Label><Input id="new-model-files" type="file" multiple accept=".glb,.gltf,.fbx,.obj,.usdz,.bin,.mtl,image/*" disabled={saving || pending.some(item => item.saved)} onChange={event => chooseFiles(event.target.files)} /></div>
            <p className="text-xs text-muted-foreground">Files stay local until Save. Select GLTF buffers and OBJ material libraries with candidate geometry. Missing images may use preview placeholders; missing geometry/buffers or required MTL can prevent preview. Saved parent resources are not automatically added to the local candidate bundle.</p>
            {pending.map((item, index) => <div key={index} className="space-y-1 rounded border p-2 text-sm"><p className="break-all">{item.file.name} · {item.file.size} bytes · {item.saved ? 'Saved' : 'Local draft'}</p><Label htmlFor={`file-path-${index}`}>Dependency path</Label><Input id={`file-path-${index}`} value={item.relativePath} disabled={saving || item.saved} onChange={event => setPending(current => current.map((entry, i) => i === index ? { ...entry, relativePath: event.target.value } : entry))} /><Button type="button" variant="outline" disabled={saving} onClick={() => setCandidateIndex(index)}>Inspect / preview</Button>{item.error && <p role="alert">{item.error}</p>}</div>)}
          </>}
          {(imageUrl || selected?.fileType === 'texture' && /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(selected.fileName) && selected.filePath) && <img className="max-h-64 max-w-full rounded border object-contain" src={imageUrl || selected!.filePath} alt={localFile?.name || selected?.fileName || 'Supporting image'} />}
          <ModelFileDependencyInspector file={localFile} savedFile={selected} audit={audit} />
          {selected && <details className="space-y-3 rounded-md border p-3 text-xs">
            <summary className="cursor-pointer font-medium">Read-only restoration diagnostics</summary>
            <p className="text-muted-foreground">Read-only observations for this saved File. They cannot authorize restoration or guarantee safety. No replacement image or file has been checked.</p>
            <Button type="button" size="sm" variant="outline" disabled={saving || loading || checkingEligibility} onClick={() => void checkEligibility()}>Check restoration eligibility</Button>
            {checkingEligibility && <p role="status">Checking saved File observations…</p>}
            {(eligibilityResult || eligibilityFailure) && <div aria-live="polite" className="space-y-3">
              <dl className="space-y-1"><div><dt className="font-medium">State</dt><dd>{eligibilityResult ? ELIGIBILITY_STATE_LABELS[eligibilityResult.state] : 'Unknown'}</dd></div><div><dt className="font-medium">Storage availability</dt><dd>{eligibilityResult ? AVAILABILITY_LABELS[eligibilityResult.availability] : 'Unknown'}</dd></div><div><dt className="font-medium">Observed at</dt><dd>{eligibilityResult ? <time dateTime={eligibilityResult.observedAt}>{eligibilityResult.observedAt}</time> : 'Unavailable'}</dd></div></dl>
              {eligibilityFailure && <p role="alert">{eligibilityFailure}</p>}
              {eligibilityResult && <>
                <div><h4 className="font-medium">Blockers</h4>{eligibilityResult.blockers.length ? <ul className="list-disc space-y-1 pl-5">{eligibilityResult.blockers.map((finding, index) => <li key={`${finding.code}-${index}`}>{finding.message}</li>)}</ul> : <p>No blockers reported.</p>}</div>
                <div><h4 className="font-medium">Uncertainty and limits</h4>{eligibilityResult.uncertainty.length ? <ul className="list-disc space-y-1 pl-5">{eligibilityResult.uncertainty.map((finding, index) => <li key={`${finding.code}-${index}`}>{finding.message}</li>)}</ul> : <p>No additional uncertainty reported.</p>}</div>
                <p className="text-muted-foreground">Storage and references can change after this observation. Check again manually for a new observation. Restoration remains unavailable.</p>
              </>}
            </div>}
          </details>}
          {textureLibraryError && <p role="alert" className="text-xs text-destructive">{textureLibraryError}</p>}
          <ModelResourceInventory model={model} selectedFileId={selected?.id} audit={audit} loading={auditLoading} error={auditError} textureLibrary={textureLibrary} />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status">{message}</p>}
          {!selected && <p className="text-xs text-muted-foreground">Cancel discards local selections. Successfully saved attachments remain saved after partial upload failure.</p>}
          </div>
        </form>
      </div>
      <div className="admin-editor-actions rounded-lg border admin-editor-panel p-2"><Button type="submit" form="model-file-settings" variant="success" size="sm" disabled={saving || loading || !selected && !pending.some(item => !item.saved)}>{saving ? 'Saving…' : selected ? 'Save File settings' : 'Save attachments'}</Button><Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => { clearEligibility(); router.push(base); }}>Cancel</Button></div>
    </>}
  </div>;
}
