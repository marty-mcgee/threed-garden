// app/api/traffic/caltrans-districts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficCaltransDistricts } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/caltrans-districts - List Caltrans Districts
// Query Parameters:
//   - id (optional): Get a single district
//   - isActive (optional): Filter by active status
//   - region (optional): Filter by region
//   - search (optional): Search by name or description
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
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single district by ID
    if (id) {
      const [district] = await db
        .select()
        .from(trafficCaltransDistricts)
        .where(
          and(
            eq(trafficCaltransDistricts.id, parseInt(id)),
            userId ? undefined : eq(trafficCaltransDistricts.isActive, true)
          )
        )
        .limit(1);

      if (!district) {
        return NextResponse.json(
          { success: false, error: 'Caltrans District not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: district,
      });
    }

    const conditions = [
      userId
        ? or(
            eq(trafficCaltransDistricts.userId, userId),
            eq(trafficCaltransDistricts.isActive, true)
          )
        : eq(trafficCaltransDistricts.isActive, true),
    ];

    if (isActive !== null) {
      conditions.push(eq(trafficCaltransDistricts.isActive, isActive === 'true'));
    }

    if (region) {
      conditions.push(eq(trafficCaltransDistricts.region, region));
    }

    if (search) {
      conditions.push(
        or(
          sql`${trafficCaltransDistricts.name} ILIKE ${`%${search}%`}`,
          sql`${trafficCaltransDistricts.description} ILIKE ${`%${search}%`}`,
          sql`${trafficCaltransDistricts.districtId} ILIKE ${`%${search}%`}`
        )
      );
    }

    const predicate = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficCaltransDistricts)
      .where(predicate);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const districts = await db
      .select()
      .from(trafficCaltransDistricts)
      .where(predicate)
      .orderBy(desc(trafficCaltransDistricts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: districts,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching Caltrans Districts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Caltrans Districts' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/caltrans-districts - Create Caltrans District (ADMIN ONLY)
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
    console.log('📝 POST /api/traffic/caltrans-districts - Request body:', body);

    const {
      districtId,
      name,
      description,
      districtNumber,
      latitude,
      longitude,
      region,
      phone,
      email,
      website,
      isActive,
      config,
    } = body;

    // ✅ Validate required fields
    if (!districtId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: districtId' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!districtNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: districtNumber' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if districtId already exists
    const [existing] = await db
      .select()
      .from(trafficCaltransDistricts)
      .where(
        and(
          eq(trafficCaltransDistricts.districtId, districtId),
          eq(trafficCaltransDistricts.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'District ID already exists' },
        { status: 409 }
      );
    }

    // ✅ Check if districtNumber already exists
    const [existingNumber] = await db
      .select()
      .from(trafficCaltransDistricts)
      .where(
        and(
          eq(trafficCaltransDistricts.districtNumber, parseInt(districtNumber)),
          eq(trafficCaltransDistricts.userId, userId)
        )
      )
      .limit(1);

    if (existingNumber) {
      return NextResponse.json(
        { success: false, error: 'District number already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('traffic_caltrans_districts');

    const [newDistrict] = await db
      .insert(trafficCaltransDistricts)
      .values({
        userId,
        districtId,
        name,
        description: description || null,
        districtNumber: parseInt(districtNumber),
        latitude: latitude || null,
        longitude: longitude || null,
        region: region || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        isActive: isActive ?? true,
        config: config || {},
      })
      .returning();

    console.log('✅ Caltrans District created:', newDistrict);

    return NextResponse.json({
      success: true,
      data: newDistrict,
      message: 'Caltrans District created successfully',
    });
  } catch (error) {
    console.error('Error creating Caltrans District:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Caltrans District' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/caltrans-districts - Full update (ADMIN ONLY)
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
    console.log('📝 PUT /api/traffic/caltrans-districts - Request body:', body);

    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify district exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficCaltransDistricts)
      .where(
        and(
          eq(trafficCaltransDistricts.id, parsedId),
          eq(trafficCaltransDistricts.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caltrans District not found' },
        { status: 404 }
      );
    }

    const [updatedDistrict] = await db
      .update(trafficCaltransDistricts)
      .set({
        ...body,
        districtNumber: body.districtNumber ? parseInt(body.districtNumber) : existing.districtNumber,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficCaltransDistricts.id, parsedId),
          eq(trafficCaltransDistricts.userId, userId)
        )
      )
      .returning();

    console.log('✅ Caltrans District updated:', updatedDistrict);

    return NextResponse.json({
      success: true,
      data: updatedDistrict,
      message: 'Caltrans District updated successfully',
    });
  } catch (error) {
    console.error('Error updating Caltrans District:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Caltrans District' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/caltrans-districts - Partial update (ADMIN ONLY)
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

    // ✅ Verify district exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficCaltransDistricts)
      .where(
        and(
          eq(trafficCaltransDistricts.id, parsedId),
          eq(trafficCaltransDistricts.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caltrans District not found' },
        { status: 404 }
      );
    }

    const [updatedDistrict] = await db
      .update(trafficCaltransDistricts)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficCaltransDistricts.id, parsedId),
          eq(trafficCaltransDistricts.userId, userId)
        )
      )
      .returning();

    console.log('✅ Caltrans District patched:', updatedDistrict);

    return NextResponse.json({
      success: true,
      data: updatedDistrict,
      message: 'Caltrans District updated successfully',
    });
  } catch (error) {
    console.error('Error updating Caltrans District:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Caltrans District' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/caltrans-districts - Delete district (ADMIN ONLY)
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
      .delete(trafficCaltransDistricts)
      .where(
        and(
          eq(trafficCaltransDistricts.id, parsedId),
          eq(trafficCaltransDistricts.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Caltrans District not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Caltrans District deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Caltrans District:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete Caltrans District' },
      { status: 500 }
    );
  }
}
