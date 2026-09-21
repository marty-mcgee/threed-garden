export const LAYER_LIST_SORTS = ['name', 'layerId', 'type', 'visible', 'locked', 'active', 'createdAt'] as const;
export function parseLayerListQuery(params: URLSearchParams) {
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key) ?? String(fallback);
    const value = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const sort = params.get('sort') ?? 'createdAt';
  const direction = params.get('direction') ?? 'desc';
  const search = (params.get('search') ?? '').trim();
  const isActive = params.get('isActive');
  const projectId = params.get('projectId');
  const isVisible = params.get('isVisible');
  if (projectId !== null && (!/^\d+$/.test(projectId) || Number(projectId) < 1 || Number(projectId) > 2147483647)) throw new Error('Invalid projectId');
  if (isVisible !== null && !['true', 'false'].includes(isVisible)) throw new Error('Invalid isVisible');
  if (!(LAYER_LIST_SORTS as readonly string[]).includes(sort)) throw new Error('Invalid sort');
  if (!['asc', 'desc'].includes(direction)) throw new Error('Invalid direction');
  if (search.length > 200) throw new Error('Search is too long');
  if (isActive !== null && !['true', 'false'].includes(isActive)) throw new Error('Invalid isActive');
  return { limit: integer('limit', 50, 1, 200), offset: integer('offset', 0, 0, 2147483647), sort: sort as typeof LAYER_LIST_SORTS[number], direction, search, isActive, isVisible, projectId };
}
