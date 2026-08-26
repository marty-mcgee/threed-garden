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

export interface ThreeDRuntimeMarkerIssue {
  source: 'project_threed_markers' | 'threed_sub_module';
  recordId: number | null;
  markerId: string;
  markerType: string;
  reasons: string[];
}

export interface ThreeDRuntimeMarkerBuildResult {
  markers: RuntimeMarker[];
  issues: ThreeDRuntimeMarkerIssue[];
}

const MAX_SCENE_COORDINATE = 1_000_000;
const MAX_MARKER_SCALE = 1_000;
const MAX_MARKER_DIMENSION = 100_000;

function validateOptionalNumber(
  data: Record<string, unknown>,
  field: string,
  options: { positive?: boolean; max: number },
): string | null {
  const rawValue = data[field];
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return `${field} must be a finite number`;
  if (options.positive && value <= 0) return `${field} must be greater than zero`;
  if (Math.abs(value) > options.max) return `${field} exceeds the supported limit`;
  return null;
}

function validateSavedProjectMarker(
  record: ProjectThreeDMarkerRecord,
): { moduleType: ThreeDRuntimeMarkerModuleType | null; reasons: string[] } {
  const reasons: string[] = [];
  const moduleType = THREED_RUNTIME_MARKER_VISUALS[
    record.markerType as ThreeDRuntimeMarkerModuleType
  ] ? record.markerType as ThreeDRuntimeMarkerModuleType : null;
  const recordId = Number(record.id);
  const assetId = Number(record.sourceAssetId);
  const markerId = String(record.markerId ?? '').trim();
  const position = [record.positionX, record.positionY, record.positionZ].map(Number);
  const data = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
    ? record.data
    : {};

  if (!moduleType) reasons.push(`unsupported marker type "${String(record.markerType)}"`);
  if (!Number.isSafeInteger(recordId) || recordId <= 0) reasons.push('database row ID is invalid');
  if (!Number.isSafeInteger(assetId) || assetId <= 0) reasons.push('source asset ID is invalid');
  if (!markerId || markerId.length > 200) reasons.push('marker ID is missing or too long');
  if (!position.every(Number.isFinite)) reasons.push('position must contain finite X, Y, and Z values');
  if (position.some((value) => Math.abs(value) > MAX_SCENE_COORDINATE)) {
    reasons.push('position exceeds the supported Scene boundary');
  }

  for (const field of ['scale', 'scaleMultiplier', 'modelScale']) {
    const reason = validateOptionalNumber(data, field, {
      positive: true,
      max: MAX_MARKER_SCALE,
    });
    if (reason) reasons.push(reason);
  }
  for (const field of ['widthFeet', 'lengthFeet', 'heightFeet', 'width', 'length', 'height', 'depth']) {
    const reason = validateOptionalNumber(data, field, {
      positive: true,
      max: MAX_MARKER_DIMENSION,
    });
    if (reason) reasons.push(reason);
  }
  for (const field of ['rotation', 'rotationX', 'rotationYInstance', 'rotationZ']) {
    const reason = validateOptionalNumber(data, field, { max: 1_000_000 });
    if (reason) reasons.push(reason);
  }

  return { moduleType, reasons };
}

