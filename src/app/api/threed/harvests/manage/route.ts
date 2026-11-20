import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { projectAssets } from '@/libraries/schema/project';
import { threedHarvests as harvest } from '@/libraries/schema/threed';
import { moveRankedRow, SORT_ORDER_LIMIT } from '@/libraries/services/threed/list-sort-order';
import { HarvestInputError, parseHarvestBulkChanges } from '@/libraries/services/threed/harvests/harvest-edit';
import { isMissingHarvestSortOrder } from '@/libraries/services/threed/harvests/harvest-list-query';

class HarvestManageError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function recordId(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 2147483647) throw new HarvestInputError('Invalid Harvest record ID.');
  return value;
}

function parseVersion(value: unknown) {
  if (value === null) return null;
  if (typeof value !== 'string') throw new HarvestInputError('Invalid Harvest version.');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw new HarvestInputError('Invalid Harvest version.');
  return date.getTime();
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  try {
    const projectText = new URL(request.url).searchParams.get('projectId');
    const projectId = projectText === null ? null : recordId(/^\d+$/.test(projectText) ? Number(projectText) : null);
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 65536) throw new HarvestInputError('Harvest changes are too large.');
    let input: Record<string, unknown>;
    try { input = JSON.parse(text); } catch { throw new HarvestInputError('Invalid Harvest JSON.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HarvestInputError('Invalid Harvest update.');
    const owned = eq(harvest.userId, userId);
    if (input.action === 'set' && Object.keys(input).every(key => ['action', 'selection', 'changes'].includes(key))) {
      if (!Array.isArray(input.selection) || !input.selection.length || input.selection.length > 200) throw new HarvestInputError('Select between 1 and 200 Harvests.');
      const versions = new Map<number, number | null>();
      for (const item of input.selection) {
        if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(key => key !== 'id' && key !== 'expectedUpdatedAt')) throw new HarvestInputError('Invalid Harvest selection.');
        const id = recordId(item.id);
        if (versions.has(id)) throw new HarvestInputError('Select distinct Harvests.');
        versions.set(id, parseVersion(item.expectedUpdatedAt));
      }
      const changes = parseHarvestBulkChanges(input.changes);
      const updated = await db.transaction(async tx => {
        const scope = and(owned, inArray(harvest.id, [...versions.keys()]), projectId === null ? undefined : sql`exists (
          select 1 from ${projectAssets} where ${projectAssets.userId} = ${userId}
            and ${projectAssets.projectId} = ${projectId} and ${projectAssets.moduleType} = 'threed'
            and ${projectAssets.assetType} = 'threed_harvests' and ${projectAssets.isActive} = true
            and ${projectAssets.assetId} = ${harvest.id}
        )`);
        const rows = await tx.select({ id: harvest.id, updatedAt: harvest.updatedAt }).from(harvest)
          .where(scope).orderBy(asc(harvest.id)).for('update');
        if (rows.length !== versions.size) throw new HarvestManageError('Some selected Harvests are unavailable. Refresh and select them again.', 404);
        for (const row of rows) {
          if ((row.updatedAt?.getTime() ?? null) !== versions.get(row.id)) throw new HarvestManageError('A selected Harvest changed. Refresh and select the records again.', 409);
        }
        const updatedAt = new Date(Math.max(Date.now(), ...rows.map(row => (row.updatedAt?.getTime() ?? 0) + 1)));
        const updatedRows = await tx.update(harvest).set({ ...changes, updatedAt }).where(scope).returning({ id: harvest.id });
        if (updatedRows.length !== rows.length) throw new HarvestManageError('The selection changed. Refresh Harvests and retry.', 409);
        return updatedRows.length;
      });
      return NextResponse.json({ success: true, data: { updated } });
    }

    if (projectId !== null || input.action !== 'move' || !Object.keys(input).every(key => ['action', 'sourceId', 'targetId', 'after'].includes(key))) throw new HarvestInputError('Invalid Harvest reorder request.');
    const source = recordId(input.sourceId);
    const target = recordId(input.targetId);
    const after = input.after;
    if (source === target || typeof after !== 'boolean') throw new HarvestInputError('Choose another row as the drop target.');
    const updated = await db.transaction(async tx => {
      const locked = tx.$with('locked_harvests').as(tx.select({ id: harvest.id, sortOrder: harvest.sortOrder, harvestDate: harvest.harvestDate, createdAt: harvest.createdAt })
        .from(harvest).where(owned).orderBy(asc(harvest.id)).for('update'));
      const rows = await tx.with(locked).select({ id: locked.id, sortOrder: locked.sortOrder }).from(locked)
        .orderBy(asc(locked.sortOrder), desc(locked.harvestDate), desc(locked.createdAt), desc(locked.id));
      const reordered = moveRankedRow(rows, source, target, after);
      if (!reordered) throw new HarvestManageError('Harvest not found.', 404);
      if (reordered === rows) return 0;
      if (reordered.length > SORT_ORDER_LIMIT + 1) throw new HarvestManageError('Too many Harvests to assign unique ranks.', 409);
      const changes = reordered.flatMap((row, index) => row.sortOrder === index ? [] : [{ id: row.id, sort_order: index }]);
      await tx.execute(sql`
        UPDATE ${harvest} SET sort_order = ranks.sort_order
        FROM jsonb_to_recordset(${JSON.stringify(changes)}::jsonb) AS ranks(id integer, sort_order integer)
        WHERE ${harvest.id} = ranks.id AND ${owned}
      `);
      return changes.length;
    });
    return NextResponse.json({ success: true, data: { updated } });
  } catch (error) {
    if (error instanceof HarvestInputError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    if (error instanceof HarvestManageError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    if (isMissingHarvestSortOrder(error)) return NextResponse.json({ success: false, error: 'Apply the Harvests Sort Order migration and retry.' }, { status: 503 });
    return NextResponse.json({ success: false, error: 'Could not update the selected Harvests.' }, { status: 500 });
  }
}
