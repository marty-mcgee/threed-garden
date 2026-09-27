import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { threedCharacterAnimationAssignments as characterAssignments, threedModelAnimationAssignments as modelAssignments,
  threedAnimations as clips, threedAnimationFiles as files, threedAnimationActionSlots as slots } from '@/libraries/schema/threed';
import type { CharacterAnimationMapping } from '@/libraries/utils/assignedCharacterAnimations';

/** Internal only: callers supply Characters/Models already authorized by the Project read. */
export async function sceneCharacterAnimations(ownerId: string,
  characters: Array<{ id: number; modelId: number | null }>, models: Array<{ id: number; userId: string | null }>,
): Promise<Map<number, CharacterAnimationMapping>> {
  const result = new Map<number, CharacterAnimationMapping>();
  if (!characters.length) return result;
  const modelOwners = new Map(models.map(model => [model.id, model.userId]));
  const modelIds = [...new Set(characters.flatMap(character => character.modelId && modelOwners.has(character.modelId) ? [character.modelId] : []))];
  const [own, inherited] = await Promise.all([
    db.select().from(characterAssignments).where(and(eq(characterAssignments.userId, ownerId), inArray(characterAssignments.characterId, characters.map(character => character.id)))),
    modelIds.length ? db.select().from(modelAssignments).where(inArray(modelAssignments.modelId, modelIds)) : Promise.resolve([]),
  ]);
  const defaults = inherited.filter(row => row.userId === modelOwners.get(row.modelId));
  const assigned = [...own, ...defaults];
  const ids = [...new Set(assigned.flatMap(row => row.animationId === null ? [] : [row.animationId]))];
  const keys = [...new Set(assigned.map(row => row.actionKey))];
  const [sources, actionSlots] = await Promise.all([
    ids.length ? db.select({ id: clips.id, userId: clips.userId, isActive: clips.isActive, filePath: files.filePath, format: files.format, clipIndex: clips.clipIndex })
      .from(clips).innerJoin(files, and(eq(files.id, clips.animationFileId), eq(files.userId, clips.userId))).where(inArray(clips.id, ids)) : Promise.resolve([]),
    keys.length ? db.select({ actionKey: slots.actionKey, isActive: slots.isActive }).from(slots)
      .where(and(eq(slots.userId, ownerId), inArray(slots.actionKey, keys))) : Promise.resolve([]),
  ]);
  const projection = (row: typeof own[number]) => ({ actionKey: row.actionKey, mode: row.mode, animationId: row.animationId });
  for (const character of characters) {
    const characterRows = own.filter(row => row.characterId === character.id);
    const modelRows = defaults.filter(row => row.modelId === character.modelId);
    const rows = [...characterRows, ...modelRows];
    result.set(character.id, {
      modelId: character.modelId,
      assignments: characterRows.map(projection),
      inherited: modelRows.map(row => ({ actionKey: row.actionKey, mode: row.mode, animationId: row.animationId })),
      animations: sources.filter(source => rows.some(row => row.animationId === source.id && row.userId === source.userId))
        .map(({ userId: _owner, ...source }) => ({ ...source, filePath: source.isActive ? source.filePath : '' })),
      slots: actionSlots.filter(slot => rows.some(row => row.actionKey === slot.actionKey)),
    });
  }
  return result;
}
