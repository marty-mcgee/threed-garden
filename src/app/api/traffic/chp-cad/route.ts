// app/api/traffic/chp-cad/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficChpCadIncidents, trafficChpCadCenters, traffic } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/chp-cad - List incidents (PUBLIC)
// Query Parameters:
//   - id (optional): Get a single incident
//   - status (optional): Filter by status
//   - severity (optional): Filter by severity
//   - county (optional): Filter by county
//   - centerId (optional): Filter by center
//   - trafficId (optional): Filter by traffic module
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
    const trafficId = searchParams.get('trafficId');
    const includeCenter = searchParams.get('includeCenter') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single incident by ID
    if (id) {
      let query = db
        .select()
        .from(trafficChpCadIncidents)
        .where(eq(trafficChpCadIncidents.id, parseInt(id)));

      // Public users only see active incidents
      if (!userId) {
        query = query.where(eq(trafficChpCadIncidents.status, 'active'));
      }

      const [incident] = await query.limit(1);

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
          .from(trafficChpCadCenters)
          .where(eq(trafficChpCadCenters.id, incident.centerId))
          .limit(1);
        result.center = center || null;
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // ✅ Build base query
    let query = db
      .select()
      .from(trafficChpCadIncidents)
      .$dynamic();

    // ✅ Apply user filtering
    if (userId) {
      // Authenticated users see their incidents + active public incidents
      query = query.where(
        or(
          eq(trafficChpCadIncidents.userId, userId),
          eq(trafficChpCadIncidents.status, 'active')
        )
      );
    } else {
      // Public users only see active incidents
      query = query.where(eq(trafficChpCadIncidents.status, 'active'));
    }

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(trafficChpCadIncidents.status, status));
    }

    if (severity) {
      query = query.where(eq(trafficChpCadIncidents.severity, severity));
    }

    if (county) {
      query = query.where(eq(trafficChpCadIncidents.county, county));
    }

    if (centerId) {
      query = query.where(eq(trafficChpCadIncidents.centerId, parseInt(centerId)));
    }

    if (trafficId) {
      query = query.where(eq(trafficChpCadIncidents.trafficId, parseInt(trafficId)));
    }

    // ✅ Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(trafficChpCadIncidents)
      .where(query._where);

    const [countResult] = await countQuery;
    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const incidents = await query
      .orderBy(desc(trafficChpCadIncidents.logTime))
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
              .from(trafficChpCadCenters)
              .where(eq(trafficChpCadCenters.id, incident.centerId))
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

    const { 
      sourceId,
      incidentType,
      location,
      city,
      county,
      details,
      severity,
      status,
      latitude,
      longitude,
      logTime,
      centerId,
      trafficId,
    } = body;

    // ✅ Validate required fields
    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sourceId' },
        { status: 400 }
      );
    }

    if (!location && !city) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: location or city' },
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

    // ✅ Verify center exists if provided
    if (centerId) {
      const [center] = await db
        .select()
        .from(trafficChpCadCenters)
        .where(eq(trafficChpCadCenters.id, parseInt(centerId)))
        .limit(1);

      if (!center) {
        return NextResponse.json(
          { success: false, error: 'CHP CAD center not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Check if sourceId already exists
    const [existing] = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.sourceId, sourceId),
          eq(trafficChpCadIncidents.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Source ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('traffic_chp_cad_incidents');

    const [newIncident] = await db
      .insert(trafficChpCadIncidents)
      .values({
        userId,
        trafficId: trafficId || null,
        sourceId,
        incidentType: incidentType || null,
        location: location || null,
        city: city || null,
        county: county || null,
        details: details || null,
        severity: severity || 'moderate',
        status: status || 'active',
        latitude: latitude || null,
        longitude: longitude || null,
        logTime: logTime ? new Date(logTime) : null,
        centerId: centerId || null,
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
// PUT /api/traffic/chp-cad - Update incident (ADMIN ONLY)
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
      severity,
      status,
      latitude,
      longitude,
      logTime,
      centerId,
      trafficId,
    } = body;

    const userId = session.user.id;

    // ✅ Verify incident exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
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

    // ✅ Verify center exists if provided
    if (centerId) {
      const [center] = await db
        .select()
        .from(trafficChpCadCenters)
        .where(eq(trafficChpCadCenters.id, parseInt(centerId)))
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
        sourceId: sourceId || existing.sourceId,
        incidentType: incidentType || existing.incidentType,
        location: location || existing.location,
        city: city !== undefined ? city : existing.city,
        county: county !== undefined ? county : existing.county,
        details: details !== undefined ? details : existing.details,
        severity: severity || existing.severity,
        status: status || existing.status,
        latitude: latitude !== undefined ? latitude : existing.latitude,
        longitude: longitude !== undefined ? longitude : existing.longitude,
        logTime: logTime ? new Date(logTime) : existing.logTime,
        centerId: centerId !== undefined ? centerId : existing.centerId,
        trafficId: trafficId !== undefined ? trafficId : existing.trafficId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficChpCadIncidents.id, parseInt(id)),
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