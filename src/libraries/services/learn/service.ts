import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { db as appDatabase } from '@/libraries/db/client';
import { User } from '@/libraries/schema/auth';
import { learnGuides as guides } from '@/libraries/schema/learn';
import { starterLearnGuides } from '@/libraries/data/learn/starter-guides';
import type { LearnGuide, LearnGuidePage, LearnGuideRow, PublicLearnGuide, PublicLearnGuideRow } from './contracts';
import { LearnError, learnGuideInputSchema, learnGuideUpdateSchema, learnId, learnRevision, learnSlugSchema, type LearnGuideQuery } from './input';

const rowFields = { id: guides.id, title: guides.title, slug: guides.slug, summary: guides.summary,
  sortOrder: guides.sortOrder, isActive: guides.isActive, isPublished: guides.isPublished,
  revision: guides.revision, createdAt: guides.createdAt, updatedAt: guides.updatedAt };
const guideFields = { ...rowFields, content: guides.content };
const publicFields = { title: guides.title, slug: guides.slug, summary: guides.summary, updatedAt: guides.updatedAt };
const publicScope = () => and(eq(guides.isActive, true), eq(guides.isPublished, true));
const searchScope = (search: string) => {
  if (!search) return undefined;
  const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  return or(ilike(guides.title, term), ilike(guides.slug, term), ilike(guides.summary, term));
};
const ordering = (query: LearnGuideQuery) => [query.direction === 'asc' ? asc(guides[query.sort]) : desc(guides[query.sort]), asc(guides.id)];
function editorialDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
function publicDates<T extends { updatedAt: Date }>(row: T) { return { ...row, updatedAt: row.updatedAt.toISOString() }; }

export function learnGuideService(database: typeof appDatabase) {
  async function requireEditor(client: Pick<typeof appDatabase, 'select'>, actorId: string, lock = false) {
    const query = client.select({ role: User.role, isActive: User.isActive, isDeleted: User.isDeleted })
      .from(User).where(eq(User.id, actorId)).limit(1);
    const [actor] = await (lock ? query.for('share') : query);
    if (actor?.role !== 'super_admin' || actor.isActive !== true || actor.isDeleted !== false) {
      throw new LearnError(403, 'An active Super Admin account is required to manage Learn guides.');
    }
  }
  async function total(where: SQL | undefined) {
    const [row] = await database.select({ total: count() }).from(guides).where(where);
    return Number(row?.total ?? 0);
  }
  async function list(actorId: string, query: LearnGuideQuery): Promise<LearnGuidePage<LearnGuideRow>> {
    await requireEditor(database, actorId);
    const where = and(searchScope(query.search), query.isActive === null ? undefined : eq(guides.isActive, query.isActive),
      query.isPublished === null ? undefined : eq(guides.isPublished, query.isPublished));
    const [rows, records] = await Promise.all([
      database.select(rowFields).from(guides).where(where).orderBy(...ordering(query)).limit(query.limit).offset(query.offset), total(where),
    ]);
    return { data: rows.map(editorialDates), pagination: { total: records, limit: query.limit, offset: query.offset } };
  }
  async function get(actorId: string, id: number): Promise<LearnGuide> {
    await requireEditor(database, actorId);
    const [row] = await database.select(guideFields).from(guides).where(eq(guides.id, learnId(String(id)))).limit(1);
    if (!row) throw new LearnError(404, 'Learn guide not found.');
    return editorialDates(row);
  }
  async function create(actorId: string, value: unknown): Promise<LearnGuide> {
    const input = learnGuideInputSchema.parse(value);
    return database.transaction(async tx => {
      await requireEditor(tx, actorId, true);
      const now = new Date();
      const [row] = await tx.insert(guides).values({ ...input, revision: randomUUID(), createdBy: actorId, updatedBy: actorId, createdAt: now, updatedAt: now }).returning(guideFields);
      return editorialDates(row);
    });
  }
  async function update(actorId: string, value: unknown): Promise<LearnGuide> {
    const { id, revision, ...input } = learnGuideUpdateSchema.parse(value);
    return database.transaction(async tx => {
      await requireEditor(tx, actorId, true);
      const [existing] = await tx.select({ id: guides.id, revision: guides.revision }).from(guides).where(eq(guides.id, id)).limit(1).for('update');
      if (!existing) throw new LearnError(404, 'Learn guide not found.');
      if (existing.revision !== revision) throw new LearnError(409, 'This Learn guide changed. Reload before saving your changes.');
      const [row] = await tx.update(guides).set({ ...input, revision: randomUUID(), updatedBy: actorId, updatedAt: new Date() })
        .where(and(eq(guides.id, id), eq(guides.revision, revision))).returning(guideFields);
      if (!row) throw new LearnError(409, 'This Learn guide changed. Reload before saving your changes.');
      return editorialDates(row);
    });
  }
  async function remove(actorId: string, id: number, revision: string): Promise<{ id: number }> {
    learnId(String(id)); learnRevision(revision);
    return database.transaction(async tx => {
      await requireEditor(tx, actorId, true);
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
      await requireEditor(tx, actorId, true);
      const starters = starterLearnGuides.map(value => learnGuideInputSchema.parse(value));
      if (new Set(starters.map(guide => guide.slug)).size !== starters.length) throw new Error('Duplicate starter guide slug');
      if (!starters.length) return { imported: 0, skipped: 0 };
      const now = new Date();
      const inserted = await tx.insert(guides).values(starters.map(guide => ({ ...guide, revision: randomUUID(), createdBy: actorId, updatedBy: actorId, createdAt: now, updatedAt: now })))
        .onConflictDoNothing({ target: guides.slug }).returning({ id: guides.id });
      return { imported: inserted.length, skipped: starters.length - inserted.length };
    });
  }
  async function publicList(query: LearnGuideQuery): Promise<LearnGuidePage<PublicLearnGuideRow>> {
    const where = and(publicScope(), searchScope(query.search));
    const [rows, records] = await Promise.all([
      database.select(publicFields).from(guides).where(where).orderBy(...ordering(query)).limit(query.limit).offset(query.offset), total(where),
    ]);
    return { data: rows.map(publicDates), pagination: { total: records, limit: query.limit, offset: query.offset } };
  }
  async function publicGet(slug: string): Promise<PublicLearnGuide> {
    const validSlug = learnSlugSchema.parse(slug);
    const [row] = await database.select({ ...publicFields, content: guides.content }).from(guides)
      .where(and(eq(guides.slug, validSlug), publicScope())).limit(1);
    if (!row) throw new LearnError(404, 'Learn guide not found.');
    return publicDates(row);
  }
  return { list, get, create, update, remove, importStarters, publicList, publicGet };
}
