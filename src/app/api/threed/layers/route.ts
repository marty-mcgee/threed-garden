// app/api/threed/layers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedLayers } from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/layers - List ThreeD Layers
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleId = searchParams.get('moduleId');
    const parentLayerId = searchParams.get('parentLayerId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Get a single layer by ID
    if (id) {
      const [layer] = await db
        .select()
        .from(threedLayers)
        .where(
          and(
            eq(threedLayers.id, parseInt(id)),
            eq(threedLayers.userId, userId)
          )
        )
        .limit(1);

      if (!layer) {
        return NextResponse.json(
          { success: false, error: 'Layer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: layer,
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedLayers)
      .where(eq(threedLayers.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (moduleId) {
      query = query.where(eq(threedLayers.moduleId, parseInt(moduleId)));
    }

    if (parentLayerId) {
      query = query.where(eq(threedLayers.parentLayerId, parseInt(parentLayerId)));
    } else if (parentLayerId === null) {
      query = query.where(sql`${threedLayers.parentLayerId} IS NULL`);
    }

    if (isActive !== null) {
      query = query.where(eq(threedLayers.isActive, isActive === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedLayers.name} ILIKE ${`%${search}%`} OR 
            ${threedLayers.description} ILIKE ${`%${search}%`}`
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedLayers)
      .where(query._where);

    const results = await query
      .orderBy(desc(threedLayers.createdAt))
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
    console.error('Error fetching layers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layers' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/layers - Create ThreeD Layer
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 POST /api/threed/layers - Request body:', body);

    const {
      moduleId,
      moduleType,
      name,
      description,
      layerId,
      config,
      category,
      layerType,
      parentLayerId,
      orderIndex,
      isVisible,
      isLocked,
      isActive,
      isPublic,
      metadata,
    } = body;

    // ✅ Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!layerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: layerId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if layerId already exists
    const [existing] = await db
      .select()
      .from(threedLayers)
      .where(
        and(
          eq(threedLayers.layerId, layerId),
          eq(threedLayers.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Layer ID already exists' },
        { status: 409 }
      );
    }

    // ✅ Verify parent layer exists if provided
    if (parentLayerId) {
      const [parent] = await db
        .select()
        .from(threedLayers)
        .where(
          and(
            eq(threedLayers.id, parseInt(parentLayerId)),
            eq(threedLayers.userId, userId)
          )
        )
        .limit(1);

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent layer not found' },
          { status: 404 }
        );
      }
    }

    await ensureTableSequence('threed_layers');

    const [newLayer] = await db
      .insert(threedLayers)
      .values({
        userId,
        moduleId: moduleId || null,
        moduleType: moduleType || 'threed',
        name,
        description: description || null,
        layerId,
        config: config || { visible: true, opacity: 1.0, color: '#ffffff' },
        category: category || null,
        layerType: layerType || null,
        parentLayerId: parentLayerId || null,
        orderIndex: orderIndex || 0,
        isVisible: isVisible ?? true,
        isLocked: isLocked ?? false,
        isActive: isActive ?? true,
        isPublic: isPublic ?? false,
        metadata: metadata || {},
      })
      .returning();

    console.log('✅ ThreeD layer created:', newLayer);

    return NextResponse.json({
      success: true,
      data: newLayer,
      message: 'Layer created successfully',
    });
  } catch (error) {
    console.error('Error creating layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create layer' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/layers?id=1 - Full update
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

    // ✅ Verify layer exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedLayers)
      .where(
        and(
          eq(threedLayers.id, parsedId),
          eq(threedLayers.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Layer not found' },
        { status: 404 }
      );
    }

    // ✅ Verify parent layer exists if provided
    if (body.parentLayerId) {
      const [parent] = await db
        .select()
        .from(threedLayers)
        .where(
          and(
            eq(threedLayers.id, parseInt(body.parentLayerId)),
            eq(threedLayers.userId, userId)
          )
        )
        .limit(1);

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent layer not found' },
          { status: 404 }
        );
      }
    }

    const [updated] = await db
      .update(threedLayers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedLayers.id, parsedId),
          eq(threedLayers.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD layer updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Layer updated successfully',
    });
  } catch (error) {
    console.error('Error updating layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layer' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/layers?id=1 - Partial update
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

    // ✅ Verify layer exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedLayers)
      .where(
        and(
          eq(threedLayers.id, parsedId),
          eq(threedLayers.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Layer not found' },
        { status: 404 }
      );
    }

    // ✅ Verify parent layer exists if provided
    if (body.parentLayerId) {
      const [parent] = await db
        .select()
        .from(threedLayers)
        .where(
          and(
            eq(threedLayers.id, parseInt(body.parentLayerId)),
            eq(threedLayers.userId, userId)
          )
        )
        .limit(1);

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent layer not found' },
          { status: 404 }
        );
      }
    }

    const [updated] = await db
      .update(threedLayers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedLayers.id, parsedId),
          eq(threedLayers.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD layer patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Layer updated successfully',
    });
  } catch (error) {
    console.error('Error updating layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layer' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/layers?id=1 - Delete layer
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
      .delete(threedLayers)
      .where(
        and(
          eq(threedLayers.id, parsedId),
          eq(threedLayers.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Layer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Layer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting layer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete layer' },
      { status: 500 }
    );
  }
}