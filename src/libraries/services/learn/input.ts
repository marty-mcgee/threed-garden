import { z } from 'zod';
import { LEARN_CONTENT_LIMIT, LEARN_SEARCH_LIMIT, LEARN_SLUG_LIMIT, LEARN_SUMMARY_LIMIT, LEARN_TITLE_LIMIT, learnGuideSorts, type LearnGuideInput, type LearnGuideSort } from './contracts';

export class LearnError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export const learnSlugSchema = z.string().trim().min(1).max(LEARN_SLUG_LIMIT).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const learnGuideInputSchema = z.object({
  title: z.string().trim().min(1).max(LEARN_TITLE_LIMIT),
  slug: learnSlugSchema,
  summary: z.string().trim().max(LEARN_SUMMARY_LIMIT).default(''),
  content: z.string().max(LEARN_CONTENT_LIMIT).default(''),
  sortOrder: z.number().int().min(-10000).max(10000).default(0),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(false),
}).strict();
export const learnGuideUpdateSchema = learnGuideInputSchema.extend({ id: z.number().int().positive().max(2147483647), revision: z.string().uuid() });
export const learnImportSchema = z.object({}).strict();
export const parseLearnGuideInput = (value: unknown): LearnGuideInput => learnGuideInputSchema.parse(value);

export function learnId(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) throw new LearnError(400, 'Invalid Learn guide ID.');
  return Number(value);
}
export function learnRevision(value: unknown): string { return z.string().uuid().parse(value); }
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
  if (!learnGuideSorts.some(key => key === sort) || publicRead && (sort === 'isActive' || sort === 'isPublished')) throw new LearnError(400, 'Invalid Learn sort.');
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
