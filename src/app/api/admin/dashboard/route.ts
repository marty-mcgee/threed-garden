// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  project, 
  projectThreed, 
  projectTraffic, 
  projectMusic,
  projectAssets 
} from '@/lib/schema/project';
import { threed } from '@/lib/schema/threed';
import { traffic } from '@/lib/schema/traffic';
import { music } from '@/lib/schema/music';
import { user } from '@/lib/schema/auth';
import { count, eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ✅ Get total counts
    const [projectCount] = await db
      .select({ count: count() })
      .from(project)
      .where(eq(project.userId, userId));

    const [threedCount] = await db
      .select({ count: count() })
      .from(threed)
      .where(eq(threed.userId, userId));

    const [trafficCount] = await db
      .select({ count: count() })
      .from(traffic)
      .where(eq(traffic.userId, userId));

    const [musicCount] = await db
      .select({ count: count() })
      .from(music)
      .where(eq(music.userId, userId));

    // ✅ Get project module counts
    const [projectThreedCount] = await db
      .select({ count: count() })
      .from(projectThreed)
      .where(eq(projectThreed.userId, userId));

    const [projectTrafficCount] = await db
      .select({ count: count() })
      .from(projectTraffic)
      .where(eq(projectTraffic.userId, userId));

    const [projectMusicCount] = await db
      .select({ count: count() })
      .from(projectMusic)
      .where(eq(projectMusic.userId, userId));

    // ✅ Get total asset assignments
    const [assetCount] = await db
      .select({ count: count() })
      .from(projectAssets)
      .where(eq(projectAssets.userId, userId));

    // ✅ Get recent projects
    const recentProjectsRaw = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(desc(project.createdAt))
      .limit(5);

    const recentProjects = recentProjectsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      slug: p.slug,
      isActive: p.isActive ?? false,
      isPublic: p.isPublic ?? false,
      createdAt: p.createdAt,
    }));

    // ✅ Get module distribution
    const moduleDistribution = {
      threed: projectThreedCount?.count || 0,
      traffic: projectTrafficCount?.count || 0,
      music: projectMusicCount?.count || 0,
    };

    // ✅ Get asset distribution
    const assetDistribution = await db
      .select({
        moduleType: projectAssets.moduleType,
        count: count(),
      })
      .from(projectAssets)
      .where(eq(projectAssets.userId, userId))
      .groupBy(projectAssets.moduleType);

    // ✅ Get user info
    const [userData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // ✅ Calculate totals
    const totalModules = (threedCount?.count || 0) + (trafficCount?.count || 0) + (musicCount?.count || 0);
    const totalProjectModules = moduleDistribution.threed + moduleDistribution.traffic + moduleDistribution.music;

    const assetDistributionData = assetDistribution.map((item) => ({
      moduleType: item.moduleType,
      count: item.count,
    }));

    const dashboardData = {
      user: userData,
      stats: {
        projects: projectCount?.count || 0,
        modules: {
          total: totalModules,
          threed: threedCount?.count || 0,
          traffic: trafficCount?.count || 0,
          music: musicCount?.count || 0,
        },
        projectModules: {
          total: totalProjectModules,
          threed: moduleDistribution.threed,
          traffic: moduleDistribution.traffic,
          music: moduleDistribution.music,
        },
        assets: {
          total: assetCount?.count || 0,
          byModuleType: assetDistributionData,
        },
      },
      recentProjects: recentProjects,
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}