import type { ThreeDActionTargetType } from '../../../types/map';

export const THREED_ACTION_TARGET_MARKER_TYPES = [
  'plantings',
  'beds',
  'characters',
  'farmbots',
  'models',
] as const satisfies readonly ThreeDActionTargetType[];

export type ThreeDActionTargetMarkerType = ThreeDActionTargetType;

const THREED_ACTION_TARGET_MARKER_TYPE_ALIASES: Record<
  string,
  ThreeDActionTargetMarkerType
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
  return THREED_ACTION_TARGET_MARKER_TYPE_ALIASES[
    value.trim().toLowerCase()
  ] ?? null;
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
