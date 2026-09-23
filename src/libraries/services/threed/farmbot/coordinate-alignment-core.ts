export const FARMBOT_COORDINATE_ALIGNMENT_VERSION = 1 as const;

export interface FarmBotPhysicalPosition {
  x: number;
  y: number;
  z: number;
}

export interface FarmBotScenePosition {
  x: number;
  y: number;
  z: number;
}

export interface FarmBotPhysicalBounds {
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
}

export interface FarmBotCoordinateAlignmentV1 {
  version: typeof FARMBOT_COORDINATE_ALIGNMENT_VERSION;
  sceneOrigin: FarmBotScenePosition;
  millimetersPerSceneUnit: number;
  yawDegrees: number;
  axisSigns: Readonly<{ x: 1 | -1; y: 1 | -1; z: 1 | -1 }>;
  physicalBounds: FarmBotPhysicalBounds;
}

export interface FarmBotLiveAlignmentConfiguration {
  enabled: boolean;
  alignment: FarmBotCoordinateAlignmentV1;
}

export class FarmBotCoordinateAlignmentError extends Error {
  readonly code: 'invalid_alignment' | 'invalid_position' | 'outside_working_bounds';

  constructor(code: 'invalid_alignment' | 'invalid_position' | 'outside_working_bounds') {
    super(code);
    this.name = 'FarmBotCoordinateAlignmentError';
    this.code = code;
  }
}

const MAX_ABSOLUTE_VALUE = 1_000_000;
const DEGREES_TO_RADIANS = Math.PI / 180;

function boundedFinite(value: unknown, code: 'invalid_alignment' | 'invalid_position'): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > MAX_ABSOLUTE_VALUE) {
    throw new FarmBotCoordinateAlignmentError(code);
  }
  return value;
}

function normalizeBounds(value: unknown): readonly [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new FarmBotCoordinateAlignmentError('invalid_alignment');
  }
  const minimum = boundedFinite(value[0], 'invalid_alignment');
  const maximum = boundedFinite(value[1], 'invalid_alignment');
  if (minimum > maximum) throw new FarmBotCoordinateAlignmentError('invalid_alignment');
  return Object.freeze([minimum, maximum] as const);
}

export function normalizeFarmBotCoordinateAlignment(
  input: unknown,
): Readonly<FarmBotCoordinateAlignmentV1> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new FarmBotCoordinateAlignmentError('invalid_alignment');
  }
  const candidate = input as Record<string, any>;
  if (candidate.version !== FARMBOT_COORDINATE_ALIGNMENT_VERSION) {
    throw new FarmBotCoordinateAlignmentError('invalid_alignment');
  }
  const millimetersPerSceneUnit = boundedFinite(candidate.millimetersPerSceneUnit, 'invalid_alignment');
  if (millimetersPerSceneUnit <= 0) throw new FarmBotCoordinateAlignmentError('invalid_alignment');
  const signs = candidate.axisSigns;
  if (!signs || ![signs.x, signs.y, signs.z].every((value) => value === 1 || value === -1)) {
    throw new FarmBotCoordinateAlignmentError('invalid_alignment');
  }
  const sceneOrigin = Object.freeze({
    x: boundedFinite(candidate.sceneOrigin?.x, 'invalid_alignment'),
    y: boundedFinite(candidate.sceneOrigin?.y, 'invalid_alignment'),
    z: boundedFinite(candidate.sceneOrigin?.z, 'invalid_alignment'),
  });
  return Object.freeze({
    version: FARMBOT_COORDINATE_ALIGNMENT_VERSION,
    sceneOrigin,
    millimetersPerSceneUnit,
    yawDegrees: boundedFinite(candidate.yawDegrees, 'invalid_alignment'),
    axisSigns: Object.freeze({ x: signs.x, y: signs.y, z: signs.z }),
    physicalBounds: Object.freeze({
      x: normalizeBounds(candidate.physicalBounds?.x),
      y: normalizeBounds(candidate.physicalBounds?.y),
      z: normalizeBounds(candidate.physicalBounds?.z),
    }),
  });
}

export function readFarmBotLiveAlignmentConfiguration(
  metadata: unknown,
): Readonly<FarmBotLiveAlignmentConfiguration> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).farmbotLiveAlignment;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.enabled !== 'boolean') return null;
  try {
    return Object.freeze({
      enabled: candidate.enabled,
      alignment: normalizeFarmBotCoordinateAlignment(candidate.alignment),
    });
  } catch {
    return null;
  }
}

export function alignFarmBotPhysicalPosition(input: {
  alignment: FarmBotCoordinateAlignmentV1;
  physicalPosition: FarmBotPhysicalPosition;
}): Readonly<FarmBotScenePosition> {
  const alignment = normalizeFarmBotCoordinateAlignment(input.alignment);
  const physical = {
    x: boundedFinite(input.physicalPosition?.x, 'invalid_position'),
    y: boundedFinite(input.physicalPosition?.y, 'invalid_position'),
    z: boundedFinite(input.physicalPosition?.z, 'invalid_position'),
  };
  for (const axis of ['x', 'y', 'z'] as const) {
    const [minimum, maximum] = alignment.physicalBounds[axis];
    if (physical[axis] < minimum || physical[axis] > maximum) {
      throw new FarmBotCoordinateAlignmentError('outside_working_bounds');
    }
  }

  // FarmBot X/Y are its horizontal length/width axes. FarmBot Z is its
  // vertical axis. The alignment turns those into Scene X/Z and Scene Y,
  // then applies a clockwise Project-local yaw around the saved origin.
  const localX = (physical.x * alignment.axisSigns.x) / alignment.millimetersPerSceneUnit;
  const localZ = (physical.y * alignment.axisSigns.y) / alignment.millimetersPerSceneUnit;
  const localY = (physical.z * alignment.axisSigns.z) / alignment.millimetersPerSceneUnit;
  const yaw = alignment.yawDegrees * DEGREES_TO_RADIANS;
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);

  return Object.freeze({
    x: alignment.sceneOrigin.x + (localX * cosine) - (localZ * sine),
    y: alignment.sceneOrigin.y + localY,
    z: alignment.sceneOrigin.z + (localX * sine) + (localZ * cosine),
  });
}
