import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { withSavedFbxTextures } from '@/libraries/services/threed/models/model-saved-texture-fallback';
import { resolveThreeDModelAttachmentUrl } from '@/libraries/services/threed/models/model-attachment-runtime-core';
export interface PreviewRequirement { kind: string; relativePath: string; satisfied: boolean }
export function resolvePreviewRequirements(model: ModelData & {
  textureFallbacks?: Array<{ fileName: string; filePath: string; isActive: boolean }>;
}, requirements: PreviewRequirement[]) {
  const attachments = withSavedFbxTextures(model.modelType, (model.files ?? []).map(file => ({ ...file, relativePath: file.relativePath || file.fileName })), model.textureFallbacks ?? []);
  return requirements.map(item => ({ ...item, satisfied: item.satisfied || (
    item.kind === 'texture' && attachments.some(file => file.filePath === resolveThreeDModelAttachmentUrl(item.relativePath, attachments))
  ) }));
}
