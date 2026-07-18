// app/api/project/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project } from '@/lib/schema/project';
import { eq, desc, and, sql } from 'drizzle-orm';

// ============================================
// GET /api/project - List all projects
// GET /api/project?id=1 - Get a single project
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
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get single project
    if (id) {
      const [result] = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.id, parseInt(id)),
            eq(project.userId, userId)
          )
        );

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: result });
    }

    // ✅ List all projects
    let query = db
      .select()
      .from(project)
      .where(eq(project.userId, userId));

    if (!includeInactive) {
      query = query.where(eq(project.isActive, true));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(project)
      .where(eq(project.userId, userId));

    const results = await query
      .orderBy(desc(project.createdAt))
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
    console.error('Project API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/project - Create a new project
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPublic, config } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Check for duplicate project name
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.name, name),
          eq(project.userId, session.user.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    const [newProject] = await db
      .insert(project)
      .values({
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        userId: session.user.id,
        isPublic: isPublic || false,
        isActive: true,
        config: config || {},
      })
      .returning();

    return NextResponse.json({ success: true, data: newProject });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/project?id=1 - Full update of a project
// ============================================
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
        { success: false, error: 'Missing project ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic, isActive, config } = body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // If name is changing, check for duplicates
    if (name && name !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.name, name),
            eq(project.userId, userId),
            sql`${project.id} != ${projectId}`
          )
        )
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A project with this name already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(project)
      .set({
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        slug: name ? name.toLowerCase().replace(/\s+/g, '-') : existing.slug,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        config: config || existing.config,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/project?id=1 - Partial update of a project
// ============================================
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
        { success: false, error: 'Missing project ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic, isActive, config } = body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // If name is changing, check for duplicates
    if (name && name !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.name, name),
            eq(project.userId, userId),
            sql`${project.id} != ${projectId}`
          )
        )
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A project with this name already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (config !== undefined) updateData.config = config;

    const [updated] = await db
      .update(project)
      .set(updateData)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project?id=1 - Delete a project
// ============================================
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
        { success: false, error: 'Missing project ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if project has modules via junction tables
    const { projectThreed, projectTraffic, projectMusic } = await import('@/lib/schema/project');

    const [threedCount, trafficCount, musicCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(projectThreed).where(eq(projectThreed.projectId, projectId)),
      db.select({ count: sql<number>`count(*)` }).from(projectTraffic).where(eq(projectTraffic.projectId, projectId)),
      db.select({ count: sql<number>`count(*)` }).from(projectMusic).where(eq(projectMusic.projectId, projectId)),
    ]);

    const hasModules = (threedCount[0]?.count || 0) > 0 ||
                       (trafficCount[0]?.count || 0) > 0 ||
                       (musicCount[0]?.count || 0) > 0;

    if (hasModules) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete project with existing modules. Remove modules from project first.' 
        },
        { status: 409 }
      );
    }

    const [deleted] = await db
      .delete(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}