import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import type { db } from '@/libraries/db/client';
import { threedAssembly, threedAssemblyComponents, threedAssemblyModelAssignments, threedAssemblyRevisions, threedModels } from '@/libraries/schema/threed';
import { parseAssemblyDefinition, type AssemblyDefinition } from './assembly-group-core';
import { isSortOrder, moveRankedRow, SORT_ORDER_LIMIT, sortOrderError } from '../list-sort-order';

export class AssemblyWorkspaceError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function assemblyId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new AssemblyWorkspaceError('Invalid Assembly ID.');
  return value;
}

type AssemblyListQuery = {
  offset: number;
  limit: number;
  search: string;
  sort: 'name' | 'updatedAt' | 'revision' | 'sortOrder' | 'isActive';
  direction: 'asc' | 'desc';
};

export function assemblyListQuery(params: URLSearchParams): AssemblyListQuery {
  const offset = Number(params.get('offset') ?? 0);
  const limit = Number(params.get('limit') ?? 25);
  const search = (params.get('search') ?? '').trim();
  const sort = params.get('sort') ?? 'updatedAt';
  const direction = params.get('direction') ?? (sort === 'updatedAt' ? 'desc' : 'asc');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000 || ![25, 50, 100].includes(limit) ||
      search.length > 120 || (sort !== 'name' && sort !== 'updatedAt' && sort !== 'revision' && sort !== 'sortOrder' && sort !== 'isActive') ||
      (direction !== 'asc' && direction !== 'desc')) throw new AssemblyWorkspaceError('Invalid Assembly list query.');
  return { offset, limit, search, sort, direction };
}

export async function listAssemblies(database: typeof db, ownerId: string, query = assemblyListQuery(new URLSearchParams())) {
  const condition = and(eq(threedAssembly.userId, ownerId), query.search ? sql`position(lower(${query.search}) in lower(${threedAssembly.name})) > 0` : undefined);
  type Item = {
    id: string;
    name: string;
    updatedAt: Date;
    revision: number;
    sortOrder: number | null;
    isActive: boolean | null;
  };
  const readItems = async (withRank: boolean, withActivity: boolean): Promise<Item[]> => {
    const columns = {
      id: threedAssembly.id,
      name: threedAssembly.name,
      updatedAt: threedAssembly.updatedAt,
      revision: sql<number>`coalesce((select max(r.revision) from ${threedAssemblyRevisions} r where r.assembly_id = ${threedAssembly.id}), 0)`.mapWith(Number),
      sortOrder: withRank ? threedAssembly.sortOrder : sql<null>`null`,
      isActive: withActivity ? threedAssembly.isActive : sql<null>`null`,
    };
    const direction = query.direction === 'asc' ? asc : desc;
    const order = query.sort === 'sortOrder'
      ? [...(withRank ? [direction(threedAssembly.sortOrder)] : []), asc(threedAssembly.name)]
      : query.sort === 'isActive'
        ? [...(withActivity ? [direction(threedAssembly.isActive)] : []), asc(threedAssembly.name)]
        : [direction(columns[query.sort])];
    try {
      return await database.select(columns).from(threedAssembly).where(condition)
        .orderBy(...order, asc(threedAssembly.id)).limit(query.limit).offset(query.offset);
    } catch (error) {
      if (withRank && isMissingAssemblyColumn(error, 'sort_order')) return readItems(false, withActivity);
      if (withActivity && isMissingAssemblyColumn(error, 'is_active')) return readItems(withRank, false);
      throw error;
    }
  };
  const items = await readItems(true, true);
  const [count] = await database.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(threedAssembly).where(condition);
  return { items, total: count.total, offset: query.offset, limit: query.limit };
}

export function isMissingAssemblyColumn(error: unknown, column: 'sort_order' | 'is_active') {
  const message = new RegExp(`^column (?:"?threed_assembly"?\\."?${column}"?|"${column}"(?: of relation "threed_assembly")?) does not exist$`);
  for (let current = error, depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const cause = current as { code?: string; message?: string; cause?: unknown };
    if (cause.code === '42703' && message.test(cause.message ?? '')) {
      return true;
    }
    current = cause.cause;
  }
  return false;
}

