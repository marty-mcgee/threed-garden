import { Matrix4, Mesh, Object3D, SkinnedMesh, Vector3 } from 'three';

export interface EnvironmentSurfaceCollider {
  vertices: Float32Array;
  indices: Uint32Array;
}

/** Bounded, static triangle geometry in the owning rigid body's local space. */
export function buildEnvironmentSurfaceCollider(root: Object3D, body: Object3D): EnvironmentSurfaceCollider | null {
  root.updateWorldMatrix(true, true);
  const inverse = body.matrixWorld.clone().invert();
  const meshes: Mesh[] = [];
  let triangleCount = 0;
  let invalid = false;
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const positions = object.geometry.getAttribute('position');
    const count = object.geometry.index?.count ?? positions?.count ?? 0;
    if (object instanceof SkinnedMesh || !positions || count % 3 || count < 3) {
      invalid = true;
      return;
    }
    triangleCount += count / 3;
    meshes.push(object);
  });
  if (invalid || triangleCount === 0 || triangleCount > 50_000) return null;
  const vertices: number[] = [];
  const indices: number[] = [];
  const points = [new Vector3(), new Vector3(), new Vector3()];
  const edge = new Vector3();
  const cross = new Vector3();
  for (const mesh of meshes) {
    const transform = new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
    const positions = mesh.geometry.getAttribute('position');
    const index = mesh.geometry.index;
    const count = index?.count ?? positions.count;
    for (let offset = 0; offset < count; offset += 3) {
      for (let corner = 0; corner < 3; corner++) {
        const vertexIndex = index ? index.getX(offset + corner) : offset + corner;
        if (!Number.isInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= positions.count) return null;
        mesh.getVertexPosition(vertexIndex, points[corner]);
        points[corner].applyMatrix4(transform);
        if (!points[corner].toArray().every(value => Number.isFinite(value) && Math.abs(value) <= 1_000_000)) return null;
      }
      edge.subVectors(points[1], points[0]);
      cross.subVectors(points[2], points[0]).cross(edge);
      if (cross.lengthSq() < 1e-16) continue;
      const start = vertices.length / 3;
      for (const point of points) vertices.push(point.x, point.y, point.z);
      indices.push(start, start + 1, start + 2);
    }
  }
  return indices.length ? { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) } : null;
}
