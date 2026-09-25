import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  observeThreeDModelMaterialInventory,
  type ThreeDModelMaterialInventory,
// @ts-expect-error Native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-material-inventory-core.ts';

const pause = () => new Promise(resolve => setTimeout(resolve, 300));
const root = new THREE.Group();
const texture = new THREE.Texture();
const material = new THREE.MeshStandardMaterial({map:texture});
root.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
const snapshots: ThreeDModelMaterialInventory[] = [];
let stop = observeThreeDModelMaterialInventory(root, value => snapshots.push(value));
try {
  assert.equal(snapshots[0].slots[0].textures[0].ready, false);
  await pause();
  assert.equal(snapshots.length, 1, 'Unchanged missing images do not spam updates');
  // Model clones retain the same texture source; image completion changes it in place.
  texture.image = {width:64,height:32};
  await pause();
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[1].slots[0].textures[0].ready, true);
  assert.equal(snapshots[1].slots[0].textures[0].width, 64);
  texture.image = undefined;
  await pause();
  assert.equal(snapshots.length, 2, 'Observer stops after readiness');
  stop();
  const late: ThreeDModelMaterialInventory[] = [];
  stop = observeThreeDModelMaterialInventory(root, value => late.push(value));
  stop();
  texture.image = {width:64,height:32};
  await pause();
  assert.equal(late.length, 1, 'Unmount/switch prevents late callbacks');
  assert.equal(late[0].slots[0].textures[0].ready, false);
  const cached: ThreeDModelMaterialInventory[] = [];
  stop = observeThreeDModelMaterialInventory(root.clone(), value => cached.push(value));
  assert.equal(cached[0].slots[0].textures[0].ready, true);
  console.log('PASS: delayed texture readiness, cached textures, missing-image guard, deduplicated updates and cleanup');
} finally {
  stop();
  texture.dispose();
  material.dispose();
  root.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
}
