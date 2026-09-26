/** Saved instance settings may survive; stored asset URLs must come from current records. */
export function currentModelAssets(model: Record<string, unknown> | undefined) {
  const metadata = model?.metadata && typeof model.metadata === 'object' && !Array.isArray(model.metadata)
    ? model.metadata as Record<string, unknown> : {};
  return {
    filePath: typeof model?.filePath === 'string' ? model.filePath : '',
    fileSize: model?.fileSize ?? null,
    mainModelFileId: model?.mainModelFileId ?? null,
    modelType: model?.modelType,
    fallbackShape: metadata.fallbackShape ?? 'sphere',
    files: Array.isArray(model?.files) ? model.files : [],
  };
}

/** Overlay current file authority after saved instance settings, including empty references. */
export function refreshModelMarkerData(saved: Record<string, unknown>, modelId: number, model: Record<string, unknown> | undefined): Record<string, unknown> & ReturnType<typeof currentModelAssets> & { modelId: number } {
  return { ...model, ...saved, modelId, ...currentModelAssets(model) };
}

/** A current custom assignment takes precedence; a missing custom Model must not revive an old one. */
export function currentPlantingModelId(source: { customModelId: number | null; plantModelId: number | null } | undefined) {
  return source?.customModelId ?? source?.plantModelId ?? null;
}
