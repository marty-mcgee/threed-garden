import { legacySensorArray, removeLegacyAttachedSensors, readModelVolumeSensor } from '../physics/sensor-legacy-compat';
import { validatePhysicsSensorCuboids } from '../physics/sensor-cuboid-core';

const MAX_INSTANCE_NAME_LENGTH = 120;
const MAX_POSITION = 1_000_000;
const MAX_ROTATION = 10_000;
const MIN_SCALE = 0.0001;
const MAX_SCALE = 10_000;
export type ProjectModelPlacementRole = 'object' | 'environment';
export type ProjectModelCollisionMode = 'box' | 'triangle-surface';
export type ProjectModelEffectiveCollisionMode =
  | 'ball'
  | 'box'
  | 'box-fallback'
  | 'triangle-regions'
  | 'triangle-surface';

export function isProjectModelEnvironment(metadata: unknown): boolean {
  return typeof metadata === 'object'
    && metadata !== null
    && !Array.isArray(metadata)
    && (metadata as Record<string, unknown>).placementRole === 'environment';
}

export function isProjectModelMovableBall(metadata: unknown): boolean {
  return !isProjectModelEnvironment(metadata)
    && typeof metadata === 'object'
    && metadata !== null
    && !Array.isArray(metadata)
    && (metadata as Record<string, unknown>).physicsMode === 'ball';
}

export function resolveProjectModelCollisionMode(
  metadata: unknown,
  environment: boolean = isProjectModelEnvironment(metadata),
): ProjectModelCollisionMode {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    const value = (metadata as Record<string, unknown>).collisionMode;
    if (value === 'box' || value === 'triangle-surface') return value;
  }
  // Preserve the released Environment surface/region policy while ordinary
  // Model instances retain their historical box default.
  return environment ? 'triangle-surface' : 'box';
}

export function resolveProjectModelEffectiveCollisionMode(input: {
  requestedMode: ProjectModelCollisionMode;
  isEnvironment: boolean;
  isMovableBall: boolean;
  surfaceReady: boolean;
  regionsReady: boolean;
}): ProjectModelEffectiveCollisionMode {
  if (input.isMovableBall) return 'ball';
  if (input.requestedMode === 'box') return 'box';
  if (input.surfaceReady) return 'triangle-surface';
  if (input.isEnvironment && input.regionsReady) return 'triangle-regions';
  return 'box-fallback';
}

export function isProjectModelStationaryCollisionReady(input: {
  requestedMode: ProjectModelCollisionMode;
  isEnvironment: boolean;
  hasModelFile: boolean;
  loadFailed: boolean;
  visualSettled: boolean;
  hasBounds: boolean;
  hasGeometryAudit: boolean;
  hasSurface: boolean;
  hasRegions: boolean;
  hasCollisionPreview: boolean;
}): boolean {
  if (input.loadFailed || !input.hasModelFile) return true;
  if (!input.visualSettled) return false;
  if (input.requestedMode === 'box') return input.hasBounds;
  if (input.isEnvironment) {
    return input.hasSurface || input.hasRegions || input.hasCollisionPreview;
  }
  return input.hasGeometryAudit && input.hasBounds;
}

export class ProjectModelInstanceInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectModelInstanceInputError';
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProjectModelInstanceInputError('Invalid request body');
  }
  return value as Record<string, unknown>;
}

function requirePositiveId(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ProjectModelInstanceInputError(`Invalid ${field}`);
  }
  return parsed;
}

function readBoundedNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new ProjectModelInstanceInputError(`Invalid ${field}`);
  }
  return parsed;
}

function readOptionalName(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ProjectModelInstanceInputError('Invalid instanceName');
  }
  const name = value.trim();
  if (name.length > MAX_INSTANCE_NAME_LENGTH) {
    throw new ProjectModelInstanceInputError('Invalid instanceName');
  }
  return name || null;
}

function readOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new ProjectModelInstanceInputError(`Invalid ${field}`);
  }
  return value;
}

function readOptionalMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProjectModelInstanceInputError('Invalid metadata');
  }
  const metadata = value as Record<string, unknown>;
  if (metadata.physicsVolumeSensor !== undefined && metadata.physicsVolumeSensor !== false && !readModelVolumeSensor(metadata)) {
    throw new ProjectModelInstanceInputError('Invalid physicsVolumeSensor');
  }
  const configured = metadata.physicsSensorCuboids ?? legacySensorArray(metadata);
  if (configured !== undefined) {
    const parsed = validatePhysicsSensorCuboids(configured);
    if (!parsed.success) throw new ProjectModelInstanceInputError(parsed.error);
    return { ...removeLegacyAttachedSensors(metadata), physicsSensorCuboids: parsed.sensors };
  }
  return metadata;
}

function readOptionalPlacementRole(value: unknown): ProjectModelPlacementRole | undefined {
  if (value === undefined) return undefined;
  if (value !== 'object' && value !== 'environment') {
    throw new ProjectModelInstanceInputError('Invalid placementRole');
  }
  return value;
}

