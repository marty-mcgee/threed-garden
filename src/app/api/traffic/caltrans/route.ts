// app/api/traffic/caltrans/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficCaltransLaneClosures, trafficCaltransDistricts } from '@/lib/schema/traffic';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/caltrans - List Caltrans closures
// Query Parameters:
//   - id (optional): Get a single closure
//   - closureId (optional): Filter by closure ID
//   - route (optional): Filter by route
//   - status (optional): Filter by status
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const closureId = searchParams.get('closureId');
    const route = searchParams.get('route');
    const status = searchParams.get('status');

    // Get a single closure by ID
    if (id) {
      const [closure] = await db
        .select()
        .from(trafficCaltransLaneClosures)
        .where(
          and(
            eq(trafficCaltransLaneClosures.id, parseInt(id)),
            eq(trafficCaltransLaneClosures.userId, userId)
          )
        )
        .limit(1);

      if (!closure) {
        return NextResponse.json(
          { success: false, error: 'Closure not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: closure,
      });
    }

    // Build query
    let query = db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(eq(trafficCaltransLaneClosures.userId, userId));

    if (closureId) {
      query = query.where(eq(trafficCaltransLaneClosures.closureId, closureId));
    }

    if (route) {
      query = query.where(eq(trafficCaltransLaneClosures.route, route));
    }

    if (status) {
      query = query.where(eq(trafficCaltransLaneClosures.status, status));
    }

    const closures = await query.orderBy(desc(trafficCaltransLaneClosures.createdAt));

    return NextResponse.json({
      success: true,
      data: closures,
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
// POST /api/traffic/caltrans - Create a new Caltrans closure
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
      isActive,
    } = body;

    // Validate required fields
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

    // Check if closureId already exists
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
// PUT /api/traffic/caltrans - Update a Caltrans closure
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
      isActive,
    } = body;

    const userId = session.user.id;

    // Verify closure exists
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
// DELETE /api/traffic/caltrans - Delete a Caltrans closure
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