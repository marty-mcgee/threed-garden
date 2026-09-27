import { canReadSceneProject } from './scene-read-policy';
import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';

/** Read access never grants access to the owner's library or mutation endpoints. */
export async function readableProject(projectId: number, viewerId?: string) {
  if (!Number.isSafeInteger(projectId) || projectId <= 0) return null;
  const [record] = await db.select({ id: project.id, userId: project.userId, metadata: project.metadata, isPublic: project.isPublic })
    .from(project).where(and(eq(project.id, projectId), or(eq(project.isPublic, true),
      viewerId ? eq(project.userId, viewerId) : sql`false`))).limit(1);
  return record && canReadSceneProject(record, viewerId) ? record : null;
}
