import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { threedModels, threedModelFiles } from '@/libraries/schema/threed';
import { parseModelFileEdit } from '@/libraries/services/threed/models/model-file-edit-core';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id, fileId: rawFileId } = await params;
  const modelId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  const fileId = /^[1-9]\d*$/.test(rawFileId) ? Number(rawFileId) : NaN;
  if (![modelId, fileId].every(Number.isSafeInteger)) return NextResponse.json({ success: false, error: 'Invalid Model/File ID' }, { status: 400 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 415 });
  }
  let updates: ReturnType<typeof parseModelFileEdit>;
  try { updates = parseModelFileEdit(await request.json()); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid File edit' }, { status: 400 }); }
  const userId = session.user.id;
  try {
    // Lock the parent and attachment, and retain every owner/context predicate on update.
    const result = await db.transaction(async tx => {
      const [model] = await tx.select({ id: threedModels.id }).from(threedModels)
        .where(and(eq(threedModels.id, modelId), eq(threedModels.userId, userId))).limit(1).for('update');
      if (!model) return { status: 404, error: 'Model or File not found' };
      const predicate = and(eq(threedModelFiles.id, fileId), eq(threedModelFiles.modelId, modelId), eq(threedModelFiles.userId, userId));
      const [file] = await tx.select().from(threedModelFiles).where(predicate).limit(1).for('update');
      if (!file) return { status: 404, error: 'Model or File not found' };
      if ('textureType' in updates && file.fileType !== 'texture') return { status: 422, error: 'Texture type is editable only on Texture attachments' };
      const [updated] = await tx.update(threedModelFiles).set({ ...updates, updatedAt: new Date() }).where(predicate).returning();
      return updated ? { status: 200, data: updated } : { status: 404, error: 'Model or File not found' };
    });
    return NextResponse.json({ success: result.status === 200, ...('data' in result ? { data: result.data } : { error: result.error }) }, { status: result.status });
  } catch { return NextResponse.json({ success: false, error: 'Failed to save File settings' }, { status: 500 }); }
}
