// app/api/traffic/caltrans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficCaltransLaneClosures, trafficCaltransDistricts } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

const CLOSURE_TYPES = ['full', 'partial', 'lane', 'shoulder', 'ramp'] as const;

type ClosureType = (typeof CLOSURE_TYPES)[number];

function isClosureType(value: string): value is ClosureType {
  return CLOSURE_TYPES.some((closureType) => closureType === value);
}

// app/api/traffic/caltrans/route.ts - Fix GET function

// ============================================
// GET /api/traffic/caltrans - List Caltrans Lane Closures
// Query Parameters:
//   - id (optional): Get a single closure
//   - isActive (optional): Filter by active status
//   - isPublic (optional): Filter by public status
//   - closureType (optional): Filter by closure type
//   - county (optional): Filter by county
//   - route (optional): Filter by route
//   - districtId (optional): Filter by district
//   - includeDistrict (optional): Include district details
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
    const isPublic = searchParams.get('isPublic');
    const closureType = searchParams.get('closureType');
    const county = searchParams.get('county');
    const route = searchParams.get('route');
    const districtId = searchParams.get('districtId');
    const includeDistrict = searchParams.get('includeDistrict') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single closure by ID
    if (id) {
      const [closure] = await db
        .select()
        .from(trafficCaltransLaneClosures)
        .where(
          and(
            eq(trafficCaltransLaneClosures.id, parseInt(id)),
            userId
              ? undefined
              : and(
                  eq(trafficCaltransLaneClosures.isPublic, true),
                  eq(trafficCaltransLaneClosures.isActive, true)
                )
          )
        )
        .limit(1);

      if (!closure) {
        return NextResponse.json(
          { success: false, error: 'Caltrans closure not found' },
          { status: 404 }
        );
      }

      // Include district if requested
      let result: any = closure;
      if (includeDistrict && closure.districtId) {
        const [district] = await db
          .select()
          .from(trafficCaltransDistricts)
          .where(eq(trafficCaltransDistricts.id, closure.districtId))
          .limit(1);
        result.district = district || null;
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    const conditions = [
      userId
        ? or(
            eq(trafficCaltransLaneClosures.userId, userId),
            and(
              eq(trafficCaltransLaneClosures.isPublic, true),
              eq(trafficCaltransLaneClosures.isActive, true)
            )
          )
        : and(
            eq(trafficCaltransLaneClosures.isPublic, true),
            eq(trafficCaltransLaneClosures.isActive, true)
          ),
    ];

    if (isActive !== null) {
      conditions.push(eq(trafficCaltransLaneClosures.isActive, isActive === 'true'));
    }

    if (isPublic !== null) {
      conditions.push(eq(trafficCaltransLaneClosures.isPublic, isPublic === 'true'));
    }

    if (closureType) {
      if (!isClosureType(closureType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid closureType parameter' },
          { status: 400 }
        );
      }
      conditions.push(eq(trafficCaltransLaneClosures.closureType, closureType));
    }

    if (county) {
      conditions.push(eq(trafficCaltransLaneClosures.county, county));
    }

    if (route) {
      conditions.push(eq(trafficCaltransLaneClosures.route, route));
    }

    if (districtId) {
      conditions.push(eq(trafficCaltransLaneClosures.districtId, parseInt(districtId)));
    }

    const predicate = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficCaltransLaneClosures)
      .where(predicate);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const closures = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(predicate)
      .orderBy(desc(trafficCaltransLaneClosures.startDate))
      .limit(limit)
      .offset(offset);

    // ✅ Include district if requested
    if (includeDistrict) {
      const closuresWithDistricts = await Promise.all(
        closures.map(async (closure) => {
          let result: any = { ...closure };
          if (closure.districtId) {
            const [district] = await db
              .select()
              .from(trafficCaltransDistricts)
              .where(eq(trafficCaltransDistricts.id, closure.districtId))
              .limit(1);
            result.district = district || null;
          }
          return result;
        })
      );
      return NextResponse.json({
        success: true,
        data: closuresWithDistricts,
        pagination: { limit, offset, total },
      });
    }

    return NextResponse.json({
      success: true,
      data: closures,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching Caltrans closures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Caltrans closures' },
      { status: 500 }
    );
  }
}

// app/api/traffic/caltrans/route.ts - Fix numeric field handling

