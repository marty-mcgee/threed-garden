import { Euler, Vector3 } from 'three';
export interface ModelPlanImage {
  id: string;
  url: string | null;
  name?: string;
  // Three projected corners in Scene units: image top-left, top-right, bottom-left.
  corners: [{ x: number; z: number }, { x: number; z: number }, { x: number; z: number }];
}

/** Bounds already include the Model's visual scale and authored transforms, in body-local Scene units. */
export function modelPlanImage(id: string, url: unknown, bounds: {
  center: [number, number, number];
  halfExtents: [number, number, number];
}, position: [number, number, number], rotation: [number, number, number], name?: string, generatedImage?: string): ModelPlanImage | null {
  if (![...bounds.center, ...bounds.halfExtents, ...position, ...rotation].every(Number.isFinite) || bounds.halfExtents.some(value => value <= 0)) return null;
  const [x,y,z] = bounds.center, [w,,d] = bounds.halfExtents;
  const euler = new Euler(...rotation);
  let corners = [[x-w,y,z-d],[x+w,y,z-d],[x-w,y,z+d]].map(point => {
    const p = new Vector3(...point as [number,number,number]).applyEuler(euler);
    return {
      x: p.x + position[0],
      z: p.z + position[2],
    };
  }) as ModelPlanImage['corners'];
  let imageUrl = typeof url === 'string' && url.startsWith('https://') ? url : null;
  if (!imageUrl && generatedImage && generatedImage.length <= 1500000 && /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(generatedImage)) imageUrl = generatedImage;
  const [a, b, c] = corners;
  if (Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) < 1e-8) {
    // A top image viewed edge-on has no clickable area. Project the full box
    // instead; the original measured height supplies the missing plan extent.
    const projected = [-1, 1].flatMap(sx => [-1, 1].flatMap(sy => [-1, 1].map(sz =>
      new Vector3(x + sx * w, y + sy * bounds.halfExtents[1], z + sz * d).applyEuler(euler))));
    const minX = Math.min(...projected.map(point => point.x)) + position[0];
    const maxX = Math.max(...projected.map(point => point.x)) + position[0];
    const minZ = Math.min(...projected.map(point => point.z)) + position[2];
    const maxZ = Math.max(...projected.map(point => point.z)) + position[2];
    corners = [
      {
        x: minX,
        z: minZ,
      },
      {
        x: maxX,
        z: minZ,
      },
      {
        x: minX,
        z: maxZ,
      },
    ];
    imageUrl = null;
  }
  if (!corners.every(point => Number.isFinite(point.x) && Number.isFinite(point.z))) return null;
  return {
    id,
    url: imageUrl,
    name,
    corners,
  };
}
