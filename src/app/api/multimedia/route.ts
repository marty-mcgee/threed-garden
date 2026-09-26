// app/api/multimedia/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { multimedia } from '@/libraries/schema/multimedia';
import { projectMultimedia } from '@/libraries/schema/project';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (id) {
      const parsedId = Number(id);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid Music module ID' },
          { status: 400 }
        );
      }

      const [result] = await db
        .select()
        .from(multimedia)
        .where(
          and(
            eq(multimedia.id, parsedId),
            eq(multimedia.userId, session.user.id)
          )
        );

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Music module not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: result });
    }

    const limit = Number(searchParams.get('limit') || '50');
    const offset = Number(searchParams.get('offset') || '0');
    if (!Number.isInteger(limit) || limit <= 0 || !Number.isInteger(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    let parsedProjectId: number | null = null;
    if (projectId) {
      parsedProjectId = Number(projectId);
      if (!Number.isInteger(parsedProjectId) || parsedProjectId <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid Project ID' },
          { status: 400 }
        );
      }
    }

    const moduleScope = and(
      eq(multimedia.userId, session.user.id),
      includeInactive ? undefined : eq(multimedia.isActive, true),
      parsedProjectId
        ? sql`EXISTS (
            SELECT 1
            FROM ${projectMultimedia}
            WHERE ${projectMultimedia.multimediaId} = ${multimedia.id}
            AND ${projectMultimedia.projectId} = ${parsedProjectId}
            AND ${projectMultimedia.userId} = ${session.user.id}
            AND ${projectMultimedia.isActive} = true
          )`
        : undefined
    );

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(multimedia)
      .where(moduleScope);

    const results = await db
      .select()
      .from(multimedia)
      .where(moduleScope)
      .orderBy(desc(multimedia.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, config } = body; // ✅ Removed projectId

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const [newModule] = await db
      .insert(multimedia)
      .values({
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        userId: session.user.id,
        isActive: true,
        isPublic: false,
        config: config || {},
        version: '1.0.0',
        metadata: {},
      })
      .returning();

    return NextResponse.json({ success: true, data: newModule });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Music module' },
      { status: 500 }
    );
  }
}

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
        { success: false, error: 'Missing module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isActive, isPublic, config, version, metadata } = body;

    const [existing] = await db
      .select()
      .from(multimedia)
      .where(
        and(
          eq(multimedia.id, parseInt(id)),
          eq(multimedia.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Music module not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(multimedia)
      .set({
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        slug: name ? name.toLowerCase().replace(/\s+/g, '-') : existing.slug,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        config: config || existing.config,
        version: version || existing.version,
        metadata: metadata || existing.metadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(multimedia.id, parseInt(id)),
          eq(multimedia.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Music module' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isActive, isPublic, config, version, metadata } = body;

    const [existing] = await db
      .select()
      .from(multimedia)
      .where(
        and(
          eq(multimedia.id, parseInt(id)),
          eq(multimedia.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Music module not found' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (config !== undefined) updateData.config = config;
    if (version !== undefined) updateData.version = version;
    if (metadata !== undefined) updateData.metadata = metadata;

    const [updated] = await db
      .update(multimedia)
      .set(updateData)
      .where(
        and(
          eq(multimedia.id, parseInt(id)),
          eq(multimedia.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Music module' },
      { status: 500 }
    );
  }
}

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
        { success: false, error: 'Missing module ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(multimedia)
      .where(
        and(
          eq(multimedia.id, parseInt(id)),
          eq(multimedia.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Music module not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(multimedia)
      .where(
        and(
          eq(multimedia.id, parseInt(id)),
          eq(multimedia.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Music API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete Music module' },
      { status: 500 }
    );
  }
}
