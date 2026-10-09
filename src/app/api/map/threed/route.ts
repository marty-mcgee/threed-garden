import { sceneTextureResources } from '@/libraries/services/project/scene-texture-resources';
import { sceneCharacterAnimations } from '@/libraries/services/project/scene-character-animations';
import { canRenderAssignedModel } from '@/libraries/services/project/scene-read-policy';
import { retryDisconnectedRead } from '@/libraries/db/read-retry';
import { databaseConnectionDiagnostic } from '@/libraries/db/connection-diagnostics';
import { currentModelAssets } from '@/libraries/services/threed/models/model-snapshot-assets';
import { modelSelection } from '@/libraries/services/threed/models/model-primary-file';
import { isThreeDModelMaterialChannel } from '@/libraries/services/threed/models/model-material-override-core';
import { getTableColumns } from 'drizzle-orm';
// app/api/map/threed/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { sanitizeFarmBotRecord } from '@/libraries/services/threed/farmbot/sanitize';
import { 
  threed,
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
  threedModelFiles,
  threedModelMaterialAssignments,
  threedModelTextures,
} from '@/libraries/schema/threed';
import { 
  trafficChpCadIncidents,
  trafficChpCases,
  trafficChpCenters,
  trafficCaltransLaneClosures,
  trafficCaltransCctvCameras,
  trafficCaltransDistricts,
  trafficBayArea511Events,
  trafficCalfireIncidents,
} from '@/libraries/schema/traffic';
import {
  project,
  projectAssets,
  projectThreed,
  projectThreedMarkers,
  projectTraffic,
} from '@/libraries/schema/project';
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm';
import { readThreeDProjectViewStateFromConfig } from '@/libraries/services/threed/markers/project-view-state-core';

const MARKER_ASSET_TYPE_BY_MODULE = {
  plantings: 'threed_plantings',
  beds: 'threed_beds',
  characters: 'threed_characters',
  farmbots: 'threed_farmbots',
  models: 'threed_models',
} as const;

