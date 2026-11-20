// app/api/map/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project, projectAssets } from '@/libraries/schema/project';
import { eq, and, ne, or, sql } from 'drizzle-orm';
import { readableTaskAssignment, readThreeDTasks } from '@/libraries/services/threed/tasks/read-scope';

// ============================================
// GET /api/map/check - Check if a project has map data
// Query Parameters:
//   - projectId (required): Project ID to check
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // ✅ Validate projectId
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid projectId' },
        { status: 400 }
      );
    }

    // ✅ Verify project exists and user has access
    const [projectData] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          or(eq(project.isPublic, true), userId ? eq(project.userId, userId) : sql`false`)
        )
      )
      .limit(1);

    if (!projectData?.userId) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const [assetCount, trafficCount, threedCount] = await readThreeDTasks(userId, 'project', async scope => {
      const countAssets = async (moduleType?: 'traffic' | 'threed') => {
        const [row] = await db.select({ count: sql<number>`count(*)` }).from(projectAssets).where(and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, projectData.userId!),
          eq(projectAssets.isActive, true),
          moduleType ? eq(projectAssets.moduleType, moduleType) : undefined,
          or(ne(projectAssets.assetType, 'threed_tasks'), readableTaskAssignment(projectAssets.assetId, scope)),
        ));
        return Number(row?.count || 0);
      };
      return Promise.all([countAssets(), countAssets('traffic'), countAssets('threed')]);
    });

    const hasTraffic = trafficCount > 0;
    const hasThreeD = threedCount > 0;

    return NextResponse.json({
      success: true,
      data: {
        hasTraffic,
        hasThreeD,
        totalAssets: assetCount,
        trafficCount,
        threedCount,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error checking project data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check project data' },
      { status: 500 }
    );
  }
}
