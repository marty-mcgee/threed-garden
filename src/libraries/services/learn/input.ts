import { InputValidationError, readArray, readBoolean, readGuid, readInteger, readStrictObject, readString } from '@/libraries/utils/input-validation';
import { LEARN_CATEGORY_DESCRIPTION_LIMIT, LEARN_CATEGORY_NAME_LIMIT, LEARN_CONTENT_LIMIT, LEARN_GUIDE_CATEGORY_LIMIT, LEARN_SEARCH_LIMIT, LEARN_SLUG_LIMIT, LEARN_SUMMARY_LIMIT, LEARN_TITLE_LIMIT, learnGuideSorts, type LearnCategoryInput, type LearnGuideInput, type LearnGuideSort } from './contracts';

export class LearnError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

const guideFields = [
  'title',
  'slug',
  'summary',
  'content',
  'sortOrder',
  'isActive',
  'isPublished',
  'isPublic',
  'categoryIds',
] as const;

export function parseLearnCategoryIds(value: unknown): number[] {
  const ids = readArray(value, LEARN_GUIDE_CATEGORY_LIMIT).map(id => readInteger(id, 1, 2147483647));
  if (new Set(ids).size !== ids.length) throw new InputValidationError('Select each Category only once.');
  return ids.sort((a, b) => a - b);
}

export function parseLearnSlug(value: unknown): string {
  const slug = readString(value, 1, LEARN_SLUG_LIMIT, true);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new InputValidationError();
  return slug;
}

function guideInput(input: Record<string, unknown>): LearnGuideInput {
  return {
    title: readString(input.title, 1, LEARN_TITLE_LIMIT, true),
    slug: parseLearnSlug(input.slug),
    summary: input.summary === undefined ? '' : readString(input.summary, 0, LEARN_SUMMARY_LIMIT, true),
    content: input.content === undefined ? '' : readString(input.content, 0, LEARN_CONTENT_LIMIT),
    sortOrder: input.sortOrder === undefined ? 0 : readInteger(input.sortOrder, -10000, 10000),
    isActive: input.isActive === undefined ? true : readBoolean(input.isActive),
    isPublished: input.isPublished === undefined ? false : readBoolean(input.isPublished),
    ...(input.isPublic === undefined ? {} : { isPublic: readBoolean(input.isPublic) }),
    ...(input.categoryIds === undefined ? {} : { categoryIds: parseLearnCategoryIds(input.categoryIds) }),
  };
}

export function parseLearnGuideInput(value: unknown): LearnGuideInput {
  return { isPublic: true, ...guideInput(readStrictObject(value, guideFields)) };
}

export function parseLearnGuideUpdate(value: unknown): LearnGuideInput & {
  id: number;
  revision: string;
} {
  const input = readStrictObject(value, [
    ...guideFields,
    'id',
    'revision',
  ]);
  return {
    ...guideInput(input),
    id: readInteger(input.id, 1, 2147483647),
    revision: readGuid(input.revision),
  };
}

export function parseLearnImport(value: unknown): Record<string, never> {
  readStrictObject(value, []);
  return {};
}

const categoryFields = [
  'name',
  'slug',
  'description',
  'parentId',
  'sortOrder',
  'isActive',
] as const;

function categoryInput(input: Record<string, unknown>): LearnCategoryInput {
  return {
    name: readString(input.name, 1, LEARN_CATEGORY_NAME_LIMIT, true),
    slug: parseLearnSlug(input.slug),
    description: input.description == null ? null : readString(input.description, 0, LEARN_CATEGORY_DESCRIPTION_LIMIT, true) || null,
    parentId: input.parentId == null ? null : readInteger(input.parentId, 1, 2147483647),
    sortOrder: input.sortOrder === undefined ? 0 : readInteger(input.sortOrder, -10000, 10000),
    isActive: input.isActive === undefined ? true : readBoolean(input.isActive),
  };
}

export function parseLearnCategoryInput(value: unknown): LearnCategoryInput {
  return categoryInput(readStrictObject(value, categoryFields));
}

export function parseLearnCategoryUpdate(value: unknown): LearnCategoryInput & { id: number; revision: string } {
  const input = readStrictObject(value, [...categoryFields, 'id', 'revision']);
  return {
    ...categoryInput(input),
    id: readInteger(input.id, 1, 2147483647),
    revision: readGuid(input.revision),
  };
}

export function learnId(value: unknown, record: 'guide' | 'Category' = 'guide'): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) throw new LearnError(400, `Invalid Learn ${record} ID.`);
  return Number(value);
}
export function learnRevision(value: unknown): string { return readGuid(value); }
export function exactLearnQuery(params: URLSearchParams, allowed: readonly string[]) {
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) throw new LearnError(400, 'Invalid Learn query parameters.');
  }
}

export interface LearnGuideQuery {
  limit: number; offset: number; search: string; sort: LearnGuideSort; direction: 'asc' | 'desc';
  isActive: boolean | null; isPublished: boolean | null;
}
export function learnListQuery(params: URLSearchParams, publicRead = false): LearnGuideQuery {
  const common = ['limit', 'offset', 'search', 'sort', 'direction'];
  exactLearnQuery(params, publicRead ? common : [...common, 'isActive', 'isPublished']);
  const number = (key: string, fallback: number, minimum: number, maximum: number) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw) || Number(raw) < minimum || Number(raw) > maximum) throw new LearnError(400, `Invalid Learn ${key}.`);
    return Number(raw);
  };
  const search = (params.get('search') ?? '').trim();
  if (search.length > LEARN_SEARCH_LIMIT) throw new LearnError(400, 'Learn search is too long.');
  const sort = params.get('sort') ?? 'sortOrder';
  if (!learnGuideSorts.some(key => key === sort) || publicRead && (sort === 'isActive' || sort === 'isPublished' || sort === 'categories')) throw new LearnError(400, 'Invalid Learn sort.');
  const direction = params.get('direction') ?? 'asc';
  if (direction !== 'asc' && direction !== 'desc') throw new LearnError(400, 'Invalid Learn sort direction.');
  const flag = (key: string) => {
    const raw = params.get(key);
    if (raw === null) return null;
    if (raw !== 'true' && raw !== 'false') throw new LearnError(400, `Invalid ${key} filter.`);
    return raw === 'true';
  };
  return { limit: number('limit', 25, 1, 200), offset: number('offset', 0, 0, 1_000_000), search,
    sort: sort as LearnGuideSort, direction, isActive: flag('isActive'), isPublished: flag('isPublished') };
}
