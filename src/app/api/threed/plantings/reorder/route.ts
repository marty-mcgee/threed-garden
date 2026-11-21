import { asc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { threedPlantings } from '@/libraries/schema/threed';
import { moveRankedRow, SORT_ORDER_LIMIT } from '@/libraries/services/threed/list-sort-order';
import { isMissingPlantingSortOrder } from '@/libraries/services/threed/plantings/planting-list-query';

class ReorderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function validId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647;
}

function parseMove(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).some(key => !['sourceId', 'targetId', 'after'].includes(key))) {
    throw new ReorderError('Invalid Planting reorder request.', 400);
  }
  const { sourceId, targetId, after } = input as Record<string, unknown>;
  if (!validId(sourceId) || !validId(targetId) || sourceId === targetId || typeof after !== 'boolean') {
    throw new ReorderError('Choose two different Plantings and a drop position.', 400);
  }
  return {
    sourceId,
    targetId,
    after,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new ReorderError('Unauthorized', 401);
    if (new URL(request.url).search) throw new ReorderError('Plantings can be reordered only in the full Admin list.', 400);
    const { sourceId, targetId, after } = parseMove(await request.json().catch(() => null));
    const owned = eq(threedPlantings.userId, session.user.id);
    const updated = await db.transaction(async tx => {
      // Acquire row locks in ID order so simultaneous moves use the same lock order.
      const locked = tx.$with('locked_plantings').as(
        tx.select({
          id: threedPlantings.id,
          plantingId: threedPlantings.plantingId,
          sortOrder: threedPlantings.sortOrder,
        })
          .from(threedPlantings)
          .where(owned)
          .orderBy(asc(threedPlantings.id))
          .for('update'),
      );
      const rows = await tx.with(locked).select({
        id: locked.id,
        sortOrder: locked.sortOrder,
      })
        .from(locked)
        .orderBy(asc(locked.sortOrder), asc(locked.plantingId), asc(locked.id));
      const reordered = moveRankedRow(rows, sourceId, targetId, after);
      if (!reordered) throw new ReorderError('Planting not found.', 404);
      if (reordered === rows) return 0;
      if (reordered.length > SORT_ORDER_LIMIT + 1) throw new ReorderError('Too many Plantings to assign unique ranks.', 409);
      const changes = reordered.flatMap((row, index) => row.sortOrder === index ? [] : [{
        id: row.id,
        sort_order: index,
      }]);
      await tx.execute(sql`
        UPDATE ${threedPlantings} SET sort_order = ranks.sort_order
        FROM jsonb_to_recordset(${JSON.stringify(changes)}::jsonb) AS ranks(id integer, sort_order integer)
        WHERE ${threedPlantings.id} = ranks.id AND ${owned}
      `);
      return changes.length;
    });
    return NextResponse.json({
      success: true,
      data: { updated },
    });
  } catch (error) {
    let failure: ReorderError;
    if (error instanceof ReorderError) {
      failure = error;
    } else if (isMissingPlantingSortOrder(error)) {
      failure = new ReorderError('Apply the Plantings Sort Order migration and retry.', 503);
    } else {
      failure = new ReorderError('Could not save Plantings Sort Order.', 500);
    }
    return NextResponse.json({
      success: false,
      error: failure.message,
    }, { status: failure.status });
  }
}
