import { THREED_GENERIC_TARGET_ACTIONS, THREED_PLANTING_TARGET_ACTIONS } from '../orchestration/action-target-core';

export class SimulationInputError extends Error {}
export const SOCCER_SIMULATION_ACTIONS = ['runToTarget', 'kickBall'] as const;
export const SIMULATION_ACTIONS = [...SOCCER_SIMULATION_ACTIONS, ...THREED_GENERIC_TARGET_ACTIONS, ...THREED_PLANTING_TARGET_ACTIONS] as const;
export const simulationActionLabel = (action: string) => action === 'runToTarget' ? 'Run to target ball' : action === 'kickBall' ? 'Kick ball (foot contact)' : action;
export const SIMULATION_PLANTING_ACTIONS = THREED_PLANTING_TARGET_ACTIONS;
export const MAX_SIMULATION_STEPS = 50;
export const MAX_SIMULATION_OBSERVATIONS = 32;
export const MAX_SIMULATION_BYTES = 65_536;
export type SimulationAction = typeof SIMULATION_ACTIONS[number];
export type SimulationStep = { id: string; action: SimulationAction; actorMarkerId: string; targetMarkerId: string; timeoutMs: number; onFailure: 'stop' | 'continue' };
export type SimulationSensorReference = { ownerMarkerId: number; id: string };
export type SimulationObservation = { id: string; kind: 'sensor-group'; sensorGroupId: string; sensors?: SimulationSensorReference[] };
export type SimulationDefinition = { version: 1; steps: SimulationStep[]; observations: SimulationObservation[] };
export const emptySimulationDefinition = (): SimulationDefinition => ({ version: 1, steps: [], observations: [] });

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SimulationInputError('Invalid Simulation input.');
  if (Object.keys(value).some(key => !keys.includes(key))) throw new SimulationInputError('Unexpected Simulation fields.');
  return value as Record<string, unknown>;
}
export function simulationId(value: unknown, label = 'ID'): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0 || n > 2_147_483_647) throw new SimulationInputError(`${label} must be a positive integer.`);
  return n;
}
function token(value: unknown, label: string, max = 128): string {
  if (typeof value !== 'string' || !new RegExp(`^[a-zA-Z0-9_-]{1,${max}}$`).test(value)) throw new SimulationInputError(`Invalid ${label}.`);
  return value;
}
export function parseSimulationDefinition(value: unknown): SimulationDefinition {
  const d = object(value, ['version', 'steps', 'observations']);
  if (d.version !== 1 || !Array.isArray(d.steps) || d.steps.length > MAX_SIMULATION_STEPS || !Array.isArray(d.observations) || d.observations.length > MAX_SIMULATION_OBSERVATIONS) throw new SimulationInputError('Use version 1 with at most 50 Actions and 32 observation sources.');
  const stepIds = new Set<string>(), observationIds = new Set<string>(), groups = new Set<string>();
  let sensorCount = 0;
  const steps = d.steps.map((value): SimulationStep => {
    const s = object(value, ['id', 'action', 'actorMarkerId', 'targetMarkerId', 'timeoutMs', 'onFailure']);
    const id = token(s.id, 'Action ID', 64);
    if (stepIds.has(id)) throw new SimulationInputError('Action IDs must be unique.'); stepIds.add(id);
    if (!SIMULATION_ACTIONS.includes(s.action as SimulationAction)) throw new SimulationInputError('Choose a supported targeted Action.');
    if (!Number.isInteger(s.timeoutMs) || Number(s.timeoutMs) < 1000 || Number(s.timeoutMs) > 300_000) throw new SimulationInputError('Action timeout must be 1,000–300,000 milliseconds.');
    if (s.onFailure !== 'stop' && s.onFailure !== 'continue') throw new SimulationInputError('Choose Stop or Continue on failure.');
    return { id, action: s.action as SimulationAction, actorMarkerId: token(s.actorMarkerId, 'Character marker'), targetMarkerId: token(s.targetMarkerId, 'target marker'), timeoutMs: s.timeoutMs as number, onFailure: s.onFailure };
  });
  const observations = d.observations.map(value => {
    const s = object(value, ['id', 'kind', 'sensorGroupId', 'sensors']);
    const id = token(s.id, 'observation ID', 64), sensorGroupId = token(s.sensorGroupId, 'Sensor Group', 64);
    if (s.kind !== 'sensor-group' || observationIds.has(id) || groups.has(sensorGroupId)) throw new SimulationInputError('Use unique Sensor Group observation sources.');
    observationIds.add(id); groups.add(sensorGroupId);
    let sensors: SimulationSensorReference[] | undefined;
    if (s.sensors !== undefined) {
      if (!Array.isArray(s.sensors) || !s.sensors.length || s.sensors.length > 32 || (sensorCount += s.sensors.length) > 128) throw new SimulationInputError('Choose 1–32 Sensors per group, at most 128 overall.');
      const keys = new Set<string>();
      sensors = s.sensors.map(value => {
        const sensor = object(value, ['ownerMarkerId', 'id']);
        const ownerMarkerId = simulationId(sensor.ownerMarkerId, 'Sensor owner'), id = token(sensor.id, 'Sensor ID', 64);
        const key = `${ownerMarkerId}:${id}`;
        if (keys.has(key)) throw new SimulationInputError('Sensor choices must be unique.'); keys.add(key);
        return { ownerMarkerId, id };
      });
    }
    return { id, kind: 'sensor-group' as const, sensorGroupId, ...(sensors ? { sensors } : {}) };
  });
  return { version: 1, steps, observations };
}
export function simulationFields(value: unknown, edit: boolean) {
  const input = object(value, edit ? ['id', 'revision', 'name', 'slug', 'description', 'isActive', 'definition'] : ['projectId', 'threedId', 'name', 'slug', 'description', 'isActive', 'definition']);
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const slug = typeof input.slug === 'string' ? input.slug.trim() : '';
  const description = input.description === null ? '' : typeof input.description === 'string' ? input.description.trim() : '';
  if (!name || name.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 100 || description.length > 2000 || typeof input.isActive !== 'boolean' || (input.description !== undefined && input.description !== null && typeof input.description !== 'string')) throw new SimulationInputError('Check the name, slug, description and Active value.');
  const definition = parseSimulationDefinition(input.definition);
  if (input.isActive && !definition.steps.length) throw new SimulationInputError('Add an Action before marking a Simulation active.');
  return { name, slug, description: description || null, isActive: input.isActive, definition };
}
const sorts = ['name', 'slug', 'project', 'revision', 'active', 'createdAt'] as const;
export function simulationListQuery(params: URLSearchParams) {
  if (params.has('scenarioId')) throw new SimulationInputError('Scenario filters are not supported for Simulations.');
  const limit = params.has('limit') ? simulationId(params.get('limit'), 'Limit') : 50;
  const raw = params.get('offset') ?? '0';
  const search = params.get('search')?.trim() ?? '', sort = params.get('sort') ?? 'name', direction = params.get('direction') ?? 'asc';
  if (limit > 100 || !/^\d+$/.test(raw) || Number(raw) > 1_000_000 || search.length > 120 || !sorts.includes(sort as typeof sorts[number]) || !['asc', 'desc'].includes(direction)) throw new SimulationInputError('Invalid Simulation list query.');
  if (params.has('isActive') && !['true', 'false'].includes(params.get('isActive')!)) throw new SimulationInputError('Invalid Active filter.');
  return { limit, offset: Number(raw), search, sort: sort as typeof sorts[number], direction, projectId: params.has('projectId') ? simulationId(params.get('projectId'), 'Project ID') : null,
    threedId: params.has('threedId') ? simulationId(params.get('threedId'), 'ThreeD ID') : null,
    isActive: params.has('isActive') ? params.get('isActive') === 'true' : null };
}