function buildSavedProjectMarkers(
  records: readonly ProjectThreeDMarkerRecord[],
  issues: ThreeDRuntimeMarkerIssue[],
): RuntimeMarker[] {
  const markers: RuntimeMarker[] = [];
  const acceptedMarkerIds = new Set<string>();
  for (const record of records) {
    const validation = validateSavedProjectMarker(record);
    const moduleType = validation.moduleType;
    const assetId = Number(record.sourceAssetId);
    const markerId = String(record.markerId ?? '').trim();
    const position = {
      x: Number(record.positionX),
      y: Number(record.positionY),
      z: Number(record.positionZ),
    };
    if (acceptedMarkerIds.has(markerId)) {
      validation.reasons.push('duplicate marker ID in the Project payload');
    }
    if (!moduleType || validation.reasons.length > 0) {
      issues.push({
        source: 'project_threed_markers',
        recordId: Number.isSafeInteger(Number(record.id)) ? Number(record.id) : null,
        markerId: markerId || '(missing)',
        markerType: String(record.markerType ?? '(missing)'),
        reasons: validation.reasons,
      });
      continue;
    }

    const isModelMarker = moduleType === 'models';
    const markerRecordId = Number(record.id);
    acceptedMarkerIds.add(markerId);

    markers.push({
      id: markerId,
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
        projectMarkerId: markerRecordId,
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
  issues: ThreeDRuntimeMarkerIssue[],
): RuntimeMarker | null {
  const reasons: string[] = [];
  const assetId = Number(item.id);
  const position = extractPosition(item);
  if (!Number.isSafeInteger(assetId) || assetId <= 0) reasons.push('source asset ID is invalid');
  if (!position) {
    reasons.push('position must contain finite X, Y, and Z values');
  } else if (Object.values(position).some(
    (value) => !Number.isFinite(value) || Math.abs(value) > MAX_SCENE_COORDINATE,
  )) {
    reasons.push('position exceeds the supported Scene boundary');
  }
  for (const field of ['scale', 'scaleMultiplier', 'modelScale']) {
    const reason = validateOptionalNumber(item, field, {
      positive: true,
      max: MAX_MARKER_SCALE,
    });
    if (reason) reasons.push(reason);
  }
  for (const field of ['widthFeet', 'lengthFeet', 'heightFeet', 'width', 'length', 'height', 'depth']) {
    const reason = validateOptionalNumber(item, field, {
      positive: true,
      max: MAX_MARKER_DIMENSION,
    });
    if (reason) reasons.push(reason);
  }
  if (!position || reasons.length > 0) {
    issues.push({
      source: 'threed_sub_module',
      recordId: Number.isSafeInteger(assetId) ? assetId : null,
      markerId: Number.isSafeInteger(assetId) ? `${moduleType}-${assetId}` : '(invalid)',
      markerType: moduleType,
      reasons,
    });
    return null;
  }

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

function rejectOverlappingEcctrlSpawns(
  markers: readonly RuntimeMarker[],
  issues: ThreeDRuntimeMarkerIssue[],
): RuntimeMarker[] {
  const movableCharacters = markers.filter(
    (marker) => marker.type === 'characters' && marker.data?.isMovable === true,
  );
  const markersBySpawn = new Map<string, RuntimeMarker[]>();

  for (const marker of movableCharacters) {
    const spawnKey = [marker.position.x, marker.position.y, marker.position.z]
      .map((value) => Number(value).toFixed(6))
      .join(':');
    const matchingMarkers = markersBySpawn.get(spawnKey) ?? [];
    matchingMarkers.push(marker);
    markersBySpawn.set(spawnKey, matchingMarkers);
  }

  const rejectedMarkerIds = new Set<string>();
  for (const matchingMarkers of markersBySpawn.values()) {
    if (matchingMarkers.length < 2) continue;
    const position = matchingMarkers[0].position;
    for (const marker of matchingMarkers) {
      rejectedMarkerIds.add(marker.id);
      issues.push({
        source: marker.metadata?.source === 'project-snapshot'
          ? 'project_threed_markers'
          : 'threed_sub_module',
        recordId: Number.isSafeInteger(Number(marker.data?.projectMarkerId ?? marker.data?.id))
          ? Number(marker.data?.projectMarkerId ?? marker.data?.id)
          : null,
        markerId: marker.id,
        markerType: marker.type,
        reasons: [
          `movable Character shares Ecctrl spawn position X:${position.x}, Y:${position.y}, Z:${position.z} with ${matchingMarkers.length - 1} other movable Character${matchingMarkers.length === 2 ? '' : 's'}`,
        ],
      });
    }
  }

  return rejectedMarkerIds.size === 0
    ? [...markers]
    : markers.filter((marker) => !rejectedMarkerIds.has(marker.id));
}

/** Converts project-scoped ThreeD Sub-Module rows into scene Runtime Markers. */
export function buildThreeDRuntimeMarkers(
  raw: ThreeDRawProjectData | null,
  generatedAt = new Date().toISOString(),
): RuntimeMarker[] {
  return buildThreeDRuntimeMarkerResult(raw, generatedAt).markers;
}

/**
 * Builds Scene-safe Runtime Markers and returns bounded, user-displayable
 * diagnostics for database rows that were rejected before reaching Rapier.
 */
export function buildThreeDRuntimeMarkerResult(
  raw: ThreeDRawProjectData | null,
  generatedAt = new Date().toISOString(),
): ThreeDRuntimeMarkerBuildResult {
  if (!raw) return { markers: [], issues: [] };

  const markers: RuntimeMarker[] = [];
  const issues: ThreeDRuntimeMarkerIssue[] = [];
  const markerIds = new Set<string>();
  const appendMarker = (marker: RuntimeMarker | null) => {
    if (!marker || markerIds.has(marker.id)) return;
    markerIds.add(marker.id);
    markers.push(marker);
  };
  for (const item of raw.plantings ?? []) {
    appendMarker(createMarker(item, 'plantings', raw, generatedAt, issues));
  }

  for (const moduleType of THREED_NON_PLANTING_MARKER_TYPES) {
    for (const item of raw[moduleType] ?? []) {
      appendMarker(createMarker(item, moduleType, raw, generatedAt, issues));
    }
  }

  if (!raw.projectThreedMarkers?.length) {
    return { markers: rejectOverlappingEcctrlSpawns(markers, issues), issues };
  }

  const savedMarkers = new Map(
    buildSavedProjectMarkers(raw.projectThreedMarkers, issues)
      .map((marker) => [marker.id, marker]),
  );
  // A saved Project marker is an instance of its source asset. Once saved,
  // its complete instance payload (including Bed dimensions) is authoritative
  // for that Project and must not drift when the source row later changes.
  const restoredMarkers = markers.map((marker) => savedMarkers.get(marker.id) ?? marker);
  const existingIds = new Set(restoredMarkers.map((marker) => marker.id));
  for (const savedMarker of savedMarkers.values()) {
    if (!existingIds.has(savedMarker.id) && savedMarker.type === 'models') {
      restoredMarkers.push(savedMarker);
    }
  }
  return {
    markers: rejectOverlappingEcctrlSpawns(restoredMarkers, issues),
    issues,
  };
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
