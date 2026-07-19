// app/api/project/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets } from '@/lib/schema/project';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/project/assets?projectId=1&type=album - Get assets for a project
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { limit, offset, total: 0 },
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Filter by asset type if provided
    if (assetType) {
      query = query.where(eq(projectAssets.assetType, assetType as any));
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId)
        )
      );

    if (assetType) {
      countQuery.where(eq(projectAssets.assetType, assetType as any));
    }

    const [countResult] = await countQuery;

    const assets = await query
      .orderBy(desc(projectAssets.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: assets,
      pagination: {
        limit,
        offset,
        total: countResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching project assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/project/assets - Add an asset to a project
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, assetType, assetId, config } = body;

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, assetType, assetId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // ✅ Check if already exists
    const [existing] = await db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parseInt(assetId))
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Asset already added to this project' },
        { status: 409 }
      );
    }

    await ensureTableSequence('project_assets');

    const [newAsset] = await db
      .insert(projectAssets)
      .values({
        userId,
        projectId: parsedProjectId,
        assetType: assetType as any,
        assetId: parseInt(assetId),
        config: config || {},
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newAsset });
  } catch (error) {
    console.error('Error adding asset to project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add asset to project' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project/assets - Remove an asset from a project
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('type');
    const assetId = searchParams.get('assetId');

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, type, assetId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parseInt(assetId)),
          eq(projectAssets.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Asset not found in this project' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Error removing asset from project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove asset from project' },
      { status: 500 }
    );
  }
}