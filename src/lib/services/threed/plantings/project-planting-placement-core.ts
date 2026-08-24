const MAX_POSITION = 1_000_000;
const MIN_SCALE = 0.01;
const MAX_SCALE = 1_000;
const MAX_QUANTITY = 10_000;
const MAX_SPACING_INCHES = 100_000;

export interface ProjectPlantingVisualPosition {
  x: number;
  y: 0;
  z: number;
}

/**
 * Builds a centered square-grid layout for the visible members of one
 * Project Planting. Bed and Scene dimensions use feet, while Planting
 * spacing is stored in inches, so the spacing is converted at this boundary.
 */
export function calculateProjectPlantingVisualPositions(
  quantityValue: unknown,
  spacingInchesValue: unknown,
): ProjectPlantingVisualPosition[] {
  const parsedQuantity = Number(quantityValue);
  const quantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0
    ? Math.min(parsedQuantity, MAX_QUANTITY)
    : 1;
  const parsedSpacing = Number(spacingInchesValue);
  const spacingFeet = Number.isFinite(parsedSpacing) && parsedSpacing >= 0
    ? parsedSpacing / 12
    : 1;
  const columns = Math.ceil(Math.sqrt(quantity));
  const rows = Math.ceil(quantity / columns);

  return Array.from({ length: quantity }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const membersInRow = Math.min(columns, quantity - row * columns);
    return {
      x: (column - (membersInRow - 1) / 2) * spacingFeet,
      y: 0 as const,
      z: (row - (rows - 1) / 2) * spacingFeet,
    };
  });
}

export class ProjectPlantingPlacementInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectPlantingPlacementInputError';
  }
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProjectPlantingPlacementInputError('Invalid request body');
  }
  return value as Record<string, unknown>;
}

function positiveId(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ProjectPlantingPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

function optionalPositiveId(value: unknown, field: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  return positiveId(value, field);
}

function boundedNumber(value: unknown, field: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ProjectPlantingPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

function boundedInteger(value: unknown, field: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new ProjectPlantingPlacementInputError(`Invalid ${field}`);
  }
  return parsed;
}

export interface CreateProjectPlantingPlacementInput {
  markerType: 'plantings';
  projectId: number;
  threedId: number;
  plantId: number;
  bedId: number | null;
  quantity: number;
  spacingInches: number | null;
  modelScale: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}

export interface UpdateProjectPlantingPlacementInput {
  markerType: 'plantings';
  modelScale: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}

function shared(body: Record<string, unknown>) {
  return {
    quantity: boundedInteger(body.quantity ?? 1, 'quantity', 1, MAX_QUANTITY),
    spacingInches: body.spacingInches === null || body.spacingInches === undefined || body.spacingInches === ''
      ? null
      : boundedInteger(body.spacingInches, 'spacingInches', 0, MAX_SPACING_INCHES),
    modelScale: boundedNumber(body.modelScale ?? 1, 'modelScale', MIN_SCALE, MAX_SCALE),
    positionX: boundedNumber(body.positionX, 'positionX', -MAX_POSITION, MAX_POSITION),
    positionY: boundedNumber(body.positionY, 'positionY', -MAX_POSITION, MAX_POSITION),
    positionZ: boundedNumber(body.positionZ, 'positionZ', -MAX_POSITION, MAX_POSITION),
  };
}

function sharedInstance(body: Record<string, unknown>) {
  return {
    modelScale: boundedNumber(body.modelScale ?? 1, 'modelScale', MIN_SCALE, MAX_SCALE),
    positionX: boundedNumber(body.positionX, 'positionX', -MAX_POSITION, MAX_POSITION),
    positionY: boundedNumber(body.positionY, 'positionY', -MAX_POSITION, MAX_POSITION),
    positionZ: boundedNumber(body.positionZ, 'positionZ', -MAX_POSITION, MAX_POSITION),
  };
}

export function parseCreateProjectPlantingPlacement(
  value: unknown,
): CreateProjectPlantingPlacementInput {
  const body = record(value);
  if (body.markerType !== 'plantings') {
    throw new ProjectPlantingPlacementInputError('Invalid markerType');
  }
  return {
    markerType: 'plantings',
    projectId: positiveId(body.projectId, 'projectId'),
    threedId: positiveId(body.threedId, 'threedId'),
    plantId: positiveId(body.plantId, 'plantId'),
    bedId: optionalPositiveId(body.bedId, 'bedId'),
    ...shared(body),
  };
}

export function parseUpdateProjectPlantingPlacement(
  value: unknown,
): UpdateProjectPlantingPlacementInput {
  const body = record(value);
  if (body.markerType !== 'plantings') {
    throw new ProjectPlantingPlacementInputError('Invalid markerType');
  }
  return { markerType: 'plantings', ...sharedInstance(body) };
}
