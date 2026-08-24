const BED_SHAPES = new Set([
  'rectangle',
  'square',
  'circle',
  'raised',
  'container',
  'custom',
]);
const MAX_NAME_LENGTH = 100;
const MAX_POSITION = 1_000_000;
const MAX_ROTATION = 10_000;
const MIN_DIMENSION = 0.1;
const MAX_DIMENSION = 1_000;
const MIN_SCALE = 0.01;
const MAX_SCALE = 1_000;

export class ProjectBedPlacementInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectBedPlacementInputError';
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProjectBedPlacementInputError('Invalid request body');
  }
  return value as Record<string, unknown>;
}

function requirePositiveId(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ProjectBedPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

function boundedNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new ProjectBedPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

function requiredName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ProjectBedPlacementInputError('Invalid name');
  }
  const name = value.trim();
  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new ProjectBedPlacementInputError('Invalid name');
  }
  return name;
}

function bedShape(value: unknown): typeof BED_SHAPE_VALUES[number] {
  const shape = typeof value === 'string' ? value.trim().toLowerCase() : 'rectangle';
  if (!BED_SHAPES.has(shape)) {
    throw new ProjectBedPlacementInputError('Invalid shape');
  }
  return shape as typeof BED_SHAPE_VALUES[number];
}

function bedColor(value: unknown): string {
  const color = typeof value === 'string' ? value.trim() : '#8B5E3C';
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    throw new ProjectBedPlacementInputError('Invalid color');
  }
  return color;
}

const BED_SHAPE_VALUES = [
  'rectangle',
  'square',
  'circle',
  'raised',
  'container',
  'custom',
] as const;

export interface CreateProjectBedPlacementInput {
  markerType: 'beds';
  projectId: number;
  threedId: number;
  name: string;
  shape: typeof BED_SHAPE_VALUES[number];
  widthFeet: number;
  lengthFeet: number;
  heightFeet: number;
  color: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scale: number;
}

export interface UpdateProjectBedPlacementInput {
  markerType: 'beds';
  widthFeet: number;
  lengthFeet: number;
  heightFeet: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
}

export function parseCreateProjectBedPlacement(
  value: unknown,
): CreateProjectBedPlacementInput {
  const body = requireRecord(value);
  if (body.markerType !== 'beds') {
    throw new ProjectBedPlacementInputError('Invalid markerType');
  }
  return {
    markerType: 'beds',
    projectId: requirePositiveId(body.projectId, 'projectId'),
    threedId: requirePositiveId(body.threedId, 'threedId'),
    name: requiredName(body.name),
    shape: bedShape(body.shape),
    widthFeet: boundedNumber(body.widthFeet ?? 4, 'widthFeet', MIN_DIMENSION, MAX_DIMENSION),
    lengthFeet: boundedNumber(body.lengthFeet ?? 8, 'lengthFeet', MIN_DIMENSION, MAX_DIMENSION),
    heightFeet: boundedNumber(body.heightFeet ?? 1, 'heightFeet', MIN_DIMENSION, MAX_DIMENSION),
    color: bedColor(body.color),
    positionX: boundedNumber(body.positionX ?? 0, 'positionX', -MAX_POSITION, MAX_POSITION),
    positionY: boundedNumber(body.positionY ?? 0, 'positionY', -MAX_POSITION, MAX_POSITION),
    positionZ: boundedNumber(body.positionZ ?? 0, 'positionZ', -MAX_POSITION, MAX_POSITION),
    rotation: boundedNumber(body.rotation ?? 0, 'rotation', -MAX_ROTATION, MAX_ROTATION),
    scale: boundedNumber(body.scale ?? 1, 'scale', MIN_SCALE, MAX_SCALE),
  };
}

export function parseUpdateProjectBedPlacement(
  value: unknown,
): UpdateProjectBedPlacementInput {
  const body = requireRecord(value);
  if (body.markerType !== 'beds') {
    throw new ProjectBedPlacementInputError('Invalid markerType');
  }
  return {
    markerType: 'beds',
    widthFeet: boundedNumber(body.widthFeet, 'widthFeet', MIN_DIMENSION, MAX_DIMENSION),
    lengthFeet: boundedNumber(body.lengthFeet, 'lengthFeet', MIN_DIMENSION, MAX_DIMENSION),
    heightFeet: boundedNumber(body.heightFeet, 'heightFeet', MIN_DIMENSION, MAX_DIMENSION),
    positionX: boundedNumber(body.positionX, 'positionX', -MAX_POSITION, MAX_POSITION),
    positionY: boundedNumber(body.positionY, 'positionY', -MAX_POSITION, MAX_POSITION),
    positionZ: boundedNumber(body.positionZ, 'positionZ', -MAX_POSITION, MAX_POSITION),
    rotation: boundedNumber(body.rotation, 'rotation', -MAX_ROTATION, MAX_ROTATION),
  };
}
