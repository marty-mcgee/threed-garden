// app/api/traffic/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { traffic } from '@/lib/schema/traffic';
import { eq, and } from 'drizzle-orm';

// GET /api/traffic/1 - Get a single Traffic module
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
      .from(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      );

    if (!result) {
      return NextResponse.json(
        { error: 'Traffic module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/traffic/1 - Update a Traffic module
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

    // Verify ownership
    const [existing] = await db
      .select()
      .from(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Traffic module not found' },
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
      .update(traffic)
      .set(updateData)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Failed to update Traffic module' },
      { status: 500 }
    );
  }
}

// DELETE /api/traffic/1 - Delete a Traffic module
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

    // Verify ownership
    const [existing] = await db
      .select()
      .from(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Traffic module not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(traffic)
      .where(
        and(
          eq(traffic.id, moduleId),
          eq(traffic.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete Traffic module' },
      { status: 500 }
    );
  }
}