function readOptionalCollisionMode(value: unknown): ProjectModelCollisionMode | undefined {
  if (value === undefined) return undefined;
  if (value !== 'box' && value !== 'triangle-surface') {
    throw new ProjectModelInstanceInputError('Invalid collisionMode');
  }
  return value;
}

export interface CreateProjectModelInstanceInput {
  projectId: number;
  threedId: number;
  modelId: number;
  instanceName: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleMultiplier: number;
  isVisible: boolean;
  isActive: boolean;
  metadata: Record<string, unknown>;
  placementRole: ProjectModelPlacementRole;
}

export function parseCreateProjectModelInstance(value: unknown): CreateProjectModelInstanceInput {
  const body = requireRecord(value);
  return {
    projectId: requirePositiveId(body.projectId, 'projectId'),
    threedId: requirePositiveId(body.threedId, 'threedId'),
    modelId: requirePositiveId(body.modelId, 'modelId'),
    instanceName: readOptionalName(body.instanceName),
    positionX: readBoundedNumber(body.positionX ?? 0, 'positionX', -MAX_POSITION, MAX_POSITION),
    positionY: readBoundedNumber(body.positionY ?? 0, 'positionY', -MAX_POSITION, MAX_POSITION),
    positionZ: readBoundedNumber(body.positionZ ?? 0, 'positionZ', -MAX_POSITION, MAX_POSITION),
    rotationX: readBoundedNumber(body.rotationX ?? 0, 'rotationX', -MAX_ROTATION, MAX_ROTATION),
    rotationY: readBoundedNumber(body.rotationY ?? 0, 'rotationY', -MAX_ROTATION, MAX_ROTATION),
    rotationZ: readBoundedNumber(body.rotationZ ?? 0, 'rotationZ', -MAX_ROTATION, MAX_ROTATION),
    scaleMultiplier: readBoundedNumber(
      body.scaleMultiplier ?? 1,
      'scaleMultiplier',
      MIN_SCALE,
      MAX_SCALE,
    ),
    isVisible: readOptionalBoolean(body.isVisible, 'isVisible') ?? true,
    isActive: readOptionalBoolean(body.isActive, 'isActive') ?? true,
    metadata: readOptionalMetadata(body.metadata) ?? {},
    placementRole: readOptionalPlacementRole(body.placementRole) ?? 'object',
  };
}

export interface UpdateProjectModelInstanceInput {
  instanceName?: string | null;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scaleMultiplier?: number;
  isVisible?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  placementRole?: ProjectModelPlacementRole;
  collisionMode?: ProjectModelCollisionMode;
}

export function parseUpdateProjectModelInstance(value: unknown): UpdateProjectModelInstanceInput {
  const body = requireRecord(value);
  const update: UpdateProjectModelInstanceInput = {};

  if ('instanceName' in body) update.instanceName = readOptionalName(body.instanceName);
  if ('positionX' in body) update.positionX = readBoundedNumber(body.positionX, 'positionX', -MAX_POSITION, MAX_POSITION);
  if ('positionY' in body) update.positionY = readBoundedNumber(body.positionY, 'positionY', -MAX_POSITION, MAX_POSITION);
  if ('positionZ' in body) update.positionZ = readBoundedNumber(body.positionZ, 'positionZ', -MAX_POSITION, MAX_POSITION);
  if ('rotationX' in body) update.rotationX = readBoundedNumber(body.rotationX, 'rotationX', -MAX_ROTATION, MAX_ROTATION);
  if ('rotationY' in body) update.rotationY = readBoundedNumber(body.rotationY, 'rotationY', -MAX_ROTATION, MAX_ROTATION);
  if ('rotationZ' in body) update.rotationZ = readBoundedNumber(body.rotationZ, 'rotationZ', -MAX_ROTATION, MAX_ROTATION);
  if ('scaleMultiplier' in body) update.scaleMultiplier = readBoundedNumber(body.scaleMultiplier, 'scaleMultiplier', MIN_SCALE, MAX_SCALE);
  if ('isVisible' in body) update.isVisible = readOptionalBoolean(body.isVisible, 'isVisible');
  if ('isActive' in body) update.isActive = readOptionalBoolean(body.isActive, 'isActive');
  if ('metadata' in body) {
    update.metadata = readOptionalMetadata(body.metadata);
    if (update.metadata && 'collisionMode' in update.metadata) {
      update.collisionMode = readOptionalCollisionMode(update.metadata.collisionMode);
    }
  }
  if ('placementRole' in body) update.placementRole = readOptionalPlacementRole(body.placementRole);
  if ('collisionMode' in body) update.collisionMode = readOptionalCollisionMode(body.collisionMode);

  if (Object.keys(update).length === 0) {
    throw new ProjectModelInstanceInputError('No supported fields to update');
  }
  return update;
}
