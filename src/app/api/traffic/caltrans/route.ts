// app/api/traffic/caltrans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficLaneClosures } from '@/lib/schema/traffic';
import { eq, desc, and, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// GET /api/traffic/caltrans - List all Caltrans lane closures for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (id) {
      const [closure] = await db
        .select()
        .from(trafficLaneClosures)
        .where(
          and(
            eq(trafficLaneClosures.id, parseInt(id)),
            eq(trafficLaneClosures.userId, session.user.id)
          )
        )
        .limit(1);

      if (!closure) {
        return NextResponse.json(
          { success: false, error: 'Closure not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: closure });
    }

    let query = db
      .select()
      .from(trafficLaneClosures)
      .where(eq(trafficLaneClosures.userId, session.user.id));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficLaneClosures)
      .where(eq(trafficLaneClosures.userId, session.user.id));

    const closures = await query
      .orderBy(desc(trafficLaneClosures.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: closures,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Traffic Caltrans API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/traffic/caltrans - Create a new Caltrans lane closure
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      closureId, route, direction, description, 
      latitude, longitude, startTimestamp, endTimestamp,
      status, closureType, district 
    } = body;

    if (!closureId || !route) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: closureId, route' },
        { status: 400 }
      );
    }

    await ensureTableSequence('traffic_lane_closures');

    const [newClosure] = await db
      .insert(trafficLaneClosures)
      .values({
        userId: session.user.id,
        closureId,
        route,
        direction: direction || null,
        description: description || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        startTimestamp: startTimestamp ? new Date(startTimestamp) : new Date(),
        endTimestamp: endTimestamp ? new Date(endTimestamp) : null,
        status: status || 'active',
        closureType: closureType || null,
        district: district || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newClosure });
  } catch (error) {
    console.error('Traffic Caltrans API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create closure' },
      { status: 500 }
    );
  }
}

// PUT /api/traffic/caltrans?id=1 - Full update of a Caltrans lane closure
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
        { success: false, error: 'Missing closure ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      route, direction, description, 
      latitude, longitude, startTimestamp, endTimestamp,
      status, closureType, district 
    } = body;

    const [existing] = await db
      .select()
      .from(trafficLaneClosures)
      .where(
        and(
          eq(trafficLaneClosures.id, parseInt(id)),
          eq(trafficLaneClosures.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Closure not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(trafficLaneClosures)
      .set({
        route: route || existing.route,
        direction: direction !== undefined ? direction : existing.direction,
        description: description !== undefined ? description : existing.description,
        latitude: latitude !== undefined ? parseFloat(latitude) : existing.latitude,
        longitude: longitude !== undefined ? parseFloat(longitude) : existing.longitude,
        startTimestamp: startTimestamp ? new Date(startTimestamp) : existing.startTimestamp,
        endTimestamp: endTimestamp ? new Date(endTimestamp) : existing.endTimestamp,
        status: status || existing.status,
        closureType: closureType !== undefined ? closureType : existing.closureType,
        district: district !== undefined ? district : existing.district,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficLaneClosures.id, parseInt(id)),
          eq(trafficLaneClosures.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Traffic Caltrans API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update closure' },
      { status: 500 }
    );
  }
}

// DELETE /api/traffic/caltrans?id=1 - Delete a Caltrans lane closure
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
        { success: false, error: 'Missing closure ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(trafficLaneClosures)
      .where(
        and(
          eq(trafficLaneClosures.id, parseInt(id)),
          eq(trafficLaneClosures.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Closure not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(trafficLaneClosures)
      .where(
        and(
          eq(trafficLaneClosures.id, parseInt(id)),
          eq(trafficLaneClosures.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Traffic Caltrans API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete closure' },
      { status: 500 }
    );
  }
}