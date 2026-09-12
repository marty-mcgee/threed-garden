export function parseWateringListQuery(params: URLSearchParams) {
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key) ?? String(fallback);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < min || Number(raw) > max) throw new Error(`Invalid ${key}`);
    return Number(raw);
  };
  for (const key of ['id', 'moduleId', 'plantId', 'plantingId', 'farmbotId', 'bedId', 'scheduleId']) {
    if (params.has(key)) integer(key, 1, 1, 2147483647);
  }
  if (params.has('isActive') && !['true', 'false'].includes(params.get('isActive')!)) throw new Error('Invalid isActive');
  const search = (params.get('search') ?? '').trim();
  if (search.length > 200) throw new Error('Search is too long');
  return { limit: integer('limit', 50, 1, 200), offset: integer('offset', 0, 0, 2147483647), search };
}
