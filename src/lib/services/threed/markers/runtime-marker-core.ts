import type { ThreeDRuntimeMarkerModuleType } from '../../../types/map';

export const THREED_RUNTIME_MARKER_MODULE_TYPES = [
  'plantings',
  'beds',
  'characters',
  'farmbots',
  'models',
] as const satisfies readonly ThreeDRuntimeMarkerModuleType[];

const THREED_RUNTIME_MARKER_MODULE_TYPE_ALIASES: Record<
  string,
  ThreeDRuntimeMarkerModuleType
> = {
  planting: 'plantings',
  plantings: 'plantings',
  bed: 'beds',
  beds: 'beds',
  character: 'characters',
  characters: 'characters',
  farmbot: 'farmbots',
  farmbots: 'farmbots',
  model: 'models',
  models: 'models',
};

export interface ThreeDPosition {
  x: number;
  y: number;
  z: number;
}

export interface ThreeDRuntimeMarkerIdentity {
  moduleType: ThreeDRuntimeMarkerModuleType;
  assetId: number;
}

export interface ThreeDRuntimeMarkerRegistration {
  moduleType: string;
  assetId: number;
  name: string;
  assetPosition: ThreeDPosition;
}

export type ThreeDRuntimeMarkerPositionSource = 'asset' | 'runtime';

export interface ThreeDRuntimeMarkerSnapshot {
  identity: ThreeDRuntimeMarkerIdentity;
  key: string;
  markerId: string;
  name: string;
  assetPosition: ThreeDPosition;
  livePosition: ThreeDPosition | null;
  currentPosition: ThreeDPosition;
  positionSource: ThreeDRuntimeMarkerPositionSource;
}

export type ThreeDRuntimeMarkerRegistryErrorCode =
  | 'invalid_module_type'
  | 'invalid_asset_id'
  | 'invalid_name'
  | 'invalid_position'
  | 'duplicate_identity';

export class ThreeDRuntimeMarkerRegistryError extends Error {
  readonly code: ThreeDRuntimeMarkerRegistryErrorCode;

  constructor(code: ThreeDRuntimeMarkerRegistryErrorCode) {
    super(code);
    this.name = 'ThreeDRuntimeMarkerRegistryError';
    this.code = code;
  }
}

interface ThreeDRuntimeMarkerEntry {
  identity: ThreeDRuntimeMarkerIdentity;
  key: string;
  markerId: string;
  name: string;
  assetPosition: ThreeDPosition;
  livePosition: ThreeDPosition | null;
}

export function normalizeThreeDRuntimeMarkerModuleType(
  value: string,
): ThreeDRuntimeMarkerModuleType | null {
  return THREED_RUNTIME_MARKER_MODULE_TYPE_ALIASES[
    value.trim().toLowerCase()
  ] ?? null;
}

export function createThreeDRuntimeMarkerKey(
  identity: ThreeDRuntimeMarkerIdentity,
): string {
  return `${identity.moduleType}:${identity.assetId}`;
}

function validatePosition(position: ThreeDPosition): ThreeDPosition {
  const copy = { x: position.x, y: position.y, z: position.z };
  if (!Object.values(copy).every(Number.isFinite)) {
    throw new ThreeDRuntimeMarkerRegistryError('invalid_position');
  }
  return copy;
}

function createEntry(
  registration: ThreeDRuntimeMarkerRegistration,
  livePosition: ThreeDPosition | null = null,
): ThreeDRuntimeMarkerEntry {
  const moduleType = normalizeThreeDRuntimeMarkerModuleType(
    registration.moduleType,
  );
  if (!moduleType) {
    throw new ThreeDRuntimeMarkerRegistryError('invalid_module_type');
  }
  if (!Number.isSafeInteger(registration.assetId) || registration.assetId <= 0) {
    throw new ThreeDRuntimeMarkerRegistryError('invalid_asset_id');
  }

  const name = registration.name.trim();
  if (!name) {
    throw new ThreeDRuntimeMarkerRegistryError('invalid_name');
  }

  const identity = { moduleType, assetId: registration.assetId };
  return {
    identity,
    key: createThreeDRuntimeMarkerKey(identity),
    markerId: `${moduleType}-${registration.assetId}`,
    name,
    assetPosition: validatePosition(registration.assetPosition),
    livePosition: livePosition ? validatePosition(livePosition) : null,
  };
}

