// app/api/threed/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedCharacters,
  threedModels,
} from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// Normalize an incoming character body so empty-string/nullable optional fields
// don't collide with enum/decimal/integer column types (e.g. '' for an enum fails).
function normalizeCharacterBody(body: Record<string, any>) {
  const out: Record<string, any> = { ...body };

  // Optional fields whose empty string must become NULL.
  const nullableKeys = [
    'description',
    'defaultAnimation',
    'movementPattern',
    'movementRadius',
    'followTarget',
    'interactionMessage',
    'soundEffect',
    'activeStartHour',
    'activeEndHour',
    'teleportInterval',
    'colorTint',
  ];
  for (const key of nullableKeys) {
    if (out[key] === '' || out[key] === undefined) out[key] = null;
  }

  // Array columns must always be arrays (some records contain `{}` instead of `[]`).
  for (const key of ['animations', 'patrolWaypoints', 'teleportPositions']) {
    if (!Array.isArray(out[key])) out[key] = [];
  }

  // modelId is an integer foreign key.
  if (out.modelId === '' || out.modelId === undefined || out.modelId === null) {
    out.modelId = null;
  } else {
    out.modelId = parseInt(out.modelId);
  }

  return out;
}

// ============================================
// GET /api/threed/characters - List ThreeD Characters
// Query Parameters:
//   - id (optional): Get a single character
//   - status (optional): Filter by character status
//   - type (optional): Filter by character type
//   - isActive (optional): Filter by active status
//   - search (optional): Search by name, characterId, or description
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Get a single character by ID
    if (id) {
      const [character] = await db
        .select()
        .from(threedCharacters)
        .where(
          and(
            eq(threedCharacters.id, parseInt(id)),
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

      // ✅ Fetch related model info if available
      const [model] = character.modelId ? await db
        .select()
        .from(threedModels)
        .where(eq(threedModels.id, character.modelId))
        .limit(1) : [];

      return NextResponse.json({
        success: true,
        data: {
          ...character,
          model: model || null,
        },
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedCharacters)
      .where(eq(threedCharacters.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(threedCharacters.status, status));
    }

    if (type) {
      query = query.where(eq(threedCharacters.type, type));
    }

    if (isActive !== null) {
      query = query.where(eq(threedCharacters.isActive, isActive === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedCharacters.name} ILIKE ${`%${search}%`} OR 
            ${threedCharacters.characterId} ILIKE ${`%${search}%`} OR
            ${threedCharacters.description} ILIKE ${`%${search}%`}`
      );
    }

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedCharacters)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(threedCharacters.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ Fetch related model info for each character
    const charactersWithModels = await Promise.all(
      results.map(async (character) => {
        const [model] = character.modelId ? await db
          .select()
          .from(threedModels)
          .where(eq(threedModels.id, character.modelId))
          .limit(1) : [];

        return {
          ...character,
          model: model || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: charactersWithModels,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/characters - Create ThreeD Character
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 POST /api/threed/characters - Request body:', body);

    const {
      characterId,
      name,
      description,
      type,
      isActive,
      status,
      modelId,
      animations,
      defaultAnimation,
      animationSpeed,
      isMovable,
      movementType,
      movementPattern,
      movementRadius,
      movementSpeed,
      patrolWaypoints,
      followTarget,
      followDistance,
      teleportPositions,
      teleportInterval,
      interactable,
      interactionMessage,
      soundEffect,
      defaultEmote,
      emoteOnInteract,
      activeStartHour,
      activeEndHour,
      weatherSensitivity,
      positionX,
      positionY,
      positionZ,
      rotation,
      scale,
      scaleMultiplier,
      colorTint,
      visible,
      visibleDistance,
      metadata,
    } = body;

    // ✅ Validate required fields
    if (!characterId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: characterId' },
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

    // ✅ Verify model exists if provided
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

    // ✅ Check if characterId already exists
    const [existing] = await db
      .select()
      .from(threedCharacters)
      .where(
        and(
          eq(threedCharacters.characterId, characterId),
          eq(threedCharacters.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Character ID already exists' },
        { status: 409 }
      );
    }

    await ensureTableSequence('threed_characters');

    const [newCharacter] = await db
      .insert(threedCharacters)
      .values({
        userId,
        characterId,
        name,
        description: description || null,
        type: type || 'animal',
        isActive: isActive ?? true,
        status: status || 'active',
        modelId: modelId || null,
        animations: animations || [],
        defaultAnimation: defaultAnimation || null,
        animationSpeed: animationSpeed || '1.0',
        isMovable: isMovable ?? false,
        movementType: movementType || 'stationary',
        movementPattern: movementPattern || null,
        movementRadius: movementRadius || null,
        movementSpeed: movementSpeed || '0.5',
        patrolWaypoints: patrolWaypoints || [],
        followTarget: followTarget || null,
        followDistance: followDistance || '2.0',
        teleportPositions: teleportPositions || [],
        teleportInterval: teleportInterval || null,
        interactable: interactable ?? true,
        interactionMessage: interactionMessage || null,
        soundEffect: soundEffect || null,
        defaultEmote: defaultEmote || 'none',
        emoteOnInteract: emoteOnInteract || 'happy',
        activeStartHour: activeStartHour || null,
        activeEndHour: activeEndHour || null,
        weatherSensitivity: weatherSensitivity || 'all',
        positionX: positionX || '0',
        positionY: positionY || '0',
        positionZ: positionZ || '0',
        rotation: rotation || '0',
        scale: scale || '1',
        scaleMultiplier: scaleMultiplier || '1',
        colorTint: colorTint || null,
        visible: visible ?? true,
        visibleDistance: visibleDistance || '30.0',
        metadata: metadata || {},
      })
      .returning();

    console.log('✅ ThreeD character created:', newCharacter);

    return NextResponse.json({
      success: true,
      data: newCharacter,
      message: 'Character created successfully',
    });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/characters?id=1 - Full update
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

    // ✅ Verify character exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, parsedId),
          eq(threedCharacters.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    // ✅ Verify model exists if provided
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
      .update(threedCharacters)
      .set({
        ...normalizeCharacterBody(body),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedCharacters.id, parsedId),
          eq(threedCharacters.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD character updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Character updated successfully',
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/characters?id=1 - Partial update
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

    // ✅ Verify character exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, parsedId),
          eq(threedCharacters.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    // ✅ Verify model exists if provided
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
      .update(threedCharacters)
      .set({
        ...normalizeCharacterBody(body),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedCharacters.id, parsedId),
          eq(threedCharacters.userId, userId)
        )
      )
      .returning();

    console.log('✅ ThreeD character patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Character updated successfully',
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/characters?id=1 - Delete character
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
      .delete(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, parsedId),
          eq(threedCharacters.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Character deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}