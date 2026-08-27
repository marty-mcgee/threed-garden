const MAX_POSITION = 1_000_000;
const MAX_ROTATION = 10_000;
const MIN_DIMENSION = 0.1;
const MAX_DIMENSION = 1_000;
const MIN_SCALE = 0.01;
const MAX_SCALE = 1_000;

export class ProjectFarmBotPlacementInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectFarmBotPlacementInputError';
  }
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProjectFarmBotPlacementInputError('Invalid request body');
  }
  return value as Record<string, unknown>;
}

function positiveId(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ProjectFarmBotPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

function boundedNumber(value: unknown, field: string, minimum: number, maximum: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new ProjectFarmBotPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

function color(value: unknown): string {
  const parsed = typeof value === 'string' ? value.trim() : '#4B5563';
  if (!/^#[0-9a-f]{6}$/i.test(parsed)) {
    throw new ProjectFarmBotPlacementInputError('Invalid color');
  }
  return parsed;
}

function transform(body: Record<string, unknown>) {
  return {
    widthFeet: boundedNumber(body.widthFeet ?? 3, 'widthFeet', MIN_DIMENSION, MAX_DIMENSION),
    lengthFeet: boundedNumber(body.lengthFeet ?? 6, 'lengthFeet', MIN_DIMENSION, MAX_DIMENSION),
    heightFeet: boundedNumber(body.heightFeet ?? 3, 'heightFeet', MIN_DIMENSION, MAX_DIMENSION),
    scale: boundedNumber(body.scale ?? 1, 'scale', MIN_SCALE, MAX_SCALE),
    color: color(body.color),
    positionX: boundedNumber(body.positionX ?? 0, 'positionX', -MAX_POSITION, MAX_POSITION),
    positionY: boundedNumber(body.positionY ?? 0, 'positionY', -MAX_POSITION, MAX_POSITION),
    positionZ: boundedNumber(body.positionZ ?? 0, 'positionZ', -MAX_POSITION, MAX_POSITION),
    rotation: boundedNumber(body.rotation ?? 0, 'rotation', -MAX_ROTATION, MAX_ROTATION),
  };
}

export interface CreateProjectFarmBotPlacementInput {
  markerType: 'farmbots';
  projectId: number;
  threedId: number;
  farmbotId: number;
  widthFeet: number;
  lengthFeet: number;
  heightFeet: number;
  scale: number;
  color: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
}

export type UpdateProjectFarmBotPlacementInput = Omit<
  CreateProjectFarmBotPlacementInput,
  'projectId' | 'threedId' | 'farmbotId'
>;

export function parseCreateProjectFarmBotPlacement(
  value: unknown,
): CreateProjectFarmBotPlacementInput {
  const body = record(value);
  if (body.markerType !== 'farmbots') {
    throw new ProjectFarmBotPlacementInputError('Invalid markerType');
  }
  return {
    markerType: 'farmbots',
    projectId: positiveId(body.projectId, 'projectId'),
    threedId: positiveId(body.threedId, 'threedId'),
    farmbotId: positiveId(body.farmbotId, 'farmbotId'),
    ...transform(body),
  };
}

export function parseUpdateProjectFarmBotPlacement(
  value: unknown,
): UpdateProjectFarmBotPlacementInput {
  const body = record(value);
  if (body.markerType !== 'farmbots') {
    throw new ProjectFarmBotPlacementInputError('Invalid markerType');
  }
  return { markerType: 'farmbots', ...transform(body) };
}
