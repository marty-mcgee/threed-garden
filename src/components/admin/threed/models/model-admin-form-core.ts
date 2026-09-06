export interface ThreeDModelAdminFormData {
  modelName: string;
  modelType: string;
  filePath: string;
  fileSize: string;
  thumbnailUrl: string;
  usedByPlants: boolean;
  usedByCharacters: boolean;
  scale: string;
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  hasLOD: boolean;
  lodLevels: string;
  animations: string;
  defaultAnimation: string;
  mainModelFileId: string;
  isActive: boolean;
  status: string;
  isDefault: boolean;
  isPublic: boolean;
  isLibraryItem: boolean;
  uploadedBy: string;
  metadata: string;
  categoryIds: number[];
}

export class ThreeDModelFormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThreeDModelFormValidationError';
  }
}

export function createEmptyThreeDModelAdminForm(): ThreeDModelAdminFormData {
  return {
    modelName: '',
    modelType: '',
    filePath: '',
    fileSize: '',
    thumbnailUrl: '',
    usedByPlants: false,
    usedByCharacters: false,
    scale: '1.0',
    rotationY: '0.0',
    offsetX: '0.0',
    offsetY: '0.0',
    offsetZ: '0.0',
    hasLOD: false,
    lodLevels: '{}',
    animations: '[]',
    defaultAnimation: '',
    mainModelFileId: '',
    isActive: true,
    status: 'active',
    isDefault: false,
    isPublic: false,
    isLibraryItem: false,
    uploadedBy: '',
    metadata: '{}',
    categoryIds: [],
  };
}

function parseJsonObject(value: string, label: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ThreeDModelFormValidationError(`${label} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ThreeDModelFormValidationError) throw error;
    throw new ThreeDModelFormValidationError(`${label} contains invalid JSON`);
  }
}

function parseAnimations(value: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new ThreeDModelFormValidationError('Animations must be a JSON array');
    }
    return parsed;
  } catch (error) {
    if (error instanceof ThreeDModelFormValidationError) throw error;
    throw new ThreeDModelFormValidationError('Animations contains invalid JSON');
  }
}

function parseOptionalInteger(value: string, label: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new ThreeDModelFormValidationError(`${label} must be a non-negative whole number`);
  }
  return parsed;
}

function assertFiniteNumber(value: string, label: string, minimum?: number): void {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (minimum !== undefined && parsed < minimum)) {
    const suffix = minimum !== undefined ? ` greater than or equal to ${minimum}` : '';
    throw new ThreeDModelFormValidationError(`${label} must be a finite number${suffix}`);
  }
}

export function buildThreeDModelAdminPayload(form: ThreeDModelAdminFormData) {
  const modelName = form.modelName.trim();
  const modelType = form.modelType.trim();
  const filePath = form.filePath.trim();

  if (!modelName) throw new ThreeDModelFormValidationError('Model name is required');
  if (!modelType) throw new ThreeDModelFormValidationError('Model type is required');
  if (!filePath) throw new ThreeDModelFormValidationError('Model file path is required');

  assertFiniteNumber(form.scale, 'Scale', 0.01);
  assertFiniteNumber(form.rotationY, 'Rotation Y');
  assertFiniteNumber(form.offsetX, 'Offset X');
  assertFiniteNumber(form.offsetY, 'Offset Y');
  assertFiniteNumber(form.offsetZ, 'Offset Z');

  return {
    ...form,
    modelName,
    modelType,
    filePath,
    fileSize: parseOptionalInteger(form.fileSize, 'File size'),
    animations: parseAnimations(form.animations),
    lodLevels: parseJsonObject(form.lodLevels, 'LOD levels'),
    metadata: parseJsonObject(form.metadata, 'Metadata'),
    mainModelFileId: parseOptionalInteger(form.mainModelFileId, 'Primary Model file ID'),
  };
}
