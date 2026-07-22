// app/api/traffic/calfire/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficCalfireIncidents } from '@/lib/schema/traffic';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/calfire - List CalFire incidents
// Query Parameters:
//   - id (optional): Get a single incident
//   - incidentId (optional): Filter by incident ID
//   - county (optional): Filter by county
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
    const incidentId = searchParams.get('incidentId');
    const county = searchParams.get('county');
    const status = searchParams.get('status');

    // Get a single incident by ID
    if (id) {
      const [incident] = await db
        .select()
        .from(trafficCalfireIncidents)
        .where(
          and(
            eq(trafficCalfireIncidents.id, parseInt(id)),
            eq(trafficCalfireIncidents.userId, userId)
          )
        )
        .limit(1);

      if (!incident) {
        return NextResponse.json(
          { success: false, error: 'Incident not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: incident,
      });
    }

    // Build query
    let query = db
      .select()
      .from(trafficCalfireIncidents)
      .where(eq(trafficCalfireIncidents.userId, userId));

    if (incidentId) {
      query = query.where(eq(trafficCalfireIncidents.incidentId, incidentId));
    }

    if (county) {
      query = query.where(eq(trafficCalfireIncidents.county, county));
    }

    if (status) {
      query = query.where(eq(trafficCalfireIncidents.status, status));
    }

    const incidents = await query.orderBy(desc(trafficCalfireIncidents.startedAt));

    return NextResponse.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    console.error('Error fetching CalFire incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/calfire - Create a new CalFire incident
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
    console.log('📝 POST /api/traffic/calfire - Request body:', body);

    const {
      incidentId,
      name,
      description,
      incidentType,
      status,
      severity,
      location,
      county,
      latitude,
      longitude,
      acresBurned,
      containment,
      reportedDate,
      updatedDate,
      isActive,
    } = body;

    // Validate required fields
    if (!incidentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: incidentId' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
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

    // Check if incidentId already exists
    const [existing] = await db
      .select()
      .from(trafficCalfireIncidents)
      .where(
        and(
          eq(trafficCalfireIncidents.incidentId, incidentId),
          eq(trafficCalfireIncidents.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Incident ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('traffic_calfire_incidents');

    const [newIncident] = await db
      .insert(trafficCalfireIncidents)
      .values({
        userId,
        incidentId,
        name,
        description: description || null,
        type: incidentType || 'Wildfire',
        status: status || 'active',
        county: county || null,
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        acresBurned: acresBurned || null,
        percentContained: containment || null,
        startedAt: reportedDate || null,
        updatedAt: updatedDate || null,
        isActive: isActive !== false,
        isCalFireIncident: true,
      })
      .returning();

    console.log('✅ CalFire incident created:', newIncident);

    return NextResponse.json({
      success: true,
      data: newIncident,
      message: 'Incident created successfully',
    });
  } catch (error) {
    console.error('Error creating CalFire incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/calfire - Update a CalFire incident
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
    console.log('📝 PUT /api/traffic/calfire - Request body:', body);

    const {
      incidentId,
      name,
      description,
      incidentType,
      status,
      severity,
      location,
      county,
      latitude,
      longitude,
      acresBurned,
      containment,
      reportedDate,
      updatedDate,
      isActive,
    } = body;

    const userId = session.user.id;

    // Verify incident exists
    const [existing] = await db
      .select()
      .from(trafficCalfireIncidents)
      .where(
        and(
          eq(trafficCalfireIncidents.id, parseInt(id)),
          eq(trafficCalfireIncidents.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    const [updatedIncident] = await db
      .update(trafficCalfireIncidents)
      .set({
        incidentId: incidentId || existing.incidentId,
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        type: incidentType || existing.type,
        status: status || existing.status,
        county: county !== undefined ? county : existing.county,
        location: location || existing.location,
        latitude: latitude !== undefined ? latitude : existing.latitude,
        longitude: longitude !== undefined ? longitude : existing.longitude,
        acresBurned: acresBurned !== undefined ? acresBurned : existing.acresBurned,
        percentContained: containment !== undefined ? containment : existing.percentContained,
        startedAt: reportedDate !== undefined ? reportedDate : existing.startedAt,
        updatedAt: updatedDate !== undefined ? updatedDate : existing.updatedAt,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        lastSeen: new Date(),
      })
      .where(
        and(
          eq(trafficCalfireIncidents.id, parseInt(id)),
          eq(trafficCalfireIncidents.userId, userId)
        )
      )
      .returning();

    console.log('✅ CalFire incident updated:', updatedIncident);

    return NextResponse.json({
      success: true,
      data: updatedIncident,
      message: 'Incident updated successfully',
    });
  } catch (error) {
    console.error('Error updating CalFire incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/calfire - Delete a CalFire incident
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
      .delete(trafficCalfireIncidents)
      .where(
        and(
          eq(trafficCalfireIncidents.id, parseInt(id)),
          eq(trafficCalfireIncidents.userId, userId)
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
    console.error('Error deleting CalFire incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete incident' },
      { status: 500 }
    );
  }
}