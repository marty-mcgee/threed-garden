import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import type { db } from '@/libraries/db/client';
import { threedAssembly, threedAssemblyComponents, threedAssemblyModelAssignments, threedAssemblyRevisions, threedModels } from '@/libraries/schema/threed';
import { parseAssemblyDefinition, type AssemblyDefinition } from './assembly-group-core';

export class AssemblyWorkspaceError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function assemblyId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new AssemblyWorkspaceError('Invalid Assembly ID.');
  return value;
}

export function assemblyListQuery(params: URLSearchParams) {
  const offset = Number(params.get('offset') ?? 0);
  const limit = Number(params.get('limit') ?? 25);
  const search = (params.get('search') ?? '').trim();
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000 || ![25, 50, 100].includes(limit) || search.length > 120) throw new AssemblyWorkspaceError('Invalid Assembly list query.');
  return { offset, limit, search };
}

export async function listAssemblies(database: typeof db, ownerId: string, query = assemblyListQuery(new URLSearchParams())) {
  const condition = and(eq(threedAssembly.userId, ownerId), query.search ? sql`position(lower(${query.search}) in lower(${threedAssembly.name})) > 0` : undefined);
  const items = await database.select({
    id: threedAssembly.id,
    name: threedAssembly.name,
    updatedAt: threedAssembly.updatedAt,
    revision: sql<number>`coalesce((select max(r.revision) from ${threedAssemblyRevisions} r where r.assembly_id = ${threedAssembly.id}), 0)`.mapWith(Number),
  }).from(threedAssembly).where(condition).orderBy(desc(threedAssembly.updatedAt), threedAssembly.id).limit(query.limit).offset(query.offset);
  const [count] = await database.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(threedAssembly).where(condition);
  return { items, total: count.total, offset: query.offset, limit: query.limit };
}

export async function deleteAssembly(database: typeof db, ownerId: string, id: string, expected: number) {
  assemblyId(id);
  if (!Number.isSafeInteger(expected) || expected < 0 || expected > 2147483647) throw new AssemblyWorkspaceError('Invalid saved revision.');
  return database.transaction(async tx => {
    const [group] = await tx.select({ id: threedAssembly.id }).from(threedAssembly).where(and(eq(threedAssembly.id, id), eq(threedAssembly.userId, ownerId))).for('update');
    if (!group) throw new AssemblyWorkspaceError('Assembly not found.', 404);
    const [latest] = await tx.select({ revision: threedAssemblyRevisions.revision }).from(threedAssemblyRevisions).where(eq(threedAssemblyRevisions.assemblyId, id)).orderBy(desc(threedAssemblyRevisions.revision)).limit(1);
    if ((latest?.revision ?? 0) !== expected) throw new AssemblyWorkspaceError('This Assembly changed elsewhere. Refresh before deleting it.', 409);
    await tx.delete(threedAssemblyComponents).where(eq(threedAssemblyComponents.assemblyId, id));
    await tx.delete(threedAssemblyRevisions).where(eq(threedAssemblyRevisions.assemblyId, id));
    await tx.delete(threedAssemblyModelAssignments).where(eq(threedAssemblyModelAssignments.assemblyId, id));
    await tx.delete(threedAssembly).where(and(eq(threedAssembly.id, id), eq(threedAssembly.userId, ownerId)));
    return { id };
  });
}

export async function readAssembly(database: typeof db, ownerId: string, id: string): Promise<AssemblyDefinition> {
  assemblyId(id);
  return database.transaction(async tx => {
    const [group] = await tx.select().from(threedAssembly).where(and(eq(threedAssembly.id, id), eq(threedAssembly.userId, ownerId))).for('share');
    if (!group) throw new AssemblyWorkspaceError('Assembly not found.', 404);
    const [revision] = await tx.select().from(threedAssemblyRevisions).where(eq(threedAssemblyRevisions.assemblyId, id)).orderBy(desc(threedAssemblyRevisions.revision)).limit(1);
    if (!revision) throw new AssemblyWorkspaceError('Assembly has no saved composition.', 409);
    const components = await tx.select().from(threedAssemblyComponents)
      .where(and(eq(threedAssemblyComponents.assemblyId, id), eq(threedAssemblyComponents.revision, revision.revision)))
      .orderBy(threedAssemblyComponents.ordinal);
    return parseAssemblyDefinition({
      formatVersion: revision.formatVersion,
      id,
      ownerId,
      name: revision.name,
      revision: revision.revision,
      components: components.map(row => ({
        id: row.componentId,
        modelId: row.modelId,
        label: row.label,
        transform: {
          position: { x: row.positionX, y: row.positionY, z: row.positionZ },
          rotation: { x: row.rotationX, y: row.rotationY, z: row.rotationZ },
          scale: row.scale,
        },
      })),
    });
  });
}

