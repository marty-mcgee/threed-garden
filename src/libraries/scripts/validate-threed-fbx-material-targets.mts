import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import {
  createThreeDModelMaterialInventory,
  resolveThreeDModelMaterialTarget,
  THREED_MODEL_MATERIAL_INVENTORY_LIMIT,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-material-inventory-core.ts';

// Match Next's server-only alias while running this server inspector in plain Node.
// This validator imports no API routes, storage clients, credentials or database code.
register(`data:text/javascript,${encodeURIComponent(`
  export function resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === 'server-only'
      ? ${JSON.stringify(import.meta.resolve('next/dist/compiled/server-only/empty.js'))}
      : specifier, context);
  }
`)}`, import.meta.url);
const {
  inspectThreeDFbxStructure,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} = await import('../services/threed/models/fbx-runtime-inspection-server.ts');

let groups = 0;
function group(label: string, run: () => void) {
  run();
  groups += 1;
  console.log(`  ✓ ${label}`);
}

function assertPreviewParity(root: THREE.Group, result: ReturnType<typeof inspectThreeDFbxStructure>) {
  // ModelMarker3D clones cached FBX roots and applies transforms without changing traversal.
  const previewRoot = root.clone();
  previewRoot.scale.setScalar(0.01);
  previewRoot.rotation.y = Math.PI / 3;
  previewRoot.position.set(2, 3, 4);
  const inventory = createThreeDModelMaterialInventory(previewRoot);
  assert.deepEqual(result.materialTargets, {
    targetKeys: inventory.slots.map((slot) => slot.id),
    materialSlotCount: inventory.materialSlotCount,
    omittedSlotCount: inventory.omittedSlotCount,
  });
  for (const key of result.materialTargets.targetKeys) {
    const resolved = resolveThreeDModelMaterialTarget(previewRoot, key);
    assert.ok(resolved, `${key} must resolve on the preview root`);
    const materials = Array.isArray(resolved.mesh.material) ? resolved.mesh.material : [resolved.mesh.material];
    assert.ok(materials[resolved.slotIndex] instanceof THREE.Material);
  }
}

function inspectObjectFixture(root: THREE.Group) {
  const originalParse = FBXLoader.prototype.parse;
  let parseCalls = 0;
  FBXLoader.prototype.parse = () => { parseCalls += 1; return root };
  try {
    const result = inspectThreeDFbxStructure(new ArrayBuffer(0));
    assert.equal(parseCalls, 1);
    assertPreviewParity(root, result);
    return result;
  } finally {
    FBXLoader.prototype.parse = originalParse;
  }
}

function triangleGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  return geometry;
}

console.log('\nThreeD FBX material target validation');
console.log('─'.repeat(44));

const asset = await readFile(new URL('../../../public/assets/animations/farming/SK_Chr_Farmer_Male_01.fbx', import.meta.url));
const bytes = asset.buffer.slice(asset.byteOffset, asset.byteOffset + asset.byteLength);

group('tracked Farmer FBX parses once without texture fetches and matches preview material targets', () => {
  const originalParse = FBXLoader.prototype.parse;
  const originalFetch = globalThis.fetch;
  let parsedRoot: THREE.Group | undefined;
  let parseCalls = 0;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls += 1; throw new Error('Unexpected network request') };
  FBXLoader.prototype.parse = function (buffer, path) {
    parseCalls += 1;
    parsedRoot = originalParse.call(this, buffer, path);
    return parsedRoot;
  };
  try {
    const result = inspectThreeDFbxStructure(bytes, { offset: 0, limit: 12 });
    assert.equal(parseCalls, 1);
    assert.equal(networkCalls, 0);
    assert.ok(parsedRoot);
    assert.ok(result.skinnedMeshCount > 0, 'The existing Farmer fixture must exercise skinned meshes');
    assert.ok(result.materialTargets.materialSlotCount > 0);
    assert.equal(result.materialTargets.omittedSlotCount, 0);
    assertPreviewParity(parsedRoot, result);
  } finally {
    FBXLoader.prototype.parse = originalParse;
    globalThis.fetch = originalFetch;
  }
});

const root = new THREE.Group();
const nested = new THREE.Group();
nested.name = 'Nested';
root.add(new THREE.Object3D(), nested);
const sharedMaterial = new THREE.MeshStandardMaterial({ color: '#008800' });
const multiple = new THREE.Mesh(triangleGeometry(), [sharedMaterial, new THREE.MeshStandardMaterial()]);
multiple.name = 'Multiple materials';
nested.add(new THREE.Object3D(), multiple);
const skinGeometry = triangleGeometry();
skinGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Array(12).fill(0), 4));
skinGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4));
const skinned = new THREE.SkinnedMesh(skinGeometry, sharedMaterial);
const bone = new THREE.Bone();
skinned.add(bone);
skinned.bind(new THREE.Skeleton([bone]));
root.add(skinned);

group('nested non-Mesh nodes, material arrays, shared materials and skinned meshes keep canonical keys', () => {
  const result = inspectObjectFixture(root);
  assert.equal(result.meshCount, 2);
  assert.equal(result.skinnedMeshCount, 1);
  assert.deepEqual(result.materialTargets, {
    targetKeys: ['mesh:0:material:0', 'mesh:0:material:1', 'mesh:1:material:0'],
    materialSlotCount: 3,
    omittedSlotCount: 0,
  });
});

group('the 500-slot inventory reports omitted slots without inventing assignment targets', () => {
  root.add(new THREE.Mesh(triangleGeometry(), new Array<THREE.Material>(501).fill(sharedMaterial)));
  const result = inspectObjectFixture(root);
  assert.equal(THREED_MODEL_MATERIAL_INVENTORY_LIMIT, 500);
  assert.equal(result.materialTargets.targetKeys.length, 500);
  assert.equal(result.materialTargets.materialSlotCount, 504);
  assert.equal(result.materialTargets.omittedSlotCount, 4);
  assert.equal(result.materialTargets.targetKeys.at(-1), 'mesh:2:material:496');
  assert.ok(!result.materialTargets.targetKeys.includes('mesh:2:material:497'));
});

group('an FBX root with no material slots exposes an empty inventory', () => {
  const empty = new THREE.Group();
  empty.add(new THREE.Object3D());
  assert.deepEqual(inspectObjectFixture(empty).materialTargets, {
    targetKeys: [], materialSlotCount: 0, omittedSlotCount: 0,
  });
});

console.log('─'.repeat(44));
console.log(`PASS  ${groups} validation groups completed`);
