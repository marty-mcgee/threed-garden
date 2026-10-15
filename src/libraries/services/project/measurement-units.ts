import { METRES_PER_FOOT } from '../threed/scene-units';
export type MeasurementUnits = 'imperial' | 'metric';
export function formatProjectSceneLength(value: number, metresPerSceneUnit: number, units: MeasurementUnits): string {
  return units === 'metric' ? `${(value * metresPerSceneUnit).toFixed(1)} m` : `${(value * metresPerSceneUnit / METRES_PER_FOOT).toFixed(1)} ft`;
}
export class MeasurementUnitsError extends Error {}
export function parseMeasurementUnits(value: unknown): MeasurementUnits {
  if (value !== 'imperial' && value !== 'metric') throw new MeasurementUnitsError('Measurement units must be Imperial or Metric.');
  return value;
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
/** Canonical Project preference; retain explicit preferences from older Design saves. */
export function readProjectMeasurementUnits(config: unknown): MeasurementUnits {
  const source = record(config);
  const value = source.measurementUnits ?? record(record(source.threeDViewState).design).measurementUnits;
  return value === 'metric' ? 'metric' : 'imperial';
}
