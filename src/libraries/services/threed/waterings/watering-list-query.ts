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

export const wateringScheduleSortFields = [
  'sortOrder',
  'scheduleId',
  'frequency',
  'nextWatering',
  'lastWatering',
  'durationMs',
  'volumeMl',
  'isActive',
] as const;

type WateringScheduleSortField = typeof wateringScheduleSortFields[number];

export function parseWateringScheduleSort(params: URLSearchParams) {
  const field = params.get('sortBy') ?? 'nextWatering';
  const direction = params.get('sortDir') ?? 'desc';
  if (!wateringScheduleSortFields.some(allowed => allowed === field) || (direction !== 'asc' && direction !== 'desc')) {
    throw new Error('Invalid watering schedule sort');
  }
  return { field: field as WateringScheduleSortField, direction };
}

export const wateringHistorySortFields = [
  'sortOrder',
  'historyId',
  'executedAt',
  'status',
  'durationMs',
  'volumeMl',
  'scheduleId',
  'executedBy',
] as const;

export function parseWateringHistorySort(params: URLSearchParams) {
  const field = params.get('sortBy') ?? 'executedAt';
  const direction = params.get('sortDir') ?? 'desc';
  if (!wateringHistorySortFields.some(allowed => allowed === field) || (direction !== 'asc' && direction !== 'desc')) {
    throw new Error('Invalid watering history sort');
  }
  return { field: field as typeof wateringHistorySortFields[number], direction };
}

export function isMissingWateringSortOrder(error: unknown) {
  for (let current = error, depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const cause = current as { code?: string; message?: string; cause?: unknown };
    if (cause.code === '42703' && /^column (?:"?threed_watering_(?:schedules|history)"?\."?sort_order"?|"sort_order"(?: of relation "threed_watering_(?:schedules|history)")?) does not exist$/.test(cause.message ?? '')) return true;
    current = cause.cause;
  }
  return false;
}
