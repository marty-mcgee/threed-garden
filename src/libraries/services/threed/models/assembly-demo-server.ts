// Server service: requires an injected application Drizzle database and authenticated owner.
import { and, eq, inArray } from 'drizzle-orm';
import type { db } from '@/libraries/db/client';
import { threedModels } from '@/libraries/schema/threed';
import { threedAssembly, threedAssemblyModelAssignments, threedAssemblyRevisions, threedAssemblyComponents } from '@/libraries/schema/threed';

const DEMO_KEY = 'farmbot-persistence-demo-v1';
const DEMO_NAME = 'FarmBot Assembly — Persistence Demo';
const NAMES = ['FarmBot: Box', 'FarmBot: Farmduino', 'FarmBot: Belt Clip'] as const;

/** Server caller must supply the authenticated owner, never a browser ownerId. */
export async function createFarmBotAssemblyDemo(database: typeof db, ownerId: string) {
  if (!ownerId.trim()) throw new Error('Authenticated owner is required.');
  return database.transaction(async tx => {
    const models = await tx.select({ id: threedModels.id, name: threedModels.modelName, active: threedModels.isActive, status: threedModels.status, type: threedModels.modelType, character: threedModels.usedByCharacters })
      .from(threedModels).where(and(eq(threedModels.userId, ownerId), inArray(threedModels.modelName, [...NAMES])));
    const ids = NAMES.map(name => {
      const matches = models.filter(m => m.name === name && m.active === true && m.status === 'active' && m.type === 'glb' && m.character !== true);
      if (matches.length !== 1) throw new Error(`Select exactly one active owned GLB Model named ${name}.`);
      return matches[0].id;
    });
    const [existing] = await tx.select({ id: threedAssembly.id }).from(threedAssembly).where(and(eq(threedAssembly.userId, ownerId), eq(threedAssembly.demoKey, DEMO_KEY)));
    if (existing) throw new Error('This demo already exists. Remove it explicitly before creating another.');
    const [group] = await tx.insert(threedAssembly).values({ userId: ownerId, name: DEMO_NAME, demoKey: DEMO_KEY }).returning();
    await tx.insert(threedAssemblyModelAssignments).values(ids.map(modelId => ({ assemblyId: group.id, modelId })));
    await tx.insert(threedAssemblyRevisions).values({ assemblyId: group.id, revision: 1, name: DEMO_NAME });
    const base = { assemblyId: group.id, revision: 1, positionZ: 0, rotationX: 0, rotationZ: 0, scale: 1 };
    await tx.insert(threedAssemblyComponents).values([
      { ...base, componentId: 'demo-box', ordinal: 1, modelId: ids[0], label: 'Box', positionX: 0, positionY: 0, rotationY: 0 },
      { ...base, componentId: 'demo-board', ordinal: 2, modelId: ids[1], label: 'Farmduino', positionX: 0, positionY: 1, rotationY: 0 },
      { ...base, componentId: 'demo-clip-left', ordinal: 3, modelId: ids[2], label: 'Belt Clip — Left', positionX: -1, positionY: 0.5, rotationY: 0 },
      { ...base, componentId: 'demo-clip-right', ordinal: 4, modelId: ids[2], label: 'Belt Clip — Right', positionX: 1, positionY: 0.5, rotationY: Math.PI },
    ]);
    const components = await tx.select().from(threedAssemblyComponents).where(and(eq(threedAssemblyComponents.assemblyId, group.id), eq(threedAssemblyComponents.revision, 1))).orderBy(threedAssemblyComponents.ordinal);
    if (components.length !== 4) throw new Error('Demo readback failed.');
    return { group, components };
  });
}

/** Removes only the selected owned demo. Source Models/Files are untouched. */
export async function deleteFarmBotAssemblyDemo(database: typeof db, ownerId: string, assemblyId: string) {
  if (!ownerId.trim() || !assemblyId.trim()) throw new Error('Owner and assembly ID are required.');
  return database.transaction(async tx => {
    const [group] = await tx.select({ id: threedAssembly.id }).from(threedAssembly)
      .where(and(eq(threedAssembly.id, assemblyId), eq(threedAssembly.userId, ownerId), eq(threedAssembly.demoKey, DEMO_KEY))).for('update');
    if (!group) throw new Error('Demo not found.');
    // Explicit order keeps deletion portable across Drizzle's immediate FKs.
    await tx.delete(threedAssemblyComponents).where(eq(threedAssemblyComponents.assemblyId, group.id));
    await tx.delete(threedAssemblyRevisions).where(eq(threedAssemblyRevisions.assemblyId, group.id));
    await tx.delete(threedAssemblyModelAssignments).where(eq(threedAssemblyModelAssignments.assemblyId, group.id));
    await tx.delete(threedAssembly).where(and(eq(threedAssembly.id, group.id), eq(threedAssembly.userId, ownerId)));
    return { id: group.id };
  });
}
