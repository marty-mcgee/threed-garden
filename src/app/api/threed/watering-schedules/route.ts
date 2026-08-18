import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { projectAssets } from '@/lib/schema/project';
import { threedWateringSchedules } from '@/lib/schema/threed';

// GET /api/threed/watering-schedules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleId = searchParams.get('moduleId');
    const plantId = searchParams.get('plantId');
    const plantingId = searchParams.get('plantingId');
    const farmbotId = searchParams.get('farmbotId');
    const bedId = searchParams.get('bedId');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = session.user.id;

    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid watering schedule ID' },
          { status: 400 }
        );
      }

      const [schedule] = await db
        .select()
        .from(threedWateringSchedules)
        .where(
          and(
            eq(threedWateringSchedules.id, parsedId),
            eq(threedWateringSchedules.userId, userId)
          )
        )
        .limit(1);

      if (!schedule) {
        return NextResponse.json(
          { success: false, error: 'Watering schedule not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: schedule });
    }

    const conditions: SQL[] = [eq(threedWateringSchedules.userId, userId)];
    const relationshipFilters = [
      [plantId, threedWateringSchedules.plantId],
      [plantingId, threedWateringSchedules.plantingId],
      [farmbotId, threedWateringSchedules.farmbotId],
      [bedId, threedWateringSchedules.bedId],
    ] as const;

    for (const [value, column] of relationshipFilters) {
      if (value) {
        const parsedValue = parseInt(value);
        if (!isNaN(parsedValue)) {
          conditions.push(eq(column, parsedValue));
        }
      }
    }

    if (isActive !== null) {
      conditions.push(eq(threedWateringSchedules.isActive, isActive === 'true'));
    }

    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (!isNaN(parsedModuleId)) {
        const links = await db
          .select({ assetId: projectAssets.assetId })
          .from(projectAssets)
          .where(
            and(
              eq(projectAssets.moduleId, parsedModuleId),
              eq(projectAssets.moduleType, 'threed'),
              eq(projectAssets.assetType, 'threed_watering_schedules'),
              eq(projectAssets.userId, userId),
              eq(projectAssets.isActive, true)
            )
          );

        const scheduleIds = links.map(({ assetId }) => assetId);
        if (scheduleIds.length === 0) {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { limit, offset, total: 0 },
          });
        }

        conditions.push(inArray(threedWateringSchedules.id, scheduleIds));
      }
    }

    const where = and(...conditions);
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedWateringSchedules)
      .where(where);

    const schedules = await db
      .select()
      .from(threedWateringSchedules)
      .where(where)
      .orderBy(
        desc(threedWateringSchedules.nextWatering),
        desc(threedWateringSchedules.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: schedules,
      pagination: {
        limit,
        offset,
        total: countResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Watering Schedules API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watering schedules' },
      { status: 500 }
    );
  }
}
