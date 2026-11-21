import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { threed, threedSimulations } from '@/libraries/schema/threed';
import { MAX_SIMULATION_BYTES, SimulationInputError, simulationFields, simulationId, simulationListQuery } from '@/libraries/services/threed/simulations/simulation-input';
import { simulationReferenceChoices as choices, validateSimulationReferences as validateReferences } from '@/libraries/services/threed/simulations/simulation-references';

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
      simulation: single ? threedSimulations : { id: threedSimulations.id, name: threedSimulations.name, slug: threedSimulations.slug, projectId: threedSimulations.projectId, threedId: threedSimulations.threedId, isActive: threedSimulations.isActive, revision: threedSimulations.revision, updatedAt: threedSimulations.updatedAt },
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
      await validateReferences(tx, options, fields.definition, projectId, session.user!.id!);
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
      await validateReferences(tx, options, fields.definition, existing.projectId, session.user!.id!);
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
