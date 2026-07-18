// app/api/threed/beds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedBeds } from '@/lib/schema/threed';
import { eq, desc, and, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// GET /api/threed/beds - List all beds for the user
// GET /api/threed/beds?id=1 - Get a single bed
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (id) {
      const [bed] = await db
        .select()
        .from(threedBeds)
        .where(
          and(
            eq(threedBeds.id, parseInt(id)),
            eq(threedBeds.userId, session.user.id)
          )
        )
        .limit(1);

      if (!bed) {
        return NextResponse.json(
          { success: false, error: 'Bed not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: bed });
    }

    let query = db
      .select()
      .from(threedBeds)
      .where(eq(threedBeds.userId, session.user.id));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedBeds)
      .where(eq(threedBeds.userId, session.user.id));

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
    console.error('ThreeD beds API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/beds - Create a new bed
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      bedId, name, description, shape, widthFeet, lengthFeet, 
      heightFeet, soilType, sunExposure, positionX, positionY, positionZ,
      rotation, scale, color, notes
    } = body;

    if (!bedId || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bedId, name' },
        { status: 400 }
      );
    }

    await ensureTableSequence('threed_beds');

    const [newBed] = await db
      .insert(threedBeds)
      .values({
        userId: session.user.id,
        bedId,
        name,
        description: description || '',
        shape: shape || 'rectangle',
        widthFeet: widthFeet ? parseFloat(widthFeet) : null,
        lengthFeet: lengthFeet ? parseFloat(lengthFeet) : null,
        heightFeet: heightFeet ? parseFloat(heightFeet) : 1,
        soilType: soilType || null,
        sunExposure: sunExposure || null,
        positionX: positionX ? parseFloat(positionX) : 0,
        positionY: positionY ? parseFloat(positionY) : 0,
        positionZ: positionZ ? parseFloat(positionZ) : 0,
        rotation: rotation ? parseFloat(rotation) : 0,
        scale: scale ? parseFloat(scale) : 1,
        color: color || '#8B5E3C',
        notes: notes || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newBed });
  } catch (error) {
    console.error('ThreeD beds API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bed' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/beds?id=1 - Full update of a bed
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing bed ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      name, description, shape, widthFeet, lengthFeet, 
      heightFeet, soilType, sunExposure, positionX, positionY, positionZ,
      rotation, scale, color, notes, isActive
    } = body;

    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parseInt(id)),
          eq(threedBeds.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(threedBeds)
      .set({
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        shape: shape || existing.shape,
        widthFeet: widthFeet !== undefined ? parseFloat(widthFeet) : existing.widthFeet,
        lengthFeet: lengthFeet !== undefined ? parseFloat(lengthFeet) : existing.lengthFeet,
        heightFeet: heightFeet !== undefined ? parseFloat(heightFeet) : existing.heightFeet,
        soilType: soilType !== undefined ? soilType : existing.soilType,
        sunExposure: sunExposure !== undefined ? sunExposure : existing.sunExposure,
        positionX: positionX !== undefined ? parseFloat(positionX) : existing.positionX,
        positionY: positionY !== undefined ? parseFloat(positionY) : existing.positionY,
        positionZ: positionZ !== undefined ? parseFloat(positionZ) : existing.positionZ,
        rotation: rotation !== undefined ? parseFloat(rotation) : existing.rotation,
        scale: scale !== undefined ? parseFloat(scale) : existing.scale,
        color: color || existing.color,
        notes: notes !== undefined ? notes : existing.notes,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedBeds.id, parseInt(id)),
          eq(threedBeds.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('ThreeD beds API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bed' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/beds?id=1 - Delete a bed
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing bed ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parseInt(id)),
          eq(threedBeds.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Bed not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(threedBeds)
      .where(
        and(
          eq(threedBeds.id, parseInt(id)),
          eq(threedBeds.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('ThreeD beds API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bed' },
      { status: 500 }
    );
  }
}