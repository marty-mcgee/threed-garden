// app/api/traffic/chp-cad/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficChpCadIncidents } from '@/lib/schema/traffic';
import { eq, desc, and, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/chp-cad - List all CHP-CAD incidents for the user
// GET /api/traffic/chp-cad?id=1 - Get a single incident
// ============================================
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

    // ✅ Get single incident
    if (id) {
      const [incident] = await db
        .select()
        .from(trafficChpCadIncidents)
        .where(
          and(
            eq(trafficChpCadIncidents.id, parseInt(id)),
            eq(trafficChpCadIncidents.userId, session.user.id)
          )
        )
        .limit(1);

      if (!incident) {
        return NextResponse.json(
          { success: false, error: 'CHP-CAD incident not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: incident });
    }

    // ✅ List all incidents for the user (no trafficId needed)
    let query = db
      .select()
      .from(trafficChpCadIncidents)
      .where(eq(trafficChpCadIncidents.userId, session.user.id));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficChpCadIncidents)
      .where(eq(trafficChpCadIncidents.userId, session.user.id));

    const incidents = await query
      .orderBy(desc(trafficChpCadIncidents.logTime))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: incidents,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Traffic CHP-CAD API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/chp-cad - Create a new CHP-CAD incident
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { incidentId, type, location, description, severity, latitude, longitude, ...rest } = body;

    if (!incidentId || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: incidentId, location' },
        { status: 400 }
      );
    }

    // ✅ Ensure sequence is in sync
    await ensureTableSequence('traffic_chp_cad_incidents');

    const [newIncident] = await db
      .insert(trafficChpCadIncidents)
      .values({
        userId: session.user.id,
        incidentId,
        type: type || '',
        location: location || '',
        description: description || '',
        severity: severity || 'medium',
        latitude: latitude || null,
        longitude: longitude || null,
        logTime: new Date(),
        ...rest,
      })
      .returning();

    return NextResponse.json({ success: true, data: newIncident });
  } catch (error) {
    console.error('Traffic CHP-CAD API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CHP-CAD incident' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/chp-cad?id=1 - Full update of a CHP-CAD incident
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
        { success: false, error: 'Missing incident ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { incidentId, type, location, description, severity, latitude, longitude, ...rest } = body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'CHP-CAD incident not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(trafficChpCadIncidents)
      .set({
        incidentId: incidentId || existing.incidentId,
        type: type !== undefined ? type : existing.type,
        location: location !== undefined ? location : existing.location,
        description: description !== undefined ? description : existing.description,
        severity: severity || existing.severity,
        latitude: latitude !== undefined ? latitude : existing.latitude,
        longitude: longitude !== undefined ? longitude : existing.longitude,
        ...rest,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Traffic CHP-CAD API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CHP-CAD incident' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/chp-cad?id=1 - Partial update of a CHP-CAD incident
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
        { success: false, error: 'Missing incident ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { incidentId, type, location, description, severity, latitude, longitude, ...rest } = body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'CHP-CAD incident not found' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (incidentId !== undefined) updateData.incidentId = incidentId;
    if (type !== undefined) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (severity !== undefined) updateData.severity = severity;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    Object.keys(rest).forEach(key => {
      updateData[key] = rest[key];
    });

    const [updated] = await db
      .update(trafficChpCadIncidents)
      .set(updateData)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Traffic CHP-CAD API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CHP-CAD incident' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/chp-cad?id=1 - Delete a CHP-CAD incident
// ============================================
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
        { success: false, error: 'Missing incident ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'CHP-CAD incident not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Traffic CHP-CAD API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete CHP-CAD incident' },
      { status: 500 }
    );
  }
}