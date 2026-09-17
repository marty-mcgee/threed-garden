import { validateActionSlots } from './slots';
import { createHash } from 'node:crypto';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db, type Transaction } from '@/lib/db/client';
import { threedAnimationPresets as presets, threedAnimationPresetEntries as entries, threedAnimations as clips, threedAnimationFiles as files, threedModelAnimationAssignments as models, threedCharacterAnimationAssignments as characters } from '@/lib/schema/threed';
import { AnimationLibraryError, objectInput, positiveId, parseTarget } from './contracts';
import { parsePreset, parsePresetStrategy, reviewPreset } from './preset-contracts';
import { ownedTarget } from './library';

async function read(tx: Transaction, userId: string, id: number) {
  const [preset] = await tx.select().from(presets).where(and(eq(presets.id, id), eq(presets.userId, userId))).for('update');
  if (!preset) throw new AnimationLibraryError(404, 'Preset not found');
  const rows = await tx.select().from(entries).where(and(eq(entries.presetId, id), eq(entries.userId, userId))).orderBy(asc(entries.actionKey));
  return { ...preset, entries: rows };
}
async function available(tx: Transaction, userId: string, ids: number[]) {
  return ids.length ? tx.select({ id: clips.id, name: clips.name, isActive: clips.isActive, filePath: files.filePath }).from(clips)
    .innerJoin(files, and(eq(files.id, clips.animationFileId), eq(files.userId, userId)))
    .where(and(eq(clips.userId, userId), inArray(clips.id, ids))).orderBy(asc(clips.id)).for('share') : [];
}
export async function listPresets(userId: string) {
  return { data: await db.select().from(presets).where(eq(presets.userId, userId)).orderBy(asc(presets.name)).limit(200) };
}
export async function getPreset(userId: string, id: number) {
  return db.transaction(async tx => ({ data: await read(tx, userId, id) }));
}
export async function savePreset(userId: string, value: unknown, updating: boolean) {
  const body = objectInput(value, updating ? ['id', 'revision', 'name', 'description', 'entries'] : ['name', 'description', 'entries']);
  const input = parsePreset({ name: body.name, description: body.description, entries: body.entries });
  const id = updating ? positiveId(body.id) : null;
  const revision = updating ? positiveId(body.revision) : null;
  return db.transaction(async tx => {
    if (id) {
      const previous = await read(tx, userId, id);
      if (previous.revision !== revision) throw new AnimationLibraryError(409, 'Preset changed. Refresh before saving.');
    }
    await validateActionSlots(tx, userId, input.entries.map(row => row.actionKey));
    const ids = [...new Set(input.entries.flatMap(row => row.animationId === null ? [] : [row.animationId]))];
    const found = await available(tx, userId, ids);
    if (ids.some(id => !found.some(clip => clip.id === id && clip.isActive && clip.filePath.trim()))) throw new AnimationLibraryError(400, 'Every assigned clip must be active and available in your Library');
    const values = { name: input.name, description: input.description, updatedAt: new Date() };
    const [preset] = id ? await tx.update(presets).set({ ...values, revision: revision! + 1 }).where(and(eq(presets.id, id), eq(presets.userId, userId))).returning()
      : await tx.insert(presets).values({ ...values, userId }).returning();
    if (id) await tx.delete(entries).where(and(eq(entries.presetId, id), eq(entries.userId, userId)));
    await tx.insert(entries).values(input.entries.map(row => ({ ...row, presetId: preset.id, userId })));
    return { data: preset };
  });
}
export async function deletePreset(userId: string, id: number, revision: number) {
  return db.transaction(async tx => {
    const current = await read(tx, userId, id);
    if (current.revision !== revision) throw new AnimationLibraryError(409, 'Preset changed. Refresh before deleting.');
    await tx.delete(presets).where(and(eq(presets.id, id), eq(presets.userId, userId)));
    return { data: { id } };
  });
}
export async function applyPreset(userId: string, value: unknown) {
  const body = objectInput(value, ['presetId', 'target', 'targetId', 'strategy', 'reviewToken']);
  const id = positiveId(body.presetId), target = parseTarget(body.target, body.targetId), strategy = parsePresetStrategy(body.strategy);
  if (body.reviewToken !== undefined && (typeof body.reviewToken !== 'string' || !/^[a-f0-9]{64}$/.test(body.reviewToken))) throw new AnimationLibraryError(400, 'Invalid review token');
  return db.transaction(async tx => {
    const preset = await read(tx, userId, id);
    const modelId = await ownedTarget(tx, userId, target);
    const model = modelId === null ? [] : await tx.select().from(models).where(and(eq(models.modelId, modelId), eq(models.userId, userId))).orderBy(asc(models.actionKey));
    const own = target.target === 'model' ? model : await tx.select().from(characters).where(and(eq(characters.characterId, target.targetId), eq(characters.userId, userId))).orderBy(asc(characters.actionKey));
    const inherited = target.target === 'model' ? [] : model;
    const ids = [...new Set([...preset.entries, ...own, ...inherited].flatMap(row => row.animationId === null ? [] : [row.animationId]))];
    const animations = await available(tx, userId, ids);
    const parsed = parsePreset({ name: preset.name, description: preset.description, entries: preset.entries.map(({ actionKey, mode, animationId }) => ({ actionKey, mode, animationId })) });
    const slots = await validateActionSlots(tx, userId, parsed.entries.map(row => row.actionKey));
    const review = reviewPreset(parsed.entries, own, inherited, animations, strategy);
    const reviewToken = createHash('sha256').update(JSON.stringify({ userId, target, strategy, preset, modelId, own, inherited, animations, slots })).digest('hex');
    if (body.reviewToken !== undefined) {
      if (body.reviewToken !== reviewToken) throw new AnimationLibraryError(409, 'Mappings or preset changed. Review again before applying.');
      if (review.some(row => row.outcome === 'conflict')) throw new AnimationLibraryError(409, 'Resolve unavailable preset clips before applying');
      for (const row of review.filter(row => row.outcome === 'apply')) {
        const values = { userId, actionKey: row.actionKey, mode: row.mode, animationId: row.animationId, updatedAt: new Date() };
        const saved = target.target === 'model'
          ? await tx.insert(models).values({ ...values, modelId: target.targetId }).onConflictDoUpdate({ target: [models.modelId, models.actionKey], set: values, setWhere: eq(models.userId, userId) }).returning()
          : await tx.insert(characters).values({ ...values, characterId: target.targetId }).onConflictDoUpdate({ target: [characters.characterId, characters.actionKey], set: values, setWhere: eq(characters.userId, userId) }).returning();
        if (!saved.length) throw new AnimationLibraryError(409, 'Assignment ownership conflict');
      }
    }
    return { data: { review, reviewToken, animations, applied: body.reviewToken !== undefined } };
  });
}
