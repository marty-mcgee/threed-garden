// app/api/threed/plantings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedPlantings, 
  threedPlants, 
  threedBeds, 
  threedModels,
} from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/plantings
// Query Parameters:
//   - id: Get a single planting
//   - moduleId: Get plantings for a specific ThreeD module (via project_assets)
//   - status: Filter by status
//   - growthStage: Filter by growth stage
//   - plantId: Filter by plant
//   - bedId: Filter by bed
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
    const growthStage = searchParams.get('growthStage');
    const plantId = searchParams.get('plantId');
    const bedId = searchParams.get('bedId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get a single planting by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid planting ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedPlantings)
        .where(eq(threedPlantings.id, parsedId));

      if (!userId) {
        // Public access: only show planted/growing/harvesting
        query = query.where(
          sql`${threedPlantings.status} IN ('planted', 'growing', 'harvesting')`
        );
      } else {
        query = query.where(
          or(
            eq(threedPlantings.userId, userId),
            sql`${threedPlantings.status} IN ('planted', 'growing', 'harvesting')`
          )
        );
      }

      const [planting] = await query.limit(1);

      if (!planting) {
        return NextResponse.json(
          { success: false, error: 'Planting not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: planting,
      });
    }

    // ✅ Build query for listing plantings
    let query = db
      .select()
      .from(threedPlantings)
      .$dynamic();

    if (!userId) {
      query = query.where(
        sql`${threedPlantings.status} IN ('planted', 'growing', 'harvesting')`
      );
    } else {
      query = query.where(
        or(
          eq(threedPlantings.userId, userId),
          sql`${threedPlantings.status} IN ('planted', 'growing', 'harvesting')`
        )
      );
    }

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(threedPlantings.status, status));
    }
    if (growthStage) {
      query = query.where(eq(threedPlantings.growthStage, growthStage));
    }
    if (plantId) {
      query = query.where(eq(threedPlantings.plantId, parseInt(plantId)));
    }
    if (bedId) {
      query = query.where(eq(threedPlantings.bedId, parseInt(bedId)));
    }

    // ✅ Filter by moduleId via project_assets
    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (!isNaN(parsedModuleId)) {
        const assetLinks = await db
          .select({ assetId: projectAssets.assetId })
          .from(projectAssets)
          .where(
            and(
              eq(projectAssets.moduleId, parsedModuleId),
              eq(projectAssets.moduleType, 'threed'),
              eq(projectAssets.assetType, 'threed_plantings'),
              eq(projectAssets.userId, userId || '')
            )
          );

        const plantingIds = assetLinks.map((link) => link.assetId);
        if (plantingIds.length > 0) {
          query = query.where(sql`${threedPlantings.id} IN (${sql.join(plantingIds)})`);
        } else {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { limit, offset, total: 0 },
          });
        }
      }
    }

    // ✅ Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedPlantings)
      .where(query._where);

    const plantings = await query
      .orderBy(desc(threedPlantings.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: plantings,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Plantings API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plantings' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/plantings - Create a new planting
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

    console.log('[Plantings API] POST - Received body:', body);

    if (!body.plantId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: plantId' },
        { status: 400 }
      );
    }

    if (!body.bedId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: bedId' },
        { status: 400 }
      );
    }

    // ✅ Generate plantingId
    const plantingId = body.plantingId || `planting_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await ensureTableSequence('threed_plantings');

    // ✅ Build values object
    const values: any = {
      userId,
      plantingId,
      plantId: parseInt(body.plantId),
      bedId: parseInt(body.bedId),
      customModelId: body.customModelId ? parseInt(body.customModelId) : null,
      modelScale: body.modelScale ? parseFloat(body.modelScale) : 1.0,
      modelOffset: body.modelOffset || { x: 0, y: 0, z: 0 },
      quantity: body.quantity ? parseInt(body.quantity) : 1,
      spacingInches: body.spacingInches ? parseInt(body.spacingInches) : null,
      positionX: body.positionX ? parseFloat(body.positionX) : 0,
      positionY: body.positionY ? parseFloat(body.positionY) : 0,
      positionZ: body.positionZ ? parseFloat(body.positionZ) : 0,
      plantedDate: body.plantedDate || null,
      expectedGerminationDate: body.expectedGerminationDate || null,
      expectedHarvestDate: body.expectedHarvestDate || null,
      actualHarvestDate: body.actualHarvestDate || null,
      status: body.status || 'planted',
      growthStage: body.growthStage || 'seed',
      health: body.health || 'good',
      notes: body.notes || null,
    };

    console.log('[Plantings API] Inserting values:', values);

    const [newPlanting] = await db
      .insert(threedPlantings)
      .values(values)
      .returning();

    // ✅ If moduleId is provided, create project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      if (!isNaN(parsedModuleId)) {
        await ensureTableSequence('project_assets');
        await db.insert(projectAssets).values({
          userId,
          projectId: null,
          moduleId: parsedModuleId,
          moduleType: 'threed',
          assetType: 'threed_plantings',
          assetId: newPlanting.id,
          config: {},
          isActive: true,
        });
        console.log('[Plantings API] Created project_assets association for planting:', newPlanting.id);
      }
    }

    console.log('[Plantings API] Created planting:', newPlanting.id, newPlanting.plantingId);

    return NextResponse.json({
      success: true,
      data: newPlanting,
      message: 'Planting created successfully',
    });
  } catch (error) {
    console.error('[Plantings API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create planting', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/plantings - Update a planting
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
        { success: false, error: 'Missing planting ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid planting ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedPlantings)
      .where(
        and(
          eq(threedPlantings.id, parsedId),
          eq(threedPlantings.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Planting not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('[Plantings API] PUT - Updating planting:', parsedId, body);

    // ✅ Build updateData - start empty, only add what's provided
    const updateData: any = {};

    if (body.plantId !== undefined) {
      updateData.plantId = body.plantId ? parseInt(body.plantId) : null;
    }
    if (body.bedId !== undefined) {
      updateData.bedId = body.bedId ? parseInt(body.bedId) : null;
    }
    if (body.customModelId !== undefined) {
      updateData.customModelId = body.customModelId ? parseInt(body.customModelId) : null;
    }
    if (body.modelScale !== undefined) {
      updateData.modelScale = body.modelScale ? parseFloat(body.modelScale) : 1.0;
    }
    if (body.modelOffset !== undefined) {
      updateData.modelOffset = body.modelOffset || { x: 0, y: 0, z: 0 };
    }
    if (body.quantity !== undefined) {
      updateData.quantity = body.quantity ? parseInt(body.quantity) : 1;
    }
    if (body.spacingInches !== undefined) {
      updateData.spacingInches = body.spacingInches ? parseInt(body.spacingInches) : null;
    }
    if (body.positionX !== undefined) {
      updateData.positionX = body.positionX ? parseFloat(body.positionX) : 0;
    }
    if (body.positionY !== undefined) {
      updateData.positionY = body.positionY ? parseFloat(body.positionY) : 0;
    }
    if (body.positionZ !== undefined) {
      updateData.positionZ = body.positionZ ? parseFloat(body.positionZ) : 0;
    }
    if (body.plantedDate !== undefined) {
      updateData.plantedDate = body.plantedDate || null;
    }
    if (body.expectedGerminationDate !== undefined) {
      updateData.expectedGerminationDate = body.expectedGerminationDate || null;
    }
    if (body.expectedHarvestDate !== undefined) {
      updateData.expectedHarvestDate = body.expectedHarvestDate || null;
    }
    if (body.actualHarvestDate !== undefined) {
      updateData.actualHarvestDate = body.actualHarvestDate || null;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.growthStage !== undefined) {
      updateData.growthStage = body.growthStage;
    }
    if (body.health !== undefined) {
      updateData.health = body.health || 'good';
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    // ✅ updatedAt is handled by the database ($onUpdateFn)
    // No need to set it here

    console.log('[Plantings API] Updating with values:', updateData);

    const [updated] = await db
      .update(threedPlantings)
      .set(updateData)
      .where(
        and(
          eq(threedPlantings.id, parsedId),
          eq(threedPlantings.userId, userId)
        )
      )
      .returning();

    console.log('[Plantings API] Updated planting:', updated.id, updated.plantingId);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Planting updated successfully',
    });
  } catch (error) {
    console.error('[Plantings API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update planting', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/plantings - Delete a planting
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
        { success: false, error: 'Missing planting ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid planting ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedPlantings)
      .where(
        and(
          eq(threedPlantings.id, parsedId),
          eq(threedPlantings.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Planting not found' },
        { status: 404 }
      );
    }

    // ✅ Delete project_assets associations
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_plantings'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the planting
    const [deleted] = await db
      .delete(threedPlantings)
      .where(
        and(
          eq(threedPlantings.id, parsedId),
          eq(threedPlantings.userId, userId)
        )
      )
      .returning();

    console.log('[Plantings API] Deleted planting:', deleted.id, deleted.plantingId);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Planting deleted successfully',
    });
  } catch (error) {
    console.error('[Plantings API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete planting' },
      { status: 500 }
    );
  }
}