import 'server-only';
import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { threedModelFiles, threedModels } from '@/libraries/schema/threed';
import { isOwnedThreeDBlobUrl } from '@/libraries/services/threed/models/model-file-integrity';

const MAX_SOURCE_BYTES = 32 * 1024 * 1024;
const INSPECTION_TIMEOUT_MS = 30_000;
export class ThreeDEmbeddedImageReadError extends Error {
  constructor(message: string, readonly status = 422) { super(message); }
}

export type ThreeDEmbeddedImageSourceFile = Pick<typeof threedModelFiles.$inferSelect,
  'id' | 'modelId' | 'userId' | 'fileType' | 'fileName' | 'filePath' | 'fileSize' | 'updatedAt'>;

export function embeddedImageSourceFileIdentity(file: ThreeDEmbeddedImageSourceFile) {
  return JSON.stringify([file.id, file.modelId, file.userId, file.fileType, file.fileName, file.filePath, file.fileSize, file.updatedAt]);
}

/** Reads only the already-authorized immutable geometry URL; never follows referenced resources. */
async function readSavedGeometry(url: string, expectedBytes: number, signal: AbortSignal) {
  const response = await fetch(url, { cache: 'no-store', redirect: 'manual', signal });
  if (!response.ok || response.redirected) throw new ThreeDEmbeddedImageReadError('The saved geometry could not be read. Reload its Files and try again.');
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) {
    await response.body?.cancel();
    throw new ThreeDEmbeddedImageReadError('Embedded image inspection supports geometry files up to 32 MB.');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new ThreeDEmbeddedImageReadError('The saved geometry response is empty.');
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      byteLength += result.value.byteLength;
      if (byteLength > MAX_SOURCE_BYTES || byteLength > expectedBytes) {
        throw new ThreeDEmbeddedImageReadError('The geometry File changed or exceeds the inspection limit. Reload its Files and try again.', 409);
      }
      chunks.push(result.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (byteLength !== expectedBytes || byteLength === 0) {
    throw new ThreeDEmbeddedImageReadError('The geometry File changed or is incomplete. Reload its Files and try again.', 409);
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

/** Exact owned geometry only; the caller supplies authenticated identity, never a client URL. */
export async function readOwnedThreeDModelEmbeddedImageSource({ modelId, fileId, userId, signal, sourceStamp }: {
  modelId: number; fileId: number; userId: string; signal: AbortSignal; sourceStamp?: string;
}) {
  if (![modelId, fileId].every(id => Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647) || !userId) {
    throw new ThreeDEmbeddedImageReadError('Choose a valid Model and geometry File.', 400);
  }
  const [model] = await db.select({ id: threedModels.id, mainModelFileId: threedModels.mainModelFileId })
    .from(threedModels).where(and(eq(threedModels.id, modelId), eq(threedModels.userId, userId))).limit(1);
  if (!model) throw new ThreeDEmbeddedImageReadError('Model not found', 404);
  const filePredicate = and(
    eq(threedModelFiles.id, fileId), eq(threedModelFiles.modelId, modelId),
    eq(threedModelFiles.userId, userId), eq(threedModelFiles.fileType, 'model'),
  );
  const selection = {
    id: threedModelFiles.id, modelId: threedModelFiles.modelId, userId: threedModelFiles.userId, fileType: threedModelFiles.fileType,
    fileName: threedModelFiles.fileName, filePath: threedModelFiles.filePath,
    fileSize: threedModelFiles.fileSize, updatedAt: threedModelFiles.updatedAt,
  };
  const [file] = await db.select(selection).from(threedModelFiles).where(filePredicate).limit(1);
  if (!file) throw new ThreeDEmbeddedImageReadError('Geometry File not found', 404);
  if (!/\.(?:glb|gltf)$/i.test(file.fileName)) throw new ThreeDEmbeddedImageReadError('Embedded image inspection currently supports GLB and glTF Files.', 422);
  let sourceUrl: URL;
  try { sourceUrl = new URL(file.filePath); } catch { throw new ThreeDEmbeddedImageReadError('This geometry File is not eligible for embedded image inspection.', 422); }
  if (
    sourceUrl.username || sourceUrl.password || sourceUrl.search || sourceUrl.hash || sourceUrl.port
    || !isOwnedThreeDBlobUrl(file.filePath, { modelId, userId })
  ) throw new ThreeDEmbeddedImageReadError('This geometry File is not eligible for embedded image inspection.', 422);
  if (!file.fileSize || file.fileSize < 1 || file.fileSize > MAX_SOURCE_BYTES) {
    throw new ThreeDEmbeddedImageReadError('Embedded image inspection requires a saved geometry File between 1 byte and 32 MB.', 422);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INSPECTION_TIMEOUT_MS);
  let bytes: Uint8Array;
  try {
    bytes = await readSavedGeometry(file.filePath, file.fileSize, AbortSignal.any([controller.signal, signal]));
  } finally { clearTimeout(timeout); }
  // Do not issue a catalog or an image after its owned File was edited/deleted during the read.
  const [currentFile] = await db.select(selection).from(threedModelFiles).where(filePredicate).limit(1);
  if (!currentFile || embeddedImageSourceFileIdentity(currentFile) !== embeddedImageSourceFileIdentity(file)) {
    throw new ThreeDEmbeddedImageReadError('The geometry File changed. Reload its Files and the image catalog.', 409);
  }
  const currentStamp = createHash('sha256').update(`${modelId}:${embeddedImageSourceFileIdentity(file)}:`).update(bytes).digest('hex');
  if (sourceStamp !== undefined && sourceStamp !== currentStamp) throw new ThreeDEmbeddedImageReadError('The geometry File changed. Reload the image catalog.', 409);

  return { modelId, fileId, fileName: file.fileName, isPrimary: model.mainModelFileId === fileId, sourceStamp: currentStamp, bytes, fileIdentity: embeddedImageSourceFileIdentity(file), file };
}
