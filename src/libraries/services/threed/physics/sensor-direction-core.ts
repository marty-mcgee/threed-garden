import type { PhysicsSensorCuboid } from './sensor-cuboid-core';

type Vector = { x: number; y: number; z: number };
/** Outward entry-face normal in sensor-local coordinates; travel points opposite. */
export function sensorEntryNormal(entrySide: PhysicsSensorCuboid['entrySide']): Vector {
  switch (entrySide) {
    case 'positive-x': return { x: 1, y: 0, z: 0 };
    case 'negative-x': return { x: -1, y: 0, z: 0 };
    case 'negative-z': return { x: 0, y: 0, z: -1 };
    default: return { x: 0, y: 0, z: 1 };
  }
}
/** Scene coordinates by default; optionally rotate the direction with the sensor.
 * Entry callbacks can arrive after the centre crosses the plane, so use travel, not centre side. */
export function acceptsSensorEntry(
  sensor: Pick<PhysicsSensorCuboid, 'direction' | 'entrySide' | 'directionSpace'>,
  pose: { position: Vector; rotation: Vector & { w: number } },
  source: { position: Vector; velocity: Vector },
): boolean {
  if (sensor.direction !== 'unidirectional') return true;
  const { x, y, z, w } = pose.rotation;
  const local = sensorEntryNormal(sensor.entrySide);
  const normal = sensor.directionSpace !== 'local' ? local : {
    x: local.x * (1 - 2 * (y * y + z * z)) + local.z * 2 * (x * z + w * y),
    y: local.x * 2 * (x * y + w * z) + local.z * 2 * (y * z - w * x),
    z: local.x * 2 * (x * z - w * y) + local.z * (1 - 2 * (x * x + y * y)),
  };
  const travel = source.velocity.x * normal.x + source.velocity.y * normal.y + source.velocity.z * normal.z;
  return Number.isFinite(travel) && travel < -0.0001;
}
