import type { ThreeDProjectViewState } from '@/lib/services/threed/markers/project-view-state-core';
import type { ThreeDGeographicOrigin } from '@/lib/services/threed/markers/map-coordinate-core';
import type { UnifiedMapData } from '@/lib/types/map';

export interface ThreeDProjectModuleSummary {
  id: number;
  name: string;
}

export interface ThreeDProjectSessionData {
  data: UnifiedMapData;
  projectName: string;
  hasData: boolean;
  threedModules: ThreeDProjectModuleSummary[];
  geographicOrigin: ThreeDGeographicOrigin | null;
  savedViewState: ThreeDProjectViewState | null;
}

export type ThreeDProjectSessionResult =
  | { success: true; session: ThreeDProjectSessionData }
  | { success: false; error: string };

function normalizePositions<T extends Record<string, any[]>>(records: T): T {
  const normalized: Record<string, any[]> = {};
  for (const [key, items] of Object.entries(records)) {
    normalized[key] = items.map((item: any) => {
      const next = { ...item };
      if ('latitude' in next && next.latitude !== null) next.latitude = Number(next.latitude);
      if ('longitude' in next && next.longitude !== null) next.longitude = Number(next.longitude);
      if ('lat' in next && next.lat !== null) next.lat = Number(next.lat);
      if ('lng' in next && next.lng !== null) next.lng = Number(next.lng);
      if ('positionX' in next && next.positionX !== null) next.positionX = Number(next.positionX);
      if ('positionY' in next && next.positionY !== null) next.positionY = Number(next.positionY);
      if ('positionZ' in next && next.positionZ !== null) next.positionZ = Number(next.positionZ);
      return next;
    });
  }
  return normalized as T;
}

function parseGeographicOrigin(rawOrigin: any): ThreeDGeographicOrigin | null {
  return rawOrigin
    && Number.isFinite(Number(rawOrigin.latitude))
    && Number.isFinite(Number(rawOrigin.longitude))
    && Number.isFinite(Number(rawOrigin.altitude))
    && Number.isFinite(Number(rawOrigin.headingDegrees))
    && Number.isFinite(Number(rawOrigin.metersPerSceneUnit))
    ? {
        latitude: Number(rawOrigin.latitude),
        longitude: Number(rawOrigin.longitude),
        altitude: Number(rawOrigin.altitude),
        headingDegrees: Number(rawOrigin.headingDegrees),
        metersPerSceneUnit: Number(rawOrigin.metersPerSceneUnit),
      }
    : null;
}

export function buildThreeDProjectSession(
  result: any,
  projectId: string,
): ThreeDProjectSessionResult {
  if (!result?.success) {
    return {
      success: false,
      error: typeof result?.error === 'string' ? result.error : 'Failed to load data',
    };
  }

  const resultData = result.data || {};
  const threedModules = Array.isArray(result.projectContext?.threedModules)
    ? result.projectContext.threedModules.filter((module: any) => (
        Number.isSafeInteger(Number(module?.id))
        && Number(module.id) > 0
        && typeof module?.name === 'string'
      )).map((module: any) => ({
        id: Number(module.id),
        name: module.name,
      }))
    : [];

  const trafficRaw = normalizePositions({
    chpCadIncidents: (resultData.chpCadIncidents || []) as any[],
    chpCases: (resultData.chpCases || []) as any[],
    chpCenters: (resultData.chpCenters || []) as any[],
    caltransLaneClosures: (resultData.caltransLaneClosures || []) as any[],
    caltransCctvCameras: (resultData.caltransCctvCameras || []) as any[],
    caltransDistricts: (resultData.caltransDistricts || []) as any[],
    bayArea511Events: (resultData.bayArea511Events || []) as any[],
    calfireIncidents: (resultData.calfireIncidents || []) as any[],
  });
  const threedRaw = normalizePositions({
    plants: (resultData.plants || []) as any[],
    beds: (resultData.beds || []) as any[],
    characters: (resultData.characters || []) as any[],
    layers: (resultData.layers || []) as any[],
    farmbots: (resultData.farmbots || []) as any[],
    plantings: (resultData.plantings || []) as any[],
    tasks: (resultData.tasks || []) as any[],
    harvests: (resultData.harvests || []) as any[],
    weatherLogs: (resultData.weatherLogs || []) as any[],
    models: (resultData.models || []) as any[],
    projectThreedMarkers: (result.markerSnapshot || []) as any[],
  });
  const trafficTotal = Object.values(trafficRaw).reduce((sum, records) => sum + records.length, 0);
  const threedTotal = Object.values(threedRaw).reduce((sum, records) => sum + records.length, 0);

  return {
    success: true,
    session: {
      data: {
        traffic: {
          raw: trafficRaw,
          total: trafficTotal,
          chpCadCount: trafficRaw.chpCadIncidents.length,
          chpCasesCount: trafficRaw.chpCases.length,
          chpCentersCount: trafficRaw.chpCenters.length,
          caltransClosuresCount: trafficRaw.caltransLaneClosures.length,
          caltransCctvCount: trafficRaw.caltransCctvCameras.length,
          caltransDistrictsCount: trafficRaw.caltransDistricts.length,
          bayArea511Count: trafficRaw.bayArea511Events.length,
          calfireIncidentsCount: trafficRaw.calfireIncidents.length,
        },
        threed: {
          raw: threedRaw,
          total: threedTotal,
          plantsCount: threedRaw.plants.length,
          bedsCount: threedRaw.beds.length,
          charactersCount: threedRaw.characters.length,
          markersCount: 0,
          layersCount: threedRaw.layers.length,
          farmbotsCount: threedRaw.farmbots.length,
          plantingsCount: threedRaw.plantings.length,
          tasksCount: threedRaw.tasks.length,
          harvestsCount: threedRaw.harvests.length,
          weatherLogsCount: threedRaw.weatherLogs.length,
          layers: [],
        },
      },
      projectName: result.projectContext?.projectName || `Project #${projectId}`,
      hasData: result.total > 0,
      threedModules,
      geographicOrigin: parseGeographicOrigin(result.projectContext?.geographicOrigin),
      savedViewState: (result.projectContext?.viewState as ThreeDProjectViewState | null) ?? null,
    },
  };
}

export async function fetchThreeDProjectSession(
  projectId: string,
  signal: AbortSignal,
): Promise<ThreeDProjectSessionResult> {
  const response = await fetch(`/api/map/threed?projectId=${projectId}`, { signal });
  const result = await response.json();
  return buildThreeDProjectSession(result, projectId);
}
