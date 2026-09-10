import {
  MAX_BULK_FILE_BYTES, resolveBulkSettings, validateBulkTexture,
  type BulkDraft, type BulkDefaults, type BulkExistingTexture, type BulkSource,
// @ts-expect-error Native validation requires explicit extensions.
} from './model-bulk-preparation-core.ts';

export type SavedBulkTexture = BulkExistingTexture & { filePath?: string };

/** Only the effective, active, filename-matching FBX Texture can supply a missing local image. */
export function matchingSavedBulkTexture(draft: BulkDraft, defaults: BulkDefaults, pool: readonly BulkSource[], textures: readonly SavedBulkTexture[]) {
  if (!/\.fbx$/i.test(draft.source.file.name)) return undefined;
  const id = resolveBulkSettings(draft, defaults).existingTextureId;
  const texture = textures.find((entry) => entry.id === id && entry.isActive);
  if (!texture || !draft.requirements.some((requirement) => requirement.kind === 'texture'
    && requirement.fileName.toLowerCase() === texture.fileName.toLowerCase()
    && !pool.some((source) => source.file.name.toLowerCase() === requirement.fileName.toLowerCase()))) return undefined;
  return texture;
}

/** Download once for the current batch; bytes are temporary preview data; persistence links the original Texture URL. */
export async function readSavedBulkTexture(texture: SavedBulkTexture, signal: AbortSignal): Promise<BulkSource> {
  if (!texture.filePath || !/^https:\/\//i.test(texture.filePath)) throw new Error('Saved Texture has no valid HTTPS file URL.');
  const response = await fetch(texture.filePath, { signal });
  if (!response.ok || !response.body) throw new Error('Saved Texture could not be read.');
  if (Number(response.headers.get('content-length')) > MAX_BULK_FILE_BYTES) {
    await response.body.cancel();
    throw new Error('Saved Texture exceeds the 4 MiB attachment limit.');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BULK_FILE_BYTES) throw new Error('Saved Texture exceeds the 4 MiB attachment limit.');
      chunks.push(new Uint8Array(value));
    }
  } finally { await reader.cancel(); }
  const file = new File(chunks, texture.fileName, { type: response.headers.get('content-type') ?? '' });
  const issue = validateBulkTexture(file);
  if (issue) throw new Error(issue);
  return { id: `saved-texture:${texture.id}`, file, sourcePath: texture.fileName, selectionRoot: '', sharedTexture: { id: texture.id, filePath: texture.filePath } };
}
