export const MAX_ENVIRONMENT_COLLISION_PREVIEW_SOURCE_BOXES = 10_000;
export const MAX_ENVIRONMENT_COLLISION_PREVIEW_BOXES = 2_048;
export const ENVIRONMENT_COLLISION_PREVIEW_MIN_SIZE = 0.05;
export const ENVIRONMENT_COLLISION_PREVIEW_MIN_VOLUME = 0.0005;
export const ENVIRONMENT_COLLISION_PREVIEW_FLOOR_MAX_HEIGHT = 0.25;
export const ENVIRONMENT_COLLISION_PREVIEW_FLOOR_MIN_SPAN = 20;
export const ENVIRONMENT_COLLISION_PREVIEW_MERGE_GAP = 0.005;
export const ENVIRONMENT_COLLISION_PREVIEW_MAX_MERGE_INFLATION = 1.02;

export interface ThreeDEnvironmentCollisionBoxCandidate {
  sourcePath: string;
  center: [number, number, number];
  halfExtents: [number, number, number];
}

export interface ThreeDEnvironmentCollisionPreviewBox {
  center: [number, number, number];
  halfExtents: [number, number, number];
  sourceCount: number;
}

export interface ThreeDEnvironmentCollisionPreviewPlan {
  sourceBoxCount: number;
  eligibleBoxCount: number;
  previewBoxCount: number;
  invalidBoxCount: number;
  tinyBoxCount: number;
  floorLikeBoxCount: number;
  mergedSourceBoxCount: number;
  omittedBoxCount: number;
  boxes: ThreeDEnvironmentCollisionPreviewBox[];
}

interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
  sourceCount: number;
  sourcePath: string;
}

