import type { ThreeDModelRuntimeAttachment } from './model-attachment-runtime-core';
import { LoadingManager } from 'three';
import { resolveThreeDModelAttachmentUrl } from './model-attachment-runtime-core';
import { withSavedFbxTextures } from './model-saved-texture-fallback';

/** Resolve Character FBX dependencies before its loader starts requesting images. */
export interface ProjectModelResources {
  renderingAssetsResolved?: boolean;
  modelType?: string;
  files?: ThreeDModelRuntimeAttachment[];
  textureFallbacks?: Array<{ fileName: string; filePath: string; isActive: boolean }>;
}
export async function loadCharacterTextureManager(modelId: number, resources?: ProjectModelResources) {
  if (resources?.renderingAssetsResolved) {
    return textureManager(withSavedFbxTextures(resources.modelType ?? '', resources.files ?? [], resources.textureFallbacks ?? []));
  }
  const response = await fetch(`/api/threed/models?id=${modelId}`, { cache: 'no-store' });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || !Array.isArray(result.data?.files)) {
    throw new Error('Unable to load Character Model texture references');
  }
  const attachments = withSavedFbxTextures(
    result.data.modelType ?? '', result.data.files,
    Array.isArray(result.data.textureFallbacks) ? result.data.textureFallbacks : [],
  );
  return textureManager(attachments);
}

function textureManager(attachments: ThreeDModelRuntimeAttachment[]) {
  const manager = new LoadingManager();
  manager.setURLModifier((url) => resolveThreeDModelAttachmentUrl(url, attachments));
  const signature = attachments.map((file) => `${file.relativePath}:${file.filePath}`).sort().join('|');
  return { manager, signature };
}
