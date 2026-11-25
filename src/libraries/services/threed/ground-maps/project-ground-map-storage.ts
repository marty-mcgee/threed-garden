import { del } from '@vercel/blob';
import { and, eq } from 'drizzle-orm';
import { db, type Transaction } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { threedGroundMaps } from '@/libraries/schema/threed';

export async function lockGroundMapProject(tx: Transaction, userId: string, projectId: number) {
  const [row] = await tx.select({ id: project.id }).from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId))).limit(1).for('update');
  return row;
}

export async function detachGroundMap(tx: Transaction, userId: string, projectId: number) {
  const [removed] = await tx.delete(threedGroundMaps)
    .where(and(eq(threedGroundMaps.projectId, projectId), eq(threedGroundMaps.userId, userId)))
    .returning({ filePath: threedGroundMaps.filePath });
  return removed?.filePath;
}

// Uploads always create fresh URLs. Save As can only share an existing assignment
// while holding its source row lock. Once the last committed row is gone, a
// future copy cannot acquire that URL from an earlier read.
export async function releaseGroundMapImage(userId: string, projectId: number, filePath: string | undefined) {
  if (!filePath) return;
  try {
    const retained = await db.transaction(async tx => {
      // Also wait for an upload whose commit response may have been lost.
      await lockGroundMapProject(tx, userId, projectId);
      const [row] = await tx.select({ id: threedGroundMaps.id }).from(threedGroundMaps)
        .where(eq(threedGroundMaps.filePath, filePath)).limit(1);
      return Boolean(row);
    });
    if (!retained) await del(filePath);
  } catch {
    // If database or storage status is uncertain, keep the image for recovery.
    console.warn('Ground Map image cleanup could not be confirmed.');
  }
}
