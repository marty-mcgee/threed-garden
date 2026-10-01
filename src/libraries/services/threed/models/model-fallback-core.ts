export const MODEL_FALLBACK_SHAPES = ['sphere', 'box', 'rectangle', 'cylinder', 'pyramid', 'torus'] as const;
export type ModelFallbackShape = typeof MODEL_FALLBACK_SHAPES[number];

export function readModelFallbackShape(metadata: unknown): ModelFallbackShape {
  const value = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>).fallbackShape : undefined;
  return MODEL_FALLBACK_SHAPES.includes(value as ModelFallbackShape) ? value as ModelFallbackShape : 'sphere';
}

/** Preserve all unrelated metadata, and reject malformed editor JSON rather than overwrite it. */
export function setModelFallbackShape(metadataJson: string, shape: ModelFallbackShape): string {
  const metadata = JSON.parse(metadataJson || '{}');
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Metadata must be a JSON object');
  if (!MODEL_FALLBACK_SHAPES.includes(shape)) throw new Error('Invalid fallback shape');
  return JSON.stringify({ ...metadata, fallbackShape: shape });
}

/** Scaled local bounds of the built-in fallback mesh. */
export function modelFallbackCollisionBounds(shape: ModelFallbackShape, scale: number): {
  center: [number, number, number];
  halfExtents: [number, number, number];
} | null {
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const extents: Record<ModelFallbackShape, [number, number, number]> = {
    sphere: [0.5, 0.5, 0.5],
    box: [0.5, 0.5, 0.5],
    rectangle: [0.7, 0.5, 0.3],
    cylinder: [0.35, 0.5, 0.35],
    pyramid: [0.65, 0.5, 0.65],
    torus: [0.5, 0.5, 0.15],
  };
  const [x, y, z] = extents[shape];
  return {
    center: [0, 0.5 * scale, 0],
    halfExtents: [x * scale, y * scale, z * scale],
  };
}
