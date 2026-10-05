import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, sql, getTableColumns } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project, projectThreed } from '@/libraries/schema/project';
import { threed, threedScenarios, threedSimulations, threedSimulationResults } from '@/libraries/schema/threed';
import { parseSimulationDefinition, SimulationInputError, simulationId } from '@/libraries/services/threed/simulations/simulation-input';
import { MAX_SIMULATION_RESULT_BYTES, resultStart, resultReport, simulationRunId, sameSimulationReport } from '@/libraries/services/threed/simulations/simulation-result-input';

const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
const missingTable = (e: unknown): boolean => !!e && typeof e === 'object' && (('code' in e && e.code === '42P01') || ('cause' in e && missingTable(e.cause)));
const failure = (e: unknown) => reply({ success: false, error: missingTable(e) ? 'Simulation results schema is required before running. Run npm run db:push.'
  : e instanceof SimulationInputError ? e.message : e instanceof SyntaxError ? 'Invalid JSON body.' : 'Simulation results request failed.' }, missingTable(e) ? 503 : e instanceof SimulationInputError || e instanceof SyntaxError ? 400 : 500);
async function body(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new SimulationInputError('Invalid request origin.');
  if (Number(request.headers.get('content-length') ?? 0) > MAX_SIMULATION_RESULT_BYTES) throw new SimulationInputError('Result exceeds 256 KiB.');
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_SIMULATION_RESULT_BYTES) throw new SimulationInputError('Result exceeds 256 KiB.');
  return JSON.parse(raw);
}
export async function GET(request: NextRequest) {
  const session = await auth(); if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    const params = new URL(request.url).searchParams, conditions = [eq(threedSimulationResults.userId, session.user.id), eq(project.userId, session.user.id), eq(threed.userId, session.user.id)];
    if (params.has('runId')) conditions.push(eq(threedSimulationResults.runId, simulationRunId(params.get('runId'))));
    for (const [key, column] of [['projectId', threedSimulationResults.projectId], ['simulationId', threedSimulationResults.simulationId], ['scenarioId', threedSimulationResults.scenarioId]] as const) {
      if (params.has(key)) conditions.push(eq(column, simulationId(params.get(key))));
    }
    const single = params.has('runId'), limit = params.has('limit') ? simulationId(params.get('limit')) : 25, offset = params.get('offset') ?? '0';
    if (limit > 100 || !/^\d+$/.test(offset) || Number(offset) > 1_000_000) throw new SimulationInputError('Invalid results pagination.');
    if (params.has('status')) {
      const status = params.get('status')!;
      if (!['running', 'completed', 'failed', 'cancelled', 'timed-out'].includes(status)) throw new SimulationInputError('Invalid result status.');
      conditions.push(eq(threedSimulationResults.status, status));
    }
    const where = and(...conditions), fields = single ? getTableColumns(threedSimulationResults) : {
      id: threedSimulationResults.id, runId: threedSimulationResults.runId, projectId: threedSimulationResults.projectId, simulationId: threedSimulationResults.simulationId,
      scenarioId: threedSimulationResults.scenarioId, simulationRevision: threedSimulationResults.simulationRevision, status: threedSimulationResults.status,
      createdAt: threedSimulationResults.createdAt, clientEndedAt: threedSimulationResults.clientEndedAt,
      name: sql<string>`${threedSimulationResults.snapshot}->>'name'`,
    };
    const rows = await db.select(fields).from(threedSimulationResults).innerJoin(project, eq(project.id, threedSimulationResults.projectId))
      .innerJoin(threed, eq(threed.id, threedSimulationResults.threedId)).where(where).orderBy(desc(threedSimulationResults.id)).limit(single ? 1 : limit).offset(single ? 0 : Number(offset));
    if (single) return rows[0] ? reply({ success: true, data: rows[0] }) : reply({ success: false, error: 'Result not found.' }, 404);
    const [count] = await db.select({ total: sql<number>`count(*)` }).from(threedSimulationResults).innerJoin(project, eq(project.id, threedSimulationResults.projectId)).innerJoin(threed, eq(threed.id, threedSimulationResults.threedId)).where(where);
    return reply({ success: true, data: rows, pagination: { total: Number(count?.total ?? 0), limit, offset: Number(offset) } });
  } catch (e) { return failure(e); }
}
export async function POST(request: NextRequest) {
  const session = await auth(); if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    const input = resultStart(await body(request)), userId = session.user.id;
    const result = await db.transaction(async tx => {
      const [existing] = await tx.select().from(threedSimulationResults).where(and(eq(threedSimulationResults.userId, userId), eq(threedSimulationResults.runId, input.runId))).limit(1);
      if (existing) return existing.snapshot.simulationId === input.simulationId && existing.simulationRevision === input.revision && existing.clientStartedAt.getTime() === input.clientStartedAt
        ? { status: 200, data: existing } : { status: 409, error: 'Run ID already belongs to another captured attempt.' };
      if (Math.abs(input.clientStartedAt - Date.now()) > 300_000) return { status: 400, error: 'Check the browser clock before starting a new run.' };
      const [row] = await tx.select({ simulation: threedSimulations, projectName: project.name, threedName: threed.name, scenarioName: threedScenarios.name }).from(threedSimulations)
        .innerJoin(project, eq(project.id, threedSimulations.projectId)).innerJoin(threed, eq(threed.id, threedSimulations.threedId))
        .innerJoin(projectThreed, and(eq(projectThreed.projectId, threedSimulations.projectId), eq(projectThreed.threedId, threedSimulations.threedId), eq(projectThreed.userId, userId)))
        .leftJoin(threedScenarios, and(eq(threedScenarios.id, threedSimulations.scenarioId), eq(threedScenarios.userId, userId), eq(threedScenarios.projectId, threedSimulations.projectId), eq(threedScenarios.threedId, threedSimulations.threedId)))
        .where(and(eq(threedSimulations.id, input.simulationId), eq(threedSimulations.userId, userId), eq(project.userId, userId), eq(threed.userId, userId))).limit(1).for('share', { of: threedSimulations });
      if (!row) return { status: 404, error: 'Simulation module unavailable.' };
      const sim = row.simulation;
      if (!sim.isActive || sim.revision !== input.revision) return { status: 409, error: 'Simulation changed or is inactive. Refresh before running.' };
      const definition = parseSimulationDefinition(sim.definition);
      if (!definition.steps.length) return { status: 400, error: 'A run requires at least one Action.' };
      const [created] = await tx.insert(threedSimulationResults).values({ userId, projectId: sim.projectId, threedId: sim.threedId, simulationId: sim.id, scenarioId: sim.scenarioId,
        runId: input.runId, simulationRevision: sim.revision, clientStartedAt: new Date(input.clientStartedAt),
        snapshot: { simulationId: sim.id, name: sim.name, revision: sim.revision, scenarioId: sim.scenarioId, scenarioName: row.scenarioName,
          projectName: row.projectName, threedName: row.threedName, definition } }).onConflictDoNothing({ target: [threedSimulationResults.userId, threedSimulationResults.runId] }).returning();
      if (created) return { status: 201, data: created };
      const [duplicate] = await tx.select().from(threedSimulationResults).where(and(eq(threedSimulationResults.userId, userId), eq(threedSimulationResults.runId, input.runId))).limit(1);
      return duplicate?.snapshot.simulationId === input.simulationId && duplicate.simulationRevision === input.revision && duplicate.clientStartedAt.getTime() === input.clientStartedAt
        ? { status: 200, data: duplicate } : { status: 409, error: 'Run ID conflict.' };
    });
    return reply({ success: result.status < 300, ...result }, result.status);
  } catch (e) { return failure(e); }
}
export async function PATCH(request: NextRequest) {
  const session = await auth(); if (!session?.user?.id) return reply({ success: false, error: 'Unauthorized' }, 401);
  try {
    const input = await body(request), runId = simulationRunId(input?.runId), userId = session.user.id;
    const result = await db.transaction(async tx => {
      const [saved] = await tx.select().from(threedSimulationResults).where(and(eq(threedSimulationResults.userId, userId), eq(threedSimulationResults.runId, runId))).limit(1).for('update');
      if (!saved) return { status: 404, error: 'Captured run not found.' };
      const { report } = resultReport(input, saved);
      if (saved.status !== 'running') return sameSimulationReport(saved.report, report)
        ? { status: 200, data: { id: saved.id, runId, status: saved.status } } : { status: 409, error: 'This result is finalized and cannot be replaced.' };
      const [updated] = await tx.update(threedSimulationResults).set({ report, status: report.phase, clientEndedAt: new Date(report.clientEndedAt), updatedAt: new Date() })
        .where(and(eq(threedSimulationResults.userId, userId), eq(threedSimulationResults.runId, runId), eq(threedSimulationResults.status, 'running'))).returning({ id: threedSimulationResults.id, runId: threedSimulationResults.runId, status: threedSimulationResults.status });
      return updated ? { status: 200, data: updated } : { status: 409, error: 'Run changed before finalization.' };
    });
    return reply({ success: result.status < 300, ...result }, result.status);
  } catch (e) { return failure(e); }
}
