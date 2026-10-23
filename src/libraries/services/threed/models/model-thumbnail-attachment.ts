import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { db } from '@/libraries/db/client';
import { threedModels, threedModelFiles } from '@/libraries/schema/threed';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Register a saved reference, without downloading or claiming ownership of its remote bytes. */
export async function attachModelThumbnail(tx: Transaction, userId: string, modelId: number, url: string) {
  // Legacy thumbnail URLs can exceed the existing File column capacity. Preserve those saves.
  if (url.length > 500) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  const extension = parsed.pathname.match(/\.(png|jpe?g|webp)$/i)?.[1]?.toLowerCase();
  if (parsed.protocol !== 'https:' || !extension) return null;
  const [model] = await tx.select({ id: threedModels.id }).from(threedModels).where(and(
    eq(threedModels.id, modelId), eq(threedModels.userId, userId),
  )).limit(1).for('update');
  if (!model) throw new Error('Model unavailable');
  const [existing] = await tx.select().from(threedModelFiles).where(and(
    eq(threedModelFiles.modelId, modelId), eq(threedModelFiles.userId, userId),
    eq(threedModelFiles.filePath, url),
  )).limit(1);
  if (existing) return existing;
  const digest = createHash('sha256').update(url).digest('hex');
  const [file] = await tx.insert(threedModelFiles).values({
    userId, modelId, fileName: `model-${modelId}-thumbnail.${extension}`,
    relativePath: `previews/thumbnail-${digest}.${extension}`,
    fileType: 'other', filePath: url, isBinaryBuffer: false, loadOrder: 0,
  }).returning();
  await tx.update(threedModels).set({ hasExternalFiles: true }).where(and(
    eq(threedModels.id, modelId), eq(threedModels.userId, userId),
  ));
  return file;
}
