// app/api/threed/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedModels,
  threedModelFiles,
  threedModelCategories,
  threedModelCategoryAssignments,
} from '@/lib/schema/threed';
import { eq, and, or, desc, sql, inArray, asc, type SQL } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';
import { normalizeThreeDModelRelativePath } from '@/lib/services/threed/models/model-companion-core';
import { del } from '@vercel/blob';
import {
  isOwnedThreeDBlobUrl,
  runtimeModelTypeFromFileName,
} from '@/lib/services/threed/models/model-file-integrity';

type ModelWithFiles = typeof threedModels.$inferSelect & {
  files: Array<typeof threedModelFiles.$inferSelect>;
  categories: Array<Pick<typeof threedModelCategories.$inferSelect, 'id' | 'name' | 'slug' | 'parentId'>>;
};

type ModelCategory = ModelWithFiles['categories'][number];

function normalizeCategoryIds(value: unknown): number[] | null | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 50) return null;
  const ids = [...new Set(value.map(Number))];
  return ids.every((id) => Number.isInteger(id) && id > 0) ? ids : null;
}

async function validateOwnedCategoryIds(userId: string, value: unknown): Promise<number[] | null | undefined> {
  const ids = normalizeCategoryIds(value);
  if (ids === undefined || ids === null || ids.length === 0) return ids;
  const rows = await db.select({ id: threedModelCategories.id }).from(threedModelCategories).where(and(
    eq(threedModelCategories.userId, userId),
    inArray(threedModelCategories.id, ids),
  ));
  return rows.length === ids.length ? ids : null;
}

async function loadCategoriesByModelIds(modelIds: number[]): Promise<Map<number, ModelCategory[]>> {
  const byModel = new Map<number, ModelCategory[]>();
  if (modelIds.length === 0) return byModel;
  const rows = await db
    .select({
      modelId: threedModelCategoryAssignments.modelId,
      id: threedModelCategories.id,
      name: threedModelCategories.name,
      slug: threedModelCategories.slug,
      parentId: threedModelCategories.parentId,
    })
    .from(threedModelCategoryAssignments)
    .innerJoin(threedModelCategories, eq(threedModelCategoryAssignments.categoryId, threedModelCategories.id))
    .where(inArray(threedModelCategoryAssignments.modelId, modelIds))
    .orderBy(asc(threedModelCategories.sortOrder), asc(threedModelCategories.name));
  for (const row of rows) {
    const categories = byModel.get(row.modelId) ?? [];
    categories.push({ id: row.id, name: row.name, slug: row.slug, parentId: row.parentId });
    byModel.set(row.modelId, categories);
  }
  return byModel;
}

async function updateModelAndCategories(
  userId: string,
  modelId: number,
  updates: Partial<typeof threedModels.$inferInsert>,
  categoryIds: number[] | undefined,
  primaryFile?: PendingPrimaryModelFile,
) {
  return db.transaction(async (tx) => {
    if (primaryFile) {
      const [createdFile] = await tx.insert(threedModelFiles).values({
        userId,
        modelId,
        fileName: primaryFile.fileName,
        relativePath: primaryFile.relativePath,
        fileType: 'model',
        textureType: null,
        filePath: primaryFile.filePath,
        fileSize: primaryFile.fileSize,
        isBinaryBuffer: false,
        loadOrder: 0,
      }).returning();
      updates.mainModelFileId = createdFile.id;
      updates.filePath = createdFile.filePath;
      updates.fileSize = createdFile.fileSize;
      updates.modelType = runtimeModelTypeFromFileName(createdFile.fileName) ?? updates.modelType;
      updates.hasExternalFiles = true;
    }
    const [updated] = await tx.update(threedModels).set({
      ...updates,
      updatedAt: new Date(),
    }).where(and(
      eq(threedModels.id, modelId),
      eq(threedModels.userId, userId),
    )).returning();
    if (categoryIds !== undefined) {
      await tx.delete(threedModelCategoryAssignments).where(and(
        eq(threedModelCategoryAssignments.userId, userId),
        eq(threedModelCategoryAssignments.modelId, modelId),
      ));
      if (categoryIds.length > 0) {
        await tx.insert(threedModelCategoryAssignments).values(categoryIds.map((categoryId) => ({
          userId,
          modelId,
          categoryId,
        })));
      }
    }
    return updated;
  });
}

function normalizeThumbnailUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2000) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return undefined;
    if (!/\.(?:jpe?g|png|webp)$/i.test(url.pathname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

interface PendingPrimaryModelFile {
  fileName: string;
  relativePath: string;
  filePath: string;
  fileSize: number;
  modelType: string;
}

function normalizePendingPrimaryFile(
  value: unknown,
  expectedPath: unknown,
  expectedType: unknown,
  expectedSize: unknown,
): PendingPrimaryModelFile | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['fileName', 'filePath', 'fileSize', 'modelType'].includes(key))) return null;
  const fileName = typeof input.fileName === 'string' ? input.fileName.trim() : '';
  const relativePath = normalizeThreeDModelRelativePath(fileName);
  const filePath = typeof input.filePath === 'string' ? input.filePath : '';
  const modelType = typeof input.modelType === 'string' ? input.modelType : '';
  const fileSize = Number(input.fileSize);
  if (
    !fileName
    || fileName.length > 255
    || !relativePath
    || filePath !== expectedPath
    || modelType !== expectedType
    || !Number.isSafeInteger(fileSize)
    || fileSize <= 0
    || fileSize !== Number(expectedSize)
  ) return null;
  try {
    if (new URL(filePath).protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { fileName, relativePath, filePath, fileSize, modelType };
}

function serializeLibraryModel(model: ModelWithFiles) {
  return {
    id: model.id,
    modelName: model.modelName,
    modelType: model.modelType,
    filePath: model.filePath,
    fileSize: model.fileSize,
    thumbnailUrl: model.thumbnailUrl,
    usedByPlants: model.usedByPlants,
    usedByCharacters: model.usedByCharacters,
    scale: model.scale,
    rotationY: model.rotationY,
    offsetX: model.offsetX,
    offsetY: model.offsetY,
    offsetZ: model.offsetZ,
    hasLOD: model.hasLOD,
    lodLevels: model.lodLevels,
    animations: model.animations,
    defaultAnimation: model.defaultAnimation,
    hasExternalFiles: model.hasExternalFiles,
    textureCount: model.textureCount,
    mainModelFileId: model.mainModelFileId,
    isActive: model.isActive,
    status: model.status,
    isDefault: model.isDefault,
    isPublic: model.isPublic,
    isLibraryItem: model.isLibraryItem,
    categories: model.categories,
    files: model.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      relativePath: file.relativePath || file.fileName,
      fileType: file.fileType,
      textureType: file.textureType,
      filePath: file.filePath,
      fileSize: file.fileSize,
      isBinaryBuffer: file.isBinaryBuffer,
      loadOrder: file.loadOrder,
    })),
  };
}

