import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { threedWateringHistory, threedWateringSchedules } from '@/libraries/schema/threed';
import { isSortOrder, moveRankedRow, SORT_ORDER_LIMIT, sortOrderError } from '@/libraries/services/threed/list-sort-order';
import { isMissingWateringSortOrder } from '@/libraries/services/threed/waterings/watering-list-query';
import { parseWateringScheduleChanges, parseWateringScheduleVersion, WateringScheduleInputError } from '@/libraries/services/threed/waterings/watering-schedule-edit';
import { parseWateringHistoryChanges, WateringHistoryInputError } from '@/libraries/services/threed/waterings/watering-history-edit';

class ManageError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function recordId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || value > 2147483647) throw new ManageError('Invalid Watering record ID.');
  return value;
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const view = new URL(request.url).searchParams.get('view');
    if (view !== 'schedules' && view !== 'history') throw new ManageError('Choose Schedules or History.');
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 81920) throw new ManageError('Watering update is too large.');
    let input: Record<string, unknown>;
    try { input = JSON.parse(text); } catch { throw new ManageError('Invalid Watering update JSON.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ManageError('Invalid Watering update.');

    const table = view === 'schedules' ? threedWateringSchedules : threedWateringHistory;
    const owned = eq(table.userId, session.user.id);
    if (input.action === 'set' && Object.keys(input).every(key => ['action', 'selection', 'changes'].includes(key))) {
      if (!Array.isArray(input.selection) || !input.selection.length || input.selection.length > 200) throw new ManageError('Select between 1 and 200 Watering records.');
      const versions = new Map<number, number>();
      for (const item of input.selection) {
        if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(key => key !== 'id' && key !== 'expectedUpdatedAt')) throw new ManageError('Invalid record selection.');
        const id = recordId(item.id);
        if (versions.has(id)) throw new ManageError('Select distinct Watering records.');
        versions.set(id, parseWateringScheduleVersion(item.expectedUpdatedAt, 'Watering record').getTime());
      }
      if (!input.changes || typeof input.changes !== 'object' || Array.isArray(input.changes) || !Object.keys(input.changes).length) throw new ManageError('Choose a field to update.');
      const { sortOrder, ...fields } = input.changes as Record<string, unknown>;
      if (Object.hasOwn(input.changes, 'sortOrder') && !isSortOrder(sortOrder)) throw new ManageError(sortOrderError);
      const hasSettings = Object.keys(fields).length > 0;
      const scheduleChanges = view === 'schedules' && hasSettings ? parseWateringScheduleChanges(fields) : {};
      const historyChanges = view === 'history' && hasSettings ? parseWateringHistoryChanges(fields) : {};
      const changes = { ...scheduleChanges, ...historyChanges, ...(isSortOrder(sortOrder) ? { sortOrder } : {}) };

      const updated = await db.transaction(async tx => {
        const scope = and(owned, inArray(table.id, [...versions.keys()]));
        const rows = await tx.select({
          id: table.id,
          updatedAt: table.updatedAt,
          minTemperature: view === 'schedules' ? threedWateringSchedules.minTemperature : sql<null>`null`,
          maxTemperature: view === 'schedules' ? threedWateringSchedules.maxTemperature : sql<null>`null`,
        }).from(table)
          .where(scope).orderBy(asc(table.id)).for('update');
        if (rows.length !== versions.size) throw new ManageError('Some selected records are unavailable. Refresh and select them again.', 404);
        for (const row of rows) {
          if (row.updatedAt.getTime() !== versions.get(row.id)) throw new ManageError('A selected record changed. Refresh and select the records again.', 409);
          if ('minTemperature' in scheduleChanges || 'maxTemperature' in scheduleChanges) {
            const min = scheduleChanges.minTemperature === undefined ? row.minTemperature : scheduleChanges.minTemperature;
            const max = scheduleChanges.maxTemperature === undefined ? row.maxTemperature : scheduleChanges.maxTemperature;
            if (min != null && max != null && min > max) throw new ManageError('Minimum temperature cannot exceed maximum temperature on any selected schedule.');
          }
        }
        const updatedAt = new Date(Math.max(Date.now(), ...rows.map(row => row.updatedAt.getTime() + 1)));
        await tx.update(table).set({ ...changes, updatedAt }).where(scope);
        return rows.length;
      });
      return NextResponse.json({ success: true, data: { updated } });
    }

    if (input.action !== 'move' || !Object.keys(input).every(key => ['action', 'sourceId', 'targetId', 'after'].includes(key))) throw new ManageError('Invalid Watering update.');
    const source = recordId(input.sourceId);
    const target = recordId(input.targetId);
    const after = input.after;
    if (source === target || typeof after !== 'boolean') throw new ManageError('Choose another row as the drop target.');
    const updated = await db.transaction(async tx => {
      const date = view === 'schedules' ? threedWateringSchedules.nextWatering : threedWateringHistory.executedAt;
      const locked = tx.$with('locked_waterings').as(tx.select({ id: table.id, sortOrder: table.sortOrder, date, createdAt: table.createdAt })
        .from(table).where(owned).orderBy(asc(table.id)).for('update'));
      const rows = await tx.with(locked).select({ id: locked.id, sortOrder: locked.sortOrder })
        .from(locked).orderBy(asc(locked.sortOrder), desc(locked.date), desc(locked.createdAt), desc(locked.id));
      const reordered = moveRankedRow(rows, source, target, after);
      if (!reordered) throw new ManageError('Watering record not found.', 404);
      if (reordered === rows) return 0;
      if (reordered.length > SORT_ORDER_LIMIT + 1) throw new ManageError('Too many Watering records to assign unique ranks.', 409);
      const changes = reordered.flatMap((row, index) => row.sortOrder === index ? [] : [{ id: row.id, sort_order: index }]);
      await tx.execute(sql`
        UPDATE ${table}
        SET sort_order = ranks.sort_order
        FROM jsonb_to_recordset(${JSON.stringify(changes)}::jsonb) AS ranks(id integer, sort_order integer)
        WHERE ${table.id} = ranks.id AND ${owned}
      `);
      return changes.length;
    });
    return NextResponse.json({ success: true, data: { updated } });
  } catch (error) {
    if (error instanceof ManageError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    if (error instanceof WateringScheduleInputError || error instanceof WateringHistoryInputError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    if (isMissingWateringSortOrder(error)) return NextResponse.json({ success: false, error: 'Apply the Waterings Sort Order migration and retry.' }, { status: 503 });
    return NextResponse.json({ success: false, error: 'Could not update the Watering records.' }, { status: 500 });
  }
}
