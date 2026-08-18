// app/api/threed/harvests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedHarvests, 
  threedPlantings, 
  threedPlants,
  threedBeds,
} from '@/lib/schema/threed';
import { project, projectAssets } from '@/lib/schema/project';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/harvests
// Query Parameters:
//   - id: Get a single harvest
//   - projectId/moduleId: Scope harvests through project_assets
//   - plantId: Filter by plant
//   - plantingId: Filter by planting
//   - limit, offset: Pagination
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const moduleId = searchParams.get('moduleId');
    const plantId = searchParams.get('plantId');
    const plantingId = searchParams.get('plantingId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const parsedId = id ? Number(id) : null;
    const parsedProjectId = projectId ? Number(projectId) : null;
    const parsedModuleId = moduleId ? Number(moduleId) : null;
    if ((id && !Number.isInteger(parsedId)) || (projectId && !Number.isInteger(parsedProjectId)) || (moduleId && !Number.isInteger(parsedModuleId))) {
      return NextResponse.json({ success: false, error: 'Invalid ID filter' }, { status: 400 });
    }

    let scopedHarvestIds: number[] | null = null;
    if (parsedProjectId || parsedModuleId) {
      const scopeConditions = [
        eq(projectAssets.userId, userId),
        eq(projectAssets.moduleType, 'threed'),
        eq(projectAssets.assetType, 'threed_harvests'),
        eq(projectAssets.isActive, true),
      ];
      if (parsedProjectId) scopeConditions.push(eq(projectAssets.projectId, parsedProjectId));
      if (parsedModuleId) scopeConditions.push(eq(projectAssets.moduleId, parsedModuleId));
      const links = await db.select({ assetId: projectAssets.assetId }).from(projectAssets).where(and(...scopeConditions));
      scopedHarvestIds = links.map((link) => link.assetId);
      if (scopedHarvestIds.length === 0) {
        return NextResponse.json({ success: true, data: [], pagination: { limit, offset, total: 0 } });
      }
    }

    const conditions = [eq(threedHarvests.userId, userId)];
    if (parsedId) conditions.push(eq(threedHarvests.id, parsedId));
    if (plantId) {
      const parsedPlantId = Number(plantId);
      if (!Number.isInteger(parsedPlantId)) return NextResponse.json({ success: false, error: 'Invalid plantId' }, { status: 400 });
      conditions.push(eq(threedHarvests.plantId, parsedPlantId));
    }
    if (plantingId) {
      const parsedPlantingId = Number(plantingId);
      if (!Number.isInteger(parsedPlantingId)) return NextResponse.json({ success: false, error: 'Invalid plantingId' }, { status: 400 });
      conditions.push(eq(threedHarvests.plantingId, parsedPlantingId));
    }
    if (scopedHarvestIds) conditions.push(inArray(threedHarvests.id, scopedHarvestIds));

    const where = and(...conditions);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(threedHarvests).where(where);
    const harvests = await db.select().from(threedHarvests).where(where)
      .orderBy(desc(threedHarvests.harvestDate), desc(threedHarvests.createdAt))
      .limit(limit)
      .offset(offset);

    const harvestIds = harvests.map((harvest) => harvest.id);
    const plantingIds = harvests.flatMap((harvest) => harvest.plantingId ? [harvest.plantingId] : []);
    const [plantings, associations] = await Promise.all([
      plantingIds.length
        ? db.select().from(threedPlantings).where(and(eq(threedPlantings.userId, userId), inArray(threedPlantings.id, plantingIds)))
        : Promise.resolve([]),
      harvestIds.length
        ? db.select().from(projectAssets).where(and(
            eq(projectAssets.userId, userId),
            eq(projectAssets.assetType, 'threed_harvests'),
            inArray(projectAssets.assetId, harvestIds),
            eq(projectAssets.isActive, true),
          ))
        : Promise.resolve([]),
    ]);
    const plantingById = new Map(plantings.map((planting) => [planting.id, planting]));
    const plantIds = Array.from(new Set(harvests.flatMap((harvest) => {
      const resolved = harvest.plantId ?? (harvest.plantingId ? plantingById.get(harvest.plantingId)?.plantId : null);
      return resolved ? [resolved] : [];
    })));
    const bedIds = Array.from(new Set(plantings.flatMap((planting) => planting.bedId ? [planting.bedId] : [])));
    const [plants, beds] = await Promise.all([
      plantIds.length
        ? db.select().from(threedPlants).where(and(eq(threedPlants.userId, userId), inArray(threedPlants.id, plantIds)))
        : Promise.resolve([]),
      bedIds.length
        ? db.select().from(threedBeds).where(and(eq(threedBeds.userId, userId), inArray(threedBeds.id, bedIds)))
        : Promise.resolve([]),
    ]);
    const plantById = new Map(plants.map((plant) => [plant.id, plant]));
    const bedById = new Map(beds.map((bed) => [bed.id, bed]));
    const associationsByHarvest = new Map<number, typeof associations>();
    for (const association of associations) {
      const list = associationsByHarvest.get(association.assetId) ?? [];
      list.push(association);
      associationsByHarvest.set(association.assetId, list);
    }

    const enriched = harvests.map((harvest) => {
      const planting = harvest.plantingId ? plantingById.get(harvest.plantingId) : undefined;
      const resolvedPlantId = harvest.plantId ?? planting?.plantId;
      const projectAssociations = associationsByHarvest.get(harvest.id) ?? [];
      const source = projectAssociations.some((association) => (association.config as { source?: string } | null)?.source === 'world-action')
        ? 'world-action'
        : 'manual';
      return {
        ...harvest,
        planting: planting ?? null,
        plant: resolvedPlantId ? plantById.get(resolvedPlantId) ?? null : null,
        bed: planting?.bedId ? bedById.get(planting.bedId) ?? null : null,
        projectAssociations,
        source,
      };
    });

    if (parsedId) {
      if (!enriched[0]) return NextResponse.json({ success: false, error: 'Harvest not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: enriched[0] });
    }

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: {
        limit,
        offset,
        total: Number(count) || 0,
      },
    });
  } catch (error) {
    console.error('[Harvests API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch harvests' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/harvests - Create a new harvest
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

    console.log('[Harvests API] POST - Received body:', body);

    if (!body.plantId && !body.plantingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: plantId or plantingId' },
        { status: 400 }
      );
    }

    const plantingId = body.plantingId ? Number(body.plantingId) : null;
    const requestedPlantId = body.plantId ? Number(body.plantId) : null;
    const projectId = body.projectId ? Number(body.projectId) : null;
    const quantity = body.quantity === '' || body.quantity == null ? null : Number(body.quantity);
    const weightLbs = body.weightLbs === '' || body.weightLbs == null ? null : Number(body.weightLbs);

    if ((plantingId && !Number.isInteger(plantingId)) || (requestedPlantId && !Number.isInteger(requestedPlantId)) || (projectId && !Number.isInteger(projectId))) {
      return NextResponse.json({ success: false, error: 'Invalid project, plant, or planting ID' }, { status: 400 });
    }
    if (quantity != null && (!Number.isFinite(quantity) || quantity <= 0)) {
      return NextResponse.json({ success: false, error: 'Quantity must be greater than zero' }, { status: 400 });
    }
    if (weightLbs != null && (!Number.isFinite(weightLbs) || weightLbs < 0)) {
      return NextResponse.json({ success: false, error: 'Weight cannot be negative' }, { status: 400 });
    }

    const [planting] = plantingId
      ? await db.select().from(threedPlantings).where(and(eq(threedPlantings.id, plantingId), eq(threedPlantings.userId, userId))).limit(1)
      : [];
    if (plantingId && !planting) {
      return NextResponse.json({ success: false, error: 'Planting not found' }, { status: 404 });
    }

    const plantId = planting?.plantId ?? requestedPlantId;
    const [plant] = plantId
      ? await db.select({ id: threedPlants.id }).from(threedPlants).where(and(eq(threedPlants.id, plantId), eq(threedPlants.userId, userId))).limit(1)
      : [];
    if (plantId && !plant) {
      return NextResponse.json({ success: false, error: 'Plant not found' }, { status: 404 });
    }

    let projectScope: { projectId: number; moduleId: number } | null = null;
    if (projectId) {
      if (!plantingId) {
        return NextResponse.json({ success: false, error: 'A project-scoped harvest requires a planting' }, { status: 400 });
      }
      const [ownedProject] = await db.select({ id: project.id }).from(project).where(and(eq(project.id, projectId), eq(project.userId, userId))).limit(1);
      if (!ownedProject) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      const [assignment] = await db.select({ moduleId: projectAssets.moduleId }).from(projectAssets).where(and(
        eq(projectAssets.projectId, projectId),
        eq(projectAssets.userId, userId),
        eq(projectAssets.assetType, 'threed_plantings'),
        eq(projectAssets.assetId, plantingId),
        eq(projectAssets.isActive, true),
      )).limit(1);
      if (!assignment) return NextResponse.json({ success: false, error: 'Planting is not assigned to this project' }, { status: 400 });
      projectScope = { projectId, moduleId: assignment.moduleId };
    }

    // ✅ Generate harvestId
    const harvestId = body.harvestId || `harvest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await ensureTableSequence('threed_harvests');

    // ✅ Build values object
    const values: any = {
      userId,
      harvestId,
      plantingId,
      plantId,
      quantity: quantity == null ? null : String(quantity),
      unit: body.unit || 'lbs',
      weightLbs: weightLbs == null ? null : String(weightLbs),
      harvestDate: body.harvestDate || new Date().toISOString().split('T')[0],
      notes: body.notes || null,
      imageUrl: body.imageUrl || null,
    };

    console.log('[Harvests API] Inserting values:', values);

    if (projectScope) await ensureTableSequence('project_assets');
    const result = await db.transaction(async (tx) => {
      const [newHarvest] = await tx.insert(threedHarvests).values(values).returning();
      let association = null;
      if (projectScope) {
        [association] = await tx.insert(projectAssets).values({
          userId,
          projectId: projectScope.projectId,
          moduleId: projectScope.moduleId,
          moduleType: 'threed',
          assetType: 'threed_harvests',
          assetId: newHarvest.id,
          config: { source: 'manual' },
          isActive: true,
        }).returning();
      }
      return { newHarvest, association };
    });
    const newHarvest = result.newHarvest;

    console.log('[Harvests API] Created harvest:', newHarvest.id, newHarvest.harvestId);

    return NextResponse.json({
      success: true,
      data: newHarvest,
      projectAssociation: result.association,
      message: 'Harvest created successfully',
    });
  } catch (error) {
    console.error('[Harvests API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create harvest', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/harvests - Update a harvest
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
        { success: false, error: 'Missing harvest ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid harvest ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedHarvests)
      .where(
        and(
          eq(threedHarvests.id, parsedId),
          eq(threedHarvests.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Harvest not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('[Harvests API] PUT - Updating harvest:', parsedId, body);

    // ✅ Build updateData - start empty, only add what's provided
    const updateData: any = {};

    if (body.harvestId !== undefined) {
      const harvestId = String(body.harvestId).trim();
      if (!harvestId) return NextResponse.json({ success: false, error: 'Harvest ID is required' }, { status: 400 });
      updateData.harvestId = harvestId;
    }

    if (body.plantingId !== undefined) {
      const nextPlantingId = body.plantingId ? Number(body.plantingId) : null;
      const [nextPlanting] = nextPlantingId
        ? await db.select({ id: threedPlantings.id, plantId: threedPlantings.plantId }).from(threedPlantings).where(and(eq(threedPlantings.id, nextPlantingId), eq(threedPlantings.userId, userId))).limit(1)
        : [];
      if (nextPlantingId && !nextPlanting) return NextResponse.json({ success: false, error: 'Planting not found' }, { status: 404 });
      const harvestAssociations = await db.select({ projectId: projectAssets.projectId }).from(projectAssets).where(and(
        eq(projectAssets.userId, userId),
        eq(projectAssets.assetType, 'threed_harvests'),
        eq(projectAssets.assetId, existing.id),
        eq(projectAssets.isActive, true),
      ));
      if (nextPlantingId) {
        for (const association of harvestAssociations) {
          if (!association.projectId) continue;
          const [plantingAssignment] = await db.select({ id: projectAssets.id }).from(projectAssets).where(and(
            eq(projectAssets.userId, userId),
            eq(projectAssets.projectId, association.projectId),
            eq(projectAssets.assetType, 'threed_plantings'),
            eq(projectAssets.assetId, nextPlantingId),
            eq(projectAssets.isActive, true),
          )).limit(1);
          if (!plantingAssignment) {
            return NextResponse.json({ success: false, error: 'Planting is not assigned to the harvest project' }, { status: 400 });
          }
        }
      }
      updateData.plantingId = nextPlantingId;
      if (nextPlanting?.plantId) updateData.plantId = nextPlanting.plantId;
    }
    if (body.plantId !== undefined) {
      const nextPlantId = body.plantId ? Number(body.plantId) : null;
      const [nextPlant] = nextPlantId
        ? await db.select({ id: threedPlants.id }).from(threedPlants).where(and(eq(threedPlants.id, nextPlantId), eq(threedPlants.userId, userId))).limit(1)
        : [];
      if (nextPlantId && !nextPlant) return NextResponse.json({ success: false, error: 'Plant not found' }, { status: 404 });
      updateData.plantId = nextPlantId;
    }
    if (body.quantity !== undefined) {
      const quantity = body.quantity === '' || body.quantity == null ? null : Number(body.quantity);
      if (quantity != null && (!Number.isFinite(quantity) || quantity <= 0)) {
        return NextResponse.json({ success: false, error: 'Quantity must be greater than zero' }, { status: 400 });
      }
      updateData.quantity = quantity == null ? null : String(quantity);
    }
    if (body.unit !== undefined) {
      updateData.unit = body.unit || 'lbs';
    }
    if (body.weightLbs !== undefined) {
      const weight = body.weightLbs === '' || body.weightLbs == null ? null : Number(body.weightLbs);
      if (weight != null && (!Number.isFinite(weight) || weight < 0)) {
        return NextResponse.json({ success: false, error: 'Weight cannot be negative' }, { status: 400 });
      }
      updateData.weightLbs = weight == null ? null : String(weight);
    }
    if (body.harvestDate !== undefined) {
      updateData.harvestDate = body.harvestDate || null;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }
    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl || null;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    updateData.updatedAt = new Date();

    // ✅ updatedAt is handled by the database ($onUpdateFn)
    // No need to set it here

    console.log('[Harvests API] Updating with values:', updateData);

    const [updated] = await db
      .update(threedHarvests)
      .set(updateData)
      .where(
        and(
          eq(threedHarvests.id, parsedId),
          eq(threedHarvests.userId, userId)
        )
      )
      .returning();

    console.log('[Harvests API] Updated harvest:', updated.id, updated.harvestId);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Harvest updated successfully',
    });
  } catch (error) {
    console.error('[Harvests API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update harvest', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

// ============================================
// DELETE /api/threed/harvests - Delete a harvest
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
        { success: false, error: 'Missing harvest ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid harvest ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedHarvests)
      .where(
        and(
          eq(threedHarvests.id, parsedId),
          eq(threedHarvests.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Harvest not found' },
        { status: 404 }
      );
    }

    const deleted = await db.transaction(async (tx) => {
      await tx.delete(projectAssets).where(and(
        eq(projectAssets.assetType, 'threed_harvests'),
        eq(projectAssets.assetId, parsedId),
        eq(projectAssets.userId, userId),
      ));

      const [deletedHarvest] = await tx.delete(threedHarvests).where(and(
        eq(threedHarvests.id, parsedId),
        eq(threedHarvests.userId, userId),
      )).returning();

      return deletedHarvest;
    });

    console.log('[Harvests API] Deleted harvest:', deleted.id, deleted.harvestId);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Harvest deleted successfully',
    });
  } catch (error) {
    console.error('[Harvests API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete harvest' },
      { status: 500 }
    );
  }
}
