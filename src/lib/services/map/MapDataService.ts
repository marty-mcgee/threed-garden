// lib/services/map/MapDataService.ts

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
import { UnifiedMapData } from '@/lib/types/map';

// ============================================
// Exported Functions (used by page.tsx)
// ============================================

export async function fetchMapProjects(options?: { includeInactive?: boolean }) {
  const projects = await db
    .select()
    .from(project);
  return projects;
}

export async function projectHasMapData(projectId: string) {
  const assets = await db
    .select()
    .from(projectAssets)
    .where(eq(projectAssets.projectId, parseInt(projectId)));
  return { totalAssets: assets.length };
}

export function clearMapCache(projectId?: string) {
  // Optional: clear cached data
}

// ============================================
// Main Data Fetch - Unified
// ============================================

export async function fetchUnifiedMapData(projectId: string): Promise<UnifiedMapData> {
  const parsedProjectId = parseInt(projectId);
  
  // Fetch both traffic and threed data in parallel
  const [trafficResponse, threedResponse] = await Promise.all([
    fetchTrafficMapData(parsedProjectId),
    fetchThreeDMapData(parsedProjectId),
  ]);
  
  // Build the UnifiedMapData format
  const result: UnifiedMapData = {
    traffic: {
      raw: trafficResponse.success ? trafficResponse.data : null,
      total: trafficResponse.success ? trafficResponse.total : 0,
      chpCadCount: trafficResponse.success ? trafficResponse.counts?.chpCadIncidents || 0 : 0,
      chpCasesCount: trafficResponse.success ? trafficResponse.counts?.chpCases || 0 : 0,
      chpCentersCount: trafficResponse.success ? trafficResponse.counts?.chpCenters || 0 : 0,
      caltransClosuresCount: trafficResponse.success ? trafficResponse.counts?.caltransLaneClosures || 0 : 0,
      caltransCctvCount: trafficResponse.success ? trafficResponse.counts?.caltransCctvCameras || 0 : 0,
      caltransDistrictsCount: trafficResponse.success ? trafficResponse.counts?.caltransDistricts || 0 : 0,
      bayArea511Count: trafficResponse.success ? trafficResponse.counts?.bayArea511Events || 0 : 0,
      calfireIncidentsCount: trafficResponse.success ? trafficResponse.counts?.calfireIncidents || 0 : 0,
    },
    threed: {
      raw: threedResponse.success ? threedResponse.data : null,
      total: threedResponse.success ? threedResponse.total : 0,
      plantsCount: threedResponse.success ? threedResponse.counts?.plants || 0 : 0,
      bedsCount: threedResponse.success ? threedResponse.counts?.beds || 0 : 0,
      charactersCount: threedResponse.success ? threedResponse.counts?.characters || 0 : 0,
      markersCount: 0, // No database markers
      layersCount: threedResponse.success ? threedResponse.counts?.layers || 0 : 0,
      farmbotsCount: threedResponse.success ? threedResponse.counts?.farmbots || 0 : 0,
      plantingsCount: threedResponse.success ? threedResponse.counts?.plantings || 0 : 0,
      tasksCount: threedResponse.success ? threedResponse.counts?.tasks || 0 : 0,
      harvestsCount: threedResponse.success ? threedResponse.counts?.harvests || 0 : 0,
      weatherLogsCount: threedResponse.success ? threedResponse.counts?.weatherLogs || 0 : 0,
      layers: [],
    },
  };
  
  return result;
}

// ============================================
// Traffic Map Data
// ============================================

