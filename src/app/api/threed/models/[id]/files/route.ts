// src/app/api/threed/models/[id]/files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedModels, threedModelFiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';

// POST /api/threed/models/[id]/files - Add files to an existing model
export async function POST(
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
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }
    
    // Separate textures and binaries
    const textureFiles: File[] = [];
    const binaryFiles: File[] = [];
    
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'bin') {
        binaryFiles.push(file);
      } else if (['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp'].includes(extension || '')) {
        textureFiles.push(file);
      }
    }
    
    // Check if model exists
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
    
    const timestamp = Date.now();
    const uploadedFiles = [];
    
    // Upload texture files
    for (let i = 0; i < textureFiles.length; i++) {
      const file = textureFiles[i];
      const fileName = `${timestamp}-${file.name}`;
      const blob = await put(`models/${modelId}/textures/${fileName}`, file, {
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
      
      const [fileRecord] = await db.insert(threedModelFiles).values({
        modelId,
        fileName: file.name,
        fileType: 'texture',
        textureType,
        filePath: blob.url,
        fileSize: file.size,
        loadOrder: (model.textureCount || 0) + i + 1,
      }).returning();
      
      uploadedFiles.push(fileRecord);
    }
    
    // Upload binary files
    for (let i = 0; i < binaryFiles.length; i++) {
      const file = binaryFiles[i];
      const fileName = `${timestamp}-${file.name}`;
      const blob = await put(`models/${modelId}/bin/${fileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      const [fileRecord] = await db.insert(threedModelFiles).values({
        modelId,
        fileName: file.name,
        fileType: 'binary',
        filePath: blob.url,
        fileSize: file.size,
        isBinaryBuffer: true,
        loadOrder: 100 + i,
      }).returning();
      
      uploadedFiles.push(fileRecord);
    }
    
    // Update model counts
    await db.update(threedModels)
      .set({
        hasExternalFiles: true,
        textureCount: (model.textureCount || 0) + textureFiles.length,
      })
      .where(eq(threedModels.id, modelId));
    
    return NextResponse.json({
      success: true,
      data: uploadedFiles,
      message: `Added ${uploadedFiles.length} files to model`,
    });
  } catch (error) {
    console.error('Error adding files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add files', details: error.message },
      { status: 500 }
    );
  }
}