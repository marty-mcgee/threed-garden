import { copy as copyBlob } from '@vercel/blob';
import { createThreeDBlobPath, isOwnedTextureBlob } from '@/libraries/services/threed/models/model-blob-paths';
import { createHash, randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db, type Transaction } from '@/libraries/db/client';
import { threedModelTextures, threedModels, threedCharacters, threedTerrains, threedTerrainRevisions, threedModelFiles, threedModelMaterialAssignments, threedModelCategoryAssignments, threedModelAnimationAssignments, threedCharacterModels, threedCharacterAnimationAssignments } from '@/libraries/schema/threed';
import { copyAssociatedAlbums } from '@/libraries/services/project/duplicate-project-assignments';

import { completeDuplicate, DuplicateError as CopyError, reserveDuplicate } from '@/libraries/services/threed/duplication-receipt';

async function copyModel(tx: Transaction, owner: string, source: number, name: string) {
  const [row] = await tx.select().from(threedModels).where(and(eq(threedModels.id, source), eq(threedModels.userId, owner))).for('share');
  if (!row) throw new CopyError('Model not found.', 404);
  const { id, createdAt, updatedAt, uploadedAt, ...settings } = row;
  const [copy] = await tx.insert(threedModels).values({
    ...settings,
    modelName: name,
    mainModelFileId: null,
    isPublic: false,
    isLibraryItem: false,
    isDefault: false,
    usedByCharacters: false,
    usedByPlants: false,
  }).returning({ id: threedModels.id });
  const ids = new Map<number, number>();
  for (const { id, createdAt, updatedAt, ...file } of await tx.select().from(threedModelFiles).where(and(eq(threedModelFiles.modelId, source), eq(threedModelFiles.userId, owner))).for('share')) {
    const [saved] = await tx.insert(threedModelFiles).values({ ...file, modelId: copy.id }).returning({ id: threedModelFiles.id });
    ids.set(id, saved.id);
  }
  if (row.mainModelFileId !== null) {
    const primary = ids.get(row.mainModelFileId);
    if (!primary) throw new CopyError('Review the Model primary File before duplicating.', 409);
    await tx.update(threedModels).set({ mainModelFileId: primary }).where(eq(threedModels.id, copy.id));
  }
  for (const { id, createdAt, updatedAt, ...link } of await tx.select().from(threedModelMaterialAssignments).where(and(eq(threedModelMaterialAssignments.modelId, source), eq(threedModelMaterialAssignments.userId, owner)))) {
    await tx.insert(threedModelMaterialAssignments).values({ ...link, modelId: copy.id });
  }
  for (const { id, createdAt, updatedAt, ...link } of await tx.select().from(threedModelCategoryAssignments).where(and(eq(threedModelCategoryAssignments.modelId, source), eq(threedModelCategoryAssignments.userId, owner)))) {
    await tx.insert(threedModelCategoryAssignments).values({ ...link, modelId: copy.id });
  }
  for (const { id, createdAt, updatedAt, ...link } of await tx.select().from(threedModelAnimationAssignments).where(and(eq(threedModelAnimationAssignments.modelId, source), eq(threedModelAnimationAssignments.userId, owner)))) {
    await tx.insert(threedModelAnimationAssignments).values({ ...link, modelId: copy.id });
  }
  await copyAssociatedAlbums(tx, owner, 'model_file', ids);
  await copyAssociatedAlbums(tx, owner, 'model', new Map([[source, copy.id]]));
  return copy.id;
}

async function copyCharacter(tx: Transaction, owner: string, source: number, name: string) {
  const [row] = await tx.select().from(threedCharacters).where(and(eq(threedCharacters.id, source), eq(threedCharacters.userId, owner))).for('share');
  if (!row) throw new CopyError('Character not found.', 404);
  const { id, createdAt, updatedAt, ...settings } = row;
  const [copy] = await tx.insert(threedCharacters).values({ ...settings, characterId: randomUUID(), name }).returning({ id: threedCharacters.id });
  for (const { id, createdAt, updatedAt, ...link } of await tx.select().from(threedCharacterModels).where(and(eq(threedCharacterModels.characterId, source), eq(threedCharacterModels.userId, owner)))) {
    await tx.insert(threedCharacterModels).values({ ...link, characterId: copy.id });
  }
  for (const { id, createdAt, updatedAt, ...link } of await tx.select().from(threedCharacterAnimationAssignments).where(and(eq(threedCharacterAnimationAssignments.characterId, source), eq(threedCharacterAnimationAssignments.userId, owner)))) {
    await tx.insert(threedCharacterAnimationAssignments).values({ ...link, characterId: copy.id });
  }
  await copyAssociatedAlbums(tx, owner, 'character', new Map([[source, copy.id]]));
  return copy.id;
}

