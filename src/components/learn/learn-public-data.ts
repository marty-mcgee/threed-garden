import type { LearnGuidePage, PublicLearnGuide, PublicLearnGuideRow } from '@/libraries/services/learn/contracts';

export function isLearnGuideSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isGuideRow(value: unknown): value is PublicLearnGuideRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return isLearnGuideSlug(row.slug) && typeof row.title === 'string' && typeof row.summary === 'string' && typeof row.updatedAt === 'string';
}

export function readPublicLearnPage(value: unknown): LearnGuidePage<PublicLearnGuideRow> {
  if (!value || typeof value !== 'object') throw new Error('Invalid guide list.');
  const page = value as Record<string, unknown>;
  const paging = page.pagination as Record<string, unknown> | undefined;
  if (page.success !== true || !Array.isArray(page.data) || !page.data.every(isGuideRow) || !paging
    || !Number.isSafeInteger(paging.total) || Number(paging.total) < 0
    || !Number.isSafeInteger(paging.limit) || Number(paging.limit) < 1 || Number(paging.limit) > 200
    || !Number.isSafeInteger(paging.offset) || Number(paging.offset) < 0) throw new Error('Invalid guide list.');
  return { data: page.data.map(({ title, slug, summary, updatedAt }) => ({ title, slug, summary, updatedAt })), pagination: { total: Number(paging.total), limit: Number(paging.limit), offset: Number(paging.offset) } };
}

export function readPublicLearnGuide(value: unknown): PublicLearnGuide {
  if (!value || typeof value !== 'object') throw new Error('Invalid guide.');
  const response = value as Record<string, unknown>;
  if (response.success !== true || !isGuideRow(response.data) || typeof (response.data as PublicLearnGuide).content !== 'string') throw new Error('Invalid guide.');
  const { title, slug, summary, content, updatedAt } = response.data as PublicLearnGuide;
  return { title, slug, summary, content, updatedAt };
}
