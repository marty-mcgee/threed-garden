import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project, projectThreed, projectThreedMarkers } from '@/libraries/schema/project';
import { threed, threedSimulations } from '@/libraries/schema/threed';
import { MAX_SIMULATION_BYTES, SimulationInputError, simulationFields, simulationId, simulationListQuery, type SimulationDefinition } from '@/libraries/services/threed/simulations/simulation-input';
import { THREED_PLANTING_TARGET_ACTIONS } from '@/libraries/services/threed/orchestration/action-target-core';
import { readSensorGroups } from '@/libraries/services/threed/physics/sensor-group-core';
import { IMPORTED_SENSOR_GROUP, readModelVolumeSensor } from '@/libraries/services/threed/physics/sensor-legacy-compat';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { isProjectModelMovableBall } from '@/libraries/services/threed/models/project-model-instance-core';
import { simulationMarkerPreview } from '@/libraries/services/threed/simulations/simulation-preview-contract';

const privateHeaders = { 'Cache-Control': 'private, no-store' };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: privateHeaders });
const failure = (error: unknown) => reply({ success: false, error: error instanceof SimulationInputError ? error.message : error instanceof SyntaxError ? 'Invalid JSON body.' : 'Simulation request failed.' }, error instanceof SimulationInputError || error instanceof SyntaxError ? 400 : 500);
const duplicate = (e: unknown): boolean => typeof e === 'object' && e !== null && (('code' in e && e.code === '23505') || ('cause' in e && duplicate(e.cause)));
async function body(request: NextRequest) {
  const length = request.headers.get('content-length');
  if (length && Number(length) > MAX_SIMULATION_BYTES) throw new SimulationInputError('Simulation input exceeds 64 KiB.');
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_SIMULATION_BYTES) throw new SimulationInputError('Simulation input exceeds 64 KiB.');
  return JSON.parse(raw);
}
function checkOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new SimulationInputError('Invalid request origin.');
}
type Client = Pick<typeof db, 'select'>;
async function choices(client: Client, userId: string, projectId: number, threedId: number) {
  const [assigned] = await client.select({ metadata: project.metadata }).from(projectThreed)
    .innerJoin(project, eq(project.id, projectThreed.projectId)).innerJoin(threed, eq(threed.id, projectThreed.threedId))
    .where(and(eq(projectThreed.userId, userId), eq(projectThreed.projectId, projectId), eq(projectThreed.threedId, threedId), eq(project.userId, userId), eq(threed.userId, userId))).limit(1);
  if (!assigned) return null;
  const markerRows = await client.select({ id: projectThreedMarkers.id, markerId: projectThreedMarkers.markerId, markerType: projectThreedMarkers.markerType, name: projectThreedMarkers.name,
    sourceAssetId: projectThreedMarkers.sourceAssetId, positionX: projectThreedMarkers.positionX, positionY: projectThreedMarkers.positionY, positionZ: projectThreedMarkers.positionZ,
    isVisible: projectThreedMarkers.isVisible, data: projectThreedMarkers.data, metadata: projectThreedMarkers.metadata }).from(projectThreedMarkers)
    .where(and(eq(projectThreedMarkers.userId, userId), eq(projectThreedMarkers.projectId, projectId), eq(projectThreedMarkers.threedId, threedId), eq(projectThreedMarkers.isActive, true))).orderBy(asc(projectThreedMarkers.name));
  const metadata = (assigned.metadata ?? {}) as Record<string, unknown>;
  const groups = readSensorGroups(metadata.physicsSensorGroups ?? []);
  if (!groups.some(group => group.id === IMPORTED_SENSOR_GROUP.id)) groups.unshift(IMPORTED_SENSOR_GROUP);
  const markers = markerRows.map(row => ({ markerId: row.markerId, markerType: row.markerType, name: row.name,
    movableCharacter: row.markerType === 'characters' && (row.data as Record<string, unknown> | null)?.isMovable === true,
    movableBall: row.markerType === 'models' && isProjectModelMovableBall(row.metadata), preview: simulationMarkerPreview(row) }));
  const sensors = markerRows.flatMap(row => {
    if (!Number.isSafeInteger(row.id) || row.id <= 0) return [];
    const metadata = row.metadata as Record<string, unknown> | null;
    const volume = row.markerType === 'models' && !isProjectModelMovableBall(metadata) && metadata?.placementRole !== 'environment' ? readModelVolumeSensor(metadata) : null;
    return [...readPhysicsSensorCuboids(metadata), ...(volume ? [volume] : [])].map(sensor => ({ ownerMarkerId: row.id, id: sensor.id,
      name: sensor.name, ownerName: row.name, groupId: sensor.groupId, behavior: sensor.behavior }));
  });
  return { markers, groups, sensors };
}
function validateReferences(options: NonNullable<Awaited<ReturnType<typeof choices>>>, definition: SimulationDefinition) {
  for (const step of definition.steps) {
    if (!options.markers.some(row => row.markerId === step.actorMarkerId && row.markerType === 'characters')) throw new SimulationInputError('Choose an active Character marker from this Project module.');
    const target = options.markers.find(row => row.markerId === step.targetMarkerId);
    if (!target || (THREED_PLANTING_TARGET_ACTIONS.includes(step.action as typeof THREED_PLANTING_TARGET_ACTIONS[number]) && target.markerType !== 'plantings')) throw new SimulationInputError('Choose a compatible active target from this Project module.');
    if (step.action === 'runToTarget' || step.action === 'kickBall') {
      if (!options.markers.some(row => row.markerId === step.actorMarkerId && row.movableCharacter) || !target.movableBall) throw new SimulationInputError('Soccer Actions require a movable Character and movable ball from this Project module.');
    }
  }
  if (definition.observations.some(source => !options.groups.some(group => group.id === source.sensorGroupId))) throw new SimulationInputError('Choose a Sensor Group from this Project.');
  for (const source of definition.observations) {
    if (source.sensors?.some(sensor => !options.sensors.some(choice => choice.ownerMarkerId === sensor.ownerMarkerId && choice.id === sensor.id && choice.groupId === source.sensorGroupId))) throw new SimulationInputError('Choose Sensors assigned to the selected Project group.');
  }
}
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    const params = new URL(request.url).searchParams, userId = session.user.id;
    if (params.has('scenarioId')) throw new SimulationInputError('Scenario filters are not supported for Simulations.');
    if (params.get('options') === '1') {
      const data = await choices(db, userId, simulationId(params.get('projectId'), 'Project ID'), simulationId(params.get('threedId'), 'ThreeD ID'));
      return data ? reply({ success: true, data }) : reply({ success: false, error: 'Project ThreeD module not found.' }, 404);
    }
    const conditions = [eq(threedSimulations.userId, userId), eq(project.userId, userId), eq(threed.userId, userId)];
    const single = params.has('id');
    const query = single ? null : simulationListQuery(params);
    if (single) conditions.push(eq(threedSimulations.id, simulationId(params.get('id'), 'Simulation ID')));
    if (query?.projectId) conditions.push(eq(threedSimulations.projectId, query.projectId));
    if (query?.threedId) conditions.push(eq(threedSimulations.threedId, query.threedId));
    if (query?.isActive !== null && query?.isActive !== undefined) conditions.push(eq(threedSimulations.isActive, query.isActive));
    if (query?.search) {
      const term = `%${query.search.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push(or(ilike(threedSimulations.name, term), ilike(threedSimulations.slug, term), ilike(project.name, term))!);
    }
    const where = and(...conditions);
    const fields = {
      simulation: single ? threedSimulations : { id: threedSimulations.id, name: threedSimulations.name, slug: threedSimulations.slug, projectId: threedSimulations.projectId, threedId: threedSimulations.threedId, isActive: threedSimulations.isActive, revision: threedSimulations.revision },
      projectName: project.name, threedName: threed.name,
      actionCount: sql<number>`jsonb_array_length(${threedSimulations.definition}->'steps')`,
      observationCount: sql<number>`jsonb_array_length(${threedSimulations.definition}->'observations')`,
    };
    const select = db.select(fields).from(threedSimulations).innerJoin(project, eq(project.id, threedSimulations.projectId)).innerJoin(threed, eq(threed.id, threedSimulations.threedId)).where(where);
    if (single) {
      const [row] = await select.limit(1);
      return row ? reply({ success: true, data: { ...row.simulation, projectName: row.projectName, threedName: row.threedName } }) : reply({ success: false, error: 'Simulation not found.' }, 404);
    }
    const sortColumn = { name: threedSimulations.name, slug: threedSimulations.slug, project: project.name, revision: threedSimulations.revision, active: threedSimulations.isActive, createdAt: threedSimulations.createdAt }[query!.sort];
    const rows = await select.orderBy(query!.direction === 'asc' ? asc(sortColumn) : desc(sortColumn), asc(threedSimulations.id)).limit(query!.limit).offset(query!.offset);
    const [count] = await db.select({ total: sql<number>`count(*)` }).from(threedSimulations).innerJoin(project, eq(project.id, threedSimulations.projectId)).innerJoin(threed, eq(threed.id, threedSimulations.threedId)).where(where);
    return reply({ success: true, data: rows.map(row => ({ ...row.simulation, projectName: row.projectName, threedName: row.threedName, actionCount: Number(row.actionCount), observationCount: Number(row.observationCount) })), pagination: { total: Number(count?.total ?? 0), limit: query!.limit, offset: query!.offset } });
  } catch (e) { return failure(e); }
}
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    checkOrigin(request);
    const input = await body(request), fields = simulationFields(input, false);
    const projectId = simulationId(input.projectId, 'Project ID'), threedId = simulationId(input.threedId, 'ThreeD ID');
    const result = await db.transaction(async tx => {
      const options = await choices(tx, session.user!.id!, projectId, threedId);
      if (!options) return null;
      validateReferences(options, fields.definition);
      const [created] = await tx.insert(threedSimulations).values({ ...fields, userId: session.user!.id!, projectId, threedId }).returning();
      return created;
    });
    return result ? reply({ success: true, data: result }, 201) : reply({ success: false, error: 'Project ThreeD module not found.' }, 404);
  } catch (e) { return duplicate(e) ? reply({ success: false, error: 'This Simulation slug already exists in the Project module.' }, 409) : failure(e); }
}
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    checkOrigin(request);
    const input = await body(request), fields = simulationFields(input, true);
    const id = simulationId(input.id, 'Simulation ID'), revision = simulationId(input.revision, 'Revision');
    const result = await db.transaction(async tx => {
      const [existing] = await tx.select().from(threedSimulations).where(and(eq(threedSimulations.id, id), eq(threedSimulations.userId, session.user!.id!))).limit(1).for('update');
      if (!existing) return { status: 404, error: 'Simulation not found.' };
      if (existing.revision !== revision) return { status: 409, error: 'This Simulation changed. Reload before saving your changes.' };
      const options = await choices(tx, session.user!.id!, existing.projectId, existing.threedId);
      if (!options) return { status: 404, error: 'Project ThreeD module not found.' };
      validateReferences(options, fields.definition);
      const [updated] = await tx.update(threedSimulations).set({ ...fields, revision: existing.revision + 1, updatedAt: new Date() }).where(and(eq(threedSimulations.id, id), eq(threedSimulations.userId, session.user!.id!), eq(threedSimulations.revision, revision))).returning();
      return updated ? { status: 200, data: updated } : { status: 409, error: 'This Simulation changed. Reload before saving your changes.' };
    });
    return reply({ success: result.status === 200, ...result }, result.status);
  } catch (e) { return duplicate(e) ? reply({ success: false, error: 'This Simulation slug already exists in the Project module.' }, 409) : failure(e); }
}
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    checkOrigin(request);
    const params = new URL(request.url).searchParams, id = simulationId(params.get('id'), 'Simulation ID'), revision = simulationId(params.get('revision'), 'Revision');
    const [deleted] = await db.delete(threedSimulations).where(and(eq(threedSimulations.id, id), eq(threedSimulations.userId, session.user.id), eq(threedSimulations.revision, revision))).returning({ id: threedSimulations.id });
    return deleted ? reply({ success: true, data: deleted }) : reply({ success: false, error: 'Simulation unavailable or changed. Refresh before deleting.' }, 409);
  } catch (e) { return failure(e); }
}
