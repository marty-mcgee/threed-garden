import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, exists, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { db as appDatabase } from '@/libraries/db/client';
import { User } from '@/libraries/schema/auth';
import { learnCategories as categories, learnGuideCategoryAssignments as assignments, learnGuides as guides } from '@/libraries/schema/learn';
import { starterLearnGuides } from '@/libraries/data/learn/starter-guides';
import type { LearnGuide, LearnGuidePage, LearnGuideRow, PublicLearnGuide, PublicLearnGuideRow } from './contracts';
import { LearnError, parseLearnGuideInput, parseLearnGuideUpdate, learnId, learnRevision, parseLearnSlug, type LearnGuideQuery } from './input';

const rowFields = { id: guides.id, title: guides.title, slug: guides.slug, summary: guides.summary,
  sortOrder: guides.sortOrder, isActive: guides.isActive, isPublished: guides.isPublished,
  isPublic: guides.isPublic, revision: guides.revision, createdAt: guides.createdAt, updatedAt: guides.updatedAt };
const guideFields = { ...rowFields, content: guides.content };
const publicFields = { title: guides.title, slug: guides.slug, summary: guides.summary, updatedAt: guides.updatedAt };
const publicScope = () => and(eq(guides.isActive, true), eq(guides.isPublished, true), eq(guides.isPublic, true));
const searchScope = (search: string) => {
  if (!search) return undefined;
  const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  return or(ilike(guides.title, term), ilike(guides.slug, term), ilike(guides.summary, term));
};
const categoryName = sql`lower(${categories.name})`;
const firstCategoryName = sql`(
  select min(${categoryName})
  from ${assignments} inner join ${categories} on ${assignments.categoryId} = ${categories.id}
  where ${assignments.guideId} = ${guides.id}
)`;
function ordering(query: LearnGuideQuery) {
  const direction = query.direction === 'asc' ? asc : desc;
  const order = query.sort === 'categories'
    ? sql`${direction(firstCategoryName)} nulls last`
    : direction(guides[query.sort]);
  return [order, asc(guides.id)];
}
function editorialDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
function publicDates<T extends { updatedAt: Date }>(row: T) { return { ...row, updatedAt: row.updatedAt.toISOString() }; }

function missingGuideOwnerColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('code' in error && error.code === '42703' && 'message' in error && typeof error.message === 'string'
    && /^column "?learn_guides"?\."?user_id"? does not exist$/.test(error.message)) return true;
  return 'cause' in error && error.cause !== error && missingGuideOwnerColumn(error.cause);
}

export async function requireLearnEditor(client: Pick<typeof appDatabase, 'select'>, actorId: string, lock = false, resource: 'guides' | 'categories' = 'guides') {
  const query = client.select({ role: User.role, isActive: User.isActive, isDeleted: User.isDeleted })
    .from(User).where(eq(User.id, actorId)).limit(1);
  const [actor] = await (lock ? query.for('share') : query);
  if (actor?.role !== 'super_admin' || actor.isActive !== true || actor.isDeleted !== false) {
    throw new LearnError(403, `An active Super Admin account is required to manage Learn ${resource}.`);
  }
}

type LearnTransaction = Parameters<Parameters<typeof appDatabase.transaction>[0]>[0];

async function syncGuideCategories(tx: LearnTransaction, guideId: number, requested?: number[]) {
  const current = (await tx.select({ id: assignments.categoryId }).from(assignments)
    .where(eq(assignments.guideId, guideId)).orderBy(asc(assignments.categoryId))).map(row => row.id);
  if (requested === undefined) return current;

  const existing = new Set(current);
  const selected = new Set(requested);
  const added = requested.filter(id => !existing.has(id));
  const removed = current.filter(id => !selected.has(id));
  if (requested.length) {
    const available = await tx.select({ id: categories.id, isActive: categories.isActive }).from(categories)
      .where(inArray(categories.id, requested)).orderBy(asc(categories.id)).for('share');
    if (available.length !== requested.length || available.some(category => !category.isActive && !existing.has(category.id))) {
      throw new LearnError(400, 'A selected Category is inactive or was deleted. Refresh Categories and update your selections.');
    }
  }
  if (removed.length) {
    await tx.delete(assignments).where(and(eq(assignments.guideId, guideId), inArray(assignments.categoryId, removed)));
  }
  if (added.length) {
    const now = new Date();
    await tx.insert(assignments).values(added.map(categoryId => ({ guideId, categoryId, createdAt: now, updatedAt: now })));
  }
  return requested;
}

