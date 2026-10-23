import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { del, put } from '@vercel/blob';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { ensureTableSequence } from '@/libraries/db/sequence';
import { threedModelFiles, threedModels, threedModelTextures } from '@/libraries/schema/threed';
import { createThreeDBlobPath } from '@/libraries/services/threed/models/model-blob-paths';
import { extractThreeDModelEmbeddedImage } from '@/libraries/services/threed/models/model-embedded-images-core';
import {
  embeddedImageSourceFileIdentity,
  readOwnedThreeDModelEmbeddedImageSource,
  ThreeDEmbeddedImageReadError,
} from '@/libraries/services/threed/models/model-embedded-images-server';

export const runtime = 'nodejs';
const MAX_REGISTER_BYTES = 4 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
type RegistrationTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function readRegistrationBody(request: NextRequest) {
  if (Number(request.headers.get('content-length')) > 2_048) {
    throw new ThreeDEmbeddedImageReadError('Registration request is too large', 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ThreeDEmbeddedImageReadError('Invalid embedded image registration', 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      length += result.value.byteLength;
      if (length > 2_048) throw new ThreeDEmbeddedImageReadError('Registration request is too large', 413);
      chunks.push(result.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new ThreeDEmbeddedImageReadError('Invalid embedded image registration', 400); }
}

/** Only this action's own Texture Blob namespace is eligible for duplicate reuse. */
function ownedTextureBlob(url: string, userId: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.blob.vercel-storage.com')
      && !parsed.username && !parsed.password && !parsed.port && !parsed.search && !parsed.hash
      && decodeURIComponent(parsed.pathname).startsWith(`/threed/users/${userId}/textures/`);
  } catch { return false; }
}

/** Explicitly copies original embedded bytes; it never assigns a material or chooses geometry. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const modelId = Number(id), userId = session.user.id;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(modelId) || modelId > 2_147_483_647) {
    return NextResponse.json({ success: false, error: 'Invalid Model ID' }, { status: 400 });
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 415 });
  }
  let uploaded: string | null = null;
  try {
    // The browser sends identities only. Source bytes and URLs always come from the owned File.
    const text = await readRegistrationBody(request);
    let body: unknown;
    try { body = JSON.parse(text); } catch { return NextResponse.json({ success: false, error: 'Invalid embedded image registration' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid embedded image registration' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    if (Object.keys(input).some(key => !['fileId', 'imageIndex', 'sourceStamp'].includes(key))
      || !Number.isSafeInteger(input.fileId) || Number(input.fileId) < 1 || Number(input.fileId) > 2_147_483_647
      || !Number.isSafeInteger(input.imageIndex) || Number(input.imageIndex) < 0 || Number(input.imageIndex) >= 500
      || typeof input.sourceStamp !== 'string' || !/^[a-f0-9]{64}$/.test(input.sourceStamp)) {
      return NextResponse.json({ success: false, error: 'Choose a current embedded image from the catalog' }, { status: 400 });
    }
    const fileId = Number(input.fileId), imageIndex = Number(input.imageIndex);
    const source = await readOwnedThreeDModelEmbeddedImageSource({ modelId, fileId, userId, signal: request.signal, sourceStamp: input.sourceStamp });
    let extracted: ReturnType<typeof extractThreeDModelEmbeddedImage>;
    try { extracted = extractThreeDModelEmbeddedImage(source.fileName, source.bytes, imageIndex); }
    catch { throw new ThreeDEmbeddedImageReadError('This embedded image is unavailable or unsupported. Reload its catalog.', 422); }
    const extension = IMAGE_EXTENSIONS[extracted.mimeType];
    if (!extension || extracted.bytes.byteLength < 1 || extracted.bytes.byteLength > MAX_REGISTER_BYTES
      || !extracted.image.previewSupported || !extracted.image.width || !extracted.image.height) {
      throw new ThreeDEmbeddedImageReadError('Save to Model Textures supports PNG, JPEG and WebP images up to 4 MB with supported dimensions.', 422);
    }
    const digest = createHash('sha256').update(extracted.bytes).digest('hex');
    const fileName = `image-${imageIndex}-${digest}.${extension}`;
    const relativePath = `embedded/file-${fileId}/${fileName}`;
    const modelPredicate = and(eq(threedModels.id, modelId), eq(threedModels.userId, userId));
    const sourcePredicate = and(eq(threedModelFiles.id, fileId), eq(threedModelFiles.modelId, modelId),
      eq(threedModelFiles.userId, userId), eq(threedModelFiles.fileType, 'model'));

    const registered = async (tx: RegistrationTransaction) => {
      // The Model lock serializes this action's duplicate checks and attachment counts.
      const [model] = await tx.select({ id: threedModels.id }).from(threedModels).where(modelPredicate).limit(1).for('update');
      if (!model) throw new ThreeDEmbeddedImageReadError('Model not found', 404);
      const [currentFile] = await tx.select().from(threedModelFiles).where(sourcePredicate).limit(1).for('update');
      if (!currentFile || embeddedImageSourceFileIdentity(currentFile) !== source.fileIdentity) {
        throw new ThreeDEmbeddedImageReadError('The geometry File changed. Reload its image catalog before saving.', 409);
      }
      const [attachment] = await tx.select().from(threedModelFiles).where(and(
        eq(threedModelFiles.modelId, modelId), eq(threedModelFiles.userId, userId), eq(threedModelFiles.relativePath, relativePath),
      )).limit(1);
      if (!attachment) return null;
      const [texture] = await tx.select().from(threedModelTextures).where(and(
        eq(threedModelTextures.userId, userId), eq(threedModelTextures.filePath, attachment.filePath),
      )).limit(1);
      if (attachment.fileType !== 'texture' || attachment.fileName !== fileName || attachment.fileSize !== extracted.bytes.byteLength
        || !texture || texture.fileName !== fileName || texture.fileSize !== extracted.bytes.byteLength
        || texture.mimeType !== extracted.mimeType || !ownedTextureBlob(attachment.filePath, userId)) {
        throw new ThreeDEmbeddedImageReadError('The extracted image attachment conflicts with an existing record. Review Model Files and Textures.', 409);
      }
      return { textureId: texture.id, fileId: attachment.id, relativePath, reused: true };
    };
    const existing = await db.transaction(registered);
    if (existing) return NextResponse.json({ success: true, data: existing });

    await ensureTableSequence('threed_model_textures');
    await ensureTableSequence('threed_model_files');
    const blob = await put(createThreeDBlobPath(userId, 'textures', fileName, crypto.randomUUID()), Buffer.from(extracted.bytes), {
      access: 'public', addRandomSuffix: false, contentType: extracted.mimeType,
    });
    uploaded = blob.url;
    const result = await db.transaction(async tx => {
      const raced = await registered(tx);
      if (raced) return raced;
      const [texture] = await tx.insert(threedModelTextures).values({
        userId, textureName: `${source.fileName} - ${extracted.image.name}`.slice(0, 255), fileName,
        filePath: blob.url, fileSize: extracted.bytes.byteLength, mimeType: extracted.mimeType,
        width: extracted.image.width, height: extracted.image.height,
      }).returning();
      const files = await tx.select({ id: threedModelFiles.id, fileType: threedModelFiles.fileType }).from(threedModelFiles)
        .where(and(eq(threedModelFiles.modelId, modelId), eq(threedModelFiles.userId, userId)));
      const [attachment] = await tx.insert(threedModelFiles).values({
        userId, modelId, fileName, relativePath, fileType: 'texture', filePath: blob.url,
        fileSize: extracted.bytes.byteLength, isBinaryBuffer: false, loadOrder: files.length,
      }).returning();
      await tx.update(threedModels).set({ hasExternalFiles: true,
        textureCount: files.filter(file => file.fileType === 'texture').length + 1, updatedAt: new Date(),
      }).where(modelPredicate);
      return { textureId: texture.id, fileId: attachment.id, relativePath, reused: false };
    });
    if (result.reused) {
      // A competing request won. Delete only this request's unreferenced staged Blob.
      await del(uploaded).catch(() => undefined);
    }
    uploaded = null; // Saved references own the Blob now; response failures must never remove it.
    return NextResponse.json({ success: true, data: result }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    if (uploaded) await del(uploaded).catch(() => undefined);
    if (error instanceof ThreeDEmbeddedImageReadError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'The embedded image could not be saved. Reload the catalog and retry; existing appearance is preserved.' }, { status: 500 });
  }
}
