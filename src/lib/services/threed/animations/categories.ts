import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { threedAnimationActionSlots as slots, threedAnimationCategories as categories, threedAnimationCategoryAssignments as assignments, threedAnimations as clips } from '@/lib/schema/threed';
import { AnimationLibraryError, objectInput, positiveId } from './contracts';
export function parseCategory(value: unknown) {
  const body = objectInput(value, ['name', 'id']);
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) throw new AnimationLibraryError(400, 'Category name must contain 1–120 characters');
  return { name: body.name.trim(), id: body.id === undefined ? null : positiveId(body.id) };
}
export async function listCategories(userId: string) {
  return { data: await db.select({ id: categories.id, name: categories.name, slotUsage: sql<number>`(select count(*)::integer from ${slots} s where s.category_id = ${categories.id} and s.user_id = ${categories.userId})`, clipUsage: sql<number>`(select count(*)::integer from ${assignments} a where a.category_id = ${categories.id} and a.user_id = ${categories.userId})` }).from(categories).where(eq(categories.userId, userId)).orderBy(asc(categories.name)).limit(500) };
}
export async function saveCategory(userId: string, value: unknown) {
  const input = parseCategory(value);
  const [data] = input.id === null ? await db.insert(categories).values({ userId, name: input.name }).returning()
    : await db.update(categories).set({ name: input.name, updatedAt: new Date() }).where(and(eq(categories.id, input.id), eq(categories.userId, userId))).returning();
  if (!data) throw new AnimationLibraryError(404, 'Category not found');
  return { data };
}
export async function deleteCategory(userId: string, id: number) {
  const [data] = await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId))).returning();
  if (!data) throw new AnimationLibraryError(404, 'Category not found');
  return { data: { id } };
}
export function parseCategoryAssignment(value: unknown) {
  const body = objectInput(value, ['animationId', 'categoryIds']);
  const animationId = positiveId(body.animationId);
  if (!Array.isArray(body.categoryIds) || body.categoryIds.length > 100) throw new AnimationLibraryError(400, 'Select up to 100 categories');
  const categoryIds = body.categoryIds.map(positiveId);
  if (new Set(categoryIds).size !== categoryIds.length) throw new AnimationLibraryError(400, 'Duplicate categories');
  return { animationId, categoryIds };
}
export async function assignCategories(userId: string, value: unknown) {
  const { animationId, categoryIds } = parseCategoryAssignment(value);
  return db.transaction(async tx => {
    const [clip] = await tx.select({ id: clips.id }).from(clips).where(and(eq(clips.id, animationId), eq(clips.userId, userId))).for('update');
    if (!clip) throw new AnimationLibraryError(404, 'Animation not found');
    const found = categoryIds.length ? await tx.select({ id: categories.id }).from(categories).where(and(eq(categories.userId, userId), inArray(categories.id, categoryIds))).orderBy(asc(categories.id)).for('share') : [];
    if (found.length !== categoryIds.length) throw new AnimationLibraryError(400, 'Category not found in your Library');
    await tx.delete(assignments).where(and(eq(assignments.animationId, animationId), eq(assignments.userId, userId)));
    if (categoryIds.length) await tx.insert(assignments).values(categoryIds.map(categoryId => ({ userId, animationId, categoryId })));
    return { data: { animationId, categoryIds } };
  });
}
