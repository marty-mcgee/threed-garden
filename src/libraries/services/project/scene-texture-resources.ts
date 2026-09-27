import { inspectThreeDModelPrimary } from '@/libraries/services/threed/models/model-companion-core';
import { isOwnedThreeDBlobUrl } from '@/libraries/services/threed/models/model-file-integrity';

type Texture = { userId: string | null; fileName: string; filePath: string; isActive: boolean | null };
type Model = { id: number; userId: string | null; modelType: string; filePath: string | null };
const MAX_BYTES = 32 * 1024 * 1024;
const references = new Map<string, { expires: number; names: Set<string> }>();

/** Only filenames actually referenced by an authorized Project FBX may leave the server. */
export function referencedSceneTextures(model: Model, names: Set<string>, textures: Texture[]) {
  const candidates = textures.filter(texture => texture.userId === model.userId && texture.isActive
    && names.has(texture.fileName.toLowerCase()) && /^https:\/\//i.test(texture.filePath));
  return candidates.filter(texture => candidates.filter(other => other.fileName.toLowerCase() === texture.fileName.toLowerCase()).length === 1)
    .map(({ fileName, filePath }) => ({ fileName, filePath, isActive: true }));
}

export async function sceneTextureResources(model: Model, textures: Texture[]) {
  if (model.modelType.toLowerCase() !== 'fbx' || !model.userId || !model.filePath || !textures.length) return [];
  if (!isOwnedThreeDBlobUrl(model.filePath, { modelId: model.id, userId: model.userId })) return [];
  const key = `${model.userId}:${model.id}:${model.filePath}`;
  let entry = references.get(key);
  if (!entry || entry.expires < Date.now()) {
    // Bounded, redirect-free reads of an owned primary file. Cache names only, never bytes or URLs.
    try {
      const response = await fetch(model.filePath, { signal: AbortSignal.timeout(10000), redirect: 'error', cache: 'no-store' });
      if (!response.ok || !response.body) return [];
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BYTES) { await reader.cancel(); return []; }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const names = new Set(inspectThreeDModelPrimary('model.fbx', bytes).filter(item => item.kind === 'texture').map(item => item.fileName.toLowerCase()));
      entry = { names, expires: Date.now() + 60000 };
      if (references.size >= 32) references.delete(references.keys().next().value!);
      references.set(key, entry);
    } catch { return []; } // Runtime loading reports failures; never broaden access on inspection failure.
  }
  return referencedSceneTextures(model, entry.names, textures);
}
