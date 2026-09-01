import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { user } from '../schema/auth/index.ts';
import {
  threedModelCategories,
  threedModelCategoryAssignments,
  threedModelFiles,
  threedModels,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../schema/threed/index.ts';
import {
  loadThreeDModelImportFilePlan,
  type ThreeDModelImportResolvedEntry,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-import-file-plan.ts';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

interface ImportOptions {
  apply: boolean;
  file: string;
  report: string;
  userId: string;
}

interface ImportResult {
  importKey: string;
  modelId?: number;
  operation: 'created' | 'updated' | 'failed';
  error?: string;
}

function readOption(args: string[], name: string): string | undefined {
  const inline = args.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseOptions(args: string[]): ImportOptions {
  const file = readOption(args, '--file')?.trim();
  const report = readOption(args, '--report')?.trim();
  const userId = readOption(args, '--user-id')?.trim();
  if (!file) throw new Error('Missing required --file <manifest.json> argument');
  if (!report) throw new Error('Missing required --report <report.json> argument');
  if (!userId) throw new Error('Missing required --user-id <id> argument');
  if (!args.includes('--apply')) throw new Error('Refusing to write without the explicit --apply flag');
  return {
    apply: true,
    file,
    report: path.resolve(process.cwd(), report),
    userId,
  };
}

function safeBlobSegment(value: string): string {
  return value.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function contentType(fileName: string): string | undefined {
  const extension = path.extname(fileName).toLowerCase();
  return ({
    '.bin': 'application/octet-stream',
    '.bmp': 'image/bmp',
    '.fbx': 'application/octet-stream',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.mtl': 'text/plain',
    '.obj': 'text/plain',
    '.png': 'image/png',
    '.tga': 'application/octet-stream',
    '.usdz': 'model/vnd.usdz+zip',
    '.webp': 'image/webp',
  } as Record<string, string>)[extension];
}

function supportingFileType(fileName: string): {
  fileType: string;
  isBinaryBuffer: boolean;
  textureType: string | null;
} {
  const extension = path.extname(fileName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.tga', '.bmp'].includes(extension)) {
    return { fileType: 'texture', isBinaryBuffer: false, textureType: 'baseColor' };
  }
  if (extension === '.bin') return { fileType: 'binary', isBinaryBuffer: true, textureType: null };
  return { fileType: 'other', isBinaryBuffer: false, textureType: null };
}

async function uploadFile(userId: string, importKey: string, role: string, relativePath: string, absolutePath: string) {
  const pathname = [
    'models',
    safeBlobSegment(userId),
    'imports',
    safeBlobSegment(importKey),
    role,
    safeBlobSegment(relativePath.replace(/^\.\//, '')),
  ].join('/');
  const blob = await put(pathname, await readFile(absolutePath), {
    access: 'public',
    addRandomSuffix: false,
    contentType: contentType(relativePath),
  });
  return blob.url;
}

async function importModel(
  userId: string,
  model: ThreeDModelImportResolvedEntry,
  categoryIdsBySlug: Map<string, number>,
): Promise<ImportResult> {
  const { entry } = model;
  try {
    const [existing] = await db.select({ id: threedModels.id, metadata: threedModels.metadata })
      .from(threedModels)
      .where(and(
        eq(threedModels.userId, userId),
        sql`${threedModels.metadata}->>'importKey' = ${entry.importKey}`,
      ));
    const duplicate = await db.select({ id: threedModels.id })
      .from(threedModels)
      .where(and(
        eq(threedModels.userId, userId),
        sql`${threedModels.metadata}->>'importKey' = ${entry.importKey}`,
      ));
    if (duplicate.length > 1) throw new Error('Multiple owned Models use this importKey');

    const sourceUrl = await uploadFile(userId, entry.importKey, 'bundle', model.source.relativePath, model.source.absolutePath);
    const thumbnailUrl = model.thumbnail
      ? await uploadFile(userId, entry.importKey, 'preview', model.thumbnail.relativePath, model.thumbnail.absolutePath)
      : null;
    const supportingUploads: Array<{
      file: ThreeDModelImportResolvedEntry['supporting'][number];
      url: string;
    }> = [];
    for (const supporting of model.supporting) {
      supportingUploads.push({
        file: supporting,
        url: await uploadFile(userId, entry.importKey, 'bundle', supporting.relativePath, supporting.absolutePath),
      });
    }

    const result = await db.transaction(async (tx) => {
      const storedMetadata = existing?.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
        ? existing.metadata as Record<string, unknown>
        : {};
      const values = {
        userId,
        modelName: entry.modelName,
        modelType: entry.modelType,
        filePath: sourceUrl,
        fileSize: model.source.size,
        thumbnailUrl,
        usedByPlants: entry.usedByPlants,
        usedByCharacters: entry.usedByCharacters,
        scale: entry.scale.toFixed(2),
        rotationY: entry.rotationY.toFixed(2),
        offsetX: entry.offsetX.toFixed(2),
        offsetY: entry.offsetY.toFixed(2),
        offsetZ: entry.offsetZ.toFixed(2),
        hasExternalFiles: supportingUploads.length > 0,
        textureCount: supportingUploads.filter(({ file }) => supportingFileType(file.relativePath).fileType === 'texture').length,
        isActive: entry.isActive,
        status: entry.status,
        isPublic: entry.isPublic,
        isLibraryItem: entry.isLibraryItem,
        metadata: { ...storedMetadata, ...entry.metadata, importKey: entry.importKey, importManifestVersion: 1 },
        updatedAt: new Date(),
      };
      let modelId: number;
      if (existing) {
        const [updated] = await tx.update(threedModels).set(values)
          .where(and(eq(threedModels.id, existing.id), eq(threedModels.userId, userId)))
          .returning({ id: threedModels.id });
        if (!updated) throw new Error('Owned Model disappeared during update');
        modelId = updated.id;
      } else {
        const [created] = await tx.insert(threedModels).values(values).returning({ id: threedModels.id });
        modelId = created.id;
      }

      const assigned = await tx.select({ categoryId: threedModelCategoryAssignments.categoryId })
        .from(threedModelCategoryAssignments)
        .where(and(
          eq(threedModelCategoryAssignments.userId, userId),
          eq(threedModelCategoryAssignments.modelId, modelId),
        ));
      const assignedIds = new Set(assigned.map(({ categoryId }) => categoryId));
      const missingCategoryIds = entry.categories.map((slug) => categoryIdsBySlug.get(slug)!)
        .filter((categoryId) => !assignedIds.has(categoryId));
      if (missingCategoryIds.length > 0) {
        await tx.insert(threedModelCategoryAssignments).values(missingCategoryIds.map((categoryId) => ({
          userId,
          modelId,
          categoryId,
        })));
      }

      const existingFiles = await tx.select({ id: threedModelFiles.id, metadata: threedModelFiles.metadata })
        .from(threedModelFiles)
        .where(and(eq(threedModelFiles.userId, userId), eq(threedModelFiles.modelId, modelId)));
      for (const [loadOrder, upload] of supportingUploads.entries()) {
        const classification = supportingFileType(upload.file.relativePath);
        const metadata = { importKey: entry.importKey, sourceRelativePath: upload.file.relativePath };
        const matching = existingFiles.find((file) => {
          const value = file.metadata;
          return value && typeof value === 'object' && !Array.isArray(value)
            && (value as Record<string, unknown>).importKey === entry.importKey
            && (value as Record<string, unknown>).sourceRelativePath === upload.file.relativePath;
        });
        const fileValues = {
          userId,
          modelId,
          fileName: path.basename(upload.file.relativePath),
          fileType: classification.fileType,
          textureType: classification.textureType,
          filePath: upload.url,
          fileSize: upload.file.size,
          metadata,
          isBinaryBuffer: classification.isBinaryBuffer,
          loadOrder,
          updatedAt: new Date(),
        };
        if (matching) await tx.update(threedModelFiles).set(fileValues).where(eq(threedModelFiles.id, matching.id));
        else await tx.insert(threedModelFiles).values(fileValues);
      }
      return modelId;
    });
    return { importKey: entry.importKey, modelId: result, operation: existing ? 'updated' : 'created' };
  } catch (error) {
    return { importKey: entry.importKey, operation: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const filePlan = await loadThreeDModelImportFilePlan(options.file);
  const unapproved = filePlan.plan.models.filter((model) => model.metadata.importReviewStatus !== 'approved');
  if (unapproved.length > 0) {
    throw new Error(`Import review is incomplete for: ${unapproved.map((model) => model.importKey).join(', ')}`);
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is required');
  const [targetUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, options.userId)).limit(1);
  if (!targetUser) throw new Error('Target user does not exist');

  const requiredSlugs = [...new Set(filePlan.plan.models.flatMap((model) => model.categories))];
  const categories = requiredSlugs.length === 0 ? [] : await db.select({
    id: threedModelCategories.id,
    slug: threedModelCategories.slug,
  }).from(threedModelCategories).where(and(
    eq(threedModelCategories.userId, options.userId),
    eq(threedModelCategories.isActive, true),
    inArray(threedModelCategories.slug, requiredSlugs),
  ));
  const categoryIdsBySlug = new Map(categories.map((category) => [category.slug, category.id]));
  const missingSlugs = requiredSlugs.filter((slug) => !categoryIdsBySlug.has(slug));
  if (missingSlugs.length > 0) throw new Error(`Missing active owned Model categories: ${missingSlugs.join(', ')}`);

  const results: ImportResult[] = [];
  for (const model of filePlan.models) results.push(await importModel(options.userId, model, categoryIdsBySlug));
  const report = {
    version: 1,
    manifestPath: filePlan.manifestPath,
    applied: options.apply,
    created: results.filter((result) => result.operation === 'created').length,
    updated: results.filter((result) => result.operation === 'updated').length,
    failed: results.filter((result) => result.operation === 'failed').length,
    results,
  };
  await writeFile(options.report, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'w' });
  console.log(`ThreeD Model import report: ${options.report}`);
  console.log(`Created: ${report.created}; Updated: ${report.updated}; Failed: ${report.failed}`);
  if (report.failed > 0) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
