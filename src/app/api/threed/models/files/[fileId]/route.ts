// src/app/api/threed/models/files/[fileId]/route.ts — v0.16.4-alpha
// Route is mounted at /api/threed/models/files/[fileId] (no [id] segment),
// so the model id is derived from the file record itself.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedModels, threedModelFiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { del } from '@vercel/blob';

// DELETE /api/threed/models/files/[fileId] - Delete a specific model file
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId: fileIdParam } = await params;
    const fileId = parseInt(fileIdParam);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // Get file info (file.modelId is the parent model)
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

    const modelId = file.modelId;
    if (modelId == null) {
      return NextResponse.json(
        { success: false, error: 'File is not associated with a model' },
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
      { success: false, error: 'Failed to delete file', details: String(error) },
      { status: 500 }
    );
  }
}
