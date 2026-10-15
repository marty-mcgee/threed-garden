import { createHash } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { threedDesigns } from '@/libraries/schema/threed';
import { readProjectArchitecture } from './project-architecture';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export class ProjectDesignProjectionError extends Error {}

/** Reserved deterministic identity; unrelated historical Designs are never adopted. */
export function projectDesignCreateKey(owner: string, projectId: number): string {
  const hash = createHash('sha256').update(JSON.stringify(['threed-project-design-projection-v1', owner, projectId])).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

/** Must run inside Project Save's transaction, after the authoritative config update. */
export async function saveProjectDesignProjection(tx: Transaction, owner: string, projectId: number) {
  const [owned] = await tx.select({ config: project.config }).from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, owner))).limit(1).for('update');
  if (!owned) throw new Error('Project not found or not owned during Design synchronization');
  const architecture = readProjectArchitecture(owned.config);
  if (!architecture) return undefined;
  const document = architecture.document;
  const [saved] = await tx.insert(threedDesigns).values({
    userId: owner, projectId, createKey: projectDesignCreateKey(owner, projectId),
    name: document.name, formatVersion: document.version, document,
  }).onConflictDoUpdate({
    target: [threedDesigns.userId, threedDesigns.createKey],
    set: {
      name: document.name, formatVersion: document.version, document,
      revision: sql`${threedDesigns.revision} + 1`, updatedAt: new Date(),
    },
    setWhere: and(eq(threedDesigns.projectId, projectId), eq(threedDesigns.userId, owner)),
  }).returning({ id: threedDesigns.id, projectId: threedDesigns.projectId, document: threedDesigns.document });
  const confirmed = saved && readProjectArchitecture({ threeDArchitecture: { version: 1, document: saved.document } });
  if (!saved || saved.projectId !== projectId || JSON.stringify(confirmed) !== JSON.stringify(architecture)) {
    throw new Error('Project Design synchronization was not confirmed; Project Save was rolled back');
  }
  return saved.id;
}
