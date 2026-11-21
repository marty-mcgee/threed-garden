import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Transaction } from '@/libraries/db/client';
import { threedModelFiles, threedModels } from '@/libraries/schema/threed';
import { parseModelFileEdit } from '@/libraries/services/threed/models/model-file-edit-core';
import {
  CatalogBulkError,
  checkBulkStamps,
  nextBulkTimestamp,
  type CatalogBulkChanges,
  type CatalogBulkScope,
  type CatalogBulkSelection,
} from './contract';

export async function updateBulkModelFiles(
  tx: Transaction,
  userId: string,
  selection: CatalogBulkSelection[],
  changes: CatalogBulkChanges,
  scope: CatalogBulkScope,
) {
  if (Object.keys(changes).length !== 1 || !('loadOrder' in changes)) {
    throw new CatalogBulkError('Choose Load order for the selected Model Files.');
  }
  const { loadOrder } = parseModelFileEdit(changes);
  const expectedParents = new Map<number, number>();
  for (const file of selection) {
    if (typeof file.modelId !== 'number' || !Number.isSafeInteger(file.modelId) || file.modelId <= 0 ||
        (scope.modelId !== undefined && file.modelId !== scope.modelId)) {
      throw new CatalogBulkError('Choose Model Files in the current parent scope.');
    }
    expectedParents.set(file.id, file.modelId);
  }
  const modelIds = [...new Set(expectedParents.values())];
  // Match the single File editor's lock order and keep all rows in the same transaction.
  const parents = await tx.select({ id: threedModels.id }).from(threedModels)
    .where(and(eq(threedModels.userId, userId), inArray(threedModels.id, modelIds)))
    .orderBy(asc(threedModels.id)).for('update');
  if (parents.length !== modelIds.length) throw new CatalogBulkError('Model or File not found.', 404);

  const filesInOwnedModels = and(
    eq(threedModelFiles.userId, userId),
    inArray(threedModelFiles.modelId, modelIds),
    inArray(threedModelFiles.id, [...expectedParents.keys()]),
  );
  const files = await tx.select({
    id: threedModelFiles.id,
    modelId: threedModelFiles.modelId,
    updatedAt: threedModelFiles.updatedAt,
  }).from(threedModelFiles).where(filesInOwnedModels).orderBy(asc(threedModelFiles.id)).for('update');
  if (files.length !== selection.length || files.some(file => file.modelId !== expectedParents.get(file.id))) {
    throw new CatalogBulkError('Model or File not found.', 404);
  }
  checkBulkStamps(selection, files);
  const updated = await tx.update(threedModelFiles).set({
    loadOrder,
    updatedAt: nextBulkTimestamp(files),
  }).where(filesInOwnedModels).returning({ id: threedModelFiles.id });
  if (updated.length !== selection.length) throw new CatalogBulkError('Model Files changed. Refresh and try again.', 409);
  return updated.length;
}
