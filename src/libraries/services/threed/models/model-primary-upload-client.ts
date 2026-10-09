'use client';
import { upload } from '@vercel/blob/client';
import { threeDModelUploadPolicy } from './model-upload-policy-core';
import type { completeThreeDDirectUpload } from './model-direct-upload-server';

export type ThreeDPrimaryUploadResult = Awaited<ReturnType<typeof completeThreeDDirectUpload>>;
export interface ThreeDPrimaryUploadOptions { signal?: AbortSignal; onProgress?: (percentage: number, phase: 'uploading' | 'verifying') => void }
export class ThreeDPrimaryUploadError extends Error {
  constructor(message: string, readonly cleanupUnconfirmed = false) { super(message); this.name = 'ThreeDPrimaryUploadError'; }
}
const ROUTE = '/api/threed/models/upload/direct';

export async function uploadThreeDPrimaryFile(file: File, options: ThreeDPrimaryUploadOptions = {}): Promise<ThreeDPrimaryUploadResult> {
  const metadata = threeDModelUploadPolicy(file.name, file.size);
  const json = async (body: unknown) => {
    const response = await fetch(ROUTE, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: options.signal });
    const reply = await response.json().catch(() => null);
    if (!response.ok || !reply?.success || !reply.data) throw new Error(reply?.error || 'Model upload could not be verified. Please retry.');
    return reply.data;
  };
  options.signal?.throwIfAborted();
  const authorized = await json({ action: 'authorize', fileName: metadata.fileName, fileSize: metadata.fileSize });
  options.signal?.throwIfAborted();
  options.onProgress?.(0, 'uploading');
  let blob: Awaited<ReturnType<typeof upload>>;
  try { blob = await upload(authorized.pathname, file, { access: 'public', contentType: metadata.contentType,
    handleUploadUrl: ROUTE, clientPayload: authorized.authorization, multipart: true, abortSignal: options.signal,
    onUploadProgress: ({ percentage }) => options.onProgress?.(percentage, 'uploading') }); }
  catch { throw new ThreeDPrimaryUploadError(options.signal?.aborted ? 'Model upload cancelled. Your previous draft is retained.'
    : 'Model storage upload failed. Your previous draft is retained. Retry the upload.'); }
  try {
    options.signal?.throwIfAborted();
    options.onProgress?.(100, 'verifying');
    const result = await json({ action: 'complete', authorization: authorized.authorization });
    options.signal?.throwIfAborted();
    if (result.url !== blob.url || result.fileSize !== file.size || result.fileName !== file.name || result.modelType !== metadata.modelType) {
      throw new Error('Verified Model details do not match the selected file.');
    }
    return result;
  } catch (error) {
    // No record was created. Use the established guarded staged-file cleanup.
    const cleanup = await fetch('/api/threed/models/upload', { method: 'DELETE', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: blob.url }), signal: AbortSignal.timeout(15_000) }).catch(() => null);
    const discarded = cleanup?.ok && (await cleanup.json().catch(() => null))?.success === true;
    if (!discarded) throw new ThreeDPrimaryUploadError('Model verification was interrupted; staged upload cleanup is unconfirmed. Your previous draft is retained. Review the staged upload before retrying.', true);
    throw new ThreeDPrimaryUploadError(options.signal?.aborted ? 'Model upload cancelled. Your previous draft is retained.'
      : error instanceof Error ? error.message : 'Model verification failed. Your previous draft is retained.');
  }
}
