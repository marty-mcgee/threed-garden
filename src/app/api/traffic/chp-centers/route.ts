// app/api/traffic/chp-centers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficChpCenters } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/chp-centers - List CHP Centers
// Query Parameters:
//   - id (optional): Get a single center
//   - isActive (optional): Filter by active status
//   - county (optional): Filter by county
//   - region (optional): Filter by region
//   - search (optional): Search by name, description, city, or county
//   - limit (optional): Number of records to return (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isActive = searchParams.get('isActive');
    const county = searchParams.get('county');
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single center by ID
    if (id) {
      const [center] = await db
        .select()
        .from(trafficChpCenters)
        .where(
          and(
            eq(trafficChpCenters.id, parseInt(id)),
            userId ? undefined : eq(trafficChpCenters.isActive, true)
          )
        )
        .limit(1);

      if (!center) {
        return NextResponse.json(
          { success: false, error: 'CHP Center not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: center,
      });
    }

    const conditions = [
      userId
        ? or(
            eq(trafficChpCenters.userId, userId),
            eq(trafficChpCenters.isActive, true)
          )
        : eq(trafficChpCenters.isActive, true),
    ];

    if (isActive !== null) {
      conditions.push(eq(trafficChpCenters.isActive, isActive === 'true'));
    }

    if (county) {
      conditions.push(eq(trafficChpCenters.county, county));
    }

    if (region) {
      conditions.push(eq(trafficChpCenters.region, region));
    }

    if (search) {
      conditions.push(
        or(
          sql`${trafficChpCenters.name} ILIKE ${`%${search}%`}`,
          sql`${trafficChpCenters.description} ILIKE ${`%${search}%`}`,
          sql`${trafficChpCenters.city} ILIKE ${`%${search}%`}`,
          sql`${trafficChpCenters.county} ILIKE ${`%${search}%`}`
        )
      );
    }

    const predicate = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficChpCenters)
      .where(predicate);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const centers = await db
      .select()
      .from(trafficChpCenters)
      .where(predicate)
      .orderBy(desc(trafficChpCenters.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: centers,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching CHP Centers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CHP Centers' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/chp-centers - Create CHP Center (ADMIN ONLY)
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
    console.log('📝 POST /api/traffic/chp-centers - Request body:', body);

    const {
      centerId,
      name,
      description,
      latitude,
      longitude,
      address,
      city,
      county,
      region,
      state,
      zipCode,
      type,
      phone,
      email,
      isActive,
      config,
    } = body;

    // ✅ Validate required fields
    if (!centerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: centerId' },
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

    // ✅ Check if centerId already exists
    const [existing] = await db
      .select()
      .from(trafficChpCenters)
      .where(
        and(
          eq(trafficChpCenters.centerId, centerId),
          eq(trafficChpCenters.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Center ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('traffic_chp_centers');

    const [newCenter] = await db
      .insert(trafficChpCenters)
      .values({
        userId,
        centerId,
        name,
        description: description || null,
        latitude: latitude || null,
        longitude: longitude || null,
        address: address || null,
        city: city || null,
        county: county || null,
        region: region || null,
        state: state || 'CA',
        zipCode: zipCode || null,
        type: type || null,
        phone: phone || null,
        email: email || null,
        isActive: isActive ?? true,
        config: config || {},
      })
      .returning();

    console.log('✅ CHP Center created:', newCenter);

    return NextResponse.json({
      success: true,
      data: newCenter,
      message: 'CHP Center created successfully',
    });
  } catch (error) {
    console.error('Error creating CHP Center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CHP Center' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/chp-centers - Full update (ADMIN ONLY)
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📝 PUT /api/traffic/chp-centers - Request body:', body);

    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify center exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficChpCenters)
      .where(
        and(
          eq(trafficChpCenters.id, parsedId),
          eq(trafficChpCenters.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'CHP Center not found' },
        { status: 404 }
      );
    }

    const [updatedCenter] = await db
      .update(trafficChpCenters)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficChpCenters.id, parsedId),
          eq(trafficChpCenters.userId, userId)
        )
      )
      .returning();

    console.log('✅ CHP Center updated:', updatedCenter);

    return NextResponse.json({
      success: true,
      data: updatedCenter,
      message: 'CHP Center updated successfully',
    });
  } catch (error) {
    console.error('Error updating CHP Center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CHP Center' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/chp-centers - Partial update (ADMIN ONLY)
// ============================================
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify center exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficChpCenters)
      .where(
        and(
          eq(trafficChpCenters.id, parsedId),
          eq(trafficChpCenters.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'CHP Center not found' },
        { status: 404 }
      );
    }

    const [updatedCenter] = await db
      .update(trafficChpCenters)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficChpCenters.id, parsedId),
          eq(trafficChpCenters.userId, userId)
        )
      )
      .returning();

    console.log('✅ CHP Center patched:', updatedCenter);

    return NextResponse.json({
      success: true,
      data: updatedCenter,
      message: 'CHP Center updated successfully',
    });
  } catch (error) {
    console.error('Error updating CHP Center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CHP Center' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/chp-centers - Delete center (ADMIN ONLY)
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
      .delete(trafficChpCenters)
      .where(
        and(
          eq(trafficChpCenters.id, parsedId),
          eq(trafficChpCenters.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'CHP Center not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'CHP Center deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting CHP Center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete CHP Center' },
      { status: 500 }
    );
  }
}
