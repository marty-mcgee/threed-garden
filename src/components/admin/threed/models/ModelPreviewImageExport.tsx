'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { useModelPreviewSize } from '@/components/settings/ModelPreviewSettings';
import { modelForPreview, resolvePreviewRequirements } from './model-preview-requirements';
import { ThreeDModelAssetPreview } from './ThreeDModelAssetPreview';

export function ModelPreviewImageExport({ model, dependencyCount, attachedDependencyCount, onUseImageUrl, disabled = false, useDraftModel = false, onOpenChange, imageTarget = 'thumbnail' }: {
  imageTarget?: 'thumbnail' | 'top-view';
  model: ModelData;
  onOpenChange?: (open: boolean) => void;
  useDraftModel?: boolean;
  onUseImageUrl?: (url: string) => void;
  disabled?: boolean;
  dependencyCount: number;
  attachedDependencyCount: number;
}) {
  const topView = imageTarget === 'top-view';
  const imageLabel = topView ? 'Top View' : 'Library Preview';
  const fileName = `model-${model.id}-${topView ? 'top-view' : 'preview'}.png`;
  const defaults = useModelPreviewSize();
  const [outputSize, setOutputSize] = useState(defaults);
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const uploadedUrl = useRef<string | null>(null);
  const busy = useRef(false);
  const [requirements, setRequirements] = useState<{ total: number; attached: number; textures: number } | null>(null);
  const inspectRequirements = model.id > 0;
  const [captureModel, setCaptureModel] = useState<ModelData>(model);
  useEffect(() => {
    if (!open) return;
    if (!inspectRequirements) { setCaptureModel(model); setError(''); return; }
    const controller = new AbortController();
    setRequirements(null);
    setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/threed/models/files/requirements?modelId=${model.id}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data?.requirements)) throw new Error();
        const detailResponse = await fetch(`/api/threed/models?id=${model.id}`, { signal: controller.signal });
        const detail = await detailResponse.json();
        if (!detailResponse.ok || !detail.success) throw new Error();
        if (!controller.signal.aborted) setCaptureModel(useDraftModel ? model : modelForPreview(detail.data));
        const resolved = resolvePreviewRequirements(detail.data, result.data.requirements);
        if (!controller.signal.aborted) setRequirements({ total: resolved.length,
          attached: resolved.filter(item => item.satisfied).length,
          textures: resolved.filter(item => !item.satisfied && item.kind === 'texture').length });
      } catch {
        if (!controller.signal.aborted) setError('Could not check Model files. Close and reopen Export to retry.');
      }
    })();
    return () => controller.abort();
  }, [open, inspectRequirements, model, useDraftModel]);

  useEffect(() => {
    if (!image) { setImageUrl(''); return; }
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function savePreview() {
    if (!image || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      // Keep the successful upload for retry if assigning the URL fails.
      if (!uploadedUrl.current) {
        const body = new FormData();
        if (topView && model.id < 1) throw new Error('Create the Model before exporting its Top View.');
        if (!topView) body.append('purpose', 'thumbnail');
        body.append('file', image, fileName);
        const response = await fetch(topView ? `/api/threed/models/${model.id}/top-view-image` : '/api/threed/models/upload', { method: 'POST', body });
        const result = await response.json();
        if (!response.ok || !result.success || !result.data?.url) throw new Error('Image upload failed. Please retry.');
        uploadedUrl.current = result.data.url;
      }
      if (onUseImageUrl) {
        onUseImageUrl(uploadedUrl.current!);
        setSaved(true);
        return;
      }
      const response = await fetch(`/api/threed/models?id=${model.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topView ? { imageTopViewUrl: uploadedUrl.current } : { thumbnailUrl: uploadedUrl.current }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(`Image uploaded, but assigning the ${imageLabel} failed. Please retry.`);
      setSaved(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `Could not save the ${imageLabel}.`);
    } finally { busy.current = false; setSaving(false); }
  }

  return <Dialog open={open} onOpenChange={value => { if (!busy.current) { if (value && !image) setOutputSize(defaults); setOpen(value); onOpenChange?.(value); } }}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={disabled || (topView && model.id < 1)}>{topView ? 'Export Top View Image' : 'Export 2D Image'}</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto" showCloseButton={!saving}>
      <DialogTitle>{topView ? 'Export Model Top View' : 'Export Model Preview'}</DialogTitle>
      <DialogDescription>{topView ? 'Capture from directly above. PNG edges match the Model bounds; image up points toward negative Z.' : 'Frame the Model, then capture a transparent PNG.'} {outputSize.width} × {outputSize.height} PNG.</DialogDescription>
      {!image ? (inspectRequirements && !requirements ? <p role="status">Checking Model files…</p> : <ThreeDModelAssetPreview
        unresolvedTextureCount={requirements?.textures ?? 0}
        topViewCapture={topView}
        fixedCaptureCamera={topView}
        outputSize={outputSize}
        model={captureModel}
        dependencyCount={requirements?.total ?? dependencyCount}
        attachedDependencyCount={requirements?.attached ?? attachedDependencyCount}
        canvasClassName="mx-auto aspect-square w-full max-w-[400px]"
        onCaptureImage={value => { setImage(value); setSaved(false); setError(''); uploadedUrl.current = null; }}
      />) : <>
        <img src={imageUrl || undefined} alt={`Captured ${imageLabel}`} width={outputSize.width} height={outputSize.height} className="mx-auto h-auto w-full max-w-[400px] rounded border bg-muted" />
        <p className="text-xs text-muted-foreground">{outputSize.width} × {outputSize.height} PNG · {Math.ceil(image.size / 1024)} KB · Transparent background</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href={imageUrl} download={fileName}>Download PNG</a></Button>
          <Button type="button" disabled={saving || saved} onClick={savePreview}>{saving ? 'Saving…' : saved ? (onUseImageUrl ? 'Added to Form' : `${imageLabel} Saved`) : `Use as ${imageLabel}`}</Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => { setImage(null); setSaved(false); setError(''); }}>Reframe</Button>
        </div>
        <p className="text-xs text-muted-foreground">{onUseImageUrl ? `${useDraftModel ? "Captures the current Model draft." : "Uses saved Model files and materials."} Use as ${imageLabel} fills the form; Save Changes persists it.${topView ? " Upload attaches a Top View File immediately." : ""}` : `Use as ${imageLabel} replaces this Model's current image.`}</p>
        {saved && <p role="status" className="text-sm text-emerald-500">{onUseImageUrl ? 'Preview added to the form. Close this dialog and Save Changes.' : `${imageLabel} Image saved.`}</p>}
      </>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </DialogContent>
  </Dialog>;
}
