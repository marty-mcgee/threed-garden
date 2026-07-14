// app/api/project/[id]/modules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project } from '@/lib/schema/project';
import { threed } from '@/lib/schema/threed';
import { traffic } from '@/lib/schema/traffic';
import { music } from '@/lib/schema/music';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Must await params in Next.js 16
    const { id } = await params;
    console.log('📦 modules params.id:', id);

    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const [threedModules, trafficModules, musicModules] = await Promise.all([
      db.select().from(threed).where(eq(threed.projectId, projectId)),
      db.select().from(traffic).where(eq(traffic.projectId, projectId)),
      db.select().from(music).where(eq(music.projectId, projectId)),
    ]);

    return NextResponse.json({
      data: {
        threed: threedModules,
        traffic: trafficModules,
        music: musicModules,
      },
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, name, description } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name' },
        { status: 400 }
      );
    }

    const moduleMap = {
      threed,
      traffic,
      music,
    };

    const table = moduleMap[type as keyof typeof moduleMap];
    if (!table) {
      return NextResponse.json(
        { error: 'Invalid module type. Use threed, traffic, or music' },
        { status: 400 }
      );
    }

    const [newModule] = await db
      .insert(table)
      .values({
        projectId,
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        isActive: true,
      })
      .returning();

    return NextResponse.json({ data: newModule });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}

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
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, moduleId } = body;

    if (!type || !moduleId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, moduleId' },
        { status: 400 }
      );
    }

    const moduleMap = {
      threed,
      traffic,
      music,
    };

    const table = moduleMap[type as keyof typeof moduleMap];
    if (!table) {
      return NextResponse.json(
        { error: 'Invalid module type. Use threed, traffic, or music' },
        { status: 400 }
      );
    }

    const [module] = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.id, parseInt(moduleId)),
          eq(table.projectId, projectId)
        )
      )
      .limit(1);

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found in this project' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(table)
      .where(eq(table.id, parseInt(moduleId)))
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}