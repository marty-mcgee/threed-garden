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
