export type SimulationMarkerPreview = {
  sourceAssetId: number;
  modelId: number | null;
  position: [number, number, number];
  rotation: [number, number, number];
  characterScale: number | null;
  scaleMultiplier: number;
  visible: boolean;
};

const numeric = (value: unknown, fallback: number | null, positive = false): number | null => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= 1_000_000 && (!positive || n > 0) ? n : null;
};
const id = (value: unknown) => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const n = Number(value); return Number.isSafeInteger(n) && n > 0 && n <= 2_147_483_647 ? n : null;
};

/** Private options expose only the saved pose/source needed by the Admin preview. */
export function simulationMarkerPreview(row: {
  sourceAssetId?: unknown; markerType: string; positionX?: unknown; positionY?: unknown; positionZ?: unknown;
  isVisible?: boolean | null; data?: unknown;
}): SimulationMarkerPreview | null {
  const sourceAssetId = id(row.sourceAssetId);
  const position = [row.positionX, row.positionY, row.positionZ].map(n => numeric(n, null));
  if (!sourceAssetId || position.some(n => n === null)) return null;
  const data = row.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data as Record<string, unknown> : {};
  const character = row.markerType === 'characters';
  const rotation = row.markerType === 'models'
    ? [data.rotationX, data.rotationYInstance, data.rotationZ].map(n => numeric(n, 0))
    : [0, (numeric(data.rotation, 0) ?? NaN) * Math.PI / 180, 0];
  const characterScale = character ? numeric(data.scale, null, true) : null;
  const scaleMultiplier = numeric(data.scaleMultiplier, 1, true);
  if (rotation.some(n => n === null || !Number.isFinite(n)) || !scaleMultiplier || (character && data.scale != null && characterScale === null)) return null;
  return { sourceAssetId, modelId: id(data.modelId), position: position as [number, number, number],
    rotation: rotation as [number, number, number], characterScale, scaleMultiplier,
    visible: row.isVisible !== false && data.visible !== false && data.status !== 'inactive' };
}
