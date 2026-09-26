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
  prioritySelectedCount: number;
  coverageSelectedCount: number;
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
  const priorityOrder = validPriorityPoints.length === 0
    ? []
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
  const boxes: ThreeDEnvironmentCollisionPreviewBox[] = [];
  const selected = new Set<ThreeDEnvironmentCollisionPreviewBox>();
  let prioritySelectedCount = 0;
  let coverageSelectedCount = 0;
  const append = (
    box: ThreeDEnvironmentCollisionPreviewBox | undefined,
    source: 'priority' | 'coverage',
  ) => {
    if (!box || selected.has(box) || boxes.length >= MAX_ACTIVE_ENVIRONMENT_CUBOID_COLLIDERS) return;
    selected.add(box);
    boxes.push(box);
    if (source === 'priority') prioritySelectedCount += 1;
    else coverageSelectedCount += 1;
  };
  if (priorityOrder.length === 0) {
    for (const box of safeBoxes) append(box, 'coverage');
  } else {
    for (let index = 0; boxes.length < Math.min(safeBoxes.length, MAX_ACTIVE_ENVIRONMENT_CUBOID_COLLIDERS); index += 1) {
      append(priorityOrder[index], 'priority');
      append(safeBoxes[index], 'coverage');
    }
  }
  const capacityDeferredCount = Math.max(0, safeBoxes.length - boxes.length);
  return {
    plannedBoxCount: preview?.boxes.length ?? 0,
    activeColliderCount: boxes.length,
    deferredColliderCount: Math.max(0, (preview?.boxes.length ?? 0) - boxes.length),
    spawnOverlapDeferredCount,
    oversizedDeferredCount,
    capacityDeferredCount,
    priorityPointCount: validPriorityPoints.length,
    prioritySelectedCount,
    coverageSelectedCount,
    boxes,
  };
}
