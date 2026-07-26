// app/api/threed/beds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedBeds, threed } from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/beds
// Query Parameters:
//   - id: Get a single bed
//   - moduleId: Get beds associated with a specific ThreeD module (via project_assets)
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

    // ✅ Get a single bed by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid bed ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedBeds)
        .where(eq(threedBeds.id, parsedId));

      if (!userId) {
        query = query.where(eq(threedBeds.isActive, true));
      } else {
        query = query.where(
          or(
            eq(threedBeds.userId, userId),
            eq(threedBeds.isActive, true)
          )
        );
      }

      const [bed] = await query.limit(1);

      if (!bed) {
        return NextResponse.json(
          { success: false, error: 'Bed not found' },
          { status: 404 }
        );
      }

      // ✅ Get project asset associations
      const assetAssociations = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.assetType, 'threed_beds'),
            eq(projectAssets.assetId, bed.id),
            eq(projectAssets.userId, userId || '')
          )
        );

      return NextResponse.json({
        success: true,
        data: {
          ...bed,
          projectAssets: assetAssociations,
        },
      });
    }

    // ✅ Get beds for a specific ThreeD module (via project_assets)
    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (isNaN(parsedModuleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid module ID' },
          { status: 400 }
        );
      }

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // ✅ Get beds via project_assets junction
      const results = await db
        .select()
        .from(threedBeds)
        .innerJoin(
          projectAssets,
          and(
            eq(projectAssets.assetId, threedBeds.id),
            eq(projectAssets.assetType, 'threed_beds'),
            eq(projectAssets.moduleId, parsedModuleId),
            eq(projectAssets.moduleType, 'threed'),
            eq(projectAssets.userId, userId)
          )
        )
        .orderBy(desc(threedBeds.createdAt));

      const beds = results.map((row) => ({
        ...row.threedBeds,
        projectAssetConfig: row.projectAssets.config,
        isActiveInProject: row.projectAssets.isActive,
        projectAssetId: row.projectAssets.id,
      }));

      return NextResponse.json({
        success: true,
        data: beds,
        count: beds.length,
      });
    }

    // ✅ List all beds
    let query = db
      .select()
      .from(threedBeds)
      .$dynamic();

    if (!userId) {
      query = query.where(eq(threedBeds.isActive, true));
    } else {
      query = query.where(
        or(
          eq(threedBeds.userId, userId),
          eq(threedBeds.isActive, true)
        )
      );
    }

    if (isActive !== null) {
      query = query.where(eq(threedBeds.isActive, isActive === 'true'));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedBeds)
      .where(query._where);

    const beds = await query
      .orderBy(desc(threedBeds.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: beds,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Beds API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch beds' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/beds - Create a new bed
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

    // ✅ Required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // ✅ Create the bed (free-standing, no module ID)
    await ensureTableSequence('threed_beds');

    const [newBed] = await db
      .insert(threedBeds)
      .values({
        userId,
        bedId: `${body.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        shape: body.shape || 'rectangle',
        widthFeet: body.widthFeet !== undefined ? parseFloat(body.widthFeet) : null,
        lengthFeet: body.lengthFeet !== undefined ? parseFloat(body.lengthFeet) : null,
        heightFeet: body.heightFeet !== undefined ? parseFloat(body.heightFeet) : null,
        soilType: body.soilType?.trim() || null,
        sunExposure: body.sunExposure?.trim() || null,
        positionX: body.positionX !== undefined ? parseFloat(body.positionX) : 0,
        positionY: body.positionY !== undefined ? parseFloat(body.positionY) : 0,
        positionZ: body.positionZ !== undefined ? parseFloat(body.positionZ) : 0,
        rotation: body.rotation !== undefined ? parseFloat(body.rotation) : 0,
        scale: body.scale !== undefined ? parseFloat(body.scale) : 1,
        color: body.color || '#8B5E3C',
        notes: body.notes?.trim() || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .returning();

    // ✅ If moduleId is provided, create project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';
      
      // Verify module exists
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
          assetType: 'threed_beds',
          assetId: newBed.id,
          config: body.assetConfig || {},
          isActive: true,
        });
        console.log('[Beds API] Created project_assets association for bed:', newBed.id);
      }
    }

    console.log('[Beds API] Created bed:', newBed.id, newBed.name);

    return NextResponse.json({
      success: true,
      data: newBed,
      message: 'Bed created successfully',
    });
  } catch (error) {
    console.error('[Beds API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bed' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/beds - Update a bed
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
        { success: false, error: 'Missing bed ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bed ID' },
        { status: 400 }
      );
    }

    // ✅ Check if bed exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // ✅ Update the bed
    const [updated] = await db
      .update(threedBeds)
      .set({
        name: body.name?.trim() || existing.name,
        description: body.description !== undefined ? body.description?.trim() || null : existing.description,
        shape: body.shape || existing.shape,
        widthFeet: body.widthFeet !== undefined ? parseFloat(body.widthFeet) : existing.widthFeet,
        lengthFeet: body.lengthFeet !== undefined ? parseFloat(body.lengthFeet) : existing.lengthFeet,
        heightFeet: body.heightFeet !== undefined ? parseFloat(body.heightFeet) : existing.heightFeet,
        soilType: body.soilType !== undefined ? body.soilType?.trim() || null : existing.soilType,
        sunExposure: body.sunExposure !== undefined ? body.sunExposure?.trim() || null : existing.sunExposure,
        positionX: body.positionX !== undefined ? parseFloat(body.positionX) : existing.positionX,
        positionY: body.positionY !== undefined ? parseFloat(body.positionY) : existing.positionY,
        positionZ: body.positionZ !== undefined ? parseFloat(body.positionZ) : existing.positionZ,
        rotation: body.rotation !== undefined ? parseFloat(body.rotation) : existing.rotation,
        scale: body.scale !== undefined ? parseFloat(body.scale) : existing.scale,
        color: body.color || existing.color,
        notes: body.notes !== undefined ? body.notes?.trim() || null : existing.notes,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .returning();

    // ✅ Handle project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';
      
      // Check if association exists
      const [existingAsset] = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.assetType, 'threed_beds'),
            eq(projectAssets.assetId, parsedId),
            eq(projectAssets.moduleId, parsedModuleId),
            eq(projectAssets.moduleType, moduleType),
            eq(projectAssets.userId, userId)
          )
        )
        .limit(1);

      if (existingAsset) {
        // Update existing association
        await db
          .update(projectAssets)
          .set({
            config: body.assetConfig || existingAsset.config,
            updatedAt: new Date(),
          })
          .where(eq(projectAssets.id, existingAsset.id));
        console.log('[Beds API] Updated project_assets association for bed:', parsedId);
      } else {
        // Create new association
        await ensureTableSequence('project_assets');
        
        // Get the module to find projectId
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
          assetType: 'threed_beds',
          assetId: parsedId,
          config: body.assetConfig || {},
          isActive: true,
        });
        console.log('[Beds API] Created project_assets association for bed:', parsedId);
      }
    }

    console.log('[Beds API] Updated bed:', updated.id, updated.name);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Bed updated successfully',
    });
  } catch (error) {
    console.error('[Beds API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bed' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/beds - Delete a bed
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
        { success: false, error: 'Missing bed ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bed ID' },
        { status: 400 }
      );
    }

    // ✅ Check if bed exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    // ✅ Delete project_assets associations first
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_beds'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the bed
    const [deleted] = await db
      .delete(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parsedId),
          eq(threedBeds.userId, userId)
        )
      )
      .returning();

    console.log('[Beds API] Deleted bed:', deleted.id, deleted.name);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Bed deleted successfully',
    });
  } catch (error) {
    console.error('[Beds API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bed' },
      { status: 500 }
    );
  }
}