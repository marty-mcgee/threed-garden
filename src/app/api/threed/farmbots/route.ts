// app/api/threed/farmbots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedFarmbots,
  threedBeds,
} from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/farmbots - List ThreeD FarmBots
// Query Parameters:
//   - id (optional): Get a single farmbot
//   - status (optional): Filter by farmbot status
//   - isActive (optional): Filter by active status
//   - search (optional): Search by name, deviceId, or notes
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
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Get a single farmbot by ID
    if (id) {
      const [farmbot] = await db
        .select()
        .from(threedFarmbots)
        .where(
          and(
            eq(threedFarmbots.id, parseInt(id)),
            eq(threedFarmbots.userId, userId)
          )
        )
        .limit(1);

      if (!farmbot) {
        return NextResponse.json(
          { success: false, error: 'FarmBot not found' },
          { status: 404 }
        );
      }

      // ✅ Fetch related bed info if available
      const [bed] = farmbot.bedId ? await db
        .select()
        .from(threedBeds)
        .where(eq(threedBeds.id, farmbot.bedId))
        .limit(1) : [];

      return NextResponse.json({
        success: true,
        data: {
          ...farmbot,
          bed: bed || null,
        },
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedFarmbots)
      .where(eq(threedFarmbots.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(threedFarmbots.status, status));
    }

    if (isActive !== null) {
      query = query.where(eq(threedFarmbots.isActive, isActive === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedFarmbots.name} ILIKE ${`%${search}%`} OR 
            ${threedFarmbots.deviceId} ILIKE ${`%${search}%`} OR
            ${threedFarmbots.notes} ILIKE ${`%${search}%`}`
      );
    }

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedFarmbots)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(threedFarmbots.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ Fetch related bed info for each farmbot
    const farmbotsWithBeds = await Promise.all(
      results.map(async (farmbot) => {
        const [bed] = farmbot.bedId ? await db
          .select()
          .from(threedBeds)
          .where(eq(threedBeds.id, farmbot.bedId))
          .limit(1) : [];

        return {
          ...farmbot,
          bed: bed || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: farmbotsWithBeds,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching farmbots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch farmbots' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/farmbots - Create ThreeD FarmBot
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 POST /api/threed/farmbots - Request body:', body);

    const {
      deviceId,
      name,
      isActive,
      status,
      bedId,
      positionX,
      positionY,
      positionZ,
      apiToken,
      apiUrl,
      lastSeen,
      batteryLevel,
      firmwareVersion,
      notes,
    } = body;

    // ✅ Validate required fields
    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: deviceId' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

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

    // ✅ Check if deviceId already exists
    const [existing] = await db
      .select()
      .from(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.deviceId, deviceId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Device ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('threed_farmbots');

    const [newFarmbot] = await db
      .insert(threedFarmbots)
      .values({
        userId,
        deviceId,
        name,
        isActive: isActive ?? true,
        status: status || 'offline',
        bedId: bedId || null,
        positionX: positionX || null,
        positionY: positionY || null,
        positionZ: positionZ || null,
        apiToken: apiToken || null,
        apiUrl: apiUrl || null,
        lastSeen: lastSeen ? new Date(lastSeen) : null,
        batteryLevel: batteryLevel || null,
        firmwareVersion: firmwareVersion || null,
        notes: notes || null,
      })
      .returning();

    console.log('✅ ThreeD FarmBot created:', newFarmbot);

    return NextResponse.json({
      success: true,
      data: newFarmbot,
      message: 'FarmBot created successfully',
    });
  } catch (error) {
    console.error('Error creating farmbot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create farmbot' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/farmbots?id=1 - Full update
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

    // ✅ Verify farmbot exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'FarmBot not found' },
        { status: 404 }
      );
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
    if (body.lastSeen) updateData.lastSeen = new Date(body.lastSeen);

    const [updated] = await db
      .update(threedFarmbots)
      .set(updateData)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD FarmBot updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'FarmBot updated successfully',
    });
  } catch (error) {
    console.error('Error updating farmbot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update farmbot' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/farmbots?id=1 - Partial update
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

    // ✅ Verify farmbot exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'FarmBot not found' },
        { status: 404 }
      );
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
    if (body.lastSeen) updateData.lastSeen = new Date(body.lastSeen);

    const [updated] = await db
      .update(threedFarmbots)
      .set(updateData)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD FarmBot patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'FarmBot updated successfully',
    });
  } catch (error) {
    console.error('Error updating farmbot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update farmbot' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/farmbots?id=1 - Delete farmbot
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
      .delete(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'FarmBot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'FarmBot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting farmbot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete farmbot' },
      { status: 500 }
    );
  }
}