// app/api/threed/world-actions/route.ts
// v0.16.6b — World Actions v2: authenticated targeted watering persistence
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  threedCharacters,
  threedHarvests,
  threedPlantings,
  threedWateringHistory,
} from '@/lib/schema/threed';
import { project, projectAssets } from '@/lib/schema/project';
import { and, eq } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ========================================================
// TYPES
// ========================================================

type WorldActionTarget = {
  type?: string;
  id?: number;
};

type WorldActionBody = {
  action?: string;
  characterId?: number;
  projectId?: number;
  target?: WorldActionTarget | null;
};

// ========================================================
// HELPERS
// ========================================================

function createWateringHistoryId() {
  const randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `water-${Date.now()}-${randomPart}`;
}

function createHarvestId() {
  const randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `harvest-${Date.now()}-${randomPart}`;
}

// ========================================================
// POST /api/threed/world-actions
// ========================================================

/**
 * Persist a completed semantic character action.
 *
 * IMPORTANT:
 * This route is called AFTER the client-side animation reports completion.
 * The browser supplies only the actor/action/target identity. Ownership,
 * plant identity, status, userId, and execution metadata are resolved on
 * the server instead of trusting client-provided values.
 *
 * Supported mutations are targeted `watering` and the targeted fruit-picking
 * actions (`pickFruit`, `pickFruit2`, `pickFruit3`).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    const body = (await request.json()) as WorldActionBody;
    const action = body.action;
    const characterId = Number(body.characterId);
    const projectId = Number(body.projectId);
    const target = body.target;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(characterId)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid characterId' },
        { status: 400 },
      );
    }

    const isWatering = action === 'watering';
    const isHarvest = ['pickFruit', 'pickFruit2', 'pickFruit3'].includes(action);

    if (!isWatering && !isHarvest) {
      return NextResponse.json(
        {
          success: false,
          error: `World action "${action}" is not persisted yet`,
        },
        { status: 400 },
      );
    }

    if (target?.type !== 'planting') {
      return NextResponse.json(
        {
          success: false,
          error: `${isHarvest ? 'Harvesting' : 'Watering'} requires a planting target`,
        },
        { status: 400 },
      );
    }

    const plantingId = Number(target.id);

    if (!Number.isFinite(plantingId)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid planting target ID' },
        { status: 400 },
      );
    }

    if (isHarvest && !Number.isFinite(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid projectId' },
        { status: 400 },
      );
    }

    // ------------------------------------------------------
    // VERIFY ACTOR OWNERSHIP
    // ------------------------------------------------------

    const [character] = await db
      .select({
        id: threedCharacters.id,
        name: threedCharacters.name,
      })
      .from(threedCharacters)
      .where(
        and(
          eq(threedCharacters.id, characterId),
          eq(threedCharacters.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!character) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 },
      );
    }

    if (isHarvest) {
      const [ownedProject] = await db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!ownedProject) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 },
        );
      }
    }

    // ------------------------------------------------------
    // VERIFY TARGET OWNERSHIP + RESOLVE PLANT ID
    // ------------------------------------------------------

    const [planting] = await db
      .select({
        id: threedPlantings.id,
        plantingId: threedPlantings.plantingId,
        plantId: threedPlantings.plantId,
      })
      .from(threedPlantings)
      .where(
        and(
          eq(threedPlantings.id, plantingId),
          eq(threedPlantings.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!planting) {
      return NextResponse.json(
        { success: false, error: 'Planting not found' },
        { status: 404 },
      );
    }

    if (isHarvest) {
      const [plantingAssignment] = await db
        .select({ moduleId: projectAssets.moduleId })
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.projectId, projectId),
            eq(projectAssets.userId, session.user.id),
            eq(projectAssets.assetType, 'threed_plantings'),
            eq(projectAssets.assetId, planting.id),
            eq(projectAssets.isActive, true),
          ),
        )
        .limit(1);

      if (!plantingAssignment) {
        return NextResponse.json(
          { success: false, error: 'Planting is not assigned to this project' },
          { status: 400 },
        );
      }

      await ensureTableSequence('threed_harvests');
      await ensureTableSequence('project_assets');

      const result = await db.transaction(async (tx) => {
        const [harvestRecord] = await tx
          .insert(threedHarvests)
          .values({
            userId,
            harvestId: createHarvestId(),
            plantingId: planting.id,
            plantId: planting.plantId,
            quantity: '1',
            unit: 'each',
            harvestDate: new Date(),
            notes: `${action} completed by ${character.name}`,
            isActive: true,
          })
          .returning();

        const [projectAsset] = await tx
          .insert(projectAssets)
          .values({
            userId,
            projectId,
            moduleId: plantingAssignment.moduleId,
            moduleType: 'threed',
            assetType: 'threed_harvests',
            assetId: harvestRecord.id,
            config: {
              source: 'world-action',
              action,
              characterId: character.id,
              plantingId: planting.id,
            },
            isActive: true,
          })
          .returning();

        return { harvestRecord, projectAsset };
      });

      return NextResponse.json({
        success: true,
        action,
        actor: {
          id: character.id,
          name: character.name,
        },
        target: {
          type: 'planting',
          id: planting.id,
          plantingId: planting.plantingId,
          plantId: planting.plantId,
        },
        projectId,
        data: result.harvestRecord,
        projectAsset: result.projectAsset,
      });
    }

    // ------------------------------------------------------
    // PERSIST COMPLETED WATERING
    // ------------------------------------------------------

    const [wateringRecord] = await db
      .insert(threedWateringHistory)
      .values({
        userId: session.user.id,
        historyId: createWateringHistoryId(),
        plantingId: planting.id,
        plantId: planting.plantId,
        status: 'success',
        executedBy: 'user',
        executedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      action,
      actor: {
        id: character.id,
        name: character.name,
      },
      target: {
        type: 'planting',
        id: planting.id,
        plantingId: planting.plantingId,
        plantId: planting.plantId,
      },
      data: wateringRecord,
    });
  } catch (error) {
    console.error('[WorldActions] Failed to persist world action:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to persist world action',
      },
      { status: 500 },
    );
  }
}
