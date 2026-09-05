// app/api/map/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets, projectMusic, projectTraffic, projectThreed } from '@/lib/schema/project';
import { music } from '@/lib/schema/music';
import { threed } from '@/lib/schema/threed';
import { traffic } from '@/lib/schema/traffic';
import { eq, and, desc, sql, count } from 'drizzle-orm';

// ============================================
// GET /api/map/projects - Get projects with map data
// Query Parameters:
//   - includeInactive (optional): Include inactive projects
//   - limit (optional): Max records (default: 50)
//   - offset (optional): Pagination offset
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const projectScope = and(
      userId ? eq(project.userId, userId) : eq(project.isPublic, true),
      includeInactive ? undefined : eq(project.isActive, true),
      // Owners must be able to reopen a new, empty Project and use the
      // Dashboard setup workflow. Anonymous discovery remains limited to
      // public Projects that already contain at least one active asset.
      userId ? undefined : sql`EXISTS (
          SELECT 1
          FROM ${projectAssets}
          WHERE ${projectAssets.projectId} = ${project.id}
          AND ${projectAssets.userId} = ${project.userId}
          AND ${projectAssets.isActive} = true
        )`
    );

    // ✅ Build base query for projects
    const query = db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        slug: project.slug,
        isActive: project.isActive,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        // ✅ Count assets for this project
        assetCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${projectAssets} 
          WHERE ${projectAssets.projectId} = ${project.id}
          AND ${projectAssets.userId} = ${project.userId}
          AND ${projectAssets.isActive} = true
        )`.as('assetCount'),
      })
      .from(project)
      .where(projectScope);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: count() })
      .from(project)
      .where(projectScope);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ For each project, check if it has traffic or threed data
    const projectsWithTypes = await Promise.all(
      results.map(async (proj) => {
        const [trafficModules, threedModules, musicModules] = await Promise.all([
          db
            .select({ count: count() })
            .from(projectTraffic)
            .innerJoin(traffic, eq(projectTraffic.trafficId, traffic.id))
            .where(
              and(
                eq(projectTraffic.projectId, proj.id),
                eq(projectTraffic.isActive, true),
                eq(traffic.isActive, true),
                userId ? eq(projectTraffic.userId, userId) : sql`1=1`
              )
            ),
          db
            .select({ count: count() })
            .from(projectThreed)
            .innerJoin(threed, eq(projectThreed.threedId, threed.id))
            .where(
              and(
                eq(projectThreed.projectId, proj.id),
                eq(projectThreed.isActive, true),
                eq(threed.isActive, true),
                userId ? eq(projectThreed.userId, userId) : sql`1=1`
              )
            ),
          db
            .select({ count: count() })
            .from(projectMusic)
            .innerJoin(music, eq(projectMusic.musicId, music.id))
            .where(
              and(
                eq(projectMusic.projectId, proj.id),
                eq(projectMusic.isActive, true),
                eq(music.isActive, true),
                userId ? eq(projectMusic.userId, userId) : sql`1=1`
              )
            ),
        ]);

        const moduleCounts = {
          traffic: Number(trafficModules[0]?.count || 0),
          threed: Number(threedModules[0]?.count || 0),
          music: Number(musicModules[0]?.count || 0),
        };

        return {
          id: proj.id,
          name: proj.name,
          description: proj.description || '',
          slug: proj.slug,
          hasTraffic: moduleCounts.traffic > 0,
          hasThreeD: moduleCounts.threed > 0,
          hasMusic: moduleCounts.music > 0,
          moduleCounts,
          assetCount: proj.assetCount || 0,
          isActive: proj.isActive,
          isPublic: proj.isPublic,
        };
      })
    );

    return NextResponse.json({
      success: true,
      projects: projectsWithTypes,  // ✅ Changed from 'data' to 'projects' to match page.tsx expectation
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching map projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
