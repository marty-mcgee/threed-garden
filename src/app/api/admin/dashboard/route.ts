// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { 
  project, 
  projectThreed, 
  projectTraffic, 
  projectMultimedia,
  projectAssets 
} from '@/libraries/schema/project';
import { threed } from '@/libraries/schema/threed';
import { traffic } from '@/libraries/schema/traffic';
import { multimedia } from '@/libraries/schema/multimedia';
import { user } from '@/libraries/schema/auth';
import { count, eq, desc, sql, getTableName } from 'drizzle-orm';
import { threedModels, threedModelMaterialAssignments, threedCharacters, threedCharacterAnimationAssignments, threedModelAnimationAssignments, threedAnimations, threedScenarios, threedSimulations, threedSimulationResults } from '@/libraries/schema/threed';

// Identifiers stay qualified even when Drizzle simplifies a single-table selection.
const qualified = (tableName: string, columnName: string) => sql`${sql.identifier(tableName)}.${sql.identifier(columnName)}`;

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

    const [multimediaCount] = await db
      .select({ count: count() })
      .from(multimedia)
      .where(eq(multimedia.userId, userId));

    // ✅ Get project module counts
    const [projectThreedCount] = await db
      .select({ count: count() })
      .from(projectThreed)
      .where(eq(projectThreed.userId, userId));

    const [projectTrafficCount] = await db
      .select({ count: count() })
      .from(projectTraffic)
      .where(eq(projectTraffic.userId, userId));

    const [projectMultimediaCount] = await db
      .select({ count: count() })
      .from(projectMultimedia)
      .where(eq(projectMultimedia.userId, userId));

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
      updatedAt: p.updatedAt,
    }));

    // ✅ Get module distribution
    const moduleDistribution = {
      threed: projectThreedCount?.count || 0,
      traffic: projectTrafficCount?.count || 0,
      multimedia: projectMultimediaCount?.count || 0,
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
    const totalModules = (threedCount?.count || 0) + (trafficCount?.count || 0) + (multimediaCount?.count || 0);
    const totalProjectModules = moduleDistribution.threed + moduleDistribution.traffic + moduleDistribution.multimedia;

    const assetDistributionData = assetDistribution.map((item) => ({
      moduleType: item.moduleType,
      count: item.count,
    }));

    // Aggregate only; do not serialize private Models, Characters or runtime snapshots.
    const [modelReview] = await db.select({
      total: count(),
      withoutTextureAssignments: sql<number>`count(*) filter (where not exists (select 1 from ${threedModelMaterialAssignments} where ${qualified(getTableName(threedModelMaterialAssignments), threedModelMaterialAssignments.modelId.name)} = ${qualified(getTableName(threedModels), threedModels.id.name)} and ${qualified(getTableName(threedModelMaterialAssignments), threedModelMaterialAssignments.userId.name)} = ${userId}))`.mapWith(Number),
      withoutThumbnail: sql<number>`count(*) filter (where nullif(trim(${qualified(getTableName(threedModels), threedModels.thumbnailUrl.name)}), '') is null)`.mapWith(Number),
      withoutTopView: sql<number>`count(*) filter (where nullif(trim(${qualified(getTableName(threedModels), threedModels.imageTopViewUrl.name)}), '') is null)`.mapWith(Number),
    }).from(threedModels).where(eq(threedModels.userId, userId));
    const [characterReview] = await db.select({
      total: count(),
      withoutModel: sql<number>`count(*) filter (where ${qualified(getTableName(threedCharacters), threedCharacters.modelId.name)} is null)`.mapWith(Number),
      withoutLibraryAnimations: sql<number>`count(*) filter (where
        not exists (select 1 from ${threedCharacterAnimationAssignments} inner join ${threedAnimations} on ${qualified(getTableName(threedAnimations), threedAnimations.id.name)} = ${qualified(getTableName(threedCharacterAnimationAssignments), threedCharacterAnimationAssignments.animationId.name)} and ${qualified(getTableName(threedAnimations), threedAnimations.userId.name)} = ${userId} and ${qualified(getTableName(threedAnimations), threedAnimations.isActive.name)} = true
          where ${qualified(getTableName(threedCharacterAnimationAssignments), threedCharacterAnimationAssignments.characterId.name)} = ${qualified(getTableName(threedCharacters), threedCharacters.id.name)} and ${qualified(getTableName(threedCharacterAnimationAssignments), threedCharacterAnimationAssignments.userId.name)} = ${userId} and ${qualified(getTableName(threedCharacterAnimationAssignments), threedCharacterAnimationAssignments.mode.name)} = 'assigned')
        and not exists (select 1 from ${threedModelAnimationAssignments} inner join ${threedModels} on ${qualified(getTableName(threedModels), threedModels.id.name)} = ${qualified(getTableName(threedModelAnimationAssignments), threedModelAnimationAssignments.modelId.name)} and ${qualified(getTableName(threedModels), threedModels.userId.name)} = ${userId}
          inner join ${threedAnimations} on ${qualified(getTableName(threedAnimations), threedAnimations.id.name)} = ${qualified(getTableName(threedModelAnimationAssignments), threedModelAnimationAssignments.animationId.name)} and ${qualified(getTableName(threedAnimations), threedAnimations.userId.name)} = ${userId} and ${qualified(getTableName(threedAnimations), threedAnimations.isActive.name)} = true
          where ${qualified(getTableName(threedModelAnimationAssignments), threedModelAnimationAssignments.modelId.name)} = ${qualified(getTableName(threedCharacters), threedCharacters.modelId.name)} and ${qualified(getTableName(threedModelAnimationAssignments), threedModelAnimationAssignments.userId.name)} = ${userId} and ${qualified(getTableName(threedModelAnimationAssignments), threedModelAnimationAssignments.mode.name)} = 'assigned'
          and not exists (select 1 from ${threedCharacterAnimationAssignments} where ${qualified(getTableName(threedCharacterAnimationAssignments), threedCharacterAnimationAssignments.characterId.name)} = ${qualified(getTableName(threedCharacters), threedCharacters.id.name)} and ${qualified(getTableName(threedCharacterAnimationAssignments), threedCharacterAnimationAssignments.userId.name)} = ${userId} and ${qualified(getTableName(threedCharacterAnimationAssignments), threedCharacterAnimationAssignments.actionKey.name)} = ${qualified(getTableName(threedModelAnimationAssignments), threedModelAnimationAssignments.actionKey.name)})))`.mapWith(Number),
    }).from(threedCharacters).where(eq(threedCharacters.userId, userId));
    const [projectActivity] = await db.select({
      withActiveScenarios: sql<number>`count(*) filter (where exists (select 1 from ${threedScenarios} where ${qualified(getTableName(threedScenarios), threedScenarios.projectId.name)} = ${qualified(getTableName(project), project.id.name)} and ${qualified(getTableName(threedScenarios), threedScenarios.userId.name)} = ${userId} and ${qualified(getTableName(threedScenarios), threedScenarios.isActive.name)} = true))`.mapWith(Number),
      withActiveSimulations: sql<number>`count(*) filter (where exists (select 1 from ${threedSimulations} where ${qualified(getTableName(threedSimulations), threedSimulations.projectId.name)} = ${qualified(getTableName(project), project.id.name)} and ${qualified(getTableName(threedSimulations), threedSimulations.userId.name)} = ${userId} and ${qualified(getTableName(threedSimulations), threedSimulations.isActive.name)} = true))`.mapWith(Number),
      withUnfinalizedRuns: sql<number>`count(*) filter (where exists (select 1 from ${threedSimulationResults} where ${qualified(getTableName(threedSimulationResults), threedSimulationResults.projectId.name)} = ${qualified(getTableName(project), project.id.name)} and ${qualified(getTableName(threedSimulationResults), threedSimulationResults.userId.name)} = ${userId} and ${qualified(getTableName(threedSimulationResults), threedSimulationResults.status.name)} = 'running'))`.mapWith(Number),
    }).from(project).where(eq(project.userId, userId));

    const dashboardData = {
      user: userData,
      review: { models: modelReview, characters: characterReview, projects: projectActivity },
      stats: {
        projects: projectCount?.count || 0,
        models: modelReview?.total ?? 0,
        characters: characterReview?.total ?? 0,
        modules: {
          total: totalModules,
          threed: threedCount?.count || 0,
          traffic: trafficCount?.count || 0,
          multimedia: multimediaCount?.count || 0,
        },
        projectModules: {
          total: totalProjectModules,
          threed: moduleDistribution.threed,
          traffic: moduleDistribution.traffic,
          multimedia: moduleDistribution.multimedia,
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