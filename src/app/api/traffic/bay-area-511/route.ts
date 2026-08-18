// app/api/traffic/bay-area-511/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficBayArea511Events } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

const EVENT_TYPES = [
  'accident',
  'congestion',
  'construction',
  'special_event',
  'weather',
] as const;

type EventType = (typeof EVENT_TYPES)[number];

function isEventType(value: string): value is EventType {
  return EVENT_TYPES.some((eventType) => eventType === value);
}

// ============================================
// GET /api/traffic/bay-area-511 - List Bay Area 511 Events
// Query Parameters:
//   - id (optional): Get a single event
//   - isActive (optional): Filter by active status
//   - isPublic (optional): Filter by public status
//   - eventType (optional): Filter by event type
//   - severity (optional): Filter by severity
//   - county (optional): Filter by county
//   - city (optional): Filter by city
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
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const county = searchParams.get('county');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single event by ID
    if (id) {
      const [event] = await db
        .select()
        .from(trafficBayArea511Events)
        .where(
          and(
            eq(trafficBayArea511Events.id, parseInt(id)),
            userId
              ? undefined
              : and(
                  eq(trafficBayArea511Events.isPublic, true),
                  eq(trafficBayArea511Events.isActive, true)
                )
          )
        )
        .limit(1);

      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Bay Area 511 event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: event,
      });
    }

    const conditions = [
      userId
        ? or(
            eq(trafficBayArea511Events.userId, userId),
            and(
              eq(trafficBayArea511Events.isPublic, true),
              eq(trafficBayArea511Events.isActive, true)
            )
          )
        : and(
            eq(trafficBayArea511Events.isPublic, true),
            eq(trafficBayArea511Events.isActive, true)
          ),
    ];

    if (isActive !== null) {
      conditions.push(eq(trafficBayArea511Events.isActive, isActive === 'true'));
    }

    if (isPublic !== null) {
      conditions.push(eq(trafficBayArea511Events.isPublic, isPublic === 'true'));
    }

    if (eventType) {
      if (!isEventType(eventType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid eventType parameter' },
          { status: 400 }
        );
      }
      conditions.push(eq(trafficBayArea511Events.eventType, eventType));
    }

    if (severity) {
      conditions.push(eq(trafficBayArea511Events.severity, parseInt(severity)));
    }

    if (county) {
      conditions.push(eq(trafficBayArea511Events.county, county));
    }

    if (city) {
      conditions.push(eq(trafficBayArea511Events.city, city));
    }

    const predicate = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficBayArea511Events)
      .where(predicate);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const events = await db
      .select()
      .from(trafficBayArea511Events)
      .where(predicate)
      .orderBy(desc(trafficBayArea511Events.reportedAt))
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
      { success: false, error: 'Failed to fetch Bay Area 511 events' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/bay-area-511 - Create Bay Area 511 event (ADMIN ONLY)
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
      sourceId,
      title,
      description,
      eventType,
      severity,
      location,
      latitude,
      longitude,
      address,
      city,
      county,
      reportedAt,
      clearedAt,
      lastUpdated,
      impact,
      rawData,
      notes,
      isActive,
      isPublic,
    } = body;

    // ✅ Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: eventId' },
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

    if (!reportedAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: reportedAt' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if eventId already exists
    const [existing] = await db
      .select()
      .from(trafficBayArea511Events)
      .where(
        and(
          eq(trafficBayArea511Events.eventId, eventId),
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

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return value;
    };

    await ensureTableSequence('traffic_bay_area_511_events');

    const [newEvent] = await db
      .insert(trafficBayArea511Events)
      .values({
        userId,
        eventId,
        sourceId,
        title,
        description: description || null,
        eventType: eventType || 'accident',
        severity: severity || 1,
        location: location || null,
        latitude: parseNumeric(latitude),
        longitude: parseNumeric(longitude),
        address: address || null,
        city: city || null,
        county: county || null,
        reportedAt: new Date(reportedAt).toISOString(),
        clearedAt: clearedAt ? new Date(clearedAt).toISOString() : null,
        lastUpdated: new Date(lastUpdated || Date.now()).toISOString(),
        impact: impact || null,
        rawData: rawData || null,
        notes: notes || null,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
      })
      .returning();

    console.log('✅ Bay Area 511 event created:', newEvent);

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: 'Bay Area 511 event created successfully',
    });
  } catch (error) {
    console.error('Error creating Bay Area 511 event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Bay Area 511 event' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/bay-area-511 - Partial update (ADMIN ONLY)
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

    // ✅ Verify event exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficBayArea511Events)
      .where(
        and(
          eq(trafficBayArea511Events.id, parsedId),
          eq(trafficBayArea511Events.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Bay Area 511 event not found' },
        { status: 404 }
      );
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

    if (body.eventId !== undefined) updateData.eventId = body.eventId;
    if (body.sourceId !== undefined) updateData.sourceId = body.sourceId;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.eventType !== undefined) updateData.eventType = body.eventType;
    if (body.severity !== undefined) updateData.severity = body.severity;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.latitude !== undefined) updateData.latitude = parseNumeric(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = parseNumeric(body.longitude);
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.reportedAt !== undefined) updateData.reportedAt = new Date(body.reportedAt).toISOString();
    if (body.clearedAt !== undefined) {
      updateData.clearedAt = body.clearedAt
        ? new Date(body.clearedAt).toISOString()
        : null;
    }
    if (body.lastUpdated !== undefined) {
      updateData.lastUpdated = new Date(body.lastUpdated).toISOString();
    }
    if (body.impact !== undefined) updateData.impact = body.impact;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    const [updatedEvent] = await db
      .update(trafficBayArea511Events)
      .set(updateData)
      .where(
        and(
          eq(trafficBayArea511Events.id, parsedId),
          eq(trafficBayArea511Events.userId, userId)
        )
      )
      .returning();

    console.log('✅ Bay Area 511 event updated:', updatedEvent);

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Bay Area 511 event updated successfully',
    });
  } catch (error) {
    console.error('Error updating Bay Area 511 event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Bay Area 511 event' },
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
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(trafficBayArea511Events)
      .where(
        and(
          eq(trafficBayArea511Events.id, parsedId),
          eq(trafficBayArea511Events.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Bay Area 511 event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Bay Area 511 event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Bay Area 511 event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete Bay Area 511 event' },
      { status: 500 }
    );
  }
}
