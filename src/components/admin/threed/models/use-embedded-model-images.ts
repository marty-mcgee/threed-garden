'use client';
import { useEffect, useState } from 'react';
import { prepareThreeDModelEmbeddedImages, type ThreeDModelEmbeddedImageCatalog } from '@/libraries/services/threed/models/model-embedded-images-core';

export interface EmbeddedImageSource {
  catalog: ThreeDModelEmbeddedImageCatalog;
  sourceStamp: string;
  extract: ReturnType<typeof prepareThreeDModelEmbeddedImages>['extract'] | null;
}

async function boundedSource(response: Response, signal: AbortSignal) {
  const max = 32 * 1024 * 1024;
  if (!response.body || Number(response.headers.get('content-length')) > max) throw new Error('Saved geometry exceeds the embedded-image inspection limit.');
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (signal.aborted) throw new Error('Inspection cancelled.');
      if (result.done) break;
      total += result.value.length;
      if (total > max) throw new Error('Saved geometry exceeds the embedded-image inspection limit.');
      chunks.push(result.value);
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export function useEmbeddedModelImages(modelId: number, fileId: number | null, fileName: string, revision: number) {
  const [source, setSource] = useState<EmbeddedImageSource | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const supported = /\.(glb|gltf)$/i.test(fileName);
  useEffect(() => {
    const controller = new AbortController();
    setSource(null); setError('');
    if (!fileId || !supported) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    void (async () => {
      try {
        const base = `/api/threed/models/${modelId}/embedded-images?fileId=${fileId}`;
        const response = await fetch(base, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success || result.data?.modelId !== modelId || result.data?.fileId !== fileId
          || !/^[a-f0-9]{64}$/.test(result.data.sourceStamp) || !Array.isArray(result.data.catalog?.images)) throw new Error(result.error || 'Embedded images could not be inspected.');
        const { catalog, sourceStamp } = result.data;
        let extract: EmbeddedImageSource['extract'] = null;
        if (catalog.embeddedImages) {
          const raw = await fetch(`${base}&source=true&sourceStamp=${sourceStamp}`, { signal: controller.signal, cache: 'no-store' });
          if (!raw.ok) throw new Error(raw.status === 409 ? 'The saved geometry changed. Reload embedded images.' : 'Embedded image bytes could not be loaded.');
          const prepared = prepareThreeDModelEmbeddedImages(fileName, await boundedSource(raw, controller.signal));
          extract = prepared.extract;
        }
        if (!controller.signal.aborted) setSource({ catalog, sourceStamp, extract });
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Embedded images could not be loaded.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [modelId, fileId, fileName, revision, supported]);
  return { source, loading, error, supported };
}
