import type {
  ThreeDEnvironmentCollisionPreviewBox,
  ThreeDEnvironmentCollisionPreviewPlan,
} from './environment-collision-preview-core';

// Fifth controlled activation gate. Increase only after the complete
// Character/Environment manual regression passes at this exact limit.
export const MAX_ACTIVE_ENVIRONMENT_CUBOID_COLLIDERS = 1_024;
export const MAX_ACTIVE_ENVIRONMENT_CUBOID_SPAN = 128;

export interface ThreeDEnvironmentColliderPriorityPoint {
  x: number;
  y: number;
  z: number;
}

export interface ThreeDEnvironmentColliderExclusionBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface ThreeDEnvironmentColliderActivationPlan {
  plannedBoxCount: number;
  activeColliderCount: number;
  deferredColliderCount: number;
  spawnOverlapDeferredCount: number;
  oversizedDeferredCount: number;
  capacityDeferredCount: number;
  priorityPointCount: number;
  boxes: ThreeDEnvironmentCollisionPreviewBox[];
}

function intersectsExclusion(
  box: ThreeDEnvironmentCollisionPreviewBox,
  exclusion: ThreeDEnvironmentColliderExclusionBounds,
): boolean {
  for (let axis = 0; axis < 3; axis += 1) {
    const boxMin = box.center[axis] - box.halfExtents[axis];
    const boxMax = box.center[axis] + box.halfExtents[axis];
    if (boxMax < exclusion.min[axis] || boxMin > exclusion.max[axis]) return false;
  }
  return true;
}

function isOversized(box: ThreeDEnvironmentCollisionPreviewBox): boolean {
  return box.halfExtents.some(
    (halfExtent) => halfExtent * 2 > MAX_ACTIVE_ENVIRONMENT_CUBOID_SPAN,
  );
}

function squaredDistanceToBox(
  box: ThreeDEnvironmentCollisionPreviewBox,
  point: ThreeDEnvironmentColliderPriorityPoint,
): number {
  const coordinates = [point.x, point.y, point.z];
  let distance = 0;
  for (let axis = 0; axis < 3; axis += 1) {
    const delta = Math.max(
      Math.abs(coordinates[axis] - box.center[axis]) - box.halfExtents[axis],
      0,
    );
    distance += delta * delta;
  }
  return distance;
}

/**
 * Selects a bounded prefix from the already spatially balanced preview plan.
 * This function creates descriptions only; the Scene marker owner creates Rapier objects.
 */
export function createThreeDEnvironmentColliderActivationPlan(
  preview: ThreeDEnvironmentCollisionPreviewPlan | null,
  exclusions: readonly ThreeDEnvironmentColliderExclusionBounds[] = [],
  priorityPoints: readonly ThreeDEnvironmentColliderPriorityPoint[] = [],
): ThreeDEnvironmentColliderActivationPlan {
  let spawnOverlapDeferredCount = 0;
  let oversizedDeferredCount = 0;
  const safeBoxes = (preview?.boxes ?? []).filter((box) => {
    if (!exclusions.some((exclusion) => intersectsExclusion(box, exclusion))) return true;
    spawnOverlapDeferredCount += 1;
    return false;
  }).filter((box) => {
    if (!isOversized(box)) return true;
    oversizedDeferredCount += 1;
    return false;
  });
  const validPriorityPoints = priorityPoints.filter(
    (point) => [point.x, point.y, point.z].every(Number.isFinite),
  );
  const rankedBoxes = validPriorityPoints.length === 0
    ? safeBoxes
    : safeBoxes
        .map((box, index) => ({
          box,
          index,
          distance: Math.min(
            ...validPriorityPoints.map((point) => squaredDistanceToBox(box, point)),
          ),
        }))
        .sort((left, right) => left.distance - right.distance || left.index - right.index)
        .map(({ box }) => box);
  const boxes = rankedBoxes.slice(0, MAX_ACTIVE_ENVIRONMENT_CUBOID_COLLIDERS);
  const capacityDeferredCount = Math.max(0, rankedBoxes.length - boxes.length);
  return {
    plannedBoxCount: preview?.boxes.length ?? 0,
    activeColliderCount: boxes.length,
    deferredColliderCount: Math.max(0, (preview?.boxes.length ?? 0) - boxes.length),
    spawnOverlapDeferredCount,
    oversizedDeferredCount,
    capacityDeferredCount,
    priorityPointCount: validPriorityPoints.length,
    boxes,
  };
}
