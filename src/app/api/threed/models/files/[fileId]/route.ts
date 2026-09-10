import { modelSelection } from '@/lib/services/threed/models/model-primary-file';
// src/app/api/threed/models/files/[fileId]/route.ts — v0.16.4-alpha
// Route is mounted at /api/threed/models/files/[fileId] (no [id] segment),
// so the model id is derived from the file record itself.
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedModels, threedModelFiles, threedModelTextures } from '@/lib/schema';
import { and, asc, eq } from 'drizzle-orm';
import { del } from '@vercel/blob';
import {
  isOwnedThreeDBlobUrl,
  runtimeModelTypeFromFileName,
} from '@/lib/services/threed/models/model-file-integrity';

// DELETE /api/threed/models/files/[fileId] - Delete a specific model file
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }
    const userId = session.user.id;

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

    const [ownedModel] = await db.select(modelSelection())
      .from(threedModels)
      .where(and(
        eq(threedModels.id, modelId),
        eq(threedModels.userId, userId),
      ))
      .limit(1);

    if (!ownedModel) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 },
      );
    }

    const siblingFiles = await db.select()
      .from(threedModelFiles)
      .where(and(
        eq(threedModelFiles.modelId, modelId),
        eq(threedModelFiles.userId, userId),
      ))
      .orderBy(asc(threedModelFiles.loadOrder), asc(threedModelFiles.id));
    const remainingFiles = siblingFiles.filter((candidate) => candidate.id !== fileId);
    const retainedPrimary = remainingFiles.find((candidate) => (
      candidate.id === ownedModel.mainModelFileId && candidate.fileType === 'model'
    )) ?? null;

    if (ownedModel.mainModelFileId === fileId) {
      return NextResponse.json({
        success: false,
        error: 'Upload another Model file and set it as primary before deleting the current primary file',
      }, { status: 409 });
    }

    await db.transaction(async (tx) => {
      await tx.delete(threedModelFiles).where(and(
        eq(threedModelFiles.id, fileId),
        eq(threedModelFiles.userId, userId),
      ));

      const primaryChanged = retainedPrimary?.id !== ownedModel.mainModelFileId;
      await tx.update(threedModels).set({
        ...(primaryChanged ? {
          mainModelFileId: retainedPrimary?.id ?? null,
          ...(retainedPrimary ? {
            modelType: runtimeModelTypeFromFileName(retainedPrimary.fileName) ?? ownedModel.modelType,
          } : {}),
        } : {}),
        hasExternalFiles: remainingFiles.length > 0,
        textureCount: remainingFiles.filter((candidate) => candidate.fileType === 'texture').length,
        updatedAt: new Date(),
      }).where(and(
        eq(threedModels.id, modelId),
        eq(threedModels.userId, userId),
      ));
    });

    let blobDeleted = false;
    if (isOwnedThreeDBlobUrl(file.filePath, { modelId, userId })) {
      const [modelReference, fileReference, textureReference] = await Promise.all([
        db.select({ id: threedModels.id }).from(threedModels)
          .where(eq(threedModels.thumbnailUrl, file.filePath)).limit(1),
        db.select({ id: threedModelFiles.id }).from(threedModelFiles)
          .where(eq(threedModelFiles.filePath, file.filePath)).limit(1),
        db.select({ id: threedModelTextures.id }).from(threedModelTextures)
          .where(eq(threedModelTextures.filePath, file.filePath)).limit(1),
      ]);
      if (modelReference.length === 0 && fileReference.length === 0 && textureReference.length === 0) {
        try {
          await del(file.filePath);
          blobDeleted = true;
        } catch (blobError) {
          console.warn(`Failed to delete Blob for detached Model file ${fileId}:`, blobError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        primaryFileId: retainedPrimary?.id ?? null,
        textureCount: remainingFiles.filter((candidate) => candidate.fileType === 'texture').length,
        attachmentCount: remainingFiles.length,
        blobDeleted,
      },
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
