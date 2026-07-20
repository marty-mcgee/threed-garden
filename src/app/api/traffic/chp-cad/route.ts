// app/api/traffic/chp-cad/route.ts - Fixed to match schema

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficChpCadIncidents } from '@/lib/schema/traffic';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/chp-cad
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

    if (id) {
      const [incident] = await db
        .select()
        .from(trafficChpCadIncidents)
        .where(
          and(
            eq(trafficChpCadIncidents.id, parseInt(id)),
            eq(trafficChpCadIncidents.userId, userId)
          )
        )
        .limit(1);

      return NextResponse.json({
        success: true,
        data: incident || null,
      });
    }

    const incidents = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(eq(trafficChpCadIncidents.userId, userId))
      .orderBy(desc(trafficChpCadIncidents.createdAt));

    return NextResponse.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    console.error('Error fetching CHP-CAD incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/chp-cad - Create a new incident
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
    console.log('📝 POST /api/traffic/chp-cad - Request body:', body);

    // ✅ Extract fields matching your schema
    const {
      sourceId,        // ✅ This is the unique identifier (was incidentId)
      incidentType,
      location,
      city,
      county,
      details,
      status,
      latitude,
      longitude,
      logTime,
      trafficId,
      centerId,
    } = body;

    // ✅ Validate required fields (based on your schema)
    if (!sourceId) {
      console.log('❌ Missing sourceId');
      return NextResponse.json(
        { success: false, error: 'Missing required field: sourceId' },
        { status: 400 }
      );
    }

    // ✅ Location OR city is required (at least one)
    if (!location && !city) {
      console.log('❌ Missing location or city');
      return NextResponse.json(
        { success: false, error: 'Missing required field: location or city' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    await ensureTableSequence('traffic_chp_cad_incidents');

    // ✅ Insert using your schema field names
    const [newIncident] = await db
      .insert(trafficChpCadIncidents)
      .values({
        userId,
        sourceId,                    // ✅ Unique identifier
        trafficId: trafficId || null,
        centerId: centerId || null,
        incidentType: incidentType || null,
        location: location || null,
        city: city || null,
        county: county || null,
        latitude: latitude || null,
        longitude: longitude || null,
        logTime: logTime ? new Date(logTime) : null,
        details: details || null,
        status: status || 'active',
      })
      .returning();

    console.log('✅ Created incident:', newIncident);

    return NextResponse.json({
      success: true,
      data: newIncident,
      message: 'Incident created successfully',
    });
  } catch (error) {
    console.error('Error creating CHP-CAD incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/chp-cad - Update an incident
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
    console.log('📝 PUT /api/traffic/chp-cad - Request body:', body);

    const {
      sourceId,
      incidentType,
      location,
      city,
      county,
      details,
      status,
      latitude,
      longitude,
      logTime,
      trafficId,
      centerId,
    } = body;

    const userId = session.user.id;

    // ✅ Update using your schema field names
    const [updatedIncident] = await db
      .update(trafficChpCadIncidents)
      .set({
        sourceId,
        trafficId: trafficId || null,
        centerId: centerId || null,
        incidentType: incidentType || null,
        location: location || null,
        city: city || null,
        county: county || null,
        latitude: latitude || null,
        longitude: longitude || null,
        logTime: logTime ? new Date(logTime) : null,
        details: details || null,
        status: status || 'active',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .returning();

    if (!updatedIncident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    console.log('✅ Updated incident:', updatedIncident);

    return NextResponse.json({
      success: true,
      data: updatedIncident,
      message: 'Incident updated successfully',
    });
  } catch (error) {
    console.error('Error updating CHP-CAD incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/chp-cad - Delete an incident
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
      .delete(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Incident deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting CHP-CAD incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete incident' },
      { status: 500 }
    );
  }
}