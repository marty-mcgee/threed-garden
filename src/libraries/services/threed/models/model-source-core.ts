// @ts-expect-error Native Node validation requires the explicit extension.
import { MODEL_FALLBACK_SHAPES } from './model-fallback-core.ts';
export const MODEL_SOURCES = ['model', 'shape', 'character'] as const;
export type ModelSource = typeof MODEL_SOURCES[number];
type SourceModel = { modelType: string; filePath?: string | null; metadata?: unknown; usedByCharacters?: boolean | null };

export function readModelSource(model: SourceModel): ModelSource {
  const metadata = model.metadata;
  const source = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>).activeSource : undefined;
  if (MODEL_SOURCES.includes(source as ModelSource)) return source as ModelSource;
  return model.modelType === 'procedural' && !model.filePath ? 'shape' : model.usedByCharacters ? 'character' : 'model';
}

export function validModelSource(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const source = (metadata as Record<string, unknown>).activeSource;
  const shape = (metadata as Record<string, unknown>).fallbackShape;
  return (source === undefined || MODEL_SOURCES.includes(source as ModelSource))
    && (source !== 'shape' || shape === undefined || MODEL_FALLBACK_SHAPES.includes(shape as typeof MODEL_FALLBACK_SHAPES[number]));
}

export function setModelSource(metadataJson: string, source: ModelSource): string {
  const metadata = JSON.parse(metadataJson || '{}');
  if (!validModelSource(metadata) || !MODEL_SOURCES.includes(source)) throw new Error('Invalid Model source');
  return JSON.stringify({ ...metadata, activeSource: source });
}

/** Rendering projection only: never mutate the reusable saved file/rig configuration. */
export function resolveActiveModelGeometry<T extends SourceModel>(model: T): T {
  return readModelSource(model) === 'shape' ? { ...model, modelType: 'procedural', filePath: '' } : model;
}
