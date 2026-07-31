// app/api/threed/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedModels,
  threedModelFiles,
} from '@/lib/schema/threed';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/models - List ThreeD Models
// Query Parameters:
//   - id (optional): Get a single model
//   - modelType (optional): Filter by model type
//   - status (optional): Filter by model status
//   - isActive (optional): Filter by active status
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

      // ✅ Fetch related model files
      const files = await db
        .select()
        .from(threedModelFiles)
        .where(eq(threedModelFiles.modelId, model.id))
        .orderBy(threedModelFiles.loadOrder);

      return NextResponse.json({
        success: true,
        data: {
          ...model,
          files: files || [],
        },
      });
    }

    // ✅ Build query
    let query = db
      .select()
      .from(threedModels)
      .where(eq(threedModels.userId, userId))
      .$dynamic();

    // ✅ Apply filters
    if (modelType) {
      query = query.where(eq(threedModels.modelType, modelType));
    }

    if (status) {
      query = query.where(eq(threedModels.status, status));
    }

    if (isActive !== null) {
      query = query.where(eq(threedModels.isActive, isActive === 'true'));
    }

    if (search) {
      query = query.where(
        sql`${threedModels.modelName} ILIKE ${`%${search}%`} OR 
            ${threedModels.modelType} ILIKE ${`%${search}%`}`
      );
    }

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedModels)
      .where(query._where);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const results = await query
      .orderBy(desc(threedModels.createdAt))
      .limit(limit)
      .offset(offset);

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
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: modelsWithFiles,
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
    console.log('📝 POST /api/threed/models - Request body:', body);

    const {
      modelName,
      modelType,
      filePath,
      fileSize,
      thumbnailUrl,
      scale,
      rotationY,
      offsetX,
      offsetY,
      offsetZ,
      hasLOD,
      lodLevels,
      animations,
      defaultAnimation,
      hasExternalFiles,
      textureCount,
      mainModelFileId,
      isActive,
      status,
      isDefault,
      uploadedBy,
      metadata,
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

    await ensureTableSequence('threed_models');

    const [newModel] = await db
      .insert(threedModels)
      .values({
        userId,
        modelName,
        modelType,
        filePath,
        fileSize: fileSize || null,
        thumbnailUrl: thumbnailUrl || null,
        scale: scale || '1.0',
        rotationY: rotationY || '0.0',
        offsetX: offsetX || '0.0',
        offsetY: offsetY || '0.0',
        offsetZ: offsetZ || '0.0',
        hasLOD: hasLOD ?? false,
        lodLevels: lodLevels || {},
        animations: animations || [],
        defaultAnimation: defaultAnimation || null,
        hasExternalFiles: hasExternalFiles ?? false,
        textureCount: textureCount || 0,
        mainModelFileId: mainModelFileId || null,
        isActive: isActive ?? true,
        status: status || 'active',
        isDefault: isDefault ?? false,
        uploadedBy: uploadedBy || null,
        metadata: metadata || {},
      })
      .returning();

    // ✅ If there are files associated with this model, add them
    if (body.files && body.files.length > 0) {
      for (const file of body.files) {
        await db.insert(threedModelFiles).values({
          userId,
          modelId: newModel.id,
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

    console.log('✅ ThreeD model created:', newModel);

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

    const [updated] = await db
      .update(threedModels)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedModels.id, parsedId),
          eq(threedModels.userId, userId)
        )
      )
      .returning();

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

    const [updated] = await db
      .update(threedModels)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(threedModels.id, parsedId),
          eq(threedModels.userId, userId)
        )
      )
      .returning();

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

    // ✅ Delete associated files first
    await db
      .delete(threedModelFiles)
      .where(eq(threedModelFiles.modelId, parsedId));

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

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
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