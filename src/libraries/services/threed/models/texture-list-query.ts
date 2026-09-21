export const TEXTURE_SORT_FIELDS = ['name', 'fileName', 'type', 'references', 'active', 'size'] as const;
export type TextureSortField = typeof TEXTURE_SORT_FIELDS[number];

/** The unparameterized endpoint remains the full reusable Texture catalog. */
export function parseTextureListQuery(params: URLSearchParams) {
  if (!['limit', 'offset', 'search', 'sort', 'direction'].some((key) => params.has(key))) return null;
  function integer(key: string, fallback: number, min: number, max: number) {
    const raw = params.get(key);
    const value = raw === null ? fallback : /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  }
  const sort = params.get('sort') ?? 'name';
  const direction = params.get('direction') ?? 'asc';
  if (!(TEXTURE_SORT_FIELDS as readonly string[]).includes(sort)) throw new Error('Invalid sort');
  if (direction !== 'asc' && direction !== 'desc') throw new Error('Invalid direction');
  return { limit: integer('limit', 50, 1, 200), offset: integer('offset', 0, 0, 2147483647),
    search: params.get('search')?.trim() ?? '', sort: sort as TextureSortField, direction };
}