// ============================================
// GET /api/threed/models - List ThreeD Models
// Query Parameters:
//   - id (optional): Get a single model
//   - modelType (optional): Filter by model type
//   - status (optional): Filter by model status
//   - isActive (optional): Filter by active status
//   - scope=library: Public non-Character models eligible for direct placement
//   - category (optional): Filter by assigned category slug
//   - search (optional): Search by modelName or modelType
//   - limit (optional): Number of records (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const modelType = searchParams.get('modelType');
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const scope = searchParams.get('scope');
    const category = searchParams.get('category')?.trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Get a single model by ID
    if (id) {
      const [model] = await db
        .select()
        .from(threedModels)
        .where(
          and(
            eq(threedModels.id, parseInt(id)),
            or(
              eq(threedModels.userId, userId),
              and(
                eq(threedModels.isPublic, true),
                eq(threedModels.isLibraryItem, true),
                eq(threedModels.isActive, true),
                eq(threedModels.status, 'active'),
              ),
            ),
          )
        )
        .limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }

      // ✅ Fetch related model files
      const files = await db
        .select()
        .from(threedModelFiles)
        .where(eq(threedModelFiles.modelId, model.id))
        .orderBy(threedModelFiles.loadOrder);

      const categoriesByModel = await loadCategoriesByModelIds([model.id]);
      const modelWithFiles = { ...model, files: files || [], categories: categoriesByModel.get(model.id) ?? [] };
      const canManage = model.userId === userId;
      return NextResponse.json({
        success: true,
        data: canManage
          ? modelWithFiles
          : serializeLibraryModel(modelWithFiles),
      });
    }

    type ModelType = (typeof threedModels.$inferSelect)['modelType'];
    type ModelStatus = NonNullable<(typeof threedModels.$inferSelect)['status']>;
    const conditions: SQL[] = scope === 'library'
      ? [
          eq(threedModels.isPublic, true),
          eq(threedModels.isLibraryItem, true),
          eq(threedModels.isActive, true),
          eq(threedModels.status, 'active'),
          sql`${threedModels.usedByCharacters} IS NOT TRUE`,
        ]
      : [eq(threedModels.userId, userId)];

    // ✅ Apply filters
    if (modelType) {
      conditions.push(eq(threedModels.modelType, modelType as ModelType));
    }

    if (status) {
      conditions.push(eq(threedModels.status, status as ModelStatus));
    }

    if (isActive !== null) {
      conditions.push(eq(threedModels.isActive, isActive === 'true'));
    }

    if (search) {
      conditions.push(
        sql`${threedModels.modelName} ILIKE ${`%${search}%`} OR 
            ${threedModels.modelType} ILIKE ${`%${search}%`}`
      );
    }

    if (category) {
      conditions.push(sql`exists (
        select 1
        from ${threedModelCategoryAssignments}
        inner join ${threedModelCategories}
          on ${threedModelCategories.id} = ${threedModelCategoryAssignments.categoryId}
        where ${threedModelCategoryAssignments.modelId} = ${threedModels.id}
          and ${threedModelCategories.slug} = ${category}
          and ${threedModelCategories.isActive} = true
      )`);
    }

    const where = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedModels)
      .where(where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await db
      .select()
      .from(threedModels)
      .where(where)
      .orderBy(desc(threedModels.createdAt))
      .limit(limit)
      .offset(offset);

    const categoriesByModel = await loadCategoriesByModelIds(results.map((model) => model.id));

    // ✅ Fetch related model files for each model
    const modelsWithFiles = await Promise.all(
      results.map(async (model) => {
        const files = await db
          .select()
          .from(threedModelFiles)
          .where(eq(threedModelFiles.modelId, model.id))
          .orderBy(threedModelFiles.loadOrder);

        return {
          ...model,
          files: files || [],
          categories: categoriesByModel.get(model.id) ?? [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: scope === 'library'
        ? modelsWithFiles.map(serializeLibraryModel)
        : modelsWithFiles,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/models - Create ThreeD Model
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      modelName,
      modelType,
      filePath,
      fileSize,
      thumbnailUrl,
      usedByPlants,
      usedByCharacters,
      scale,
      rotationY,
      offsetX,
      offsetY,
      offsetZ,
      hasLOD,
      lodLevels,
      animations,
      defaultAnimation,
      isActive,
      status,
      isDefault,
      isPublic,
      isLibraryItem,
      uploadedBy,
      metadata,
      categoryIds: requestedCategoryIds,
      primaryFile: requestedPrimaryFile,
    } = body;

    // ✅ Validate required fields
    if (!modelName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: modelName' },
        { status: 400 }
      );
    }

    if (!modelType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: modelType' },
        { status: 400 }
      );
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: filePath' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const categoryIds = await validateOwnedCategoryIds(userId, requestedCategoryIds);
    if (categoryIds === null) {
      return NextResponse.json(
        { success: false, error: 'One or more Model categories are invalid' },
        { status: 400 },
      );
    }
    const normalizedThumbnailUrl = normalizeThumbnailUrl(thumbnailUrl);
    if (thumbnailUrl !== undefined && normalizedThumbnailUrl === undefined) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail URL must be an HTTPS JPG, PNG, or WebP image' },
        { status: 400 },
      );
    }
    const primaryFile = normalizePendingPrimaryFile(
      requestedPrimaryFile,
      filePath,
      modelType,
      fileSize,
    );
    if (primaryFile === null) {
      return NextResponse.json(
        { success: false, error: 'Uploaded primary Model file does not match this Model configuration' },
        { status: 400 },
      );
    }

    await ensureTableSequence('threed_models');
    if (primaryFile) await ensureTableSequence('threed_model_files');

    const newModel = await db.transaction(async (tx) => {
      const [createdModel] = await tx.insert(threedModels).values({
        userId,
        modelName,
        modelType,
        filePath,
        fileSize: fileSize || null,
        thumbnailUrl: normalizedThumbnailUrl ?? null,
        usedByPlants: usedByPlants ?? false,
        usedByCharacters: usedByCharacters ?? false,
        scale: scale || '1.0',
        rotationY: rotationY || '0.0',
        offsetX: offsetX || '0.0',
        offsetY: offsetY || '0.0',
        offsetZ: offsetZ || '0.0',
        hasLOD: hasLOD ?? false,
        lodLevels: lodLevels || {},
        animations: animations || [],
        defaultAnimation: defaultAnimation || null,
        hasExternalFiles: Boolean(primaryFile) || (Array.isArray(body.files) && body.files.length > 0),
        textureCount: Array.isArray(body.files)
          ? body.files.filter((file: { fileType?: unknown }) => file?.fileType === 'texture').length
          : 0,
        mainModelFileId: null,
        isActive: isActive ?? true,
        status: status || 'active',
        isDefault: isDefault ?? false,
        isPublic: isPublic ?? false,
        isLibraryItem: isLibraryItem ?? false,
        uploadedBy: uploadedBy || null,
        metadata: metadata || {},
      }).returning();

      let completedModel = createdModel;

      if (categoryIds && categoryIds.length > 0) {
        await tx.insert(threedModelCategoryAssignments).values(categoryIds.map((categoryId) => ({
          userId,
          modelId: createdModel.id,
          categoryId,
        })));
      }

      if (primaryFile) {
        const [createdFile] = await tx.insert(threedModelFiles).values({
          userId,
          modelId: createdModel.id,
          fileName: primaryFile.fileName,
          relativePath: primaryFile.relativePath,
          fileType: 'model',
          textureType: null,
          filePath: primaryFile.filePath,
          fileSize: primaryFile.fileSize,
          isBinaryBuffer: false,
          loadOrder: 0,
        }).returning();
        const [synchronizedModel] = await tx.update(threedModels).set({
          hasExternalFiles: true,
          mainModelFileId: createdFile.id,
          updatedAt: new Date(),
        }).where(and(
          eq(threedModels.id, createdModel.id),
          eq(threedModels.userId, userId),
        )).returning();
        completedModel = synchronizedModel;
      }

      if (Array.isArray(body.files) && body.files.length > 0) {
        for (const file of body.files) {
          await tx.insert(threedModelFiles).values({
            userId,
            modelId: createdModel.id,
            fileName: file.fileName,
            fileType: file.fileType,
            textureType: file.textureType || null,
            filePath: file.filePath,
            fileSize: file.fileSize || null,
            isBinaryBuffer: file.isBinaryBuffer || false,
            loadOrder: file.loadOrder || 0,
          });
        }
      }
      return completedModel;
    });

    return NextResponse.json({
      success: true,
      data: newModel,
      message: 'Model created successfully',
    });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create model' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/models/files - Add file to a model
// ============================================
export async function POST_files(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { modelId, fileName, fileType, textureType, filePath, fileSize, isBinaryBuffer, loadOrder } = body;

    if (!modelId || !fileName || !fileType || !filePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: modelId, fileName, fileType, filePath' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Verify model exists and belongs to user
    const [model] = await db
      .select()
      .from(threedModels)
      .where(
        and(
          eq(threedModels.id, parseInt(modelId)),
          eq(threedModels.userId, userId)
        )
      )
      .limit(1);

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    await ensureTableSequence('threed_model_files');

    const [newFile] = await db
      .insert(threedModelFiles)
      .values({
        userId,
        modelId: parseInt(modelId),
        fileName,
        fileType,
        textureType: textureType || null,
        filePath,
        fileSize: fileSize || null,
        isBinaryBuffer: isBinaryBuffer || false,
        loadOrder: loadOrder || 0,
      })
      .returning();

    console.log('✅ ThreeD model file added:', newFile);

    return NextResponse.json({
      success: true,
      data: newFile,
      message: 'File added to model successfully',
    });
  } catch (error) {
    console.error('Error adding file to model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add file to model' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/models?id=1 - Full update
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify model exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedModels)
      .where(
        and(
          eq(threedModels.id, parsedId),
          eq(threedModels.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    const {
      id: _bodyId,
      userId: _bodyUserId,
      createdAt: _createdAt,
      categories: _categories,
      categoryIds: requestedCategoryIds,
      files: _files,
      mainModelFileId: _mainModelFileId,
      hasExternalFiles: _hasExternalFiles,
      textureCount: _textureCount,
      ...updates
    } = body;
    const categoryIds = await validateOwnedCategoryIds(userId, requestedCategoryIds);
    if (categoryIds === null) {
      return NextResponse.json({ success: false, error: 'One or more Model categories are invalid' }, { status: 400 });
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'thumbnailUrl')) {
      const normalizedThumbnailUrl = normalizeThumbnailUrl(updates.thumbnailUrl);
      if (normalizedThumbnailUrl === undefined) {
        return NextResponse.json(
          { success: false, error: 'Thumbnail URL must be an HTTPS JPG, PNG, or WebP image' },
          { status: 400 },
        );
      }
      updates.thumbnailUrl = normalizedThumbnailUrl;
    }
    const updated = await updateModelAndCategories(userId, parsedId, updates, categoryIds);

    console.log('✅ ThreeD model updated:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Model updated successfully',
    });
  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/threed/models?id=1 - Partial update
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify model exists and belongs to user
    const [existing] = await db
      .select()
      .from(threedModels)
      .where(
        and(
          eq(threedModels.id, parsedId),
          eq(threedModels.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    const {
      id: _bodyId,
      userId: _bodyUserId,
      createdAt: _createdAt,
      categories: _categories,
      categoryIds: requestedCategoryIds,
      files: _files,
      primaryFile: requestedPrimaryFile,
      mainModelFileId: requestedPrimaryFileId,
      hasExternalFiles: _hasExternalFiles,
      textureCount: _textureCount,
      ...updates
    } = body;
    const pendingPrimaryFile = normalizePendingPrimaryFile(
      requestedPrimaryFile,
      updates.filePath,
      updates.modelType,
      updates.fileSize,
    );
    if (pendingPrimaryFile === null) {
      return NextResponse.json(
        { success: false, error: 'Uploaded primary Model file does not match this Model configuration' },
        { status: 400 },
      );
    }
    if (!pendingPrimaryFile && requestedPrimaryFileId !== undefined && requestedPrimaryFileId !== null && requestedPrimaryFileId !== '') {
      const primaryFileId = Number(requestedPrimaryFileId);
      if (!Number.isInteger(primaryFileId) || primaryFileId <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid primary Model file ID' }, { status: 400 });
      }
      const [primaryFile] = await db.select().from(threedModelFiles).where(and(
        eq(threedModelFiles.id, primaryFileId),
        eq(threedModelFiles.modelId, parsedId),
        eq(threedModelFiles.userId, userId),
        eq(threedModelFiles.fileType, 'model'),
      )).limit(1);
      if (!primaryFile) {
        return NextResponse.json(
          { success: false, error: 'Primary file must be a Model attachment owned by this Model' },
          { status: 400 },
        );
      }
      updates.mainModelFileId = primaryFile.id;
      updates.filePath = primaryFile.filePath;
      updates.fileSize = primaryFile.fileSize;
      updates.modelType = runtimeModelTypeFromFileName(primaryFile.fileName) ?? existing.modelType;
    }
    const categoryIds = await validateOwnedCategoryIds(userId, requestedCategoryIds);
    if (categoryIds === null) {
      return NextResponse.json({ success: false, error: 'One or more Model categories are invalid' }, { status: 400 });
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'thumbnailUrl')) {
      const normalizedThumbnailUrl = normalizeThumbnailUrl(updates.thumbnailUrl);
      if (normalizedThumbnailUrl === undefined) {
        return NextResponse.json(
          { success: false, error: 'Thumbnail URL must be an HTTPS JPG, PNG, or WebP image' },
          { status: 400 },
        );
      }
      updates.thumbnailUrl = normalizedThumbnailUrl;
    }
    if (pendingPrimaryFile) await ensureTableSequence('threed_model_files');
    const updated = await updateModelAndCategories(
      userId,
      parsedId,
      updates,
      categoryIds,
      pendingPrimaryFile,
    );

    console.log('✅ ThreeD model patched:', updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Model updated successfully',
    });
  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/models?id=1 - Delete model
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedModels)
      .where(and(
        eq(threedModels.id, parsedId),
        eq(threedModels.userId, userId),
      ))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    const attachedFiles = await db.select({ filePath: threedModelFiles.filePath })
      .from(threedModelFiles)
      .where(and(
        eq(threedModelFiles.modelId, parsedId),
        eq(threedModelFiles.userId, userId),
      ));

    const deleted = await db.transaction(async (tx) => {
      await tx.delete(threedModelFiles).where(and(
        eq(threedModelFiles.modelId, parsedId),
        eq(threedModelFiles.userId, userId),
      ));
      const [record] = await tx.delete(threedModels).where(and(
        eq(threedModels.id, parsedId),
        eq(threedModels.userId, userId),
      )).returning();
      return record;
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }


    const candidateBlobUrls = new Set([
      existing.filePath,
      existing.thumbnailUrl,
      ...attachedFiles.map((file) => file.filePath),
    ].filter((value): value is string => Boolean(value)));
    let deletedBlobCount = 0;
    for (const blobUrl of candidateBlobUrls) {
      if (!isOwnedThreeDBlobUrl(blobUrl, { modelId: parsedId, userId })) continue;
      const [modelReference, fileReference] = await Promise.all([
        db.select({ id: threedModels.id }).from(threedModels)
          .where(eq(threedModels.filePath, blobUrl)).limit(1),
        db.select({ id: threedModelFiles.id }).from(threedModelFiles)
          .where(eq(threedModelFiles.filePath, blobUrl)).limit(1),
      ]);
      if (modelReference.length > 0 || fileReference.length > 0) continue;
      try {
        await del(blobUrl);
        deletedBlobCount += 1;
      } catch (blobError) {
        console.warn(`Failed to delete Blob after deleting ThreeD Model ${parsedId}:`, blobError);
      }
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      cleanup: { deletedBlobCount },
      message: 'Model deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/models/files - Delete a model file
// ============================================
export async function DELETE_files(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'Missing fileId parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedFileId = parseInt(fileId);

    if (isNaN(parsedFileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(threedModelFiles)
      .where(
        and(
          eq(threedModelFiles.id, parsedFileId),
          eq(threedModelFiles.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting model file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete model file' },
      { status: 500 }
    );
  }
}
