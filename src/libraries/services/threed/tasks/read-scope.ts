import { and, eq, getTableColumns, or, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { threedTasks } from '@/libraries/schema/threed';

const taskColumns = getTableColumns(threedTasks);
const { isPublic, ...legacyColumns } = taskColumns;
const legacySelection = { ...legacyColumns, isPublic: sql<null>`null` };
type TaskSelection = typeof taskColumns | typeof legacySelection;
type TaskReadSurface = 'catalog' | 'project' | 'stats';
export const taskVisibilityUnavailable = 'Task visibility needs the database migration. Task writes are unavailable until it is applied.';

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

export function isMissingTaskVisibilityColumn(error: unknown): boolean {
  for (let current = error; current && typeof current === 'object';) {
    const detail = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (detail.code === '42703' && typeof detail.message === 'string' &&
      /^column (?:"?threed_tasks"?\."?is_public"?|"is_public"(?: of relation "threed_tasks")?) does not exist$/.test(detail.message)) return true;
    if (!detail.cause || detail.cause === current) return false;
    current = detail.cause;
  }
  return false;
}

export async function readThreeDTasks<T>(
  userId: string | undefined,
  surface: TaskReadSurface,
  read: (scope: SQL, selection: TaskSelection) => Promise<T>,
): Promise<T> {
  try {
    return await read(taskReadScope(userId, surface), taskColumns);
  } catch (error) {
    if (!isMissingTaskVisibilityColumn(error)) throw error;
    console.warn('[Tasks API] Task visibility migration is missing (42703). Using owner-only reads.');
    return read(userId ? eq(threedTasks.userId, userId) : sql`false`, legacySelection);
  }
}
