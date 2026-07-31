// app/api/threed/plants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedPlants,
  threedModels,
} from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/plants - List ThreeD Plants
// Query Parameters:
//   - id (optional): Get a single plant
//   - type (optional): Filter by plant type
//   - status (optional): Filter by plant status
//   - isActive (optional): Filter by active status
//   - search (optional): Search by commonName, scientificName, or plantId
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Get a single plant by ID
    if (id) {
      const [plant] = await db
        .select()
        .from(threedPlants)
        .where(
          and(
            eq(threedPlants.id, parseInt(id)),
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

      // ✅ Fetch related model info if available
      const [model] = plant.modelId ? await db
        .select()
        .from(threedModels)
        .where(eq(threedModels.id, plant.modelId))
        .limit(1) : [];

      return NextResponse.json({
        success: true,
        data: {
          ...plant,
          model: model || null,
        },
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedPlants)
      .where(eq(threedPlants.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (type) {
      query = query.where(eq(threedPlants.type, type));
    }

    if (status) {
      query = query.where(eq(threedPlants.status, status));
    }

    if (isActive !== null) {
      query = query.where(eq(threedPlants.isActive, isActive === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedPlants.commonName} ILIKE ${`%${search}%`} OR 
            ${threedPlants.scientificName} ILIKE ${`%${search}%`} OR
            ${threedPlants.plantId} ILIKE ${`%${search}%`}`
      );
    }

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedPlants)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(threedPlants.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ Fetch related model info for each plant
    const plantsWithModels = await Promise.all(
      results.map(async (plant) => {
        const [model] = plant.modelId ? await db
          .select()
          .from(threedModels)
          .where(eq(threedModels.id, plant.modelId))
          .limit(1) : [];

        return {
          ...plant,
          model: model || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: plantsWithModels,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/plants - Create ThreeD Plant
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 POST /api/threed/plants - Request body:', body);

    const {
      plantId,
      commonName,
      scientificName,
      variety,
      family,
      type,
      isActive,
      status,
      modelId,
      growthHabit,
      daysToMaturity,
      daysToGermination,
      daysToHarvest,
      spacingInches,
      rowSpacingInches,
      plantingDepthInches,
      sunlight,
      waterNeeds,
      soilType,
      soilPH,
      hardinessZone,
      frostTolerant,
      perennial,
      imageUrl,
      thumbnailUrl,
      description,
      careInstructions,
      harvestInstructions,
      companionPlants,
      avoidPlants,
      source,
      rawData,
    } = body;

    // ✅ Validate required fields
    if (!plantId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: plantId' },
        { status: 400 }
      );
    }

    if (!commonName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: commonName' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Verify model exists if provided
    if (modelId) {
      const [model] = await db
        .select()
        .from(threedModels)
        .where(
          and(
            eq(threedModels.id, parseInt(modelId)),
            eq(threedModels.userId, userId)
          )
        )
        .limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Check if plantId already exists
    const [existing] = await db
      .select()
      .from(threedPlants)
      .where(
        and(
          eq(threedPlants.plantId, plantId),
          eq(threedPlants.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Plant ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('threed_plants');

    const [newPlant] = await db
      .insert(threedPlants)
      .values({
        userId,
        plantId,
        commonName,
        scientificName: scientificName || null,
        variety: variety || null,
        family: family || null,
        type: type || 'Vegetable',
        isActive: isActive ?? true,
        status: status || 'active',
        modelId: modelId || null,
        growthHabit: growthHabit || null,
        daysToMaturity: daysToMaturity || null,
        daysToGermination: daysToGermination || null,
        daysToHarvest: daysToHarvest || null,
        spacingInches: spacingInches || null,
        rowSpacingInches: rowSpacingInches || null,
        plantingDepthInches: plantingDepthInches || null,
        sunlight: sunlight || 'Full Sun',
        waterNeeds: waterNeeds || 'Medium',
        soilType: soilType || null,
        soilPH: soilPH || null,
        hardinessZone: hardinessZone || null,
        frostTolerant: frostTolerant ?? false,
        perennial: perennial ?? false,
        imageUrl: imageUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        description: description || null,
        careInstructions: careInstructions || null,
        harvestInstructions: harvestInstructions || null,
        companionPlants: companionPlants || null,
        avoidPlants: avoidPlants || null,
        source: source || null,
        rawData: rawData || null,
      })
      .returning();

    console.log('✅ ThreeD plant created:', newPlant);

    return NextResponse.json({
      success: true,
      data: newPlant,
      message: 'Plant created successfully',
    });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plant' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/plants?id=1 - Full update
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

    // ✅ Verify plant exists and belongs to user
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

    // ✅ Verify model exists if provided
    if (body.modelId) {
      const [model] = await db
        .select()
        .from(threedModels)
        .where(
          and(
            eq(threedModels.id, parseInt(body.modelId)),
            eq(threedModels.userId, userId)
          )
        )
        .limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }
    }

    const [updated] = await db
      .update(threedPlants)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedPlants.id, parsedId),
          eq(threedPlants.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD plant updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Plant updated successfully',
    });
  } catch (error) {
    console.error('Error updating plant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plant' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/plants?id=1 - Partial update
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

    // ✅ Verify plant exists and belongs to user
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

    // ✅ Verify model exists if provided
    if (body.modelId) {
      const [model] = await db
        .select()
        .from(threedModels)
        .where(
          and(
            eq(threedModels.id, parseInt(body.modelId)),
            eq(threedModels.userId, userId)
          )
        )
        .limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }
    }

    const [updated] = await db
      .update(threedPlants)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedPlants.id, parsedId),
          eq(threedPlants.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD plant patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Plant updated successfully',
    });
  } catch (error) {
    console.error('Error updating plant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plant' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/plants?id=1 - Delete plant
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
      .delete(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parsedId),
          eq(threedPlants.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Plant deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete plant' },
      { status: 500 }
    );
  }
}