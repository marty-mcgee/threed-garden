// app/api/map/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets, projectTraffic, projectThreed } from '@/lib/schema/project';
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

    // ✅ Build base query for projects
    let query = db
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
          AND ${projectAssets.userId} = ${userId || project.userId}
        )`.as('assetCount'),
      })
      .from(project)
      .$dynamic();

    // ✅ Filter by user or public
    if (userId) {
      query = query.where(eq(project.userId, userId));
    } else {
      query = query.where(eq(project.isPublic, true));
    }

    // ✅ Filter active status
    if (!includeInactive) {
      query = query.where(eq(project.isActive, true));
    }

    // ✅ Only include projects with at least one asset
    query = query.where(
      sql`EXISTS (
        SELECT 1 
        FROM ${projectAssets} 
        WHERE ${projectAssets.projectId} = ${project.id}
        AND ${projectAssets.userId} = ${userId || project.userId}
      )`
    );

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: count() })
      .from(project)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ For each project, check if it has traffic or threed data
    const projectsWithTypes = await Promise.all(
      results.map(async (proj) => {
        // Check if project has traffic modules
        const trafficModules = await db
          .select({ count: count() })
          .from(projectTraffic)
          .where(
            and(
              eq(projectTraffic.projectId, proj.id),
              userId ? eq(projectTraffic.userId, userId) : sql`1=1`
            )
          );

        // Check if project has threed modules
        const threedModules = await db
          .select({ count: count() })
          .from(projectThreed)
          .where(
            and(
              eq(projectThreed.projectId, proj.id),
              userId ? eq(projectThreed.userId, userId) : sql`1=1`
            )
          );

        return {
          ...proj,
          hasTraffic: (trafficModules[0]?.count || 0) > 0,
          hasThreeD: (threedModules[0]?.count || 0) > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: projectsWithTypes,
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