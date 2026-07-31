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
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/plantings - List ThreeD Plantings
// Query Parameters:
//   - id (optional): Get a single planting
//   - plantId (optional): Filter by plant
//   - bedId (optional): Filter by bed
//   - status (optional): Filter by planting status
//   - isActive (optional): Filter by active status
//   - search (optional): Search by plantingId or notes
//   - limit (optional): Number of records (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const plantId = searchParams.get('plantId');
    const bedId = searchParams.get('bedId');
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Get a single planting by ID
    if (id) {
      const [planting] = await db
        .select()
        .from(threedPlantings)
        .where(
          and(
            eq(threedPlantings.id, parseInt(id)),
            eq(threedPlantings.userId, userId)
          )
        )
        .limit(1);

      if (!planting) {
        return NextResponse.json(
          { success: false, error: 'Planting not found' },
          { status: 404 }
        );
      }

      // ✅ Fetch related plant and bed info
      const [plant] = planting.plantId ? await db
        .select()
        .from(threedPlants)
        .where(eq(threedPlants.id, planting.plantId))
        .limit(1) : [];

      const [bed] = planting.bedId ? await db
        .select()
        .from(threedBeds)
        .where(eq(threedBeds.id, planting.bedId))
        .limit(1) : [];

      return NextResponse.json({
        success: true,
        data: {
          ...planting,
          plant: plant || null,
          bed: bed || null,
        },
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedPlantings)
      .where(eq(threedPlantings.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (plantId) {
      query = query.where(eq(threedPlantings.plantId, parseInt(plantId)));
    }

    if (bedId) {
      query = query.where(eq(threedPlantings.bedId, parseInt(bedId)));
    }

    if (status) {
      query = query.where(eq(threedPlantings.status, status));
    }

    if (isActive !== null) {
      query = query.where(eq(threedPlantings.isActive, isActive === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedPlantings.plantingId} ILIKE ${`%${search}%`} OR 
            ${threedPlantings.notes} ILIKE ${`%${search}%`}`
      );
    }

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedPlantings)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(threedPlantings.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ Fetch related plant and bed info for each planting
    const plantingsWithRelations = await Promise.all(
      results.map(async (planting) => {
        const [plant] = planting.plantId ? await db
          .select()
          .from(threedPlants)
          .where(eq(threedPlants.id, planting.plantId))
          .limit(1) : [];

        const [bed] = planting.bedId ? await db
          .select()
          .from(threedBeds)
          .where(eq(threedBeds.id, planting.bedId))
          .limit(1) : [];

        return {
          ...planting,
          plant: plant || null,
          bed: bed || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: plantingsWithRelations,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching plantings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plantings' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/plantings - Create ThreeD Planting
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 POST /api/threed/plantings - Request body:', body);

    const {
      plantingId,
      plantId,
      bedId,
      customModelId,
      modelScale,
      modelOffset,
      quantity,
      spacingInches,
      positionX,
      positionY,
      positionZ,
      plantedDate,
      expectedGerminationDate,
      expectedHarvestDate,
      actualHarvestDate,
      isActive,
      status,
      growthStage,
      health,
      notes,
    } = body;

    // ✅ Validate required fields
    if (!plantingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: plantingId' },
        { status: 400 }
      );
    }

    if (!plantId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: plantId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Verify plant exists
    const [plant] = await db
      .select()
      .from(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parseInt(plantId)),
          eq(threedPlants.userId, userId)
        )
      )
      .limit(1);

    if (!plant) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    // ✅ Verify bed exists if provided
    if (bedId) {
      const [bed] = await db
        .select()
        .from(threedBeds)
        .where(
          and(
            eq(threedBeds.id, parseInt(bedId)),
            eq(threedBeds.userId, userId)
          )
        )
        .limit(1);

      if (!bed) {
        return NextResponse.json(
          { success: false, error: 'Bed not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Verify custom model exists if provided
    if (customModelId) {
      const [model] = await db
        .select()
        .from(threedModels)
        .where(
          and(
            eq(threedModels.id, parseInt(customModelId)),
            eq(threedModels.userId, userId)
          )
        )
        .limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Custom model not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Check if plantingId already exists
    const [existing] = await db
      .select()
      .from(threedPlantings)
      .where(
        and(
          eq(threedPlantings.plantingId, plantingId),
          eq(threedPlantings.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Planting ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('threed_plantings');

    const [newPlanting] = await db
      .insert(threedPlantings)
      .values({
        userId,
        plantingId,
        plantId: parseInt(plantId),
        bedId: bedId ? parseInt(bedId) : null,
        customModelId: customModelId ? parseInt(customModelId) : null,
        modelScale: modelScale || '1.0',
        modelOffset: modelOffset || { x: 0, y: 0, z: 0 },
        quantity: quantity || 1,
        spacingInches: spacingInches || null,
        positionX: positionX || null,
        positionY: positionY || null,
        positionZ: positionZ || null,
        plantedDate: plantedDate ? new Date(plantedDate) : null,
        expectedGerminationDate: expectedGerminationDate ? new Date(expectedGerminationDate) : null,
        expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : null,
        actualHarvestDate: actualHarvestDate ? new Date(actualHarvestDate) : null,
        isActive: isActive ?? true,
        status: status || 'planted',
        growthStage: growthStage || 'seed',
        health: health || 'good',
        notes: notes || null,
      })
      .returning();

    console.log('✅ ThreeD planting created:', newPlanting);

    return NextResponse.json({
      success: true,
      data: newPlanting,
      message: 'Planting created successfully',
    });
  } catch (error) {
    console.error('Error creating planting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create planting' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/plantings?id=1 - Full update
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify planting exists and belongs to user
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

    // ✅ Verify plant exists if provided
    if (body.plantId) {
      const [plant] = await db
        .select()
        .from(threedPlants)
        .where(
          and(
            eq(threedPlants.id, parseInt(body.plantId)),
            eq(threedPlants.userId, userId)
          )
        )
        .limit(1);

      if (!plant) {
        return NextResponse.json(
          { success: false, error: 'Plant not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Verify bed exists if provided
    if (body.bedId) {
      const [bed] = await db
        .select()
        .from(threedBeds)
        .where(
          and(
            eq(threedBeds.id, parseInt(body.bedId)),
            eq(threedBeds.userId, userId)
          )
        )
        .limit(1);

      if (!bed) {
        return NextResponse.json(
          { success: false, error: 'Bed not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Handle date fields
    const updateData: any = { ...body, updatedAt: new Date() };
    if (body.plantedDate) updateData.plantedDate = new Date(body.plantedDate);
    if (body.expectedGerminationDate) updateData.expectedGerminationDate = new Date(body.expectedGerminationDate);
    if (body.expectedHarvestDate) updateData.expectedHarvestDate = new Date(body.expectedHarvestDate);
    if (body.actualHarvestDate) updateData.actualHarvestDate = new Date(body.actualHarvestDate);

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

    console.log('✅ ThreeD planting updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Planting updated successfully',
    });
  } catch (error) {
    console.error('Error updating planting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update planting' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/plantings?id=1 - Partial update
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify planting exists and belongs to user
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

    // ✅ Handle date fields
    const updateData: any = { ...body, updatedAt: new Date() };
    if (body.plantedDate) updateData.plantedDate = new Date(body.plantedDate);
    if (body.expectedGerminationDate) updateData.expectedGerminationDate = new Date(body.expectedGerminationDate);
    if (body.expectedHarvestDate) updateData.expectedHarvestDate = new Date(body.expectedHarvestDate);
    if (body.actualHarvestDate) updateData.actualHarvestDate = new Date(body.actualHarvestDate);

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

    console.log('✅ ThreeD planting patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Planting updated successfully',
    });
  } catch (error) {
    console.error('Error updating planting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update planting' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/plantings?id=1 - Delete planting
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(threedPlantings)
      .where(
        and(
          eq(threedPlantings.id, parsedId),
          eq(threedPlantings.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Planting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Planting deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting planting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete planting' },
      { status: 500 }
    );
  }
}