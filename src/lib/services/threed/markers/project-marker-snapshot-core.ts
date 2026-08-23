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
  | 'invalid_snapshot'
  | 'too_many_markers'
  | 'duplicate_marker'
  | 'unsafe_snapshot_data';

export class ProjectMarkerSnapshotError extends Error {
  readonly code: ProjectMarkerSnapshotErrorCode;

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
    throw new ProjectMarkerSnapshotError('invalid_snapshot');
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

  const identities = new Set<string>();
  return value.map((candidate) => {
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

    const identity = `${moduleType}:${assetId}`;
    if (identities.has(identity)) {
      throw new ProjectMarkerSnapshotError('duplicate_marker');
    }
    identities.add(identity);

    const positionSource = candidate.positionSource ?? 'asset';
    if (positionSource !== 'asset' && positionSource !== 'runtime') {
      throw new ProjectMarkerSnapshotError('invalid_snapshot');
    }
    if (typeof candidate.isVisible !== 'boolean' || typeof candidate.isActive !== 'boolean') {
      throw new ProjectMarkerSnapshotError('invalid_snapshot');
    }

    return {
      moduleType,
      assetId,
      name: requireShortText(candidate.name, 250),
      position: requirePosition(candidate.position),
      positionSource,
      color: requireShortText(candidate.color, 100),
      icon: requireShortText(candidate.icon, 100),
      label: requireShortText(candidate.label, 250),
      isVisible: candidate.isVisible,
      isActive: candidate.isActive,
      data: requireSafeJsonRecord(candidate.data ?? {}),
      metadata: requireSafeJsonRecord(candidate.metadata ?? {}),
    };
  });
}
