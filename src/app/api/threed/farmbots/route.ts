// app/api/threed/farmbots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedFarmbots, 
  threedBeds,
} from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/farmbots
// Query Parameters:
//   - id: Get a single FarmBot
//   - moduleId: Get FarmBots for a specific ThreeD module (via project_assets)
//   - status: Filter by status
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
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get a single FarmBot by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid FarmBot ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedFarmbots)
        .where(eq(threedFarmbots.id, parsedId));

      if (!userId) {
        query = query.where(eq(threedFarmbots.isActive, true));
      } else {
        query = query.where(
          or(
            eq(threedFarmbots.userId, userId),
            eq(threedFarmbots.isActive, true)
          )
        );
      }

      const [farmbot] = await query.limit(1);

      if (!farmbot) {
        return NextResponse.json(
          { success: false, error: 'FarmBot not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: farmbot,
      });
    }

    // ✅ Build query for listing FarmBots
    let query = db
      .select()
      .from(threedFarmbots)
      .$dynamic();

    if (!userId) {
      query = query.where(eq(threedFarmbots.isActive, true));
    } else {
      query = query.where(
        or(
          eq(threedFarmbots.userId, userId),
          eq(threedFarmbots.isActive, true)
        )
      );
    }

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(threedFarmbots.status, status));
    }
    if (isActive !== null) {
      query = query.where(eq(threedFarmbots.isActive, isActive === 'true'));
    }

    // ✅ Filter by moduleId via project_assets
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
              eq(projectAssets.assetType, 'threed_farmbots'),
              eq(projectAssets.userId, userId || '')
            )
          );

        const farmbotIds = assetLinks.map((link) => link.assetId);
        if (farmbotIds.length > 0) {
          query = query.where(sql`${threedFarmbots.id} IN (${sql.join(farmbotIds)})`);
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
      .from(threedFarmbots)
      .where(query._where);

    const farmbots = await query
      .orderBy(desc(threedFarmbots.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: farmbots,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[FarmBots API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FarmBots' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/farmbots - Create a new FarmBot
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

    console.log('[FarmBots API] POST - Received body:', body);

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!body.deviceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: deviceId' },
        { status: 400 }
      );
    }

    await ensureTableSequence('threed_farmbots');

    // ✅ Build values object - let database handle createdAt/updatedAt
    const values: any = {
      userId,
      deviceId: body.deviceId.trim(),
      name: body.name.trim(),
      status: body.status || 'offline',
      bedId: body.bedId ? parseInt(body.bedId) : null,
      positionX: body.positionX ? parseFloat(body.positionX) : 0,
      positionY: body.positionY ? parseFloat(body.positionY) : 0,
      positionZ: body.positionZ ? parseFloat(body.positionZ) : 0,
      apiToken: body.apiToken || null,
      apiUrl: body.apiUrl || null,
      firmwareVersion: body.firmwareVersion || null,
      notes: body.notes || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    console.log('[FarmBots API] Inserting values:', values);

    const [newFarmbot] = await db
      .insert(threedFarmbots)
      .values(values)
      .returning();

    // ✅ If moduleId is provided, create project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      if (!isNaN(parsedModuleId)) {
        await ensureTableSequence('project_assets');
        await db.insert(projectAssets).values({
          userId,
          projectId: null,
          moduleId: parsedModuleId,
          moduleType: 'threed',
          assetType: 'threed_farmbots',
          assetId: newFarmbot.id,
          config: {},
          isActive: true,
        });
        console.log('[FarmBots API] Created project_assets association for FarmBot:', newFarmbot.id);
      }
    }

    console.log('[FarmBots API] Created FarmBot:', newFarmbot.id, newFarmbot.name);

    return NextResponse.json({
      success: true,
      data: newFarmbot,
      message: 'FarmBot created successfully',
    });
  } catch (error) {
    console.error('[FarmBots API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create FarmBot', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/farmbots - Update a FarmBot
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
        { success: false, error: 'Missing FarmBot ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FarmBot ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'FarmBot not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('[FarmBots API] PUT - Updating FarmBot:', parsedId, body);

    // ✅ Build updateData - start empty, only add what's provided
    const updateData: any = {};

    // ✅ Only add fields if they exist in the request body
    if (body.name !== undefined) {
      updateData.name = body.name?.trim() || existing.name;
    }
    if (body.deviceId !== undefined) {
      updateData.deviceId = body.deviceId?.trim() || existing.deviceId;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.bedId !== undefined) {
      updateData.bedId = (body.bedId && body.bedId !== '' && !isNaN(parseInt(body.bedId))) 
        ? parseInt(body.bedId) 
        : null;
    }
    if (body.positionX !== undefined) {
      updateData.positionX = body.positionX ? parseFloat(body.positionX) : 0;
    }
    if (body.positionY !== undefined) {
      updateData.positionY = body.positionY ? parseFloat(body.positionY) : 0;
    }
    if (body.positionZ !== undefined) {
      updateData.positionZ = body.positionZ ? parseFloat(body.positionZ) : 0;
    }
    if (body.apiToken !== undefined) {
      updateData.apiToken = body.apiToken || null;
    }
    if (body.apiUrl !== undefined) {
      updateData.apiUrl = body.apiUrl || null;
    }
    if (body.firmwareVersion !== undefined) {
      updateData.firmwareVersion = body.firmwareVersion || null;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // ✅ updatedAt is handled by the database ($onUpdateFn)
    // No need to set it here

    console.log('[FarmBots API] Updating with values:', updateData);

    const [updated] = await db
      .update(threedFarmbots)
      .set(updateData)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .returning();

    console.log('[FarmBots API] Updated FarmBot:', updated.id, updated.name);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'FarmBot updated successfully',
    });
  } catch (error) {
    console.error('[FarmBots API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update FarmBot', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/farmbots - Delete a FarmBot
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
        { success: false, error: 'Missing FarmBot ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FarmBot ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'FarmBot not found' },
        { status: 404 }
      );
    }

    // ✅ Delete project_assets associations
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_farmbots'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the FarmBot
    const [deleted] = await db
      .delete(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parsedId),
          eq(threedFarmbots.userId, userId)
        )
      )
      .returning();

    console.log('[FarmBots API] Deleted FarmBot:', deleted.id, deleted.name);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'FarmBot deleted successfully',
    });
  } catch (error) {
    console.error('[FarmBots API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete FarmBot' },
      { status: 500 }
    );
  }
}