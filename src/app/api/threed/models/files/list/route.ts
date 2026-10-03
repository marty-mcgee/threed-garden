import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { threedModelFiles, threedModels } from '@/libraries/schema/threed';
import { parseModelFileListQuery } from '@/libraries/services/threed/models/model-file-list-query';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const failure = (status: number, error: string) => NextResponse.json({ success: false, error }, { status, headers });

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure(401, 'Unauthorized');
    let query;
    try { query = parseModelFileListQuery(new URL(request.url).searchParams); }
    catch (error) { return failure(400, error instanceof Error ? error.message : 'Invalid File list query'); }
    const userId = session.user.id;
    if (query.modelId !== null) {
      const [model] = await db.select({ id: threedModels.id }).from(threedModels)
        .where(and(eq(threedModels.id, query.modelId), eq(threedModels.userId, userId))).limit(1);
      if (!model) return failure(404, 'Model not found');
    }

    const join = eq(threedModelFiles.modelId, threedModels.id);
    // Same assigned geometry authority as model-primary-file.ts: an exact
    // Model/File binding and owner match, never first geometry or load order.
    const assignedPrimary = and(
      eq(threedModelFiles.id, threedModels.mainModelFileId),
      eq(threedModelFiles.modelId, threedModels.id),
      eq(threedModelFiles.userId, threedModels.userId),
      eq(threedModelFiles.fileType, 'model'),
    );
    const role = sql<'primary' | 'supporting'>`case when ${assignedPrimary} then 'primary' else 'supporting' end`;
    const conditions: SQL[] = [eq(threedModelFiles.userId, userId), eq(threedModels.userId, userId)];
    if (query.modelId !== null) conditions.push(eq(threedModels.id, query.modelId));
    if (query.fileType !== null) conditions.push(eq(threedModelFiles.fileType, query.fileType));
    if (query.role !== null) conditions.push(sql`${role} = ${query.role}`);
    if (query.search) {
      // Bind a literal substring pattern and group every OR under both owners.
      const pattern = `%${query.search.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push(or(
        sql`${threedModelFiles.fileName} ILIKE ${pattern}`,
        sql`${threedModelFiles.relativePath} ILIKE ${pattern}`,
        sql`${threedModels.modelName} ILIKE ${pattern}`,
      )!);
    }
    const where = and(...conditions);
    const [count] = await db.select({ count: sql<number>`count(*)` }).from(threedModelFiles)
      .innerJoin(threedModels, join).where(where);
    const total = Number(count?.count ?? 0);
    if (!Number.isSafeInteger(total) || total < 0) return failure(500, 'Failed to fetch Model Files');

    const sortFields = {
      name: sql`lower(${threedModelFiles.fileName})`,
      path: sql`lower(coalesce(nullif(${threedModelFiles.relativePath}, ''), ${threedModelFiles.fileName}))`,
      model: sql`lower(${threedModels.modelName})`,
      type: sql`lower(${threedModelFiles.fileType})`,
      role,
      size: threedModelFiles.fileSize,
      loadOrder: threedModelFiles.loadOrder,
    };
    const ordering = query.direction === 'asc' ? asc(sortFields[query.sort]) : desc(sortFields[query.sort]);
    const data = await db.select({
      id: threedModelFiles.id,
      modelId: threedModels.id,
      modelName: threedModels.modelName,
      modelType: threedModels.modelType,
      fileName: threedModelFiles.fileName,
      relativePath: threedModelFiles.relativePath,
      fileType: threedModelFiles.fileType,
      textureType: threedModelFiles.textureType,
      fileSize: threedModelFiles.fileSize,
      loadOrder: threedModelFiles.loadOrder,
      role,
    }).from(threedModelFiles).innerJoin(threedModels, join).where(where)
      .orderBy(sql`${ordering} nulls last`, asc(threedModelFiles.id)).limit(query.limit).offset(query.offset);
    return NextResponse.json({ success: true, data, pagination: { limit: query.limit, offset: query.offset, total } }, { headers });
  } catch { return failure(500, 'Failed to fetch Model Files'); }
}
