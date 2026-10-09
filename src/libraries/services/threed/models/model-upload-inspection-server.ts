// @ts-expect-error Native offline validators require explicit extensions.
import { inspectThreeDGltfStructure, parseThreeDGlbJsonChunk } from './gltf-runtime-inspection-core.ts';

/** Structural inventory, not a claim of successful browser decoding or rendering. */
export async function inspectUploadedThreeDModel(file: File, modelType: string) {
  if (!['fbx', 'glb', 'gltf'].includes(modelType)) return {
    status: 'not_supported' as const, message: `${modelType.toUpperCase()} structural analysis is not available yet`,
  };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const fbxInspection = modelType === 'fbx'
    // @ts-expect-error Native offline validators require explicit extensions.
    ? (await import('./fbx-runtime-inspection-server.ts')).inspectThreeDFbxStructure(bytes.buffer, { offset: 0, limit: 12 }) : null;
  const inspection = fbxInspection ?? inspectThreeDGltfStructure(modelType === 'glb'
    ? parseThreeDGlbJsonChunk(bytes) : JSON.parse(new TextDecoder().decode(bytes)), { offset: 0, limit: 12 });
  return {
    status: 'analyzed' as const, geometryStatus: inspection.status, meshCount: inspection.meshCount,
    triangleCount: inspection.triangleCount, skinnedMeshCount: inspection.skinnedMeshCount,
    invalidMeshCount: inspection.invalidMeshCount, colliderEligible: inspection.colliderEligible,
    reasons: inspection.reasons, componentCount: inspection.sourceComponents.total,
    components: inspection.sourceComponents.items,
    ...(fbxInspection ? { materialTargets: fbxInspection.materialTargets } : {}),
  };
}
