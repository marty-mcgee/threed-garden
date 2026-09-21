import {
  assessThreeDEnvironmentGeometry,
  createThreeDEnvironmentMeshInventory,
  createThreeDModelSourceComponentPage,
  type ThreeDEnvironmentMeshInventory,
  type ThreeDModelSourceComponentPage,
  type ThreeDModelSourceComponentPageOptions,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './environment-collision-core.ts';

const MAX_GLTF_NODES = 100_000;

type JsonRecord = Record<string, unknown>;

export interface ThreeDGltfRuntimeInspection {
  meshCount: number;
  triangleCount: number;
  skinnedMeshCount: number;
  invalidMeshCount: number;
  status: ReturnType<typeof assessThreeDEnvironmentGeometry>['status'];
  colliderEligible: boolean;
  reasons: string[];
  meshInventory: ThreeDEnvironmentMeshInventory;
  sourceComponents: ThreeDModelSourceComponentPage;
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function readIndex(value: unknown, length: number): number | null {
  const index = Number(value);
  return Number.isSafeInteger(index) && index >= 0 && index < length ? index : null;
}

/** Reads only declarative glTF structure; it never decodes or copies geometry buffers. */
export function inspectThreeDGltfStructure(
  document: unknown,
  componentPage: ThreeDModelSourceComponentPageOptions = { offset: 0, limit: 100 },
): ThreeDGltfRuntimeInspection {
  const root = asRecord(document);
  if (!root) throw new Error('Invalid glTF document');
  const nodes = Array.isArray(root.nodes) ? root.nodes : [];
  const meshes = Array.isArray(root.meshes) ? root.meshes : [];
  const accessors = Array.isArray(root.accessors) ? root.accessors : [];
  const scenes = Array.isArray(root.scenes) ? root.scenes : [];
  if (nodes.length > MAX_GLTF_NODES) throw new Error('glTF node count exceeds inspection limit');

  const defaultSceneIndex = readIndex(root.scene, scenes.length) ?? (scenes.length > 0 ? 0 : null);
  const defaultScene = defaultSceneIndex === null ? null : asRecord(scenes[defaultSceneIndex]);
  const rootNodeIndexes = Array.isArray(defaultScene?.nodes)
    ? defaultScene.nodes.map((value) => readIndex(value, nodes.length)).filter((value): value is number => value !== null)
    : nodes.map((_, index) => index);

  let meshCount = 0;
  let triangleCount = 0;
  let skinnedMeshCount = 0;
  let invalidMeshCount = 0;
  const inventory: Array<{ path: string; type: string; triangleCount: number }> = [];
  const visited = new Set<number>();

  const visit = (nodeIndex: number, parentPath: string, activePath: Set<number>) => {
    if (activePath.has(nodeIndex) || visited.size >= MAX_GLTF_NODES) return;
    const node = asRecord(nodes[nodeIndex]);
    if (!node) return;
    visited.add(nodeIndex);
    const nodeName = typeof node.name === 'string' && node.name.trim()
      ? node.name.trim()
      : `Node-${nodeIndex}`;
    const path = parentPath ? `${parentPath}/${nodeName}` : nodeName;
    const meshIndex = readIndex(node.mesh, meshes.length);
    const mesh = meshIndex === null ? null : asRecord(meshes[meshIndex]);
    const primitives = Array.isArray(mesh?.primitives) ? mesh.primitives : [];
    for (let primitiveIndex = 0; primitiveIndex < primitives.length; primitiveIndex += 1) {
      const primitive = asRecord(primitives[primitiveIndex]);
      const attributes = asRecord(primitive?.attributes);
      const indexAccessor = primitive ? readIndex(primitive.indices, accessors.length) : null;
      const positionAccessor = attributes ? readIndex(attributes.POSITION, accessors.length) : null;
      const accessor = asRecord(accessors[indexAccessor ?? positionAccessor ?? -1]);
      const elementCount = Number(accessor?.count);
      const valid = Number.isSafeInteger(elementCount) && elementCount >= 3 && elementCount % 3 === 0;
      const primitiveTriangles = valid ? elementCount / 3 : 0;
      meshCount += 1;
      if (node.skin !== undefined) skinnedMeshCount += 1;
      if (!valid) invalidMeshCount += 1;
      triangleCount += primitiveTriangles;
      const meshName = typeof mesh?.name === 'string' && mesh.name.trim()
        ? mesh.name.trim()
        : `Mesh-${meshIndex ?? 'invalid'}`;
      inventory.push({
        path: `${path}/${meshName}/Primitive-${primitiveIndex}`,
        type: node.skin !== undefined ? 'SkinnedMesh' : 'Mesh',
        triangleCount: primitiveTriangles,
      });
    }

    const nextActivePath = new Set(activePath).add(nodeIndex);
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const childIndex = readIndex(child, nodes.length);
        if (childIndex !== null) visit(childIndex, path, nextActivePath);
      }
    }
  };

  for (const nodeIndex of rootNodeIndexes) visit(nodeIndex, '', new Set());
  const auditInput = {
    meshCount,
    triangleCount,
    skinnedMeshCount,
    invalidMeshCount,
    hasFiniteBounds: true,
  };
  return {
    ...auditInput,
    ...assessThreeDEnvironmentGeometry(auditInput),
    meshInventory: createThreeDEnvironmentMeshInventory(inventory),
    sourceComponents: createThreeDModelSourceComponentPage(inventory, componentPage),
  };
}

export function parseThreeDGlbJsonChunk(bytes: Uint8Array): unknown {
  if (bytes.byteLength < 20) throw new Error('GLB header is incomplete');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error('Invalid GLB magic');
  if (view.getUint32(4, true) !== 2) throw new Error('Unsupported GLB version');
  const declaredLength = view.getUint32(8, true);
  const jsonLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);
  if (chunkType !== 0x4e4f534a) throw new Error('GLB first chunk is not JSON');
  if (jsonLength <= 0 || 20 + jsonLength > bytes.byteLength || declaredLength < 20 + jsonLength) {
    throw new Error('GLB JSON chunk is incomplete');
  }
  const json = new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)).replace(/\u0000+$/g, '');
  return JSON.parse(json);
}
