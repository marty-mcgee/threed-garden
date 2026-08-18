// app/api/map/threed/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedPlants,
  threedBeds,
  threedCharacters,
  threedLayers,
  threedFarmbots,
  threedPlantings,
  threedTasks,
  threedHarvests,
  threedWeatherLogs,
  threedModels,
} from '@/lib/schema/threed';
import { 
  trafficChpCadIncidents,
  trafficChpCases,
  trafficChpCenters,
  trafficCaltransLaneClosures,
  trafficCaltransCctvCameras,
  trafficCaltransDistricts,
  trafficBayArea511Events,
  trafficCalfireIncidents,
} from '@/lib/schema/traffic';
import { project, projectAssets, projectThreed, projectTraffic } from '@/lib/schema/project';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

// ============================================
// GET /api/map/threed - Get ThreeD data for project map
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid projectId' },
        { status: 400 }
      );
    }

    // ✅ Verify project exists
    const [projectData] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          userId ? eq(project.userId, userId) : eq(project.isPublic, true)
        )
      )
      .limit(1);

    if (!projectData) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ Get ThreeD module IDs
    const projectThreeDModules = await db
      .select({ threedId: projectThreed.threedId })
      .from(projectThreed)
      .where(
        and(
          eq(projectThreed.projectId, parsedProjectId),
          userId ? eq(projectThreed.userId, userId) : sql`1=1`,
          eq(projectThreed.isActive, true)
        )
      );

    const threeDModuleIds = projectThreeDModules
      .map(m => m.threedId)
      .filter((id): id is number => id !== null);

    // ✅ Get Traffic module IDs
    const projectTrafficModules = await db
      .select({ trafficId: projectTraffic.trafficId })
      .from(projectTraffic)
      .where(
        and(
          eq(projectTraffic.projectId, parsedProjectId),
          userId ? eq(projectTraffic.userId, userId) : sql`1=1`,
          eq(projectTraffic.isActive, true)
        )
      );

    const trafficModuleIds = projectTrafficModules
      .map(m => m.trafficId)
      .filter((id): id is number => id !== null);

    // ✅ Initialize response data
    const threedData: Record<string, any[]> = {
      plants: [],
      beds: [],
      characters: [],
      layers: [],
      farmbots: [],
      plantings: [],
      tasks: [],
      harvests: [],
      weatherLogs: [],
      models: [],
    };

    const trafficData: Record<string, any[]> = {
      chpCadIncidents: [],
      chpCases: [],
      chpCenters: [],
      caltransLaneClosures: [],
      caltransCctvCameras: [],
      caltransDistricts: [],
      bayArea511Events: [],
      calfireIncidents: [],
    };

    const counts: Record<string, number> = {};

    // ✅ Helper function to fetch items and sanitize/normalize position columns
    const fetchItems = async (table: any, ids: number[], orderField: any, tableName: string) => {
      if (ids.length === 0) {
        return [];
      }

      try {
        const assignedAssetCondition = inArray(table.id, ids);
        const query = db
          .select()
          .from(table)
          .where(
            !includeInactive && table.isActive
              ? and(assignedAssetCondition, eq(table.isActive, true))
              : assignedAssetCondition
          );

        const rawItems = await query
          .orderBy(desc(orderField))
          .limit(limit);

        // ✅ Pre-process: normalize position columns and add metadata fields
        return rawItems.map((item: any) => {
          const processed = { ...item };

          // Normalize positionX/Y/Z from string to number (DB returns decimal as string)
          if ('positionX' in processed && processed.positionX !== null) {
            processed.positionX = Number(processed.positionX);
          }
          if ('positionY' in processed && processed.positionY !== null) {
            processed.positionY = Number(processed.positionY);
          }
          if ('positionZ' in processed && processed.positionZ !== null) {
            processed.positionZ = Number(processed.positionZ);
          }

          // Normalize lat/lng for traffic records
          if ('latitude' in processed && processed.latitude !== null) {
            processed.latitude = Number(processed.latitude);
          }
          if ('longitude' in processed && processed.longitude !== null) {
            processed.longitude = Number(processed.longitude);
          }

          // ✅ Add position validation metadata
          processed._hasPosition = !(
            (processed.positionX === null || processed.positionX === undefined || isNaN(processed.positionX)) &&
            (processed.positionY === null || processed.positionY === undefined || isNaN(processed.positionY)) &&
            (processed.positionZ === null || processed.positionZ === undefined || isNaN(processed.positionZ))
          );

          return processed;
        });
      } catch (err) {
        console.error(`❌ Error fetching from ${tableName}:`, err);
        return [];
      }
    };

    // ✅ Helper to process asset IDs
    const processAssets = async (
      assetIdsByType: Record<string, number[]>,
      typeMap: Record<string, { table: any; orderField: any; key: string; tableName: string }>,
      targetData: Record<string, any[]>
    ) => {
      const fetchPromises: Promise<{ key: string; items: any[] }>[] = [];

      Object.entries(typeMap).forEach(([assetType, { table, orderField, key, tableName }]) => {
        if (assetIdsByType[assetType] && assetIdsByType[assetType].length > 0) {
          fetchPromises.push(
            fetchItems(table, assetIdsByType[assetType], orderField, tableName)
              .then(items => ({ key, items }))
              .catch((err) => {
                console.error(`❌ Failed to fetch ${assetType}:`, err);
                return { key, items: [] };
              })
          );
        }
      });

      const results = await Promise.all(fetchPromises);

      results.forEach(({ key, items }) => {
        targetData[key] = items;
        counts[key] = items.length;
      });
    };

    // ✅ Fetch ThreeD assets
    if (threeDModuleIds.length > 0) {
      const threeDAssets = await db
        .select({
          assetType: projectAssets.assetType,
          assetId: projectAssets.assetId,
        })
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.projectId, parsedProjectId),
            eq(projectAssets.moduleType, 'threed'),
            inArray(projectAssets.moduleId, threeDModuleIds),
            userId ? eq(projectAssets.userId, userId) : sql`1=1`,
            includeInactive ? sql`1=1` : eq(projectAssets.isActive, true),
            sql`${projectAssets.assetType}::text LIKE 'threed_%'`
          )
        );

      if (threeDAssets.length > 0) {
        const assetIdsByType: Record<string, number[]> = {};
        threeDAssets.forEach((asset) => {
          if (!assetIdsByType[asset.assetType]) {
            assetIdsByType[asset.assetType] = [];
          }
          assetIdsByType[asset.assetType].push(asset.assetId);
        });

        const typeMap: Record<string, { table: any; orderField: any; key: string; tableName: string }> = {
          'threed_plants': { table: threedPlants, orderField: threedPlants.createdAt, key: 'plants', tableName: 'threedPlants' },
          'threed_beds': { table: threedBeds, orderField: threedBeds.createdAt, key: 'beds', tableName: 'threedBeds' },
          'threed_characters': { table: threedCharacters, orderField: threedCharacters.createdAt, key: 'characters', tableName: 'threedCharacters' },
          'threed_layers': { table: threedLayers, orderField: threedLayers.createdAt, key: 'layers', tableName: 'threedLayers' },
          'threed_farmbots': { table: threedFarmbots, orderField: threedFarmbots.createdAt, key: 'farmbots', tableName: 'threedFarmbots' },
          'threed_plantings': { table: threedPlantings, orderField: threedPlantings.createdAt, key: 'plantings', tableName: 'threedPlantings' },
          'threed_tasks': { table: threedTasks, orderField: threedTasks.createdAt, key: 'tasks', tableName: 'threedTasks' },
          'threed_harvests': { table: threedHarvests, orderField: threedHarvests.createdAt, key: 'harvests', tableName: 'threedHarvests' },
          'threed_weather_logs': { table: threedWeatherLogs, orderField: threedWeatherLogs.createdAt, key: 'weatherLogs', tableName: 'threedWeatherLogs' },
          'threed_models': { table: threedModels, orderField: threedModels.createdAt, key: 'models', tableName: 'threedModels' },
        };

        await processAssets(assetIdsByType, typeMap, threedData);

        // v0.16.3-beta: Attach each character's referenced model (GLB/FBX/OBJ) so the
        // 3D scene renders the actual model file instead of a fallback shape.
        if (threedData.characters.length > 0 && threedData.models.length > 0) {
          const modelById = new Map(threedData.models.map((m: any) => [m.id, m]));
          threedData.characters = threedData.characters.map((character: any) => {
            if (character.modelId != null && modelById.has(character.modelId)) {
              return { ...character, model: modelById.get(character.modelId) };
            }
            return character;
          });
        }
      }
    }

    // ✅ Fetch Traffic assets
    if (trafficModuleIds.length > 0) {
      const trafficAssets = await db
        .select({
          assetType: projectAssets.assetType,
          assetId: projectAssets.assetId,
        })
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.projectId, parsedProjectId),
            eq(projectAssets.moduleType, 'traffic'),
            inArray(projectAssets.moduleId, trafficModuleIds),
            userId ? eq(projectAssets.userId, userId) : sql`1=1`,
            includeInactive ? sql`1=1` : eq(projectAssets.isActive, true),
            sql`${projectAssets.assetType}::text LIKE 'traffic_%'`
          )
        );

      if (trafficAssets.length > 0) {
        const assetIdsByType: Record<string, number[]> = {};
        trafficAssets.forEach((asset) => {
          if (!assetIdsByType[asset.assetType]) {
            assetIdsByType[asset.assetType] = [];
          }
          assetIdsByType[asset.assetType].push(asset.assetId);
        });

        const typeMap: Record<string, { table: any; orderField: any; key: string; tableName: string }> = {
          'traffic_chp_cad_incidents': { table: trafficChpCadIncidents, orderField: trafficChpCadIncidents.createdAt, key: 'chpCadIncidents', tableName: 'trafficChpCadIncidents' },
          'traffic_chp_cases': { table: trafficChpCases, orderField: trafficChpCases.createdAt, key: 'chpCases', tableName: 'trafficChpCases' },
          'traffic_chp_centers': { table: trafficChpCenters, orderField: trafficChpCenters.createdAt, key: 'chpCenters', tableName: 'trafficChpCenters' },
          'traffic_caltrans_lane_closures': { table: trafficCaltransLaneClosures, orderField: trafficCaltransLaneClosures.createdAt, key: 'caltransLaneClosures', tableName: 'trafficCaltransLaneClosures' },
          'traffic_caltrans_cctv_cameras': { table: trafficCaltransCctvCameras, orderField: trafficCaltransCctvCameras.createdAt, key: 'caltransCctvCameras', tableName: 'trafficCaltransCctvCameras' },
          'traffic_caltrans_districts': { table: trafficCaltransDistricts, orderField: trafficCaltransDistricts.createdAt, key: 'caltransDistricts', tableName: 'trafficCaltransDistricts' },
          'traffic_bay_area_511_events': { table: trafficBayArea511Events, orderField: trafficBayArea511Events.createdAt, key: 'bayArea511Events', tableName: 'trafficBayArea511Events' },
          'traffic_calfire_incidents': { table: trafficCalfireIncidents, orderField: trafficCalfireIncidents.createdAt, key: 'calfireIncidents', tableName: 'trafficCalfireIncidents' },
        };

        await processAssets(assetIdsByType, typeMap, trafficData);
      }
    }

    // ✅ Combine all data for response
    const allData = {
      ...threedData,
      ...trafficData,
    };

    const total = Object.values(allData).reduce((sum, items) => sum + items.length, 0);

    // ✅ Add zero counts for missing types
    const allKeys = [
      'plants', 'beds', 'characters', 'layers', 'farmbots', 'plantings', 'tasks', 'harvests', 'weatherLogs', 'models',
      'chpCadIncidents', 'chpCases', 'chpCenters', 'caltransLaneClosures', 'caltransCctvCameras',
      'caltransDistricts', 'bayArea511Events', 'calfireIncidents'
    ];
    allKeys.forEach(key => {
      if (!(key in counts)) {
        counts[key] = 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: allData,
      counts,
      total,
    });
  } catch (error) {
    console.error('❌ Error fetching ThreeD map data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ThreeD data' },
      { status: 500 }
    );
  }
}
