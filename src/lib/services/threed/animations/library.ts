import { and, asc, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { db, type Transaction } from '@/lib/db/client';
import {
  threedAnimationFiles as files, threedAnimations as clips,
  threedModelAnimationAssignments as modelAssignments,
  threedCharacterAnimationAssignments as characterAssignments,
  threedModels, threedCharacters,
} from '@/lib/schema/threed';
import {
  AnimationLibraryError, type AnimationTarget, parseList, parseAssignment,
  parseClipUpdate, resolveAssignments,
} from './contracts';

const clipSelection = { ...getTableColumns(clips), fileName: files.fileName, filePath: files.filePath, format: files.format, fileSize: files.fileSize };
const fileJoin = and(eq(files.id, clips.animationFileId), eq(files.userId, clips.userId));
const modelUsage = sql<number>`(select count(*)::integer from ${modelAssignments} a where a.animation_id = ${clips.id} and a.user_id = ${clips.userId})`;
const characterUsage = sql<number>`(select count(*)::integer from ${characterAssignments} a where a.animation_id = ${clips.id} and a.user_id = ${clips.userId})`;
export async function listAnimations(userId: string, query: ReturnType<typeof parseList>) {
  const { limit, offset, search, sort, direction } = query;
  const where = and(eq(clips.userId, userId), search ? sql`(${clips.name} ilike ${`%${search}%`} or ${files.fileName} ilike ${`%${search}%`} or ${clips.clipName} ilike ${`%${search}%`})` : undefined);
  const fields = { name: sql`lower(${clips.name})`, created: clips.createdAt, size: files.fileSize, duration: clips.duration, active: clips.isActive, fileName: sql`lower(${files.fileName})`, type: files.format, references: sql`${modelUsage} + ${characterUsage}` };
  const field = fields[sort as keyof typeof fields];
  const [count] = await db.select({ total: sql<number>`count(*)::integer` }).from(clips).innerJoin(files, fileJoin).where(where);
  const data = await db.select({ ...clipSelection, modelUsage, characterUsage }).from(clips).innerJoin(files, fileJoin)
    .where(where).orderBy(direction === 'asc' ? asc(field) : desc(field), asc(clips.id)).limit(limit).offset(offset);
  return { data, pagination: { limit, offset, total: Number(count?.total ?? 0) } };
}
export async function listAnimationFiles(userId: string, query: ReturnType<typeof parseList>) {
  const { limit, offset, search, sort, direction } = query;
  if (!['name', 'created', 'size'].includes(sort)) throw new AnimationLibraryError(400, 'Unsupported file sort');
  const where = and(eq(files.userId, userId), search ? sql`${files.fileName} ilike ${`%${search}%`}` : undefined);
  const field = sort === 'size' ? files.fileSize : sort === 'created' ? files.createdAt : sql`lower(${files.fileName})`;
  const [count] = await db.select({ total: sql<number>`count(*)::integer` }).from(files).where(where);
  const data = await db.select({ ...getTableColumns(files), clipCount: sql<number>`(select count(*)::integer from ${clips} c where c.animation_file_id = ${files.id} and c.user_id = ${files.userId})` })
    .from(files).where(where).orderBy(direction === 'asc' ? asc(field) : desc(field), asc(files.id)).limit(limit).offset(offset);
  return { data, pagination: { limit, offset, total: Number(count?.total ?? 0) } };
}
export async function updateAnimation(userId: string, input: ReturnType<typeof parseClipUpdate>) {
  const [data] = await db.update(clips).set({ ...input.changes, updatedAt: new Date() })
    .where(and(eq(clips.id, input.id), eq(clips.userId, userId))).returning();
  if (!data) throw new AnimationLibraryError(404, 'Animation not found');
  return { data };
}
export async function deleteAnimation(userId: string, id: number) {
  return db.transaction(async tx => {
    const [clip] = await tx.select({ id: clips.id }).from(clips).where(and(eq(clips.id, id), eq(clips.userId, userId))).for('update');
    if (!clip) throw new AnimationLibraryError(404, 'Animation not found');
    const model = await tx.select({ id: modelAssignments.id }).from(modelAssignments).where(eq(modelAssignments.animationId, id)).limit(1);
    const character = await tx.select({ id: characterAssignments.id }).from(characterAssignments).where(eq(characterAssignments.animationId, id)).limit(1);
    if (model.length || character.length) throw new AnimationLibraryError(409, 'Animation is assigned to a Model or Character');
    await tx.delete(clips).where(and(eq(clips.id, id), eq(clips.userId, userId)));
    return { data: { id } };
  });
}
export async function deleteAnimationFile(userId: string, id: number) {
  return db.transaction(async tx => {
    const [file] = await tx.select({ id: files.id }).from(files).where(and(eq(files.id, id), eq(files.userId, userId))).for('update');
    if (!file) throw new AnimationLibraryError(404, 'Animation file not found');
    const references = await tx.select({ id: clips.id }).from(clips).where(eq(clips.animationFileId, id)).limit(1);
    if (references.length) throw new AnimationLibraryError(409, 'Animation file still contains registered clips');
    await tx.delete(files).where(and(eq(files.id, id), eq(files.userId, userId)));
    // Storage lifecycle belongs to the upload stage; never delete an unverified/shared URL here.
    return { data: { id, storageDeleted: false } };
  });
}
async function ownedTarget(tx: Transaction, userId: string, input: AnimationTarget) {
  if (input.target === 'model') {
    const [row] = await tx.select({ id: threedModels.id }).from(threedModels)
      .where(and(eq(threedModels.id, input.targetId), eq(threedModels.userId, userId))).for('share');
    if (!row) throw new AnimationLibraryError(404, 'Model not found');
    return row.id;
  }
  const [row] = await tx.select({ id: threedCharacters.id, modelId: threedCharacters.modelId }).from(threedCharacters)
    .where(and(eq(threedCharacters.id, input.targetId), eq(threedCharacters.userId, userId))).for('share');
  if (!row) throw new AnimationLibraryError(404, 'Character not found');
  if (row.modelId === null) return null;
  // A Character's linked Model is not necessarily owned by the same User.
  const [model] = await tx.select({ id: threedModels.id }).from(threedModels)
    .where(and(eq(threedModels.id, row.modelId), eq(threedModels.userId, userId))).for('share');
  return model?.id ?? null;
}
export async function getAssignments(userId: string, input: AnimationTarget) {
  return db.transaction(async tx => {
    const modelId = await ownedTarget(tx, userId, input);
    const model = modelId === null ? [] : await tx.select().from(modelAssignments)
      .where(and(eq(modelAssignments.modelId, modelId), eq(modelAssignments.userId, userId))).orderBy(asc(modelAssignments.actionKey));
    const character = input.target === 'model' ? [] : await tx.select().from(characterAssignments)
      .where(and(eq(characterAssignments.characterId, input.targetId), eq(characterAssignments.userId, userId))).orderBy(asc(characterAssignments.actionKey));
    const ids = [...new Set([...model, ...character].flatMap(row => row.animationId === null ? [] : [row.animationId]))];
    const animations = ids.length ? await tx.select(clipSelection).from(clips).innerJoin(files, fileJoin)
      .where(and(eq(clips.userId, userId), inArray(clips.id, ids))) : [];
    return { data: { ...input, modelId, assignments: input.target === 'model' ? model : character,
      inherited: input.target === 'character' ? model : [], animations,
      effective: resolveAssignments(model, character, animations) } };
  });
}
export async function putAssignment(userId: string, input: ReturnType<typeof parseAssignment>) {
  return db.transaction(async tx => {
    await ownedTarget(tx, userId, input);
    if (input.animationId !== null) {
      // The lock coordinates clip deactivation/deletion with assignment creation.
      const [clip] = await tx.select({ id: clips.id }).from(clips).innerJoin(files, fileJoin)
        .where(and(eq(clips.id, input.animationId), eq(clips.userId, userId), eq(clips.isActive, true), sql`length(trim(${files.filePath})) > 0`)).for('share');
      if (!clip) throw new AnimationLibraryError(404, 'Active animation not found');
    }
    const values = { userId, actionKey: input.actionKey, mode: input.mode, animationId: input.animationId, updatedAt: new Date() };
    if (input.target === 'model') {
      const [data] = await tx.insert(modelAssignments).values({ ...values, modelId: input.targetId })
        .onConflictDoUpdate({ target: [modelAssignments.modelId, modelAssignments.actionKey], set: values,
          setWhere: eq(modelAssignments.userId, userId) }).returning();
      if (!data) throw new AnimationLibraryError(409, 'Assignment ownership conflict');
      return { data };
    }
    const [data] = await tx.insert(characterAssignments).values({ ...values, characterId: input.targetId })
      .onConflictDoUpdate({ target: [characterAssignments.characterId, characterAssignments.actionKey], set: values,
        setWhere: eq(characterAssignments.userId, userId) }).returning();
    if (!data) throw new AnimationLibraryError(409, 'Assignment ownership conflict');
    return { data };
  });
}
export async function removeAssignment(userId: string, input: AnimationTarget, actionKey: string) {
  return db.transaction(async tx => {
    await ownedTarget(tx, userId, input);
    if (input.target === 'model') {
      await tx.delete(modelAssignments).where(and(eq(modelAssignments.modelId, input.targetId), eq(modelAssignments.userId, userId), eq(modelAssignments.actionKey, actionKey)));
    } else {
      await tx.delete(characterAssignments).where(and(eq(characterAssignments.characterId, input.targetId), eq(characterAssignments.userId, userId), eq(characterAssignments.actionKey, actionKey)));
    }
    return { data: { ...input, actionKey, mode: 'inherit' } };
  });
}
