export const MAX_ENVIRONMENT_COLLIDER_MESHES = 256;
export const MAX_ENVIRONMENT_COLLIDER_TRIANGLES = 250_000;
export const MAX_ENVIRONMENT_MESH_INVENTORY_ENTRIES = 64;
const MAX_ENVIRONMENT_MESH_PATH_LENGTH = 240;

export type ThreeDEnvironmentGeometryAuditStatus =
  | 'ready'
  | 'empty'
  | 'unsupported'
  | 'too_complex';

export interface ThreeDEnvironmentGeometryAuditInput {
  meshCount: number;
  triangleCount: number;
  skinnedMeshCount: number;
  invalidMeshCount: number;
  hasFiniteBounds: boolean;
}

export interface ThreeDEnvironmentGeometryAuditAssessment {
  status: ThreeDEnvironmentGeometryAuditStatus;
  colliderEligible: boolean;
  reasons: string[];
}

export interface ThreeDEnvironmentMeshInventoryCandidate {
  path: string;
  type: string;
  triangleCount: number;
}

export interface ThreeDEnvironmentMeshInventory {
  entries: ThreeDEnvironmentMeshInventoryCandidate[];
  omittedEntryCount: number;
}

export interface ThreeDModelSourceComponent {
  sourcePath: string;
  meshType: string;
  triangleCount: number;
}

export interface ThreeDModelSourceComponentPage {
  offset: number;
  limit: number;
  total: number;
  items: ThreeDModelSourceComponent[];
}

export interface ThreeDModelSourceComponentPageOptions {
  offset: number;
  limit: number;
  search?: string | null;
}

function normalizeInventoryText(value: string, fallback: string): string {
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_ENVIRONMENT_MESH_PATH_LENGTH);
  return normalized || fallback;
}

/**
 * Produces a deterministic, bounded diagnostic inventory for adapter authoring.
 * It carries no geometry buffers and grants no rendering or collision policy.
 */
export function createThreeDEnvironmentMeshInventory(
  candidates: readonly ThreeDEnvironmentMeshInventoryCandidate[],
): ThreeDEnvironmentMeshInventory {
  const safeEntries = candidates
    .filter((candidate) => Number.isSafeInteger(candidate.triangleCount) && candidate.triangleCount >= 0)
    .map((candidate) => ({
      path: normalizeInventoryText(candidate.path, '(unnamed mesh)'),
      type: normalizeInventoryText(candidate.type, 'Mesh'),
      triangleCount: candidate.triangleCount,
    }))
    .sort((left, right) => (
      right.triangleCount - left.triangleCount
      || left.path.localeCompare(right.path)
    ));

  return {
    entries: safeEntries.slice(0, MAX_ENVIRONMENT_MESH_INVENTORY_ENTRIES),
    omittedEntryCount: Math.max(0, safeEntries.length - MAX_ENVIRONMENT_MESH_INVENTORY_ENTRIES),
  };
}

/** Returns exact source evidence without deriving vendor- or asset-specific families. */
export function createThreeDModelSourceComponentPage(
  candidates: readonly ThreeDEnvironmentMeshInventoryCandidate[],
  options: ThreeDModelSourceComponentPageOptions,
): ThreeDModelSourceComponentPage {
  const offset = Number.isSafeInteger(options.offset) && options.offset >= 0 ? options.offset : 0;
  const limit = Number.isSafeInteger(options.limit) && options.limit >= 1 && options.limit <= 200
    ? options.limit
    : 100;
  const search = typeof options.search === 'string'
    ? options.search.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120).toLowerCase()
    : '';
  const safeItems = candidates
    .filter((candidate) => Number.isSafeInteger(candidate.triangleCount) && candidate.triangleCount >= 0)
    .map((candidate) => ({
      sourcePath: normalizeInventoryText(candidate.path, '(unnamed mesh)'),
      meshType: normalizeInventoryText(candidate.type, 'Mesh'),
      triangleCount: candidate.triangleCount,
    }))
    .filter((candidate) => !search || candidate.sourcePath.toLowerCase().includes(search))
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
  return {
    offset,
    limit,
    total: safeItems.length,
    items: safeItems.slice(offset, offset + limit),
  };
}

/**
 * Classifies already-loaded Three.js geometry before any Rapier collider is
 * created. This pure boundary performs no traversal, allocation, or physics
 * work and keeps the future collider limits explicit and testable.
 */
export function assessThreeDEnvironmentGeometry(
  input: ThreeDEnvironmentGeometryAuditInput,
): ThreeDEnvironmentGeometryAuditAssessment {
  const reasons: string[] = [];
  const counts = [
    input.meshCount,
    input.triangleCount,
    input.skinnedMeshCount,
    input.invalidMeshCount,
  ];
  if (!counts.every((value) => Number.isSafeInteger(value) && value >= 0)) {
    return {
      status: 'unsupported',
      colliderEligible: false,
      reasons: ['geometry counts are invalid'],
    };
  }
  if (!input.hasFiniteBounds) reasons.push('transformed bounds are unavailable');
  if (input.meshCount === 0 || input.triangleCount === 0) {
    reasons.push('no triangle geometry is available');
    return { status: 'empty', colliderEligible: false, reasons };
  }
  if (input.skinnedMeshCount > 0) reasons.push('skinned meshes require animated collision rules');
  if (input.invalidMeshCount > 0) reasons.push('one or more meshes have invalid triangle geometry');
  if (reasons.length > 0) {
    return { status: 'unsupported', colliderEligible: false, reasons };
  }
  if (input.meshCount > MAX_ENVIRONMENT_COLLIDER_MESHES) {
    reasons.push(`mesh count exceeds ${MAX_ENVIRONMENT_COLLIDER_MESHES}`);
  }
  if (input.triangleCount > MAX_ENVIRONMENT_COLLIDER_TRIANGLES) {
    reasons.push(`triangle count exceeds ${MAX_ENVIRONMENT_COLLIDER_TRIANGLES}`);
  }
  return reasons.length > 0
    ? { status: 'too_complex', colliderEligible: false, reasons }
    : { status: 'ready', colliderEligible: true, reasons: [] };
}