function spatiallyInterleave(bounds: Bounds[]): Bounds[] {
  if (bounds.length <= 1) return bounds;
  const minX = Math.min(...bounds.map((entry) => entry.min[0]));
  const maxX = Math.max(...bounds.map((entry) => entry.max[0]));
  const minZ = Math.min(...bounds.map((entry) => entry.min[2]));
  const maxZ = Math.max(...bounds.map((entry) => entry.max[2]));
  const gridSize = Math.max(1, Math.ceil(Math.sqrt(MAX_ENVIRONMENT_COLLISION_PREVIEW_BOXES)));
  const spanX = Math.max(maxX - minX, Number.EPSILON);
  const spanZ = Math.max(maxZ - minZ, Number.EPSILON);
  const buckets = new Map<string, Bounds[]>();

  for (const entry of bounds) {
    const centerX = (entry.min[0] + entry.max[0]) / 2;
    const centerZ = (entry.min[2] + entry.max[2]) / 2;
    const column = Math.min(gridSize - 1, Math.floor(((centerX - minX) / spanX) * gridSize));
    const row = Math.min(gridSize - 1, Math.floor(((centerZ - minZ) / spanZ) * gridSize));
    const key = `${row}:${column}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(entry);
    buckets.set(key, bucket);
  }

  const orderedBuckets = [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([, entries]) => entries.sort(
      (left, right) => volume(right) - volume(left) || left.sourcePath.localeCompare(right.sourcePath),
    ));
  const result: Bounds[] = [];
  let depth = 0;
  while (result.length < bounds.length) {
    let added = false;
    for (const bucket of orderedBuckets) {
      if (bucket[depth]) {
        result.push(bucket[depth]);
        added = true;
      }
    }
    if (!added) break;
    depth += 1;
  }
  const centerXs = bounds
    .map((entry) => (entry.min[0] + entry.max[0]) / 2)
    .sort((left, right) => left - right);
  const centerZs = bounds
    .map((entry) => (entry.min[2] + entry.max[2]) / 2)
    .sort((left, right) => left - right);
  const medianIndex = Math.floor(bounds.length / 2);
  const medianX = centerXs[medianIndex];
  const medianZ = centerZs[medianIndex];
  const central = [...bounds].sort((left, right) => {
    const leftX = (left.min[0] + left.max[0]) / 2 - medianX;
    const leftZ = (left.min[2] + left.max[2]) / 2 - medianZ;
    const rightX = (right.min[0] + right.max[0]) / 2 - medianX;
    const rightZ = (right.min[2] + right.max[2]) / 2 - medianZ;
    return (leftX * leftX + leftZ * leftZ) - (rightX * rightX + rightZ * rightZ)
      || volume(right) - volume(left)
      || left.sourcePath.localeCompare(right.sourcePath);
  });
  const balanced: Bounds[] = [];
  const seen = new Set<Bounds>();
  for (let index = 0; balanced.length < bounds.length; index += 1) {
    for (const entry of [result[index], central[index]]) {
      if (entry && !seen.has(entry)) {
        balanced.push(entry);
        seen.add(entry);
      }
    }
  }
  return balanced;
}

function isFiniteTuple(value: readonly number[]): boolean {
  return value.length === 3 && value.every(Number.isFinite);
}

function toBounds(candidate: ThreeDEnvironmentCollisionBoxCandidate): Bounds | null {
  if (!candidate.sourcePath || !isFiniteTuple(candidate.center) || !isFiniteTuple(candidate.halfExtents)) {
    return null;
  }
  if (candidate.halfExtents.some((value) => value <= 0)) return null;
  return {
    min: [
      candidate.center[0] - candidate.halfExtents[0],
      candidate.center[1] - candidate.halfExtents[1],
      candidate.center[2] - candidate.halfExtents[2],
    ],
    max: [
      candidate.center[0] + candidate.halfExtents[0],
      candidate.center[1] + candidate.halfExtents[1],
      candidate.center[2] + candidate.halfExtents[2],
    ],
    sourceCount: 1,
    sourcePath: candidate.sourcePath,
  };
}

function dimensions(bounds: Bounds): [number, number, number] {
  return [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  ];
}

function volume(bounds: Bounds): number {
  const size = dimensions(bounds);
  return size[0] * size[1] * size[2];
}

function mergeBounds(left: Bounds, right: Bounds): Bounds {
  return {
    min: [
      Math.min(left.min[0], right.min[0]),
      Math.min(left.min[1], right.min[1]),
      Math.min(left.min[2], right.min[2]),
    ],
    max: [
      Math.max(left.max[0], right.max[0]),
      Math.max(left.max[1], right.max[1]),
      Math.max(left.max[2], right.max[2]),
    ],
    sourceCount: left.sourceCount + right.sourceCount,
    sourcePath: left.sourcePath.localeCompare(right.sourcePath) <= 0
      ? left.sourcePath
      : right.sourcePath,
  };
}

function mayMerge(left: Bounds, right: Bounds): boolean {
  for (let axis = 0; axis < 3; axis += 1) {
    if (
      left.max[axis] + ENVIRONMENT_COLLISION_PREVIEW_MERGE_GAP < right.min[axis]
      || right.max[axis] + ENVIRONMENT_COLLISION_PREVIEW_MERGE_GAP < left.min[axis]
    ) return false;
  }
  const merged = mergeBounds(left, right);
  const largestSourceVolume = Math.max(volume(left), volume(right));
  return largestSourceVolume > 0
    && volume(merged) / largestSourceVolume <= ENVIRONMENT_COLLISION_PREVIEW_MAX_MERGE_INFLATION;
}

function toPreviewBox(bounds: Bounds): ThreeDEnvironmentCollisionPreviewBox {
  const center: [number, number, number] = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ];
  const halfExtents: [number, number, number] = [
    Math.max((bounds.max[0] - bounds.min[0]) / 2, 0.025),
    Math.max((bounds.max[1] - bounds.min[1]) / 2, 0.025),
    Math.max((bounds.max[2] - bounds.min[2]) / 2, 0.025),
  ];
  return { center, halfExtents, sourceCount: bounds.sourceCount };
}

/**
 * Produces bounded debug-only cuboids from marker-local mesh bounds. It does
 * not classify source names, mutate geometry, or create physics objects.
 */
export function planThreeDEnvironmentCollisionPreview(
  candidates: readonly ThreeDEnvironmentCollisionBoxCandidate[],
): ThreeDEnvironmentCollisionPreviewPlan {
  const sourceCandidates = candidates.slice(0, MAX_ENVIRONMENT_COLLISION_PREVIEW_SOURCE_BOXES);
  let invalidBoxCount = Math.max(0, candidates.length - sourceCandidates.length);
  let tinyBoxCount = 0;
  let floorLikeBoxCount = 0;
  const eligible: Bounds[] = [];

  for (const candidate of sourceCandidates) {
    const bounds = toBounds(candidate);
    if (!bounds) {
      invalidBoxCount += 1;
      continue;
    }
    const size = dimensions(bounds);
    if (Math.max(...size) < ENVIRONMENT_COLLISION_PREVIEW_MIN_SIZE || volume(bounds) < ENVIRONMENT_COLLISION_PREVIEW_MIN_VOLUME) {
      tinyBoxCount += 1;
      continue;
    }
    if (
      size[1] <= ENVIRONMENT_COLLISION_PREVIEW_FLOOR_MAX_HEIGHT
      && size[0] >= ENVIRONMENT_COLLISION_PREVIEW_FLOOR_MIN_SPAN
      && size[2] >= ENVIRONMENT_COLLISION_PREVIEW_FLOOR_MIN_SPAN
    ) {
      floorLikeBoxCount += 1;
      continue;
    }
    eligible.push(bounds);
  }

  const spatiallyOrdered = spatiallyInterleave(eligible);
  const planned: Bounds[] = [];
  let mergedSourceBoxCount = 0;
  let omittedBoxCount = 0;
  for (const candidate of spatiallyOrdered) {
    const mergeIndex = planned.findIndex((existing) => mayMerge(existing, candidate));
    if (mergeIndex >= 0) {
      planned[mergeIndex] = mergeBounds(planned[mergeIndex], candidate);
      mergedSourceBoxCount += 1;
      continue;
    }
    if (planned.length >= MAX_ENVIRONMENT_COLLISION_PREVIEW_BOXES) {
      omittedBoxCount += 1;
      continue;
    }
    planned.push(candidate);
  }

  return {
    sourceBoxCount: candidates.length,
    eligibleBoxCount: eligible.length,
    previewBoxCount: planned.length,
    invalidBoxCount,
    tinyBoxCount,
    floorLikeBoxCount,
    mergedSourceBoxCount,
    omittedBoxCount,
    boxes: planned.map(toPreviewBox),
  };
}
