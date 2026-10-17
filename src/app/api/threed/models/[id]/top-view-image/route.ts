import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { put, del } from '@vercel/blob';
import { ensureTableSequence } from '@/libraries/db/sequence';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { threedModels, threedModelFiles } from '@/libraries/schema/threed';
import { createThreeDBlobPath } from '@/libraries/services/threed/models/model-blob-paths';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const modelId = Number(id), userId = session.user.id;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(modelId) || modelId > 2147483647) return NextResponse.json({ success: false, error: 'Invalid Model ID' }, { status: 400 });
  const predicate = and(eq(threedModels.id, modelId), eq(threedModels.userId, userId));
  const [model] = await db.select({ id: threedModels.id }).from(threedModels).where(predicate).limit(1);
  if (!model) return NextResponse.json({ success: false, error: 'Model not found' }, { status: 404 });
  let uploaded: string | null = null;
  try {
    const data = await request.formData(), file = data.get('file');
    if (!(file instanceof File) || file.name.length > 255 || file.size < 1 || file.size > 4 * 1024 * 1024 || file.type !== 'image/png' || !/\.png$/i.test(file.name)) return NextResponse.json({ success: false, error: 'Choose a PNG top-view image up to 4 MB' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (![137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte)) return NextResponse.json({ success: false, error: 'Invalid PNG contents' }, { status: 400 });
    if (bytes.length < 33) return NextResponse.json({ success: false, error: 'Incomplete PNG' }, { status: 400 });
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = header.getUint32(16), height = header.getUint32(20);
    if (width < 1 || height < 1 || width > 4096 || height > 4096) return NextResponse.json({ success: false, error: 'PNG dimensions must be between 1 and 4096 pixels' }, { status: 400 });
    await ensureTableSequence('threed_model_files');
    const blob = await put(createThreeDBlobPath(userId, 'previews', file.name, crypto.randomUUID()), file, { access: 'public', addRandomSuffix: false, contentType: 'image/png' });
    uploaded = blob.url;
    const result = await db.transaction(async tx => {
      const [owner] = await tx.select({ id: threedModels.id }).from(threedModels).where(predicate).limit(1).for('update');
      if (!owner) throw Error('Model is no longer available');
      const [attachment] = await tx.insert(threedModelFiles).values({ userId, modelId, fileName: file.name, relativePath: `top-view/${crypto.randomUUID()}.png`, fileType: 'top-view', filePath: blob.url, fileSize: file.size, isBinaryBuffer: false, loadOrder: 0 }).returning();
      await tx.update(threedModels).set({ hasExternalFiles: true, updatedAt: new Date() }).where(predicate);
      return attachment;
    });
    uploaded = null; // The transaction now owns the attachment; response failure must not delete it.
    return NextResponse.json({ success: true, data: { url: blob.url, fileId: result.id } });
  } catch {
    if (uploaded) { try { await del(uploaded); } catch { /* A failed upload may need storage cleanup; never alter the saved Model. */ } }
    return NextResponse.json({ success: false, error: 'Top-view upload failed. Your saved Model is unchanged; retry the upload.' }, { status: 500 });
  }
}