function snapshotEntry(entry: ThreeDRuntimeMarkerEntry): ThreeDRuntimeMarkerSnapshot {
  const identity = Object.freeze({ ...entry.identity });
  const assetPosition = Object.freeze({ ...entry.assetPosition });
  const livePosition = entry.livePosition
    ? Object.freeze({ ...entry.livePosition })
    : null;
  const currentPosition = livePosition ?? assetPosition;

  return Object.freeze({
    identity,
    key: entry.key,
    markerId: entry.markerId,
    name: entry.name,
    assetPosition,
    livePosition,
    currentPosition,
    positionSource: livePosition ? 'runtime' : 'asset',
  });
}

function resolveIdentity(
  moduleType: string,
  assetId: number,
): ThreeDRuntimeMarkerIdentity | null {
  const normalizedModuleType = normalizeThreeDRuntimeMarkerModuleType(moduleType);
  if (
    !normalizedModuleType
    || !Number.isSafeInteger(assetId)
    || assetId <= 0
  ) {
    return null;
  }
  return { moduleType: normalizedModuleType, assetId };
}

/**
 * Provider-neutral in-memory mirror of database-driven Project marker identity
 * plus current runtime position. Project assignment, Layer records, filtering,
 * React state, persistence, and effects live outside this registry.
 */
export class ThreeDRuntimeMarkerRegistry {
  private entries = new Map<string, ThreeDRuntimeMarkerEntry>();

  replaceAssetMarkers(
    registrations: readonly ThreeDRuntimeMarkerRegistration[],
  ): readonly ThreeDRuntimeMarkerSnapshot[] {
    const replacement = new Map<string, ThreeDRuntimeMarkerEntry>();

    for (const registration of registrations) {
      const candidate = createEntry(registration);
      if (replacement.has(candidate.key)) {
        throw new ThreeDRuntimeMarkerRegistryError('duplicate_identity');
      }
      const existing = this.entries.get(candidate.key);
      replacement.set(
        candidate.key,
        createEntry(registration, existing?.livePosition ?? null),
      );
    }

    this.entries = replacement;
    return this.list();
  }

  resolve(moduleType: string, assetId: number): ThreeDRuntimeMarkerSnapshot | null {
    const identity = resolveIdentity(moduleType, assetId);
    if (!identity) return null;
    const entry = this.entries.get(createThreeDRuntimeMarkerKey(identity));
    return entry ? snapshotEntry(entry) : null;
  }

  updateLivePosition(
    moduleType: string,
    assetId: number,
    position: ThreeDPosition,
  ): boolean {
    const identity = resolveIdentity(moduleType, assetId);
    if (!identity) return false;
    const entry = this.entries.get(createThreeDRuntimeMarkerKey(identity));
    if (!entry) return false;
    entry.livePosition = validatePosition(position);
    return true;
  }

  clearLivePosition(
    moduleType: string,
    assetId: number,
  ): ThreeDRuntimeMarkerSnapshot | null {
    const identity = resolveIdentity(moduleType, assetId);
    if (!identity) return null;
    const entry = this.entries.get(createThreeDRuntimeMarkerKey(identity));
    if (!entry) return null;
    entry.livePosition = null;
    return snapshotEntry(entry);
  }

  remove(moduleType: string, assetId: number): boolean {
    const identity = resolveIdentity(moduleType, assetId);
    return identity
      ? this.entries.delete(createThreeDRuntimeMarkerKey(identity))
      : false;
  }

  clear(): void {
    this.entries.clear();
  }

  list(): readonly ThreeDRuntimeMarkerSnapshot[] {
    return Object.freeze(Array.from(this.entries.values(), snapshotEntry));
  }

  get size(): number {
    return this.entries.size;
  }
}
