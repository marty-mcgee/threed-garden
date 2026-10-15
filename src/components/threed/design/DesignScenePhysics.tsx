'use client';

import { useMemo } from 'react';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { Mesh, Vector3 } from 'three';
import { DesignGeometryCache } from '@/libraries/services/threed/design/geometry';
import type { DesignDocument } from '@/libraries/services/threed/design/document';
import { sceneUnitsPerMetre } from '@/libraries/services/threed/scene-units';

/** Fixed surfaces use the same triangulated solids as the renderer, including apertures. */
export function buildDesignColliders(document: DesignDocument, metersPerSceneUnit: number) {
  const scale = sceneUnitsPerMetre(metersPerSceneUnit);
  const owner = new DesignGeometryCache();
  const result: { id: string; vertices: Float32Array; indices: Uint32Array }[] = [];
  try {
    owner.update(document, null);
    owner.group.updateMatrixWorld(true);
    const point = new Vector3();
    owner.group.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const geometry = object.geometry;
      const positions = geometry.getAttribute('position');
      if (!positions?.count) return;
      const vertices = new Float32Array(positions.count * 3);
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).multiplyScalar(scale);
        point.toArray(vertices, i * 3);
      }
      const indices = geometry.index ? Uint32Array.from(geometry.index.array) : Uint32Array.from({ length: positions.count }, (_, i) => i);
      result.push({ id: `${object.userData.designEntityId}:${result.length}`, vertices, indices });
    });
    return result;
  } finally { owner.dispose(); }
}

export function DesignScenePhysics({ document, projectId, metersPerSceneUnit }: {
  document: DesignDocument; projectId: number; metersPerSceneUnit: number;
}) {
  const colliders = useMemo(() => buildDesignColliders(document, metersPerSceneUnit), [document, metersPerSceneUnit]);
  // Layer/level visibility is presentation only: hidden architecture remains solid.
  return <RigidBody key={projectId} type="fixed" colliders={false} name={`project:${projectId}:architecture-physics`}>
    {colliders.map(collider => <TrimeshCollider key={collider.id} args={[collider.vertices, collider.indices]} />)}
  </RigidBody>;
}
