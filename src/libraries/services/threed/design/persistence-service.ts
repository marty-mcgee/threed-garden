import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import type { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { threedDesigns } from '@/libraries/schema/threed';
import { DesignRequestError, designInput } from './persistence-contract';

type Database = typeof db;
const fields = { id: threedDesigns.id, revision: threedDesigns.revision, projectId: threedDesigns.projectId, document: threedDesigns.document };
export function designService(database: Database) {
  const projectAccess = async (client: Pick<Database, 'select'>, owner: string, projectId: number | null, lock = false) => {
    if (projectId === null) return;
    const query = client.select({ id: project.id }).from(project).where(and(eq(project.id, projectId), eq(project.userId, owner))).limit(1);
    const [owned] = await (lock ? query.for('share') : query);
    if (!owned) throw new DesignRequestError('Project not found or not owned by you.', 404);
  };
  return {
    async projects(owner: string) {
      return database.select({ id: project.id, name: project.name }).from(project).where(eq(project.userId, owner)).orderBy(desc(project.id)).limit(200);
    },
    async list(owner: string, projectId: number | null, offset: number) {
      await projectAccess(database, owner, projectId);
      return database.select({ id: threedDesigns.id, name: threedDesigns.name, revision: threedDesigns.revision, projectId: threedDesigns.projectId })
        .from(threedDesigns).leftJoin(project, eq(project.id, threedDesigns.projectId))
        .where(and(eq(threedDesigns.userId, owner), or(isNull(threedDesigns.projectId), eq(project.userId, owner)), ...(projectId === null ? [] : [eq(threedDesigns.projectId, projectId)])))
        .orderBy(desc(threedDesigns.updatedAt), desc(threedDesigns.id)).limit(50).offset(offset);
    },
    async get(owner: string, id: number) {
      const [row] = await database.select(fields).from(threedDesigns).where(and(eq(threedDesigns.userId, owner), eq(threedDesigns.id, id))).limit(1);
      if (!row) throw new DesignRequestError('ThreeD Design not found.', 404);
      await projectAccess(database, owner, row.projectId);
      return row;
    },
    async save(owner: string, value: unknown, updating: boolean) {
      const input = designInput(value, updating);
      return database.transaction(async tx => {
        if (!updating) {
          await projectAccess(tx, owner, input.projectId, true);
          const [created] = await tx.insert(threedDesigns).values({ userId: owner, projectId: input.projectId, createKey: input.createKey, name: input.document.name, formatVersion: input.document.version, document: input.document })
            .onConflictDoNothing({ target: [threedDesigns.userId, threedDesigns.createKey] }).returning(fields);
          if (created) return created;
          const [existing] = await tx.select(fields).from(threedDesigns).where(and(eq(threedDesigns.userId, owner), eq(threedDesigns.createKey, input.createKey))).limit(1);
          if (!existing || existing.projectId !== input.projectId) throw new DesignRequestError('Creation key belongs to a different design context.', 409);
          return existing;
        }
        const [existing] = await tx.select(fields).from(threedDesigns).where(and(eq(threedDesigns.userId, owner), eq(threedDesigns.id, input.id))).limit(1).for('update');
        if (!existing) throw new DesignRequestError('ThreeD Design not found.', 404);
        await projectAccess(tx, owner, existing.projectId, true);
        if (existing.revision !== input.revision) throw new DesignRequestError('This design changed elsewhere. Export your draft, then reopen the saved design before updating it.', 409);
        const [updated] = await tx.update(threedDesigns).set({ document: input.document, name: input.document.name, formatVersion: input.document.version, revision: sql`${threedDesigns.revision} + 1`, updatedAt: new Date() })
          .where(and(eq(threedDesigns.userId, owner), eq(threedDesigns.id, input.id), eq(threedDesigns.revision, input.revision))).returning(fields);
        if (!updated) throw new DesignRequestError('This design changed elsewhere. Export your draft and reopen the saved design.', 409);
        return updated;
      });
    },
  };
}
