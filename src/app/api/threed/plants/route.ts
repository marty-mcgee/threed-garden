// app/api/threed/plants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedPlants } from '@/lib/schema/threed';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/plants - List all plants (PUBLIC)
// GET /api/threed/plants?id=1 - Get a single plant
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const plantId = searchParams.get('plantId');

    // Get single plant
    if (id) {
      let query = db
        .select()
        .from(threedPlants)
        .where(eq(threedPlants.id, parseInt(id)));

      // Public users only see active plants
      if (!userId) {
        query = query.where(eq(threedPlants.status, 'active'));
      }

      const [plant] = await query.limit(1);

      if (!plant) {
        return NextResponse.json(
          { success: false, error: 'Plant not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: plant });
    }

    // List all plants
    let query = db
      .select()
      .from(threedPlants)
      .$dynamic();

    // Public users only see active plants
    if (!userId) {
      query = query.where(eq(threedPlants.status, 'active'));
    } else {
      // Authenticated users see their plants + active public plants
      query = query.where(
        or(
          eq(threedPlants.userId, userId),
          eq(threedPlants.status, 'active')
        )
      );
    }

    // Apply filters
    if (status) {
      query = query.where(eq(threedPlants.status, status));
    }
    if (type) {
      query = query.where(eq(threedPlants.type, type));
    }
    if (plantId) {
      query = query.where(eq(threedPlants.plantId, plantId));
    }

    // Get total count
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
    console.error('ThreeD plants API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/plants - Create a new plant (ADMIN ONLY)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // ✅ Auto-generate plantId if not provided
    const plantId = body.plantId || `plant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // ✅ Check for required fields
    if (!body.commonName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: commonName' },
        { status: 400 }
      );
    }

    // ✅ Ensure sequence is in sync
    await ensureTableSequence('threed_plants');

    // ✅ Build insert data with all fields
    const insertData = {
      userId: session.user.id,
      plantId,
      commonName: body.commonName,
      scientificName: body.scientificName || null,
      variety: body.variety || null,
      family: body.family || null,
      type: body.type || 'Vegetable',
      status: body.status || 'active',
      
      // Model relationship
      modelId: body.modelId || null,
      
      // Growth parameters
      growthHabit: body.growthHabit || null,
      daysToMaturity: body.daysToMaturity ? parseInt(body.daysToMaturity) : null,
      daysToGermination: body.daysToGermination ? parseInt(body.daysToGermination) : null,
      daysToHarvest: body.daysToHarvest ? parseInt(body.daysToHarvest) : null,
      
      // Spacing
      spacingInches: body.spacingInches ? parseInt(body.spacingInches) : null,
      rowSpacingInches: body.rowSpacingInches ? parseInt(body.rowSpacingInches) : null,
      plantingDepthInches: body.plantingDepthInches ? parseFloat(body.plantingDepthInches) : null,
      
      // Environmental
      sunlight: body.sunlight || 'Full Sun',
      waterNeeds: body.waterNeeds || 'Medium',
      soilType: body.soilType || null,
      soilPH: body.soilPH ? parseFloat(body.soilPH) : null,
      hardinessZone: body.hardinessZone || null,
      frostTolerant: body.frostTolerant === 'true' || body.frostTolerant === true,
      perennial: body.perennial === 'true' || body.perennial === true,
      
      // Media
      imageUrl: body.imageUrl || null,
      thumbnailUrl: body.thumbnailUrl || null,
      description: body.description || null,
      careInstructions: body.careInstructions || null,
      harvestInstructions: body.harvestInstructions || null,
      
      // Companion planting
      companionPlants: body.companionPlants || null,
      avoidPlants: body.avoidPlants || null,
      
      // Metadata
      source: body.source || 'manual',
      rawData: body.rawData || null,
    };

    const [newPlant] = await db
      .insert(threedPlants)
      .values(insertData)
      .returning();

    return NextResponse.json({ success: true, data: newPlant });
  } catch (error) {
    console.error('ThreeD plants API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plant' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/plants?id=1 - Full update (ADMIN ONLY)
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
        { success: false, error: 'Missing plant ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parseInt(id)),
          eq(threedPlants.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = { updatedAt: new Date() };
    
    // Only update fields that are provided
    if (body.commonName !== undefined) updateData.commonName = body.commonName;
    if (body.scientificName !== undefined) updateData.scientificName = body.scientificName;
    if (body.variety !== undefined) updateData.variety = body.variety;
    if (body.family !== undefined) updateData.family = body.family;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.modelId !== undefined) updateData.modelId = body.modelId;
    
    // Growth parameters
    if (body.growthHabit !== undefined) updateData.growthHabit = body.growthHabit;
    if (body.daysToMaturity !== undefined) updateData.daysToMaturity = body.daysToMaturity ? parseInt(body.daysToMaturity) : null;
    if (body.daysToGermination !== undefined) updateData.daysToGermination = body.daysToGermination ? parseInt(body.daysToGermination) : null;
    if (body.daysToHarvest !== undefined) updateData.daysToHarvest = body.daysToHarvest ? parseInt(body.daysToHarvest) : null;
    
    // Spacing
    if (body.spacingInches !== undefined) updateData.spacingInches = body.spacingInches ? parseInt(body.spacingInches) : null;
    if (body.rowSpacingInches !== undefined) updateData.rowSpacingInches = body.rowSpacingInches ? parseInt(body.rowSpacingInches) : null;
    if (body.plantingDepthInches !== undefined) updateData.plantingDepthInches = body.plantingDepthInches ? parseFloat(body.plantingDepthInches) : null;
    
    // Environmental
    if (body.sunlight !== undefined) updateData.sunlight = body.sunlight;
    if (body.waterNeeds !== undefined) updateData.waterNeeds = body.waterNeeds;
    if (body.soilType !== undefined) updateData.soilType = body.soilType;
    if (body.soilPH !== undefined) updateData.soilPH = body.soilPH ? parseFloat(body.soilPH) : null;
    if (body.hardinessZone !== undefined) updateData.hardinessZone = body.hardinessZone;
    if (body.frostTolerant !== undefined) updateData.frostTolerant = body.frostTolerant === 'true' || body.frostTolerant === true;
    if (body.perennial !== undefined) updateData.perennial = body.perennial === 'true' || body.perennial === true;
    
    // Media
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.careInstructions !== undefined) updateData.careInstructions = body.careInstructions;
    if (body.harvestInstructions !== undefined) updateData.harvestInstructions = body.harvestInstructions;
    
    // Companion planting
    if (body.companionPlants !== undefined) updateData.companionPlants = body.companionPlants;
    if (body.avoidPlants !== undefined) updateData.avoidPlants = body.avoidPlants;

    const [updated] = await db
      .update(threedPlants)
      .set(updateData)
      .where(
        and(
          eq(threedPlants.id, parseInt(id)),
          eq(threedPlants.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('ThreeD plants API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plant' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/plants?id=1 - Delete a plant (ADMIN ONLY)
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing plant ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parseInt(id)),
          eq(threedPlants.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(threedPlants)
      .where(
        and(
          eq(threedPlants.id, parseInt(id)),
          eq(threedPlants.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('ThreeD plants API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete plant' },
      { status: 500 }
    );
  }
}