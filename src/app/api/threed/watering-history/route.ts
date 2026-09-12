import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedWateringHistory as history } from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { parseWateringListQuery } from '@/lib/services/threed/waterings/watering-list-query';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const params = new URL(request.url).searchParams;
    let query;
    try { query = parseWateringListQuery(params); }
    catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid query' }, { status: 400 }); }
    const { limit, offset, search } = query;
    const owner = session.user.id;
    const conditions: SQL[] = [eq(history.userId, owner)];
    for (const [key, column] of [['plantId', history.plantId], ['plantingId', history.plantingId], ['farmbotId', history.farmbotId], ['scheduleId', history.scheduleId]] as const) {
      if (params.has(key)) conditions.push(eq(column, Number(params.get(key))));
    }
    // History has no historical Project identity. Module views use current asset links.
    if (params.has('moduleId')) conditions.push(sql`exists (
      select 1 from ${projectAssets} where ${projectAssets.userId} = ${owner}
      and ${projectAssets.moduleId} = ${Number(params.get('moduleId'))}
      and ${projectAssets.moduleType} = 'threed' and ${projectAssets.isActive} = true
      and ((${projectAssets.assetType} = 'threed_plantings' and ${projectAssets.assetId} = ${history.plantingId})
        or (${projectAssets.assetType} = 'threed_watering_schedules' and ${projectAssets.assetId} = ${history.scheduleId}))
    )`);
    if (search) conditions.push(sql`(${history.historyId} ILIKE ${`%${search}%`} OR ${history.status} ILIKE ${`%${search}%`} OR ${history.skipReason} ILIKE ${`%${search}%`} OR ${history.errorMessage} ILIKE ${`%${search}%`})`);
    const where = and(...conditions);
    const [count] = await db.select({ count: sql<number>`count(*)` }).from(history).where(where);
    const data = await db.select().from(history).where(where).orderBy(desc(history.executedAt), desc(history.id)).limit(limit).offset(offset);
    return NextResponse.json({ success: true, data, pagination: { limit, offset, total: Number(count?.count ?? 0) } });
  } catch (error) {
    console.error('[Watering History API] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch watering history' }, { status: 500 });
  }
}
