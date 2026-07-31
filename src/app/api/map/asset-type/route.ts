// app/api/map/asset-type/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets } from '@/lib/schema/project';
import { eq, and, sql } from 'drizzle-orm';

// ============================================
// GET /api/map/asset-type - Get assets of a specific type for a project
// Query Parameters:
//   - projectId (required): Project ID
//   - assetType (required): Asset type to fetch
//   - includeInactive (optional): Include inactive records
//   - limit (optional): Max records (default: 100)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('assetType');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    // ✅ Validate parameters
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    if (!assetType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: assetType' },
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

    // ✅ Get assets of the specified type
    const assets = await db
      .select({
        assetId: projectAssets.assetId,
        assetType: projectAssets.assetType,
        moduleType: projectAssets.moduleType,
        config: projectAssets.config,
        isActive: projectAssets.isActive,
        createdAt: projectAssets.createdAt,
      })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          includeInactive ? sql`1=1` : eq(projectAssets.isActive, true)
        )
      )
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        assetType,
        count: assets.length,
        assets,
      },
    });
  } catch (error) {
    console.error('Error fetching asset type data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset type data' },
      { status: 500 }
    );
  }
}