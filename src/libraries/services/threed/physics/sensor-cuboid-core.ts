import { legacySensorDefaults, legacySensorArray } from './sensor-legacy-compat';
export const PHYSICS_SENSOR_BEHAVIORS = ['trigger', 'counter'] as const;
export type PhysicsSensorBehavior = typeof PHYSICS_SENSOR_BEHAVIORS[number];

export interface PhysicsSensorCuboid {
  id: string;
  name: string;
  behavior: PhysicsSensorBehavior;
  detection: 'movable-ball' | 'model';
  groupId: string | null;
  position: Readonly<{ x: number; y: number; z: number }>;
  width: number;
  height: number;
  depth: number;
  rotationY: number;
}

const MAX_SENSOR_COUNT = 8;
const MAX_SENSOR_VALUE = 10_000;

function boundedNumber(value: unknown, minimum: number): number | null {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= MAX_SENSOR_VALUE
    ? value
    : null;
}

export type PhysicsSensorValidation =
  | { success: true; sensors: readonly Readonly<PhysicsSensorCuboid>[] }
  | { success: false; error: string };

/** Shared by the editor and PATCH handler: validate the entire replacement collection. */
export function validatePhysicsSensorCuboids(sensors: unknown): PhysicsSensorValidation {
  const fail = (error: string): PhysicsSensorValidation => ({ success: false, error });
  if (!Array.isArray(sensors)) return fail('Physics Sensors must be an array.');
  if (sensors.length > MAX_SENSOR_COUNT) return fail('A marker can have at most 8 Physics Sensors.');
  const ids = new Set<string>();
  const result: Readonly<PhysicsSensorCuboid>[] = [];
  for (const [index, value] of sensors.entries()) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(`Sensor ${index + 1}: invalid sensor object.`);
    const sensor = value as Record<string, any>;
    const id = typeof sensor.id === 'string' ? sensor.id.trim() : '';
    const name = typeof sensor.name === 'string' ? sensor.name.trim() : '';
    const legacy = legacySensorDefaults(sensor);
    const behavior = legacy?.behavior ?? sensor.behavior ?? 'trigger';
    const detection = sensor.detection ?? legacy?.detection ?? 'movable-ball';
    const groupId = sensor.groupId === undefined ? legacy?.groupId ?? null : sensor.groupId;
    const x = boundedNumber(sensor.position?.x, -MAX_SENSOR_VALUE);
    const y = boundedNumber(sensor.position?.y, -MAX_SENSOR_VALUE);
    const z = boundedNumber(sensor.position?.z, -MAX_SENSOR_VALUE);
    const width = boundedNumber(sensor.width, 0.05);
    const height = boundedNumber(sensor.height, 0.05);
    const depth = boundedNumber(sensor.depth, 0.05);
    const rotationY = boundedNumber(sensor.rotationY, -MAX_SENSOR_VALUE);
    const label = name ? `Sensor ${index + 1} (“${name.slice(0, 80)}”)` : `Sensor ${index + 1}`;
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return fail(`${label}: invalid sensor ID.`);
    if (ids.has(id)) return fail(`${label}: duplicate sensor ID.`);
    if (!name || name.length > 80) return fail(`${label}: name must contain 1–80 characters.`);
    if (!PHYSICS_SENSOR_BEHAVIORS.includes(behavior)) return fail(`${label}: invalid sensor behavior.`);
    if (!['movable-ball', 'model'].includes(detection)) return fail(`${label}: invalid detection filter.`);
    if (groupId !== null && (typeof groupId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(groupId))) return fail(`${label}: invalid group ID.`);
    for (const [field, parsed] of Object.entries({ x, y, z, rotationY })) {
      if (parsed === null) return fail(`${label}: ${field} must be a finite number between −10,000 and 10,000.`);
    }
    for (const [field, parsed] of Object.entries({ width, height, depth })) {
      if (parsed === null) return fail(`${label}: ${field} must be a finite number between 0.05 and 10,000.`);
    }
    ids.add(id);
    result.push(Object.freeze({
      id,
      name,
      behavior: behavior as PhysicsSensorBehavior,
      detection,
      groupId,
      position: Object.freeze({ x: x!, y: y!, z: z! }),
      width: width!,
      height: height!,
      depth: depth!,
      rotationY: rotationY!,
    }));
  }
  return { success: true, sensors: Object.freeze(result) };
}

export function readPhysicsSensorCuboids(metadata: unknown): readonly Readonly<PhysicsSensorCuboid>[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return Object.freeze([]);
  const record = metadata as Record<string, unknown>;
  const parsed = validatePhysicsSensorCuboids(
    Array.isArray(record.physicsSensorCuboids) ? record.physicsSensorCuboids : legacySensorArray(record),
  );
  return parsed.success ? parsed.sensors : Object.freeze([]);
}
