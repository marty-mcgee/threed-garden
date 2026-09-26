import { Matrix4, Mesh, Object3D, SkinnedMesh, Vector3 } from 'three';

export const MAX_ENVIRONMENT_SURFACE_TRIANGLES = 500_000;
export const MAX_ENVIRONMENT_SURFACE_VERTICES = 1_500_000;

export interface EnvironmentSurfaceCollider {
  vertices: Float32Array;
  indices: Uint32Array;
}

export interface EnvironmentSurfaceDiagnostic {
  reason: string;
  sourcePath?: string;
  triangleCount: number;
  vertexCount: number;
  triangleLimit: number;
  vertexLimit: number;
}

/** Bounded, static triangle geometry in the owning rigid body's local space. */
export function buildEnvironmentSurfaceCollider(root: Object3D, body: Object3D, onDiagnostic?: (diagnostic: EnvironmentSurfaceDiagnostic) => void): EnvironmentSurfaceCollider | null {
  root.updateWorldMatrix(true, true);
  const inverse = body.matrixWorld.clone().invert();
  const meshes: Mesh[] = [];
  let triangleCount = 0;
  let vertexCount = 0;
  let invalidReason = '';
  let invalidPath: string | undefined;
  const report = (reason: string, sourcePath?: string) => {
    onDiagnostic?.({ reason, sourcePath, triangleCount, vertexCount,
      triangleLimit: MAX_ENVIRONMENT_SURFACE_TRIANGLES, vertexLimit: MAX_ENVIRONMENT_SURFACE_VERTICES });
    return null;
  };
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const positions = object.geometry.getAttribute('position');
    const count = object.geometry.index?.count ?? positions?.count ?? 0;
    if (object instanceof SkinnedMesh || !positions || count % 3 || count < 3) {
      invalidReason = object instanceof SkinnedMesh ? 'skinned-mesh' : 'invalid-topology';
      invalidPath = object.name || object.uuid;
      return;
    }
    triangleCount += count / 3;
    vertexCount += positions.count;
    meshes.push(object);
  });
  if (invalidReason) return report(invalidReason, invalidPath);
  if (triangleCount === 0) return report('empty-geometry');
  if (triangleCount > MAX_ENVIRONMENT_SURFACE_TRIANGLES) return report('triangle-budget');
  if (vertexCount > MAX_ENVIRONMENT_SURFACE_VERTICES) return report('vertex-budget');
  // Allocate once: large non-indexed maps otherwise create enormous JS arrays
  // alongside their final typed buffers.
  const vertices = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(triangleCount * 3);
  let vertexOffset = 0;
  let indexOffset = 0;
  const points = [new Vector3(), new Vector3(), new Vector3()];
  const edge = new Vector3();
  const cross = new Vector3();
  const corners = [0, 0, 0];
  for (const mesh of meshes) {
    const transform = new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
    const positions = mesh.geometry.getAttribute('position');
    const index = mesh.geometry.index;
    const count = index?.count ?? positions.count;
    const start = vertexOffset / 3;
    // Preserve indexed sharing instead of allocating three vertices per triangle.
    for (let vertexIndex = 0; vertexIndex < positions.count; vertexIndex++) {
      const point = points[0];
      mesh.getVertexPosition(vertexIndex, point);
      point.applyMatrix4(transform);
      if (![point.x, point.y, point.z].every(value => Number.isFinite(value) && Math.abs(value) <= 1_000_000)) return report('invalid-coordinate', mesh.name || mesh.uuid);
      vertices[vertexOffset++] = point.x;
      vertices[vertexOffset++] = point.y;
      vertices[vertexOffset++] = point.z;
    }
    for (let offset = 0; offset < count; offset += 3) {
      for (let corner = 0; corner < 3; corner++) {
        const vertexIndex = index ? index.getX(offset + corner) : offset + corner;
        if (!Number.isInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= positions.count) return report('invalid-index', mesh.name || mesh.uuid);
        corners[corner] = start + vertexIndex;
        points[corner].fromArray(vertices, (start + vertexIndex) * 3);
      }
      edge.subVectors(points[1], points[0]);
      cross.subVectors(points[2], points[0]).cross(edge);
      if (cross.lengthSq() < 1e-16) continue;
      indices[indexOffset++] = corners[0];
      indices[indexOffset++] = corners[1];
      indices[indexOffset++] = corners[2];
    }
  }
  if (!indexOffset) return report('degenerate-geometry');
  report('ready');
  return { vertices, indices: indices.subarray(0, indexOffset) };
}
