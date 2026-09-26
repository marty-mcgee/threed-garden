export class SensorGroupInputError extends Error {}
export interface SensorGroup { id: string; name: string }
export function readSensorGroups(value: unknown): SensorGroup[] {
  if (!Array.isArray(value) || value.length > 64) throw new SensorGroupInputError('Sensor Groups must be a list of at most 64 groups.');
  const ids = new Set<string>();
  return value.map(item => {
    if (!item || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(item.id) || ids.has(item.id)) throw new SensorGroupInputError('Invalid or duplicate Sensor Group ID.');
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.trim().length > 80) throw new SensorGroupInputError('Group name must contain 1–80 characters.');
    ids.add(item.id);
    return { id: item.id, name: item.name.trim() };
  });
}
