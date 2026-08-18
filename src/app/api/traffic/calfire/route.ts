// app/api/traffic/calfire/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficCalfireIncidents } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

const INCIDENT_STATUSES = ['active', 'cleared', 'pending', 'unknown'] as const;

type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

function isIncidentStatus(value: string): value is IncidentStatus {
  return INCIDENT_STATUSES.some((status) => status === value);
}

// ============================================
// GET /api/traffic/calfire - List CalFire Incidents
// Query Parameters:
//   - id (optional): Get a single incident
//   - isActive (optional): Filter by active status
//   - isPublic (optional): Filter by public status
//   - status (optional): Filter by incident status (active, cleared, etc.)
//   - severity (optional): Filter by severity (1-5)
//   - county (optional): Filter by county
//   - fireType (optional): Filter by fire type
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
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const county = searchParams.get('county');
    const fireType = searchParams.get('fireType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single incident by ID
    if (id) {
      const [incident] = await db
        .select()
        .from(trafficCalfireIncidents)
        .where(
          and(
            eq(trafficCalfireIncidents.id, parseInt(id)),
            userId
              ? undefined
              : and(
                  eq(trafficCalfireIncidents.isPublic, true),
                  eq(trafficCalfireIncidents.isActive, true)
                )
          )
        )
        .limit(1);

      if (!incident) {
        return NextResponse.json(
          { success: false, error: 'CalFire incident not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: incident,
      });
    }

    const conditions = [
      userId
        ? or(
            eq(trafficCalfireIncidents.userId, userId),
            and(
              eq(trafficCalfireIncidents.isPublic, true),
              eq(trafficCalfireIncidents.isActive, true)
            )
          )
        : and(
            eq(trafficCalfireIncidents.isPublic, true),
            eq(trafficCalfireIncidents.isActive, true)
          ),
    ];

    if (isActive !== null) {
      conditions.push(eq(trafficCalfireIncidents.isActive, isActive === 'true'));
    }

    if (isPublic !== null) {
      conditions.push(eq(trafficCalfireIncidents.isPublic, isPublic === 'true'));
    }

    if (status) {
      if (!isIncidentStatus(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status parameter' },
          { status: 400 }
        );
      }
      conditions.push(eq(trafficCalfireIncidents.status, status));
    }

    if (severity) {
      conditions.push(eq(trafficCalfireIncidents.severity, parseInt(severity)));
    }

    if (county) {
      conditions.push(eq(trafficCalfireIncidents.county, county));
    }

    if (fireType) {
      conditions.push(eq(trafficCalfireIncidents.fireType, fireType));
    }

    const predicate = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficCalfireIncidents)
      .where(predicate);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const incidents = await db
      .select()
      .from(trafficCalfireIncidents)
      .where(predicate)
      .orderBy(desc(trafficCalfireIncidents.reportedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: incidents,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching CalFire incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CalFire incidents' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/calfire - Create CalFire incident (ADMIN ONLY)
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
      sourceId,
      title,
      description,
      incidentType,
      status,
      location,
      latitude,
      longitude,
      address,
      city,
      county,
      acreage,
      containment,
      cause,
      fireType,
      evacuations,
      reportedAt,
      containedAt,
      lastUpdated,
      rawData,
      notes,
      isActive,
      isPublic,
      severity,
    } = body;

    // ✅ Validate required fields
    if (!incidentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: incidentId' },
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

    if (status && !isIncidentStatus(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if incidentId already exists
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

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return parseInt(value);
    };

    await ensureTableSequence('traffic_calfire_incidents');

    const [newIncident] = await db
      .insert(trafficCalfireIncidents)
      .values({
        userId,
        incidentId,
        sourceId,
        title,
        description: description || null,
        incidentType: incidentType || 'wildfire',
        status: status || 'active',
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        address: address || null,
        city: city || null,
        county: county || null,
        acreage: parseNumeric(acreage),
        containment: parseNumeric(containment),
        cause: cause || null,
        fireType: fireType || null,
        evacuations: evacuations || null,
        reportedAt: new Date(reportedAt).toISOString(),
        containedAt: containedAt ? new Date(containedAt).toISOString() : null,
        lastUpdated: new Date(lastUpdated || Date.now()).toISOString(),
        rawData: rawData || null,
        notes: notes || null,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
        severity: severity || 1,
      })
      .returning();

    console.log('✅ CalFire incident created:', newIncident);

    return NextResponse.json({
      success: true,
      data: newIncident,
      message: 'CalFire incident created successfully',
    });
  } catch (error) {
    console.error('Error creating CalFire incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CalFire incident' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/calfire - Partial update (ADMIN ONLY)
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

    // ✅ Verify incident exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficCalfireIncidents)
      .where(
        and(
          eq(trafficCalfireIncidents.id, parsedId),
          eq(trafficCalfireIncidents.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'CalFire incident not found' },
        { status: 404 }
      );
    }

    if (body.status !== undefined && !isIncidentStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return parseInt(value);
    };

    // ✅ Handle date fields and numeric fields
    const updateData: any = { updatedAt: new Date() };

    if (body.incidentId !== undefined) updateData.incidentId = body.incidentId;
    if (body.sourceId !== undefined) updateData.sourceId = body.sourceId;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.incidentType !== undefined) updateData.incidentType = body.incidentType;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.acreage !== undefined) updateData.acreage = parseNumeric(body.acreage);
    if (body.containment !== undefined) updateData.containment = parseNumeric(body.containment);
    if (body.cause !== undefined) updateData.cause = body.cause;
    if (body.fireType !== undefined) updateData.fireType = body.fireType;
    if (body.evacuations !== undefined) updateData.evacuations = body.evacuations;
    if (body.reportedAt !== undefined) updateData.reportedAt = new Date(body.reportedAt).toISOString();
    if (body.containedAt !== undefined) {
      updateData.containedAt = body.containedAt
        ? new Date(body.containedAt).toISOString()
        : null;
    }
    if (body.lastUpdated !== undefined) {
      updateData.lastUpdated = new Date(body.lastUpdated).toISOString();
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.severity !== undefined) updateData.severity = body.severity;

    const [updatedIncident] = await db
      .update(trafficCalfireIncidents)
      .set(updateData)
      .where(
        and(
          eq(trafficCalfireIncidents.id, parsedId),
          eq(trafficCalfireIncidents.userId, userId)
        )
      )
      .returning();

    console.log('✅ CalFire incident updated:', updatedIncident);

    return NextResponse.json({
      success: true,
      data: updatedIncident,
      message: 'CalFire incident updated successfully',
    });
  } catch (error) {
    console.error('Error updating CalFire incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CalFire incident' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/calfire - Delete incident (ADMIN ONLY)
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
      .delete(trafficCalfireIncidents)
      .where(
        and(
          eq(trafficCalfireIncidents.id, parsedId),
          eq(trafficCalfireIncidents.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'CalFire incident not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'CalFire incident deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting CalFire incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete CalFire incident' },
      { status: 500 }
    );
  }
}
