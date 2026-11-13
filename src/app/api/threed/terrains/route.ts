import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { projectTerrainPlacements, threedTerrainRevisions, threedTerrains } from '@/libraries/schema/threed';
import { parseTerrainDefinition, TerrainInputError } from '@/libraries/services/threed/terrains/terrain-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    if (paged && (search.length > 120 || ![25, 50, 100].includes(limit) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000)) {
      throw new TerrainInputError('Invalid Terrain list request.');
    }
    const ownerFilter = eq(threedTerrains.userId, userId);
    const listFilter = paged && search ? and(ownerFilter, ilike(threedTerrains.name, `%${search.replace(/[\\%_]/g, '\\$&')}%`)) : ownerFilter;
    const terrains = await db.select({
      id: threedTerrains.id,
      name: threedTerrains.name,
      updatedAt: threedTerrains.updatedAt,
      revision: sql<number>`(select max(revision) from threed_terrain_revisions where terrain_id = ${threedTerrains.id})`,
    }).from(threedTerrains).where(listFilter).orderBy(desc(threedTerrains.updatedAt)).limit(paged ? limit : 100).offset(paged ? offset : 0);
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
