export type ThreeDModelLibraryReadinessStatus = 'ready' | 'needs_configuration' | 'unavailable';
export type ThreeDModelLibraryDependencyStatus = 'available' | 'unverified';

export interface ThreeDModelLibraryReadiness {
  status: ThreeDModelLibraryReadinessStatus;
  primaryFileAvailable: boolean;
  textureAssignmentCount: number;
  textureFileCount: number;
  supportingFileCount: number;
  dependencyStatus: ThreeDModelLibraryDependencyStatus;
  issues: Array<'missing_primary_file' | 'missing_texture_source'>;
}

interface ReadinessFile {
  id: number;
  fileType: string;
  filePath: string;
}

interface ReadinessAssignment {
  targetKey: string;
  channel: string;
}

interface ReadinessModel {
  modelType: string;
  filePath: string;
  mainModelFileId: number | null;
  files: ReadinessFile[];
  materialAssignments: ReadinessAssignment[];
}

function isRuntimeFilePath(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Summarize only readiness facts already stored with a Library Model. Deep
 * dependency inspection remains an explicit Model Files operation because it
 * may require downloading and parsing the primary asset.
 */
export function createThreeDModelLibraryReadiness(model: ReadinessModel): ThreeDModelLibraryReadiness {
  const primaryRecord = model.files.find((file) => (
    file.id === model.mainModelFileId && file.fileType === 'model'
  ));
  const primaryFileAvailable = Boolean(
    primaryRecord && isRuntimeFilePath(primaryRecord.filePath),
  );
  const textureFileCount = model.files.filter((file) => file.fileType === 'texture').length;
  const supportingFileCount = model.files.filter((file) => file.fileType !== 'model').length;
  const textureAssignmentCount = new Set(
    model.materialAssignments
      .filter((assignment) => assignment.channel === 'baseColor')
      .map((assignment) => assignment.targetKey),
  ).size;
  const issues: ThreeDModelLibraryReadiness['issues'] = [];

  if (!primaryFileAvailable) issues.push('missing_primary_file');
  if (
    primaryFileAvailable
    && ['fbx', 'obj'].includes(model.modelType.toLowerCase())
    && textureAssignmentCount === 0
    && textureFileCount === 0
  ) {
    issues.push('missing_texture_source');
  }

  return {
    status: !primaryFileAvailable
      ? 'unavailable'
      : issues.length > 0 ? 'needs_configuration' : 'ready',
    primaryFileAvailable,
    textureAssignmentCount,
    textureFileCount,
    supportingFileCount,
    dependencyStatus: supportingFileCount > 0 ? 'available' : 'unverified',
    issues,
  };
}
