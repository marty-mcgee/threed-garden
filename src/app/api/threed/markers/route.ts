// app/api/threed/markers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedMarkers, threedLayers, threedModels, threedCharacters, threedPlants, threedBeds } from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/markers - List ThreeD Markers
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
    const layerId = searchParams.get('layerId');
    const markerType = searchParams.get('markerType');
    const parentMarkerId = searchParams.get('parentMarkerId');
    const isActive = searchParams.get('isActive');
    const isVisible = searchParams.get('isVisible');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Get a single marker by ID
    if (id) {
      const [marker] = await db
        .select()
        .from(threedMarkers)
        .where(
          and(
            eq(threedMarkers.id, parseInt(id)),
            eq(threedMarkers.userId, userId)
          )
        )
        .limit(1);

      if (!marker) {
        return NextResponse.json(
          { success: false, error: 'Marker not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: marker,
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedMarkers)
      .where(eq(threedMarkers.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (moduleId) {
      query = query.where(eq(threedMarkers.moduleId, parseInt(moduleId)));
    }

    if (layerId) {
      query = query.where(eq(threedMarkers.layerId, parseInt(layerId)));
    }

    if (markerType) {
      query = query.where(eq(threedMarkers.markerType, markerType));
    }

    if (parentMarkerId) {
      query = query.where(eq(threedMarkers.parentMarkerId, parseInt(parentMarkerId)));
    } else if (parentMarkerId === null) {
      query = query.where(sql`${threedMarkers.parentMarkerId} IS NULL`);
    }

    if (isActive !== null) {
      query = query.where(eq(threedMarkers.isActive, isActive === 'true'));
    }

    if (isVisible !== null) {
      query = query.where(eq(threedMarkers.isVisible, isVisible === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedMarkers.name} ILIKE ${`%${search}%`} OR 
            ${threedMarkers.description} ILIKE ${`%${search}%`} OR
            ${threedMarkers.label} ILIKE ${`%${search}%`}`
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedMarkers)
      .where(query._where);

    const results = await query
      .orderBy(desc(threedMarkers.createdAt))
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
    console.error('Error fetching markers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch markers' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/markers - Create ThreeD Marker
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 POST /api/threed/markers - Request body:', body);

    const {
      moduleId,
      moduleType,
      name,
      description,
      markerId,
      position,
      rotation,
      scale,
      markerType,
      color,
      size,
      icon,
      label,
      content,
      layerId,
      parentMarkerId,
      modelId,
      characterId,
      plantId,
      bedId,
      data,
      isVisible,
      isInteractive,
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

    if (!markerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: markerId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if markerId already exists
    const [existing] = await db
      .select()
      .from(threedMarkers)
      .where(
        and(
          eq(threedMarkers.markerId, markerId),
          eq(threedMarkers.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Marker ID already exists' },
        { status: 409 }
      );
    }

    // ✅ Verify layer exists if provided
    if (layerId) {
      const [layer] = await db
        .select()
        .from(threedLayers)
        .where(
          and(
            eq(threedLayers.id, parseInt(layerId)),
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
    }

    // ✅ Verify parent marker exists if provided
    if (parentMarkerId) {
      const [parent] = await db
        .select()
        .from(threedMarkers)
        .where(
          and(
            eq(threedMarkers.id, parseInt(parentMarkerId)),
            eq(threedMarkers.userId, userId)
          )
        )
        .limit(1);

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent marker not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Verify related entities exist if provided
    if (modelId) {
      const [model] = await db
        .select()
        .from(threedModels)
        .where(
          and(
            eq(threedModels.id, parseInt(modelId)),
            eq(threedModels.userId, userId)
          )
        )
        .limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }
    }

    if (characterId) {
      const [character] = await db
        .select()
        .from(threedCharacters)
        .where(
          and(
            eq(threedCharacters.id, parseInt(characterId)),
            eq(threedCharacters.userId, userId)
          )
        )
        .limit(1);

      if (!character) {
        return NextResponse.json(
          { success: false, error: 'Character not found' },
          { status: 404 }
        );
      }
    }

    if (plantId) {
      const [plant] = await db
        .select()
        .from(threedPlants)
        .where(
          and(
            eq(threedPlants.id, parseInt(plantId)),
            eq(threedPlants.userId, userId)
          )
        )
        .limit(1);

      if (!plant) {
        return NextResponse.json(
          { success: false, error: 'Plant not found' },
          { status: 404 }
        );
      }
    }

    if (bedId) {
      const [bed] = await db
        .select()
        .from(threedBeds)
        .where(
          and(
            eq(threedBeds.id, parseInt(bedId)),
            eq(threedBeds.userId, userId)
          )
        )
        .limit(1);

      if (!bed) {
        return NextResponse.json(
          { success: false, error: 'Bed not found' },
          { status: 404 }
        );
      }
    }

    await ensureTableSequence('threed_markers');

    const [newMarker] = await db
      .insert(threedMarkers)
      .values({
        userId,
        moduleId: moduleId || null,
        moduleType: moduleType || 'threed',
        name,
        description: description || null,
        markerId,
        position: position || { x: 0, y: 0, z: 0 },
        rotation: rotation || { x: 0, y: 0, z: 0 },
        scale: scale || { x: 1, y: 1, z: 1 },
        markerType: markerType || null,
        color: color || '#ffffff',
        size: size || 'medium',
        icon: icon || null,
        label: label || null,
        content: content || null,
        layerId: layerId || null,
        parentMarkerId: parentMarkerId || null,
        modelId: modelId || null,
        characterId: characterId || null,
        plantId: plantId || null,
        bedId: bedId || null,
        data: data || {},
        isVisible: isVisible ?? true,
        isInteractive: isInteractive ?? false,
        isActive: isActive ?? true,
        isPublic: isPublic ?? false,
        metadata: metadata || {},
      })
      .returning();

    console.log('✅ ThreeD marker created:', newMarker);

    return NextResponse.json({
      success: true,
      data: newMarker,
      message: 'Marker created successfully',
    });
  } catch (error) {
    console.error('Error creating marker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create marker' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/markers?id=1 - Full update
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

    // ✅ Verify marker exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedMarkers)
      .where(
        and(
          eq(threedMarkers.id, parsedId),
          eq(threedMarkers.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Marker not found' },
        { status: 404 }
      );
    }

    // ✅ Verify related entities exist if provided
    if (body.layerId) {
      const [layer] = await db
        .select()
        .from(threedLayers)
        .where(
          and(
            eq(threedLayers.id, parseInt(body.layerId)),
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
    }

    if (body.modelId) {
      const [model] = await db
        .select()
        .from(threedModels)
        .where(
          and(
            eq(threedModels.id, parseInt(body.modelId)),
            eq(threedModels.userId, userId)
          )
        )
        .limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }
    }

    const [updated] = await db
      .update(threedMarkers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedMarkers.id, parsedId),
          eq(threedMarkers.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD marker updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Marker updated successfully',
    });
  } catch (error) {
    console.error('Error updating marker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update marker' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/markers?id=1 - Partial update
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

    // ✅ Verify marker exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedMarkers)
      .where(
        and(
          eq(threedMarkers.id, parsedId),
          eq(threedMarkers.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Marker not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(threedMarkers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedMarkers.id, parsedId),
          eq(threedMarkers.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD marker patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Marker updated successfully',
    });
  } catch (error) {
    console.error('Error updating marker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update marker' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/markers?id=1 - Delete marker
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
      .delete(threedMarkers)
      .where(
        and(
          eq(threedMarkers.id, parsedId),
          eq(threedMarkers.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Marker not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Marker deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting marker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete marker' },
      { status: 500 }
    );
  }
}