export async function updateAssemblyList(database: typeof db, ownerId: string, input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AssemblyWorkspaceError('Invalid Assembly Group update.');
  const body = input as Record<string, unknown>;
  const owned = eq(threedAssembly.userId, ownerId);
  if (body.action === 'set' && Object.keys(body).every(key => ['action', 'ids', 'sortOrder', 'isActive'].includes(key))) {
    if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 100) throw new AssemblyWorkspaceError('Select between 1 and 100 Assembly Groups.');
    const ids = body.ids.map(assemblyId);
    if (new Set(ids).size !== ids.length) throw new AssemblyWorkspaceError('Select distinct Assembly Groups.');
    const changes: { sortOrder?: number; isActive?: boolean } = {};
    if ('sortOrder' in body) {
      if (!isSortOrder(body.sortOrder)) throw new AssemblyWorkspaceError(sortOrderError);
      changes.sortOrder = body.sortOrder;
    }
    if ('isActive' in body) {
      if (typeof body.isActive !== 'boolean') throw new AssemblyWorkspaceError('Choose Active or Inactive.');
      changes.isActive = body.isActive;
    }
    if (!Object.keys(changes).length) throw new AssemblyWorkspaceError('Choose a field to update.');
    return database.transaction(async tx => {
      const scope = and(owned, inArray(threedAssembly.id, ids));
      const groups = await tx.select({ id: threedAssembly.id }).from(threedAssembly)
        .where(scope).orderBy(asc(threedAssembly.id)).for('update');
      if (groups.length !== ids.length) throw new AssemblyWorkspaceError('Some selected Assembly Groups are unavailable. Refresh and select them again.', 404);
      await tx.update(threedAssembly).set(changes).where(scope);
      return { updated: groups.length };
    });
  }

  if (body.action !== 'move' || !Object.keys(body).every(key => ['action', 'sourceId', 'targetId', 'after'].includes(key))) {
    throw new AssemblyWorkspaceError('Invalid Assembly Group order change.');
  }
  const source = assemblyId(body.sourceId);
  const target = assemblyId(body.targetId);
  const after = body.after;
  if (source === target || typeof after !== 'boolean') throw new AssemblyWorkspaceError('Choose another Assembly Group as the drop target.');

  return database.transaction(async tx => {
    const locked = tx.$with('locked_assemblies').as(
      tx.select({ id: threedAssembly.id, name: threedAssembly.name, sortOrder: threedAssembly.sortOrder })
        .from(threedAssembly).where(owned).orderBy(asc(threedAssembly.id)).for('update'),
    );
    const groups = await tx.with(locked).select({ id: locked.id, sortOrder: locked.sortOrder })
      .from(locked).orderBy(asc(locked.sortOrder), asc(locked.name), asc(locked.id));
    const reordered = moveRankedRow(groups, source, target, after);
    if (!reordered) throw new AssemblyWorkspaceError('Assembly Group not found.', 404);
    if (reordered === groups) return { updated: 0 };
    if (reordered.length > SORT_ORDER_LIMIT + 1) throw new AssemblyWorkspaceError('Too many Assembly Groups to assign unique ranks.', 409);
    const changes = reordered.flatMap((group, index) => group.sortOrder === index ? [] : [{
      id: group.id,
      sort_order: index,
    }]);
    await tx.execute(sql`
      UPDATE ${threedAssembly}
      SET sort_order = ranks.sort_order
      FROM jsonb_to_recordset(${JSON.stringify(changes)}::jsonb) AS ranks(id text, sort_order integer)
      WHERE ${threedAssembly.id} = ranks.id AND ${owned}
    `);
    return { updated: changes.length };
  });
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
    const [group] = await tx.select({ id: threedAssembly.id }).from(threedAssembly).where(and(eq(threedAssembly.id, id), eq(threedAssembly.userId, ownerId))).for('share');
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
    const [group] = await tx.select({ id: threedAssembly.id }).from(threedAssembly)
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