export async function fetchTrafficMapData(
  projectId: number,
  userId?: string,
  options?: { includeInactive?: boolean; limit?: number }
) {
  try {
    const includeInactive = options?.includeInactive || false;
    const limit = options?.limit || 100;

    // Verify project exists
    const [projectData] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          userId ? eq(project.userId, userId) : eq(project.isPublic, true)
        )
      )
      .limit(1);

    if (!projectData) {
      return {
        success: false,
        data: null,
        error: 'Project not found or access denied',
      };
    }

    // Get Traffic module IDs for this project
    const projectTrafficModules = await db
      .select({ trafficId: projectTraffic.trafficId })
      .from(projectTraffic)
      .where(
        and(
          eq(projectTraffic.projectId, projectId),
          userId ? eq(projectTraffic.userId, userId) : sql`1=1`
        )
      );

    const trafficModuleIds = projectTrafficModules.map(m => m.trafficId);

    if (trafficModuleIds.length === 0) {
      return {
        success: true,
        data: {
          chpCadIncidents: [],
          chpCases: [],
          chpCenters: [],
          caltransLaneClosures: [],
          caltransCctvCameras: [],
          caltransDistricts: [],
          bayArea511Events: [],
          calfireIncidents: [],
        },
        counts: {
          chpCadIncidents: 0,
          chpCases: 0,
          chpCenters: 0,
          caltransLaneClosures: 0,
          caltransCctvCameras: 0,
          caltransDistricts: 0,
          bayArea511Events: 0,
          calfireIncidents: 0,
        },
        total: 0,
      };
    }

    // Get Traffic asset IDs from project_assets
    const trafficAssets = await db
      .select({
        assetType: projectAssets.assetType,
        assetId: projectAssets.assetId,
      })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, projectId),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          includeInactive ? sql`1=1` : eq(projectAssets.isActive, true)
        )
      );

    if (trafficAssets.length === 0) {
      return {
        success: true,
        data: {
          chpCadIncidents: [],
          chpCases: [],
          chpCenters: [],
          caltransLaneClosures: [],
          caltransCctvCameras: [],
          caltransDistricts: [],
          bayArea511Events: [],
          calfireIncidents: [],
        },
        counts: {
          chpCadIncidents: 0,
          chpCases: 0,
          chpCenters: 0,
          caltransLaneClosures: 0,
          caltransCctvCameras: 0,
          caltransDistricts: 0,
          bayArea511Events: 0,
          calfireIncidents: 0,
        },
        total: 0,
      };
    }

    // Group asset IDs by type
    const assetIdsByType: Record<string, number[]> = {};
    trafficAssets.forEach((asset) => {
      if (!assetIdsByType[asset.assetType]) {
        assetIdsByType[asset.assetType] = [];
      }
      assetIdsByType[asset.assetType].push(asset.assetId);
    });

    // Helper function to fetch items
    const fetchItems = async (table: any, ids: number[], orderField: any) => {
      if (ids.length === 0) {
        return [];
      }

      let query = db
        .select()
        .from(table)
        .where(inArray(table.id, ids));

      if (!includeInactive) {
        if (table.isActive) {
          query = query.where(eq(table.isActive, true));
        }
        if (table.status) {
          query = query.where(sql`${table.status} != 'inactive'`);
        }
      }

      return await query
        .orderBy(desc(orderField))
        .limit(limit);
    };

    // Type mapping for traffic
    const typeMap: Record<string, { table: any; orderField: any; key: string }> = {
      'traffic_chp_cad_incidents': { table: trafficChpCadIncidents, orderField: trafficChpCadIncidents.createdAt, key: 'chpCadIncidents' },
      'traffic_chp_cases': { table: trafficChpCases, orderField: trafficChpCases.createdAt, key: 'chpCases' },
      'traffic_chp_centers': { table: trafficChpCenters, orderField: trafficChpCenters.createdAt, key: 'chpCenters' },
      'traffic_caltrans_lane_closures': { table: trafficCaltransLaneClosures, orderField: trafficCaltransLaneClosures.createdAt, key: 'caltransLaneClosures' },
      'traffic_caltrans_cctv_cameras': { table: trafficCaltransCctvCameras, orderField: trafficCaltransCctvCameras.createdAt, key: 'caltransCctvCameras' },
      'traffic_caltrans_districts': { table: trafficCaltransDistricts, orderField: trafficCaltransDistricts.createdAt, key: 'caltransDistricts' },
      'traffic_bay_area_511_events': { table: trafficBayArea511Events, orderField: trafficBayArea511Events.createdAt, key: 'bayArea511Events' },
      'traffic_calfire_incidents': { table: trafficCalfireIncidents, orderField: trafficCalfireIncidents.createdAt, key: 'calfireIncidents' },
    };

    // Fetch data
    const fetchPromises: Promise<{ key: string; items: any[] }>[] = [];

    Object.entries(typeMap).forEach(([assetType, { table, orderField, key }]) => {
      if (assetIdsByType[assetType] && assetIdsByType[assetType].length > 0) {
        fetchPromises.push(
          fetchItems(table, assetIdsByType[assetType], orderField)
            .then(items => ({ key, items }))
        );
      }
    });

    const results = await Promise.all(fetchPromises);

    // Build response
    const responseData: Record<string, any[]> = {
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

    results.forEach(({ key, items }) => {
      responseData[key] = items;
      counts[key] = items.length;
    });

    // Add zero counts for missing types
    Object.keys(responseData).forEach((key) => {
      if (!(key in counts)) {
        counts[key] = 0;
      }
    });

    const total = Object.values(responseData).reduce((sum, items) => sum + items.length, 0);

    return {
      success: true,
      data: responseData,
      counts,
      total,
    };
  } catch (error) {
    console.error('Error fetching traffic map data:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch traffic data',
    };
  }
}

// ============================================
// ThreeD Map Data
// ============================================

