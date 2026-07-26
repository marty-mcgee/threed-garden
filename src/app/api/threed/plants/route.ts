// app/api/threed/plants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedPlants, threed } from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/plants
// Query Parameters:
//   - id: Get a single plant
//   - moduleId: Get plants associated with a specific ThreeD module (via project_assets)
//   - status: Filter by status
//   - type: Filter by plant type
//   - limit, offset: Pagination
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleId = searchParams.get('moduleId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const plantId = searchParams.get('plantId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get a single plant by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid plant ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedPlants)
        .where(eq(threedPlants.id, parsedId));

      if (!userId) {
        query = query.where(eq(threedPlants.status, 'active'));
      } else {
        query = query.where(
          or(
            eq(threedPlants.userId, userId),
            eq(threedPlants.status, 'active')
          )
        );
      }

      const [plant] = await query.limit(1);

      if (!plant) {
        return NextResponse.json(
          { success: false, error: 'Plant not found' },
          { status: 404 }
        );
      }

      // ✅ Get project asset associations
      const assetAssociations = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.assetType, 'threed_plants'),
            eq(projectAssets.assetId, plant.id),
            eq(projectAssets.userId, userId || '')
          )
        );

      return NextResponse.json({
        success: true,
        data: {
          ...plant,
          projectAssets: assetAssociations,
        },
      });
    }

    // ✅ Get plants for a specific ThreeD module (via project_assets)
    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (isNaN(parsedModuleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid module ID' },
          { status: 400 }
        );
      }

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // ✅ Get plants via project_assets junction
      const results = await db
        .select()
        .from(threedPlants)
        .innerJoin(
          projectAssets,
          and(
            eq(projectAssets.assetId, threedPlants.id),
            eq(projectAssets.assetType, 'threed_plants'),
            eq(projectAssets.moduleId, parsedModuleId),
            eq(projectAssets.moduleType, 'threed'),
            eq(projectAssets.userId, userId)
          )
        )
        .orderBy(desc(threedPlants.createdAt));

      const plants = results.map((row) => ({
        ...row.threedPlants,
        projectAssetConfig: row.projectAssets.config,
        isActiveInProject: row.projectAssets.isActive,
        projectAssetId: row.projectAssets.id,
      }));

      return NextResponse.json({
        success: true,
        data: plants,
        count: plants.length,
      });
    }

    // ✅ List all plants with filters
    let query = db
      .select()
      .from(threedPlants)
      .$dynamic();

    if (!userId) {
      query = query.where(eq(threedPlants.status, 'active'));
    } else {
      query = query.where(
        or(
          eq(threedPlants.userId, userId),
          eq(threedPlants.status, 'active')
        )
      );
    }

    if (status) {
      query = query.where(eq(threedPlants.status, status));
    }
    if (type) {
      query = query.where(eq(threedPlants.type, type));
    }
    if (plantId) {
      query = query.where(eq(threedPlants.plantId, plantId));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedPlants)
      .where(query._where);

    const plants = await query
      .orderBy(desc(threedPlants.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: plants,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Plants API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/plants - Create a new plant
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

    const userId = session.user.id;
    const body = await request.json();

    // ✅ Required fields
    if (!body.commonName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: commonName' },
        { status: 400 }
      );
    }

    // ✅ Generate plantId if not provided
    const plantId = body.plantId || `plant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // ✅ Create the plant (free-standing, no module ID)
    await ensureTableSequence('threed_plants');

    const [newPlant] = await db
      .insert(threedPlants)
      .values({
        userId,
        plantId,
        commonName: body.commonName.trim(),
        scientificName: body.scientificName?.trim() || null,
        variety: body.variety?.trim() || null,
        family: body.family?.trim() || null,
        type: body.type || 'Vegetable',
        status: body.status || 'active',
        modelId: body.modelId || null,
        growthHabit: body.growthHabit || null,
        daysToMaturity: body.daysToMaturity ? parseInt(body.daysToMaturity) : null,
        daysToGermination: body.daysToGermination ? parseInt(body.daysToGermination) : null,
        daysToHarvest: body.daysToHarvest ? parseInt(body.daysToHarvest) : null,
        spacingInches: body.spacingInches ? parseInt(body.spacingInches) : null,
        rowSpacingInches: body.rowSpacingInches ? parseInt(body.rowSpacingInches) : null,
        plantingDepthInches: body.plantingDepthInches ? parseFloat(body.plantingDepthInches) : null,
        sunlight: body.sunlight || 'Full Sun',
        waterNeeds: body.waterNeeds || 'Medium',
        soilType: body.soilType?.trim() || null,
        soilPH: body.soilPH ? parseFloat(body.soilPH) : null,
        hardinessZone: body.hardinessZone || null,
        frostTolerant: body.frostTolerant === 'true' || body.frostTolerant === true,
        perennial: body.perennial === 'true' || body.perennial === true,
        imageUrl: body.imageUrl || null,
        thumbnailUrl: body.thumbnailUrl || null,
        description: body.description || null,
        careInstructions: body.careInstructions || null,
        harvestInstructions: body.harvestInstructions || null,
        companionPlants: body.companionPlants || null,
        avoidPlants: body.avoidPlants || null,
        source: body.source || 'manual',
        rawData: body.rawData || null,
      })
      .returning();

    // ✅ If moduleId is provided, create project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';
      
      // Verify module exists
      const [module] = await db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.id, parsedModuleId),
            eq(threed.userId, userId)
          )
        )
        .limit(1);

      if (module) {
        await ensureTableSequence('project_assets');
        await db.insert(projectAssets).values({
          userId,
          projectId: module.projectId || null,
          moduleId: parsedModuleId,
          moduleType: moduleType,
          assetType: 'threed_plants',
          assetId: newPlant.id,
          config: body.assetConfig || {},
          isActive: true,
        });
        console.log('[Plants API] Created project_assets association for plant:', newPlant.id);
      }
    }

    console.log('[Plants API] Created plant:', newPlant.id, newPlant.commonName);

    return NextResponse.json({
      success: true,
      data: newPlant,
      message: 'Plant created successfully',
    });
  } catch (error) {
    console.error('[Plants API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plant' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/plants - Update a plant
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing plant ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plant ID' },
        { status: 400 }
      );
    }

    // ✅ Check if plant exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parsedId),
          eq(threedPlants.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // ✅ Build update data
    const updateData: any = { updatedAt: new Date() };
    
    // Only update fields that are provided
    if (body.commonName !== undefined) updateData.commonName = body.commonName.trim();
    if (body.scientificName !== undefined) updateData.scientificName = body.scientificName?.trim() || null;
    if (body.variety !== undefined) updateData.variety = body.variety?.trim() || null;
    if (body.family !== undefined) updateData.family = body.family?.trim() || null;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.modelId !== undefined) updateData.modelId = body.modelId;
    if (body.growthHabit !== undefined) updateData.growthHabit = body.growthHabit;
    if (body.daysToMaturity !== undefined) updateData.daysToMaturity = body.daysToMaturity ? parseInt(body.daysToMaturity) : null;
    if (body.daysToGermination !== undefined) updateData.daysToGermination = body.daysToGermination ? parseInt(body.daysToGermination) : null;
    if (body.daysToHarvest !== undefined) updateData.daysToHarvest = body.daysToHarvest ? parseInt(body.daysToHarvest) : null;
    if (body.spacingInches !== undefined) updateData.spacingInches = body.spacingInches ? parseInt(body.spacingInches) : null;
    if (body.rowSpacingInches !== undefined) updateData.rowSpacingInches = body.rowSpacingInches ? parseInt(body.rowSpacingInches) : null;
    if (body.plantingDepthInches !== undefined) updateData.plantingDepthInches = body.plantingDepthInches ? parseFloat(body.plantingDepthInches) : null;
    if (body.sunlight !== undefined) updateData.sunlight = body.sunlight;
    if (body.waterNeeds !== undefined) updateData.waterNeeds = body.waterNeeds;
    if (body.soilType !== undefined) updateData.soilType = body.soilType?.trim() || null;
    if (body.soilPH !== undefined) updateData.soilPH = body.soilPH ? parseFloat(body.soilPH) : null;
    if (body.hardinessZone !== undefined) updateData.hardinessZone = body.hardinessZone;
    if (body.frostTolerant !== undefined) updateData.frostTolerant = body.frostTolerant === 'true' || body.frostTolerant === true;
    if (body.perennial !== undefined) updateData.perennial = body.perennial === 'true' || body.perennial === true;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.careInstructions !== undefined) updateData.careInstructions = body.careInstructions;
    if (body.harvestInstructions !== undefined) updateData.harvestInstructions = body.harvestInstructions;
    if (body.companionPlants !== undefined) updateData.companionPlants = body.companionPlants;
    if (body.avoidPlants !== undefined) updateData.avoidPlants = body.avoidPlants;

    // ✅ Update the plant
    const [updated] = await db
      .update(threedPlants)
      .set(updateData)
      .where(
        and(
          eq(threedPlants.id, parsedId),
          eq(threedPlants.userId, userId)
        )
      )
      .returning();

    // ✅ Handle project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';
      
      // Check if association exists
      const [existingAsset] = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.assetType, 'threed_plants'),
            eq(projectAssets.assetId, parsedId),
            eq(projectAssets.moduleId, parsedModuleId),
            eq(projectAssets.moduleType, moduleType),
            eq(projectAssets.userId, userId)
          )
        )
        .limit(1);

      if (existingAsset) {
        // Update existing association
        await db
          .update(projectAssets)
          .set({
            config: body.assetConfig || existingAsset.config,
            updatedAt: new Date(),
          })
          .where(eq(projectAssets.id, existingAsset.id));
        console.log('[Plants API] Updated project_assets association for plant:', parsedId);
      } else {
        // Create new association
        await ensureTableSequence('project_assets');
        
        // Get the module to find projectId
        const [module] = await db
          .select()
          .from(threed)
          .where(
            and(
              eq(threed.id, parsedModuleId),
              eq(threed.userId, userId)
            )
          )
          .limit(1);

        await db.insert(projectAssets).values({
          userId,
          projectId: module?.projectId || null,
          moduleId: parsedModuleId,
          moduleType: moduleType,
          assetType: 'threed_plants',
          assetId: parsedId,
          config: body.assetConfig || {},
          isActive: true,
        });
        console.log('[Plants API] Created project_assets association for plant:', parsedId);
      }
    }

    console.log('[Plants API] Updated plant:', updated.id, updated.commonName);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Plant updated successfully',
    });
  } catch (error) {
    console.error('[Plants API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plant' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/plants - Delete a plant
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing plant ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plant ID' },
        { status: 400 }
      );
    }

    // ✅ Check if plant exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parsedId),
          eq(threedPlants.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    // ✅ Delete project_assets associations first
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_plants'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the plant
    const [deleted] = await db
      .delete(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parsedId),
          eq(threedPlants.userId, userId)
        )
      )
      .returning();

    console.log('[Plants API] Deleted plant:', deleted.id, deleted.commonName);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Plant deleted successfully',
    });
  } catch (error) {
    console.error('[Plants API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete plant' },
      { status: 500 }
    );
  }
}