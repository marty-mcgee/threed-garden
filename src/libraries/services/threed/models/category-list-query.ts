export const CATEGORY_SORT_FIELDS = ['name', 'slug', 'parent', 'order', 'active'] as const;
export type CategorySortField = typeof CATEGORY_SORT_FIELDS[number];

/** Pagination is opt-in so existing taxonomy selectors still receive all categories. */
export function parseCategoryListQuery(params: URLSearchParams) {
  if (!['limit', 'offset', 'search', 'sort', 'direction'].some((key) => params.has(key))) return null;
  function integer(key: string, fallback: number, min: number, max: number) {
    const raw = params.get(key);
    const value = raw === null ? fallback : /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  }
  const sort = params.get('sort') ?? 'order';
  const direction = params.get('direction') ?? 'asc';
  if (!(CATEGORY_SORT_FIELDS as readonly string[]).includes(sort)) throw new Error('Invalid sort');
  if (direction !== 'asc' && direction !== 'desc') throw new Error('Invalid direction');
  return { limit: integer('limit', 50, 1, 200), offset: integer('offset', 0, 0, 2147483647),
    search: params.get('search')?.trim() ?? '', sort: sort as CategorySortField, direction };
}
