// app/api/traffic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { traffic } from '@/lib/schema/traffic';
import { eq, desc, and } from 'drizzle-orm';

// Helper to get default user ID for testing
const defaultUserId = '9a9ed475-3dcd-492e-b22f-de27a33ed1fc';

// GET /api/traffic - List all Traffic modules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = db
      .select()
      .from(traffic)
      .where(eq(traffic.userId, session.user.id))
      .orderBy(desc(traffic.createdAt));

    if (projectId) {
      query = db
        .select()
        .from(traffic)
        .where(
          and(
            eq(traffic.userId, session.user.id),
            eq(traffic.projectId, parseInt(projectId))
          )
        )
        .orderBy(desc(traffic.createdAt));
    }

    const results = await query;
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/traffic - Create a new Traffic module
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
      .insert(traffic)
      .values({
        projectId,
        name,
        description: description || '',
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        userId: session.user.id,
        isActive: true,
        config: config || {},
      })
      .returning();

    return NextResponse.json({ data: newModule });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Failed to create Traffic module' },
      { status: 500 }
    );
  }
}