async function copyTerrain(tx: Transaction, owner: string, source: number, name: string) {
  const [row] = await tx.select().from(threedTerrains).where(and(eq(threedTerrains.id, source), eq(threedTerrains.userId, owner))).for('share');
  if (!row) throw new CopyError('Terrain not found.', 404);
  const [surface] = await tx.select().from(threedTerrainRevisions).where(eq(threedTerrainRevisions.terrainId, source)).orderBy(desc(threedTerrainRevisions.revision)).limit(1);
  if (!surface) throw new CopyError('The Terrain has no saved revision.', 409);
  const [copy] = await tx.insert(threedTerrains).values({ userId: owner, name, sortOrder: row.sortOrder, isActive: row.isActive }).returning({ id: threedTerrains.id });
  const { createdAt, ...geometry } = surface;
  await tx.insert(threedTerrainRevisions).values({ ...geometry, terrainId: copy.id, revision: 1 });
  return copy.id;
}

async function copyTexture(tx: Transaction, owner: string, source: number, name: string, requestKey: string) {
  const [texture] = await tx.select().from(threedModelTextures)
    .where(and(eq(threedModelTextures.id, source), eq(threedModelTextures.userId, owner))).for('share');
  if (!texture) throw new CopyError('Texture not found.', 404);
  if (!isOwnedTextureBlob(texture.filePath, owner)) {
    throw new CopyError('This Texture uses a legacy or external file. Upload it to your Texture library before duplicating.', 422);
  }
  // A retry after an interrupted transaction writes to the same dedicated copy path.
  const key = createHash('sha256').update(JSON.stringify([source, name, requestKey])).digest('hex');
  const path = createThreeDBlobPath(owner, 'textures', texture.fileName, requestKey)
    .replace('/textures/', '/textures/copies/' + key + '/');
  const blob = await copyBlob(texture.filePath, path, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: texture.mimeType
  });
  const { id, createdAt, updatedAt, ...fields } = texture;
  const [saved] = await tx.insert(threedModelTextures).values({
    ...fields,
    textureName: name,
    filePath: blob.url
  }).returning({ id: threedModelTextures.id });
  await copyAssociatedAlbums(tx, owner, 'texture', new Map([[source, saved.id]]));
  return saved.id;
}

export async function POST(request: Request) {
  try {
    const owner = (await auth())?.user?.id;
    if (!owner) throw new CopyError('Sign in to duplicate a record.', 401);
    const input = await request.json().catch(() => null);
    const { kind, sourceId, requestKey } = input ?? {};
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    if (!['model', 'character', 'terrain', 'texture'].includes(kind) || !Number.isSafeInteger(sourceId) || sourceId <= 0 || sourceId > 2147483647 || !name || name.length > 120 || typeof requestKey !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(requestKey)) throw new CopyError('Invalid duplication request.', 400);
    const result = await db.transaction(async tx => {
      const reservation = await reserveDuplicate(tx, { userId: owner, requestKey, sourceId, kind, name });
      if (reservation.existingId) return { id: reservation.existingId, created: false };
      const copy = kind === 'model' ? copyModel : kind === 'character' ? copyCharacter : kind === 'terrain' ? copyTerrain : copyTexture;
      const id = await copy(tx, owner, sourceId, name, requestKey);
      await completeDuplicate(tx, reservation, id);
      return { id, created: true };
    }, { isolationLevel: 'repeatable read' });
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return Response.json({ error: error instanceof CopyError ? error.message : 'Unable to confirm the copy. Retry the same request.' }, { status: error instanceof CopyError ? error.status : 503 });
  }
}
