import { randomUUID } from 'node:crypto';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { Transaction } from '@/libraries/db/client';
import { threedAnimationCategories as categories } from '@/libraries/schema/threed';
import { CatalogBulkError, checkBulkStamps, nextBulkTimestamp, type CatalogBulkSelection } from './contract';

export async function renameBulkAnimationCategories(
  tx: Transaction,
  userId: string,
  selection: CatalogBulkSelection[],
  names: ReadonlyMap<number, string>,
) {
  const owned = eq(categories.userId, userId);
  const ids = selection.map(item => item.id);
  const rows = await tx.select({
    id: categories.id,
    name: categories.name,
    updatedAt: categories.updatedAt,
  }).from(categories).where(and(owned, inArray(categories.id, ids))).orderBy(asc(categories.id)).for('update');
  checkBulkStamps(selection, rows);
  const finalNames = rows.map(row => names.get(row.id)?.trim() ?? row.name);
  if (finalNames.some(name => !name || name.length > 120) || new Set(finalNames).size !== rows.length) {
    throw new CatalogBulkError('Give each selected Animation Category a distinct name of 1–120 characters.', 400);
  }
  const changed = rows.flatMap((row, index) => row.name === finalNames[index] ? [] : [{
    id: row.id,
    name: finalNames[index],
  }]);
  if (!changed.length) return rows.length;
  const scope = and(owned, inArray(categories.id, changed.map(row => row.id)));
  // The owner/name index is immediate. Temporary names permit a swap in one transaction.
  try {
    const staged = await tx.update(categories).set({
      name: sql`concat(${'bulk-' + randomUUID() + '-'}::text, ${categories.id})`,
    }).where(scope).returning({ id: categories.id });
    if (staged.length !== changed.length) throw new CatalogBulkError('The Category selection changed. Refresh and select again.', 409);
    const cases = changed.map(row => sql`when ${row.id} then ${row.name}::text`);
    const saved = await tx.update(categories).set({
      name: sql`case ${categories.id} ${sql.join(cases, sql` `)} end`,
      updatedAt: nextBulkTimestamp(rows),
    }).where(scope).returning({ id: categories.id });
    if (saved.length !== changed.length) throw new CatalogBulkError('The Category selection changed. Refresh and select again.', 409);
  } catch (error) {
    for (let cause = error, depth = 0; cause && typeof cause === 'object' && depth < 5; depth++) {
      const pg = cause as { code?: string; constraint?: string; cause?: unknown };
      if (pg.code === '23505' && pg.constraint === 'idx_animation_categories_owner_name') {
        throw new CatalogBulkError('An Animation Category already uses one of the requested names.', 409);
      }
      cause = pg.cause;
    }
    throw error;
  }
  return rows.length;
}
