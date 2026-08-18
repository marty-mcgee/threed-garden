// app/api/project/assets/route.ts - SIMPLIFIED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  assetTypeEnum,
  project,
  projectAssets,
  projectMusic,
  projectThreed,
  projectTraffic,
} from '@/lib/schema/project';
import { music, threed, traffic } from '@/lib/schema';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';
import {
  ASSIGNABLE_ASSET_REGISTRY,
  type ProjectModuleType,
} from '@/lib/project-assets/asset-registry';

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
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing project ID' },
        { status: 400 }
      );
    }

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

    // Build all filters together. A second Drizzle .where() call replaces the
    // previous predicate, which could otherwise discard project scoping.
    const assets = await db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true),
          moduleId ? eq(projectAssets.moduleId, parseInt(moduleId)) : undefined,
          moduleType ? eq(projectAssets.moduleType, moduleType) : undefined,
          assetType ? eq(projectAssets.assetType, assetType as any) : undefined
        )
      )
      .orderBy(desc(projectAssets.createdAt));

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

    if (projectId == null || moduleId == null || !moduleType || !assetType || assetId == null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = Number(projectId);
    const parsedModuleId = Number(moduleId);
    const parsedAssetId = Number(assetId);

    if (
      !Number.isInteger(parsedProjectId) || parsedProjectId <= 0 ||
      !Number.isInteger(parsedModuleId) || parsedModuleId <= 0 ||
      !Number.isInteger(parsedAssetId) || parsedAssetId <= 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID(s)' },
        { status: 400 }
      );
    }

    const supportedModuleTypes: ProjectModuleType[] = ['music', 'threed', 'traffic'];
    if (!supportedModuleTypes.includes(moduleType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid module type' },
        { status: 400 }
      );
    }

    const assetDefinition = ASSIGNABLE_ASSET_REGISTRY[assetType];
    if (
      !assetTypeEnum.enumValues.includes(assetType) ||
      !assetDefinition ||
      assetDefinition.moduleType !== moduleType
    ) {
      return NextResponse.json(
        { success: false, error: 'Asset type does not belong to this module type' },
        { status: 400 }
      );
    }

    const [ownedProject] = await db
      .select({ id: project.id })
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!ownedProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    let activeModuleAssignment: { id: number } | undefined;
    if (moduleType === 'threed') {
      [activeModuleAssignment] = await db
        .select({ id: projectThreed.id })
        .from(projectThreed)
        .innerJoin(threed, eq(projectThreed.threedId, threed.id))
        .where(
          and(
            eq(projectThreed.projectId, parsedProjectId),
            eq(projectThreed.threedId, parsedModuleId),
            eq(projectThreed.userId, userId),
            eq(projectThreed.isActive, true),
            eq(threed.isActive, true)
          )
        )
        .limit(1);
    } else if (moduleType === 'traffic') {
      [activeModuleAssignment] = await db
        .select({ id: projectTraffic.id })
        .from(projectTraffic)
        .innerJoin(traffic, eq(projectTraffic.trafficId, traffic.id))
        .where(
          and(
            eq(projectTraffic.projectId, parsedProjectId),
            eq(projectTraffic.trafficId, parsedModuleId),
            eq(projectTraffic.userId, userId),
            eq(projectTraffic.isActive, true),
            eq(traffic.isActive, true)
          )
        )
        .limit(1);
    } else {
      [activeModuleAssignment] = await db
        .select({ id: projectMusic.id })
        .from(projectMusic)
        .innerJoin(music, eq(projectMusic.musicId, music.id))
        .where(
          and(
            eq(projectMusic.projectId, parsedProjectId),
            eq(projectMusic.musicId, parsedModuleId),
            eq(projectMusic.userId, userId),
            eq(projectMusic.isActive, true),
            eq(music.isActive, true)
          )
        )
        .limit(1);
    }

    if (!activeModuleAssignment) {
      return NextResponse.json(
        { success: false, error: 'Module is not actively assigned to this project' },
        { status: 409 }
      );
    }

    const assetAccessCondition = assetDefinition.policy === 'ownerOrActivePublic'
      ? or(
          eq(assetDefinition.userIdColumn, userId),
          and(
            eq(assetDefinition.isPublicColumn, true),
            eq(assetDefinition.isActiveColumn, true)
          )
        )
      : eq(assetDefinition.userIdColumn, userId);

    const [assignableAsset] = await db
      .select({ id: assetDefinition.idColumn })
      .from(assetDefinition.table)
      .where(
        and(
          eq(assetDefinition.idColumn, parsedAssetId),
          assetAccessCondition
        )
      )
      .limit(1);

    if (!assignableAsset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found or not assignable' },
        { status: 404 }
      );
    }

    // Check both active and inactive rows. The database unique index does not
    // include isActive, so a previously removed assignment must be reactivated.
    const [existing] = await db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.moduleId, parsedModuleId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parsedAssetId),
          eq(projectAssets.userId, userId)
        )
      )
      .limit(1);

    if (existing?.isActive) {
      return NextResponse.json(
        { success: false, error: 'Asset already added to this module' },
        { status: 409 }
      );
    }

    if (existing) {
      const [reactivatedAsset] = await db
        .update(projectAssets)
        .set({
          moduleType,
          config: config || {},
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(projectAssets.id, existing.id))
        .returning();

      return NextResponse.json({
        success: true,
        data: reactivatedAsset,
        message: 'Asset added to module successfully'
      });
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
