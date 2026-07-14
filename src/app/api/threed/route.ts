// app/api/threed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threed } from '@/lib/schema/threed';
import { eq, desc, and, where } from 'drizzle-orm';

// Helper to get default user ID for testing
const defaultUserId = '9a9ed475-3dcd-492e-b22f-de27a33ed1fc';

// GET /api/threed - List all ThreeD modules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = db
      .select()
      .from(threed)
      .where(eq(threed.userId, session.user.id))
      .orderBy(desc(threed.createdAt));

    if (projectId) {
      query = db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.userId, session.user.id),
            eq(threed.projectId, parseInt(projectId))
          )
        )
        .orderBy(desc(threed.createdAt));
    }

    if (!includeInactive) {
      query = query.where(eq(threed.isActive, true));
    }

    const results = await query;
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed - Create a new ThreeD module
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, description, config } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    const [newModule] = await db
      .insert(threed)
      .values({
        projectId,
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        userId: session.user.id, // ✅ Ensure this is set
        isActive: true,
        config: config || {},
      })
      .returning();

    return NextResponse.json({ data: newModule });
  } catch (error) {
    console.error('ThreeD API error:', error);
    return NextResponse.json(
      { error: 'Failed to create ThreeD module' },
      { status: 500 }
    );
  }
}