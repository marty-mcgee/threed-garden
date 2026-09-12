import { createHash, randomUUID } from 'node:crypto';
import { put, del } from '@vercel/blob';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { threedAnimationFiles, threedAnimations } from '@/lib/schema/threed';
import { createThreeDBlobPath } from '@/lib/services/threed/models/model-blob-paths';
import { AnimationLibraryError } from './contracts';
import { animationFormat, inspectAnimationSource } from './inspect-source';

export async function uploadAnimationSource(userId: string, form: FormData) {
  const file = form.get('file');
  if (!(file instanceof File) || form.getAll('file').length !== 1) throw new AnimationLibraryError(400, 'Choose an animation file');
  if ([...form.keys()].some(key => key !== 'file')) throw new AnimationLibraryError(400, 'Only the source file is accepted');
  const format = animationFormat(file.name, file.size);
  const bytes = await file.arrayBuffer();
  const clips = await inspectAnimationSource(bytes, format);
  const sourceName = file.name.replace(/^.*[\\/]/, '').replace(/\.(fbx|glb)$/i, '').trim() || 'Animation';
  const checksum = createHash('sha256').update(new Uint8Array(bytes)).digest('hex');
  // Confirm the approved tables are available before writing any Blob bytes.
  await db.select({ id: threedAnimationFiles.id }).from(threedAnimationFiles).limit(1);
  await db.select({ id: threedAnimations.id }).from(threedAnimations).limit(1);
  const blob = await put(createThreeDBlobPath(userId, 'animations', file.name, randomUUID()), file, {
    access: 'public', addRandomSuffix: false, contentType: format === 'glb' ? 'model/gltf-binary' : 'application/octet-stream',
  });
  try {
    return await db.transaction(async tx => {
      const [source] = await tx.insert(threedAnimationFiles).values({ userId, fileName: file.name, filePath: blob.url, fileSize: file.size, format, checksum, metadata: { clipCount: clips.length } }).returning();
      const data = await tx.insert(threedAnimations).values(clips.map(clip => {
        const suffix = clips.length > 1 ? ` — Clip ${clip.clipIndex + 1}` : '';
        return { ...clip, name: sourceName.slice(0, 255 - suffix.length) + suffix, userId, animationFileId: source.id };
      })).returning();
      return { data, source, clipCount: data.length };
    });
  } catch (error) {
    // A lost commit response is ambiguous: only remove bytes after confirming no source was committed.
    try {
      const existing = await db.select({ id: threedAnimationFiles.id }).from(threedAnimationFiles).where(and(eq(threedAnimationFiles.userId, userId), eq(threedAnimationFiles.filePath, blob.url)));
      if (existing.length === 0) await del(blob.url);
    } catch { /* Retain bytes when database state cannot be established. */ }
    throw error;
  }
}
