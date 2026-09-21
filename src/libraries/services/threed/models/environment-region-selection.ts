/** Pure selection policy; region bounds and actor positions share body-local space. */
export interface CollisionRegion {
  id: string;
  min: readonly [number, number, number];
  max: readonly [number, number, number];
  triangleCount: number;
}
export interface CollisionActor {
  position: readonly [number, number, number];
  speed: number;
}
export interface CollisionRegionSelection {
  activeIds: string[];
  deferredIds: string[];
  triangleCount: number;
}
function distanceSquared(region: CollisionRegion, point: readonly number[]): number {
  return point.reduce((sum, value, axis) => {
    const delta = Math.max(region.min[axis] - value, 0, value - region.max[axis]);
    return sum + delta * delta;
  }, 0);
}
export function selectEnvironmentCollisionRegions(
  regions: readonly CollisionRegion[], actors: readonly CollisionActor[], previousIds: ReadonlySet<string>,
  options = { radius: 12, retentionMargin: 6, predictionSeconds: 1, maxTriangles: 100_000, maxRegions: 64 },
): CollisionRegionSelection {
  if (!Object.values(options).every(Number.isFinite) || options.radius < 0 || options.retentionMargin < 0 || options.predictionSeconds < 0
    || !Number.isInteger(options.maxTriangles) || options.maxTriangles < 0 || !Number.isInteger(options.maxRegions) || options.maxRegions < 0) throw new Error('Invalid collision selection limits');
  const validActors = actors.filter(actor => actor.position.length === 3 && actor.position.every(Number.isFinite) && Number.isFinite(actor.speed) && actor.speed >= 0);
  const candidates = regions.flatMap(region => {
    if (region.min.length !== 3 || region.max.length !== 3 || !region.min.every(Number.isFinite) || !region.max.every(Number.isFinite)
      || region.min.some((value, axis) => value > region.max[axis]) || !Number.isInteger(region.triangleCount) || region.triangleCount <= 0) return [];
    let nearest = Infinity;
    let eligible = false;
    for (const actor of validActors) {
      const distance = distanceSquared(region, actor.position);
      nearest = Math.min(nearest, distance);
      const radius = options.radius + actor.speed * options.predictionSeconds + (previousIds.has(region.id) ? options.retentionMargin : 0);
      if (distance <= radius * radius) eligible = true;
    }
    return eligible ? [{ region, distance: nearest }] : [];
  }).sort((a,b) => a.distance - b.distance || Number(previousIds.has(b.region.id)) - Number(previousIds.has(a.region.id)) || a.region.id.localeCompare(b.region.id));
  const result: CollisionRegionSelection = { activeIds: [], deferredIds: [], triangleCount: 0 };
  const seen = new Set<string>();
  for (const { region } of candidates) {
    if (seen.has(region.id)) continue;
    seen.add(region.id);
    if (result.activeIds.length >= options.maxRegions || result.triangleCount + region.triangleCount > options.maxTriangles) result.deferredIds.push(region.id);
    else { result.activeIds.push(region.id); result.triangleCount += region.triangleCount; }
  }
  return result;
}
