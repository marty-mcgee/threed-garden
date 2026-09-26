import { randomUUID } from 'node:crypto';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, type Transaction } from '@/libraries/db/client';
import { threedAnimationCategories as categories, threedAnimationActionSlots as slots, threedModelAnimationAssignments as models, threedCharacterAnimationAssignments as characters, threedAnimationPresetEntries as presets } from '@/libraries/schema/threed';
import { AnimationLibraryError, LIBRARY_ACTIONS, objectInput, positiveId } from './contracts';
export async function readActionSlots(tx: Transaction, userId: string) {
  const usage = (table: typeof models | typeof characters | typeof presets) => sql<number>`(select count(*)::integer from ${table} a where a.action_key = ${slots.actionKey} and a.user_id = ${slots.userId})`;
  return tx.select({ id: slots.id, actionKey: slots.actionKey, name: slots.name, categoryId: slots.categoryId, categoryName: categories.name, isActive: slots.isActive, modelUsage: usage(models), characterUsage: usage(characters), presetUsage: usage(presets) }).from(slots).leftJoin(categories, and(eq(categories.id, slots.categoryId), eq(categories.userId, slots.userId))).where(eq(slots.userId, userId)).orderBy(asc(categories.name), asc(slots.name));
}
export async function listActionSlots(userId: string) {
  return db.transaction(async tx => ({ data: await readActionSlots(tx, userId) }));
}
export async function validateActionSlots(tx: Transaction, userId: string, keys: string[]) {
  const custom = [...new Set(keys.filter(key => !LIBRARY_ACTIONS.includes(key)))].sort();
  if (!custom.length) return [];
  const found = await tx.select().from(slots).where(and(eq(slots.userId, userId), inArray(slots.actionKey, custom))).orderBy(asc(slots.actionKey)).for('share');
  if (found.length !== custom.length) throw new AnimationLibraryError(400, 'Action slot not found in your Library');
  return found;
}
export function parseActionSlot(value: unknown) {
  const body = objectInput(value, ['id', 'name', 'categoryId', 'isActive']);
  const text = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 120) throw new AnimationLibraryError(400, 'Slot name must contain 1–120 characters');
    return value.trim();
  };
  if (typeof body.isActive !== 'boolean') throw new AnimationLibraryError(400, 'Invalid slot enabled state');
  return { id: body.id === undefined ? null : positiveId(body.id), name: text(body.name), categoryId: body.categoryId == null ? null : positiveId(body.categoryId), isActive: body.isActive };
}
export async function saveActionSlot(userId: string, value: unknown) {
  const { id, ...values } = parseActionSlot(value);
  return db.transaction(async tx => {
    if (values.categoryId !== null) {
      const [category] = await tx.select({ id: categories.id }).from(categories).where(and(eq(categories.id, values.categoryId), eq(categories.userId, userId))).for('share');
      if (!category) throw new AnimationLibraryError(400, 'Category not found in your Library');
    }
    const [data] = id === null ? await tx.insert(slots).values({ ...values, userId, actionKey: `custom_${randomUUID().replaceAll('-', '')}` }).returning()
      : await tx.update(slots).set({ ...values, updatedAt: new Date() }).where(and(eq(slots.userId, userId), eq(slots.id, id))).returning();
    if (!data) throw new AnimationLibraryError(404, 'Action slot not found');
    return { data };
  });
}

export async function deleteActionSlot(userId: string, id: number) {
  return db.transaction(async tx => {
    const [slot] = await tx.select().from(slots).where(and(eq(slots.userId, userId), eq(slots.id, id))).for('update');
    if (!slot) throw new AnimationLibraryError(404, 'Action slot not found');
    for (const table of [models, characters, presets]) {
      const rows = await tx.select({ id: table.id }).from(table).where(and(eq(table.userId, userId), eq(table.actionKey, slot.actionKey))).limit(1);
      if (rows.length) throw new AnimationLibraryError(409, 'Slot is referenced by saved mappings or presets. Remove those references first, or disable the slot.');
    }
    await tx.delete(slots).where(and(eq(slots.userId, userId), eq(slots.id, id)));
    return { data: { id } };
  });
}
