'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Images, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ThreeDModelEmbeddedImage } from '@/libraries/services/threed/models/model-embedded-images-core';
import { ModelFieldHelp } from './ModelFieldHelp';
import { useEmbeddedModelImages, type EmbeddedImageSource } from './use-embedded-model-images';
import { createEmbeddedImageZip, downloadEmbeddedBytes } from './embedded-image-downloads';

type GeometryFile = { id: number; fileName: string };
type SavedImage = { textureId: number; fileId: number; relativePath: string; reused: boolean };
const canRegister = (image: ThreeDModelEmbeddedImage) => image.source.kind !== 'external' && image.previewSupported
  && ['image/png', 'image/jpeg', 'image/webp'].includes(image.mimeType) && !!image.byteSize && image.byteSize <= 4 * 1024 * 1024;

function EmbeddedImagePreview({ image, source, allowPreview = true }: { image: ThreeDModelEmbeddedImage; source: EmbeddedImageSource; allowPreview?: boolean }) {
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    setUrl(''); setError('');
    if (!allowPreview || !image.previewSupported || !source.extract) return;
    let objectUrl = '';
    try {
      const data = source.extract(image.index);
      objectUrl = URL.createObjectURL(new Blob([new Uint8Array(data.bytes)], { type: data.mimeType }));
      setUrl(objectUrl);
    } catch { setError('Preview unavailable.'); }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [image, source, allowPreview]);
  return <div className="flex aspect-video items-center justify-center overflow-hidden rounded border bg-muted/20">
    {url && !error && allowPreview ? <img src={url} alt={image.name} className="h-full w-full object-contain" onError={() => setError('This image could not be displayed.')} />
      : <span className="p-3 text-center text-xs text-muted-foreground">{error || (image.source.kind === 'external' ? 'External image; not extracted' : !allowPreview ? 'Preview limit reached. Download to inspect.' : image.previewSupported ? 'Loading image…' : 'Download available; preview unsupported')}</span>}
  </div>;
}

