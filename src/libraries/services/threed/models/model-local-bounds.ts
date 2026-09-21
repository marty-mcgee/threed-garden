import { Box3, Matrix4, Mesh, Object3D, Vector3 } from 'three';

/** Measure vertices in body space, without re-boxing a rotated world AABB. */
export function measureModelLocalBounds(root: Object3D, body: Object3D): Box3 {
  root.updateWorldMatrix(true, true);
  const inverseBodyWorld = body.matrixWorld.clone().invert();
  const box = new Box3();
  const vertex = new Vector3();
  const transform = new Matrix4();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const positions = object.geometry.getAttribute('position');
    if (!positions) return;
    transform.multiplyMatrices(inverseBodyWorld, object.matrixWorld);
    for (let index = 0; index < positions.count; index++) {
      object.getVertexPosition(index, vertex);
      vertex.applyMatrix4(transform);
      if ([vertex.x, vertex.y, vertex.z].every(Number.isFinite)) box.expandByPoint(vertex);
    }
  });
  return box;
}
