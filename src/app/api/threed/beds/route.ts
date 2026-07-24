// app/api/threed/beds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedBeds, threed } from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/beds - List beds (PUBLIC)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const threedId = searchParams.get('threedId');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (id) {
      let query = db
        .select()
        .from(threedBeds)
        .where(eq(threedBeds.id, parseInt(id)));

      if (!userId) {
        query = query.where(eq(threedBeds.isActive, true));
      }

      const [bed] = await query.limit(1);

      if (!bed) {
        return NextResponse.json(
          { success: false, error: 'Bed not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: bed,
      });
    }

    let query = db
      .select()
      .from(threedBeds)
      .$dynamic();

    if (userId) {
      query = query.where(
        or(
          eq(threedBeds.userId, userId),
          eq(threedBeds.isActive, true)
        )
      );
    } else {
      query = query.where(eq(threedBeds.isActive, true));
    }

    if (threedId) {
      query = query.where(eq(threedBeds.threedId, parseInt(threedId)));
    }

    if (isActive !== null) {
      query = query.where(eq(threedBeds.isActive, isActive === 'true'));
    }

    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(threedBeds)
      .where(query._where);

    const [countResult] = await totalQuery;
    const total = countResult?.count || 0;

    const beds = await query
      .orderBy(desc(threedBeds.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: beds,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching beds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch beds' },
      { status: 500 }
    );
  }
}

// POST /api/threed/beds (ADMIN ONLY)
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
      name, description, bedType, width, length, height,
      positionX, positionY, positionZ, rotation, scale, color,
      isActive, threedId
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
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

    await ensureTableSequence('threed_beds');

    const [newBed] = await db
      .insert(threedBeds)
      .values({
        userId,
        threedId: threedId || null,
        bedId: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name,
        description: description || null,
        shape: bedType || 'rectangle',
        widthFeet: width || 4,
        lengthFeet: length || 8,
        heightFeet: height || 1,
        positionX: positionX || 0,
        positionY: positionY || 0,
        positionZ: positionZ || 0,
        rotation: rotation || 0,
        scale: scale || 1,
        color: color || '#8B5E3C',
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newBed,
      message: 'Bed created successfully',
    });
  } catch (error) {
    console.error('Error creating bed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bed' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/beds (ADMIN ONLY)
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
      name, description, bedType, width, length, height,
      positionX, positionY, positionZ, rotation, scale, color,
      isActive, threedId
    } = body;

    const userId = session.user.id;

    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parseInt(id)),
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

    const [updatedBed] = await db
      .update(threedBeds)
      .set({
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        shape: bedType || existing.shape,
        widthFeet: width || existing.widthFeet,
        lengthFeet: length || existing.lengthFeet,
        heightFeet: height !== undefined ? height : existing.heightFeet,
        positionX: positionX !== undefined ? positionX : existing.positionX,
        positionY: positionY !== undefined ? positionY : existing.positionY,
        positionZ: positionZ !== undefined ? positionZ : existing.positionZ,
        rotation: rotation !== undefined ? rotation : existing.rotation,
        scale: scale !== undefined ? scale : existing.scale,
        color: color || existing.color,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        threedId: threedId !== undefined ? threedId : existing.threedId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedBeds.id, parseInt(id)),
          eq(threedBeds.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedBed,
      message: 'Bed updated successfully',
    });
  } catch (error) {
    console.error('Error updating bed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bed' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/beds (ADMIN ONLY)
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
      .delete(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parseInt(id)),
          eq(threedBeds.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Bed deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bed' },
      { status: 500 }
    );
  }
}