import type {
  ThreeDActionTarget,
  ThreeDActionTargetType,
} from '../../../types/map';
import {
  THREED_RUNTIME_MARKER_MODULE_TYPES,
  normalizeThreeDRuntimeMarkerModuleType,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../markers/runtime-marker-core.ts';

export const THREED_ACTION_TARGET_MARKER_TYPES =
  THREED_RUNTIME_MARKER_MODULE_TYPES;

export type ThreeDActionTargetMarkerType = ThreeDActionTargetType;

export const THREED_GENERIC_TARGET_ACTIONS = [
  'point',
  'pointGesture',
  'talk',
] as const;

export const THREED_PLANTING_TARGET_ACTIONS = [
  'watering',
  'digAndPlantSeeds',
  'plantAPlant',
  'plantTree',
  'pullPlant',
  'pullPlant2',
  'pickFruit',
  'pickFruit2',
  'pickFruit3',
] as const;

export type ThreeDGenericTargetAction =
  typeof THREED_GENERIC_TARGET_ACTIONS[number];

export type ThreeDPlantingTargetAction =
  typeof THREED_PLANTING_TARGET_ACTIONS[number];

export interface ThreeDActionTargetCapabilities {
  markerType: ThreeDActionTargetMarkerType;
  targetable: true;
  navigationEnabled: true;
  genericActions: readonly ThreeDGenericTargetAction[];
  moduleActions: readonly ThreeDPlantingTargetAction[];
}

export type ThreeDActionTargetErrorCode =
  | 'invalid_marker_type'
  | 'invalid_marker_id'
  | 'invalid_asset_id'
  | 'invalid_name'
  | 'invalid_position';

export class ThreeDActionTargetError extends Error {
  readonly code: ThreeDActionTargetErrorCode;

  constructor(code: ThreeDActionTargetErrorCode) {
    super(code);
    this.name = 'ThreeDActionTargetError';
    this.code = code;
  }
}

export interface CreateThreeDActionTargetInput {
  markerId: string;
  markerType: string;
  assetId: number;
  name: string;
  position: { x: number; y: number; z: number };
}

export interface ThreeDActionTargetIdentityCandidate {
  markerType: string;
  assetId: number;
}

export function isThreeDActionTargetMarkerType(
  value: string,
): value is ThreeDActionTargetMarkerType {
  return THREED_ACTION_TARGET_MARKER_TYPES.includes(
    value as ThreeDActionTargetMarkerType,
  );
}

export function normalizeThreeDActionTargetMarkerType(
  value: string,
): ThreeDActionTargetMarkerType | null {
  return normalizeThreeDRuntimeMarkerModuleType(value);
}

/**
 * Creates the shared client-side identity used when a Runtime Marker becomes
 * an Action Target. Provider commands and persistence remain outside this
 * simulation-only boundary.
 */
export function createThreeDActionTarget(
  input: CreateThreeDActionTargetInput,
): ThreeDActionTarget {
  const markerType = normalizeThreeDActionTargetMarkerType(input.markerType);
  if (!markerType) {
    throw new ThreeDActionTargetError('invalid_marker_type');
  }

  const markerId = input.markerId.trim();
  if (!markerId) {
    throw new ThreeDActionTargetError('invalid_marker_id');
  }

  if (!Number.isSafeInteger(input.assetId) || input.assetId <= 0) {
    throw new ThreeDActionTargetError('invalid_asset_id');
  }

  const name = input.name.trim();
  if (!name) {
    throw new ThreeDActionTargetError('invalid_name');
  }

  const position = {
    x: input.position.x,
    y: input.position.y,
    z: input.position.z,
  };
  if (!Object.values(position).every(Number.isFinite)) {
    throw new ThreeDActionTargetError('invalid_position');
  }

  return Object.freeze({
    markerId,
    type: markerType,
    id: input.assetId,
    name,
    position: Object.freeze(position),
  });
}

/** Matches refreshed or rendered marker identity to an existing target. */
export function isMatchingThreeDActionTarget(
  target: ThreeDActionTarget,
  candidate: ThreeDActionTargetIdentityCandidate,
): boolean {
  const markerType = normalizeThreeDActionTargetMarkerType(candidate.markerType);
  if (
    !markerType
    || markerType !== target.type
    || !Number.isSafeInteger(candidate.assetId)
    || candidate.assetId <= 0
  ) {
    return false;
  }

  return candidate.assetId === target.id;
}

/**
 * Returns ThreeD-owned targeting capabilities for a rendered Runtime Marker.
 * Persistence, MQTT, and physical-operation authorization are intentionally
 * outside this client-safe capability description.
 */
export function getThreeDActionTargetCapabilities(
  markerType: string,
): ThreeDActionTargetCapabilities | null {
  const normalizedMarkerType = normalizeThreeDActionTargetMarkerType(markerType);
  if (!normalizedMarkerType) {
    return null;
  }

  return Object.freeze({
    markerType: normalizedMarkerType,
    targetable: true,
    navigationEnabled: true,
    genericActions: THREED_GENERIC_TARGET_ACTIONS,
    moduleActions: normalizedMarkerType === 'plantings'
      ? THREED_PLANTING_TARGET_ACTIONS
      : Object.freeze([]) as readonly ThreeDPlantingTargetAction[],
  });
}
