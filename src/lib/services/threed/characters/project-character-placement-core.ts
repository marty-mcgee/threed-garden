const MAX_POSITION = 1_000_000;
const MAX_ROTATION = 10_000;
const MIN_SCALE = 0.01;
const MAX_SCALE = 1_000;
const SPAWN_PRECISION = 6;

export class ProjectCharacterPlacementInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectCharacterPlacementInputError';
  }
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProjectCharacterPlacementInputError('Invalid request body');
  }
  return value as Record<string, unknown>;
}

function positiveId(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ProjectCharacterPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

function boundedNumber(value: unknown, field: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ProjectCharacterPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

export interface ProjectCharacterPosition {
  x: number;
  y: number;
  z: number;
}

export interface CreateProjectCharacterPlacementInput {
  markerType: 'characters';
  projectId: number;
  threedId: number;
  characterId: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scaleMultiplier: number;
}

export interface UpdateProjectCharacterPlacementInput {
  markerType: 'characters';
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scaleMultiplier: number;
}

function transform(body: Record<string, unknown>) {
  return {
    positionX: boundedNumber(body.positionX, 'positionX', -MAX_POSITION, MAX_POSITION),
    positionY: boundedNumber(body.positionY, 'positionY', -MAX_POSITION, MAX_POSITION),
    positionZ: boundedNumber(body.positionZ, 'positionZ', -MAX_POSITION, MAX_POSITION),
    rotation: boundedNumber(body.rotation ?? 0, 'rotation', -MAX_ROTATION, MAX_ROTATION),
    scaleMultiplier: boundedNumber(
      body.scaleMultiplier ?? 1,
      'scaleMultiplier',
      MIN_SCALE,
      MAX_SCALE,
    ),
  };
}

export function createProjectCharacterSpawnKey(position: ProjectCharacterPosition): string {
  return [position.x, position.y, position.z]
    .map((value) => {
      if (!Number.isFinite(value)) {
        throw new ProjectCharacterPlacementInputError('Invalid Character spawn position');
      }
      return value.toFixed(SPAWN_PRECISION);
    })
    .join(':');
}

export function parseCreateProjectCharacterPlacement(
  value: unknown,
): CreateProjectCharacterPlacementInput {
  const body = record(value);
  if (body.markerType !== 'characters') {
    throw new ProjectCharacterPlacementInputError('Invalid markerType');
  }
  return {
    markerType: 'characters',
    projectId: positiveId(body.projectId, 'projectId'),
    threedId: positiveId(body.threedId, 'threedId'),
    characterId: positiveId(body.characterId, 'characterId'),
    ...transform(body),
  };
}

export function parseUpdateProjectCharacterPlacement(
  value: unknown,
): UpdateProjectCharacterPlacementInput {
  const body = record(value);
  if (body.markerType !== 'characters') {
    throw new ProjectCharacterPlacementInputError('Invalid markerType');
  }
  return { markerType: 'characters', ...transform(body) };
}
