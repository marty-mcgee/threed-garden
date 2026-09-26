/** Read-only compatibility boundary. New records never write these historic fields. */
export const IMPORTED_SENSOR_GROUP = { id: 'imported-sensors', name: 'Imported sensors' };
export function legacySensorDefaults(sensor: Record<string, unknown>) {
  const counter = sensor.behavior === 'soccer-home-goal' || sensor.behavior === 'soccer-away-goal'
    || sensor.scoresFor === 'home' || sensor.scoresFor === 'away';
  return counter ? { behavior: 'counter', detection: 'movable-ball', groupId: IMPORTED_SENSOR_GROUP.id } : null;
}
export function legacySensorArray(record: Record<string, unknown>) { return record.soccerGoalSensors; }
export function withoutLegacySensorMetadata(record: Record<string, unknown>) {
  const next = { ...record };
  delete next.soccerGoalSensors;
  delete next.soccerGoalScoresFor;
  return next;
}
export interface ModelVolumeSensor { id: string; name: string; behavior: 'counter'; detection: 'movable-ball'; groupId: string | null }
export function readModelVolumeSensor(metadata: any): ModelVolumeSensor | null {
  const configured = metadata?.physicsVolumeSensor;
  if (configured && typeof configured === 'object' && !Array.isArray(configured)) {
    if (configured.id !== 'model-volume' || configured.behavior !== 'counter' || configured.detection !== 'movable-ball'
      || typeof configured.name !== 'string' || !configured.name.trim() || configured.name.length > 80
      || (configured.groupId !== null && (typeof configured.groupId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(configured.groupId)))) return null;
    return { id: 'model-volume', name: configured.name.trim(), behavior: 'counter', detection: 'movable-ball', groupId: configured.groupId };
  }
  if (metadata?.physicsVolumeSensor === false) return null;
  if (metadata?.physicsVolumeSensor === true) return { id: 'model-volume', name: 'Model volume', behavior: 'counter', detection: 'movable-ball', groupId: null };
  const role = metadata?.soccerGoalScoresFor;
  if (role !== 'home' && role !== 'away') return null;
  return { id: 'model-volume', name: role === 'home' ? 'Home Goal' : 'Away Goal', behavior: 'counter', detection: 'movable-ball', groupId: IMPORTED_SENSOR_GROUP.id };
}

export function removeLegacyAttachedSensors(record: Record<string, unknown>) {
  const next = { ...record }; delete next.soccerGoalSensors; return next;
}
