// src/app/api/threed/models/[id]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedModels, threedModelFiles } from '@/lib/auth/schema';
import { eq } from 'drizzle-orm';
import { del } from '@vercel/blob';

// DELETE /api/threed/models/[id]/files/[fileId] - Delete a specific file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId: fileIdParam } = await params;
    const modelId = parseInt(id);
    const fileId = parseInt(fileIdParam);
    
    if (isNaN(modelId) || isNaN(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID or file ID' },
        { status: 400 }
      );
    }
    
    // Get file info
    const [file] = await db.select()
      .from(threedModelFiles)
      .where(eq(threedModelFiles.id, fileId))
      .limit(1);
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Verify file belongs to model
    if (file.modelId !== modelId) {
      return NextResponse.json(
        { success: false, error: 'File does not belong to this model' },
        { status: 400 }
      );
    }
    
    // Delete from blob storage
    try {
      await del(file.filePath);
    } catch (blobError) {
      console.warn(`Failed to delete blob for file ${fileId}:`, blobError);
    }
    
    // Delete from database
    await db.delete(threedModelFiles)
      .where(eq(threedModelFiles.id, fileId));
    
    // Update model texture count if needed
    if (file.fileType === 'texture') {
      const [model] = await db.select()
        .from(threedModels)
        .where(eq(threedModels.id, modelId))
        .limit(1);
      
      if (model) {
        await db.update(threedModels)
          .set({ textureCount: Math.max(0, (model.textureCount || 0) - 1) })
          .where(eq(threedModels.id, modelId));
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file', details: error.message },
      { status: 500 }
    );
  }
}