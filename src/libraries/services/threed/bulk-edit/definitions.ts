import { and, asc, eq, exists, inArray, sql } from 'drizzle-orm';
import type { Transaction } from '@/libraries/db/client';
import { project, projectThreed } from '@/libraries/schema/project';
import { threed, threedScenarios, threedSimulations } from '@/libraries/schema/threed';
import { SimulationInputError, simulationFields } from '@/libraries/services/threed/simulations/simulation-input';
import { simulationReferenceChoices, validateSimulationReferences } from '@/libraries/services/threed/simulations/simulation-references';
import {
  CatalogBulkError,
  checkBulkStamps,
  nextBulkTimestamp,
  type CatalogBulkChanges,
  type CatalogBulkScope,
  type CatalogBulkSelection,
} from './contract';

export async function updateBulkDefinitions(
  tx: Transaction,
  userId: string,
  resource: 'scenarios' | 'simulations',
  selection: CatalogBulkSelection[],
  changes: CatalogBulkChanges,
  scope: CatalogBulkScope,
) {
  const table = resource === 'scenarios' ? threedScenarios : threedSimulations;
  const assignment = tx.select({ id: projectThreed.id }).from(projectThreed)
    .innerJoin(project, eq(project.id, projectThreed.projectId))
    .innerJoin(threed, eq(threed.id, projectThreed.threedId))
    .where(and(
      eq(projectThreed.projectId, table.projectId),
      eq(projectThreed.threedId, table.threedId),
      eq(projectThreed.userId, userId),
      eq(project.userId, userId),
      eq(threed.userId, userId),
    )).for('share');
  const where = and(
    eq(table.userId, userId),
    inArray(table.id, selection.map(item => item.id)),
    scope.projectId === undefined ? undefined : eq(table.projectId, scope.projectId),
    exists(assignment),
  );
  const update = {
    ...(typeof changes.isActive === 'boolean' && { isActive: changes.isActive }),
    ...(changes.description === null || typeof changes.description === 'string' ? { description: changes.description } : {}),
  };
  if (resource === 'scenarios') {
    const rows = await tx.select({
      id: threedScenarios.id,
      updatedAt: threedScenarios.updatedAt,
    }).from(threedScenarios).where(where).orderBy(asc(threedScenarios.id)).for('update');
    checkBulkStamps(selection, rows);
    const saved = await tx.update(threedScenarios).set({
      ...update,
      updatedAt: nextBulkTimestamp(rows),
    }).where(where).returning({ id: threedScenarios.id });
    if (saved.length !== rows.length) throw new CatalogBulkError('The Scenario selection changed. Refresh and select again.', 409);
    return saved.length;
  }

  const rows = await tx.select().from(threedSimulations).where(where).orderBy(asc(threedSimulations.id)).for('update');
  checkBulkStamps(selection, rows);
  const modules = new Map<string, NonNullable<Awaited<ReturnType<typeof simulationReferenceChoices>>>>();
  for (const row of rows) {
    const key = row.projectId + '/' + row.threedId;
    let choices = modules.get(key);
    if (!choices) {
      const available = await simulationReferenceChoices(tx, userId, row.projectId, row.threedId);
      if (!available) throw new CatalogBulkError('A selected Simulation’s Project module is unavailable.', 404);
      choices = available;
      modules.set(key, choices);
    }
    try {
      const fields = simulationFields({
        name: row.name,
        slug: row.slug,
        description: row.description,
        isActive: row.isActive,
        definition: row.definition,
        ...update,
      }, true);
      await validateSimulationReferences(tx, choices, fields.definition, row.projectId, userId);
    } catch (error) {
      if (error instanceof SimulationInputError) throw new CatalogBulkError(error.message, 400);
      throw error;
    }
  }
  const saved = await tx.update(threedSimulations).set({
    ...update,
    revision: sql`${threedSimulations.revision} + 1`,
    updatedAt: nextBulkTimestamp(rows),
  }).where(where).returning({ id: threedSimulations.id });
  if (saved.length !== rows.length) throw new CatalogBulkError('The Simulation selection changed. Refresh and select again.', 409);
  return saved.length;
}
