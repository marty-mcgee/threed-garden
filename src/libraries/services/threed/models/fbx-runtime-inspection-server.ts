import 'server-only';

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import {
  assessThreeDEnvironmentGeometry,
  createThreeDEnvironmentMeshInventory,
  createThreeDModelSourceComponentPage,
  type ThreeDModelSourceComponentPageOptions,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './environment-collision-core.ts';
import {
  createThreeDModelMaterialInventory,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './model-material-inventory-core.ts';
import type { ThreeDGltfRuntimeInspection } from './gltf-runtime-inspection-core';

export interface ThreeDFbxRuntimeInspection extends ThreeDGltfRuntimeInspection {
  materialTargets: {
    targetKeys: string[];
    materialSlotCount: number;
    omittedSlotCount: number;
  };
}

class InertTextureLoader {
  setPath() { return this; }
  setCrossOrigin() { return this; }
  load(_url: string, onLoad?: (texture: THREE.Texture) => void): THREE.Texture {
    const texture = new THREE.Texture();
    onLoad?.(texture);
    return texture;
  }
}

/** Parses FBX structure without a DOM, renderer, or texture/attachment fetches. */
export function inspectThreeDFbxStructure(
  bytes: ArrayBuffer,
  componentPage: ThreeDModelSourceComponentPageOptions = { offset: 0, limit: 100 },
): ThreeDFbxRuntimeInspection {
  const manager = new THREE.LoadingManager();
  manager.addHandler(/.*/, new InertTextureLoader() as unknown as THREE.Loader);
  const object = new FBXLoader(manager).parse(bytes, '');
  object.updateWorldMatrix(true, true);

  let meshCount = 0;
  let triangleCount = 0;
  let skinnedMeshCount = 0;
  let invalidMeshCount = 0;
  const inventory: Array<{ path: string; type: string; triangleCount: number }> = [];
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    meshCount += 1;
    if (child instanceof THREE.SkinnedMesh) skinnedMeshCount += 1;
    const positionAttribute = child.geometry?.getAttribute('position');
    const elementCount = child.geometry?.index?.count ?? positionAttribute?.count ?? 0;
    const valid = Boolean(positionAttribute)
      && Number.isSafeInteger(elementCount)
      && elementCount >= 3
      && elementCount % 3 === 0;
    const meshTriangleCount = valid ? elementCount / 3 : 0;
    if (!valid) invalidMeshCount += 1;
    triangleCount += meshTriangleCount;
    const pathSegments: string[] = [];
    let current: THREE.Object3D | null = child;
    while (current && current !== object) {
      pathSegments.unshift(current.name || current.type);
      current = current.parent;
    }
    inventory.push({
      path: pathSegments.join('/'),
      type: child.type,
      triangleCount: meshTriangleCount,
    });
  });

  const bounds = new THREE.Box3().setFromObject(object, true);
  const boundsValues = [
    bounds.min.x, bounds.min.y, bounds.min.z,
    bounds.max.x, bounds.max.y, bounds.max.z,
  ];
  const auditInput = {
    meshCount,
    triangleCount,
    skinnedMeshCount,
    invalidMeshCount,
    hasFiniteBounds: !bounds.isEmpty() && boundsValues.every(Number.isFinite),
  };
  const materials = createThreeDModelMaterialInventory(object);
  return {
    ...auditInput,
    ...assessThreeDEnvironmentGeometry(auditInput),
    meshInventory: createThreeDEnvironmentMeshInventory(inventory),
    sourceComponents: createThreeDModelSourceComponentPage(inventory, componentPage),
    materialTargets: {
      targetKeys: materials.slots.map((slot) => slot.id),
      materialSlotCount: materials.materialSlotCount,
      omittedSlotCount: materials.omittedSlotCount,
    },
  };
}
