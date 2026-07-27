// app/api/threed/harvests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedHarvests, 
  threedPlantings, 
  threedPlants,
} from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/harvests
// Query Parameters:
//   - id: Get a single harvest
//   - moduleId: Get harvests for a specific ThreeD module (via project_assets)
//   - plantId: Filter by plant
//   - plantingId: Filter by planting
//   - limit, offset: Pagination
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleId = searchParams.get('moduleId');
    const plantId = searchParams.get('plantId');
    const plantingId = searchParams.get('plantingId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get a single harvest by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid harvest ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedHarvests)
        .where(eq(threedHarvests.id, parsedId));

      if (!userId) {
        // Public access: only show public harvests
        query = query.where(eq(threedHarvests.userId, userId || ''));
      } else {
        query = query.where(
          or(
            eq(threedHarvests.userId, userId),
            eq(threedHarvests.userId, userId || '')
          )
        );
      }

      const [harvest] = await query.limit(1);

      if (!harvest) {
        return NextResponse.json(
          { success: false, error: 'Harvest not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: harvest,
      });
    }

    // ✅ Build query for listing harvests
    let query = db
      .select()
      .from(threedHarvests)
      .$dynamic();

    if (!userId) {
      query = query.where(eq(threedHarvests.userId, userId || ''));
    } else {
      query = query.where(
        or(
          eq(threedHarvests.userId, userId),
          eq(threedHarvests.userId, userId || '')
        )
      );
    }

    // ✅ Apply filters
    if (plantId) {
      query = query.where(eq(threedHarvests.plantId, parseInt(plantId)));
    }
    if (plantingId) {
      query = query.where(eq(threedHarvests.plantingId, parseInt(plantingId)));
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
              eq(projectAssets.assetType, 'threed_harvests'),
              eq(projectAssets.userId, userId || '')
            )
          );

        const harvestIds = assetLinks.map((link) => link.assetId);
        if (harvestIds.length > 0) {
          query = query.where(sql`${threedHarvests.id} IN (${sql.join(harvestIds)})`);
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
      .from(threedHarvests)
      .where(query._where);

    const harvests = await query
      .orderBy(desc(threedHarvests.harvestDate), desc(threedHarvests.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: harvests,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Harvests API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch harvests' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/harvests - Create a new harvest
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

    console.log('[Harvests API] POST - Received body:', body);

    if (!body.plantId && !body.plantingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: plantId or plantingId' },
        { status: 400 }
      );
    }

    // ✅ Generate harvestId
    const harvestId = body.harvestId || `harvest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await ensureTableSequence('threed_harvests');

    // ✅ Build values object
    const values: any = {
      userId,
      harvestId,
      plantingId: body.plantingId ? parseInt(body.plantingId) : null,
      plantId: body.plantId ? parseInt(body.plantId) : null,
      quantity: body.quantity ? parseFloat(body.quantity) : null,
      unit: body.unit || 'lbs',
      weightLbs: body.weightLbs ? parseFloat(body.weightLbs) : null,
      harvestDate: body.harvestDate || new Date().toISOString().split('T')[0],
      notes: body.notes || null,
      imageUrl: body.imageUrl || null,
    };

    console.log('[Harvests API] Inserting values:', values);

    const [newHarvest] = await db
      .insert(threedHarvests)
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
          assetType: 'threed_harvests',
          assetId: newHarvest.id,
          config: {},
          isActive: true,
        });
        console.log('[Harvests API] Created project_assets association for harvest:', newHarvest.id);
      }
    }

    console.log('[Harvests API] Created harvest:', newHarvest.id, newHarvest.harvestId);

    return NextResponse.json({
      success: true,
      data: newHarvest,
      message: 'Harvest created successfully',
    });
  } catch (error) {
    console.error('[Harvests API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create harvest', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/harvests - Update a harvest
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
        { success: false, error: 'Missing harvest ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid harvest ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedHarvests)
      .where(
        and(
          eq(threedHarvests.id, parsedId),
          eq(threedHarvests.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Harvest not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('[Harvests API] PUT - Updating harvest:', parsedId, body);

    // ✅ Build updateData - start empty, only add what's provided
    const updateData: any = {};

    if (body.plantingId !== undefined) {
      updateData.plantingId = body.plantingId ? parseInt(body.plantingId) : null;
    }
    if (body.plantId !== undefined) {
      updateData.plantId = body.plantId ? parseInt(body.plantId) : null;
    }
    if (body.quantity !== undefined) {
      updateData.quantity = body.quantity ? parseFloat(body.quantity) : null;
    }
    if (body.unit !== undefined) {
      updateData.unit = body.unit || 'lbs';
    }
    if (body.weightLbs !== undefined) {
      updateData.weightLbs = body.weightLbs ? parseFloat(body.weightLbs) : null;
    }
    if (body.harvestDate !== undefined) {
      updateData.harvestDate = body.harvestDate || null;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }
    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl || null;
    }

    // ✅ updatedAt is handled by the database ($onUpdateFn)
    // No need to set it here

    console.log('[Harvests API] Updating with values:', updateData);

    const [updated] = await db
      .update(threedHarvests)
      .set(updateData)
      .where(
        and(
          eq(threedHarvests.id, parsedId),
          eq(threedHarvests.userId, userId)
        )
      )
      .returning();

    console.log('[Harvests API] Updated harvest:', updated.id, updated.harvestId);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Harvest updated successfully',
    });
  } catch (error) {
    console.error('[Harvests API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update harvest', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/harvests - Delete a harvest
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
        { success: false, error: 'Missing harvest ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid harvest ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedHarvests)
      .where(
        and(
          eq(threedHarvests.id, parsedId),
          eq(threedHarvests.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Harvest not found' },
        { status: 404 }
      );
    }

    // ✅ Delete project_assets associations
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_harvests'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the harvest
    const [deleted] = await db
      .delete(threedHarvests)
      .where(
        and(
          eq(threedHarvests.id, parsedId),
          eq(threedHarvests.userId, userId)
        )
      )
      .returning();

    console.log('[Harvests API] Deleted harvest:', deleted.id, deleted.harvestId);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Harvest deleted successfully',
    });
  } catch (error) {
    console.error('[Harvests API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete harvest' },
      { status: 500 }
    );
  }
}