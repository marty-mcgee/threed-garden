export const THREED_MODEL_IMPORT_MANIFEST_VERSION = 1 as const;
export const THREED_MODEL_IMPORT_MAX_MODELS = 500;
export const THREED_MODEL_IMPORT_MAX_CATEGORIES = 20;
export const THREED_MODEL_IMPORT_MAX_SUPPORTING_FILES = 50;

const MODEL_TYPES = [
  'procedural', 'gltf', 'glb', 'fbx', 'usdz', 'obj', 'herb-generic',
  'vegetable-generic', 'flower-generic', 'fruit-generic', 'tree-generic', 'custom',
] as const;
const MODEL_STATUSES = ['active', 'pending', 'maintenance', 'dormant', 'retired'] as const;
const ROOT_KEYS = new Set(['version', 'defaults', 'models']);
const DEFAULT_KEYS = new Set([
  'isPublic', 'isLibraryItem', 'isActive', 'status', 'usedByPlants', 'usedByCharacters',
  'scale', 'rotationY', 'offsetX', 'offsetY', 'offsetZ',
]);
const MODEL_KEYS = new Set([
  'importKey', 'modelName', 'modelType', 'sourceFile', 'thumbnailFile', 'supportingFiles', 'categories',
  'isPublic', 'isLibraryItem', 'isActive', 'status', 'usedByPlants', 'usedByCharacters',
  'scale', 'rotationY', 'offsetX', 'offsetY', 'offsetZ', 'metadata',
]);

type ModelType = (typeof MODEL_TYPES)[number];
type ModelStatus = (typeof MODEL_STATUSES)[number];

