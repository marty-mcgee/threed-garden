// app/api/threed/markers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedMarkers,
  threedLayers,
  threedModels,
  threedCharacters,
  threedPlants,
  threedBeds,
  threedPlantings,
  threedTasks,
  threedFarmbots,
  threedHarvests,
  threedWeatherLogs,
} from '@/lib/schema/threed';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/markers - List ThreeD Markers
// Query Parameters:
//   - id (optional): Get a single marker
//   - markerType (optional): Filter by marker type
//   - layerId (optional): Filter by layer
//   - isActive (optional): Filter by active status
//   - isVisible (optional): Filter by visibility
//   - search (optional): Search by name, markerId, or description
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
    const markerType = searchParams.get('markerType');
    const layerId = searchParams.get('layerId');
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

      // Fetch related entities
      const [layer] = marker.layerId ? await db
        .select()
        .from(threedLayers)
        .where(eq(threedLayers.id, marker.layerId))
        .limit(1) : [];

      const [model] = marker.modelId ? await db
        .select()
        .from(threedModels)
        .where(eq(threedModels.id, marker.modelId))
        .limit(1) : [];

      const [character] = marker.characterId ? await db
        .select()
        .from(threedCharacters)
        .where(eq(threedCharacters.id, marker.characterId))
        .limit(1) : [];

      const [plant] = marker.plantId ? await db
        .select()
        .from(threedPlants)
        .where(eq(threedPlants.id, marker.plantId))
        .limit(1) : [];

      const [bed] = marker.bedId ? await db
        .select()
        .from(threedBeds)
        .where(eq(threedBeds.id, marker.bedId))
        .limit(1) : [];

      const [planting] = marker.plantingId ? await db
        .select()
        .from(threedPlantings)
        .where(eq(threedPlantings.id, marker.plantingId))
        .limit(1) : [];

      const [task] = marker.taskId ? await db
        .select()
        .from(threedTasks)
        .where(eq(threedTasks.id, marker.taskId))
        .limit(1) : [];

      const [farmbot] = marker.farmbotId ? await db
        .select()
        .from(threedFarmbots)
        .where(eq(threedFarmbots.id, marker.farmbotId))
        .limit(1) : [];

      const [harvest] = marker.harvestId ? await db
        .select()
        .from(threedHarvests)
        .where(eq(threedHarvests.id, marker.harvestId))
        .limit(1) : [];

      const [weatherLog] = marker.weatherLogId ? await db
        .select()
        .from(threedWeatherLogs)
        .where(eq(threedWeatherLogs.id, marker.weatherLogId))
        .limit(1) : [];

      return NextResponse.json({
        success: true,
        data: {
          ...marker,
          layer: layer || null,
          model: model || null,
          character: character || null,
          plant: plant || null,
          bed: bed || null,
          planting: planting || null,
          task: task || null,
          farmbot: farmbot || null,
          harvest: harvest || null,
          weatherLog: weatherLog || null,
        },
      });
    }

    // Build query for list
    let conditions = [eq(threedMarkers.userId, userId)];
    
    if (markerType) {
      conditions.push(eq(threedMarkers.markerType, markerType));
    }
    if (layerId) {
      conditions.push(eq(threedMarkers.layerId, parseInt(layerId)));
    }
    if (isActive !== null) {
      conditions.push(eq(threedMarkers.isActive, isActive === 'true'));
    }
    if (isVisible !== null) {
      conditions.push(eq(threedMarkers.isVisible, isVisible === 'true'));
    }
    if (search) {
      conditions.push(
        sql`${threedMarkers.name} ILIKE ${`%${search}%`} OR 
            ${threedMarkers.markerId} ILIKE ${`%${search}%`} OR
            ${threedMarkers.description} ILIKE ${`%${search}%`} OR
            ${threedMarkers.label} ILIKE ${`%${search}%`}`
      );
    }

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedMarkers)
      .where(and(...conditions));

    const total = countResult?.count || 0;

    // Get paginated results
    const results = await db
      .select()
      .from(threedMarkers)
      .where(and(...conditions))
      .orderBy(desc(threedMarkers.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch related entities for each marker (only if needed for the list view)
    // For performance, you might want to skip this for list views and only fetch for single marker
    // But keeping it for rich list display
    const markersWithRelations = await Promise.all(
      results.map(async (marker) => {
        const [layer] = marker.layerId ? await db
          .select()
          .from(threedLayers)
          .where(eq(threedLayers.id, marker.layerId))
          .limit(1) : [];

        const [model] = marker.modelId ? await db
          .select()
          .from(threedModels)
          .where(eq(threedModels.id, marker.modelId))
          .limit(1) : [];

        const [character] = marker.characterId ? await db
          .select()
          .from(threedCharacters)
          .where(eq(threedCharacters.id, marker.characterId))
          .limit(1) : [];

        const [plant] = marker.plantId ? await db
          .select()
          .from(threedPlants)
          .where(eq(threedPlants.id, marker.plantId))
          .limit(1) : [];

        const [bed] = marker.bedId ? await db
          .select()
          .from(threedBeds)
          .where(eq(threedBeds.id, marker.bedId))
          .limit(1) : [];

        const [planting] = marker.plantingId ? await db
          .select()
          .from(threedPlantings)
          .where(eq(threedPlantings.id, marker.plantingId))
          .limit(1) : [];

        const [task] = marker.taskId ? await db
          .select()
          .from(threedTasks)
          .where(eq(threedTasks.id, marker.taskId))
          .limit(1) : [];

        const [farmbot] = marker.farmbotId ? await db
          .select()
          .from(threedFarmbots)
          .where(eq(threedFarmbots.id, marker.farmbotId))
          .limit(1) : [];

        const [harvest] = marker.harvestId ? await db
          .select()
          .from(threedHarvests)
          .where(eq(threedHarvests.id, marker.harvestId))
          .limit(1) : [];

        const [weatherLog] = marker.weatherLogId ? await db
          .select()
          .from(threedWeatherLogs)
          .where(eq(threedWeatherLogs.id, marker.weatherLogId))
          .limit(1) : [];

        return {
          ...marker,
          layer: layer || null,
          model: model || null,
          character: character || null,
          plant: plant || null,
          bed: bed || null,
          planting: planting || null,
          task: task || null,
          farmbot: farmbot || null,
          harvest: harvest || null,
          weatherLog: weatherLog || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: markersWithRelations,
      pagination: {
        limit,
        offset,
        total,
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
      markerId,
      name,
      description,
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
      plantingId,
      taskId,
      farmbotId,
      harvestId,
      weatherLogId,
      data,
      isVisible,
      isInteractive,
      isActive,
      isPublic,
      metadata,
    } = body;

    // Validate required fields
    if (!markerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: markerId' },
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

    // Verify layer exists if provided
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

    // Verify parent marker exists if provided
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

    // Verify model exists if provided
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

    // Verify character exists if provided
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

    // Verify plant exists if provided
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

    // Verify bed exists if provided
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

    // Verify planting exists if provided
    if (plantingId) {
      const [planting] = await db
        .select()
        .from(threedPlantings)
        .where(
          and(
            eq(threedPlantings.id, parseInt(plantingId)),
            eq(threedPlantings.userId, userId)
          )
        )
        .limit(1);

      if (!planting) {
        return NextResponse.json(
          { success: false, error: 'Planting not found' },
          { status: 404 }
        );
      }
    }

    // Verify task exists if provided
    if (taskId) {
      const [task] = await db
        .select()
        .from(threedTasks)
        .where(
          and(
            eq(threedTasks.id, parseInt(taskId)),
            eq(threedTasks.userId, userId)
          )
        )
        .limit(1);

      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
    }

    // Verify farmbot exists if provided
    if (farmbotId) {
      const [farmbot] = await db
        .select()
        .from(threedFarmbots)
        .where(
          and(
            eq(threedFarmbots.id, parseInt(farmbotId)),
            eq(threedFarmbots.userId, userId)
          )
        )
        .limit(1);

      if (!farmbot) {
        return NextResponse.json(
          { success: false, error: 'Farmbot not found' },
          { status: 404 }
        );
      }
    }

    // Verify harvest exists if provided
    if (harvestId) {
      const [harvest] = await db
        .select()
        .from(threedHarvests)
        .where(
          and(
            eq(threedHarvests.id, parseInt(harvestId)),
            eq(threedHarvests.userId, userId)
          )
        )
        .limit(1);

      if (!harvest) {
        return NextResponse.json(
          { success: false, error: 'Harvest not found' },
          { status: 404 }
        );
      }
    }

    // Verify weather log exists if provided
    if (weatherLogId) {
      const [weatherLog] = await db
        .select()
        .from(threedWeatherLogs)
        .where(
          and(
            eq(threedWeatherLogs.id, parseInt(weatherLogId)),
            eq(threedWeatherLogs.userId, userId)
          )
        )
        .limit(1);

      if (!weatherLog) {
        return NextResponse.json(
          { success: false, error: 'Weather log not found' },
          { status: 404 }
        );
      }
    }

    // Check if markerId already exists
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

    await ensureTableSequence('threed_markers');

    const [newMarker] = await db
      .insert(threedMarkers)
      .values({
        userId,
        markerId,
        name,
        description: description || null,
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
        plantingId: plantingId || null,
        taskId: taskId || null,
        farmbotId: farmbotId || null,
        harvestId: harvestId || null,
        weatherLogId: weatherLogId || null,
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

    // Verify marker exists and belongs to user
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

    // Verify layer exists if provided
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

    // Verify parent marker exists if provided
    if (body.parentMarkerId) {
      const [parent] = await db
        .select()
        .from(threedMarkers)
        .where(
          and(
            eq(threedMarkers.id, parseInt(body.parentMarkerId)),
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

    // Verify related entities exist if provided
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

    if (body.characterId) {
      const [character] = await db
        .select()
        .from(threedCharacters)
        .where(
          and(
            eq(threedCharacters.id, parseInt(body.characterId)),
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

    if (body.plantId) {
      const [plant] = await db
        .select()
        .from(threedPlants)
        .where(
          and(
            eq(threedPlants.id, parseInt(body.plantId)),
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

    if (body.bedId) {
      const [bed] = await db
        .select()
        .from(threedBeds)
        .where(
          and(
            eq(threedBeds.id, parseInt(body.bedId)),
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

    if (body.plantingId) {
      const [planting] = await db
        .select()
        .from(threedPlantings)
        .where(
          and(
            eq(threedPlantings.id, parseInt(body.plantingId)),
            eq(threedPlantings.userId, userId)
          )
        )
        .limit(1);

      if (!planting) {
        return NextResponse.json(
          { success: false, error: 'Planting not found' },
          { status: 404 }
        );
      }
    }

    if (body.taskId) {
      const [task] = await db
        .select()
        .from(threedTasks)
        .where(
          and(
            eq(threedTasks.id, parseInt(body.taskId)),
            eq(threedTasks.userId, userId)
          )
        )
        .limit(1);

      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
    }

    if (body.farmbotId) {
      const [farmbot] = await db
        .select()
        .from(threedFarmbots)
        .where(
          and(
            eq(threedFarmbots.id, parseInt(body.farmbotId)),
            eq(threedFarmbots.userId, userId)
          )
        )
        .limit(1);

      if (!farmbot) {
        return NextResponse.json(
          { success: false, error: 'Farmbot not found' },
          { status: 404 }
        );
      }
    }

    if (body.harvestId) {
      const [harvest] = await db
        .select()
        .from(threedHarvests)
        .where(
          and(
            eq(threedHarvests.id, parseInt(body.harvestId)),
            eq(threedHarvests.userId, userId)
          )
        )
        .limit(1);

      if (!harvest) {
        return NextResponse.json(
          { success: false, error: 'Harvest not found' },
          { status: 404 }
        );
      }
    }

    if (body.weatherLogId) {
      const [weatherLog] = await db
        .select()
        .from(threedWeatherLogs)
        .where(
          and(
            eq(threedWeatherLogs.id, parseInt(body.weatherLogId)),
            eq(threedWeatherLogs.userId, userId)
          )
        )
        .limit(1);

      if (!weatherLog) {
        return NextResponse.json(
          { success: false, error: 'Weather log not found' },
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

    // Verify marker exists and belongs to user
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

    // Verify layer exists if provided
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

    // Verify parent marker exists if provided
    if (body.parentMarkerId) {
      const [parent] = await db
        .select()
        .from(threedMarkers)
        .where(
          and(
            eq(threedMarkers.id, parseInt(body.parentMarkerId)),
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