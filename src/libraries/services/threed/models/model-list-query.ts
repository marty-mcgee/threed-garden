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

export const MODEL_MISSING_FILTERS = ['missingTextures', 'missingThumbnail', 'missingTopView'] as const;
export function parseModelMissingFilters(params: URLSearchParams) {
  const result = { missingTextures: false, missingThumbnail: false, missingTopView: false };
  for (const key of MODEL_MISSING_FILTERS) {
    const value = params.get(key);
    if (value !== null && value !== 'true' && value !== 'false') throw new Error('Invalid '+key);
    result[key] = value === 'true';
  }
  return result;
}

export interface ModelAdminListState {
  page: number; pageSize: number; search: string; sort: ModelListSortField; direction: 'asc' | 'desc';
  category: string; modelType: string; status: string; isActive: string;
  missingTextures: boolean; missingThumbnail: boolean; missingTopView: boolean;
}
export function readModelAdminListState(params: URLSearchParams): ModelAdminListState {
  const limit = Number(params.get('limit') ?? 50);
  const pageSize = [25,50,100,200].includes(limit) ? limit : 50;
  const offset = Number(params.get('offset') ?? 0);
  const sort = params.get('sort') ?? 'name';
  const bounded = (key: string) => (params.get(key) ?? '').slice(0,200);
  return {page: Number.isSafeInteger(offset) && offset >= 0 && offset <= 2147483647 ? Math.floor(offset/pageSize) : 0, pageSize,
    search: bounded('search'), sort: (MODEL_LIST_SORT_FIELDS as readonly string[]).includes(sort) ? sort as ModelListSortField : 'name',
    direction: params.get('direction') === 'desc' ? 'desc' : 'asc', category: bounded('category'), modelType: bounded('modelType'), status: bounded('status'),
    isActive: ['true','false'].includes(params.get('isActive') ?? '') ? params.get('isActive')! : '',
    missingTextures: params.get('missingTextures') === 'true', missingThumbnail: params.get('missingThumbnail') === 'true', missingTopView: params.get('missingTopView') === 'true'};
}
/** Preserve unrelated URL parameters; these keys alone belong to the Model list. */
export function writeModelAdminListState(params: URLSearchParams, state: ModelAdminListState) {
  const next = new URLSearchParams(params);
  for (const key of ['limit','offset','search','sort','direction','category','modelType','status','isActive',...MODEL_MISSING_FILTERS]) next.delete(key);
  if(state.pageSize !== 50)next.set('limit',String(state.pageSize));
  if(state.page > 0)next.set('offset',String(state.page*state.pageSize));
  for (const key of ['search','category','modelType','status','isActive'] as const) if(state[key])next.set(key,state[key]);
  if(state.sort !== 'name')next.set('sort',state.sort);
  if(state.direction !== 'asc')next.set('direction',state.direction);
  for (const key of MODEL_MISSING_FILTERS)if(state[key])next.set(key,'true');
  return next;
}
