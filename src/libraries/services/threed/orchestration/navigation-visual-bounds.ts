import { Box3, type Object3D, type Mesh } from 'three';

// Read bounds without toggling Scene visibility or including selection helpers.
// Remains conservative visual clearance, not an exact collision-surface query.
export function navigationVisualBounds(root: Object3D, result: Box3, scratch: Box3): Box3 {
  result.makeEmpty();
  root.updateWorldMatrix(true, true);
  function visit(object: Object3D) {
    if (!object.visible || object.userData.navigationDecoration === true) return;
    const mesh = object as Mesh & { boundingBox?: Box3 | null; computeBoundingBox?: () => void };
    if (mesh.geometry) {
      // Skinned/instanced meshes supply object-level bounds; ordinary meshes
      // share geometry bounds. Follow Three.js Box3's default bounds behavior.
      if ('boundingBox' in mesh) {
        if (mesh.boundingBox === null) mesh.computeBoundingBox?.();
        if (mesh.boundingBox) result.union(scratch.copy(mesh.boundingBox).applyMatrix4(mesh.matrixWorld));
      } else {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) result.union(scratch.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
      }
    }
    for (const child of object.children) visit(child);
  }
  visit(root);
  return result;
}
