// app/api/threed/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedModels, threed } from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/models
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleId = searchParams.get('moduleId');
    const isActive = searchParams.get('isActive');
    const modelType = searchParams.get('modelType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get a single model by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid model ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedModels)
        .where(eq(threedModels.id, parsedId));

      if (!userId) {
        query = query.where(eq(threedModels.isActive, true));
      } else {
        query = query.where(
          or(
            eq(threedModels.userId, userId),
            eq(threedModels.isActive, true)
          )
        );
      }

      const [model] = await query.limit(1);

      if (!model) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }

      // ✅ Get project asset associations
      const assetAssociations = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.assetType, 'threed_models'),
            eq(projectAssets.assetId, model.id),
            eq(projectAssets.userId, userId || '')
          )
        );

      return NextResponse.json({
        success: true,
        data: {
          ...model,
          projectAssets: assetAssociations,
        },
      });
    }

    // ✅ Get models for a specific ThreeD module (via project_assets)
    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (isNaN(parsedModuleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid module ID' },
          { status: 400 }
        );
      }

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // ✅ Get models via project_assets junction
      const results = await db
        .select()
        .from(threedModels)
        .innerJoin(
          projectAssets,
          and(
            eq(projectAssets.assetId, threedModels.id),
            eq(projectAssets.assetType, 'threed_models'),
            eq(projectAssets.moduleId, parsedModuleId),
            eq(projectAssets.moduleType, 'threed'),
            eq(projectAssets.userId, userId)
          )
        )
        .orderBy(desc(threedModels.createdAt));

      const models = results.map((row) => ({
        ...row.threedModels,
        projectAssetConfig: row.projectAssets.config,
        isActiveInProject: row.projectAssets.isActive,
        projectAssetId: row.projectAssets.id,
      }));

      return NextResponse.json({
        success: true,
        data: models,
        count: models.length,
      });
    }

    // ✅ List all models
    let query = db
      .select()
      .from(threedModels)
      .$dynamic();

    if (!userId) {
      query = query.where(eq(threedModels.isActive, true));
    } else {
      query = query.where(
        or(
          eq(threedModels.userId, userId),
          eq(threedModels.isActive, true)
        )
      );
    }

    if (isActive !== null) {
      query = query.where(eq(threedModels.isActive, isActive === 'true'));
    }
    if (modelType) {
      query = query.where(eq(threedModels.modelType, modelType));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedModels)
      .where(query._where);

    const models = await query
      .orderBy(desc(threedModels.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: models,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Models API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/models - Create a new model
// ============================================
export async function POST(request: NextRequest) {
  try {
    // ✅ Check content type to handle both JSON and FormData
    const contentType = request.headers.get('content-type') || '';
    
    let body: any;
    let isFormData = false;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (for file uploads)
      isFormData = true;
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      // ✅ For file uploads, extract the file path from the file object
      if (body.file && body.file instanceof File) {
        body.filePath = body.filePath || `/uploads/models/${body.file.name}`;
      }
    } else {
      // Handle JSON
      body = await request.json();
    }

    console.log('[Models API] POST body:', body);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ✅ Required fields
    if (!body.modelName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: modelName' },
        { status: 400 }
      );
    }

    if (!body.filePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: filePath' },
        { status: 400 }
      );
    }

    // ✅ Create the model (free-standing, no module ID)
    await ensureTableSequence('threed_models');

    const [newModel] = await db
      .insert(threedModels)
      .values({
        userId,
        modelName: body.modelName.trim(),
        modelType: body.modelType || 'custom',
        filePath: body.filePath.trim(),
        fileSize: body.fileSize ? parseInt(body.fileSize) : null,
        thumbnailUrl: body.thumbnailUrl || null,
        scale: body.scale ? parseFloat(body.scale) : 1,
        rotationY: body.rotationY ? parseFloat(body.rotationY) : 0,
        offsetX: body.offsetX ? parseFloat(body.offsetX) : 0,
        offsetY: body.offsetY ? parseFloat(body.offsetY) : 0,
        offsetZ: body.offsetZ ? parseFloat(body.offsetZ) : 0,
        hasLOD: body.hasLOD === 'true' || body.hasLOD === true,
        lodLevels: body.lodLevels || {},
        animations: body.animations ? (typeof body.animations === 'string' ? JSON.parse(body.animations) : body.animations) : [],
        defaultAnimation: body.defaultAnimation || null,
        hasExternalFiles: body.hasExternalFiles === 'true' || body.hasExternalFiles === true,
        textureCount: body.textureCount ? parseInt(body.textureCount) : 0,
        isActive: body.isActive !== 'false' && body.isActive !== false,
        isDefault: body.isDefault === 'true' || body.isDefault === true,
        uploadedBy: body.uploadedBy || null,
        uploadedAt: new Date(),
        usedByPlants: body.usedByPlants === 'true' || body.usedByPlants === true,
        usedByCharacters: body.usedByCharacters === 'true' || body.usedByCharacters === true,
        metadata: body.metadata || {},
      })
      .returning();

    // ✅ If moduleId is provided, create project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';
      
      // Verify module exists
      const [module] = await db
        .select()
        .from(threed)
        .where(
          and(
            eq(threed.id, parsedModuleId),
            eq(threed.userId, userId)
          )
        )
        .limit(1);

      if (module) {
        await ensureTableSequence('project_assets');
        await db.insert(projectAssets).values({
          userId,
          projectId: module.projectId || null,
          moduleId: parsedModuleId,
          moduleType: moduleType,
          assetType: 'threed_models',
          assetId: newModel.id,
          config: body.assetConfig || {},
          isActive: true,
        });
        console.log('[Models API] Created project_assets association for model:', newModel.id);
      }
    }

    console.log('[Models API] Created model:', newModel.id, newModel.modelName);

    return NextResponse.json({
      success: true,
      data: newModel,
      message: 'Model created successfully',
    });
  } catch (error) {
    console.error('[Models API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create model', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/models - Update a model
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing model ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    // ✅ Check if model exists and belongs to user
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

    const body = await request.json();

    // ✅ Update the model
    const [updated] = await db
      .update(threedModels)
      .set({
        modelName: body.modelName?.trim() || existing.modelName,
        modelType: body.modelType || existing.modelType,
        filePath: body.filePath?.trim() || existing.filePath,
        fileSize: body.fileSize !== undefined ? parseInt(body.fileSize) : existing.fileSize,
        thumbnailUrl: body.thumbnailUrl !== undefined ? body.thumbnailUrl : existing.thumbnailUrl,
        scale: body.scale !== undefined ? parseFloat(body.scale) : existing.scale,
        rotationY: body.rotationY !== undefined ? parseFloat(body.rotationY) : existing.rotationY,
        offsetX: body.offsetX !== undefined ? parseFloat(body.offsetX) : existing.offsetX,
        offsetY: body.offsetY !== undefined ? parseFloat(body.offsetY) : existing.offsetY,
        offsetZ: body.offsetZ !== undefined ? parseFloat(body.offsetZ) : existing.offsetZ,
        hasLOD: body.hasLOD !== undefined ? body.hasLOD : existing.hasLOD,
        lodLevels: body.lodLevels || existing.lodLevels,
        animations: body.animations || existing.animations,
        defaultAnimation: body.defaultAnimation !== undefined ? body.defaultAnimation : existing.defaultAnimation,
        hasExternalFiles: body.hasExternalFiles !== undefined ? body.hasExternalFiles : existing.hasExternalFiles,
        textureCount: body.textureCount !== undefined ? parseInt(body.textureCount) : existing.textureCount,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        isDefault: body.isDefault !== undefined ? body.isDefault : existing.isDefault,
        uploadedBy: body.uploadedBy || existing.uploadedBy,
        usedByPlants: body.usedByPlants !== undefined ? body.usedByPlants : existing.usedByPlants,
        usedByCharacters: body.usedByCharacters !== undefined ? body.usedByCharacters : existing.usedByCharacters,
        metadata: body.metadata || existing.metadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedModels.id, parsedId),
          eq(threedModels.userId, userId)
        )
      )
      .returning();

    // ✅ Handle project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      const moduleType = body.moduleType || 'threed';
      
      // Check if association exists
      const [existingAsset] = await db
        .select()
        .from(projectAssets)
        .where(
          and(
            eq(projectAssets.assetType, 'threed_models'),
            eq(projectAssets.assetId, parsedId),
            eq(projectAssets.moduleId, parsedModuleId),
            eq(projectAssets.moduleType, moduleType),
            eq(projectAssets.userId, userId)
          )
        )
        .limit(1);

      if (existingAsset) {
        // Update existing association
        await db
          .update(projectAssets)
          .set({
            config: body.assetConfig || existingAsset.config,
            updatedAt: new Date(),
          })
          .where(eq(projectAssets.id, existingAsset.id));
        console.log('[Models API] Updated project_assets association for model:', parsedId);
      } else {
        // Create new association
        await ensureTableSequence('project_assets');
        
        // Get the module to find projectId
        const [module] = await db
          .select()
          .from(threed)
          .where(
            and(
              eq(threed.id, parsedModuleId),
              eq(threed.userId, userId)
            )
          )
          .limit(1);

        await db.insert(projectAssets).values({
          userId,
          projectId: module?.projectId || null,
          moduleId: parsedModuleId,
          moduleType: moduleType,
          assetType: 'threed_models',
          assetId: parsedId,
          config: body.assetConfig || {},
          isActive: true,
        });
        console.log('[Models API] Created project_assets association for model:', parsedId);
      }
    }

    console.log('[Models API] Updated model:', updated.id, updated.modelName);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Model updated successfully',
    });
  } catch (error) {
    console.error('[Models API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/models - Delete a model
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing model ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    // ✅ Check if model exists and belongs to user
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

    // ✅ Delete project_assets associations first
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_models'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the model
    const [deleted] = await db
      .delete(threedModels)
      .where(
        and(
          eq(threedModels.id, parsedId),
          eq(threedModels.userId, userId)
        )
      )
      .returning();

    console.log('[Models API] Deleted model:', deleted.id, deleted.modelName);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Model deleted successfully',
    });
  } catch (error) {
    console.error('[Models API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}