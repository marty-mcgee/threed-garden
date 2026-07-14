// app/api/threed/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threed } from '@/lib/schema/threed';
import { eq, and } from 'drizzle-orm';

// GET /api/threed/1 - Get single ThreeD module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [result] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      );

    if (!result) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/threed/1 - Update a ThreeD module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isActive, config } = body;

    const [existing] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (config !== undefined) updateData.config = config;

    const [updated] = await db
      .update(threed)
      .set(updateData)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Failed to update ThreeD module' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/1 - Delete a ThreeD module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'ThreeD module not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(threed)
      .where(
        and(
          eq(threed.id, moduleId),
          eq(threed.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ThreeD module' },
      { status: 500 }
    );
  }
}