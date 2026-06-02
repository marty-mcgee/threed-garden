// src/app/api/threed/characters/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedCharacters, threedModels, threedBeds } from '@/lib/auth/schema';
import { eq } from 'drizzle-orm';

// GET /api/threed/characters/[id] - Get a single character with its model and bed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const characterId = parseInt(id);
    
    if (isNaN(characterId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid character ID' },
        { status: 400 }
      );
    }

    const [character] = await db.select({
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
        isMovable: threedCharacters.isMovable,
        movementPattern: threedCharacters.movementPattern,
        movementRadius: threedCharacters.movementRadius,
        movementSpeed: threedCharacters.movementSpeed,
        interactable: threedCharacters.interactable,
        interactionMessage: threedCharacters.interactionMessage,
        soundEffect: threedCharacters.soundEffect,
        bedId: threedCharacters.bedId,
        positionX: threedCharacters.positionX,
        positionY: threedCharacters.positionY,
        positionZ: threedCharacters.positionZ,
        rotation: threedCharacters.rotation,
        scale: threedCharacters.scale,
        scaleMultiplier: threedCharacters.scaleMultiplier,
        colorTint: threedCharacters.colorTint,
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
    .leftJoin(threedBeds, eq(threedCharacters.bedId, threedBeds.id))
    .where(eq(threedCharacters.id, characterId))
    .limit(1);

    if (!character) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: character,
    });
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}