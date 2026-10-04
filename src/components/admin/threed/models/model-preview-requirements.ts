import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { withSavedFbxTextures } from '@/libraries/services/threed/models/model-saved-texture-fallback';
import { resolveThreeDModelAttachmentUrl } from '@/libraries/services/threed/models/model-attachment-runtime-core';
import { resolveActiveModelGeometry } from '@/libraries/services/threed/models/model-source-core';
export interface PreviewRequirement { kind: string; relativePath: string; satisfied: boolean }
/** Freeze Admin rendering to explicit resources; never fetch owner-library fallbacks implicitly. */
export function modelForPreview(model: ModelData, troubleshoot = false): ModelData {
  const assignedTextures = (model.materialAssignments ?? []).map(assignment => ({
    fileName: assignment.textureFileName, filePath: assignment.textureUrl, isActive: true,
  }));
  return {
    ...resolveActiveModelGeometry(model),
    renderingAssetsResolved: true,
    textureFallbacks: troubleshoot ? model.textureFallbacks ?? [] : assignedTextures,
  };
}
export function resolvePreviewRequirements(model: ModelData & {
  textureFallbacks?: Array<{ fileName: string; filePath: string; isActive: boolean }>;
}, requirements: PreviewRequirement[]) {
  const saved = modelForPreview(model);
  const attachments = withSavedFbxTextures(model.modelType, (model.files ?? []).map(file => ({ ...file, relativePath: file.relativePath || file.fileName })), saved.textureFallbacks ?? []);
  return requirements.map(item => ({ ...item, satisfied: item.satisfied || (
    item.kind === 'texture' && attachments.some(file => file.filePath === resolveThreeDModelAttachmentUrl(item.relativePath, attachments))
  ) }));
}
