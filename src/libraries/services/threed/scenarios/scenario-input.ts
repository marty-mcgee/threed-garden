export class ScenarioInputError extends Error {}

export function positiveId(value: unknown, label: string): number {
  const number = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < 1) throw new ScenarioInputError(`${label} must be a positive integer.`);
  return number;
}

export function scenarioFields(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ScenarioInputError('Invalid Scenario.');
  const input = value as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const slug = typeof input.slug === 'string' ? input.slug.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (!name || name.length > 120) throw new ScenarioInputError('Name must be 1–120 characters.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) throw new ScenarioInputError('Slug must be 1–100 lowercase letters, numbers or hyphen-separated words.');
  if (description.length > 2000) throw new ScenarioInputError('Description must be at most 2,000 characters.');
  if (typeof input.isActive !== 'boolean') throw new ScenarioInputError('Active must be true or false.');
  return { name, slug, description: description || null, isActive: input.isActive };
}

const sortKeys = ['name', 'slug', 'project', 'active', 'createdAt'] as const;
export type ScenarioSort = typeof sortKeys[number];
export function scenarioListQuery(params: URLSearchParams) {
  const limit = params.has('limit') ? positiveId(params.get('limit'), 'Limit') : 25;
  const offsetRaw = params.get('offset') ?? '0';
  if (!/^\d+$/.test(offsetRaw) || !Number.isSafeInteger(Number(offsetRaw)) || Number(offsetRaw) > 1_000_000) throw new ScenarioInputError('Invalid offset.');
  const search = params.get('search')?.trim() ?? '';
  const sort = params.get('sort') ?? 'name';
  const direction = params.get('direction') ?? 'asc';
  const active = params.get('isActive');
  if (active !== null && active !== 'true' && active !== 'false') throw new ScenarioInputError('Invalid active filter.');
  if (limit > 100 || search.length > 120 || !sortKeys.includes(sort as ScenarioSort) || !['asc', 'desc'].includes(direction)) throw new ScenarioInputError('Invalid list query.');
  return {
    limit, offset: Number(offsetRaw), search,
    sort: sort as ScenarioSort, direction: direction as 'asc' | 'desc',
    projectId: params.has('projectId') ? positiveId(params.get('projectId'), 'Project ID') : null,
    isActive: active === null ? null : active === 'true',
  };
}
