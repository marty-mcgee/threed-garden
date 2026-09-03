import type {
  ThreeDEnvironmentCollisionPreviewBox,
  ThreeDEnvironmentCollisionPreviewPlan,
} from './environment-collision-preview-core';

export const MAX_ACTIVE_ENVIRONMENT_CUBOID_COLLIDERS = 512;

export interface ThreeDEnvironmentColliderExclusionBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface ThreeDEnvironmentColliderActivationPlan {
  plannedBoxCount: number;
  activeColliderCount: number;
  deferredColliderCount: number;
  spawnOverlapDeferredCount: number;
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

/**
 * Selects a bounded prefix from the already spatially balanced preview plan.
 * This function creates descriptions only; the Scene marker owner creates Rapier objects.
 */
export function createThreeDEnvironmentColliderActivationPlan(
  preview: ThreeDEnvironmentCollisionPreviewPlan | null,
  exclusions: readonly ThreeDEnvironmentColliderExclusionBounds[] = [],
): ThreeDEnvironmentColliderActivationPlan {
  let spawnOverlapDeferredCount = 0;
  const safeBoxes = (preview?.boxes ?? []).filter((box) => {
    if (!exclusions.some((exclusion) => intersectsExclusion(box, exclusion))) return true;
    spawnOverlapDeferredCount += 1;
    return false;
  });
  const boxes = safeBoxes.slice(0, MAX_ACTIVE_ENVIRONMENT_CUBOID_COLLIDERS);
  return {
    plannedBoxCount: preview?.boxes.length ?? 0,
    activeColliderCount: boxes.length,
    deferredColliderCount: Math.max(0, (preview?.boxes.length ?? 0) - boxes.length),
    spawnOverlapDeferredCount,
    boxes,
  };
}
