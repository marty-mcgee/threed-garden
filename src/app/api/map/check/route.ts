// app/api/map/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets } from '@/lib/schema/project';
import { eq, and, sql } from 'drizzle-orm';

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
          userId ? eq(project.userId, userId) : eq(project.isPublic, true)
        )
      )
      .limit(1);

    if (!projectData) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ Count total assets for this project
    const [assetCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          eq(projectAssets.isActive, true)
        )
      );

    // ✅ Check if project has traffic assets
    const [trafficCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          eq(projectAssets.moduleType, 'traffic'),
          eq(projectAssets.isActive, true)
        )
      );

    // ✅ Check if project has threed assets
    const [threedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          eq(projectAssets.moduleType, 'threed'),
          eq(projectAssets.isActive, true)
        )
      );

    const totalAssets = assetCount?.count || 0;
    const hasTraffic = (trafficCount?.count || 0) > 0;
    const hasThreeD = (threedCount?.count || 0) > 0;

    return NextResponse.json({
      success: true,
      data: {
        hasTraffic,
        hasThreeD,
        totalAssets,
        trafficCount: trafficCount?.count || 0,
        threedCount: threedCount?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error checking project data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check project data' },
      { status: 500 }
    );
  }
}