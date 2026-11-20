import 'server-only';
import { randomUUID } from 'node:crypto';
import { asc, eq, sql } from 'drizzle-orm';
import type { db as appDatabase } from '@/libraries/db/client';
import { learnCategories as categories } from '@/libraries/schema/learn';
import type { LearnCategory } from './contracts';
import { LearnError, parseLearnCategoryInput, parseLearnCategoryUpdate } from './input';
import { requireLearnEditor } from './service';

const fields = {
  id: categories.id,
  name: categories.name,
  slug: categories.slug,
  description: categories.description,
  parentId: categories.parentId,
  sortOrder: categories.sortOrder,
  isActive: categories.isActive,
  revision: categories.revision,
};
type LearnTransaction = Parameters<Parameters<typeof appDatabase.transaction>[0]>[0];

async function lockHierarchy(tx: LearnTransaction) {
  // Serialize changes so two valid-looking reparent requests cannot form a cycle.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('learn:category-tree'))`);
}

async function checkParent(tx: LearnTransaction, parentId: number | null, categoryId?: number) {
  if (parentId === null) return;
  const rows = await tx.select({ id: categories.id, parentId: categories.parentId }).from(categories);
  const parents = new Map(rows.map(row => [row.id, row.parentId]));
  const visited = new Set<number>();
  for (let ancestor: number | null = parentId; ancestor !== null;) {
    if (ancestor === categoryId || visited.has(ancestor)) {
      throw new LearnError(400, 'Choose a Parent Category outside this Category and its descendants.');
    }
    const next = parents.get(ancestor);
    if (next === undefined) throw new LearnError(400, 'The Parent Category no longer exists.');
    visited.add(ancestor);
    ancestor = next;
  }
}

async function checkRevision(tx: LearnTransaction, id: number, revision: string) {
  const [existing] = await tx.select({ revision: categories.revision }).from(categories)
    .where(eq(categories.id, id)).limit(1).for('update');
  if (!existing) throw new LearnError(404, 'Learn Category not found.');
  if (existing.revision !== revision) throw new LearnError(409, 'This Learn Category changed. Refresh Categories before continuing.');
}

export function learnCategoryService(database: typeof appDatabase) {
  async function list(actorId: string): Promise<LearnCategory[]> {
    await requireLearnEditor(database, actorId, false, 'categories');
    return database.select(fields).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name), asc(categories.id));
  }

  async function create(actorId: string, value: unknown): Promise<LearnCategory> {
    const input = parseLearnCategoryInput(value);
    return database.transaction(async tx => {
      await requireLearnEditor(tx, actorId, true, 'categories');
      await lockHierarchy(tx);
      await checkParent(tx, input.parentId);
      const now = new Date();
      const [category] = await tx.insert(categories).values({
        ...input,
        revision: randomUUID(),
        createdBy: actorId,
        updatedBy: actorId,
        createdAt: now,
        updatedAt: now,
      }).returning(fields);
      return category;
    });
  }

  async function update(actorId: string, value: unknown): Promise<LearnCategory> {
    const { id, revision, ...input } = parseLearnCategoryUpdate(value);
    return database.transaction(async tx => {
      await requireLearnEditor(tx, actorId, true, 'categories');
      await lockHierarchy(tx);
      await checkRevision(tx, id, revision);
      await checkParent(tx, input.parentId, id);
      const [category] = await tx.update(categories).set({
        ...input,
        revision: randomUUID(),
        updatedBy: actorId,
        updatedAt: new Date(),
      }).where(eq(categories.id, id)).returning(fields);
      return category;
    });
  }

  async function remove(actorId: string, id: number, revision: string): Promise<{ id: number }> {
    return database.transaction(async tx => {
      await requireLearnEditor(tx, actorId, true, 'categories');
      await lockHierarchy(tx);
      await checkRevision(tx, id, revision);
      const [child] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1);
      if (child) throw new LearnError(409, 'Move or delete this Category’s children before deleting it.');
      const [removed] = await tx.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
      return removed;
    });
  }

  return { list, create, update, remove };
}
