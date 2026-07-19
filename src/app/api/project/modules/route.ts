// app/api/project/modules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectThreed, projectTraffic, projectMusic } from '@/lib/schema/project';
import { threed } from '@/lib/schema/threed';
import { traffic } from '@/lib/schema/traffic';
import { music } from '@/lib/schema/music';
import { eq, and } from 'drizzle-orm';

// ============================================
// GET /api/project/modules?projectId=1 - Get all modules for a project
// ============================================
// app/api/project/modules/route.ts - GET handler
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // ✅ Check if project exists
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    // ✅ If project doesn't exist, return 200 with empty data (not 404)
    if (!proj) {
      console.log(`ℹ️ Project ${parsedProjectId} not found or doesn't belong to user, returning empty data`);
      return NextResponse.json({
        success: true,
        data: {
          threed: [],
          traffic: [],
          music: [],
        },
      });
    }

    // Get modules via junction tables
    const [threedModules, trafficModules, musicModules] = await Promise.all([
      db
        .select()
        .from(threed)
        .innerJoin(projectThreed, eq(projectThreed.threedId, threed.id))
        .where(
          and(
            eq(projectThreed.projectId, parsedProjectId),
            eq(projectThreed.userId, userId)
          )
        ),
      
      db
        .select()
        .from(traffic)
        .innerJoin(projectTraffic, eq(projectTraffic.trafficId, traffic.id))
        .where(
          and(
            eq(projectTraffic.projectId, parsedProjectId),
            eq(projectTraffic.userId, userId)
          )
        ),
      
      db
        .select()
        .from(music)
        .innerJoin(projectMusic, eq(projectMusic.musicId, music.id))
        .where(
          and(
            eq(projectMusic.projectId, parsedProjectId),
            eq(projectMusic.userId, userId)
          )
        ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        threed: threedModules.map(row => row.threed),
        traffic: trafficModules.map(row => row.traffic),
        music: musicModules.map(row => row.music),
      },
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/project/modules?projectId=1 - Add a module to a project
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // ✅ Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, moduleId } = body;

    if (!type || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, moduleId' },
        { status: 400 }
      );
    }

    const parsedModuleId = parseInt(moduleId);
    if (isNaN(parsedModuleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case 'threed': {
        // Verify module exists and belongs to user
        const [module] = await db
          .select()
          .from(threed)
          .where(
            and(
              eq(threed.id, parsedModuleId),
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

        // Check if already added
        const [existing] = await db
          .select()
          .from(projectThreed)
          .where(
            and(
              eq(projectThreed.projectId, parsedProjectId),
              eq(projectThreed.threedId, parsedModuleId)
            )
          )
          .limit(1);

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Module already added to this project' },
            { status: 409 }
          );
        }

        // ✅ Insert with userId
        [result] = await db
          .insert(projectThreed)
          .values({
            userId: userId, // ✅ Set userId
            projectId: parsedProjectId,
            threedId: parsedModuleId,
          })
          .returning();
        break;
      }

      case 'traffic': {
        const [module] = await db
          .select()
          .from(traffic)
          .where(
            and(
              eq(traffic.id, parsedModuleId),
              eq(traffic.userId, userId)
            )
          )
          .limit(1);

        if (!module) {
          return NextResponse.json(
            { success: false, error: 'Traffic module not found' },
            { status: 404 }
          );
        }

        const [existing] = await db
          .select()
          .from(projectTraffic)
          .where(
            and(
              eq(projectTraffic.projectId, parsedProjectId),
              eq(projectTraffic.trafficId, parsedModuleId)
            )
          )
          .limit(1);

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Module already added to this project' },
            { status: 409 }
          );
        }

        // ✅ Insert with userId
        [result] = await db
          .insert(projectTraffic)
          .values({
            userId: userId, // ✅ Set userId
            projectId: parsedProjectId,
            trafficId: parsedModuleId,
          })
          .returning();
        break;
      }

      case 'music': {
        const [module] = await db
          .select()
          .from(music)
          .where(
            and(
              eq(music.id, parsedModuleId),
              eq(music.userId, userId)
            )
          )
          .limit(1);

        if (!module) {
          return NextResponse.json(
            { success: false, error: 'Music module not found' },
            { status: 404 }
          );
        }

        const [existing] = await db
          .select()
          .from(projectMusic)
          .where(
            and(
              eq(projectMusic.projectId, parsedProjectId),
              eq(projectMusic.musicId, parsedModuleId)
            )
          )
          .limit(1);

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Module already added to this project' },
            { status: 409 }
          );
        }

        // ✅ Insert with userId
        [result] = await db
          .insert(projectMusic)
          .values({
            userId: userId, // ✅ Set userId
            projectId: parsedProjectId,
            musicId: parsedModuleId,
          })
          .returning();
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid module type. Use threed, traffic, or music' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding module to project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add module to project' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project/modules?projectId=1 - Remove a module from a project
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // ✅ Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, moduleId } = body;

    if (!type || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, moduleId' },
        { status: 400 }
      );
    }

    const parsedModuleId = parseInt(moduleId);
    if (isNaN(parsedModuleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case 'threed':
        [result] = await db
          .delete(projectThreed)
          .where(
            and(
              eq(projectThreed.projectId, parsedProjectId),
              eq(projectThreed.threedId, parsedModuleId),
              eq(projectThreed.userId, userId) // ✅ Check userId
            )
          )
          .returning();
        break;

      case 'traffic':
        [result] = await db
          .delete(projectTraffic)
          .where(
            and(
              eq(projectTraffic.projectId, parsedProjectId),
              eq(projectTraffic.trafficId, parsedModuleId),
              eq(projectTraffic.userId, userId) // ✅ Check userId
            )
          )
          .returning();
        break;

      case 'music':
        [result] = await db
          .delete(projectMusic)
          .where(
            and(
              eq(projectMusic.projectId, parsedProjectId),
              eq(projectMusic.musicId, parsedModuleId),
              eq(projectMusic.userId, userId) // ✅ Check userId
            )
          )
          .returning();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid module type. Use threed, traffic, or music' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error removing module from project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove module from project' },
      { status: 500 }
    );
  }
}