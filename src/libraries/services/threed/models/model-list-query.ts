export const MODEL_LIST_SORT_FIELDS = ['name', 'category', 'options', 'type', 'status', 'active', 'size', 'createdAt'] as const;
export type ModelListSortField = typeof MODEL_LIST_SORT_FIELDS[number];

/** Bound list requests and allow only known sort keys; values never become raw SQL. */
export function parseModelListQuery(params: URLSearchParams) {
  function integer(key: string, fallback: number, min: number, max: number) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const value = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  }
  const sort = params.get('sort') ?? 'createdAt';
  const direction = params.get('direction') ?? 'desc';
  if (!(MODEL_LIST_SORT_FIELDS as readonly string[]).includes(sort)) throw new Error('Invalid sort');
  if (direction !== 'asc' && direction !== 'desc') throw new Error('Invalid direction');
  return { limit: integer('limit', 50, 1, 200), offset: integer('offset', 0, 0, 2147483647),
    sort: sort as ModelListSortField, direction };
}
