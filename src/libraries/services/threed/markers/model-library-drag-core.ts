export const THREED_MODEL_LIBRARY_DRAG_MIME = 'application/x-threed-model-library+json';

export interface ThreeDModelLibraryDragPayload {
  version: 1;
  kind: 'threed-model-library-item';
  modelId: number;
}

export function createThreeDModelLibraryDragPayload(modelId: number): string {
  if (!Number.isSafeInteger(modelId) || modelId <= 0) {
    throw new Error('Model Library drag requires a positive integer Model ID');
  }
  return JSON.stringify({
    version: 1,
    kind: 'threed-model-library-item',
    modelId,
  } satisfies ThreeDModelLibraryDragPayload);
}

export function parseThreeDModelLibraryDragPayload(
  serialized: string,
): ThreeDModelLibraryDragPayload | null {
  if (!serialized || serialized.length > 160) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      Object.keys(record).length !== 3
      || record.version !== 1
      || record.kind !== 'threed-model-library-item'
      || !Number.isSafeInteger(record.modelId)
      || Number(record.modelId) <= 0
    ) return null;
    return value as ThreeDModelLibraryDragPayload;
  } catch {
    return null;
  }
}

export function isMatchingThreeDModelLibraryDragPayload(
  serialized: string,
  expectedModelId: number,
): boolean {
  const payload = parseThreeDModelLibraryDragPayload(serialized);
  return payload?.modelId === expectedModelId;
}
