'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { MODEL_FILE_TEXTURE_TYPES, MAX_MODEL_FILE_LOAD_ORDER, parseModelFileEdit } from '@/libraries/services/threed/models/model-file-edit-core';
import { normalizeThreeDModelRelativePath } from '@/libraries/services/threed/models/model-companion-core';
import { runtimeModelTypeFromFileName } from '@/libraries/services/threed/models/model-file-integrity';
import { ThreeDModelAssetPreview } from './ThreeDModelAssetPreview';
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
  const base = `/admin/threed/models/${modelId}/files`;
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
  const localFile = pending[candidateIndex]?.file ?? null;
  const imageUrl = useImageUrl(localFile);
  const savedPreview = useMemo(() => {
    if (!model) return null;
    const type = selected?.fileType === 'model' ? runtimeModelTypeFromFileName(selected.fileName) : null;
    return modelForPreview(type && selected?.filePath ? { ...model, modelType: type, filePath: selected.filePath } : model);
  }, [model, selected]);
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
        setMessage('File settings saved.'); setRevision(value => value + 1);
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

  return <div className="space-y-3">
    <AdminWorkspaceHeader icon={FolderOpen} title={fileId ? 'Edit Model File' : 'Add Model Files'} description={model ? `${model.modelName} · Model #${modelId}${selected ? ` · File #${selected.id}` : ''}` : `Model #${modelId}`} />
    <nav aria-label="Model workspace" className="flex flex-wrap gap-4 text-sm"><Link className="underline" href={`/admin/threed/models/${modelId}`}>Edit Model</Link><Link className="underline" href={base}>Model Files</Link><span aria-current="page">{fileId ? `Edit File #${fileId}` : 'Add Files'}</span></nav>
    {loading ? <p role="status">Loading selected Model and File…</p> : loadError ? <p role="alert">{loadError}</p> : model && <>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <ThreeDModelAssetPreview model={savedPreview} preserveCameraOnEdit attachedDependencyCount={audit?.requirements.filter(item => item.satisfied).length ?? 0} dependencyCount={audit?.requirements.length ?? 0}
            title={selected?.fileType === 'model' ? 'Selected File Preview' : 'Parent Model Preview'} description="Saved geometry and resources. Review appearance separately from dependency readiness." showMaterialInspector />
          {localSnapshot && <ThreeDModelImportPreview localSnapshot={localSnapshot} onClose={() => setCandidateIndex(-1)} />}
          {localFile && /\.(glb|gltf|fbx|obj)$/i.test(localFile.name) && !localSnapshot && <p>Local candidate preview supports files up to 4 MiB. This limit does not change the existing upload API.</p>}
        </div>
        <form onSubmit={save} className="min-w-0 space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{selected ? selected.fileName : 'New attachments'}</h2>
          {selected ? <>
            <dl className="space-y-2 break-all text-sm"><div><dt className="font-medium">Saved identity</dt><dd>Model #{modelId} · File #{selected.id} · {selected.fileType}</dd></div><div><dt className="font-medium">Dependency path</dt><dd>{selected.relativePath || selected.fileName}</dd></div><div><dt className="font-medium">URL</dt><dd>{selected.filePath || 'No saved URL'}</dd></div><div><dt className="font-medium">Size</dt><dd>{selected.fileSize ?? 'Unknown'} bytes</dd></div></dl>
            <div><Label htmlFor="file-load-order">Load order</Label><Input id="file-load-order" type="number" min={0} max={MAX_MODEL_FILE_LOAD_ORDER} step={1} required disabled={saving} value={loadOrder} onChange={event => setLoadOrder(event.target.value)} /></div>
            {selected.fileType === 'texture' && <div><Label htmlFor="file-texture-type">Texture type</Label><select id="file-texture-type" className="w-full rounded border bg-background p-2" value={textureType} disabled={saving} onChange={event => setTextureType(event.target.value)}><option value="">Unspecified</option>{MODEL_FILE_TEXTURE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}{textureType && !MODEL_FILE_TEXTURE_TYPES.some(type => type === textureType) && <option value={textureType} disabled>Unsupported saved value: {textureType}</option>}</select><p className="text-xs text-muted-foreground">Attachment classification; this does not change material assignments or the shared Texture record.</p></div>}
          </> : <>
            <div><Label htmlFor="file-directory">Model-relative attachment directory</Label><Input id="file-directory" value={directory} maxLength={100} disabled={saving} onChange={event => setDirectory(event.target.value)} /><p className="text-xs text-muted-foreground">Used for new selections. Review each dependency path below before Save.</p></div>
            <div><Label htmlFor="new-model-files">Choose geometry or supporting files</Label><Input id="new-model-files" type="file" multiple accept=".glb,.gltf,.fbx,.obj,.usdz,.bin,.mtl,image/*" disabled={saving || pending.some(item => item.saved)} onChange={event => chooseFiles(event.target.files)} /></div>
            <p className="text-xs text-muted-foreground">Files stay local until Save. Select GLTF buffers and OBJ material libraries with candidate geometry. Missing images may use preview placeholders; missing geometry/buffers or required MTL can prevent preview. Saved parent resources are not automatically added to the local candidate bundle.</p>
            {pending.map((item, index) => <div key={index} className="space-y-1 rounded border p-2 text-sm"><p className="break-all">{item.file.name} · {item.file.size} bytes · {item.saved ? 'Saved' : 'Local draft'}</p><Label htmlFor={`file-path-${index}`}>Dependency path</Label><Input id={`file-path-${index}`} value={item.relativePath} disabled={saving || item.saved} onChange={event => setPending(current => current.map((entry, i) => i === index ? { ...entry, relativePath: event.target.value } : entry))} /><Button type="button" variant="outline" disabled={saving} onClick={() => setCandidateIndex(index)}>Inspect / preview</Button>{item.error && <p role="alert">{item.error}</p>}</div>)}
          </>}
          {(imageUrl || selected?.fileType === 'texture' && /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(selected.fileName) && selected.filePath) && <img className="max-h-64 max-w-full rounded border object-contain" src={imageUrl || selected!.filePath} alt={localFile?.name || selected?.fileName || 'Supporting image'} />}
          <ModelFileDependencyInspector file={localFile} savedFile={selected} audit={audit} />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status">{message}</p>}
          <div className="flex gap-2"><Button type="submit" disabled={saving || loading || !selected && !pending.some(item => !item.saved)}>{saving ? 'Saving…' : selected ? 'Save File settings' : 'Save attachments'}</Button><Button type="button" variant="outline" disabled={saving} onClick={() => router.push(base)}>Cancel</Button></div>
          {!selected && <p className="text-xs text-muted-foreground">Cancel discards local selections. Successfully saved attachments remain saved after partial upload failure.</p>}
        </form>
      </div>
      {textureLibraryError && <p role="alert">{textureLibraryError}</p>}
      <ModelResourceInventory model={model} audit={audit} loading={auditLoading} error={auditError} textureLibrary={textureLibrary} />
    </>}
  </div>;
}
