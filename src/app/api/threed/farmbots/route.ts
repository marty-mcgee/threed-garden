// app/api/threed/farmbots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedFarmbots, threed } from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/farmbots - List farmbots (PUBLIC)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const threedId = searchParams.get('threedId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (id) {
      let query = db
        .select()
        .from(threedFarmbots)
        .where(eq(threedFarmbots.id, parseInt(id)));

      if (!userId) {
        query = query.where(eq(threedFarmbots.status, 'online'));
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

    let query = db
      .select()
      .from(threedFarmbots)
      .$dynamic();

    if (userId) {
      query = query.where(
        or(
          eq(threedFarmbots.userId, userId),
          eq(threedFarmbots.status, 'online')
        )
      );
    } else {
      query = query.where(eq(threedFarmbots.status, 'online'));
    }

    if (status) {
      query = query.where(eq(threedFarmbots.status, status));
    }

    if (threedId) {
      query = query.where(eq(threedFarmbots.threedId, parseInt(threedId)));
    }

    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(threedFarmbots)
      .where(query._where);

    const [countResult] = await totalQuery;
    const total = countResult?.count || 0;

    const farmbots = await query
      .orderBy(desc(threedFarmbots.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: farmbots,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching farmbots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch farmbots' },
      { status: 500 }
    );
  }
}

// POST /api/threed/farmbots (ADMIN ONLY)
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
    const { 
      deviceId, name, status, apiToken, apiUrl,
      positionX, positionY, positionZ,
      isActive, threedId
    } = body;

    if (!deviceId || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: deviceId, name' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    if (threedId) {
      const [module] = await db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.id, parseInt(threedId)),
            eq(threed.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'ThreeD module not found' },
          { status: 404 }
        );
      }
    }

    await ensureTableSequence('threed_farmbots');

    const [newFarmbot] = await db
      .insert(threedFarmbots)
      .values({
        userId,
        threedId: threedId || null,
        deviceId,
        name,
        status: status || 'offline',
        apiToken: apiToken || null,
        apiUrl: apiUrl || null,
        positionX: positionX || 0,
        positionY: positionY || 0,
        positionZ: positionZ || 0,
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newFarmbot,
      message: 'FarmBot created successfully',
    });
  } catch (error) {
    console.error('Error creating farmbot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create farmbot' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/farmbots (ADMIN ONLY)
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { 
      deviceId, name, status, apiToken, apiUrl,
      positionX, positionY, positionZ,
      isActive, threedId
    } = body;

    const userId = session.user.id;

    const [existing] = await db
      .select()
      .from(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parseInt(id)),
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

    if (threedId) {
      const [module] = await db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.id, parseInt(threedId)),
            eq(threed.userId, userId)
          )
        )
        .limit(1);

      if (!module) {
        return NextResponse.json(
          { success: false, error: 'ThreeD module not found' },
          { status: 404 }
        );
      }
    }

    const [updatedFarmbot] = await db
      .update(threedFarmbots)
      .set({
        deviceId: deviceId || existing.deviceId,
        name: name || existing.name,
        status: status || existing.status,
        apiToken: apiToken !== undefined ? apiToken : existing.apiToken,
        apiUrl: apiUrl !== undefined ? apiUrl : existing.apiUrl,
        positionX: positionX !== undefined ? positionX : existing.positionX,
        positionY: positionY !== undefined ? positionY : existing.positionY,
        positionZ: positionZ !== undefined ? positionZ : existing.positionZ,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        threedId: threedId !== undefined ? threedId : existing.threedId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedFarmbots.id, parseInt(id)),
          eq(threedFarmbots.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedFarmbot,
      message: 'FarmBot updated successfully',
    });
  } catch (error) {
    console.error('Error updating farmbot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update farmbot' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/farmbots (ADMIN ONLY)
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

    const [deleted] = await db
      .delete(threedFarmbots)
      .where(
        and(
          eq(threedFarmbots.id, parseInt(id)),
          eq(threedFarmbots.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'FarmBot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'FarmBot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting farmbot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete farmbot' },
      { status: 500 }
    );
  }
}