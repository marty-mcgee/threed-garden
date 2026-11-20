import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { databaseConnectionDiagnostic } from '@/libraries/db/connection-diagnostics';
import { threedTasks } from '@/libraries/schema/threed';
import { parseBulkTaskEdit } from '@/libraries/services/threed/tasks/bulk-edit';
import { isMissingTaskSortOrderColumn, taskSortOrderUnavailable } from '@/libraries/services/threed/tasks/read-scope';

export async function PATCH(request: NextRequest) {
  try {
    const userId = (await auth())?.user?.id;
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let edit: ReturnType<typeof parseBulkTaskEdit>;
    try {
      edit = parseBulkTaskEdit(await request.json().catch(() => null));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid bulk edit.';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { ids, changes } = edit;
    const scope = and(eq(threedTasks.userId, userId), inArray(threedTasks.id, ids));
    const updated = await db.transaction(async tx => {
      const locked = await tx.select({ id: threedTasks.id }).from(threedTasks)
        .where(scope).orderBy(asc(threedTasks.id)).for('update');
      if (locked.length !== ids.length) return null;

      const now = new Date();
      const completion = changes.status === undefined ? {} : {
        completedAt: changes.status === 'completed'
          ? sql`CASE WHEN ${threedTasks.status} = 'completed' THEN ${threedTasks.completedAt} ELSE ${now.toISOString()}::timestamp END`
          : null,
      };
      const changed = await tx.update(threedTasks)
        .set({ ...changes, ...completion, updatedAt: now })
        .where(scope)
        .returning({ id: threedTasks.id });
      if (changed.length !== ids.length) throw new Error('The bulk update did not match the locked selection.');
      return changed.length;
    });
    if (updated === null) {
      return NextResponse.json({ success: false, error: 'Some selected Tasks are unavailable. Refresh the list and select them again.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    if (isMissingTaskSortOrderColumn(error)) {
      return NextResponse.json({ success: false, error: taskSortOrderUnavailable }, { status: 503 });
    }
    console.error('[Tasks Bulk API] PATCH error:', databaseConnectionDiagnostic(error));
    return NextResponse.json({ success: false, error: 'Failed to update selected Tasks' }, { status: 500 });
  }
}
