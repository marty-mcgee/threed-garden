// app/api/threed/layers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedLayers } from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/layers - List ThreeD Layers for a project
// Query Parameters:
//   - id (optional): Get a single layer
//   - projectId (optional): Filter by project (via project_assets)
//   - isActive (optional): Filter by active status
//   - isVisible (optional): Filter by visibility
//   - search (optional): Search by name, layerId, or description
//   - limit (optional): Number of records (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const isActive = searchParams.get('isActive');
    const isVisible = searchParams.get('isVisible');
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

    // ✅ Build query - start with user filter
    let conditions: any[] = [eq(threedLayers.userId, userId)];

    // ✅ If projectId is provided, filter layers via project_assets
    let layerIds: number[] = [];
    if (projectId) {
      const parsedProjectId = parseInt(projectId);
      if (!isNaN(parsedProjectId)) {
        // Get layer IDs from project_assets for this project
        const assetLinks = await db
          .select({
            assetId: projectAssets.assetId,
          })
          .from(projectAssets)
          .where(
            and(
              eq(projectAssets.projectId, parsedProjectId),
              eq(projectAssets.assetType, 'threed_layers'),
              eq(projectAssets.userId, userId),
              eq(projectAssets.isActive, true)
            )
          );

        layerIds = assetLinks.map(link => link.assetId);

        // If no layers found for this project, return empty
        if (layerIds.length === 0) {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { limit, offset, total: 0 },
          });
        }

        // Add layer ID filter
        conditions.push(inArray(threedLayers.id, layerIds));
      }
    }

    // ✅ Apply other filters
    if (isActive !== null) {
      conditions.push(eq(threedLayers.isActive, isActive === 'true'));
    }

    if (isVisible !== null) {
      conditions.push(eq(threedLayers.isVisible, isVisible === 'true'));
    }

    if (search) {
      conditions.push(
        sql`${threedLayers.name} ILIKE ${`%${search}%`} OR 
            ${threedLayers.layerId} ILIKE ${`%${search}%`} OR
            ${threedLayers.description} ILIKE ${`%${search}%`}`
      );
    }

    // ✅ Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedLayers)
      .where(and(...conditions));

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await db
      .select()
      .from(threedLayers)
      .where(and(...conditions))
      .orderBy(desc(threedLayers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        total,
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
      layerId,
      name,
      description,
      config,
      category,
      layerType,
      orderIndex,
      isVisible,
      isActive,
      isPublic,
      metadata,
    } = body;

    if (!layerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: layerId' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
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

    await ensureTableSequence('threed_layers');

    const [newLayer] = await db
      .insert(threedLayers)
      .values({
        userId,
        layerId,
        name,
        description: description || null,
        config: config || { 
          visible: true, 
          opacity: 1.0, 
          color: '#ffffff',
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        category: category || null,
        layerType: layerType || null,
        orderIndex: orderIndex || 0,
        isVisible: isVisible ?? true,
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

    // ✅ Also remove from project_assets
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_layers'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

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
