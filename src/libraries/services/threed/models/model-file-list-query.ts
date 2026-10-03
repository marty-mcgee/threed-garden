export const MODEL_FILE_LIST_FILE_TYPES = ['model', 'texture', 'binary', 'other', 'animation'] as const;
export const MODEL_FILE_LIST_SORT_FIELDS = ['name', 'path', 'model', 'type', 'role', 'size', 'loadOrder'] as const;
export type ModelFileListSortField = typeof MODEL_FILE_LIST_SORT_FIELDS[number];
export interface ModelFileListQuery {
  search: string;
  modelId: number | null;
  fileType: typeof MODEL_FILE_LIST_FILE_TYPES[number] | null;
  role: 'primary' | 'supporting' | null;
  limit: number;
  offset: number;
  sort: ModelFileListSortField;
  direction: 'asc' | 'desc';
}

const QUERY_KEYS = new Set(['search', 'modelId', 'fileType', 'role', 'limit', 'offset', 'sort', 'direction']);

/** The list has no public scope or mutation options; ambiguous inputs are refused. */
export function parseModelFileListQuery(params: URLSearchParams): ModelFileListQuery {
  const seen = new Set<string>();
  for (const key of params.keys()) {
    if (!QUERY_KEYS.has(key)) throw new Error('Unsupported query parameter');
    if (seen.has(key)) throw new Error('Duplicate query parameter');
    seen.add(key);
  }
  const integer = (key: string, fallback: number, min: number, max: number): number => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const value = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const search = (params.get('search') ?? '').trim();
  if (search.length > 200) throw new Error('Search is too long');
  if (search.includes('\u0000')) throw new Error('Invalid search');
  const rawModelId = params.get('modelId');
  const modelId = rawModelId === null ? null : /^[1-9]\d*$/.test(rawModelId) ? Number(rawModelId) : NaN;
  if (modelId !== null && (!Number.isSafeInteger(modelId) || modelId > 2_147_483_647)) throw new Error('Invalid modelId');
  const fileType = params.get('fileType');
  if (fileType !== null && !(MODEL_FILE_LIST_FILE_TYPES as readonly string[]).includes(fileType)) throw new Error('Invalid fileType');
  const role = params.get('role');
  if (role !== null && role !== 'primary' && role !== 'supporting') throw new Error('Invalid role');
  const sort = params.get('sort') ?? 'name';
  if (!(MODEL_FILE_LIST_SORT_FIELDS as readonly string[]).includes(sort)) throw new Error('Invalid sort');
  const direction = params.get('direction') ?? 'asc';
  if (direction !== 'asc' && direction !== 'desc') throw new Error('Invalid direction');
  return {
    search, modelId, fileType: fileType as ModelFileListQuery['fileType'], role,
    limit: integer('limit', 50, 1, 200), offset: integer('offset', 0, 0, 2_147_483_647),
    sort: sort as ModelFileListSortField, direction,
  };
}
