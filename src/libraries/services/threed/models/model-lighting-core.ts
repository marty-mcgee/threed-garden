/** Additive material brightness for a reusable Model; 0 preserves the imported asset. */
export const MAX_MODEL_LIGHT_BOOST = 1;

export function readModelLightBoost(metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 0;
  const value = (metadata as Record<string, unknown>).lightBoost;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_MODEL_LIGHT_BOOST ? value : 0;
}

export function validModelLightBoost(metadata: unknown): boolean {
  if (metadata === null || metadata === undefined) return true;
  if (typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const value = (metadata as Record<string, unknown>).lightBoost;
  return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_MODEL_LIGHT_BOOST);
}

export function setModelLightBoost(json: string, value: number): string {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
      !Number.isFinite(value) || value < 0 || value > MAX_MODEL_LIGHT_BOOST) {
    throw new Error('Invalid Model light boost.');
  }
  const metadata = { ...(parsed as Record<string, unknown>) };
  if (value === 0) delete metadata.lightBoost;
  else metadata.lightBoost = value;
  return JSON.stringify(metadata);
}
