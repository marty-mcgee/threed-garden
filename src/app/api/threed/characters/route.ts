// src/app/api/threed/characters/route.ts - Fixed version

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedCharacters, threedModels, threedBeds } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

// Helper function to safely handle enum values
function safeEnumValue<T>(value: T | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

// GET /api/threed/characters - Fetch characters with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
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

    let query: any;

    if (includeModel) {
      query = db.select({
        character: {
          id: threedCharacters.id,
          characterId: threedCharacters.characterId,
          name: threedCharacters.name,
          description: threedCharacters.description,
          type: threedCharacters.type,
          status: threedCharacters.status,
          modelId: threedCharacters.modelId,
          animations: threedCharacters.animations,
          defaultAnimation: threedCharacters.defaultAnimation,
          animationSpeed: threedCharacters.animationSpeed,
          movementType: threedCharacters.movementType,
          movementPattern: threedCharacters.movementPattern,
          movementRadius: threedCharacters.movementRadius,
          movementSpeed: threedCharacters.movementSpeed,
          patrolWaypoints: threedCharacters.patrolWaypoints,
          followTarget: threedCharacters.followTarget,
          followDistance: threedCharacters.followDistance,
          teleportPositions: threedCharacters.teleportPositions,
          teleportInterval: threedCharacters.teleportInterval,
          interactable: threedCharacters.interactable,
          interactionMessage: threedCharacters.interactionMessage,
          soundEffect: threedCharacters.soundEffect,
          defaultEmote: threedCharacters.defaultEmote,
          emoteOnInteract: threedCharacters.emoteOnInteract,
          activeStartHour: threedCharacters.activeStartHour,
          activeEndHour: threedCharacters.activeEndHour,
          weatherSensitivity: threedCharacters.weatherSensitivity,
          bedId: threedCharacters.bedId,
          positionX: threedCharacters.positionX,
          positionY: threedCharacters.positionY,
          positionZ: threedCharacters.positionZ,
          rotation: threedCharacters.rotation,
          scale: threedCharacters.scale,
          scaleMultiplier: threedCharacters.scaleMultiplier,
          colorTint: threedCharacters.colorTint,
          visible: threedCharacters.visible,
          visibleDistance: threedCharacters.visibleDistance,
          isActive: threedCharacters.isActive,
          metadata: threedCharacters.metadata,
          createdAt: threedCharacters.createdAt,
          updatedAt: threedCharacters.updatedAt,
        },
        model: {
          id: threedModels.id,
          modelName: threedModels.modelName,
          modelType: threedModels.modelType,
          filePath: threedModels.filePath,
          thumbnailUrl: threedModels.thumbnailUrl,
          scale: threedModels.scale,
          rotationY: threedModels.rotationY,
          animations: threedModels.animations,
        },
        bed: {
          id: threedBeds.id,
          name: threedBeds.name,
          positionX: threedBeds.positionX,
          positionY: threedBeds.positionY,
          positionZ: threedBeds.positionZ,
        }
      })
      .from(threedCharacters)
      .leftJoin(threedModels, eq(threedCharacters.modelId, threedModels.id))
      .leftJoin(threedBeds, eq(threedCharacters.bedId, threedBeds.id));
    } else {
      query = db.select().from(threedCharacters);
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
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(threedCharacters);
    const total = countResult[0];

    // Apply pagination and ordering
    const characters = await query
      .orderBy(desc(threedCharacters.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: includeModel ? characters : characters,
      pagination: { limit, offset, total: total?.count || 0 },
    });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// POST /api/threed/characters - Enhanced creation with proper enum handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.characterId || !body.name) {
      return NextResponse.json(
        { success: false, error: 'characterId and name are required' },
        { status: 400 }
      );
    }
    
    // Safely handle enum values - ensure no empty strings
    const defaultAnimation = safeEnumValue(body.defaultAnimation, undefined);
    const defaultEmote = safeEnumValue(body.defaultEmote, 'none');
    const emoteOnInteract = safeEnumValue(body.emoteOnInteract, 'happy');
    const movementType = safeEnumValue(body.movementType, 'stationary');
    const weatherSensitivity = safeEnumValue(body.weatherSensitivity, 'all');
    const type = safeEnumValue(body.type, 'animal');
    const status = safeEnumValue(body.status, 'active');
    
    const [newCharacter] = await db.insert(threedCharacters).values({
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
    }).returning();
    
    if (body.modelId) {
      await db.update(threedModels)
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

// PUT /api/threed/characters - Update with proper enum handling
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Get old model ID to update usage tracking
    const [oldCharacter] = await db.select({ modelId: threedCharacters.modelId })
      .from(threedCharacters)
      .where(eq(threedCharacters.id, parseInt(id)));
    
    // Safely handle enum values
    const defaultAnimation = safeEnumValue(body.defaultAnimation, undefined);
    const defaultEmote = safeEnumValue(body.defaultEmote, 'none');
    const emoteOnInteract = safeEnumValue(body.emoteOnInteract, 'happy');
    const movementType = safeEnumValue(body.movementType, 'stationary');
    const weatherSensitivity = safeEnumValue(body.weatherSensitivity, 'all');
    const type = safeEnumValue(body.type, 'animal');
    const status = safeEnumValue(body.status, 'active');
    
    const [updated] = await db.update(threedCharacters)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(threedCharacters.id, parseInt(id)))
      .returning();
    
    // Update model usage tracking
    if (oldCharacter?.modelId !== body.modelId) {
      if (oldCharacter?.modelId) {
        const otherCharacters = await db.select({ count: sql<number>`count(*)` })
          .from(threedCharacters)
          .where(eq(threedCharacters.modelId, oldCharacter.modelId));
        
        if (otherCharacters[0]?.count === 0) {
          await db.update(threedModels)
            .set({ usedByCharacters: false })
            .where(eq(threedModels.id, oldCharacter.modelId));
        }
      }
      
      if (body.modelId) {
        await db.update(threedModels)
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

// DELETE /api/threed/characters - Delete a character
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    // Get model ID before deleting
    const [character] = await db.select({ modelId: threedCharacters.modelId })
      .from(threedCharacters)
      .where(eq(threedCharacters.id, parseInt(id)));
    
    await db.delete(threedCharacters)
      .where(eq(threedCharacters.id, parseInt(id)));
    
    // Update model usage if this was the last character using it
    if (character?.modelId) {
      const otherCharacters = await db.select({ count: sql<number>`count(*)` })
        .from(threedCharacters)
        .where(eq(threedCharacters.modelId, character.modelId));
      
      if (otherCharacters[0]?.count === 0) {
        await db.update(threedModels)
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