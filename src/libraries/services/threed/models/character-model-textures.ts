import type { ThreeDModelRuntimeAttachment } from './model-attachment-runtime-core';
import { LoadingManager, TextureLoader, type Object3D } from 'three';
import { resolveThreeDModelAttachmentUrl } from './model-attachment-runtime-core';
import { withSavedFbxTextures } from './model-saved-texture-fallback';
import { mergeThreeDModelMaterialAssignments } from './model-material-override-core';
import { applyThreeDModelMaterialAssignments } from './model-material-texture';

/** Resolve Character FBX dependencies before its loader starts requesting images. */
export interface ProjectModelResources {
  renderingAssetsResolved?: boolean;
  modelType?: string;
  files?: ThreeDModelRuntimeAttachment[];
  textureFallbacks?: Array<{ fileName: string; filePath: string; isActive: boolean }>;
  metadata?: unknown;
  materialAssignments?: Array<{ targetKey: string; channel: string; textureUrl: string }>;
}
export async function loadCharacterTextureManager(modelId: number, resources?: ProjectModelResources) {
  if (resources?.renderingAssetsResolved) {
    return textureManager(withSavedFbxTextures(resources.modelType ?? '', resources.files ?? [], resources.textureFallbacks ?? []), resources);
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
  return textureManager(attachments, result.data as ProjectModelResources);
}

/** Model material bindings change appearance only, never rig, animation or body ownership. */
export async function applyCharacterModelMaterialAssignments(root: Object3D, resources: ProjectModelResources, manager?: LoadingManager) {
  const loader = new TextureLoader(manager);
  return applyThreeDModelMaterialAssignments(root, resources.modelType ?? '',
    mergeThreeDModelMaterialAssignments(resources.metadata, resources.materialAssignments), async reference => {
      const url = resolveThreeDModelAttachmentUrl(reference, resources.files ?? []);
      return /^(?:https:|data:|blob:)/i.test(url) ? loader.loadAsync(url) : null;
    });
}

function textureManager(attachments: ThreeDModelRuntimeAttachment[], resources: ProjectModelResources) {
  const manager = new LoadingManager();
  manager.setURLModifier((url) => resolveThreeDModelAttachmentUrl(url, attachments));
  const signature = attachments.map((file) => `${file.relativePath}:${file.filePath}`).sort().join('|');
  return { manager, signature, resources };
}
