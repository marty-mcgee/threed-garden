import { Euler, Vector3 } from 'three';
export interface ModelPlanImage {
  id: string;
  url: string;
  // Three projected corners in Scene units: image top-left, top-right, bottom-left.
  corners: [{ x: number; z: number }, { x: number; z: number }, { x: number; z: number }];
}

/** Bounds already include the Model's visual scale and authored transforms, in body-local Scene units. */
export function modelPlanImage(id: string, url: unknown, bounds: { center: [number,number,number]; halfExtents: [number,number,number] }, position: [number,number,number], rotation: [number,number,number]): ModelPlanImage | null {
  if (typeof url !== 'string' || !url.startsWith('https://')) return null;
  if (![...bounds.center, ...bounds.halfExtents, ...position, ...rotation].every(Number.isFinite) || bounds.halfExtents.some(value => value <= 0)) return null;
  const [x,y,z] = bounds.center, [w,,d] = bounds.halfExtents;
  const euler = new Euler(...rotation);
  const corners = [[x-w,y,z-d],[x+w,y,z-d],[x-w,y,z+d]].map(point => {
    const p = new Vector3(...point as [number,number,number]).applyEuler(euler);
    return { x: p.x + position[0], z: p.z + position[2] };
  }) as ModelPlanImage['corners'];
  return { id, url, corners };
}
