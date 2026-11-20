import { and, eq, getTableColumns, or, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { threedTasks } from '@/libraries/schema/threed';

const taskColumns = getTableColumns(threedTasks);
const { isPublic } = taskColumns;
type TaskSelection = Omit<typeof taskColumns, 'isPublic' | 'sortOrder'> & {
  isPublic: typeof isPublic | SQL<null>;
  sortOrder: typeof taskColumns.sortOrder | SQL<null>;
};
type TaskReadSurface = 'catalog' | 'project' | 'stats';
export const taskVisibilityUnavailable = 'Task visibility needs the database migration. Task writes are unavailable until it is applied.';
export const taskSortOrderUnavailable = 'Task Sort Order needs the database migration. Task writes are unavailable until it is applied.';

function taskReadScope(userId: string | undefined, surface: TaskReadSurface): SQL {
  const publicTask = eq(isPublic, true);
  const shared = surface === 'catalog' ? and(publicTask, eq(threedTasks.status, 'pending'))! : publicTask;
  return userId ? or(eq(threedTasks.userId, userId), shared)! : shared;
}

export function readableTaskAssignment(assetId: SQLWrapper, scope: SQL): SQL {
  return sql`exists (
    select 1 from ${threedTasks}
    where ${threedTasks.id} = ${assetId} and ${scope}
  )`;
}

function isMissingTaskColumn(error: unknown, column: 'is_public' | 'sort_order'): boolean {
  const message = new RegExp(`^column (?:"?threed_tasks"?\\."?${column}"?|"${column}"(?: of relation "threed_tasks")?) does not exist$`);
  for (let current = error; current && typeof current === 'object';) {
    const detail = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (detail.code === '42703' && typeof detail.message === 'string' && message.test(detail.message)) return true;
    if (!detail.cause || detail.cause === current) return false;
    current = detail.cause;
  }
  return false;
}

export function isMissingTaskVisibilityColumn(error: unknown): boolean {
  return isMissingTaskColumn(error, 'is_public');
}

export function isMissingTaskSortOrderColumn(error: unknown): boolean {
  return isMissingTaskColumn(error, 'sort_order');
}

export async function readThreeDTasks<T>(
  userId: string | undefined,
  surface: TaskReadSurface,
  read: (scope: SQL, selection: TaskSelection) => Promise<T>,
): Promise<T> {
  let scope = taskReadScope(userId, surface);
  let selection: TaskSelection = taskColumns;
  for (;;) {
    try {
      return await read(scope, selection);
    } catch (error) {
      if (selection.isPublic === isPublic && isMissingTaskVisibilityColumn(error)) {
        console.warn('[Tasks API] Task visibility migration is missing (42703). Using owner-only reads.');
        scope = userId ? eq(threedTasks.userId, userId) : sql`false`;
        selection = { ...selection, isPublic: sql<null>`null` };
      } else if (selection.sortOrder === taskColumns.sortOrder && isMissingTaskSortOrderColumn(error)) {
        console.warn('[Tasks API] Task Sort Order migration is missing (42703). Reading Tasks without ranks.');
        selection = { ...selection, sortOrder: sql<null>`null` };
      } else {
        throw error;
      }
    }
  }
}
