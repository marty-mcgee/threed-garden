import { parseSimulationDefinition, simulationId, SimulationInputError, type SimulationDefinition } from './simulation-input';
import type { SimulationOutcome, SimulationRunState } from './soccer-simulation-runner';
import type { SimulationSensorObservation } from './soccer-simulation-scene';

// Reports include up to 50 outcomes and 128 named Sensor readings; definitions retain their own 64 KiB limit.
export const MAX_SIMULATION_RESULT_BYTES = 262_144;
export type SimulationResultSnapshot = { simulationId: number; name: string; revision: number; projectName: string; threedName: string; definition: SimulationDefinition };
export type SimulationResultReport = { version: 1; source: 'browser-scene'; phase: Exclude<SimulationRunState['phase'], 'running'>;
  clientStartedAt: number; clientEndedAt: number; outcomes: SimulationOutcome[]; observations: SimulationSensorObservation[]; reason?: string };
function object(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !fields.includes(key))) throw new SimulationInputError('Invalid Simulation result fields.');
  return value as Record<string, unknown>;
}
const text = (value: unknown, max: number) => {
  if (typeof value !== 'string' || value.length > max) throw new SimulationInputError('Invalid result text.'); return value;
};
const count = (value: unknown) => {
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 2_147_483_647) throw new SimulationInputError('Invalid Sensor count.'); return Number(value);
};
export function simulationRunId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new SimulationInputError('Invalid Simulation run ID.'); return value.toLowerCase();
}
export function resultStart(value: unknown, now = Date.now()) {
  const input = object(value, ['simulationId', 'revision', 'runId', 'clientStartedAt']);
  if (!Number.isSafeInteger(input.clientStartedAt) || Number(input.clientStartedAt) > now + 300_000 || Number(input.clientStartedAt) < now - 30 * 86_400_000) throw new SimulationInputError('Check the browser clock before running.');
  return { simulationId: simulationId(input.simulationId), revision: simulationId(input.revision, 'Revision'), runId: simulationRunId(input.runId), clientStartedAt: Number(input.clientStartedAt) };
}
/** Validate browser reports against the immutable server snapshot, not the current edited definition. */
export function resultReport(value: unknown, saved: { snapshot: SimulationResultSnapshot; clientStartedAt: Date | string }) {
  const input = object(value, ['runId', 'report']), runId = simulationRunId(input.runId);
  const r = object(input.report, ['version', 'source', 'phase', 'clientStartedAt', 'clientEndedAt', 'outcomes', 'observations', 'reason']);
  const definition = parseSimulationDefinition(saved.snapshot.definition);
  if (r.version !== 1 || r.source !== 'browser-scene' || !['completed', 'failed', 'cancelled', 'timed-out'].includes(String(r.phase))) throw new SimulationInputError('Choose a terminal Simulation result.');
  const start = Number(r.clientStartedAt), end = Number(r.clientEndedAt);
  if (!Number.isSafeInteger(start) || start !== new Date(saved.clientStartedAt).getTime() || !Number.isSafeInteger(end) || end < start
    || end - start > definition.steps.reduce((sum, step) => sum + step.timeoutMs, 300_000)) throw new SimulationInputError('Invalid run timing.');
  if (!Array.isArray(r.outcomes) || r.outcomes.length > definition.steps.length || !Array.isArray(r.observations) || r.observations.length !== definition.observations.length) throw new SimulationInputError('Invalid run report size.');
  const requestIds = new Set<string>(); let previousEnd = start;
  const outcomeValues = r.outcomes;
  const outcomes = outcomeValues.map((value, index): SimulationOutcome => {
    const item = object(value, ['stepId', 'action', 'requestId', 'startedAt', 'endedAt', 'status', 'reason']);
    const step = definition.steps[index], requestId = simulationRunId(item.requestId);
    if (item.stepId !== step.id || item.action !== step.action || requestIds.has(requestId) || !['completed', 'failed', 'cancelled', 'timed-out'].includes(String(item.status))
      || !Number.isSafeInteger(item.startedAt) || !Number.isSafeInteger(item.endedAt) || Number(item.startedAt) < previousEnd || Number(item.endedAt) < Number(item.startedAt) || Number(item.endedAt) > end) throw new SimulationInputError('Invalid correlated Action outcome.');
    if (index < outcomeValues.length - 1 && item.status !== 'completed' && (step.onFailure !== 'continue' || step.action === 'runToTarget')) throw new SimulationInputError('An interrupted Action cannot advance.');
    requestIds.add(requestId); previousEnd = Number(item.endedAt);
    return { stepId: step.id, action: step.action, requestId, startedAt: Number(item.startedAt), endedAt: Number(item.endedAt), status: item.status as SimulationOutcome['status'], ...(item.reason !== undefined ? { reason: text(item.reason, 200) } : {}) };
  });
  if (r.phase === 'completed' && (outcomes.length !== definition.steps.length || outcomes.some(item => item.status !== 'completed'))) throw new SimulationInputError('Completion requires every Action to complete.');
  let sensors = 0, events = 0;
  const observations = r.observations.map((value, index): SimulationSensorObservation => {
    const item = object(value, ['groupId', 'name', 'baseline', 'final', 'delta', 'events', 'truncated', 'countersReset', 'sensors']);
    const source = definition.observations[index], baseline = count(item.baseline), final = count(item.final), eventCount = count(item.events);
    if (item.groupId !== source.sensorGroupId || item.delta !== final - baseline || eventCount > 256 || (events += eventCount) > 256
      || typeof item.truncated !== 'boolean' || typeof item.countersReset !== 'boolean' || !Array.isArray(item.sensors) || (sensors += item.sensors.length) > 128) throw new SimulationInputError('Invalid Sensor observation.');
    const keys = new Set<string>();
    const readings = item.sensors.map(value => {
      const sensor = object(value, ['ownerMarkerId', 'id', 'name', 'behavior', 'baseline', 'final']);
      const ownerMarkerId = simulationId(sensor.ownerMarkerId), id = text(sensor.id, 64), key = `${ownerMarkerId}:${id}`;
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || keys.has(key) || !['counter', 'trigger'].includes(String(sensor.behavior))
        || (source.sensors && !source.sensors.some(choice => choice.ownerMarkerId === ownerMarkerId && choice.id === id))) throw new SimulationInputError('Invalid selected Sensor reading.');
      keys.add(key); return { ownerMarkerId, id, name: text(sensor.name, 80), behavior: sensor.behavior as 'counter' | 'trigger', baseline: count(sensor.baseline), final: count(sensor.final) };
    });
    return { groupId: source.sensorGroupId, name: text(item.name, 80), baseline, final, delta: final - baseline, events: eventCount, truncated: item.truncated, countersReset: item.countersReset, sensors: readings };
  });
  return { runId, report: { version: 1, source: 'browser-scene', phase: r.phase, clientStartedAt: start, clientEndedAt: end, outcomes, observations,
    ...(r.reason !== undefined ? { reason: text(r.reason, 200) } : {}) } as SimulationResultReport };
}

export function sameSimulationReport(left: unknown, right: unknown): boolean {
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}