export function learnGuideService(database: typeof appDatabase) {
  function readerScope(viewerId?: string, owner: typeof guides.userId | typeof guides.createdBy = guides.userId) {
    if (!viewerId) return publicScope();
    const eligibleUser = database.select({ id: User.id }).from(User).where(and(
      eq(User.id, viewerId),
      eq(User.isActive, true),
      eq(User.isDeleted, false),
      or(eq(User.role, 'super_admin'), eq(User.id, owner)),
    ));
    return or(publicScope(), exists(eligibleUser));
  }

  async function readForViewer<T>(viewerId: string | undefined, read: (scope: SQL | undefined) => Promise<T>): Promise<T> {
    try {
      return await read(readerScope(viewerId));
    } catch (error) {
      if (!viewerId || !missingGuideOwnerColumn(error)) throw error;
      // The ownership migration backfills this same creator into user_id.
      return read(readerScope(viewerId, guides.createdBy));
    }
  }

  async function total(where: SQL | undefined) {
    const [row] = await database.select({ total: count() }).from(guides).where(where);
    return Number(row?.total ?? 0);
  }
  async function list(actorId: string, query: LearnGuideQuery): Promise<LearnGuidePage<LearnGuideRow>> {
    await requireLearnEditor(database, actorId);
    const where = and(searchScope(query.search), query.isActive === null ? undefined : eq(guides.isActive, query.isActive),
      query.isPublished === null ? undefined : eq(guides.isPublished, query.isPublished));
    const [rows, records] = await Promise.all([
      database.select(rowFields).from(guides).where(where).orderBy(...ordering(query)).limit(query.limit).offset(query.offset), total(where),
    ]);
    const byGuide = new Map<number, LearnGuideRow['categories']>();
    if (rows.length) {
      const links = await database.select({
        guideId: assignments.guideId,
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
      }).from(assignments).innerJoin(categories, eq(assignments.categoryId, categories.id))
        .where(inArray(assignments.guideId, rows.map(row => row.id)))
        .orderBy(asc(categoryName), asc(categories.id));
      for (const { guideId, ...category } of links) {
        const assigned = byGuide.get(guideId);
        if (assigned) assigned.push(category);
        else byGuide.set(guideId, [category]);
      }
    }
    return {
      data: rows.map(row => ({ ...editorialDates(row), categories: byGuide.get(row.id) ?? [] })),
      pagination: { total: records, limit: query.limit, offset: query.offset },
    };
  }
  async function get(actorId: string, id: number): Promise<LearnGuide> {
    await requireLearnEditor(database, actorId);
    const rows = await database.select({ guide: guideFields, categoryId: assignments.categoryId }).from(guides)
      .leftJoin(assignments, eq(assignments.guideId, guides.id))
      .where(eq(guides.id, learnId(String(id)))).orderBy(asc(assignments.categoryId));
    if (!rows[0]) throw new LearnError(404, 'Learn guide not found.');
    return { ...editorialDates(rows[0].guide), categoryIds: rows.flatMap(row => row.categoryId === null ? [] : [row.categoryId]) };
  }
  async function create(actorId: string, value: unknown): Promise<LearnGuide> {
    const { categoryIds, ...input } = parseLearnGuideInput(value);
    return database.transaction(async tx => {
      await requireLearnEditor(tx, actorId, true);
      const now = new Date();
      const [row] = await tx.insert(guides).values({ ...input, revision: randomUUID(), userId: actorId, createdBy: actorId, updatedBy: actorId, createdAt: now, updatedAt: now }).returning(guideFields);
      return { ...editorialDates(row), categoryIds: await syncGuideCategories(tx, row.id, categoryIds) };
    });
  }
  async function update(actorId: string, value: unknown): Promise<LearnGuide> {
    const { id, revision, categoryIds, ...input } = parseLearnGuideUpdate(value);
    return database.transaction(async tx => {
      await requireLearnEditor(tx, actorId, true);
      const [existing] = await tx.select({ id: guides.id, revision: guides.revision }).from(guides).where(eq(guides.id, id)).limit(1).for('update');
      if (!existing) throw new LearnError(404, 'Learn guide not found.');
      if (existing.revision !== revision) throw new LearnError(409, 'This Learn guide changed. Reload before saving your changes.');
      const [row] = await tx.update(guides).set({ ...input, revision: randomUUID(), updatedBy: actorId, updatedAt: new Date() })
        .where(and(eq(guides.id, id), eq(guides.revision, revision))).returning(guideFields);
      if (!row) throw new LearnError(409, 'This Learn guide changed. Reload before saving your changes.');
      return { ...editorialDates(row), categoryIds: await syncGuideCategories(tx, id, categoryIds) };
    });
  }
  async function remove(actorId: string, id: number, revision: string): Promise<{ id: number }> {
    learnId(String(id)); learnRevision(revision);
    return database.transaction(async tx => {
      await requireLearnEditor(tx, actorId, true);
      const [existing] = await tx.select({ id: guides.id, revision: guides.revision }).from(guides).where(eq(guides.id, id)).limit(1).for('update');
      if (!existing) throw new LearnError(404, 'Learn guide not found.');
      if (existing.revision !== revision) throw new LearnError(409, 'This Learn guide changed. Reload before deleting it.');
      const [removed] = await tx.delete(guides).where(and(eq(guides.id, id), eq(guides.revision, revision))).returning({ id: guides.id });
      if (!removed) throw new LearnError(409, 'This Learn guide changed. Reload before deleting it.');
      return removed;
    });
  }
  async function importStarters(actorId: string): Promise<{ imported: number; skipped: number }> {
    return database.transaction(async tx => {
      await requireLearnEditor(tx, actorId, true);
      const starters = starterLearnGuides.map(value => parseLearnGuideInput(value));
      if (new Set(starters.map(guide => guide.slug)).size !== starters.length) throw new Error('Duplicate starter guide slug');
      if (!starters.length) return { imported: 0, skipped: 0 };
      const now = new Date();
      const inserted = await tx.insert(guides).values(starters.map(guide => ({ ...guide, revision: randomUUID(), userId: actorId, createdBy: actorId, updatedBy: actorId, createdAt: now, updatedAt: now })))
        .onConflictDoNothing({ target: guides.slug }).returning({ id: guides.id });
      return { imported: inserted.length, skipped: starters.length - inserted.length };
    });
  }
  async function publicList(query: LearnGuideQuery, viewerId?: string): Promise<LearnGuidePage<PublicLearnGuideRow>> {
    return readForViewer(viewerId, async scope => {
      const where = and(scope, searchScope(query.search));
      const [rows, records] = await Promise.all([
        database.select(publicFields).from(guides).where(where).orderBy(...ordering(query)).limit(query.limit).offset(query.offset), total(where),
      ]);
      return { data: rows.map(publicDates), pagination: { total: records, limit: query.limit, offset: query.offset } };
    });
  }
  async function publicGet(slug: string, viewerId?: string): Promise<PublicLearnGuide> {
    const validSlug = parseLearnSlug(slug);
    const [row] = await readForViewer(viewerId, async scope =>
      database.select({ ...publicFields, content: guides.content }).from(guides)
        .where(and(eq(guides.slug, validSlug), scope)).limit(1));
    if (!row) throw new LearnError(404, 'Learn guide not found.');
    return publicDates(row);
  }
  return { list, get, create, update, remove, importStarters, publicList, publicGet };
}
