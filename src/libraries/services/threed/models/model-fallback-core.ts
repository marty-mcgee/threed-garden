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
