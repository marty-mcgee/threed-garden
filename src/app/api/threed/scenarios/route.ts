import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project, projectAssets, projectThreed, projectThreedMarkers } from '@/libraries/schema/project';
import { threed, threedScenarios } from '@/libraries/schema/threed';
import { positiveId, scenarioFields, scenarioListQuery, parseScenarioSetup, ScenarioInputError, type ScenarioSetup } from '@/libraries/services/threed/scenarios/scenario-input';
import { readSensorGroups } from '@/libraries/services/threed/physics/sensor-group-core';
import { IMPORTED_SENSOR_GROUP } from '@/libraries/services/threed/physics/sensor-legacy-compat';

const errorResponse = (error: unknown) => error instanceof ScenarioInputError
  ? NextResponse.json({ success: false, error: error.message }, { status: 400 })
  : error instanceof SyntaxError
    ? NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 })
    : NextResponse.json({ success: false, error: 'Scenario request failed.' }, { status: 500 });
const conflict = (error: unknown): boolean => typeof error === 'object' && error !== null && (('code' in error && error.code === '23505') || ('cause' in error && conflict(error.cause)));

async function assignedModule(userId: string, projectId: number, threedId: number) {
  const [row] = await db.select({ id: projectThreed.id }).from(projectThreed)
    .innerJoin(project, eq(project.id, projectThreed.projectId))
    .innerJoin(threed, eq(threed.id, projectThreed.threedId))
    .where(and(eq(projectThreed.userId, userId), eq(projectThreed.projectId, projectId), eq(projectThreed.threedId, threedId), eq(project.userId, userId), eq(threed.userId, userId)))
    .limit(1);
  return Boolean(row);
}

