// app/api/threed/plants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedPlants, threed } from '@/lib/schema/threed';
import { eq, desc, and, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/plants?threedId=1 - List all plants for a ThreeD module
// GET /api/threed/plants?id=1 - Get a single plant
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const threedId = searchParams.get('threedId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get single plant
    if (id) {
      const [plant] = await db
        .select()
        .from(threedPlants)
        .where(
          and(
            eq(threedPlants.id, parseInt(id)),
            eq(threedPlants.userId, session.user.id)
          )
        )
        .limit(1);

      if (!plant) {
        return NextResponse.json(
          { success: false, error: 'Plant not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: plant });
    }

    // ✅ List all plants for a threed module
    if (!threedId) {
      return NextResponse.json(
        { success: false, error: 'Missing threedId parameter' },
        { status: 400 }
      );
    }

    // Verify the threed module belongs to the user
    const [module] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, parseInt(threedId)),
          eq(threed.userId, session.user.id)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    let query = db
      .select()
      .from(threedPlants)
      .where(eq(threedPlants.threedId, parseInt(threedId)));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedPlants)
      .where(eq(threedPlants.threedId, parseInt(threedId)));

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
// POST /api/threed/plants - Create a new plant
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { threedId, commonName, scientificName, type, ...rest } = body;

    if (!threedId || !commonName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: threedId, commonName' },
        { status: 400 }
      );
    }

    // Verify the threed module belongs to the user
    const [module] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, parseInt(threedId)),
          eq(threed.userId, session.user.id)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    // ✅ Ensure sequence is in sync
    await ensureTableSequence('threed_plants');

    const [newPlant] = await db
      .insert(threedPlants)
      .values({
        threedId: parseInt(threedId),
        userId: session.user.id,
        commonName,
        scientificName: scientificName || '',
        type: type || 'Vegetable',
        ...rest,
      })
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
// PUT /api/threed/plants?id=1 - Full update of a plant
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
    const { commonName, scientificName, type, ...rest } = body;

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

    const [updated] = await db
      .update(threedPlants)
      .set({
        commonName: commonName || existing.commonName,
        scientificName: scientificName !== undefined ? scientificName : existing.scientificName,
        type: type || existing.type,
        ...rest,
        updatedAt: new Date(),
      })
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
// PATCH /api/threed/plants?id=1 - Partial update of a plant
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
        { success: false, error: 'Missing plant ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { commonName, scientificName, type, ...rest } = body;

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

    const updateData: any = { updatedAt: new Date() };
    if (commonName !== undefined) updateData.commonName = commonName;
    if (scientificName !== undefined) updateData.scientificName = scientificName;
    if (type !== undefined) updateData.type = type;
    // Add other fields as needed
    Object.keys(rest).forEach(key => {
      updateData[key] = rest[key];
    });

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
// DELETE /api/threed/plants?id=1 - Delete a plant
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