// app/api/traffic/bay-area-511/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficBayArea511Events, traffic } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/bay-area-511 - List 511 events (PUBLIC)
// Query Parameters:
//   - id (optional): Get a single event
//   - status (optional): Filter by status
//   - eventType (optional): Filter by event type
//   - eventId (optional): Filter by event ID
//   - trafficId (optional): Filter by traffic module
//   - limit (optional): Number of records to return (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const eventId = searchParams.get('eventId');
    const trafficId = searchParams.get('trafficId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single event by ID
    if (id) {
      let query = db
        .select()
        .from(trafficBayArea511Events)
        .where(eq(trafficBayArea511Events.id, parseInt(id)));

      // Public users only see active events
      if (!userId) {
        query = query.where(eq(trafficBayArea511Events.status, 'active'));
      }

      const [event] = await query.limit(1);

      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: event,
      });
    }

    // ✅ Build base query
    let query = db
      .select()
      .from(trafficBayArea511Events)
      .$dynamic();

    // ✅ Apply user filtering
    if (userId) {
      // Authenticated users see their events + active public events
      query = query.where(
        or(
          eq(trafficBayArea511Events.userId, userId),
          eq(trafficBayArea511Events.status, 'active')
        )
      );
    } else {
      // Public users only see active events
      query = query.where(eq(trafficBayArea511Events.status, 'active'));
    }

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(trafficBayArea511Events.status, status));
    }

    if (eventType) {
      query = query.where(eq(trafficBayArea511Events.eventType, eventType));
    }

    if (eventId) {
      query = query.where(eq(trafficBayArea511Events.sourceId, eventId));
    }

    if (trafficId) {
      query = query.where(eq(trafficBayArea511Events.trafficId, parseInt(trafficId)));
    }

    // ✅ Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(trafficBayArea511Events)
      .where(query._where);

    const [countResult] = await countQuery;
    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const events = await query
      .orderBy(desc(trafficBayArea511Events.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching Bay Area 511 events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/bay-area-511 - Create event (ADMIN ONLY)
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
    console.log('📝 POST /api/traffic/bay-area-511 - Request body:', body);

    const { 
      eventId,
      title,
      description,
      eventType,
      status,
      severity,
      location,
      route,
      direction,
      latitude,
      longitude,
      startTime,
      endTime,
      trafficId,
      isActive,
    } = body;

    // ✅ Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
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

    // ✅ Check if eventId already exists
    const [existing] = await db
      .select()
      .from(trafficBayArea511Events)
      .where(
        and(
          eq(trafficBayArea511Events.sourceId, eventId),
          eq(trafficBayArea511Events.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Event ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('traffic_bay_area_511_events');

    const [newEvent] = await db
      .insert(trafficBayArea511Events)
      .values({
        userId,
        trafficId: trafficId || null,
        sourceId: eventId,
        eventType: eventType || 'accident',
        status: status || 'active',
        title,
        description: description || null,
        roadwayName: route || null,
        directionOfTravel: direction || null,
        latitude: latitude || null,
        longitude: longitude || null,
        location,
        startTime: startTime || null,
        endTime: endTime || null,
        isActive: isActive !== false,
      })
      .returning();

    console.log('✅ Bay Area 511 event created:', newEvent);

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Error creating Bay Area 511 event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/bay-area-511 - Update event (ADMIN ONLY)
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
    console.log('📝 PUT /api/traffic/bay-area-511 - Request body:', body);

    const { 
      eventId,
      title,
      description,
      eventType,
      status,
      severity,
      location,
      route,
      direction,
      latitude,
      longitude,
      startTime,
      endTime,
      trafficId,
      isActive,
    } = body;

    const userId = session.user.id;

    // ✅ Verify event exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficBayArea511Events)
      .where(
        and(
          eq(trafficBayArea511Events.id, parseInt(id)),
          eq(trafficBayArea511Events.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
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

    const [updatedEvent] = await db
      .update(trafficBayArea511Events)
      .set({
        sourceId: eventId || existing.sourceId,
        eventType: eventType || existing.eventType,
        status: status || existing.status,
        title: title || existing.title,
        description: description !== undefined ? description : existing.description,
        roadwayName: route !== undefined ? route : existing.roadwayName,
        directionOfTravel: direction !== undefined ? direction : existing.directionOfTravel,
        latitude: latitude !== undefined ? latitude : existing.latitude,
        longitude: longitude !== undefined ? longitude : existing.longitude,
        location: location || existing.location,
        startTime: startTime !== undefined ? startTime : existing.startTime,
        endTime: endTime !== undefined ? endTime : existing.endTime,
        trafficId: trafficId !== undefined ? trafficId : existing.trafficId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficBayArea511Events.id, parseInt(id)),
          eq(trafficBayArea511Events.userId, userId)
        )
      )
      .returning();

    console.log('✅ Bay Area 511 event updated:', updatedEvent);

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Error updating Bay Area 511 event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/bay-area-511 - Delete event (ADMIN ONLY)
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
      .delete(trafficBayArea511Events)
      .where(
        and(
          eq(trafficBayArea511Events.id, parseInt(id)),
          eq(trafficBayArea511Events.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Bay Area 511 event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}