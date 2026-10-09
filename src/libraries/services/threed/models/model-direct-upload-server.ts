import { createHmac, timingSafeEqual } from 'node:crypto';
// @ts-expect-error Native offline validators require explicit extensions.
import { createThreeDBlobPath } from './model-blob-paths.ts';
// @ts-expect-error Native offline validators require explicit extensions.
import { threeDModelUploadPolicy, suggestedThreeDModelName, MAX_THREED_DIRECT_MODEL_BYTES } from './model-upload-policy-core.ts';
// @ts-expect-error Native offline validators require explicit extensions.
import { inspectUploadedThreeDModel } from './model-upload-inspection-server.ts';
// @ts-expect-error Native offline validators require explicit extensions.
import { inspectThreeDGltfBundle } from './model-gltf-bundle-core.ts';

const RECEIPT_LIFETIME_MS = 45 * 60 * 1000;
type Metadata = ReturnType<typeof threeDModelUploadPolicy>;
export type ThreeDDirectUploadReceipt = Metadata & { version: 1; userId: string; pathname: string; expiresAt: number };
const signature = (payload: string, secret: string) => createHmac('sha256', secret).update(`threed-model-upload-v1:${payload}`).digest();

/** Signed, owner-bound authorization; never contains the storage credential. */
export function authorizeThreeDDirectUpload(userId: string, name: unknown, size: unknown, secret: string, id: string, now = Date.now()) {
  const metadata = threeDModelUploadPolicy(name, size);
  const receipt: ThreeDDirectUploadReceipt = { ...metadata, version: 1, userId,
    pathname: createThreeDBlobPath(userId, 'models', metadata.fileName, id), expiresAt: now + RECEIPT_LIFETIME_MS };
  const payload = Buffer.from(JSON.stringify(receipt)).toString('base64url');
  return { pathname: receipt.pathname, contentType: receipt.contentType,
    authorization: `${payload}.${signature(payload, secret).toString('base64url')}` };
}

export function verifyThreeDDirectUpload(value: unknown, userId: string, secret: string, now = Date.now()): ThreeDDirectUploadReceipt {
  const invalid = () => new Error('Upload authorization is invalid or expired. Choose the file again.');
  if (typeof value !== 'string' || value.length > 4096) throw invalid();
  const [payload, supplied, extra] = value.split('.');
  if (!payload || !supplied || extra !== undefined) throw invalid();
  const expected = signature(payload, secret), actual = Buffer.from(supplied, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw invalid();
  let receipt: ThreeDDirectUploadReceipt;
  try { receipt = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { throw invalid(); }
  if (receipt.version !== 1 || receipt.userId !== userId || !Number.isSafeInteger(receipt.expiresAt)
    || receipt.expiresAt <= now || receipt.expiresAt > now + RECEIPT_LIFETIME_MS) throw invalid();
  const metadata = threeDModelUploadPolicy(receipt.fileName, receipt.fileSize);
  if (receipt.modelType !== metadata.modelType || receipt.contentType !== metadata.contentType
    || typeof receipt.pathname !== 'string' || !receipt.pathname.startsWith(`threed/users/${userId}/models/`)) throw invalid();
  return receipt;
}

export interface DirectUploadObject {
  pathname: string; url: string; size: number; contentType: string;
}

/** Reads only a provider-verified URL; request and response bytes remain bounded. */
export async function completeThreeDDirectUpload(receipt: ThreeDDirectUploadReceipt, object: DirectUploadObject, request: typeof fetch = fetch) {
  const url = new URL(object.url);
  if (object.pathname !== receipt.pathname || object.size !== receipt.fileSize || object.contentType !== receipt.contentType
    || url.protocol !== 'https:' || !url.hostname.endsWith('.blob.vercel-storage.com') || url.search || url.hash
    || decodeURIComponent(url.pathname.slice(1)) !== receipt.pathname) throw new Error('Uploaded Model metadata could not be verified. Retry verification.');
  const response = await request(object.url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (!response.ok || !response.body || Number(response.headers.get('content-length')) > MAX_THREED_DIRECT_MODEL_BYTES) {
    await response.body?.cancel();
    throw new Error('Uploaded Model bytes could not be verified. Retry verification.');
  }
  const reader = response.body.getReader(), chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.byteLength;
      if (size > receipt.fileSize || size > MAX_THREED_DIRECT_MODEL_BYTES) throw new Error('Uploaded Model exceeds its authorized byte size.');
      chunks.push(new Uint8Array(next.value));
    }
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  if (size !== receipt.fileSize) throw new Error('Uploaded Model byte size does not match the selected file.');
  const file = new File(chunks, receipt.fileName, { type: receipt.contentType });
  if (receipt.modelType === 'glb' || receipt.modelType === 'gltf') {
    // Check actual provider bytes, not the browser's inventory or filename alone.
    inspectThreeDGltfBundle(receipt.fileName, new Uint8Array(await file.arrayBuffer()));
  }
  const analysis = await inspectUploadedThreeDModel(file, receipt.modelType);
  return { url: object.url, fileSize: size, extension: receipt.modelType, modelType: receipt.modelType,
    fileName: receipt.fileName, suggestedModelName: suggestedThreeDModelName(receipt.fileName), analysis };
}
