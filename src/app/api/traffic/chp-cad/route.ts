// app/api/traffic/chp-cad/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficChpCadIncidents, trafficChpCenters  } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

const INCIDENT_STATUSES = ['active', 'cleared', 'pending', 'unknown'] as const;

type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

function isIncidentStatus(value: string): value is IncidentStatus {
  return INCIDENT_STATUSES.some((status) => status === value);
}

// ============================================
// GET /api/traffic/chp-cad - List CHP-CAD incidents
// Query Parameters:
//   - id (optional): Get a single incident
//   - status (optional): Filter by status
//   - severity (optional): Filter by severity
//   - county (optional): Filter by county
//   - centerId (optional): Filter by center
//   - includeCenter (optional): Include center details
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
    const severity = searchParams.get('severity');
    const county = searchParams.get('county');
    const centerId = searchParams.get('centerId');
    const includeCenter = searchParams.get('includeCenter') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single incident by ID
    if (id) {
      const [incident] = await db
        .select()
        .from(trafficChpCadIncidents)
        .where(
          and(
            eq(trafficChpCadIncidents.id, parseInt(id)),
            userId
              ? or(
                  eq(trafficChpCadIncidents.userId, userId),
                  and(
                    eq(trafficChpCadIncidents.isPublic, true),
                    eq(trafficChpCadIncidents.isActive, true)
                  )
                )
              : and(
                  eq(trafficChpCadIncidents.isPublic, true),
                  eq(trafficChpCadIncidents.isActive, true)
                )
          )
        )
        .limit(1);

      if (!incident) {
        return NextResponse.json(
          { success: false, error: 'Incident not found' },
          { status: 404 }
        );
      }

      // Include center if requested
      let result: any = incident;
      if (includeCenter && incident.centerId) {
        const [center] = await db
          .select()
          .from(trafficChpCenters )
          .where(eq(trafficChpCenters .id, incident.centerId))
          .limit(1);
        result.center = center || null;
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    const conditions = [
      userId
        ? or(
            eq(trafficChpCadIncidents.userId, userId),
            and(
              eq(trafficChpCadIncidents.isPublic, true),
              eq(trafficChpCadIncidents.isActive, true)
            )
          )
        : and(
            eq(trafficChpCadIncidents.isPublic, true),
            eq(trafficChpCadIncidents.isActive, true)
          ),
    ];

    if (status) {
      if (!isIncidentStatus(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status parameter' },
          { status: 400 }
        );
      }
      conditions.push(eq(trafficChpCadIncidents.status, status));
    }

    if (severity) {
      conditions.push(eq(trafficChpCadIncidents.severity, parseInt(severity)));
    }

    if (county) {
      conditions.push(eq(trafficChpCadIncidents.county, county));
    }

    if (centerId) {
      conditions.push(eq(trafficChpCadIncidents.centerId, parseInt(centerId)));
    }

    const predicate = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficChpCadIncidents)
      .where(predicate);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const incidents = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(predicate)
      .orderBy(desc(trafficChpCadIncidents.reportedAt))
      .limit(limit)
      .offset(offset);

    // ✅ Include center if requested
    if (includeCenter) {
      const incidentsWithCenters = await Promise.all(
        incidents.map(async (incident) => {
          let result: any = { ...incident };
          if (incident.centerId) {
            const [center] = await db
              .select()
              .from(trafficChpCenters )
              .where(eq(trafficChpCenters .id, incident.centerId))
              .limit(1);
            result.center = center || null;
          }
          return result;
        })
      );
      return NextResponse.json({
        success: true,
        data: incidentsWithCenters,
        pagination: { limit, offset, total },
      });
    }

    return NextResponse.json({
      success: true,
      data: incidents,
      pagination: { limit, offset, total },
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
// POST /api/traffic/chp-cad - Create incident (ADMIN ONLY)
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

    // ✅ Required fields (align with schema)
    const { 
      title,
      incidentId,
      sourceId,
      reportedAt,
      type,
      status,
      severity,
      location,
      city,
      county,
      latitude,
      longitude,
      centerId,
      // Optional fields
      description,
      address,
      zipCode,
      chpDivision,
      chpOffice,
      logNumber,
      units,
      rawData,
      notes,
      isActive,
      isPublic,
    } = body;

    // ✅ Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

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

    if (!reportedAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: reportedAt' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Verify center exists if provided
    if (centerId) {
      const [center] = await db
        .select()
        .from(trafficChpCenters )
        .where(eq(trafficChpCenters .id, parseInt(centerId)))
        .limit(1);

      if (!center) {
        return NextResponse.json(
          { success: false, error: 'CHP CAD center not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Check if incidentId already exists for this user
    const [existing] = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.incidentId, incidentId),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Incident ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('traffic_chp_cad_incidents');

    const [newIncident] = await db
      .insert(trafficChpCadIncidents)
      .values({
        userId,
        incidentId,
        sourceId,
        title,
        description: description || null,
        type: type || 'other',
        status: status || 'active',
        severity: severity || 1,
        location: location || null,
        city: city || null,
        county: county || null,
        address: address || null,
        zipCode: zipCode || null,
        latitude: latitude || null,
        longitude: longitude || null,
        chpDivision: chpDivision || null,
        chpOffice: chpOffice || null,
        centerId: centerId || null,
        logNumber: logNumber || null,
        reportedAt: new Date(reportedAt).toISOString(),
        lastUpdated: new Date().toISOString(),
        units: units || [],
        rawData: rawData || null,
        notes: notes || null,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
      })
      .returning();

    console.log('✅ CHP-CAD incident created:', newIncident);

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
// PUT /api/traffic/chp-cad - Full update (ADMIN ONLY)
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
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parsedId),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    // ✅ Verify center exists if provided
    if (body.centerId) {
      const [center] = await db
        .select()
        .from(trafficChpCenters )
        .where(eq(trafficChpCenters .id, parseInt(body.centerId)))
        .limit(1);

      if (!center) {
        return NextResponse.json(
          { success: false, error: 'CHP CAD center not found' },
          { status: 404 }
        );
      }
    }

    const [updatedIncident] = await db
      .update(trafficChpCadIncidents)
      .set({
        ...body,
        reportedAt: body.reportedAt ? new Date(body.reportedAt) : existing.reportedAt,
        clearedAt: body.clearedAt ? new Date(body.clearedAt) : existing.clearedAt,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficChpCadIncidents.id, parsedId),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .returning();

    console.log('✅ CHP-CAD incident updated:', updatedIncident);

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
// PATCH /api/traffic/chp-cad - Partial update (ADMIN ONLY)
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
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parsedId),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    // ✅ Handle date fields
    const updateData: any = { ...body, updatedAt: new Date() };
    if (body.reportedAt) updateData.reportedAt = new Date(body.reportedAt);
    if (body.clearedAt) updateData.clearedAt = new Date(body.clearedAt);
    updateData.lastUpdated = new Date();

    const [updatedIncident] = await db
      .update(trafficChpCadIncidents)
      .set(updateData)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parsedId),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .returning();

    console.log('✅ CHP-CAD incident patched:', updatedIncident);

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
// DELETE /api/traffic/chp-cad - Delete incident (ADMIN ONLY)
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
      .delete(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parsedId),
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
