// app/api/traffic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { traffic } from '@/lib/schema/traffic';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic - List all Traffic modules
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    let query = db.select().from(traffic);

    // Filter by user or public
    if (userId) {
      query = query.where(eq(traffic.userId, userId));
    } else {
      query = query.where(eq(traffic.isPublic, true));
    }

    // Filter by active status
    if (isActive !== null) {
      query = query.where(eq(traffic.isActive, isActive === 'true'));
    }

    // Search by name or description
    if (search) {
      query = query.where(
        sql`${traffic.name} ILIKE ${`%${search}%`} OR ${traffic.description} ILIKE ${`%${search}%`}`
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(traffic)
      .where(query._where);

    const results = await query
      .orderBy(desc(traffic.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        total: countResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching traffic modules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch traffic modules' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic - Create a Traffic module
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, slug, isActive, isPublic, config, metadata, dataSources, mapConfig } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, slug' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    await ensureTableSequence('traffic');

    const [newModule] = await db
      .insert(traffic)
      .values({
        userId,
        moduleId: `traffic_${Date.now()}`,
        name,
        description: description || null,
        slug,
        isActive: isActive ?? true,
        isPublic: isPublic ?? false,
        config: config || {},
        metadata: metadata || {},
        dataSources: dataSources || {
          chpCad: true,
          chpCases: true,
          caltransClosures: true,
          bayArea511: true,
          calfire: true,
          cctv: true
        },
        mapConfig: mapConfig || {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 10,
          layers: ['incidents', 'closures', 'cameras']
        },
      })
      .returning();

    return NextResponse.json({ success: true, data: newModule });
  } catch (error) {
    console.error('Error creating traffic module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create traffic module' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic?id=1 - Update a Traffic module
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

    // Verify ownership
    const [existing] = await db
      .select()
      .from(traffic)
      .where(and(eq(traffic.id, parsedId), eq(traffic.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Traffic module not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(traffic)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(traffic.id, parsedId), eq(traffic.userId, userId)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating traffic module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update traffic module' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic?id=1 - Delete a Traffic module
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
      .delete(traffic)
      .where(and(eq(traffic.id, parsedId), eq(traffic.userId, userId)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Traffic module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Error deleting traffic module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete traffic module' },
      { status: 500 }
    );
  }
}