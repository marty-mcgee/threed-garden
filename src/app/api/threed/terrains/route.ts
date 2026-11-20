import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { projectAssets } from '@/libraries/schema/project';
import { projectTerrainPlacements, threedTerrainRevisions, threedTerrains } from '@/libraries/schema/threed';
import { maxTerrainRequestBytes, parseTerrainDefinition, TerrainInputError } from '@/libraries/services/threed/terrains/terrain-core';
import { isSortOrder, moveRankedRow, SORT_ORDER_LIMIT, sortOrderError } from '@/libraries/services/threed/list-sort-order';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

class TerrainOperationError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const id = Number(request.nextUrl.searchParams.get('id'));
    const revision = Number(request.nextUrl.searchParams.get('revision'));
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(revision) || revision <= 0) {
      throw new TerrainOperationError('Invalid Terrain deletion request.', 400);
    }
    await db.transaction(async tx => {
      const [owned] = await tx.select({ id: threedTerrains.id }).from(threedTerrains)
        .where(and(eq(threedTerrains.id, id), eq(threedTerrains.userId, session.user!.id!))).limit(1).for('update');
      if (!owned) throw new TerrainOperationError('This Terrain record does not exist, or is not available for edit by this User.', 404);
      const [latest] = await tx.select({ revision: threedTerrainRevisions.revision }).from(threedTerrainRevisions)
        .where(eq(threedTerrainRevisions.terrainId, id)).orderBy(desc(threedTerrainRevisions.revision)).limit(1);
      if (latest?.revision !== revision) throw new TerrainOperationError('Terrain changed. Refresh the list before deleting.', 409);
      const [placement] = await tx.select({ id: projectTerrainPlacements.id }).from(projectTerrainPlacements).where(eq(projectTerrainPlacements.terrainId, id)).limit(1);
      const [asset] = await tx.select({ id: projectAssets.id }).from(projectAssets).where(and(eq(projectAssets.assetType, 'threed_terrains'), eq(projectAssets.assetId, id))).limit(1);
      if (placement) throw new TerrainOperationError('This Terrain has a saved Project placement and cannot be deleted.', 409);
      if (asset) throw new TerrainOperationError('This Terrain has a retained Project asset assignment and cannot be deleted. Removing an assignment only marks it inactive; inactive assignment records also protect the Terrain.', 409);
      await tx.delete(threedTerrainRevisions).where(eq(threedTerrainRevisions.terrainId, id));
      await tx.delete(threedTerrains).where(eq(threedTerrains.id, id));
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

function isMissingTerrainListColumns(error: unknown) {
  for (let current = error, depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const cause = current as { code?: string; message?: string; cause?: unknown };
    if (cause.code === '42703' && /^column (?:"?threed_terrains"?\."?(?:sort_order|is_active)"?|"(?:sort_order|is_active)"(?: of relation "threed_terrains")?) does not exist$/.test(cause.message ?? '')) {
      return true;
    }
    current = cause.cause;
  }
  return false;
}

function errorResponse(error: unknown) {
  if (error instanceof TerrainOperationError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  if (error instanceof TerrainInputError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
  if (error instanceof Error && error.message === 'Terrain changed. Reload it before saving a revision.') {
    return NextResponse.json({ success: false, error: error.message }, { status: 409 });
  }
  if (isMissingTerrainListColumns(error)) {
    return NextResponse.json({ success: false, error: 'Apply the Terrains Sort Order and Active status migration and retry.' }, { status: 503 });
  }
  return NextResponse.json({ success: false, error: 'Terrain operation failed. Keep your draft and retry.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  try {
    const idText = request.nextUrl.searchParams.get('id');
    if (idText !== null) {
      const terrainId = Number(idText);
      if (!Number.isSafeInteger(terrainId) || terrainId <= 0) throw new TerrainInputError('Invalid Terrain ID.');
      const [terrain] = await db.select({
        id: threedTerrains.id,
        userId: threedTerrains.userId,
        name: threedTerrains.name,
        createdAt: threedTerrains.createdAt,
        updatedAt: threedTerrains.updatedAt,
      }).from(threedTerrains).where(and(eq(threedTerrains.id, terrainId), eq(threedTerrains.userId, userId))).limit(1);
      if (!terrain) return NextResponse.json({ success: false, error: 'Terrain not found' }, { status: 404 });
      const revisions = await db.select().from(threedTerrainRevisions).where(eq(threedTerrainRevisions.terrainId, terrainId)).orderBy(desc(threedTerrainRevisions.revision));
      return NextResponse.json({ success: true, data: { ...terrain, revisions } }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const paged = request.nextUrl.searchParams.get('paged') === '1';
    const search = (request.nextUrl.searchParams.get('search') ?? '').trim();
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? '25');
    const offset = Number(request.nextUrl.searchParams.get('offset') ?? '0');
    const sortBy = paged ? request.nextUrl.searchParams.get('sortBy') ?? 'updatedAt' : 'updatedAt';
    const sortDir = paged ? request.nextUrl.searchParams.get('sortDir') ?? 'desc' : 'desc';
    if (!['name', 'revision', 'updatedAt', 'sortOrder', 'isActive'].includes(sortBy) || !['asc', 'desc'].includes(sortDir)) {
      throw new TerrainInputError('Invalid Terrain sort request.');
    }
    if (paged && (search.length > 120 || ![25, 50, 100].includes(limit) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000)) {
      throw new TerrainInputError('Invalid Terrain list request.');
    }
    const ownerFilter = eq(threedTerrains.userId, userId);
    const latestRevision = sql<number>`(select max(revision) from threed_terrain_revisions where terrain_id = ${threedTerrains.id})`;
    const order = sortDir === 'asc' ? asc : desc;
    const listFilter = paged && search ? and(ownerFilter, ilike(threedTerrains.name, `%${search.replace(/[\\%_]/g, '\\$&')}%`)) : ownerFilter;
    const fields = {
      id: threedTerrains.id,
      name: threedTerrains.name,
      updatedAt: threedTerrains.updatedAt,
      revision: latestRevision,
    };
    const headers = { 'Cache-Control': 'private, no-store' };
    if (!paged) {
      const terrains = await db.select(fields).from(threedTerrains).where(ownerFilter)
        .orderBy(desc(threedTerrains.updatedAt), desc(threedTerrains.id)).limit(100);
      return NextResponse.json({ success: true, data: terrains }, { headers });
    }
    const loadPage = async (withListFields: boolean) => {
      const selection = {
        ...fields,
        sortOrder: withListFields ? threedTerrains.sortOrder : sql<null>`null`,
        isActive: withListFields ? threedTerrains.isActive : sql<null>`null`,
      };
      const sortFields = sortBy === 'sortOrder' || sortBy === 'isActive'
        ? [...(withListFields ? [order(selection[sortBy])] : []), asc(threedTerrains.name), asc(threedTerrains.id)]
        : [order(fields[sortBy as keyof typeof fields]), order(threedTerrains.id)];
      return db.select(selection).from(threedTerrains).where(listFilter).orderBy(...sortFields).limit(limit).offset(offset);
    };
    const terrains = await loadPage(true).catch(error => {
      if (!isMissingTerrainListColumns(error)) throw error;
      return loadPage(false);
    });
    const [total] = await db.select({ count: sql<number>`count(*)::integer` }).from(threedTerrains).where(listFilter);
    return NextResponse.json({ success: true, data: { items: terrains, total: total.count } }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}

function listTerrainId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647;
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const owned = eq(threedTerrains.userId, session.user.id);
  try {
    const text = await request.text();
    if (text.length > 8192) throw new TerrainInputError('Terrain list update is too large.');
    let input: Record<string, unknown>;
    try { input = JSON.parse(text); } catch { throw new TerrainInputError('Invalid Terrain JSON.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TerrainInputError('Invalid Terrain list update.');

    if (input.action === 'set' && Object.keys(input).every(key => ['action', 'ids', 'sortOrder', 'isActive'].includes(key))) {
      const ids = input.ids;
      if (!Array.isArray(ids) || !ids.length || ids.length > 100 || !ids.every(listTerrainId) || new Set(ids).size !== ids.length) {
        throw new TerrainInputError('Select between 1 and 100 distinct Terrains.');
      }
      const changes: { sortOrder?: number; isActive?: boolean } = {};
      if ('sortOrder' in input) {
        if (!isSortOrder(input.sortOrder)) throw new TerrainInputError(sortOrderError);
        changes.sortOrder = input.sortOrder;
      }
      if ('isActive' in input) {
        if (typeof input.isActive !== 'boolean') throw new TerrainInputError('Choose Active or Inactive.');
        changes.isActive = input.isActive;
      }
      if (!Object.keys(changes).length) throw new TerrainInputError('Choose a field to update.');
      const updated = await db.transaction(async tx => {
        const scope = and(owned, inArray(threedTerrains.id, ids));
        const rows = await tx.select({ id: threedTerrains.id }).from(threedTerrains)
          .where(scope).orderBy(asc(threedTerrains.id)).for('update');
        if (rows.length !== ids.length) throw new TerrainOperationError('Some selected Terrains are unavailable. Refresh and select them again.', 404);
        await tx.update(threedTerrains).set(changes).where(scope);
        return rows.length;
      });
      return NextResponse.json({ success: true, data: { updated } });
    }

    const { sourceId, targetId, after } = input;
    if (input.action !== 'move' || !Object.keys(input).every(key => ['action', 'sourceId', 'targetId', 'after'].includes(key)) ||
        !listTerrainId(sourceId) || !listTerrainId(targetId) || sourceId === targetId || typeof after !== 'boolean') {
      throw new TerrainInputError('Invalid Terrain reorder request.');
    }
    const updated = await db.transaction(async tx => {
      const locked = tx.$with('locked_terrains').as(
        tx.select({ id: threedTerrains.id, name: threedTerrains.name, sortOrder: threedTerrains.sortOrder })
          .from(threedTerrains).where(owned).orderBy(asc(threedTerrains.id)).for('update'),
      );
      const rows = await tx.with(locked).select({ id: locked.id, sortOrder: locked.sortOrder })
        .from(locked).orderBy(asc(locked.sortOrder), asc(locked.name), asc(locked.id));
      const reordered = moveRankedRow(rows, sourceId, targetId, after);
      if (!reordered) throw new TerrainOperationError('Terrain not found.', 404);
      if (reordered === rows) return 0;
      if (reordered.length > SORT_ORDER_LIMIT + 1) throw new TerrainOperationError('Too many Terrains to assign unique ranks.', 409);
      const changes = reordered.flatMap((row, index) => row.sortOrder === index ? [] : [{
        id: row.id,
        sort_order: index,
      }]);
      await tx.execute(sql`
        UPDATE ${threedTerrains}
        SET sort_order = ranks.sort_order
        FROM jsonb_to_recordset(${JSON.stringify(changes)}::jsonb) AS ranks(id integer, sort_order integer)
        WHERE ${threedTerrains.id} = ranks.id AND ${owned}
      `);
      return changes.length;
    });
    return NextResponse.json({ success: true, data: { updated } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > maxTerrainRequestBytes) throw new TerrainInputError('Terrain request is too large.');
    let input: Record<string, unknown>;
    try { input = JSON.parse(text); } catch { throw new TerrainInputError('Invalid Terrain JSON.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TerrainInputError('Invalid Terrain request.');
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 255) throw new TerrainInputError('Terrain name must be 1–255 characters.');
    const definition = parseTerrainDefinition(input.definition);
    const terrainId = input.terrainId === undefined ? null : Number(input.terrainId);
    const expectedRevision = input.expectedRevision === undefined ? null : Number(input.expectedRevision);
    if (terrainId !== null && (!Number.isSafeInteger(terrainId) || terrainId <= 0 || !Number.isSafeInteger(expectedRevision) || expectedRevision! <= 0)) {
      throw new TerrainInputError('Invalid Terrain revision request.');
    }
    const data = await db.transaction(async tx => {
      let id: number;
      let revision: number;
      if (terrainId === null) {
        const [created] = await tx.insert(threedTerrains).values({ userId: session.user!.id!, name }).returning({ id: threedTerrains.id });
        id = created.id;
        revision = 1;
      } else {
        const [owned] = await tx.select({ id: threedTerrains.id }).from(threedTerrains)
          .where(and(eq(threedTerrains.id, terrainId), eq(threedTerrains.userId, session.user!.id!))).limit(1).for('update');
        if (!owned) throw new TerrainInputError('Terrain not found.');
        const [latest] = await tx.select({ revision: threedTerrainRevisions.revision }).from(threedTerrainRevisions)
          .where(eq(threedTerrainRevisions.terrainId, terrainId)).orderBy(desc(threedTerrainRevisions.revision)).limit(1);
        if (latest?.revision !== expectedRevision) throw new Error('Terrain changed. Reload it before saving a revision.');
        id = terrainId;
        revision = expectedRevision! + 1;
        await tx.update(threedTerrains).set({ name, updatedAt: new Date() }).where(eq(threedTerrains.id, id));
      }
      await tx.insert(threedTerrainRevisions).values({
        terrainId: id,
        revision,
        formatVersion: definition.formatVersion,
        widthM: definition.widthM,
        lengthM: definition.lengthM,
        columns: definition.columns,
        rows: definition.rows,
        heightsM: definition.heightsM,
        appearance: definition.appearance,
      });
      return { id, revision };
    });
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
