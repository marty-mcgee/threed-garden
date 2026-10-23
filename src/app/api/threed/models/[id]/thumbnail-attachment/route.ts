import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { threedModels } from '@/libraries/schema/threed';
import { attachModelThumbnail } from '@/libraries/services/threed/models/model-thumbnail-attachment';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const modelId = Number(id), userId = session.user.id;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(modelId) || modelId > 2147483647) return NextResponse.json({ success: false, error: 'Invalid Model ID' }, { status: 400 });
  try {
    const result = await db.transaction(async tx => {
      const [model] = await tx.select({ thumbnailUrl: threedModels.thumbnailUrl }).from(threedModels).where(and(
        eq(threedModels.id, modelId), eq(threedModels.userId, userId),
      )).limit(1).for('update');
      if (!model) return { status: 404, error: 'Model not found' };
      if (!model.thumbnailUrl) return { status: 409, error: 'This Model has no saved thumbnail' };
      const file = await attachModelThumbnail(tx, userId, modelId, model.thumbnailUrl);
      if (!file) return { status: 422, error: 'The saved thumbnail must be an HTTPS PNG, JPG or WebP URL of at most 500 characters to attach it' };
      return { status: 200, file };
    });
    return NextResponse.json(result.file ? { success: true, data: result.file } : { success: false, error: result.error }, { status: result.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to attach the saved thumbnail. Please retry.' }, { status: 500 });
  }
}
