// src/app/api/threed/models/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedModels, threedPlants, threedModelFiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { del } from '@vercel/blob';

// GET /api/threed/models/[id] - Get a specific model with all its files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelId = parseInt(id);
    
    if (isNaN(modelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    const [model] = await db.select({
      id: threedModels.id,
      plantId: threedModels.plantId,
      modelName: threedModels.modelName,
      modelType: threedModels.modelType,
      filePath: threedModels.filePath,
      fileSize: threedModels.fileSize,
      scale: threedModels.scale,
      rotationY: threedModels.rotationY,
      offsetX: threedModels.offsetX,
      offsetY: threedModels.offsetY,
      offsetZ: threedModels.offsetZ,
      hasLOD: threedModels.hasLOD,
      lodLevels: threedModels.lodLevels,
      animations: threedModels.animations,
      defaultAnimation: threedModels.defaultAnimation,
      hasExternalFiles: threedModels.hasExternalFiles,
      textureCount: threedModels.textureCount,
      isActive: threedModels.isActive,
      isDefault: threedModels.isDefault,
      metadata: threedModels.metadata,
      createdAt: threedModels.createdAt,
      updatedAt: threedModels.updatedAt,
      plant: {
        id: threedPlants.id,
        commonName: threedPlants.commonName,
        scientificName: threedPlants.scientificName,
        plantId: threedPlants.plantId,
      }
    })
    .from(threedModels)
    .leftJoin(threedPlants, eq(threedModels.plantId, threedPlants.id))
    .where(eq(threedModels.id, modelId))
    .limit(1);

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    // Get associated files
    const files = await db.select()
      .from(threedModelFiles)
      .where(eq(threedModelFiles.modelId, modelId))
      .orderBy(threedModelFiles.loadOrder);

    return NextResponse.json({
      success: true,
      data: {
        ...model,
        files,
        mainModelFile: files.find(f => f.fileType === 'model'),
        textures: files.filter(f => f.fileType === 'texture'),
        binaries: files.filter(f => f.fileType === 'binary'),
      },
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch model' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/models/[id] - Update a model
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelId = parseInt(id);
    
    if (isNaN(modelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      modelName,
      scale,
      rotationY,
      offsetX,
      offsetY,
      offsetZ,
      isDefault,
      hasLOD,
      lodLevels,
      animations,
      defaultAnimation,
      isActive,
      metadata,
    } = body;

    // Check if model exists
    const [existingModel] = await db.select()
      .from(threedModels)
      .where(eq(threedModels.id, modelId))
      .limit(1);

    if (!existingModel) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset any existing default for this plant
    if (isDefault && !existingModel.isDefault) {
      await db.update(threedModels)
        .set({ isDefault: false })
        .where(eq(threedModels.plantId, existingModel.plantId));
    }

    // Update model
    const [updatedModel] = await db.update(threedModels)
      .set({
        modelName: modelName || existingModel.modelName,
        scale: scale !== undefined ? scale.toString() : existingModel.scale,
        rotationY: rotationY !== undefined ? rotationY.toString() : existingModel.rotationY,
        offsetX: offsetX !== undefined ? offsetX.toString() : existingModel.offsetX,
        offsetY: offsetY !== undefined ? offsetY.toString() : existingModel.offsetY,
        offsetZ: offsetZ !== undefined ? offsetZ.toString() : existingModel.offsetZ,
        hasLOD: hasLOD !== undefined ? hasLOD : existingModel.hasLOD,
        lodLevels: lodLevels || existingModel.lodLevels,
        animations: animations || existingModel.animations,
        defaultAnimation: defaultAnimation || existingModel.defaultAnimation,
        isActive: isActive !== undefined ? isActive : existingModel.isActive,
        isDefault: isDefault !== undefined ? isDefault : existingModel.isDefault,
        metadata: metadata || existingModel.metadata,
        updatedAt: new Date(),
      })
      .where(eq(threedModels.id, modelId))
      .returning();

    // Update plant reference if this is the default model
    if (updatedModel.isDefault) {
      await db.update(threedPlants)
        .set({
          modelType: updatedModel.modelType as any,
          modelPath: updatedModel.filePath,
          isCustomModel: true,
          modelMetadata: {
            scale: updatedModel.scale,
            rotationY: updatedModel.rotationY,
            offsets: {
              x: updatedModel.offsetX,
              y: updatedModel.offsetY,
              z: updatedModel.offsetZ,
            },
            animations: updatedModel.animations,
            defaultAnimation: updatedModel.defaultAnimation,
          },
          updatedAt: new Date(),
        })
        .where(eq(threedPlants.id, updatedModel.plantId));
    }

    return NextResponse.json({
      success: true,
      data: updatedModel,
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

// DELETE /api/threed/models/[id] - Delete a specific model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelId = parseInt(id);
    
    if (isNaN(modelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    // Get model info first
    const [model] = await db.select()
      .from(threedModels)
      .where(eq(threedModels.id, modelId))
      .limit(1);

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    // Get all associated files
    const files = await db.select()
      .from(threedModelFiles)
      .where(eq(threedModelFiles.modelId, modelId));

    // Delete all files from Vercel Blob
    for (const file of files) {
      try {
        await del(file.filePath);
      } catch (blobError) {
        console.warn(`Failed to delete blob for file ${file.id}:`, blobError);
      }
    }

    // Delete model files from database
    await db.delete(threedModelFiles)
      .where(eq(threedModelFiles.modelId, modelId));

    // Delete main model file from Vercel Blob
    try {
      await del(model.filePath);
    } catch (blobError) {
      console.warn(`Failed to delete blob for model ${modelId}:`, blobError);
    }

    // Delete model from database
    await db.delete(threedModels)
      .where(eq(threedModels.id, modelId));

    // Reset plant's model if this was the default
    if (model.isDefault) {
      await db.update(threedPlants)
        .set({
          modelType: 'procedural',
          modelPath: null,
          isCustomModel: false,
          modelMetadata: {},
          updatedAt: new Date(),
        })
        .where(eq(threedPlants.id, model.plantId));
    }

    return NextResponse.json({
      success: true,
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