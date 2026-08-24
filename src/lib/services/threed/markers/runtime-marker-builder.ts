import type {
  RuntimeMarker,
  ProjectThreeDMarkerRecord,
  ThreeDRuntimeMarkerModuleType,
  UnifiedMapData,
} from '../../../types/map';
import type { ThreeDRuntimeMarkerRegistration } from './runtime-marker-core';

type ThreeDRawProjectData = NonNullable<UnifiedMapData['threed']['raw']>;

interface ThreeDRuntimeMarkerVisualConfig {
  color: string;
  icon: string;
  label: string;
}

const THREED_RUNTIME_MARKER_VISUALS = {
  plantings: { color: '#22c55e', icon: '🌱', label: 'Planting' },
  beds: { color: '#f59e0b', icon: '🧑‍🌾', label: 'Bed' },
  characters: { color: '#8b5cf6', icon: '🧚', label: 'Character' },
  farmbots: { color: '#64748b', icon: '🤖', label: 'FarmBot' },
  models: { color: '#06b6d4', icon: '🧊', label: 'Model' },
} as const satisfies Record<
  ThreeDRuntimeMarkerModuleType,
  ThreeDRuntimeMarkerVisualConfig
>;

const THREED_NON_PLANTING_MARKER_TYPES = [
  'beds',
  'characters',
  'farmbots',
] as const satisfies readonly ThreeDRuntimeMarkerModuleType[];

function buildSavedProjectMarkers(
  records: readonly ProjectThreeDMarkerRecord[],
): RuntimeMarker[] {
  const markers: RuntimeMarker[] = [];
  for (const record of records) {
    const moduleType = THREED_RUNTIME_MARKER_VISUALS[
      record.markerType as ThreeDRuntimeMarkerModuleType
    ] ? record.markerType as ThreeDRuntimeMarkerModuleType : null;
    const assetId = Number(record.sourceAssetId);
    const position = {
      x: Number(record.positionX),
      y: Number(record.positionY),
      z: Number(record.positionZ),
    };
    if (
      !moduleType
      || !Number.isSafeInteger(assetId)
      || assetId <= 0
      || !Object.values(position).every(Number.isFinite)
    ) {
      continue;
    }

    const isModelMarker = moduleType === 'models';
    const markerRecordId = Number(record.id);
    if (isModelMarker && (!Number.isSafeInteger(markerRecordId) || markerRecordId <= 0)) {
      continue;
    }

    markers.push({
      id: record.markerId,
      name: record.name,
      type: moduleType,
      position,
      color: record.color,
      icon: record.icon,
      label: record.label,
      isVisible: record.isVisible,
      isActive: record.isActive,
      data: {
        ...record.data,
        id: isModelMarker ? markerRecordId : assetId,
        ...(isModelMarker ? { modelId: assetId, instanceId: markerRecordId } : {}),
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
      },
      metadata: {
        ...record.metadata,
        source: isModelMarker ? 'project-marker' as const : 'project-snapshot' as const,
        savedAt: record.savedAt,
        positionSource: record.positionSource,
      },
    });
  }
  return markers;
}

function extractPosition(
  item: any,
): { x: number; y: number; z: number } | null {
  const rawX = item.positionX ?? item.position?.x ?? item.latitude ?? item.lat ?? null;
  const rawY = item.positionY ?? item.position?.y ?? item.height ?? null;
  const rawZ = item.positionZ ?? item.position?.z ?? item.longitude ?? item.lng ?? null;
  if (rawX === null && rawY === null && rawZ === null) return null;

  const x = typeof rawX === 'string' ? parseFloat(rawX) : (rawX ?? 0);
  const y = typeof rawY === 'string' ? parseFloat(rawY) : (rawY ?? 0);
  const z = typeof rawZ === 'string' ? parseFloat(rawZ) : (rawZ ?? 0);
  if (isNaN(x) && isNaN(y) && isNaN(z)) return null;

  return {
    x: isNaN(x) ? 0 : x,
    y: isNaN(y) ? 0 : y,
    z: isNaN(z) ? 0 : z,
  };
}

function extractName(
  item: any,
  moduleType: ThreeDRuntimeMarkerModuleType,
  raw: ThreeDRawProjectData,
): string {
  if (moduleType === 'plantings' && item.plantId) {
    const plant = raw.plants?.find((candidate: any) => candidate.id === item.plantId);
    if (plant) {
      return plant.commonName || plant.name || `${moduleType} #${item.id}`;
    }
  }

  return item.name
    || item.commonName
    || item.modelName
    || item.title
    || item.plantId
    || `${moduleType} #${item.id}`;
}

function createMarker(
  item: any,
  moduleType: ThreeDRuntimeMarkerModuleType,
  raw: ThreeDRawProjectData,
  generatedAt: string,
): RuntimeMarker | null {
  const position = extractPosition(item);
  if (!position) return null;

  const name = extractName(item, moduleType, raw);
  const visual = THREED_RUNTIME_MARKER_VISUALS[moduleType];
  return {
    id: `${moduleType}-${item.id}`,
    name,
    type: moduleType,
    position,
    color: item.color || visual.color,
    icon: visual.icon,
    label: name,
    isVisible: item.isVisible ?? true,
    isActive: item.isActive ?? true,
    data: {
      id: item.id,
      description: item.notes || item.description || '',
      ...item,
    },
    metadata: { source: 'sub-module' as const, generatedAt },
  };
}

/** Converts project-scoped ThreeD Sub-Module rows into scene Runtime Markers. */
export function buildThreeDRuntimeMarkers(
  raw: ThreeDRawProjectData | null,
  generatedAt = new Date().toISOString(),
): RuntimeMarker[] {
  if (!raw) return [];

  const markers: RuntimeMarker[] = [];
  for (const item of raw.plantings ?? []) {
    const marker = createMarker(item, 'plantings', raw, generatedAt);
    if (marker) markers.push(marker);
  }

  for (const moduleType of THREED_NON_PLANTING_MARKER_TYPES) {
    for (const item of raw[moduleType] ?? []) {
      const marker = createMarker(item, moduleType, raw, generatedAt);
      if (marker) markers.push(marker);
    }
  }

  if (!raw.projectThreedMarkers?.length) return markers;

  const savedMarkers = new Map(
    buildSavedProjectMarkers(raw.projectThreedMarkers)
      .map((marker) => [marker.id, marker]),
  );
  const restoredMarkers = markers.map((marker) => savedMarkers.get(marker.id) ?? marker);
  const existingIds = new Set(restoredMarkers.map((marker) => marker.id));
  for (const savedMarker of savedMarkers.values()) {
    if (!existingIds.has(savedMarker.id) && savedMarker.type === 'models') {
      restoredMarkers.push(savedMarker);
    }
  }
  return restoredMarkers;
}

/** Maps complete builder output into the registry's provider-neutral shape. */
export function createThreeDRuntimeMarkerRegistrations(
  markers: readonly RuntimeMarker[],
): ThreeDRuntimeMarkerRegistration[] {
  return markers.map((marker) => ({
    moduleType: marker.type,
    assetId: Number(marker.data?.id),
    name: String(marker.name),
    assetPosition: {
      x: marker.position.x,
      y: marker.position.y,
      z: marker.position.z,
    },
  }));
}
