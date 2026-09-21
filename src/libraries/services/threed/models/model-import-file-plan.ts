import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  parseThreeDModelImportManifest,
  type ThreeDModelImportEntry,
  type ThreeDModelImportPlan,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './model-import-manifest-core.ts';

export const THREED_MODEL_IMPORT_MAX_MANIFEST_BYTES = 5 * 1024 * 1024;
export const THREED_MODEL_IMPORT_MAX_MODEL_BYTES = 500 * 1024 * 1024;
export const THREED_MODEL_IMPORT_MAX_PREVIEW_BYTES = 5 * 1024 * 1024;
export const THREED_MODEL_IMPORT_MAX_SUPPORTING_FILE_BYTES = 100 * 1024 * 1024;

export interface ThreeDModelImportResolvedFile {
  absolutePath: string;
  relativePath: string;
  size: number;
}

export interface ThreeDModelImportResolvedEntry {
  entry: ThreeDModelImportEntry;
  source: ThreeDModelImportResolvedFile;
  thumbnail: ThreeDModelImportResolvedFile | null;
  supporting: ThreeDModelImportResolvedFile[];
}

export interface ThreeDModelImportFilePlan {
  manifestPath: string;
  manifestDirectory: string;
  plan: ThreeDModelImportPlan;
  models: ThreeDModelImportResolvedEntry[];
}

async function resolveContainedFile(
  manifestDirectory: string,
  relativeFile: string,
  maximumBytes: number,
): Promise<ThreeDModelImportResolvedFile> {
  const requested = path.resolve(manifestDirectory, relativeFile);
  const [directoryPath, filePath] = await Promise.all([realpath(manifestDirectory), realpath(requested)]);
  if (filePath !== directoryPath && !filePath.startsWith(`${directoryPath}${path.sep}`)) {
    throw new Error(`${relativeFile} resolves outside the manifest directory`);
  }
  const fileStat = await stat(filePath);
  if (!fileStat.isFile() || fileStat.size < 1 || fileStat.size > maximumBytes) {
    throw new Error(`${relativeFile} must be a file from 1 through ${maximumBytes} bytes`);
  }
  return { absolutePath: filePath, relativePath: relativeFile, size: fileStat.size };
}

export async function loadThreeDModelImportFilePlan(requestedFile: string): Promise<ThreeDModelImportFilePlan> {
  const manifestPath = path.resolve(process.cwd(), requestedFile);
  const manifestStat = await stat(manifestPath);
  if (!manifestStat.isFile() || manifestStat.size < 1 || manifestStat.size > THREED_MODEL_IMPORT_MAX_MANIFEST_BYTES) {
    throw new Error(`Manifest must be a JSON file from 1 through ${THREED_MODEL_IMPORT_MAX_MANIFEST_BYTES} bytes`);
  }
  const manifestDirectory = path.dirname(await realpath(manifestPath));
  const plan = parseThreeDModelImportManifest(JSON.parse(await readFile(manifestPath, 'utf8')) as unknown);
  const models = await Promise.all(plan.models.map(async (entry) => ({
    entry,
    source: await resolveContainedFile(manifestDirectory, entry.sourceFile, THREED_MODEL_IMPORT_MAX_MODEL_BYTES),
    thumbnail: entry.thumbnailFile
      ? await resolveContainedFile(manifestDirectory, entry.thumbnailFile, THREED_MODEL_IMPORT_MAX_PREVIEW_BYTES)
      : null,
    supporting: await Promise.all(entry.supportingFiles.map((file) => resolveContainedFile(
      manifestDirectory,
      file,
      THREED_MODEL_IMPORT_MAX_SUPPORTING_FILE_BYTES,
    ))),
  })));
  return { manifestPath, manifestDirectory, plan, models };
}
