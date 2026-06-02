// src/app/api/threed/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedModels, threedPlants, threedModelFiles, threedCharacters } from '@/lib/auth/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { put, del } from '@vercel/blob';

// GET /api/threed/models - Fetch models with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plantId = searchParams.get('plantId');
    const characterId = searchParams.get('characterId');
    const modelType = searchParams.get('modelType');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Start with base query from threedModels
    let query = db.select({
      id: threedModels.id,
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
      usedByPlants: threedModels.usedByPlants,
      usedByCharacters: threedModels.usedByCharacters,
      metadata: threedModels.metadata,
      createdAt: threedModels.createdAt,
      updatedAt: threedModels.updatedAt,
      // Left join with plants to get plant info if used by a plant
      plant: {
        id: threedPlants.id,
        commonName: threedPlants.commonName,
        scientificName: threedPlants.scientificName,
        plantId: threedPlants.plantId,
      },
      // Left join with characters to get character info if used by a character
      character: {
        id: threedCharacters.id,
        name: threedCharacters.name,
        characterId: threedCharacters.characterId,
        type: threedCharacters.type,
      }
    })
    .from(threedModels)
    .leftJoin(threedPlants, eq(threedPlants.modelId, threedModels.id))
    .leftJoin(threedCharacters, eq(threedCharacters.modelId, threedModels.id));

    // Apply filters
    if (plantId) {
      query = query.where(eq(threedPlants.id, parseInt(plantId)));
    }
    if (characterId) {
      query = query.where(eq(threedCharacters.id, parseInt(characterId)));
    }
    if (modelType) {
      query = query.where(eq(threedModels.modelType, modelType));
    }
    if (isActive !== null) {
      query = query.where(eq(threedModels.isActive, isActive === 'true'));
    }

    // Get total count for pagination
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(threedModels);
    const total = countResult[0];
    
    // Apply pagination and ordering
    const models = await query
      .orderBy(desc(threedModels.createdAt))
      .limit(limit)
      .offset(offset);

    // For each model, get associated files
    const modelsWithFiles = await Promise.all(models.map(async (model) => {
      const files = await db.select()
        .from(threedModelFiles)
        .where(eq(threedModelFiles.modelId, model.id))
        .orderBy(threedModelFiles.loadOrder);
      
      return {
        ...model,
        files,
        mainModelFile: files.find(f => f.fileType === 'model'),
        textures: files.filter(f => f.fileType === 'texture'),
        binaries: files.filter(f => f.fileType === 'binary'),
      };
    }));

    return NextResponse.json({
      success: true,
      data: modelsWithFiles,
      pagination: {
        limit,
        offset,
        total: total?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch models', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/threed/models - Upload a new GLTF model with multiple files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const associationType = formData.get('associationType') as string;
    const plantId = formData.get('plantId') as string;
    const characterId = formData.get('characterId') as string;
    const modelName = formData.get('modelName') as string;
    const modelType = formData.get('modelType') as string;
    const isDefault = formData.get('isDefault') === 'true';
    
    console.log('📦 Upload request:', {
      filesCount: files.length,
      associationType,
      plantId,
      characterId,
      modelName,
      modelType
    });
    
    // Separate main model file from textures and binaries
    let mainModelFile: File | null = null;
    const textureFiles: File[] = [];
    const binaryFiles: File[] = [];
    
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'glb' || extension === 'gltf' || extension === 'fbx' || extension === 'obj') {
        mainModelFile = file;
      } else if (extension === 'bin') {
        binaryFiles.push(file);
      } else if (['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp'].includes(extension || '')) {
        textureFiles.push(file);
      }
    }
    
    // Validation
    if (!mainModelFile) {
      return NextResponse.json(
        { success: false, error: 'No main model file (.glb, .gltf, .fbx, or .obj) provided' },
        { status: 400 }
      );
    }

    if (!modelName) {
      return NextResponse.json(
        { success: false, error: 'Model name is required' },
        { status: 400 }
      );
    }

    // Validate association based on type
    if (associationType === 'plant') {
      if (!plantId) {
        return NextResponse.json(
          { success: false, error: 'Plant ID is required when associating with a plant' },
          { status: 400 }
        );
      }
      
      // Check if plant exists
      const plant = await db.select()
        .from(threedPlants)
        .where(eq(threedPlants.id, parseInt(plantId)))
        .limit(1);

      if (plant.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Plant not found' },
          { status: 404 }
        );
      }
    } else if (associationType === 'character') {
      if (!characterId) {
        return NextResponse.json(
          { success: false, error: 'Character ID is required when associating with a character' },
          { status: 400 }
        );
      }
      
      // Check if character exists
      const character = await db.select()
        .from(threedCharacters)
        .where(eq(threedCharacters.id, parseInt(characterId)))
        .limit(1);

      if (character.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Character not found' },
          { status: 404 }
        );
      }
    }
    // If associationType is 'none', no validation needed

    // Validate main model file type
    const validExtensions = ['.gltf', '.glb', '.fbx', '.obj'];
    const fileExtension = mainModelFile.name.substring(mainModelFile.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Invalid main model file type. Allowed: ${validExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse additional metadata
    const scale = parseFloat(formData.get('scale') as string) || 1.0;
    const rotationY = parseFloat(formData.get('rotationY') as string) || 0.0;
    const offsetX = parseFloat(formData.get('offsetX') as string) || 0.0;
    const offsetY = parseFloat(formData.get('offsetY') as string) || 0.0;
    const offsetZ = parseFloat(formData.get('offsetZ') as string) || 0.0;
    
    const hasLOD = formData.get('hasLOD') === 'true';
    let lodLevels = {};
    if (hasLOD) {
      try {
        lodLevels = JSON.parse(formData.get('lodLevels') as string || '{}');
      } catch (e) {
        console.warn('Invalid LOD levels JSON');
      }
    }

    let animations = [];
    try {
      animations = JSON.parse(formData.get('animations') as string || '[]');
    } catch (e) {
      console.warn('Invalid animations JSON');
    }

    const defaultAnimation = formData.get('defaultAnimation') as string || null;
    
    let metadata = {};
    try {
      metadata = JSON.parse(formData.get('metadata') as string || '{}');
    } catch (e) {
      console.warn('Invalid metadata JSON');
    }

    // Create model record (no plantId in threedModels anymore)
    const timestamp = Date.now();
    const [newModel] = await db.insert(threedModels).values({
      modelName,
      modelType: modelType || fileExtension.substring(1),
      filePath: '', // Will update after upload
      fileSize: mainModelFile.size,
      scale: scale.toString(),
      rotationY: rotationY.toString(),
      offsetX: offsetX.toString(),
      offsetY: offsetY.toString(),
      offsetZ: offsetZ.toString(),
      hasLOD,
      lodLevels,
      animations,
      defaultAnimation,
      hasExternalFiles: textureFiles.length > 0 || binaryFiles.length > 0,
      textureCount: textureFiles.length,
      isActive: true,
      isDefault: false,
      usedByPlants: associationType === 'plant',
      usedByCharacters: associationType === 'character',
      uploadedBy: 'system',
      metadata,
      uploadedAt: new Date(),
    }).returning();;

    console.log(`📝 Created model record: ${newModel.id}`);

    // // After creating the model, handle association:
    // if (associationType === 'plant' && plantId) {
    //   // Update the plant to use this model
    //   await db.update(threedPlants)
    //     .set({
    //       modelId: newModel.id,
    //       updatedAt: new Date(),
    //     })
    //     .where(eq(threedPlants.id, parseInt(plantId)));
      
    //   // Update usage tracking
    //   await db.update(threedModels)
    //     .set({ usedByPlants: true })
    //     .where(eq(threedModels.id, newModel.id));
      
    //   // If set as default, also update plant's modelId (already done above)
      
    // } else if (associationType === 'character' && characterId) {
    //   // Update the character to use this model
    //   await db.update(threedCharacters)
    //     .set({
    //       modelId: newModel.id,
    //       updatedAt: new Date(),
    //     })
    //     .where(eq(threedCharacters.id, parseInt(characterId)));
      
    //   // Update usage tracking
    //   await db.update(threedModels)
    //     .set({ usedByCharacters: true })
    //     .where(eq(threedModels.id, newModel.id));
    // }

    // Upload main model file
    const mainFileName = `${timestamp}-${mainModelFile.name}`;
    const mainBlob = await put(`models/${newModel.id}/${mainFileName}`, mainModelFile, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log(`✅ Uploaded main model to: ${mainBlob.url}`);

    // Create model file record for main file
    const [mainFileRecord] = await db.insert(threedModelFiles).values({
      modelId: newModel.id,
      fileName: mainModelFile.name,
      fileType: 'model',
      filePath: mainBlob.url,
      fileSize: mainModelFile.size,
      loadOrder: 0,
    }).returning();

    // Update model with main file path
    await db.update(threedModels)
      .set({
        filePath: mainBlob.url,
        mainModelFileId: mainFileRecord.id,
      })
      .where(eq(threedModels.id, newModel.id));

    // Upload texture files
    const textureUploads = textureFiles.map(async (file, index) => {
      const textureFileName = `${timestamp}-${file.name}`;
      const blob = await put(`models/${newModel.id}/textures/${textureFileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      // Determine texture type from filename
      let textureType = 'baseColor';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('normal')) textureType = 'normalMap';
      else if (lowerName.includes('roughness')) textureType = 'roughness';
      else if (lowerName.includes('metallic')) textureType = 'metallic';
      else if (lowerName.includes('emissive')) textureType = 'emissive';
      else if (lowerName.includes('occlusion')) textureType = 'occlusion';
      else if (lowerName.includes('ao')) textureType = 'occlusion';
      
      return db.insert(threedModelFiles).values({
        modelId: newModel.id,
        fileName: file.name,
        fileType: 'texture',
        textureType,
        filePath: blob.url,
        fileSize: file.size,
        loadOrder: index + 1,
      });
    });
    
    // Upload binary files
    const binaryUploads = binaryFiles.map(async (file, index) => {
      const binaryFileName = `${timestamp}-${file.name}`;
      const blob = await put(`models/${newModel.id}/bin/${binaryFileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      return db.insert(threedModelFiles).values({
        modelId: newModel.id,
        fileName: file.name,
        fileType: 'binary',
        filePath: blob.url,
        fileSize: file.size,
        isBinaryBuffer: true,
        loadOrder: index + 100,
      });
    });
    
    await Promise.all([...textureUploads, ...binaryUploads]);



    // Associate with plant or character
    if (associationType === 'plant' && plantId) {
      if (isDefault) {
        await db.update(threedPlants)
          .set({
            modelId: newModel.id,
            updatedAt: new Date(),
          })
          .where(eq(threedPlants.id, parseInt(plantId)));
      }
      await db.update(threedModels)
        .set({ usedByPlants: true })
        .where(eq(threedModels.id, newModel.id));
      
      console.log(`🔗 Associated model ${newModel.id} with plant ${plantId}`);
      
    } else if (associationType === 'character' && characterId) {
      await db.update(threedCharacters)
        .set({
          modelId: newModel.id,
          updatedAt: new Date(),
        })
        .where(eq(threedCharacters.id, parseInt(characterId)));
      
      await db.update(threedModels)
        .set({ usedByCharacters: true })
        .where(eq(threedModels.id, newModel.id));
      
      console.log(`🔗 Associated model ${newModel.id} with character ${characterId}`);
    }

    // Get all uploaded files for response
    const allFiles = await db.select()
      .from(threedModelFiles)
      .where(eq(threedModelFiles.modelId, newModel.id));

    return NextResponse.json({
      success: true,
      data: {
        ...newModel,
        files: allFiles,
        mainModelFile: allFiles.find(f => f.fileType === 'model'),
        textures: allFiles.filter(f => f.fileType === 'texture'),
        binaries: allFiles.filter(f => f.fileType === 'binary'),
        fileCount: 1 + textureFiles.length + binaryFiles.length,
        textureCount: textureFiles.length,
      },
      message: `Model uploaded successfully${associationType !== 'none' ? ` and associated with ${associationType}` : ''}!`,
    });
    
  } catch (error) {
    console.error('❌ Error uploading model:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload model', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/models - Bulk delete models
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids')?.split(',') || [];
    
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No model IDs provided' },
        { status: 400 }
      );
    }

    const deletedModels = [];
    const errors = [];

    for (const id of ids) {
      try {
        // Get model info first
        const [model] = await db.select()
          .from(threedModels)
          .where(eq(threedModels.id, parseInt(id)))
          .limit(1);

        if (model) {
          // First, remove the model reference from any plants that use it
          await db.update(threedPlants)
            .set({ modelId: null, updatedAt: new Date() })
            .where(eq(threedPlants.modelId, parseInt(id)));

          // Get all associated files
          const files = await db.select()
            .from(threedModelFiles)
            .where(eq(threedModelFiles.modelId, parseInt(id)));

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
            .where(eq(threedModelFiles.modelId, parseInt(id)));

          // Delete model from database
          await db.delete(threedModels)
            .where(eq(threedModels.id, parseInt(id)));
          
          deletedModels.push(id);
        }
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedModels,
      errors: errors.length > 0 ? errors : undefined,
      message: `Deleted ${deletedModels.length} models and all associated files`,
    });
  } catch (error) {
    console.error('Error deleting models:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete models' },
      { status: 500 }
    );
  }
}