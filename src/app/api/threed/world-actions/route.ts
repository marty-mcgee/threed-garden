// app/api/threed/world-actions/route.ts
// v0.16.6b — World Actions: Watering + Fruit Harvest persistence
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  threedCharacters,
  threedHarvests,
  threedPlantings,
  threedWateringHistory,
} from '@/lib/schema/threed';
import { and, eq } from 'drizzle-orm';

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
  target?: WorldActionTarget | null;
};

// ========================================================
// HELPERS
// ========================================================

function createRecordId(prefix: 'water' | 'harvest') {
  const randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function isFruitPickingAction(action: string) {
  return action === 'pickFruit' || action === 'pickFruit2' || action === 'pickFruit3';
}

// ========================================================
// POST /api/threed/world-actions
// ========================================================

/**
 * Persist a completed semantic character action.
 *
 * IMPORTANT:
 * This route is called only AFTER the client-side animation reports completion.
 * The browser supplies only actor/action/target identity. Ownership, plant identity,
 * status, userId, and persistence metadata are resolved server-side.
 *
 * v0.16.6b persists:
 *   watering                    -> threed_watering_history
 *   pickFruit / pickFruit2 / 3 -> threed_harvests
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

    const body = (await request.json()) as WorldActionBody;
    const action = body.action;
    const characterId = Number(body.characterId);
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

    const supportedAction = action === 'watering' || isFruitPickingAction(action);

    if (!supportedAction) {
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
          error: `${action === 'watering' ? 'Watering' : 'Fruit picking'} requires a planting target`,
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

    // ------------------------------------------------------
    // PERSIST COMPLETED WATERING
    // ------------------------------------------------------

    if (action === 'watering') {
      const [wateringRecord] = await db
        .insert(threedWateringHistory)
        .values({
          userId: session.user.id,
          historyId: createRecordId('water'),
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
        persistenceType: 'wateringHistory',
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
    }

    // ------------------------------------------------------
    // PERSIST COMPLETED FRUIT HARVEST
    // ------------------------------------------------------

    const [harvestRecord] = await db
      .insert(threedHarvests)
      .values({
        userId: session.user.id,
        harvestId: createRecordId('harvest'),
        plantingId: planting.id,
        plantId: planting.plantId,
        // A single Pick Fruit action represents one harvested item for now.
        // We keep this intentionally conservative until inventory/quantity UI exists.
        quantity: '1.00',
        unit: 'pieces',
        notes: `Recorded by character action ${action} (character #${character.id})`,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      action,
      persistenceType: 'harvest',
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
      data: harvestRecord,
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
