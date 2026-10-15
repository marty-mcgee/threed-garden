/** Architecture is stored in metres; Scene coordinates use Project calibration. */
export const METRES_PER_FOOT = 0.3048;
export const METRES_PER_INCH = 0.0254;

export function sceneUnitsPerMetre(metresPerSceneUnit: number): number {
  if (!Number.isFinite(metresPerSceneUnit) || metresPerSceneUnit <= 0) {
    throw new Error('Project metres per Scene unit must be a positive finite number.');
  }
  return 1 / metresPerSceneUnit;
}

export function metresToSceneUnits(metres: number, metresPerSceneUnit: number): number {
  return metres * sceneUnitsPerMetre(metresPerSceneUnit);
}

/** Optional asset sizing, NOT Project calibration. Exclude the current instance multiplier. */
export function characterHeightMultiplier(rawHeight: number, catalogScale: number, targetMetres: number, metresPerSceneUnit: number): number {
  for (const value of [rawHeight, catalogScale, targetMetres]) {
    if (!Number.isFinite(value) || value <= 0) throw new Error('Character calibration requires positive finite dimensions and scale.');
  }
  return metresToSceneUnits(targetMetres, metresPerSceneUnit) / (rawHeight * catalogScale);
}