function EmbeddedImageGallery({ modelId, file, disabled, onBusyChange, onRegistered }: {
  modelId: number; file: GeometryFile; disabled: boolean;
  onBusyChange?: (busy: boolean) => void; onRegistered?: () => Promise<void>;
}) {
  const [revision, setRevision] = useState(0);
  const { source, loading, error, supported } = useEmbeddedModelImages(modelId, file.id, file.fileName, revision);
  const [search, setSearch] = useState(''), [material, setMaterial] = useState(''), [channel, setChannel] = useState('');
  const [page, setPage] = useState(0), [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false), [notice, setNotice] = useState('');
  const [saved, setSaved] = useState<Record<number, SavedImage>>({}), [failures, setFailures] = useState<Record<number, string>>({});
  const lock = useRef(false);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);
  const images = source?.catalog.images ?? [];
  const materials = useMemo(() => [...new Map(images.flatMap(image => image.usages.map(use => [use.materialIndex, use.materialName] as const))).entries()].sort((a, b) => a[0] - b[0]), [images]);
  const channels = useMemo(() => [...new Set(images.flatMap(image => image.usages.map(use => use.channel)))].sort(), [images]);
  const filtered = images.filter(image => (!search || `${image.name} ${image.fileName}`.toLowerCase().includes(search.toLowerCase()))
    && ((!material && !channel) || image.usages.some(use => (!material || String(use.materialIndex) === material) && (!channel || use.channel === channel))));
  const visible = filtered.slice(page * 6, (page + 1) * 6), pages = Math.max(1, Math.ceil(filtered.length / 6));
  const previewImages = new Set<number>();
  let previewPixels = 0, previewBytes = 0;
  for (const image of visible) {
    const pixels = (image.width ?? 0) * (image.height ?? 0), bytes = image.byteSize ?? 0;
    if (image.previewSupported && previewPixels + pixels <= 16_777_216 && previewBytes + bytes <= 16 * 1024 * 1024) {
      previewImages.add(image.index); previewPixels += pixels; previewBytes += bytes;
    }
  }
  const chosen = images.filter(image => selected.has(image.index) && image.source.kind !== 'external');
  const toRegister = chosen.filter(image => canRegister(image) && !saved[image.index]);
  useEffect(() => { setPage(value => Math.min(value, pages - 1)); }, [pages]);
  const blocked = disabled || busy;

  function download(imagesToSave: ThreeDModelEmbeddedImage[], zip: boolean) {
    if (!source?.extract || lock.current) return;
    try {
      // Shared bufferViews may refer to the same bytes hundreds of times. Bound
      // the requested output before copying any image, not after ZIP allocation.
      if (imagesToSave.reduce((sum, image) => sum + (image.byteSize ?? 0), 0) > 32 * 1024 * 1024) throw new Error('Choose images totalling no more than 32 MB per download.');
      const entries = imagesToSave.map(image => ({ name: image.fileName, bytes: source.extract!(image.index).bytes }));
      if (zip) downloadEmbeddedBytes(createEmbeddedImageZip(entries), 'application/zip', `model-${modelId}-file-${file.id}-images.zip`);
      else if (entries.length) downloadEmbeddedBytes(entries[0].bytes, imagesToSave[0].mimeType, entries[0].name);
      setNotice('Download prepared from the original embedded bytes.');
    } catch (failure) { setNotice(failure instanceof Error ? failure.message : 'Download could not be prepared.'); }
  }

  async function register() {
    if (lock.current || !source || !toRegister.length) return;
    lock.current = true; setBusy(true); setConfirm(false); setNotice('');
    let completed = 0;
    try {
      for (const image of toRegister) {
        try {
          const response = await fetch(`/api/threed/models/${modelId}/embedded-images/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: file.id, imageIndex: image.index, sourceStamp: source.sourceStamp }),
            signal: AbortSignal.timeout(60_000),
          });
          const result = await response.json();
          if (!response.ok || !result.success || !Number.isSafeInteger(result.data?.textureId) || result.data.textureId < 1
            || !Number.isSafeInteger(result.data?.fileId) || result.data.fileId < 1 || typeof result.data.relativePath !== 'string') throw new Error(result.error || 'Save was not confirmed. Reload before retrying.');
          setSaved(current => ({ ...current, [image.index]: result.data }));
          setFailures(current => { const next = { ...current }; delete next[image.index]; return next; });
          completed++;
        } catch (failure) {
          setFailures(current => ({ ...current, [image.index]: failure instanceof Error ? failure.message : 'Save was not confirmed.' }));
          // A changed source invalidates the remainder of this reviewed selection.
          break;
        }
      }
      setNotice(`${completed} of ${toRegister.length} selected images saved. Original embedded images and material assignments are retained.`);
      if (completed) await onRegistered?.();
    } catch { setNotice('Images were saved, but the Model list could not be refreshed. Reload to review the saved records.'); }
    finally { lock.current = false; setBusy(false); }
  }

  if (!supported) return <p className="text-xs text-muted-foreground">Individual embedded-image inspection currently supports saved GLB and GLTF geometry. Other formats retain their existing preview and attachment tools.</p>;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <Input aria-label="Search embedded images" placeholder="Find an embedded image…" className="h-7 min-w-40 flex-1 text-xs" disabled={blocked} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} />
      <label className="text-xs">Material <select aria-label="Filter embedded images by source material" className="h-7 max-w-64 rounded border bg-background px-2" disabled={blocked} value={material} onChange={event => { setMaterial(event.target.value); setPage(0); }}><option value="">All materials</option>{materials.map(([index, name]) => <option key={index} value={index}>{name} (#{index + 1})</option>)}</select></label>
      <label className="text-xs">Channel <select aria-label="Filter embedded images by channel" className="h-7 max-w-48 rounded border bg-background px-2" disabled={blocked} value={channel} onChange={event => { setChannel(event.target.value); setPage(0); }}><option value="">All channels</option>{channels.map(value => <option key={value}>{value}</option>)}</select></label>
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={blocked || loading} onClick={() => { setSelected(new Set()); setSaved({}); setFailures({}); setRevision(value => value + 1); }}><RefreshCw className="h-3 w-3" />Reload images</Button>
    </div>
    {loading ? <p role="status">Inspecting embedded images…</p> : error ? <p role="alert" className="text-destructive">{error}</p> : source && <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span>{source.catalog.embeddedImages} embedded · {source.catalog.externalImages} external · {selected.size} selected</span>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={blocked || !visible.some(image => image.source.kind !== 'external')} onClick={() => setSelected(current => new Set([...current, ...visible.filter(image => image.source.kind !== 'external').map(image => image.index)]))}>Select page</Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" disabled={blocked || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={blocked || !chosen.length} onClick={() => download(chosen, true)}><Download className="h-3 w-3" />Download selected ZIP</Button>
        <Button type="button" size="sm" className="h-7 text-xs" disabled={blocked || !toRegister.length} onClick={() => setConfirm(true)}>Save selected as Textures ({toRegister.length})</Button>
      </div>
      {!images.length ? <p className="text-muted-foreground">No image resources are declared in this geometry File.</p> : !visible.length ? <p>No embedded images match these filters.</p> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map(image => <article key={`${source.sourceStamp}:${image.index}`} className="min-w-0 space-y-2 rounded-lg border bg-background/30 p-2.5">
          <label className="flex min-w-0 items-start gap-2 text-xs font-medium"><input type="checkbox" className="mt-0.5" aria-label={`Select embedded image ${image.index + 1}`} checked={selected.has(image.index)} disabled={blocked || image.source.kind === 'external'} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(image.index); else next.delete(image.index); return next; })} /><span className="break-all">{image.name} <span className="text-muted-foreground">#{image.index + 1}</span></span></label>
          <EmbeddedImagePreview image={image} source={source} allowPreview={previewImages.has(image.index)} />
          <p className="text-[11px] text-muted-foreground">{image.mimeType} · {image.width && image.height ? `${image.width} × ${image.height}` : 'Dimensions unavailable'} · {image.byteSize === null ? 'External bytes' : `${Math.ceil(image.byteSize / 1024)} KB`} · {image.source.kind === 'external' ? 'External' : 'Embedded'}</p>
          <div className="flex flex-wrap gap-1" aria-label={`Material uses for embedded image ${image.index + 1}`}>
            {image.usages.length ? image.usages.map((use, index) => <button type="button" key={index} disabled={blocked} className="rounded border px-1.5 py-1 text-left text-[10px] text-primary hover:bg-accent" title={use.texturePath} onClick={() => { setMaterial(String(use.materialIndex)); setChannel(use.channel); setPage(0); }}>{use.materialName} (#{use.materialIndex + 1}) · {use.channel}</button>) : <span className="text-[11px] text-muted-foreground">No declared material use</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={blocked || image.source.kind === 'external'} onClick={() => download([image], false)}>Download image</Button>
            {saved[image.index] ? <><a className="text-xs text-primary underline" href={`/admin/threed/models/${modelId}/files/${saved[image.index].fileId}`}>Model File #{saved[image.index].fileId}</a><a className="text-xs text-primary underline" href={`/admin/threed/model-textures?search=${encodeURIComponent(saved[image.index].relativePath.split('/').at(-1) ?? '')}`}>Texture Library · #{saved[image.index].textureId}</a></> : !canRegister(image) && image.source.kind !== 'external' && <span className="text-[10px] text-muted-foreground">Download only</span>}
          </div>
          {failures[image.index] && <p role="alert" className="text-xs text-destructive">{failures[image.index]}</p>}
        </article>)}
      </div>}
      <nav aria-label="Embedded images pages" className="flex items-center justify-end gap-2 text-xs"><Button type="button" variant="outline" size="sm" disabled={blocked || page === 0} onClick={() => setPage(value => value - 1)}>Previous</Button><span>Page {page + 1} of {pages}</span><Button type="button" variant="outline" size="sm" disabled={blocked || page + 1 >= pages} onClick={() => setPage(value => value + 1)}>Next</Button></nav>
    </>}
    {notice && <p role="status" className="text-xs">{notice}</p>}
    <Dialog open={confirm} onOpenChange={value => { if (!lock.current) setConfirm(value); }}><DialogContent><DialogTitle>Save {toRegister.length} embedded images as Textures?</DialogTitle><DialogDescription>Each selected supported image creates a reusable Texture and a linked File on this Model. Existing saved copies are reused. The original geometry and its material assignments are retained. PNG, JPEG and WebP images up to 4 MB are eligible.</DialogDescription><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setConfirm(false)}>Cancel</Button><Button type="button" onClick={register} disabled={blocked || !toRegister.length}>Save Textures</Button></div></DialogContent></Dialog>
  </div>;
}

export function ModelEmbeddedImages({ modelId, primaryFileId, geometryFiles, disabled = false, onBusyChange, onRegistered }: {
  modelId: number; primaryFileId: number | null; geometryFiles: GeometryFile[]; disabled?: boolean;
  onBusyChange?: (busy: boolean) => void; onRegistered?: () => Promise<void>;
}) {
  const [choice, setChoice] = useState<{ modelId: number; fileId: number } | null>(null);
  const selected = choice?.modelId === modelId ? geometryFiles.find(file => file.id === choice.fileId) : null;
  const file = selected ?? geometryFiles.find(item => item.id === primaryFileId) ?? null;
  return <section id="model-embedded-images" aria-label="Embedded images" className="space-y-3 border-t pt-3">
    <div className="flex flex-wrap items-center gap-2"><Images className="h-4 w-4 text-violet-400" /><h3 className="flex items-center gap-1 text-xs font-semibold">Embedded images<ModelFieldHelp label="Embedded images">Browse the original images and declared material channels in a saved geometry File. Source material references describe the File; saved appearance overrides remain separate. Downloads preserve the original bytes. Saving Textures creates Library records and attached copies without changing the embedded materials.</ModelFieldHelp></h3>
      <label className="ml-auto text-xs">Geometry File <select aria-label="Inspect embedded images in geometry File" className="h-7 max-w-80 rounded border bg-background px-2" value={file?.id ?? ''} disabled={disabled} onChange={event => setChoice({ modelId, fileId: Number(event.target.value) })}><option value="" disabled>Choose geometry</option>{geometryFiles.map(item => <option key={item.id} value={item.id}>{item.fileName}{item.id === primaryFileId ? ' — primary' : ''}</option>)}</select></label>
    </div>
    {file ? <EmbeddedImageGallery key={`${modelId}:${file.id}`} modelId={modelId} file={file} disabled={disabled} onBusyChange={onBusyChange} onRegistered={onRegistered} /> : <p className="text-xs text-muted-foreground">Choose a saved geometry File to inspect its embedded images.</p>}
  </section>;
}
