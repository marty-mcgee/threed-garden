// app/api/threed/beds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedBeds } from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/beds - List ThreeD Beds
// Query Parameters:
//   - id (optional): Get a single bed
//   - status (optional): Filter by bed status
//   - isActive (optional): Filter by active status
//   - search (optional): Search by name, bedId, or description
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

    // Get a single bed by ID
    if (id) {
      const [bed] = await db
        .select()
        .from(threedBeds)
        .where(
          and(
            eq(threedBeds.id, parseInt(id)),
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

      return NextResponse.json({
        success: true,
        data: bed,
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedBeds)
      .where(eq(threedBeds.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(threedBeds.status, status));
    }

    if (isActive !== null) {
      query = query.where(eq(threedBeds.isActive, isActive === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedBeds.name} ILIKE ${`%${search}%`} OR 
            ${threedBeds.bedId} ILIKE ${`%${search}%`} OR
            ${threedBeds.description} ILIKE ${`%${search}%`}`
      );
    }

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedBeds)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(threedBeds.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching beds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch beds' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/beds - Create ThreeD Bed
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 POST /api/threed/beds - Request body:', body);

    const {
      bedId,
      name,
      description,
      shape,
      widthFeet,
      lengthFeet,
      squareFeet,
      heightFeet,
      soilType,
      sunExposure,
      positionX,
      positionY,
      positionZ,
      rotation,
      scale,
      isActive,
      status,
      color,
      notes,
    } = body;

    // ✅ Validate required fields
    if (!bedId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: bedId' },
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

    // ✅ Check if bedId already exists
    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.bedId, bedId),
          eq(threedBeds.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Bed ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('threed_beds');

    const [newBed] = await db
      .insert(threedBeds)
      .values({
        userId,
        bedId,
        name,
        description: description || null,
        shape: shape || 'rectangle',
        widthFeet: widthFeet || null,
        lengthFeet: lengthFeet || null,
        squareFeet: squareFeet || null,
        heightFeet: heightFeet || '1',
        soilType: soilType || null,
        sunExposure: sunExposure || null,
        positionX: positionX || '0',
        positionY: positionY || '0',
        positionZ: positionZ || '0',
        rotation: rotation || '0',
        scale: scale || '1',
        isActive: isActive ?? true,
        status: status || 'active',
        color: color || '#8B5E3C',
        notes: notes || null,
      })
      .returning();

    console.log('✅ ThreeD bed created:', newBed);

    return NextResponse.json({
      success: true,
      data: newBed,
      message: 'Bed created successfully',
    });
  } catch (error) {
    console.error('Error creating bed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bed' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/beds?id=1 - Full update
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

    // ✅ Verify bed exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(threedBeds)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD bed updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Bed updated successfully',
    });
  } catch (error) {
    console.error('Error updating bed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bed' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/beds?id=1 - Partial update
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

    // ✅ Verify bed exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(threedBeds)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD bed patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Bed updated successfully',
    });
  } catch (error) {
    console.error('Error updating bed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bed' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/beds?id=1 - Delete bed
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
      .delete(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Bed deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bed' },
      { status: 500 }
    );
  }
}