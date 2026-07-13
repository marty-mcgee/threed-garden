// app/api/project/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { project } from '@/lib/schema/project';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Helper to get default user ID for testing
const defaultUserId = '9a9ed475-3dcd-492e-b22f-de27a33ed1fc';

// GET /api/project
export async function GET(request: NextRequest) {
  try {
    // Auth.js: get session
    const session = await auth();
    
    // Use session user ID, or return 401 if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use session user ID if available, otherwise use default for testing
    const userId = session?.user?.id || defaultUserId;

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Get single project
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
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json({ data: result });
    }

    // Get project stats (similar to music stats)
    if (action === 'stats') {
      const allProjects = await db
        .select()
        .from(project)
        .where(eq(project.userId, userId));

      const activeProjects = allProjects.filter(p => p.isActive);
      const publicProjects = allProjects.filter(p => p.isPublic);

      return NextResponse.json({
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        publicProjects: publicProjects.length,
        inactiveProjects: allProjects.length - activeProjects.length,
        privateProjects: allProjects.length - publicProjects.length,
        recentProjects: allProjects
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
      });
    }

    // List all projects - build query correctly
    let query = db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(desc(project.createdAt));

    if (!includeInactive) {
      query = db
        .select()
        .from(project)
        .where(
          and(
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        )
        .orderBy(desc(project.createdAt));
    }

    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.offset(offset);
    }

    const results = await query;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(project)
      .where(eq(project.userId, userId));

    return NextResponse.json({
      data: results,
      meta: {
        total: countResult[0]?.count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/project
export async function POST(request: NextRequest) {
  try {
    // Auth.js: get session
    const session = await auth();
    
    // Use session user ID, or return 401 if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    // Handle actions
    if (action) {
      switch (action) {
        // Add any custom actions here if needed
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }

    // Create new project
    const { name, description, isPublic, config } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
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
        { error: 'A project with this name already exists' },
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

    return NextResponse.json({ data: newProject });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/project
export async function PATCH(request: NextRequest) {
  try {
    // Auth.js: get session
    const session = await auth();
    
    // Use session user ID, or return 401 if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, isPublic, isActive, config } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, id),
          eq(project.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If name is changing, check for duplicates
    if (name && name !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.name, name),
            eq(project.userId, session.user.id),
            sql`${project.id} != ${id}`
          )
        )
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(project)
      .set({
        ...(name && { name }),
        ...(name && { slug: name.toLowerCase().replace(/\s+/g, '-') }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        ...(isActive !== undefined && { isActive }),
        ...(config && { config }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(project.id, id),
          eq(project.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/project
export async function DELETE(request: NextRequest) {
  try {
    // Auth.js: get session
    const session = await auth();
    
    // Use session user ID, or return 401 if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query parameter: id' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project has modules
    const { threed } = await import('@/lib/schema/threed');
    const { traffic } = await import('@/lib/schema/traffic');
    const { music } = await import('@/lib/schema/music');

    const [threedCount, trafficCount, musicCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(threed).where(eq(threed.projectId, parseInt(id))),
      db.select({ count: sql<number>`count(*)` }).from(traffic).where(eq(traffic.projectId, parseInt(id))),
      db.select({ count: sql<number>`count(*)` }).from(music).where(eq(music.projectId, parseInt(id))),
    ]);

    const hasModules = (threedCount[0]?.count || 0) > 0 ||
                       (trafficCount[0]?.count || 0) > 0 ||
                       (musicCount[0]?.count || 0) > 0;

    if (hasModules) {
      return NextResponse.json(
        { error: 'Cannot delete project with existing modules. Delete modules first.' },
        { status: 409 }
      );
    }

    const [deleted] = await db
      .delete(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}