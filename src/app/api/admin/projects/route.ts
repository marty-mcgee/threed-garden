import { and, count, eq, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project, projectMultimedia, projectThreed, projectTraffic } from '@/libraries/schema/project';
import { threed } from '@/libraries/schema/threed';
import { traffic } from '@/libraries/schema/traffic';
import { multimedia } from '@/libraries/schema/multimedia';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const owner = (await auth())?.user?.id;
  if (!owner) return Response.json({ error: 'Sign in to view Projects.' }, { status: 401, headers });
  try {
    const threedCounts = db.select({ projectId: projectThreed.projectId, total: count().as('threed_total') })
      .from(projectThreed).innerJoin(threed, eq(threed.id, projectThreed.threedId))
      .where(and(eq(projectThreed.userId, owner), eq(projectThreed.isActive, true), eq(threed.isActive, true)))
      .groupBy(projectThreed.projectId).as('threed_counts');
    const multimediaCounts = db.select({ projectId: projectMultimedia.projectId, total: count().as('multimedia_total') })
      .from(projectMultimedia).innerJoin(multimedia, eq(multimedia.id, projectMultimedia.multimediaId))
      .where(and(eq(projectMultimedia.userId, owner), eq(projectMultimedia.isActive, true), eq(multimedia.isActive, true)))
      .groupBy(projectMultimedia.projectId).as('multimedia_counts');
    const trafficCounts = db.select({ projectId: projectTraffic.projectId, total: count().as('traffic_total') })
      .from(projectTraffic).innerJoin(traffic, eq(traffic.id, projectTraffic.trafficId))
      .where(and(eq(projectTraffic.userId, owner), eq(projectTraffic.isActive, true), eq(traffic.isActive, true)))
      .groupBy(projectTraffic.projectId).as('traffic_counts');
    const rows = await db.select({
      id: project.id,
      name: project.name,
      description: project.description,
      isActive: project.isActive,
      isPublic: project.isPublic,
      threed: sql<number>`coalesce(${threedCounts.total}, 0)`.mapWith(Number),
      multimedia: sql<number>`coalesce(${multimediaCounts.total}, 0)`.mapWith(Number),
      traffic: sql<number>`coalesce(${trafficCounts.total}, 0)`.mapWith(Number),
    }).from(project).leftJoin(threedCounts, eq(threedCounts.projectId, project.id))
      .leftJoin(multimediaCounts, eq(multimediaCounts.projectId, project.id))
      .leftJoin(trafficCounts, eq(trafficCounts.projectId, project.id))
      .where(eq(project.userId, owner));
    return Response.json({ rows }, { headers });
  } catch {
    return Response.json({ error: 'Could not load Projects.' }, { status: 500, headers });
  }
}