// ============================================
// GET /api/map/threed - Get ThreeD data for project map
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    let includeInactive = searchParams.get('includeInactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    const parsedProjectId = Number(projectId);
    if (!Number.isSafeInteger(parsedProjectId) || parsedProjectId <= 0) {
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
          or(eq(project.isPublic, true), userId ? eq(project.userId, userId) : sql`false`)
        )
      )
      .limit(1);

    if (!projectData?.userId) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const canEdit = userId === projectData.userId;
    includeInactive = canEdit && includeInactive;
    // ✅ Get ThreeD module IDs
    const projectThreeDModules = await db
      .select({
        threedId: projectThreed.threedId,
        name: threed.name,
      })
      .from(projectThreed)
      .innerJoin(threed, and(
        eq(threed.id, projectThreed.threedId),
        eq(threed.isActive, true),
      ))
      .where(
        and(
          eq(projectThreed.projectId, parsedProjectId),
          eq(projectThreed.userId, projectData.userId!),
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
          eq(projectTraffic.userId, projectData.userId!),
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
    const activeThreeDMarkerAssignments = new Set<string>();
    let savedProjectMarkers: (typeof projectThreedMarkers.$inferSelect)[] = [];

    // ✅ Helper function to fetch items and sanitize/normalize position columns
    const fetchItems = async (table: any, ids: number[], orderField: any, tableName: string) => {
      if (ids.length === 0) {
        return [];
      }

      try {
        const assignedAssetCondition = and(inArray(table.id, ids), table.userId
          ? (tableName === 'threedModels'
            ? or(eq(table.userId, projectData.userId), and(eq(table.isPublic, true), eq(table.isLibraryItem, true), eq(table.isActive, true), eq(table.status, 'active')))
            : canEdit ? sql`true` : eq(table.userId, projectData.userId))
          : sql`true`);
        const rawItems = await retryDisconnectedRead(async () => db
          .select(tableName === 'threedModels' ? modelSelection() : getTableColumns(table))
          .from(table)
          .where(
            !includeInactive && table.isActive
              ? and(assignedAssetCondition, eq(table.isActive, true))
              : assignedAssetCondition
          )
          .orderBy(desc(orderField))
          .limit(limit));

        // ✅ Pre-process: normalize position columns and add metadata fields
        return rawItems.map((item: any) => {
          const processed = tableName === 'threedFarmbots'
            ? sanitizeFarmBotRecord(item)
            : { ...item };

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
        // A failed read is not an empty asset collection. Do not publish a
        // successful Project snapshot that silently omits its assigned assets.
        throw new Error(`Failed to fetch ${tableName}`, { cause: err });
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
          moduleId: projectAssets.moduleId,
          assetType: projectAssets.assetType,
          assetId: projectAssets.assetId,
        })
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.projectId, parsedProjectId),
            eq(projectAssets.moduleType, 'threed'),
            inArray(projectAssets.moduleId, threeDModuleIds),
            eq(projectAssets.userId, projectData.userId!),
            includeInactive ? sql`1=1` : eq(projectAssets.isActive, true),
            sql`${projectAssets.assetType}::text LIKE 'threed_%'`
          )
        );

      if (threeDAssets.length > 0) {
        const assetIdsByType: Record<string, number[]> = {};
        threeDAssets.forEach((asset) => {
          activeThreeDMarkerAssignments.add(
            `${asset.moduleId}:${asset.assetType}:${asset.assetId}`,
          );
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

      }

      // Hydrate assets from current relationships, never from saved Project JSON.
      const plantingPlantIds = [...new Set(threedData.plantings.map((item: any) => item.plantId).filter((id): id is number => Number.isSafeInteger(id) && id > 0))];
      const plantingPlants = plantingPlantIds.length
        ? await db.select().from(threedPlants).where(and(inArray(threedPlants.id, plantingPlantIds), eq(threedPlants.userId, projectData.userId!), eq(threedPlants.isActive, true))) : [];
      const plantingPlantById = new Map(plantingPlants.map((plant) => [plant.id, plant]));
      const referencedModelIds = [...new Set([
        ...threedData.models.map((item: any) => item.id),
        ...threedData.plantings.map((item: any) => item.customModelId),
        ...[...threedData.characters, ...threedData.plants, ...plantingPlants].map((item: any) => item.modelId),
      ].filter((id): id is number => Number.isSafeInteger(id) && id > 0))];
      const currentModels = referencedModelIds.length
        ? await db.select(modelSelection()).from(threedModels).where(and(inArray(threedModels.id, referencedModelIds), or(eq(threedModels.userId, projectData.userId!), and(eq(threedModels.isPublic, true), eq(threedModels.isLibraryItem, true), eq(threedModels.isActive, true), eq(threedModels.status, 'active'))), canEdit ? sql`true` : and(eq(threedModels.isActive, true), eq(threedModels.status, 'active'))))
        : [];
      const currentFiles = referencedModelIds.length
        ? await db.select().from(threedModelFiles).where(inArray(threedModelFiles.modelId, referencedModelIds))
        : [];
      const authorizedModelIds = currentModels.map(model => model.id);
      const assignments = authorizedModelIds.length ? await db.select({
        modelId: threedModelMaterialAssignments.modelId,
        targetKey: threedModelMaterialAssignments.targetKey,
        channel: threedModelMaterialAssignments.channel,
        textureId: threedModelTextures.id,
        textureName: threedModelTextures.textureName,
        textureFileName: threedModelTextures.fileName,
        textureUrl: threedModelTextures.filePath,
        textureOwner: threedModelTextures.userId,
      }).from(threedModelMaterialAssignments).innerJoin(threedModelTextures,
        eq(threedModelTextures.id, threedModelMaterialAssignments.textureId))
        .where(inArray(threedModelMaterialAssignments.modelId, authorizedModelIds)) : [];
      // Project publication authorizes only dependencies of its authorized Models.
      // Resolve the same referenced library textures for owners and visitors.
      const textureOwners = [...new Set(currentModels.map(model => model.userId).filter((id): id is string => Boolean(id)))];
      const libraryTextures = textureOwners.length ? await db.select({ userId: threedModelTextures.userId, fileName: threedModelTextures.fileName, filePath: threedModelTextures.filePath, isActive: threedModelTextures.isActive })
        .from(threedModelTextures).where(and(inArray(threedModelTextures.userId, textureOwners), eq(threedModelTextures.isActive, true))) : [];
      const referencedTextures = new Map<number, Awaited<ReturnType<typeof sceneTextureResources>>>();
      // Keep dependency inspection concurrency bounded for large Projects.
      for (let offset = 0; offset < currentModels.length; offset += 3) {
        await Promise.all(currentModels.slice(offset, offset + 3).map(async model => {
          referencedTextures.set(model.id, await sceneTextureResources(model, libraryTextures));
        }));
      }
      const currentModelById = new Map(currentModels.filter(model => canRenderAssignedModel(model, projectData.userId!, canEdit)).map((model) => {
        const materialAssignments = assignments.filter(item => item.modelId === model.id && item.textureOwner === model.userId && isThreeDModelMaterialChannel(item.channel))
          .map(({ modelId: _model, textureOwner: _owner, ...item }) => item);
        return [model.id, {
          ...model,
          renderingAssetsResolved: true,
          materialAssignments,
          textureFallbacks: [...materialAssignments.filter(item => item.channel === 'baseColor').map(item => ({ fileName: item.textureFileName, filePath: item.textureUrl, isActive: true })), ...(referencedTextures.get(model.id) ?? []).filter(texture => !materialAssignments.some(item => item.channel === 'baseColor' && item.textureFileName.toLowerCase() === texture.fileName.toLowerCase()))],
          files: currentFiles.filter((file) => file.modelId === model.id && file.userId === model.userId && Boolean(file.filePath))
            .map(({ id, fileName, relativePath, filePath, fileType }) => ({ id, fileName, relativePath, filePath, fileType })),
        }];
      }));
      threedData.models = threedData.models.filter((model: any) => currentModelById.has(model.id))
        .map((model: any) => ({ ...model, ...currentModelById.get(model.id) }));
      for (const key of ['characters', 'plants']) {
        threedData[key] = threedData[key].map((item: any) => ({ ...item, model: currentModelById.get(item.modelId) ?? null }));
      }

      if (!canEdit) {
        const characterMappings = await sceneCharacterAnimations(projectData.userId!,
          threedData.characters.map((character: any) => ({ id: character.id, modelId: character.model?.id ?? null })), currentModels);
        threedData.characters = threedData.characters.map((character: any) => ({ ...character, sceneAnimationMapping: characterMappings.get(character.id) }));
      }

      threedData.plantings = threedData.plantings.map((item: any) => {
        const plant = plantingPlantById.get(item.plantId);
        return { ...item, plant: plant ?? null, model: currentModelById.get(item.customModelId ?? plant?.modelId) ?? null };
      });

      savedProjectMarkers = await db
        .select()
        .from(projectThreedMarkers)
        .where(and(
          eq(projectThreedMarkers.projectId, parsedProjectId),
          eq(projectThreedMarkers.userId, projectData.userId!),
          inArray(projectThreedMarkers.threedId, threeDModuleIds),
        ));

      savedProjectMarkers = savedProjectMarkers.filter((marker) => {
        const assetType = MARKER_ASSET_TYPE_BY_MODULE[marker.markerType];
        return (marker.markerType !== 'models' || currentModelById.has(marker.sourceAssetId)) && activeThreeDMarkerAssignments.has(
          `${marker.threedId}:${assetType}:${marker.sourceAssetId}`,
        );
      });

      savedProjectMarkers = savedProjectMarkers.map((marker) => {
        const savedData = marker.data as Record<string, unknown>;
        if (marker.markerType === 'models') {
          const model = currentModelById.get(marker.sourceAssetId);
          return { ...marker, data: { ...model, ...savedData,
            modelId: marker.sourceAssetId, ...currentModelAssets(model),
          } };
        }
        if (marker.markerType === 'characters' || marker.markerType === 'plantings') {
          const source = threedData[marker.markerType].find((item: any) => item.id === marker.sourceAssetId);
          return { ...marker, data: { ...savedData, model: source?.model ?? null, sceneAnimationMapping: source?.sceneAnimationMapping } };
        }
        return marker;
      });
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
            eq(projectAssets.userId, projectData.userId!),
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
      projectContext: {
        projectId: projectData.id,
        canEdit,
        projectName: projectData.name,
        viewState: readThreeDProjectViewStateFromConfig(projectData.config),
        geographicOrigin: projectData.originLatitude !== null
          && projectData.originLongitude !== null
          ? {
              latitude: Number(projectData.originLatitude),
              longitude: Number(projectData.originLongitude),
              altitude: Number(projectData.originAltitude),
              headingDegrees: Number(projectData.headingDegrees),
              metersPerSceneUnit: Number(projectData.metersPerSceneUnit),
            }
          : null,
        threedModules: projectThreeDModules
          .filter((module) => module.threedId !== null)
          .map((module) => ({ id: module.threedId, name: module.name })),
      },
      markerSnapshot: savedProjectMarkers,
      counts,
      total,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('❌ Error fetching ThreeD map data:', error);
    console.error('Database connection diagnostic:', JSON.stringify(databaseConnectionDiagnostic(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ThreeD data' },
      { status: 500 }
    );
  }
}