export async function fetchThreeDMapData(
  projectId: number,
  userId?: string,
  options?: {
    includeInactive?: boolean;
    limit?: number;
    layerId?: number;
    types?: string[];
  }
) {
  try {
    const includeInactive = options?.includeInactive || false;
    const limit = options?.limit || 100;
    const layerId = options?.layerId;
    const typesParam = options?.types;

    // Verify project exists
    const [projectData] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          userId ? eq(project.userId, userId) : eq(project.isPublic, true)
        )
      )
      .limit(1);

    if (!projectData) {
      return {
        success: false,
        data: null,
        error: 'Project not found or access denied',
      };
    }

    // Get ThreeD module IDs for this project
    const projectThreeDModules = await db
      .select({ threedId: projectThreed.threedId })
      .from(projectThreed)
      .where(
        and(
          eq(projectThreed.projectId, projectId),
          userId ? eq(projectThreed.userId, userId) : sql`1=1`
        )
      );

    const threeDModuleIds = projectThreeDModules.map(m => m.threedId);

    if (threeDModuleIds.length === 0) {
      return {
        success: true,
        data: {
          plants: [],
          beds: [],
          characters: [],
          layers: [],
          farmbots: [],
          plantings: [],
          tasks: [],
          harvests: [],
          weatherLogs: [],
        },
        counts: {
          plants: 0,
          beds: 0,
          characters: 0,
          layers: 0,
          farmbots: 0,
          plantings: 0,
          tasks: 0,
          harvests: 0,
          weatherLogs: 0,
        },
        total: 0,
      };
    }

    // Get ThreeD asset IDs from project_assets
    const threeDAssets = await db
      .select({
        assetType: projectAssets.assetType,
        assetId: projectAssets.assetId,
      })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, projectId),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          includeInactive ? sql`1=1` : eq(projectAssets.isActive, true)
        )
      );

    if (threeDAssets.length === 0) {
      return {
        success: true,
        data: {
          plants: [],
          beds: [],
          characters: [],
          layers: [],
          farmbots: [],
          plantings: [],
          tasks: [],
          harvests: [],
          weatherLogs: [],
        },
        counts: {
          plants: 0,
          beds: 0,
          characters: 0,
          layers: 0,
          farmbots: 0,
          plantings: 0,
          tasks: 0,
          harvests: 0,
          weatherLogs: 0,
        },
        total: 0,
      };
    }

    // Group asset IDs by type
    const assetIdsByType: Record<string, number[]> = {};
    threeDAssets.forEach((asset) => {
      if (!assetIdsByType[asset.assetType]) {
        assetIdsByType[asset.assetType] = [];
      }
      assetIdsByType[asset.assetType].push(asset.assetId);
    });

    // Parse allowed types
    let allowedTypes: string[] = [];
    if (typesParam) {
      allowedTypes = typesParam.map(t => t.trim());
    }

    // Helper function to fetch items
    const fetchItems = async (table: any, ids: number[], orderField: any) => {
      if (ids.length === 0) {
        return [];
      }

      let query = db
        .select()
        .from(table)
        .where(inArray(table.id, ids));

      if (!includeInactive) {
        if (table.isActive) {
          query = query.where(eq(table.isActive, true));
        }
        if (table.status) {
          query = query.where(sql`${table.status} != 'inactive'`);
        }
      }

      if (layerId && table.layerId) {
        query = query.where(eq(table.layerId, layerId));
      }

      return await query
        .orderBy(desc(orderField))
        .limit(limit);
    };

    // Type mapping for threed
    const typeMap: Record<string, { table: any; orderField: any; key: string }> = {
      'threed_plants': { table: threedPlants, orderField: threedPlants.createdAt, key: 'plants' },
      'threed_beds': { table: threedBeds, orderField: threedBeds.createdAt, key: 'beds' },
      'threed_characters': { table: threedCharacters, orderField: threedCharacters.createdAt, key: 'characters' },
      'threed_layers': { table: threedLayers, orderField: threedLayers.createdAt, key: 'layers' },
      'threed_farmbots': { table: threedFarmbots, orderField: threedFarmbots.createdAt, key: 'farmbots' },
      'threed_plantings': { table: threedPlantings, orderField: threedPlantings.createdAt, key: 'plantings' },
      'threed_tasks': { table: threedTasks, orderField: threedTasks.createdAt, key: 'tasks' },
      'threed_harvests': { table: threedHarvests, orderField: threedHarvests.createdAt, key: 'harvests' },
      'threed_weather_logs': { table: threedWeatherLogs, orderField: threedWeatherLogs.createdAt, key: 'weatherLogs' },
    };

    // Fetch data
    const fetchPromises: Promise<{ key: string; items: any[] }>[] = [];

    Object.entries(typeMap).forEach(([assetType, { table, orderField, key }]) => {
      if (assetIdsByType[assetType] && assetIdsByType[assetType].length > 0) {
        if (allowedTypes.length === 0 || allowedTypes.includes(assetType) || allowedTypes.includes(key)) {
          fetchPromises.push(
            fetchItems(table, assetIdsByType[assetType], orderField)
              .then(items => ({ key, items }))
          );
        }
      }
    });

    const results = await Promise.all(fetchPromises);

    // Build response
    const responseData: Record<string, any[]> = {
      plants: [],
      beds: [],
      characters: [],
      layers: [],
      farmbots: [],
      plantings: [],
      tasks: [],
      harvests: [],
      weatherLogs: [],
    };

    const counts: Record<string, number> = {};

    results.forEach(({ key, items }) => {
      responseData[key] = items;
      counts[key] = items.length;
    });

    // Add zero counts for missing types
    Object.keys(responseData).forEach((key) => {
      if (!(key in counts)) {
        counts[key] = 0;
      }
    });

    const total = Object.values(responseData).reduce((sum, items) => sum + items.length, 0);

    return {
      success: true,
      data: responseData,
      counts,
      total,
    };
  } catch (error) {
    console.error('Error fetching ThreeD map data:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch ThreeD data',
    };
  }
}