// ============================================
// POST /api/traffic/caltrans - Create Caltrans closure (ADMIN ONLY)
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
    console.log('📝 POST /api/traffic/caltrans - Request body:', body);

    const {
      closureId,
      sourceId,
      title,
      description,
      closureType,
      route,
      direction,
      county,
      city,
      milepost,
      latitude,
      longitude,
      startDate,
      endDate,
      expectedEndDate,
      lastUpdated,
      districtId,
      caltransId,
      reason,
      detour,
      rawData,
      notes,
      isActive,
      isPublic,
    } = body;

    // ✅ Validate required fields
    if (!closureId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: closureId' },
        { status: 400 }
      );
    }

    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sourceId' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: startDate' },
        { status: 400 }
      );
    }

    if (closureType && !isClosureType(closureType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid closureType' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Verify district exists if provided
    if (districtId) {
      const [district] = await db
        .select()
        .from(trafficCaltransDistricts)
        .where(eq(trafficCaltransDistricts.id, parseInt(districtId)))
        .limit(1);

      if (!district) {
        return NextResponse.json(
          { success: false, error: 'Caltrans District not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Check if closureId already exists
    const [existing] = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(
        and(
          eq(trafficCaltransLaneClosures.closureId, closureId),
          eq(trafficCaltransLaneClosures.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Closure ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('traffic_caltrans_lane_closures');

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return value;
    };

    const [newClosure] = await db
      .insert(trafficCaltransLaneClosures)
      .values({
        userId,
        closureId,
        sourceId,
        title,
        description: description || null,
        closureType: closureType || 'lane',
        route: route || null,
        direction: direction || null,
        county: county || null,
        city: city || null,
        milepost: parseNumeric(milepost),
        latitude: parseNumeric(latitude),
        longitude: parseNumeric(longitude),
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate).toISOString() : null,
        lastUpdated: new Date(lastUpdated || Date.now()).toISOString(),
        districtId: districtId ? parseInt(districtId) : null,
        caltransId: caltransId || null,
        reason: reason || null,
        detour: detour || null,
        rawData: rawData || null,
        notes: notes || null,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
      })
      .returning();

    console.log('✅ Caltrans closure created:', newClosure);

    return NextResponse.json({
      success: true,
      data: newClosure,
      message: 'Caltrans closure created successfully',
    });
  } catch (error) {
    console.error('Error creating Caltrans closure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Caltrans closure' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/caltrans - Partial update (ADMIN ONLY)
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

    // ✅ Verify closure exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(
        and(
          eq(trafficCaltransLaneClosures.id, parsedId),
          eq(trafficCaltransLaneClosures.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caltrans closure not found' },
        { status: 404 }
      );
    }

    if (body.closureType !== undefined && !isClosureType(body.closureType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid closureType' },
        { status: 400 }
      );
    }

    // ✅ Verify district exists if provided
    if (body.districtId) {
      const [district] = await db
        .select()
        .from(trafficCaltransDistricts)
        .where(eq(trafficCaltransDistricts.id, parseInt(body.districtId)))
        .limit(1);

      if (!district) {
        return NextResponse.json(
          { success: false, error: 'Caltrans District not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return value;
    };

    // ✅ Handle date fields and numeric fields
    const updateData: any = { updatedAt: new Date() };
    
    // Handle all fields with proper type conversion
    if (body.closureId !== undefined) updateData.closureId = body.closureId;
    if (body.sourceId !== undefined) updateData.sourceId = body.sourceId;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.closureType !== undefined) updateData.closureType = body.closureType;
    if (body.route !== undefined) updateData.route = body.route;
    if (body.direction !== undefined) updateData.direction = body.direction;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.milepost !== undefined) updateData.milepost = parseNumeric(body.milepost);
    if (body.latitude !== undefined) updateData.latitude = parseNumeric(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = parseNumeric(body.longitude);
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate).toISOString();
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate).toISOString() : null;
    }
    if (body.expectedEndDate !== undefined) {
      updateData.expectedEndDate = body.expectedEndDate
        ? new Date(body.expectedEndDate).toISOString()
        : null;
    }
    if (body.lastUpdated !== undefined) {
      updateData.lastUpdated = new Date(body.lastUpdated).toISOString();
    }
    if (body.districtId !== undefined) {
      updateData.districtId = body.districtId ? parseInt(body.districtId) : null;
    }
    if (body.caltransId !== undefined) updateData.caltransId = body.caltransId || null;
    if (body.reason !== undefined) updateData.reason = body.reason || null;
    if (body.detour !== undefined) updateData.detour = body.detour || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    const [updatedClosure] = await db
      .update(trafficCaltransLaneClosures)
      .set(updateData)
      .where(
        and(
          eq(trafficCaltransLaneClosures.id, parsedId),
          eq(trafficCaltransLaneClosures.userId, userId)
        )
      )
      .returning();

    console.log('✅ Caltrans closure updated:', updatedClosure);

    return NextResponse.json({
      success: true,
      data: updatedClosure,
      message: 'Caltrans closure updated successfully',
    });
  } catch (error) {
    console.error('Error updating Caltrans closure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Caltrans closure' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/caltrans - Delete closure (ADMIN ONLY)
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
      .delete(trafficCaltransLaneClosures)
      .where(
        and(
          eq(trafficCaltransLaneClosures.id, parsedId),
          eq(trafficCaltransLaneClosures.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Caltrans closure not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Caltrans closure deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Caltrans closure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete Caltrans closure' },
      { status: 500 }
    );
  }
}
