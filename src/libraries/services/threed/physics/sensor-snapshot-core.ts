import type { SensorCounterState } from './sensor-counter-core';

export type ProjectSensorSnapshot = SensorCounterState & { version: 1; projectId: number };
const MAX_COUNTERS = 16_384;
const MAX_OCCUPANCIES = 32_768;
const memberKey = (key: string) => /^[1-9][0-9]*:[a-zA-Z0-9_-]{1,64}$/.test(key)
  && Number.isSafeInteger(Number(key.split(':')[0]));

/** Bounded, versioned data stored in the existing owner-scoped Project snapshot. */
export function parseProjectSensorSnapshot(value: unknown): ProjectSensorSnapshot {
  const fail = (): never => { throw new Error('invalid_project_sensor_snapshot'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
  const input = value as Record<string, unknown>;
  if (input.version !== 1 || !Number.isSafeInteger(input.projectId) || Number(input.projectId) <= 0
    || !input.counts || typeof input.counts !== 'object' || Array.isArray(input.counts)
    || !Array.isArray(input.occupied)) return fail();
  const entries = Object.entries(input.counts);
  if (entries.length > MAX_COUNTERS || input.occupied.length > MAX_OCCUPANCIES) return fail();
  if (entries.some(([key, count]) => !memberKey(key) || !Number.isSafeInteger(count) || Number(count) < 0)) return fail();
  const occupied: string[] = [];
  for (const key of input.occupied) {
    if (typeof key !== 'string' || key.length > 140) return fail();
    const parts = key.split('|');
    if (parts.length !== 2 || !memberKey(parts[0])
      || !/^(marker|models|characters|beds|plantings|farmbots):[1-9][0-9]*$/.test(parts[1])
      || !Number.isSafeInteger(Number(parts[1].split(':')[1]))) return fail();
    occupied.push(key);
  }
  return { version: 1, projectId: Number(input.projectId),
    counts: Object.fromEntries(entries) as Record<string, number>, occupied: [...new Set(occupied)] };
}

export function restoreProjectSensorState(snapshot: ProjectSensorSnapshot | undefined, projectId: number | undefined): SensorCounterState {
  if (!snapshot || snapshot.projectId !== projectId) return { counts: {}, occupied: [] };
  return { counts: { ...snapshot.counts }, occupied: [...snapshot.occupied] };
}
