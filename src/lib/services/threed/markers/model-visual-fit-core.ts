export interface ThreeDVisualBounds {
  width: number;
  height: number;
  depth: number;
}

const MIN_OCCUPANCY = 0.25;
const UPSCALED_OCCUPANCY = 0.5;

/** Places transformed model geometry on or above its local ground plane. */
export function calculateThreeDModelGroundedY(
  modelMinimumY: number,
  configuredOffsetY: number,
): number {
  const safeMinimumY = Number.isFinite(modelMinimumY) ? modelMinimumY : 0;
  const safeOffsetY = Number.isFinite(configuredOffsetY)
    ? Math.max(0, configuredOffsetY)
    : 0;
  return safeOffsetY - safeMinimumY;
}

/** Combines a reusable model's base scale with one Project instance multiplier. */
export function calculateThreeDModelInstanceScale(
  modelScale: string | number | null | undefined,
  instanceMultiplier: string | number | null | undefined,
): number {
  const parsedModelScale = Number(modelScale ?? 1);
  const parsedMultiplier = Number(instanceMultiplier ?? 1);
  const safeModelScale = Number.isFinite(parsedModelScale) && parsedModelScale > 0
    ? parsedModelScale
    : 1;
  const safeMultiplier = Number.isFinite(parsedMultiplier) && parsedMultiplier > 0
    ? parsedMultiplier
    : 1;
  return safeModelScale * safeMultiplier;
}

/**
 * Returns one uniform multiplier so a model keeps its aspect ratio. Stored
 * model scale remains unchanged when the transformed model already occupies a
 * useful portion of the marker envelope.
 */
export function calculateThreeDModelFitMultiplier(
  modelSize: ThreeDVisualBounds,
  targetBounds: ThreeDVisualBounds,
): number {
  const values = [
    modelSize.width,
    modelSize.height,
    modelSize.depth,
    targetBounds.width,
    targetBounds.height,
    targetBounds.depth,
  ];
  if (!values.every((value) => Number.isFinite(value) && value > 0)) {
    return 1;
  }

  const occupancy = Math.max(
    modelSize.width / targetBounds.width,
    modelSize.height / targetBounds.height,
    modelSize.depth / targetBounds.depth,
  );

  if (occupancy > 1) {
    return 1 / occupancy;
  }
  if (occupancy < MIN_OCCUPANCY) {
    return UPSCALED_OCCUPANCY / occupancy;
  }
  return 1;
}
