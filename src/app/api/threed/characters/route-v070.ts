// app/api/threed/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedCharacters, threedModels, threedBeds } from '@/lib/schema/threed';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// Helper function to safely handle enum values
function safeEnumValue<T>(value: T | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

// ============================================
// GET /api/threed/characters - Fetch characters (PUBLIC)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const movementType = searchParams.get('movementType');
    const bedId = searchParams.get('bedId');
    const visible = searchParams.get('visible');
    const weatherSensitivity = searchParams.get('weatherSensitivity');
    const interactable = searchParams.get('interactable');
    const includeModel = searchParams.get('includeModel') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get single character
    if (id) {
      let query = db
        .select()
        .from(threedCharacters)
        .where(eq(threedCharacters.id, parseInt(id)));

      // Public users only see active characters
      if (!userId) {
        query = query.where(eq(threedCharacters.status, 'active'));
      }

      const [character] = await query.limit(1);

      if (!character) {
        return NextResponse.json(
          { success: false, error: 'Character not found' },
          { status: 404 }
        );
      }

      // If includeModel, fetch model details
      if (includeModel && character.modelId) {
        const [model] = await db
          .select()
          .from(threedModels)
          .where(eq(threedModels.id, character.modelId))
          .limit(1);
        return NextResponse.json({
          success: true,
          data: { ...character, model },
        });
      }

      return NextResponse.json({
        success: true,
        data: character,
      });
    }

    // Build query
    let query: any = db
      .select()
      .from(threedCharacters)
      .$dynamic();

    // Public users only see active characters
    if (!userId) {
      query = query.where(eq(threedCharacters.status, 'active'));
    } else {
      // Authenticated users see their characters + active public characters
      query = query.where(
        or(
          eq(threedCharacters.userId, userId),
          eq(threedCharacters.status, 'active')
        )
      );
    }

    // Apply filters
    if (type) query = query.where(eq(threedCharacters.type, type as any));
    if (status) query = query.where(eq(threedCharacters.status, status as any));
    if (movementType) query = query.where(eq(threedCharacters.movementType, movementType as any));
    if (bedId) query = query.where(eq(threedCharacters.bedId, parseInt(bedId)));
    if (visible) query = query.where(eq(threedCharacters.visible, visible === 'true'));
    if (weatherSensitivity) query = query.where(eq(threedCharacters.weatherSensitivity, weatherSensitivity as any));
    if (interactable) query = query.where(eq(threedCharacters.interactable, interactable === 'true'));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedCharacters)
      .where(query._where);

    // Apply pagination and ordering
    const characters = await query
      .orderBy(desc(threedCharacters.createdAt))
      .limit(limit)
      .offset(offset);

    // If includeModel, fetch model details for each character
    let result = characters;
    if (includeModel) {
      result = await Promise.all(characters.map(async (character) => {
        if (character.modelId) {
          const [model] = await db
            .select()
            .from(threedModels)
            .where(eq(threedModels.id, character.modelId))
            .limit(1);
          return { ...character, model };
        }
        return character;
      }));
    }

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
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
// POST /api/threed/characters - Create character (ADMIN ONLY)
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
    
    if (!body.characterId || !body.name) {
      return NextResponse.json(
        { success: false, error: 'characterId and name are required' },
        { status: 400 }
      );
    }

    // Safely handle enum values
    const defaultAnimation = safeEnumValue(body.defaultAnimation, undefined);
    const defaultEmote = safeEnumValue(body.defaultEmote, 'none');
    const emoteOnInteract = safeEnumValue(body.emoteOnInteract, 'happy');
    const movementType = safeEnumValue(body.movementType, 'stationary');
    const weatherSensitivity = safeEnumValue(body.weatherSensitivity, 'all');
    const type = safeEnumValue(body.type, 'animal');
    const status = safeEnumValue(body.status, 'active');

    // Ensure sequence
    await ensureTableSequence('threed_characters');
    
    const [newCharacter] = await db
      .insert(threedCharacters)
      .values({
        userId: session.user.id,
        characterId: body.characterId,
        name: body.name,
        description: body.description || null,
        type: type,
        status: status,
        modelId: body.modelId || null,
        animations: body.animations || [],
        defaultAnimation: defaultAnimation,
        animationSpeed: body.animationSpeed || 1.0,
        movementType: movementType,
        movementPattern: body.movementPattern || null,
        movementRadius: body.movementRadius || 5,
        movementSpeed: body.movementSpeed || 0.5,
        patrolWaypoints: body.patrolWaypoints || [],
        followTarget: body.followTarget || null,
        followDistance: body.followDistance || 2.0,
        teleportPositions: body.teleportPositions || [],
        teleportInterval: body.teleportInterval || 30,
        interactable: body.interactable !== false,
        interactionMessage: body.interactionMessage || null,
        soundEffect: body.soundEffect || null,
        defaultEmote: defaultEmote,
        emoteOnInteract: emoteOnInteract,
        activeStartHour: body.activeStartHour ?? 0,
        activeEndHour: body.activeEndHour ?? 23,
        weatherSensitivity: weatherSensitivity,
        bedId: body.bedId || null,
        positionX: body.positionX || 0,
        positionY: body.positionY || 0,
        positionZ: body.positionZ || 0,
        rotation: body.rotation || 0,
        scale: body.scale || 1,
        scaleMultiplier: body.scaleMultiplier || 1,
        colorTint: body.colorTint || null,
        visible: body.visible !== false,
        visibleDistance: body.visibleDistance || 30,
        isActive: body.isActive !== false,
        metadata: body.metadata || {},
      })
      .returning();
    
    if (body.modelId) {
      await db
        .update(threedModels)
        .set({ usedByCharacters: true })
        .where(eq(threedModels.id, body.modelId));
    }
    
    return NextResponse.json({ success: true, data: newCharacter });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create character', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/characters - Update character (ADMIN ONLY)
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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, parseInt(id)),
          eq(threedCharacters.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Get old model ID to update usage tracking
    const oldModelId = existing.modelId;
    
    // Safely handle enum values
    const defaultAnimation = safeEnumValue(body.defaultAnimation, undefined);
    const defaultEmote = safeEnumValue(body.defaultEmote, 'none');
    const emoteOnInteract = safeEnumValue(body.emoteOnInteract, 'happy');
    const movementType = safeEnumValue(body.movementType, 'stationary');
    const weatherSensitivity = safeEnumValue(body.weatherSensitivity, 'all');
    const type = safeEnumValue(body.type, 'animal');
    const status = safeEnumValue(body.status, 'active');
    
    const [updated] = await db
      .update(threedCharacters)
      .set({
        name: body.name || existing.name,
        description: body.description || null,
        type: type,
        status: status,
        modelId: body.modelId || null,
        animations: body.animations || [],
        defaultAnimation: defaultAnimation,
        animationSpeed: body.animationSpeed || 1.0,
        movementType: movementType,
        movementPattern: body.movementPattern || null,
        movementRadius: body.movementRadius || 5,
        movementSpeed: body.movementSpeed || 0.5,
        patrolWaypoints: body.patrolWaypoints || [],
        followTarget: body.followTarget || null,
        followDistance: body.followDistance || 2.0,
        teleportPositions: body.teleportPositions || [],
        teleportInterval: body.teleportInterval || 30,
        interactable: body.interactable !== false,
        interactionMessage: body.interactionMessage || null,
        soundEffect: body.soundEffect || null,
        defaultEmote: defaultEmote,
        emoteOnInteract: emoteOnInteract,
        activeStartHour: body.activeStartHour ?? 0,
        activeEndHour: body.activeEndHour ?? 23,
        weatherSensitivity: weatherSensitivity,
        bedId: body.bedId || null,
        positionX: body.positionX || 0,
        positionY: body.positionY || 0,
        positionZ: body.positionZ || 0,
        rotation: body.rotation || 0,
        scale: body.scale || 1,
        scaleMultiplier: body.scaleMultiplier || 1,
        colorTint: body.colorTint || null,
        visible: body.visible !== false,
        visibleDistance: body.visibleDistance || 30,
        isActive: body.isActive !== false,
        metadata: body.metadata || {},
        updatedAt: new Date(),
      })
      .where(eq(threedCharacters.id, parseInt(id)))
      .returning();
    
    // Update model usage tracking
    if (oldModelId !== body.modelId) {
      if (oldModelId) {
        const otherCharacters = await db
          .select({ count: sql<number>`count(*)` })
          .from(threedCharacters)
          .where(eq(threedCharacters.modelId, oldModelId));
        
        if (otherCharacters[0]?.count === 0) {
          await db
            .update(threedModels)
            .set({ usedByCharacters: false })
            .where(eq(threedModels.id, oldModelId));
        }
      }
      
      if (body.modelId) {
        await db
          .update(threedModels)
          .set({ usedByCharacters: true })
          .where(eq(threedModels.id, body.modelId));
      }
    }
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update character', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/characters - Delete a character (ADMIN ONLY)
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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    // Verify ownership
    const [character] = await db
      .select({ modelId: threedCharacters.modelId })
      .from(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, parseInt(id)),
          eq(threedCharacters.userId, session.user.id)
        )
      )
      .limit(1);

    if (!character) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Delete character
    await db
      .delete(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, parseInt(id)),
          eq(threedCharacters.userId, session.user.id)
        )
      );
    
    // Update model usage if this was the last character using it
    if (character?.modelId) {
      const otherCharacters = await db
        .select({ count: sql<number>`count(*)` })
        .from(threedCharacters)
        .where(eq(threedCharacters.modelId, character.modelId));
      
      if (otherCharacters[0]?.count === 0) {
        await db
          .update(threedModels)
          .set({ usedByCharacters: false })
          .where(eq(threedModels.id, character.modelId));
      }
    }
    
    return NextResponse.json({ success: true, message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}