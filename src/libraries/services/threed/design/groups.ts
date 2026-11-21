export interface ThreeDGroup {
  id: string;
  name: string;
  entityIds: string[];
  markerIds: string[];
}

export function parseThreeDGroups(value: unknown): ThreeDGroup[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Invalid ThreeD Groups.');
  const seen = new Set<string>();
  const ids = (list: unknown): string[] => {
    if (!Array.isArray(list) || list.length > 20000 || list.some(id => typeof id !== 'string' || !id || id.length > 200)
      || new Set(list).size !== list.length) throw new Error('Invalid ThreeD Group membership.');
    return list;
  };
  return value.map(item => {
    if (!item || typeof item.id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(item.id)
      || seen.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120) throw new Error('Invalid ThreeD Group identity or name.');
    seen.add(item.id);
    return {
      id: item.id,
      name: item.name.trim(),
      entityIds: ids(item.entityIds),
      markerIds: ids(item.markerIds),
    };
  });
}
