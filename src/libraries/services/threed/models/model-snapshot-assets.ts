// @ts-expect-error Native Node TypeScript validation requires the explicit extension.
import { readModelLightBoost } from './model-lighting-core.ts';

/** Catalog metadata/assets are rehydrated from current Model records; instance metadata is marker.metadata. */
export function modelMarkerSnapshotData(data: Record<string, unknown>): Record<string, unknown> {
  const { metadata: _catalogMetadata, files: _files, materialAssignments: _materials, textureFallbacks: _textures, ...instance } = data;
  return instance;
}

/** Saved instance settings may survive; stored asset URLs must come from current records. */
export function currentModelAssets(model: Record<string, unknown> | undefined) {
  const metadata = model?.metadata && typeof model.metadata === 'object' && !Array.isArray(model.metadata)
    ? model.metadata as Record<string, unknown> : {};
  return {
    filePath: typeof model?.filePath === 'string' ? model.filePath : '',
    renderingAssetsResolved: model?.renderingAssetsResolved === true,
    ...(!model || Array.isArray(model.materialAssignments)
      ? { materialAssignments: model?.materialAssignments ?? [] } : {}),
    ...(!model || Array.isArray(model.textureFallbacks)
      ? { textureFallbacks: model?.textureFallbacks ?? [] } : {}),
    imageTopViewUrl: typeof model?.imageTopViewUrl === 'string' ? model.imageTopViewUrl : null,
    fileSize: model?.fileSize ?? null,
    mainModelFileId: model?.mainModelFileId ?? null,
    modelType: model?.modelType,
    fallbackShape: metadata.fallbackShape ?? 'sphere',
    modelLightBoost: readModelLightBoost(metadata),
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
