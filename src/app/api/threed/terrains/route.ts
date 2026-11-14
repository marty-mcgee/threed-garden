import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { projectAssets } from '@/libraries/schema/project';
import { projectTerrainPlacements, threedTerrainRevisions, threedTerrains } from '@/libraries/schema/threed';
import { parseTerrainDefinition, TerrainInputError } from '@/libraries/services/threed/terrains/terrain-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

class TerrainDeleteError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const id = Number(request.nextUrl.searchParams.get('id'));
    const revision = Number(request.nextUrl.searchParams.get('revision'));
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(revision) || revision <= 0) {
      throw new TerrainDeleteError('Invalid Terrain deletion request.', 400);
    }
    await db.transaction(async tx => {
      const [owned] = await tx.select({ id: threedTerrains.id }).from(threedTerrains)
        .where(and(eq(threedTerrains.id, id), eq(threedTerrains.userId, session.user!.id!))).limit(1).for('update');
      if (!owned) throw new TerrainDeleteError('This Terrain record does not exist, or is not available for edit by this User.', 404);
      const [latest] = await tx.select({ revision: threedTerrainRevisions.revision }).from(threedTerrainRevisions)
        .where(eq(threedTerrainRevisions.terrainId, id)).orderBy(desc(threedTerrainRevisions.revision)).limit(1);
      if (latest?.revision !== revision) throw new TerrainDeleteError('Terrain changed. Refresh the list before deleting.', 409);
      const [placement] = await tx.select({ id: projectTerrainPlacements.id }).from(projectTerrainPlacements).where(eq(projectTerrainPlacements.terrainId, id)).limit(1);
      const [asset] = await tx.select({ id: projectAssets.id }).from(projectAssets).where(and(eq(projectAssets.assetType, 'threed_terrains'), eq(projectAssets.assetId, id))).limit(1);
      if (placement) throw new TerrainDeleteError('This Terrain has a saved Project placement and cannot be deleted.', 409);
      if (asset) throw new TerrainDeleteError('This Terrain has a retained Project asset assignment and cannot be deleted. Removing an assignment only marks it inactive; inactive assignment records also protect the Terrain.', 409);
      await tx.delete(threedTerrainRevisions).where(eq(threedTerrainRevisions.terrainId, id));
      await tx.delete(threedTerrains).where(eq(threedTerrains.id, id));
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TerrainDeleteError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  if (error instanceof TerrainInputError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
  if (error instanceof Error && error.message === 'Terrain changed. Reload it before saving a revision.') {
    return NextResponse.json({ success: false, error: error.message }, { status: 409 });
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
      const [terrain] = await db.select().from(threedTerrains).where(and(eq(threedTerrains.id, terrainId), eq(threedTerrains.userId, userId))).limit(1);
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
    if (!['name', 'revision', 'updatedAt'].includes(sortBy) || !['asc', 'desc'].includes(sortDir)) {
      throw new TerrainInputError('Invalid Terrain sort request.');
    }
    if (paged && (search.length > 120 || ![25, 50, 100].includes(limit) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000)) {
      throw new TerrainInputError('Invalid Terrain list request.');
    }
    const ownerFilter = eq(threedTerrains.userId, userId);
    const latestRevision = sql<number>`(select max(revision) from threed_terrain_revisions where terrain_id = ${threedTerrains.id})`;
    const sortField = sortBy === 'name' ? threedTerrains.name : sortBy === 'revision' ? latestRevision : threedTerrains.updatedAt;
    const order = sortDir === 'asc' ? asc : desc;
    const listFilter = paged && search ? and(ownerFilter, ilike(threedTerrains.name, `%${search.replace(/[\\%_]/g, '\\$&')}%`)) : ownerFilter;
    const terrains = await db.select({
      id: threedTerrains.id,
      name: threedTerrains.name,
      updatedAt: threedTerrains.updatedAt,
      revision: latestRevision,
    }).from(threedTerrains).where(listFilter).orderBy(order(sortField), order(threedTerrains.id)).limit(paged ? limit : 100).offset(paged ? offset : 0);
    if (!paged) return NextResponse.json({ success: true, data: terrains }, { headers: { 'Cache-Control': 'private, no-store' } });
    const [total] = await db.select({ count: sql<number>`count(*)::integer` }).from(threedTerrains).where(listFilter);
    return NextResponse.json({ success: true, data: { items: terrains, total: total.count } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 300_000) throw new TerrainInputError('Terrain request is too large.');
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
