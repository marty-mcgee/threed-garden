import { and, asc, eq, inArray } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { Transaction } from '@/libraries/db/client';
import {
  threedAnimationActionSlots,
  threedAnimations,
  threedBeds,
  threedCharacters,
  threedFarmbots,
  threedModelCategories,
  threedModels,
  threedModelTextures,
  threedPlantings,
  threedPlants,
} from '@/libraries/schema/threed';
import {
  CatalogBulkError,
  checkBulkStamps,
  nextBulkTimestamp,
  type CatalogBulkChanges,
  type CatalogBulkSelection,
} from './contract';

const tables = {
  plants: threedPlants,
  plantings: threedPlantings,
  beds: threedBeds,
  farmbots: threedFarmbots,
  models: threedModels,
  characters: threedCharacters,
  'model-categories': threedModelCategories,
  'model-textures': threedModelTextures,
  animations: threedAnimations,
  'animation-slots': threedAnimationActionSlots,
};

export async function updateCatalogRecords(
  tx: Transaction,
  userId: string,
  resource: keyof typeof tables,
  selection: CatalogBulkSelection[],
  changes: CatalogBulkChanges,
) {
  const table: PgTable & {
    id: AnyPgColumn<{ data: number; notNull: true }>;
    userId: AnyPgColumn<{ data: string }>;
    updatedAt: AnyPgColumn<{ data: Date }>;
  } = tables[resource];
  const scope = and(eq(table.userId, userId), inArray(table.id, selection.map(row => row.id)));
  const rows = await tx.select({
    id: table.id,
    updatedAt: table.updatedAt,
    ...(resource === 'plantings' && Object.hasOwn(changes, 'sortOrder') && { sortOrder: threedPlantings.sortOrder }),
  }).from(table).where(scope).orderBy(asc(table.id)).for('update');
  checkBulkStamps(selection, rows);
  const saved = await tx.update(table).set({
    ...changes,
    updatedAt: nextBulkTimestamp(rows),
  }).where(scope).returning({ id: table.id });
  if (saved.length !== selection.length) throw new CatalogBulkError('The selection changed. Refresh and retry.', 409);
  return saved.length;
}
