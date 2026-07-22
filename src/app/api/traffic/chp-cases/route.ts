// app/api/traffic/chp-cases/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficChpCases } from '@/lib/schema/traffic';
import { eq, and, desc } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/chp-cases - List CHP cases
// Query Parameters:
//   - id (optional): Get a single case
//   - caseId (optional): Filter by case ID
//   - county (optional): Filter by county
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
    const caseId = searchParams.get('caseId');
    const county = searchParams.get('county');

    // Get a single case by ID
    if (id) {
      const [chpCase] = await db
        .select()
        .from(trafficChpCases)
        .where(
          and(
            eq(trafficChpCases.id, parseInt(id)),
            eq(trafficChpCases.userId, userId)
          )
        )
        .limit(1);

      if (!chpCase) {
        return NextResponse.json(
          { success: false, error: 'Case not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: chpCase,
      });
    }

    // Build query
    let query = db
      .select()
      .from(trafficChpCases)
      .where(eq(trafficChpCases.userId, userId));

    if (caseId) {
      query = query.where(eq(trafficChpCases.caseId, caseId));
    }

    if (county) {
      query = query.where(eq(trafficChpCases.county, county));
    }

    const cases = await query.orderBy(desc(trafficChpCases.collisionDate));

    return NextResponse.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error('Error fetching CHP cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/chp-cases - Create a new CHP case
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
      incidentId,
      title,
      description,
      caseType,
      status,
      severity,
      location,
      city,
      county,
      latitude,
      longitude,
      reportedDate,
      resolvedDate,
      isActive,
    } = body;

    // Validate required fields
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

    // Check if caseId already exists
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

    await ensureTableSequence('traffic_chp_cases');

    const [newCase] = await db
      .insert(trafficChpCases)
      .values({
        userId,
        caseId,
        incidentId: incidentId || null,
        title,
        description: description || null,
        caseType: caseType || 'collision',
        status: status || 'active',
        severity: severity || 'moderate',
        location: location || null,
        city: city || null,
        county: county || null,
        latitude: latitude || null,
        longitude: longitude || null,
        reportedDate: reportedDate || null,
        resolvedDate: resolvedDate || null,
        isActive: isActive !== false,
      })
      .returning();

    console.log('✅ CHP case created:', newCase);

    return NextResponse.json({
      success: true,
      data: newCase,
      message: 'Case created successfully',
    });
  } catch (error) {
    console.error('Error creating CHP case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create case' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/traffic/chp-cases - Update a CHP case
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
    console.log('📝 PUT /api/traffic/chp-cases - Request body:', body);

    const {
      caseId,
      incidentId,
      title,
      description,
      caseType,
      status,
      severity,
      location,
      city,
      county,
      latitude,
      longitude,
      reportedDate,
      resolvedDate,
      isActive,
    } = body;

    const userId = session.user.id;

    // Verify case exists
    const [existing] = await db
      .select()
      .from(trafficChpCases)
      .where(
        and(
          eq(trafficChpCases.id, parseInt(id)),
          eq(trafficChpCases.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    const [updatedCase] = await db
      .update(trafficChpCases)
      .set({
        caseId: caseId || existing.caseId,
        incidentId: incidentId !== undefined ? incidentId : existing.incidentId,
        title: title || existing.title,
        description: description !== undefined ? description : existing.description,
        caseType: caseType || existing.caseType,
        status: status || existing.status,
        severity: severity || existing.severity,
        location: location !== undefined ? location : existing.location,
        city: city !== undefined ? city : existing.city,
        county: county !== undefined ? county : existing.county,
        latitude: latitude !== undefined ? latitude : existing.latitude,
        longitude: longitude !== undefined ? longitude : existing.longitude,
        reportedDate: reportedDate !== undefined ? reportedDate : existing.reportedDate,
        resolvedDate: resolvedDate !== undefined ? resolvedDate : existing.resolvedDate,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trafficChpCases.id, parseInt(id)),
          eq(trafficChpCases.userId, userId)
        )
      )
      .returning();

    console.log('✅ CHP case updated:', updatedCase);

    return NextResponse.json({
      success: true,
      data: updatedCase,
      message: 'Case updated successfully',
    });
  } catch (error) {
    console.error('Error updating CHP case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/chp-cases - Delete a CHP case
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
      .delete(trafficChpCases)
      .where(
        and(
          eq(trafficChpCases.id, parseInt(id)),
          eq(trafficChpCases.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Case deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting CHP case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}