export async function saveAssembly(database: typeof db, ownerId: string, input: unknown): Promise<AssemblyDefinition> {
  const body = input as { definition?: unknown; expectedRevision?: unknown } | null;
  if (!body || typeof body !== 'object' || Object.keys(body).some(key => !['definition', 'expectedRevision'].includes(key))) throw new AssemblyWorkspaceError('Invalid Assembly save.');
  const expected = body.expectedRevision;
  if (typeof expected !== 'number' || !Number.isInteger(expected) || expected < 0 || expected >= 2147483647) throw new AssemblyWorkspaceError('Invalid saved revision.');
  const definition = parseAssemblyDefinition(body.definition);
  if (definition.revision !== (expected || 1)) throw new AssemblyWorkspaceError('Assembly revision does not match the saved version.');
  assemblyId(definition.id);
  if (definition.ownerId !== ownerId) throw new AssemblyWorkspaceError('Assembly owner does not match your account.', 403);
  if (definition.components.some(component => component.modelId > 2147483647)) throw new AssemblyWorkspaceError('Invalid Model ID.');
  return database.transaction(async tx => {
    const [group] = await tx.select().from(threedAssembly)
      .where(and(eq(threedAssembly.id, definition.id), eq(threedAssembly.userId, ownerId))).for('update');
    if (expected === 0 && group) throw new AssemblyWorkspaceError('This Assembly already exists. Reopen it before saving changes.', 409);
    if (expected > 0 && !group) throw new AssemblyWorkspaceError('Assembly not found.', 404);
    if (group) {
      const [latest] = await tx.select({ revision: threedAssemblyRevisions.revision }).from(threedAssemblyRevisions)
        .where(eq(threedAssemblyRevisions.assemblyId, group.id)).orderBy(desc(threedAssemblyRevisions.revision)).limit(1);
      if (latest?.revision !== expected) throw new AssemblyWorkspaceError('This Assembly changed elsewhere. Export your draft before reopening the saved version.', 409);
    }
    const modelIds = [...new Set(definition.components.map(component => component.modelId))];
    const models = await tx.select({ id: threedModels.id }).from(threedModels).where(and(
      inArray(threedModels.id, modelIds),
      eq(threedModels.isActive, true),
      eq(threedModels.status, 'active'),
      sql`${threedModels.usedByCharacters} IS NOT TRUE`,
      or(eq(threedModels.userId, ownerId), and(eq(threedModels.isPublic, true), eq(threedModels.isLibraryItem, true))),
    )).for('share');
    if (models.length !== modelIds.length) throw new AssemblyWorkspaceError('A referenced Model is unavailable or is no longer eligible for your Library.', 409);
    const revision = expected + 1;
    if (!group) {
      const created = await tx.insert(threedAssembly).values({ id: definition.id, userId: ownerId, name: definition.name }).onConflictDoNothing().returning({ id: threedAssembly.id });
      if (!created.length) throw new AssemblyWorkspaceError('Assembly identity conflict. Export your draft and reopen the saved Assembly.', 409);
    } else {
      await tx.update(threedAssembly).set({ name: definition.name, updatedAt: new Date() }).where(and(eq(threedAssembly.id, group.id), eq(threedAssembly.userId, ownerId)));
    }
    await tx.insert(threedAssemblyModelAssignments).values(modelIds.map(modelId => ({ assemblyId: definition.id, modelId }))).onConflictDoNothing();
    await tx.insert(threedAssemblyRevisions).values({ assemblyId: definition.id, revision, formatVersion: 1, name: definition.name });
    await tx.insert(threedAssemblyComponents).values(definition.components.map((component, index) => ({
      assemblyId: definition.id,
      revision,
      componentId: component.id,
      ordinal: index + 1,
      modelId: component.modelId,
      label: component.label,
      positionX: component.transform.position.x,
      positionY: component.transform.position.y,
      positionZ: component.transform.position.z,
      rotationX: component.transform.rotation.x,
      rotationY: component.transform.rotation.y,
      rotationZ: component.transform.rotation.z,
      scale: component.transform.scale,
    })));
    return { ...definition, ownerId, revision };
  });
}
