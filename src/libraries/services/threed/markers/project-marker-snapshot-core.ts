// @ts-expect-error Native TypeScript validators require explicit extensions.
import { characterSpawnsOverlap } from './character-spawn-overlap.ts';
import {
  normalizeThreeDRuntimeMarkerModuleType,
  type ThreeDPosition,
  type ThreeDRuntimeMarkerPositionSource,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './runtime-marker-core.ts';
import type { ThreeDRuntimeMarkerModuleType } from '../../../types/map';

export const MAX_PROJECT_MARKER_SNAPSHOT_ROWS = 1_000;
export const MAX_PROJECT_MARKER_SNAPSHOT_JSON_BYTES = 32_768;

const FORBIDDEN_SNAPSHOT_KEY = /(password|secret|token|credential|ciphertext|authTag|apiKey)/i;

export interface ProjectThreeDMarkerSnapshotInput {
  markerId: string;
  moduleType: ThreeDRuntimeMarkerModuleType;
  assetId: number;
  name: string;
  position: ThreeDPosition;
  positionSource: ThreeDRuntimeMarkerPositionSource;
  color: string;
  icon: string;
  label: string;
  isVisible: boolean;
  isActive: boolean;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export type ProjectMarkerSnapshotErrorCode =
  | 'overlapping_characters'
  | 'invalid_snapshot'
  | 'too_many_markers'
  | 'duplicate_marker'
  | 'unsafe_snapshot_data';

export class ProjectMarkerSnapshotError extends Error {
  readonly code: ProjectMarkerSnapshotErrorCode;
  detail?: string;

  constructor(code: ProjectMarkerSnapshotErrorCode) {
    super(code);
    this.name = 'ProjectMarkerSnapshotError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireShortText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
  }
  return normalized;
}

function requirePosition(value: unknown): ThreeDPosition {
  if (!isRecord(value)) {
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
  }
  const position = {
    x: Number(value.x),
    y: Number(value.y),
    z: Number(value.z),
  };
  if (!Object.values(position).every(Number.isFinite)) {
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
  }
  return position;
}

function assertSafeJsonValue(value: unknown, seen: Set<object>): void {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new ProjectMarkerSnapshotError('invalid_snapshot');
    }
    return;
  }
  if (typeof value !== 'object' || seen.has(value)) {
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
  }

  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => assertSafeJsonValue(item, seen));
  } else {
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_SNAPSHOT_KEY.test(key)) {
        throw new ProjectMarkerSnapshotError('unsafe_snapshot_data');
      }
      assertSafeJsonValue(child, seen);
    }
  }
  seen.delete(value);
}

function requireSafeJsonRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
  }
  assertSafeJsonValue(value, new Set());
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_PROJECT_MARKER_SNAPSHOT_JSON_BYTES) {
    const error = new ProjectMarkerSnapshotError('invalid_snapshot');
    const largest = Object.entries(value).map(([key, child]) => ({ key, bytes: new TextEncoder().encode(JSON.stringify(child)).byteLength }))
      .sort((a, b) => b.bytes - a.bytes)[0];
    const knownField = largest && ['metadata', 'model', 'config', 'files', 'materialAssignments', 'textureFallbacks', 'animations', 'sceneAnimationMapping', 'animationMapping'].includes(largest.key)
      ? ` Largest field: ${largest.key} (${largest.bytes} bytes).` : '';
    error.detail = `JSON exceeds the 32 KiB limit.${knownField}`;
    throw error;
  }
  return value;
}

export function parseProjectThreeDMarkerSnapshot(
  value: unknown,
): ProjectThreeDMarkerSnapshotInput[] {
  if (!Array.isArray(value)) {
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
  }
  if (value.length > MAX_PROJECT_MARKER_SNAPSHOT_ROWS) {
    throw new ProjectMarkerSnapshotError('too_many_markers');
  }

  const markerIds = new Set<string>();
  const nonModelSourceIdentities = new Set<string>();
  const parsed = value.map((candidate, index): ProjectThreeDMarkerSnapshotInput => {
    let field = 'identity';
    try {
      if (!isRecord(candidate)) {
        throw new ProjectMarkerSnapshotError('invalid_snapshot');
      }
      const moduleType = typeof candidate.moduleType === 'string'
        ? normalizeThreeDRuntimeMarkerModuleType(candidate.moduleType)
        : null;
      const assetId = Number(candidate.assetId);
      if (!moduleType || !Number.isSafeInteger(assetId) || assetId <= 0) {
        throw new ProjectMarkerSnapshotError('invalid_snapshot');
      }

      field = 'markerId';
      const markerId = requireShortText(candidate.markerId, 250);
      if (markerIds.has(markerId)) {
        throw new ProjectMarkerSnapshotError('duplicate_marker');
      }
      markerIds.add(markerId);

      const sourceIdentity = `${moduleType}:${assetId}`;
      if (moduleType !== 'models' && nonModelSourceIdentities.has(sourceIdentity)) {
        throw new ProjectMarkerSnapshotError('duplicate_marker');
      }
      if (moduleType !== 'models') nonModelSourceIdentities.add(sourceIdentity);

      field = 'positionSource';
      const positionSource = candidate.positionSource ?? 'asset';
      if (positionSource !== 'asset' && positionSource !== 'runtime') {
        throw new ProjectMarkerSnapshotError('invalid_snapshot');
      }
      field = 'visibility/active flags';
      if (typeof candidate.isVisible !== 'boolean' || typeof candidate.isActive !== 'boolean') {
        throw new ProjectMarkerSnapshotError('invalid_snapshot');
      }

      const read = <T>(key: string, parse: () => T): T => { field = key; return parse(); };
      return {
        markerId,
        moduleType,
        assetId,
        name: read('name (1–250 characters)', () => requireShortText(candidate.name, 250)),
        position: read('position', () => requirePosition(candidate.position)),
        positionSource,
        color: read('color (1–100 characters)', () => requireShortText(candidate.color, 100)),
        icon: read('icon (1–100 characters)', () => requireShortText(candidate.icon, 100)),
        label: read('label (1–250 characters)', () => requireShortText(candidate.label, 250)),
        isVisible: candidate.isVisible,
        isActive: candidate.isActive,
        data: read('data (safe JSON, maximum 32 KiB)', () => requireSafeJsonRecord(candidate.data ?? {})),
        metadata: read('metadata (safe JSON, maximum 32 KiB)', () => requireSafeJsonRecord(candidate.metadata ?? {})),
      };
    } catch (error) {
      if (error instanceof ProjectMarkerSnapshotError) error.detail = `Marker ${index + 1}: ${field}.${error.detail ? ` ${error.detail}` : ''}`;
      throw error;
    }
  });
  const characters = parsed.filter(marker => marker.moduleType === 'characters' && marker.data.isMovable === true);
  for (let i = 0; i < characters.length; i++) {
    if (characters.slice(0, i).some(other => characterSpawnsOverlap(characters[i].position, other.position))) {
      throw new ProjectMarkerSnapshotError('overlapping_characters');
    }
  }
  return parsed;
}
