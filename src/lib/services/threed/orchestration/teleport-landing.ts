import type { RapierCollider, RapierContext, RapierRigidBody } from '@react-three/rapier';
import type { Box3 } from 'three';

type Position = { x: number; y: number; z: number };

// Bounded, on-demand queries against the current physics world, not visual-only clearance.
export function findCharacterLanding({ world, rapier, body, bounds, targetColliders, radius, halfHeight, floatHeight }: {
  world: RapierContext['world']; rapier: RapierContext['rapier']; body: RapierRigidBody;
  bounds: Box3; targetColliders: readonly RapierCollider[]; radius: number; halfHeight: number; floatHeight: number;
}): Position | null {
  const origin = body.translation();
  if (bounds.isEmpty() || ![...Object.values(origin), bounds.min.x, bounds.min.y, bounds.min.z,
    bounds.max.x, bounds.max.y, bounds.max.z, radius, halfHeight, floatHeight].every(Number.isFinite)
    || radius <= 0 || halfHeight <= 0 || floatHeight < 0) return null;
  const surfaces: { point: Position; dx: number; dz: number }[] = [];
  // Bound work for compound targets. Visual bounds only put probes outside the
  // object; the actual collider projection determines the landing edge.
  const colliders = targetColliders.filter(collider => collider.isEnabled() && !collider.isSensor())
    .map(collider => ({ collider, center: collider.translation() }))
    .sort((a, b) => Math.hypot(a.center.x - origin.x, a.center.z - origin.z) - Math.hypot(b.center.x - origin.x, b.center.z - origin.z))
    .slice(0, 16);
  for (const { collider, center } of colliders) {
    const reach = Math.max(Math.abs(bounds.min.x - center.x), Math.abs(bounds.max.x - center.x),
      Math.abs(bounds.min.z - center.z), Math.abs(bounds.max.z - center.z)) * 2 + 2;
    const facing = Math.atan2(origin.z - center.z, origin.x - center.x);
    for (let i = 0; i < 17; i++) {
      const angle = i === 0 ? facing : (i - 1) * Math.PI / 8;
      const probe = { x: center.x + Math.cos(angle) * reach, y: center.y, z: center.z + Math.sin(angle) * reach };
      const projection = collider.projectPoint(probe, true);
      if (!projection || projection.isInside) continue;
      const dx = probe.x - projection.point.x, dz = probe.z - projection.point.z;
      const length = Math.hypot(dx, dz);
      if (!Number.isFinite(length) || length < 0.0001) continue;
      surfaces.push({ point: projection.point, dx: dx / length, dz: dz / length });
    }
  }
  // Exhaust the closest clearance before trying farther rings, rather than
  // letting distance from the actor prefer the outermost ring every time.
  const candidates = [0.1, 0.35, 0.75].flatMap(gap => surfaces.map(({ point, dx, dz }) => ({
    x: point.x + dx * (radius + gap), y: bounds.min.y, z: point.z + dz * (radius + gap),
  })).sort((a, b) => Math.hypot(a.x - origin.x, a.z - origin.z) - Math.hypot(b.x - origin.x, b.z - origin.z)));
  const flags = rapier.QueryFilterFlags;
  const groundFlags = flags.EXCLUDE_SENSORS | flags.EXCLUDE_DYNAMIC | flags.EXCLUDE_KINEMATIC;
  const capsule = new rapier.Capsule(halfHeight, radius);
  const rotation = { x: 0, y: 0, z: 0, w: 1 };
  for (const candidate of candidates) {
    const heights: number[] = [];
    for (const [dx, dz] of [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius]]) {
      const ray = new rapier.Ray({ x: candidate.x + dx, y: bounds.min.y + 1.5, z: candidate.z + dz }, { x: 0, y: -1, z: 0 });
      const hit = world.castRayAndGetNormal(ray, 5, false, groundFlags, undefined, undefined, body);
      if (!hit) break;
      // InteractiveGround's rotated Plane becomes a zero-depth cuboid. Its two
      // faces coincide, so Rapier may return the downward normal from above.
      // Only that planar case is two-sided; never accept a solid's underside.
      const shape = hit.collider.shape;
      const planar = shape instanceof rapier.Cuboid
        && [shape.halfExtents.x, shape.halfExtents.y, shape.halfExtents.z].filter(extent => extent === 0).length === 1;
      const upwardNormal = planar ? Math.abs(hit.normal.y) : hit.normal.y;
      if (upwardNormal < Math.cos(Math.PI / 6)) break;
      const height = ray.origin.y - hit.timeOfImpact;
      if (!Number.isFinite(height) || height > bounds.min.y + 0.75) break;
      heights.push(height);
    }
    if (heights.length !== 5 || Math.max(...heights) - Math.min(...heights) > 0.2) continue;
    const landing = { ...candidate, y: Math.max(...heights) + halfHeight + radius + floatHeight + 0.05 };
    // Also reject deep containment: Rapier's capsule overlap can miss certain
    // fully enclosed configurations near symmetric box corners.
    let enclosed = false;
    world.intersectionsWithPoint(landing, () => { enclosed = true; return false; }, flags.EXCLUDE_SENSORS, undefined, undefined, body);
    if (enclosed) continue;
    if (!world.intersectionWithShape(landing, rotation, capsule, flags.EXCLUDE_SENSORS, undefined, undefined, body)) return landing;
  }
  return null;
}
