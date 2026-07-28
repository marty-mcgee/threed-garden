// app/api/traffic/chp-cases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficChpCases } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/chp-cases - List CHP Historical Cases
// Query Parameters:
//   - id (optional): Get a single case
//   - isActive (optional): Filter by active status
//   - isPublic (optional): Filter by public status
//   - severity (optional): Filter by severity (1-5)
//   - county (optional): Filter by county
//   - caseId (optional): Filter by case ID
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
    const severity = searchParams.get('severity');
    const county = searchParams.get('county');
    const caseId = searchParams.get('caseId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single case by ID
    if (id) {
      let query = db
        .select()
        .from(trafficChpCases)
        .where(eq(trafficChpCases.id, parseInt(id)));

      // Public users only see active public cases
      if (!userId) {
        query = query.where(
          and(
            eq(trafficChpCases.isPublic, true),
            eq(trafficChpCases.isActive, true)
          )
        );
      }

      const [chpCase] = await query.limit(1);

      if (!chpCase) {
        return NextResponse.json(
          { success: false, error: 'CHP case not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: chpCase,
      });
    }

    // ✅ Build base query
    let query = db
      .select()
      .from(trafficChpCases)
      .$dynamic();

    // ✅ Apply user filtering
    if (userId) {
      // Authenticated users see their cases + active public cases
      query = query.where(
        or(
          eq(trafficChpCases.userId, userId),
          and(
            eq(trafficChpCases.isPublic, true),
            eq(trafficChpCases.isActive, true)
          )
        )
      );
    } else {
      // Public users only see active public cases
      query = query.where(
        and(
          eq(trafficChpCases.isPublic, true),
          eq(trafficChpCases.isActive, true)
        )
      );
    }

    // ✅ Apply filters
    if (isActive !== null) {
      query = query.where(eq(trafficChpCases.isActive, isActive === 'true'));
    }

    if (isPublic !== null) {
      query = query.where(eq(trafficChpCases.isPublic, isPublic === 'true'));
    }

    if (severity) {
      query = query.where(eq(trafficChpCases.severity, parseInt(severity)));
    }

    if (county) {
      query = query.where(eq(trafficChpCases.county, county));
    }

    if (caseId) {
      query = query.where(eq(trafficChpCases.caseId, caseId));
    }

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficChpCases)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const cases = await query
      .orderBy(desc(trafficChpCases.occurredAt || trafficChpCases.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: cases,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching CHP cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CHP cases' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/chp-cases - Create CHP case (ADMIN ONLY)
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
    console.log('📝 POST /api/traffic/chp-cases - Request body:', body);

    const {
      caseId,
      sourceId,
      title,
      description,
      type,
      severity,
      location,
      latitude,
      longitude,
      address,
      city,
      county,
      zipCode,
      collisionType,
      weatherCondition,
      roadCondition,
      lightCondition,
      vehiclesInvolved,
      injuries,
      fatalities,
      occurredAt,
      reportedAt,
      rawData,
      notes,
      isActive,
      isPublic,
    } = body;

    // ✅ Validate required fields
    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: caseId' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if caseId already exists
    const [existing] = await db
      .select()
      .from(trafficChpCases)
      .where(
        and(
          eq(trafficChpCases.caseId, caseId),
          eq(trafficChpCases.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Case ID already exists' },
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

    // ✅ Helper function to handle severity (accepts string or number)
    const parseSeverity = (value: any) => {
      if (value === '' || value === null || value === undefined) {
        return 1;
      }
      // If it's a string like "moderate", map to a number
      if (typeof value === 'string') {
        const severityMap: Record<string, number> = {
          'low': 1,
          'moderate': 2,
          'medium': 2,
          'high': 3,
          'severe': 4,
          'critical': 5,
        };
        const mapped = severityMap[value.toLowerCase()];
        if (mapped !== undefined) return mapped;
        // Try to parse as number
        const parsed = parseInt(value);
        if (!isNaN(parsed)) return parsed;
        return 1;
      }
      // If it's a number, use it directly
      if (typeof value === 'number') {
        return Math.max(1, Math.min(5, value));
      }
      return 1;
    };

    // ✅ Auto-generate sourceId if not provided
    const finalSourceId = sourceId || `src_${Date.now()}`;

    // ✅ Auto-generate occurredAt if not provided (use current date/time)
    const finalOccurredAt = occurredAt ? new Date(occurredAt) : new Date();

    // ✅ Parse severity
    const finalSeverity = parseSeverity(severity);

    await ensureTableSequence('traffic_chp_cases');

    const [newCase] = await db
      .insert(trafficChpCases)
      .values({
        userId,
        caseId,
        sourceId: finalSourceId,
        title,
        description: description || null,
        type: type || 'traffic_collision',
        severity: finalSeverity,
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        address: address || null,
        city: city || null,
        county: county || null,
        zipCode: zipCode || null,
        collisionType: collisionType || null,
        weatherCondition: weatherCondition || null,
        roadCondition: roadCondition || null,
        lightCondition: lightCondition || null,
        vehiclesInvolved: parseNumeric(vehiclesInvolved) || 1,
        injuries: parseNumeric(injuries) || 0,
        fatalities: parseNumeric(fatalities) || 0,
        occurredAt: finalOccurredAt,
        reportedAt: reportedAt ? new Date(reportedAt) : null,
        rawData: rawData || null,
        notes: notes || null,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
      })
      .returning();

    console.log('✅ CHP case created:', newCase);

    return NextResponse.json({
      success: true,
      data: newCase,
      message: 'CHP case created successfully',
    });
  } catch (error) {
    console.error('Error creating CHP case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CHP case' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/chp-cases - Partial update (ADMIN ONLY)
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

    // ✅ Verify case exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficChpCases)
      .where(
        and(
          eq(trafficChpCases.id, parsedId),
          eq(trafficChpCases.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'CHP case not found' },
        { status: 404 }
      );
    }

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return parseInt(value);
    };

    // ✅ Helper function to handle severity (accepts string or number)
    const parseSeverity = (value: any) => {
      if (value === '' || value === null || value === undefined) {
        return undefined; // Don't update if not provided
      }
      // If it's a string like "moderate", map to a number
      if (typeof value === 'string') {
        const severityMap: Record<string, number> = {
          'low': 1,
          'moderate': 2,
          'medium': 2,
          'high': 3,
          'severe': 4,
          'critical': 5,
        };
        const mapped = severityMap[value.toLowerCase()];
        if (mapped !== undefined) return mapped;
        // Try to parse as number
        const parsed = parseInt(value);
        if (!isNaN(parsed)) return parsed;
        return undefined;
      }
      // If it's a number, use it directly
      if (typeof value === 'number') {
        return Math.max(1, Math.min(5, value));
      }
      return undefined;
    };

    // ✅ Handle date fields and numeric fields
    const updateData: any = { updatedAt: new Date() };

    if (body.caseId !== undefined) updateData.caseId = body.caseId;
    if (body.sourceId !== undefined) updateData.sourceId = body.sourceId;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.severity !== undefined) {
      const parsedSeverity = parseSeverity(body.severity);
      if (parsedSeverity !== undefined) updateData.severity = parsedSeverity;
    }
    if (body.location !== undefined) updateData.location = body.location;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode;
    if (body.collisionType !== undefined) updateData.collisionType = body.collisionType;
    if (body.weatherCondition !== undefined) updateData.weatherCondition = body.weatherCondition;
    if (body.roadCondition !== undefined) updateData.roadCondition = body.roadCondition;
    if (body.lightCondition !== undefined) updateData.lightCondition = body.lightCondition;
    if (body.vehiclesInvolved !== undefined) updateData.vehiclesInvolved = parseNumeric(body.vehiclesInvolved);
    if (body.injuries !== undefined) updateData.injuries = parseNumeric(body.injuries);
    if (body.fatalities !== undefined) updateData.fatalities = parseNumeric(body.fatalities);
    if (body.occurredAt !== undefined) updateData.occurredAt = new Date(body.occurredAt);
    if (body.reportedAt !== undefined) updateData.reportedAt = body.reportedAt ? new Date(body.reportedAt) : null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    const [updatedCase] = await db
      .update(trafficChpCases)
      .set(updateData)
      .where(
        and(
          eq(trafficChpCases.id, parsedId),
          eq(trafficChpCases.userId, userId)
        )
      )
      .returning();

    console.log('✅ CHP case updated:', updatedCase);

    return NextResponse.json({
      success: true,
      data: updatedCase,
      message: 'CHP case updated successfully',
    });
  } catch (error) {
    console.error('Error updating CHP case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CHP case' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/chp-cases - Delete case (ADMIN ONLY)
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
      .delete(trafficChpCases)
      .where(
        and(
          eq(trafficChpCases.id, parsedId),
          eq(trafficChpCases.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'CHP case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'CHP case deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting CHP case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete CHP case' },
      { status: 500 }
    );
  }
}