import { isMissingWateringSortOrder, parseWateringListQuery, parseWateringScheduleSort } from '@/libraries/services/threed/waterings/watering-list-query';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, getTableColumns, inArray, sql, type SQL } from 'drizzle-orm';

import { auth } from '@/libraries/auth';
import { db, type Transaction } from '@/libraries/db/client';
import { projectAssets } from '@/libraries/schema/project';
import { threedBeds, threedFarmbots, threedPlantings, threedPlants, threedTasks, threedWateringHistory, threedWateringSchedules } from '@/libraries/schema/threed';
import { parseNewWateringSchedule, parseWateringScheduleChanges, parseWateringScheduleVersion, WateringScheduleInputError, wateringScheduleTargets } from '@/libraries/services/threed/waterings/watering-schedule-edit';

const { sortOrder: rankColumn, ...scheduleFields } = getTableColumns(threedWateringSchedules);

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
    let query;
    let sort;
    try {
      query = parseWateringListQuery(searchParams);
      sort = parseWateringScheduleSort(searchParams);
    }
    catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid query' }, { status: 400 }); }
    const { limit, offset, search } = query;
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
        .select(scheduleFields)
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

    if (search) conditions.push(sql`(${threedWateringSchedules.scheduleId} ILIKE ${`%${search}%`} OR ${threedWateringSchedules.notes} ILIKE ${`%${search}%`})`);
    const where = and(...conditions);
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedWateringSchedules)
      .where(where);

    const column = threedWateringSchedules[sort.field];
    const sortOrder = sort.direction === 'asc' ? asc(column) : desc(column);
    const orderedColumn = sort.field === 'lastWatering' || sort.field === 'volumeMl' || sort.field === 'isActive'
      ? sql`${sortOrder} nulls last`
      : sortOrder;
    const ties = [desc(threedWateringSchedules.createdAt), desc(threedWateringSchedules.id)];
    const chronological = [desc(threedWateringSchedules.nextWatering), ...ties];
    const load = async (withRank: boolean) => db
      .select({ ...scheduleFields, sortOrder: withRank ? rankColumn : sql<null>`null` })
      .from(threedWateringSchedules)
      .where(where)
      .orderBy(...(sort.field === 'sortOrder' ? [...(withRank ? [orderedColumn] : []), ...chronological] : [orderedColumn, ...ties]))
      .limit(limit)
      .offset(offset);
    const schedules = await load(true).catch(error => {
      if (!isMissingWateringSortOrder(error)) throw error;
      return load(false);
    });

    return NextResponse.json({
      success: true,
      data: schedules,
      pagination: {
        limit,
        offset,
        total: Number(countResult?.count || 0),
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

class WateringScheduleConflict extends Error {
  constructor(message: string, readonly status: 404 | 409) { super(message); }
}

function scheduleMutationScope(params: URLSearchParams, userId: string) {
  const raw = params.get('id') ?? '';
  const id = Number(raw);
  if (!/^[1-9]\d*$/.test(raw) || !Number.isInteger(id) || id > 2147483647) throw new WateringScheduleInputError('Invalid Watering Schedule ID.');
  const scope = and(eq(threedWateringSchedules.id, id), eq(threedWateringSchedules.userId, userId));
  return { id, scope };
}

async function lockSchedule(tx: Transaction, scope: SQL | undefined, expected: Date) {
  const [schedule] = await tx.select({
    updatedAt: threedWateringSchedules.updatedAt,
    minTemperature: threedWateringSchedules.minTemperature,
    maxTemperature: threedWateringSchedules.maxTemperature,
  }).from(threedWateringSchedules).where(scope).limit(1).for('update');
  if (!schedule) throw new WateringScheduleConflict('Watering Schedule not found.', 404);
  if (schedule.updatedAt.getTime() !== expected.getTime()) throw new WateringScheduleConflict('This Watering Schedule changed. Refresh the list before trying again.', 409);
  return schedule;
}

function mutationFailure(error: unknown, action: 'add' | 'update' | 'delete') {
  if (error instanceof WateringScheduleInputError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  if (error instanceof WateringScheduleConflict) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  return NextResponse.json({ success: false, error: `Could not ${action} the Watering Schedule. Refresh the list and retry.` }, { status: 500 });
}

async function readWateringScheduleBody(request: NextRequest): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > 24576) throw new WateringScheduleInputError('Watering Schedule changes are too large.');
  try { return JSON.parse(text); } catch { throw new WateringScheduleInputError('Invalid Watering Schedule JSON.'); }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  try {
    const schedule = parseNewWateringSchedule(await readWateringScheduleBody(request));
    const data = await db.transaction(async tx => {
      for (const [field, table] of [
        ['plantId', threedPlants],
        ['plantingId', threedPlantings],
        ['bedId', threedBeds],
        ['farmbotId', threedFarmbots],
      ] as const) {
        const id = schedule[field];
        if (id === undefined) continue;
        const [target] = await tx.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.userId, userId))).limit(1).for('share');
        if (!target) throw new WateringScheduleInputError(`${wateringScheduleTargets[field]} is unavailable.`);
      }
      const [created] = await tx.insert(threedWateringSchedules).values({ ...schedule, userId })
        .onConflictDoNothing({ target: threedWateringSchedules.scheduleId }).returning({ id: threedWateringSchedules.id });
      if (!created) throw new WateringScheduleConflict('That Schedule ID is already in use.', 409);
      return created;
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return mutationFailure(error, 'add');
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { scope } = scheduleMutationScope(new URL(request.url).searchParams, session.user.id);
    const input = await readWateringScheduleBody(request) as Record<string, unknown>;
    if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some(key => key !== 'expectedUpdatedAt' && key !== 'changes')) {
      throw new WateringScheduleInputError('Invalid Watering Schedule update.');
    }
    const expected = parseWateringScheduleVersion(input.expectedUpdatedAt);
    const changes = parseWateringScheduleChanges(input.changes);
    const data = await db.transaction(async tx => {
      const schedule = await lockSchedule(tx, scope, expected);
      if ('minTemperature' in changes || 'maxTemperature' in changes) {
        const minimum = changes.minTemperature === undefined ? schedule.minTemperature : changes.minTemperature;
        const maximum = changes.maxTemperature === undefined ? schedule.maxTemperature : changes.maxTemperature;
        if (minimum !== null && maximum !== null && minimum > maximum) throw new WateringScheduleInputError('Minimum temperature cannot exceed maximum temperature.');
      }
      const updatedAt = new Date(Math.max(Date.now(), schedule.updatedAt.getTime() + 1));
      const [updated] = await tx.update(threedWateringSchedules).set({ ...changes, updatedAt }).where(scope)
        .returning({ id: threedWateringSchedules.id, updatedAt: threedWateringSchedules.updatedAt });
      return updated;
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mutationFailure(error, 'update');
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    const { id, scope } = scheduleMutationScope(params, session.user.id);
    const expected = parseWateringScheduleVersion(params.get('expectedUpdatedAt'));
    await db.transaction(async tx => {
      await lockSchedule(tx, scope, expected);
      const [projectLink] = await tx.select({ id: projectAssets.id }).from(projectAssets)
        .where(and(eq(projectAssets.assetType, 'threed_watering_schedules'), eq(projectAssets.assetId, id))).limit(1);
      if (projectLink) throw new WateringScheduleConflict('This schedule has a retained Project assignment. You can mark it Inactive in Edit.', 409);
      const [task] = await tx.select({ id: threedTasks.id }).from(threedTasks).where(eq(threedTasks.wateringScheduleId, id)).limit(1);
      if (task) throw new WateringScheduleConflict('This schedule is linked to a Task. Remove the Task’s schedule link or mark the schedule Inactive.', 409);
      const [history] = await tx.select({ id: threedWateringHistory.id }).from(threedWateringHistory).where(eq(threedWateringHistory.scheduleId, id)).limit(1);
      if (history) throw new WateringScheduleConflict('This schedule has recorded watering history. You can mark it Inactive in Edit.', 409);
      await tx.delete(threedWateringSchedules).where(scope);
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return mutationFailure(error, 'delete');
  }
}
