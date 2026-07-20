// app/api/project/assets/route.ts - SIMPLIFIED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets } from '@/lib/schema/project';
import { music, threed, traffic } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/project/assets
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const moduleId = searchParams.get('moduleId');
    const moduleType = searchParams.get('moduleType');
    const assetType = searchParams.get('assetType');
    const assetId = searchParams.get('assetId');
    const checkAssignment = searchParams.get('checkAssignment') === 'true';

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // If checking assignment for a specific asset
    if (checkAssignment && assetType && assetId && moduleId) {
      const [existing] = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.projectId, parsedProjectId),
            eq(projectAssets.moduleId, parseInt(moduleId)),
            eq(projectAssets.assetType, assetType as any),
            eq(projectAssets.assetId, parseInt(assetId)),
            eq(projectAssets.userId, userId),
            eq(projectAssets.isActive, true)
          )
        )
        .limit(1);

      return NextResponse.json({
        success: true,
        assigned: !!existing,
        data: existing || null,
      });
    }

    // Build query
    let query = db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true)
        )
      );

    if (moduleId) {
      query = query.where(eq(projectAssets.moduleId, parseInt(moduleId)));
    }
    if (moduleType) {
      query = query.where(eq(projectAssets.moduleType, moduleType));
    }
    if (assetType) {
      query = query.where(eq(projectAssets.assetType, assetType as any));
    }

    const assets = await query.orderBy(desc(projectAssets.createdAt));

    return NextResponse.json({
      success: true,
      data: assets,
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
// POST /api/project/assets - SIMPLIFIED
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, moduleId, moduleType, assetType, assetId, config } = body;

    console.log('📝 POST /api/project/assets:', { projectId, moduleId, moduleType, assetType, assetId });

    if (!projectId || !moduleId || !moduleType || !assetType || !assetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);
    const parsedModuleId = parseInt(moduleId);
    const parsedAssetId = parseInt(assetId);

    if (isNaN(parsedProjectId) || isNaN(parsedModuleId) || isNaN(parsedAssetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID(s)' },
        { status: 400 }
      );
    }

    // ✅ Check if this asset is already assigned to this module
    const [existing] = await db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.moduleId, parsedModuleId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parsedAssetId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Asset already added to this module' },
        { status: 409 }
      );
    }

    // ✅ Create the assignment
    await ensureTableSequence('project_assets');

    const [newAsset] = await db
      .insert(projectAssets)
      .values({
        userId,
        projectId: parsedProjectId,
        moduleId: parsedModuleId,
        moduleType: moduleType,
        assetType: assetType as any,
        assetId: parsedAssetId,
        config: config || {},
        isActive: true,
      })
      .returning();

    console.log('✅ Asset assigned:', newAsset);

    return NextResponse.json({ 
      success: true, 
      data: newAsset,
      message: 'Asset added to module successfully'
    });
  } catch (error) {
    console.error('Error adding asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add asset' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project/assets - SIMPLIFIED
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const moduleId = searchParams.get('moduleId');
    const moduleType = searchParams.get('moduleType');
    const assetType = searchParams.get('assetType');
    const assetId = searchParams.get('assetId');

    if (!projectId || !moduleId || !moduleType || !assetType || !assetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);
    const parsedModuleId = parseInt(moduleId);
    const parsedAssetId = parseInt(assetId);

    if (isNaN(parsedProjectId) || isNaN(parsedModuleId) || isNaN(parsedAssetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID(s)' },
        { status: 400 }
      );
    }

    // Soft delete
    const [deleted] = await db
      .update(projectAssets)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.moduleId, parsedModuleId),
          eq(projectAssets.moduleType, moduleType),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parsedAssetId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Asset not found in this module' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: deleted,
      message: 'Asset removed from module successfully'
    });
  } catch (error) {
    console.error('Error removing asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove asset' },
      { status: 500 }
    );
  }
}