async function validateSetupReferences(userId: string, projectId: number, threedId: number, setup: ScenarioSetup | null) {
  if (!setup) return;
  if (setup.environmentMarkerId) {
    const [saved] = await db.select({ id: projectThreedMarkers.id }).from(projectThreedMarkers).where(and(
      eq(projectThreedMarkers.userId, userId), eq(projectThreedMarkers.projectId, projectId),
      eq(projectThreedMarkers.threedId, threedId), eq(projectThreedMarkers.markerType, 'models'),
      eq(projectThreedMarkers.markerId, setup.environmentMarkerId), eq(projectThreedMarkers.isActive, true),
    )).limit(1);
    const fallbackId = /^models-(\d+)$/.exec(setup.environmentMarkerId);
    const [assigned] = !saved && fallbackId ? await db.select({ id: projectAssets.id }).from(projectAssets).where(and(
      eq(projectAssets.userId, userId), eq(projectAssets.projectId, projectId),
      eq(projectAssets.moduleId, threedId), eq(projectAssets.moduleType, 'threed'),
      eq(projectAssets.assetType, 'threed_models'), eq(projectAssets.assetId, Number(fallbackId[1])),
      eq(projectAssets.isActive, true),
    )).limit(1) : [];
    if (!saved && !assigned) throw new ScenarioInputError('Choose an active Model assigned to this Project.');
  }
  if (setup.sensorGroupId) {
    const [owned] = await db.select({ metadata: project.metadata }).from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, userId))).limit(1);
    if (!owned) throw new ScenarioInputError('Project not found.');
    const metadata = (owned.metadata ?? {}) as Record<string, unknown>;
    const groups = readSensorGroups(metadata.physicsSensorGroups ?? []);
    if (![IMPORTED_SENSOR_GROUP, ...groups].some(group => group.id === setup.sensorGroupId)) throw new ScenarioInputError('Choose a Sensor Group from this Project.');
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    if (params.has('id')) {
      const id = positiveId(params.get('id'), 'Scenario ID');
      const [row] = await db.select({ scenario: threedScenarios, projectName: project.name, threedName: threed.name })
        .from(threedScenarios).innerJoin(project, eq(project.id, threedScenarios.projectId))
        .innerJoin(threed, eq(threed.id, threedScenarios.threedId))
        .where(and(eq(threedScenarios.id, id), eq(threedScenarios.userId, session.user.id), eq(project.userId, session.user.id), eq(threed.userId, session.user.id))).limit(1);
      if (!row) return NextResponse.json({ success: false, error: 'Scenario not found.' }, { status: 404 });
      return NextResponse.json({ success: true, data: { ...row.scenario, projectName: row.projectName, threedName: row.threedName } });
    }
    const query = scenarioListQuery(new URL(request.url).searchParams);
    const conditions = [eq(threedScenarios.userId, session.user.id)];
    if (query.projectId) conditions.push(eq(threedScenarios.projectId, query.projectId));
    if (query.isActive !== null) conditions.push(eq(threedScenarios.isActive, query.isActive));
    if (query.search) {
      const search = `%${query.search.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push(or(ilike(threedScenarios.name, search), ilike(threedScenarios.slug, search), ilike(project.name, search))!);
    }
    const where = and(...conditions);
    const [count] = await db.select({ total: sql<number>`count(*)` }).from(threedScenarios)
      .innerJoin(project, eq(project.id, threedScenarios.projectId)).where(where);
    const sortColumn = {
      name: threedScenarios.name, slug: threedScenarios.slug, project: project.name,
      active: threedScenarios.isActive, createdAt: threedScenarios.createdAt,
    }[query.sort];
    const rows = await db.select({ scenario: threedScenarios, projectName: project.name, threedName: threed.name })
      .from(threedScenarios).innerJoin(project, eq(project.id, threedScenarios.projectId))
      .innerJoin(threed, eq(threed.id, threedScenarios.threedId)).where(where)
      .orderBy(query.direction === 'asc' ? asc(sortColumn) : desc(sortColumn), asc(threedScenarios.id))
      .limit(query.limit).offset(query.offset);
    return NextResponse.json({ success: true, data: rows.map(row => ({ ...row.scenario, projectName: row.projectName, threedName: row.threedName })), pagination: { total: Number(count?.total ?? 0), limit: query.limit, offset: query.offset } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const projectId = positiveId(body?.projectId, 'Project ID');
    const threedId = positiveId(body?.threedId, 'ThreeD ID');
    const fields = scenarioFields(body);
    const setup = body && Object.hasOwn(body, 'setup') ? parseScenarioSetup(body.setup) : null;
    if (!await assignedModule(session.user.id, projectId, threedId)) return NextResponse.json({ success: false, error: 'Project ThreeD module not found.' }, { status: 404 });
    await validateSetupReferences(session.user.id, projectId, threedId, setup);
    const [created] = await db.insert(threedScenarios).values({ ...fields, setup, userId: session.user.id, projectId, threedId }).returning();
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    if (conflict(error)) return NextResponse.json({ success: false, error: 'This Scenario slug already exists in the Project module.' }, { status: 409 });
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const id = positiveId(body?.id, 'Scenario ID');
    const fields = scenarioFields(body);
    const hasSetup = body && Object.hasOwn(body, 'setup');
    const setup = hasSetup ? parseScenarioSetup(body.setup) : null;
    if (hasSetup) {
      const [existing] = await db.select({ projectId: threedScenarios.projectId, threedId: threedScenarios.threedId }).from(threedScenarios)
        .where(and(eq(threedScenarios.id, id), eq(threedScenarios.userId, session.user.id))).limit(1);
      if (!existing) return NextResponse.json({ success: false, error: 'Scenario not found.' }, { status: 404 });
      await validateSetupReferences(session.user.id, existing.projectId, existing.threedId, setup);
    }
    const [updated] = await db.update(threedScenarios).set({ ...fields, ...(hasSetup ? { setup } : {}), updatedAt: new Date() })
      .where(and(eq(threedScenarios.id, id), eq(threedScenarios.userId, session.user.id))).returning();
    if (!updated) return NextResponse.json({ success: false, error: 'Scenario not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (conflict(error)) return NextResponse.json({ success: false, error: 'This Scenario slug already exists in the Project module.' }, { status: 409 });
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const id = positiveId(new URL(request.url).searchParams.get('id'), 'Scenario ID');
    const [deleted] = await db.delete(threedScenarios)
      .where(and(eq(threedScenarios.id, id), eq(threedScenarios.userId, session.user.id))).returning({ id: threedScenarios.id });
    if (!deleted) return NextResponse.json({ success: false, error: 'Scenario not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) { return errorResponse(error); }
}