export interface ThreeDModelImportDefaults {
  isPublic: boolean;
  isLibraryItem: boolean;
  isActive: boolean;
  status: ModelStatus;
  usedByPlants: boolean;
  usedByCharacters: boolean;
  scale: number;
  rotationY: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

export interface ThreeDModelImportEntry extends ThreeDModelImportDefaults {
  importKey: string;
  modelName: string;
  modelType: ModelType;
  sourceFile: string;
  thumbnailFile: string | null;
  supportingFiles: string[];
  categories: string[];
  metadata: Record<string, unknown>;
}

export interface ThreeDModelImportPlan {
  version: typeof THREED_MODEL_IMPORT_MANIFEST_VERSION;
  defaults: ThreeDModelImportDefaults;
  models: ThreeDModelImportEntry[];
}

export class ThreeDModelImportManifestError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid ThreeD Model import manifest (${issues.length} issue${issues.length === 1 ? '' : 's'})`);
    this.name = 'ThreeDModelImportManifestError';
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>, path: string, issues: string[]) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) issues.push(`${path}.${key} is not supported`);
  }
}

function boundedString(value: unknown, path: string, issues: string[], max = 255): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    issues.push(`${path} must be a non-empty string up to ${max} characters`);
    return '';
  }
  return value.trim();
}

function booleanValue(value: unknown, fallback: boolean, path: string, issues: string[]): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    issues.push(`${path} must be boolean`);
    return fallback;
  }
  return value;
}

function finiteNumber(
  value: unknown,
  fallback: number,
  path: string,
  issues: string[],
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    issues.push(`${path} must be a finite number from ${minimum} through ${maximum}`);
    return fallback;
  }
  return value;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  path: string,
  issues: string[],
): T {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    issues.push(`${path} must be one of: ${allowed.join(', ')}`);
    return fallback;
  }
  return value as T;
}

function relativeFile(value: unknown, path: string, issues: string[], extensions: readonly string[]): string {
  const file = boundedString(value, path, issues, 500).replaceAll('\\', '/');
  if (!file) return '';
  if (file.startsWith('/') || file.split('/').includes('..') || file.includes('\0')) {
    issues.push(`${path} must be a relative path contained by the manifest directory`);
  }
  const lower = file.toLowerCase();
  if (!extensions.some((extension) => lower.endsWith(extension))) {
    issues.push(`${path} must end in ${extensions.join(', ')}`);
  }
  return file;
}

function parseDefaults(value: unknown, issues: string[]): ThreeDModelImportDefaults {
  const input = value === undefined ? {} : value;
  if (!isRecord(input)) {
    issues.push('defaults must be an object');
    return parseDefaults({}, issues);
  }
  rejectUnknownKeys(input, DEFAULT_KEYS, 'defaults', issues);
  return {
    isPublic: booleanValue(input.isPublic, false, 'defaults.isPublic', issues),
    isLibraryItem: booleanValue(input.isLibraryItem, true, 'defaults.isLibraryItem', issues),
    isActive: booleanValue(input.isActive, true, 'defaults.isActive', issues),
    status: enumValue(input.status, MODEL_STATUSES, 'active', 'defaults.status', issues),
    usedByPlants: booleanValue(input.usedByPlants, false, 'defaults.usedByPlants', issues),
    usedByCharacters: booleanValue(input.usedByCharacters, false, 'defaults.usedByCharacters', issues),
    scale: finiteNumber(input.scale, 1, 'defaults.scale', issues, 0.0001, 10_000),
    rotationY: finiteNumber(input.rotationY, 0, 'defaults.rotationY', issues, -36_000, 36_000),
    offsetX: finiteNumber(input.offsetX, 0, 'defaults.offsetX', issues, -1_000_000, 1_000_000),
    offsetY: finiteNumber(input.offsetY, 0, 'defaults.offsetY', issues, -1_000_000, 1_000_000),
    offsetZ: finiteNumber(input.offsetZ, 0, 'defaults.offsetZ', issues, -1_000_000, 1_000_000),
  };
}

export function parseThreeDModelImportManifest(value: unknown): ThreeDModelImportPlan {
  const issues: string[] = [];
  if (!isRecord(value)) throw new ThreeDModelImportManifestError(['manifest must be an object']);
  rejectUnknownKeys(value, ROOT_KEYS, 'manifest', issues);
  if (value.version !== THREED_MODEL_IMPORT_MANIFEST_VERSION) issues.push('version must be 1');
  const defaults = parseDefaults(value.defaults, issues);
  if (!Array.isArray(value.models) || value.models.length === 0 || value.models.length > THREED_MODEL_IMPORT_MAX_MODELS) {
    issues.push(`models must contain 1 through ${THREED_MODEL_IMPORT_MAX_MODELS} entries`);
  }

  const importKeys = new Set<string>();
  const models = (Array.isArray(value.models) ? value.models : []).slice(0, THREED_MODEL_IMPORT_MAX_MODELS).map((entry, index) => {
    const path = `models[${index}]`;
    if (!isRecord(entry)) {
      issues.push(`${path} must be an object`);
      return null;
    }
    rejectUnknownKeys(entry, MODEL_KEYS, path, issues);
    const importKey = boundedString(entry.importKey, `${path}.importKey`, issues, 200).toLowerCase();
    if (importKey && !/^[a-z0-9][a-z0-9/_-]*$/.test(importKey)) {
      issues.push(`${path}.importKey may contain lowercase letters, numbers, slash, underscore, and hyphen only`);
    }
    if (importKeys.has(importKey)) issues.push(`${path}.importKey duplicates ${importKey}`);
    importKeys.add(importKey);
    const modelType = enumValue(entry.modelType, MODEL_TYPES, 'custom', `${path}.modelType`, issues);
    const sourceFile = relativeFile(entry.sourceFile, `${path}.sourceFile`, issues, ['.glb', '.gltf', '.fbx', '.obj', '.usdz']);
    if (['glb', 'gltf', 'fbx', 'obj', 'usdz'].includes(modelType) && sourceFile && !sourceFile.toLowerCase().endsWith(`.${modelType}`)) {
      issues.push(`${path}.sourceFile extension must match modelType ${modelType}`);
    }
    const thumbnailFile = entry.thumbnailFile === undefined || entry.thumbnailFile === null || entry.thumbnailFile === ''
      ? null
      : relativeFile(entry.thumbnailFile, `${path}.thumbnailFile`, issues, ['.jpg', '.jpeg', '.png', '.webp']);
    const supportingValues = entry.supportingFiles === undefined ? [] : entry.supportingFiles;
    if (!Array.isArray(supportingValues) || supportingValues.length > THREED_MODEL_IMPORT_MAX_SUPPORTING_FILES) {
      issues.push(`${path}.supportingFiles must contain at most ${THREED_MODEL_IMPORT_MAX_SUPPORTING_FILES} files`);
    }
    const supportingFiles = [...new Set((Array.isArray(supportingValues) ? supportingValues : []).map(
      (file, supportingIndex) => relativeFile(
        file,
        `${path}.supportingFiles[${supportingIndex}]`,
        issues,
        ['.mtl', '.bin', '.jpg', '.jpeg', '.png', '.webp', '.tga', '.bmp'],
      ),
    ).filter(Boolean))];
    if (supportingFiles.includes(sourceFile) || (thumbnailFile && supportingFiles.includes(thumbnailFile))) {
      issues.push(`${path}.supportingFiles must not repeat the source or thumbnail file`);
    }
    const categoryValues = entry.categories === undefined ? [] : entry.categories;
    if (!Array.isArray(categoryValues) || categoryValues.length > THREED_MODEL_IMPORT_MAX_CATEGORIES) {
      issues.push(`${path}.categories must contain at most ${THREED_MODEL_IMPORT_MAX_CATEGORIES} slugs`);
    }
    const categories = [...new Set((Array.isArray(categoryValues) ? categoryValues : []).map((category, categoryIndex) => {
      const slug = boundedString(category, `${path}.categories[${categoryIndex}]`, issues, 120).toLowerCase();
      if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) issues.push(`${path}.categories[${categoryIndex}] must be a normalized slug`);
      return slug;
    }).filter(Boolean))];
    const metadata = entry.metadata === undefined ? {} : entry.metadata;
    if (!isRecord(metadata) || JSON.stringify(metadata).length > 16_384) {
      issues.push(`${path}.metadata must be an object no larger than 16 KiB`);
    }
    return {
      importKey,
      modelName: boundedString(entry.modelName, `${path}.modelName`, issues),
      modelType,
      sourceFile,
      thumbnailFile,
      supportingFiles,
      categories,
      metadata: isRecord(metadata) ? metadata : {},
      isPublic: booleanValue(entry.isPublic, defaults.isPublic, `${path}.isPublic`, issues),
      isLibraryItem: booleanValue(entry.isLibraryItem, defaults.isLibraryItem, `${path}.isLibraryItem`, issues),
      isActive: booleanValue(entry.isActive, defaults.isActive, `${path}.isActive`, issues),
      status: enumValue(entry.status, MODEL_STATUSES, defaults.status, `${path}.status`, issues),
      usedByPlants: booleanValue(entry.usedByPlants, defaults.usedByPlants, `${path}.usedByPlants`, issues),
      usedByCharacters: booleanValue(entry.usedByCharacters, defaults.usedByCharacters, `${path}.usedByCharacters`, issues),
      scale: finiteNumber(entry.scale, defaults.scale, `${path}.scale`, issues, 0.0001, 10_000),
      rotationY: finiteNumber(entry.rotationY, defaults.rotationY, `${path}.rotationY`, issues, -36_000, 36_000),
      offsetX: finiteNumber(entry.offsetX, defaults.offsetX, `${path}.offsetX`, issues, -1_000_000, 1_000_000),
      offsetY: finiteNumber(entry.offsetY, defaults.offsetY, `${path}.offsetY`, issues, -1_000_000, 1_000_000),
      offsetZ: finiteNumber(entry.offsetZ, defaults.offsetZ, `${path}.offsetZ`, issues, -1_000_000, 1_000_000),
    } satisfies ThreeDModelImportEntry;
  }).filter((entry): entry is ThreeDModelImportEntry => entry !== null);

  if (issues.length > 0) throw new ThreeDModelImportManifestError(issues);
  return { version: THREED_MODEL_IMPORT_MANIFEST_VERSION, defaults, models };
}
