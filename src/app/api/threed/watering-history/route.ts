import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, getTableColumns, sql, type SQL } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db, type Transaction } from '@/libraries/db/client';
import { threedFarmbots, threedPlantings, threedPlants, threedWateringHistory as history, threedWateringSchedules } from '@/libraries/schema/threed';
import { projectAssets } from '@/libraries/schema/project';
import { isMissingWateringSortOrder, parseWateringListQuery, parseWateringHistorySort } from '@/libraries/services/threed/waterings/watering-list-query';
import { parseNewWateringHistory, parseWateringHistoryChanges, WateringHistoryInputError, wateringHistoryTargets } from '@/libraries/services/threed/waterings/watering-history-edit';
import { parseWateringScheduleVersion, WateringScheduleInputError } from '@/libraries/services/threed/waterings/watering-schedule-edit';

const { sortOrder: rankColumn, ...historyFields } = getTableColumns(history);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const params = new URL(request.url).searchParams;
    let query;
    let sort;
    try {
      query = parseWateringListQuery(params);
      sort = parseWateringHistorySort(params);
    }
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
    const ordered = sort.direction === 'asc' ? asc(history[sort.field]) : desc(history[sort.field]);
    const last = desc(history.id);
    const primary = sort.field === 'executedAt' && sort.direction === 'desc' ? ordered : sql`${ordered} nulls last`;
    const chronological = [desc(history.executedAt), desc(history.createdAt), last];
    const load = async (withRank: boolean) => db.select({ ...historyFields, sortOrder: withRank ? rankColumn : sql<null>`null` }).from(history)
      .where(where).orderBy(...(sort.field === 'sortOrder' ? [...(withRank ? [ordered] : []), ...chronological] : [primary, last])).limit(limit).offset(offset);
    const data = await load(true).catch(error => {
      if (!isMissingWateringSortOrder(error)) throw error;
      return load(false);
    });
    return NextResponse.json({ success: true, data, pagination: { limit, offset, total: Number(count?.count ?? 0) } });
  } catch (error) {
    console.error('[Watering History API] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch watering history' }, { status: 500 });
  }
}

class HistoryConflict extends Error {
  constructor(message: string, readonly status: 404 | 409) { super(message); }
}

function historyScope(params: URLSearchParams, userId: string) {
  const raw = params.get('id') ?? '';
  const id = Number(raw);
  if (!/^[1-9]\d*$/.test(raw) || !Number.isInteger(id) || id > 2147483647) throw new WateringHistoryInputError('Invalid Watering History record ID.');
  return { id, scope: and(eq(history.id, id), eq(history.userId, userId)) };
}

async function historyBody(request: NextRequest): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > 49152) throw new WateringHistoryInputError('Watering history changes are too large.');
  try { return JSON.parse(text); } catch { throw new WateringHistoryInputError('Invalid Watering History JSON.'); }
}

async function lockHistory(tx: Transaction, scope: SQL | undefined, version: Date) {
  const [row] = await tx.select({ updatedAt: history.updatedAt }).from(history).where(scope).limit(1).for('update');
  if (!row) throw new HistoryConflict('Watering History entry not found.', 404);
  if (row.updatedAt.getTime() !== version.getTime()) {
    throw new HistoryConflict('The entry changed. Refresh History before trying again.', 409);
  }
  return row;
}

function mutationFailure(error: unknown, action: 'add' | 'update' | 'delete') {
  if (error instanceof WateringHistoryInputError || error instanceof WateringScheduleInputError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
  if (error instanceof HistoryConflict) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  return NextResponse.json({ success: false, error: `Could not ${action} the Watering History entry.` }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  try {
    const input = parseNewWateringHistory(await historyBody(request));
    const data = await db.transaction(async tx => {
      for (const [field, table] of [
        ['scheduleId', threedWateringSchedules],
        ['plantId', threedPlants],
        ['plantingId', threedPlantings],
        ['farmbotId', threedFarmbots],
      ] as const) {
        const id = input[field];
        if (id === undefined) continue;
        const [target] = await tx.select({ id: table.id }).from(table)
          .where(and(eq(table.id, id), eq(table.userId, userId))).limit(1).for('share');
        if (!target) throw new WateringHistoryInputError(`${wateringHistoryTargets[field]} is unavailable.`);
      }
      const [created] = await tx.insert(history).values({ ...input, userId, executedBy: 'manual' })
        .onConflictDoNothing({ target: history.historyId }).returning({ id: history.id });
      if (!created) throw new HistoryConflict('That History ID is already in use.', 409);
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
    const { id, scope } = historyScope(new URL(request.url).searchParams, session.user.id);
    const input = await historyBody(request) as Record<string, unknown>;
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'changes' && key !== 'expectedUpdatedAt')) {
      throw new WateringHistoryInputError('Invalid Watering History update.');
    }
    const changes = parseWateringHistoryChanges(input.changes);
    const version = parseWateringScheduleVersion(input.expectedUpdatedAt, 'Watering History');
    await db.transaction(async tx => {
      const row = await lockHistory(tx, scope, version);
      const updatedAt = new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1));
      await tx.update(history).set({ ...changes, updatedAt }).where(scope);
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return mutationFailure(error, 'update');
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    const { id, scope } = historyScope(params, session.user.id);
    const version = parseWateringScheduleVersion(params.get('expectedUpdatedAt'), 'Watering History');
    await db.transaction(async tx => {
      await lockHistory(tx, scope, version);
      await tx.delete(history).where(scope);
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return mutationFailure(error, 'delete');
  }
}
