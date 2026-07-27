// app/api/threed/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedCharacters, threedModels } from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/characters
// Query Parameters:
//   - id: Get a single character with its model associations
//   - moduleId: Get characters associated with a specific ThreeD module
//   - isActive: Filter by active status
//   - limit, offset: Pagination
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleId = searchParams.get('moduleId');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get a single character by ID with associations
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid character ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedCharacters)
        .where(eq(threedCharacters.id, parsedId));

      if (!userId) {
        query = query.where(eq(threedCharacters.isActive, true));
      } else {
        query = query.where(
          or(
            eq(threedCharacters.userId, userId),
            eq(threedCharacters.isActive, true)
          )
        );
      }

      const [character] = await query.limit(1);

      if (!character) {
        return NextResponse.json(
          { success: false, error: 'Character not found' },
          { status: 404 }
        );
      }

      // ✅ Get model associations
      const modelAssociations = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.moduleId, character.id),
            eq(projectAssets.moduleType, 'threed_character'),
            eq(projectAssets.assetType, 'threed_models'),
            eq(projectAssets.userId, userId || '')
          )
        )
        .orderBy(projectAssets.createdAt);

      // ✅ Get the actual models
      const modelIds = modelAssociations.map((assoc) => assoc.assetId);
      let models: any[] = [];
      if (modelIds.length > 0) {
        models = await db
          .select()
          .from(threedModels)
          .where(sql`${threedModels.id} IN (${sql.join(modelIds)})`);
      }

      // ✅ Build response
      const responseData = {
        ...character,
        modelAssociations: modelAssociations.map((assoc) => ({
          ...assoc,
          model: models.find((m) => m.id === assoc.assetId) || null,
        })),
      };

      return NextResponse.json({
        success: true,
        data: responseData,
      });
    }

    // ✅ List all characters
    let query = db
      .select()
      .from(threedCharacters)
      .$dynamic();

    if (!userId) {
      query = query.where(eq(threedCharacters.isActive, true));
    } else {
      query = query.where(
        or(
          eq(threedCharacters.userId, userId),
          eq(threedCharacters.isActive, true)
        )
      );
    }

    if (isActive !== null) {
      query = query.where(eq(threedCharacters.isActive, isActive === 'true'));
    }

    // ✅ Filter by moduleId if provided
    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (!isNaN(parsedModuleId)) {
        const assetLinks = await db
          .select({ assetId: projectAssets.assetId })
          .from(projectAssets)
          .where(
            and(
              eq(projectAssets.moduleId, parsedModuleId),
              eq(projectAssets.moduleType, 'threed'),
              eq(projectAssets.assetType, 'threed_characters'),
              eq(projectAssets.userId, userId || '')
            )
          );

        const characterIds = assetLinks.map((link) => link.assetId);
        if (characterIds.length > 0) {
          query = query.where(sql`${threedCharacters.id} IN (${sql.join(characterIds)})`);
        } else {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { limit, offset, total: 0 },
          });
        }
      }
    }

    // ✅ Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedCharacters)
      .where(query._where);

    const characters = await query
      .orderBy(desc(threedCharacters.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ For each character, fetch model associations
    const charactersWithAssociations = await Promise.all(
      characters.map(async (character) => {
        const modelAssociations = await db
          .select()
          .from(projectAssets)
          .where(
            and(
              eq(projectAssets.moduleId, character.id),
              eq(projectAssets.moduleType, 'threed_character'),
              eq(projectAssets.assetType, 'threed_models'),
              eq(projectAssets.userId, userId || '')
            )
          )
          .orderBy(projectAssets.createdAt);

        const modelIds = modelAssociations.map((assoc) => assoc.assetId);
        let models: any[] = [];
        if (modelIds.length > 0) {
          models = await db
            .select()
            .from(threedModels)
            .where(sql`${threedModels.id} IN (${sql.join(modelIds)})`);
        }

        return {
          ...character,
          modelAssociations: modelAssociations.map((assoc) => ({
            ...assoc,
            model: models.find((m) => m.id === assoc.assetId) || null,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: charactersWithAssociations,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Characters API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/characters - Create a new character
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

    const userId = session.user.id;
    const body = await request.json();

    console.log('[Characters API] POST - Received body:', body);

    // ✅ Required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // ✅ Generate characterId
    const characterId =
      body.characterId || `char_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // ✅ Parse animations - handle both string and array
    let animationsArray: string[] = [];
    if (body.animations) {
      if (Array.isArray(body.animations)) {
        animationsArray = body.animations;
      } else if (typeof body.animations === 'string') {
        animationsArray = body.animations
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    // ✅ Parse patrolWaypoints
    let patrolWaypointsArray: any[] = [];
    if (body.patrolWaypoints) {
      if (Array.isArray(body.patrolWaypoints)) {
        patrolWaypointsArray = body.patrolWaypoints;
      } else if (typeof body.patrolWaypoints === 'string') {
        patrolWaypointsArray = body.patrolWaypoints
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    // ✅ Parse teleportPositions
    let teleportPositionsArray: any[] = [];
    if (body.teleportPositions) {
      if (Array.isArray(body.teleportPositions)) {
        teleportPositionsArray = body.teleportPositions;
      } else if (typeof body.teleportPositions === 'string') {
        teleportPositionsArray = body.teleportPositions
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    // ✅ Create the character
    await ensureTableSequence('threed_characters');

    const [newCharacter] = await db
      .insert(threedCharacters)
      .values({
        userId,
        characterId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        type: body.type || 'animal',
        status: body.status || 'active',

        // ✅ Animations as JSON array
        animations: animationsArray,
        defaultAnimation: body.defaultAnimation || null,
        animationSpeed: body.animationSpeed ? parseFloat(body.animationSpeed) : 1,

        // Movement
        isMovable: body.isMovable === true || body.isMovable === 'true',
        movementType: body.movementType || null,
        movementPattern: body.movementPattern || null,
        movementRadius: body.movementRadius ? parseFloat(body.movementRadius) : null,
        movementSpeed: body.movementSpeed ? parseFloat(body.movementSpeed) : 0.5,
        patrolWaypoints: patrolWaypointsArray,
        followTarget: body.followTarget || null,
        followDistance: body.followDistance ? parseFloat(body.followDistance) : 2,
        teleportPositions: teleportPositionsArray,
        teleportInterval: body.teleportInterval ? parseInt(body.teleportInterval) : null,

        // Interaction
        interactable: body.interactable === true || body.interactable === 'true',
        interactionMessage: body.interactionMessage || null,
        soundEffect: body.soundEffect || null,

        // Emotes
        defaultEmote: body.defaultEmote || null,
        emoteOnInteract: body.emoteOnInteract || null,

        // Time-based
        activeStartHour: body.activeStartHour ? parseInt(body.activeStartHour) : null,
        activeEndHour: body.activeEndHour ? parseInt(body.activeEndHour) : null,

        // Weather
        weatherSensitivity: body.weatherSensitivity || null,

        // Position
        bedId: body.bedId ? parseInt(body.bedId) : null,
        positionX: body.positionX ? parseFloat(body.positionX) : 0,
        positionY: body.positionY ? parseFloat(body.positionY) : 0,
        positionZ: body.positionZ ? parseFloat(body.positionZ) : 0,
        rotation: body.rotation ? parseFloat(body.rotation) : 0,
        scale: body.scale ? parseFloat(body.scale) : 1,
        scaleMultiplier: body.scaleMultiplier ? parseFloat(body.scaleMultiplier) : 1,
        colorTint: body.colorTint || null,

        // Visibility
        visible: body.visible !== false && body.visible !== 'false',
        visibleDistance: body.visibleDistance ? parseFloat(body.visibleDistance) : 30,

        // Status
        isActive: body.isActive !== false && body.isActive !== 'false',
        metadata: body.metadata || {},
      })
      .returning();

    console.log('[Characters API] Created character:', newCharacter.id, newCharacter.name);

    // ✅ Handle Character-Model relationships via project_assets
    // This creates the junction records between Character and Model
    if (body.modelIds) {
      const modelIds = body.modelIds
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((id) => !isNaN(id));

      for (const modelId of modelIds) {
        await ensureTableSequence('project_assets');

        // ✅ Create project_assets record for Character-Model relationship
        // moduleId = character.id (as the parent/module)
        // moduleType = 'threed_character' (indicating this is a character)
        // assetType = 'threed_models' (indicating the asset is a model)
        // assetId = model.id (the specific model)
        await db.insert(projectAssets).values({
          userId,
          projectId: null, // Not directly tied to a project
          moduleId: newCharacter.id,
          moduleType: 'threed_character',
          assetType: 'threed_models',
          assetId: modelId,
          config: {
            // Store any character-specific model config here
            // e.g., animation overrides, scale overrides
          },
          isActive: true,
        });

        console.log(
          '[Characters API] Linked character',
          newCharacter.id,
          'to model',
          modelId
        );
      }

      console.log(
        '[Characters API] Added',
        modelIds.length,
        'character-model associations'
      );
    }

    // ✅ If moduleId is provided (ThreeD module association), create project_assets
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';

      const [module] = await db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.id, parsedModuleId),
            eq(threed.userId, userId)
          )
        )
        .limit(1);

      if (module) {
        await ensureTableSequence('project_assets');
        await db.insert(projectAssets).values({
          userId,
          projectId: module.projectId || null,
          moduleId: parsedModuleId,
          moduleType: moduleType,
          assetType: 'threed_characters', // The character as an asset
          assetId: newCharacter.id,
          config: body.assetConfig || {},
          isActive: true,
        });
        console.log(
          '[Characters API] Created project_assets association for character:',
          newCharacter.id
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: newCharacter,
      message: 'Character created successfully',
    });
  } catch (error) {
    console.error('[Characters API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create character',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/characters - Update a character
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing character ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid character ID' },
        { status: 400 }
      );
    }

    // ✅ Check if character exists and belongs to user
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

    const body = await request.json();

    // ✅ Parse animations
    let animationsArray: string[] = (existing.animations as string[]) || [];
    if (body.animations !== undefined) {
      if (Array.isArray(body.animations)) {
        animationsArray = body.animations;
      } else if (typeof body.animations === 'string') {
        animationsArray = body.animations
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    // ✅ Parse patrolWaypoints
    let patrolWaypointsArray: any[] = (existing.patrolWaypoints as any[]) || [];
    if (body.patrolWaypoints !== undefined) {
      if (Array.isArray(body.patrolWaypoints)) {
        patrolWaypointsArray = body.patrolWaypoints;
      } else if (typeof body.patrolWaypoints === 'string') {
        patrolWaypointsArray = body.patrolWaypoints
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    // ✅ Parse teleportPositions
    let teleportPositionsArray: any[] = (existing.teleportPositions as any[]) || [];
    if (body.teleportPositions !== undefined) {
      if (Array.isArray(body.teleportPositions)) {
        teleportPositionsArray = body.teleportPositions;
      } else if (typeof body.teleportPositions === 'string') {
        teleportPositionsArray = body.teleportPositions
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    // ✅ Update the character
    const [updated] = await db
      .update(threedCharacters)
      .set({
        name: body.name?.trim() || existing.name,
        description:
          body.description !== undefined ? body.description?.trim() || null : existing.description,
        type: body.type || existing.type,
        status: body.status || existing.status,

        animations: animationsArray,
        defaultAnimation:
          body.defaultAnimation !== undefined ? body.defaultAnimation : existing.defaultAnimation,
        animationSpeed: body.animationSpeed ? parseFloat(body.animationSpeed) : existing.animationSpeed,

        isMovable: body.isMovable !== undefined ? body.isMovable : existing.isMovable,
        movementType: body.movementType !== undefined ? body.movementType : existing.movementType,
        movementPattern:
          body.movementPattern !== undefined ? body.movementPattern : existing.movementPattern,
        movementRadius: body.movementRadius ? parseFloat(body.movementRadius) : existing.movementRadius,
        movementSpeed: body.movementSpeed ? parseFloat(body.movementSpeed) : existing.movementSpeed,
        patrolWaypoints: patrolWaypointsArray,
        followTarget: body.followTarget !== undefined ? body.followTarget : existing.followTarget,
        followDistance: body.followDistance ? parseFloat(body.followDistance) : existing.followDistance,
        teleportPositions: teleportPositionsArray,
        teleportInterval: body.teleportInterval ? parseInt(body.teleportInterval) : existing.teleportInterval,

        interactable: body.interactable !== undefined ? body.interactable : existing.interactable,
        interactionMessage:
          body.interactionMessage !== undefined ? body.interactionMessage : existing.interactionMessage,
        soundEffect: body.soundEffect !== undefined ? body.soundEffect : existing.soundEffect,

        defaultEmote: body.defaultEmote !== undefined ? body.defaultEmote : existing.defaultEmote,
        emoteOnInteract:
          body.emoteOnInteract !== undefined ? body.emoteOnInteract : existing.emoteOnInteract,

        activeStartHour: body.activeStartHour ? parseInt(body.activeStartHour) : existing.activeStartHour,
        activeEndHour: body.activeEndHour ? parseInt(body.activeEndHour) : existing.activeEndHour,

        weatherSensitivity:
          body.weatherSensitivity !== undefined ? body.weatherSensitivity : existing.weatherSensitivity,

        bedId: body.bedId ? parseInt(body.bedId) : existing.bedId,
        positionX: body.positionX ? parseFloat(body.positionX) : existing.positionX,
        positionY: body.positionY ? parseFloat(body.positionY) : existing.positionY,
        positionZ: body.positionZ ? parseFloat(body.positionZ) : existing.positionZ,
        rotation: body.rotation ? parseFloat(body.rotation) : existing.rotation,
        scale: body.scale ? parseFloat(body.scale) : existing.scale,
        scaleMultiplier: body.scaleMultiplier ? parseFloat(body.scaleMultiplier) : existing.scaleMultiplier,
        colorTint: body.colorTint !== undefined ? body.colorTint : existing.colorTint,

        visible: body.visible !== undefined ? body.visible : existing.visible,
        visibleDistance: body.visibleDistance ? parseFloat(body.visibleDistance) : existing.visibleDistance,

        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        metadata: body.metadata || existing.metadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedCharacters.id, parsedId),
          eq(threedCharacters.userId, userId)
        )
      )
      .returning();

    console.log('[Characters API] Updated character:', updated.id, updated.name);

    // ✅ Update Character-Model relationships via project_assets
    if (body.modelIds !== undefined) {
      // ✅ Delete existing character-model associations
      await db
        .delete(projectAssets)
        .where(
          and(
            eq(projectAssets.moduleId, parsedId),
            eq(projectAssets.moduleType, 'threed_character'),
            eq(projectAssets.assetType, 'threed_models'),
            eq(projectAssets.userId, userId)
          )
        );

      // ✅ Create new character-model associations
      const modelIds = body.modelIds
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((id) => !isNaN(id));

      for (const modelId of modelIds) {
        await ensureTableSequence('project_assets');
        await db.insert(projectAssets).values({
          userId,
          projectId: null,
          moduleId: parsedId,
          moduleType: 'threed_character',
          assetType: 'threed_models',
          assetId: modelId,
          config: body.modelConfigs?.[modelId] || {},
          isActive: true,
        });
      }

      console.log('[Characters API] Updated', modelIds.length, 'character-model associations');
    }

    // ✅ Handle ThreeD module association via project_assets
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';

      // ✅ Delete existing module association
      await db
        .delete(projectAssets)
        .where(
          and(
            eq(projectAssets.assetType, 'threed_characters'),
            eq(projectAssets.assetId, parsedId),
            eq(projectAssets.moduleId, parsedModuleId),
            eq(projectAssets.moduleType, moduleType),
            eq(projectAssets.userId, userId)
          )
        );

      // ✅ Create new module association
      await ensureTableSequence('project_assets');
      const [module] = await db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.id, parsedModuleId),
            eq(threed.userId, userId)
          )
        )
        .limit(1);

      await db.insert(projectAssets).values({
        userId,
        projectId: module?.projectId || null,
        moduleId: parsedModuleId,
        moduleType: moduleType,
        assetType: 'threed_characters',
        assetId: parsedId,
        config: body.assetConfig || {},
        isActive: true,
      });
      console.log('[Characters API] Updated module association for character:', parsedId);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Character updated successfully',
    });
  } catch (error) {
    console.error('[Characters API] PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update character',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/characters - Delete a character
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing character ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid character ID' },
        { status: 400 }
      );
    }

    // ✅ Check if character exists and belongs to user
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

    // ✅ Delete character-model associations (project_assets)
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.moduleId, parsedId),
          eq(projectAssets.moduleType, 'threed_character'),
          eq(projectAssets.assetType, 'threed_models'),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete module-level project_assets associations
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_characters'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the character
    const [deleted] = await db
      .delete(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, parsedId),
          eq(threedCharacters.userId, userId)
        )
      )
      .returning();

    console.log('[Characters API] Deleted character:', deleted.id, deleted.name);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Character deleted successfully',
    });
  } catch (error) {
    console.error('[Characters API] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete character',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}