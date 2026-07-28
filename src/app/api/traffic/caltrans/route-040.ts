// app/api/traffic/caltrans/route.ts - COMPLETE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficCaltransLaneClosures, trafficCaltransDistricts, traffic } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/caltrans - List closures (PUBLIC)
// Query Parameters:
//   - id (optional): Get a single closure
//   - status (optional): Filter by status
//   - route (optional): Filter by route
//   - districtId (optional): Filter by district
//   - trafficId (optional): Filter by traffic module
//   - includeDistrict (optional): Include district details
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const route = searchParams.get('route');
    const districtId = searchParams.get('districtId');
    const trafficId = searchParams.get('trafficId');
    const includeDistrict = searchParams.get('includeDistrict') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single closure by ID
    if (id) {
      let query = db
        .select()
        .from(trafficCaltransLaneClosures)
        .where(eq(trafficCaltransLaneClosures.id, parseInt(id)));

      // ✅ If no user, only show active closures
      if (!userId) {
        query = query.where(eq(trafficCaltransLaneClosures.status, 'active'));
      }

      const [closure] = await query.limit(1);

      if (!closure) {
        return NextResponse.json(
          { success: false, error: 'Closure not found' },
          { status: 404 }
        );
      }

      // ✅ Include district if requested
      let result: any = closure;
      if (includeDistrict && closure.districtId) {
        const [district] = await db
          .select()
          .from(trafficCaltransDistricts)
          .where(eq(trafficCaltransDistricts.districtId, closure.districtId))
          .limit(1);
        result.district = district || null;
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // ✅ Build base query
    let query = db
      .select()
      .from(trafficCaltransLaneClosures)
      .$dynamic();

    // ✅ Apply user filtering
    if (userId) {
      // ✅ Show user's closures + public active closures
      query = query.where(
        or(
          eq(trafficCaltransLaneClosures.userId, userId),
          eq(trafficCaltransLaneClosures.status, 'active')
        )
      );
    } else {
      // ✅ Public users only see active closures
      query = query.where(eq(trafficCaltransLaneClosures.status, 'active'));
    }

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(trafficCaltransLaneClosures.status, status));
    }

    if (route) {
      query = query.where(eq(trafficCaltransLaneClosures.route, route));
    }

    if (districtId) {
      query = query.where(eq(trafficCaltransLaneClosures.districtId, districtId));
    }

    if (trafficId) {
      query = query.where(eq(trafficCaltransLaneClosures.trafficId, parseInt(trafficId)));
    }

    // ✅ Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(trafficCaltransLaneClosures)
      .where(query._where);

    const [countResult] = await countQuery;
    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const closures = await query
      .orderBy(desc(trafficCaltransLaneClosures.createdAt))
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
              .where(eq(trafficCaltransDistricts.districtId, closure.districtId))
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
      { success: false, error: 'Failed to fetch closures' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/caltrans - Create closure (ADMIN ONLY)
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
      route,
      direction,
      location,
      description,
      closureType,
      status,
      severity,
      latitude,
      longitude,
      startDate,
      endDate,
      districtId,
      trafficId,
      isActive,
    } = body;

    // ✅ Validate required fields
    if (!closureId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: closureId' },
        { status: 400 }
      );
    }

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: route' },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: location' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Verify traffic module exists if provided
    if (trafficId) {
      const [module] = await db
        .select()
        .from(traffic)
        .where(
          and(
            eq(traffic.id, parseInt(trafficId)),
            eq(traffic.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'Traffic module not found' },
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

    const [newClosure] = await db
      .insert(trafficCaltransLaneClosures)
      .values({
        userId,
        trafficId: trafficId || null,
        closureId,
        route,
        direction: direction || 'northbound',
        location,
        description: description || null,
        closureType: closureType || 'lane_closure',
        status: status || 'active',
        latitude: latitude || null,
        longitude: longitude || null,
        startDate: startDate || null,
        endDate: endDate || null,
        districtId: districtId || null,
        isActive: isActive !== false,
      })
      .returning();

    console.log('✅ Caltrans closure created:', newClosure);

    return NextResponse.json({
      success: true,
      data: newClosure,
      message: 'Closure created successfully',
    });
  } catch (error) {
    console.error('Error creating Caltrans closure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create closure' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/caltrans - Update closure (ADMIN ONLY)
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
    console.log('📝 PUT /api/traffic/caltrans - Request body:', body);

    const { 
      closureId,
      route,
      direction,
      location,
      description,
      closureType,
      status,
      severity,
      latitude,
      longitude,
      startDate,
      endDate,
      districtId,
      trafficId,
      isActive,
    } = body;

    const userId = session.user.id;

    // ✅ Verify closure exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(
        and(
          eq(trafficCaltransLaneClosures.id, parseInt(id)),
          eq(trafficCaltransLaneClosures.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Closure not found' },
        { status: 404 }
      );
    }

    // ✅ Verify traffic module exists if provided
    if (trafficId) {
      const [module] = await db
        .select()
        .from(traffic)
        .where(
          and(
            eq(traffic.id, parseInt(trafficId)),
            eq(traffic.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'Traffic module not found' },
          { status: 404 }
        );
      }
    }

    const [updatedClosure] = await db
      .update(trafficCaltransLaneClosures)
      .set({
        closureId: closureId || existing.closureId,
        route: route || existing.route,
        direction: direction || existing.direction,
        location: location || existing.location,
        description: description !== undefined ? description : existing.description,
        closureType: closureType || existing.closureType,
        status: status || existing.status,
        latitude: latitude !== undefined ? latitude : existing.latitude,
        longitude: longitude !== undefined ? longitude : existing.longitude,
        startDate: startDate !== undefined ? startDate : existing.startDate,
        endDate: endDate !== undefined ? endDate : existing.endDate,
        districtId: districtId !== undefined ? districtId : existing.districtId,
        trafficId: trafficId !== undefined ? trafficId : existing.trafficId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        updatedAt: new Date(),
        lastModified: new Date(),
        lastSeen: new Date(),
      })
      .where(
        and(
          eq(trafficCaltransLaneClosures.id, parseInt(id)),
          eq(trafficCaltransLaneClosures.userId, userId)
        )
      )
      .returning();

    console.log('✅ Caltrans closure updated:', updatedClosure);

    return NextResponse.json({
      success: true,
      data: updatedClosure,
      message: 'Closure updated successfully',
    });
  } catch (error) {
    console.error('Error updating Caltrans closure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update closure' },
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

    const [deleted] = await db
      .delete(trafficCaltransLaneClosures)
      .where(
        and(
          eq(trafficCaltransLaneClosures.id, parseInt(id)),
          eq(trafficCaltransLaneClosures.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Closure not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Closure deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Caltrans closure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete closure' },
      { status: 500 }
    );
  }
}