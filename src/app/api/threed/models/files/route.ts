// src/app/api/threed/models/files/route.ts — v0.16.4-alpha
// Adds model files, textures, binary buffers, and supportive media to an existing model.
// Reads `modelId` and optional `category`/`textureType` from multipart form data and
// persists each uploaded file to Vercel Blob (reusing the existing `@vercel/blob` pattern).
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedModels, threedModelFiles } from '@/lib/schema/threed';
import { and, eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { ensureTableSequence } from '@/lib/db/sequence';

const MODEL_EXTS = new Set(['glb', 'gltf', 'fbx', 'obj', 'usdz']);
const TEXTURE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']);
const BINARY_EXTS = new Set(['bin']);

function extensionOf(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function detectTextureType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('normal')) return 'normalMap';
  if (lower.includes('roughness')) return 'roughness';
  if (lower.includes('metallic')) return 'metallic';
  if (lower.includes('emissive')) return 'emissive';
  if (lower.includes('occlusion') || lower.includes('ao')) return 'occlusion';
  return 'baseColor';
}

async function storeFile(
  userId: string,
  modelId: number,
  file: File,
  fileType: string,
  textureType: string | null,
  loadOrder: number,
  isBinaryBuffer = false,
) {
  const ext = extensionOf(file.name) || 'bin';
  const path = `models/${modelId}/${fileType}/${Date.now()}-${file.name}`;
  const blob = await put(path, file, { access: 'public', addRandomSuffix: false });

  await ensureTableSequence('threed_model_files');

  return db
    .insert(threedModelFiles)
    .values({
      userId,
      modelId,
      fileName: file.name,
      fileType,
      textureType,
      filePath: blob.url,
      fileSize: file.size,
      isBinaryBuffer,
      loadOrder,
    })
    .returning();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const modelIdRaw = formData.get('modelId');
    const modelId = typeof modelIdRaw === 'string' ? parseInt(modelIdRaw) : NaN;

    if (isNaN(modelId)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid modelId' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    // Optional explicit category override (model|texture|binary|other)
    const categoryOverride = formData.get('category');

    const [model] = await db
      .select()
      .from(threedModels)
      .where(and(
        eq(threedModels.id, modelId),
        eq(threedModels.userId, session.user.id),
      ))
      .limit(1);

    if (!model) {
      return NextResponse.json({ success: false, error: 'Model not found' }, { status: 404 });
    }

    const uploaded: unknown[] = [];
    let textureCount = model.textureCount || 0;
    let firstModelFileId = model.mainModelFileId ?? null;

    for (const file of files) {
      const ext = extensionOf(file.name);
      let fileType: string;
      let textureType: string | null = null;
      let isBinaryBuffer = false;

      if (typeof categoryOverride === 'string' && categoryOverride) {
        fileType = categoryOverride;
        if (fileType === 'texture') textureType = detectTextureType(file.name);
        if (fileType === 'binary') isBinaryBuffer = true;
      } else if (MODEL_EXTS.has(ext)) {
        fileType = 'model';
      } else if (TEXTURE_EXTS.has(ext)) {
        fileType = 'texture';
        textureType = detectTextureType(file.name);
      } else if (BINARY_EXTS.has(ext)) {
        fileType = 'binary';
        isBinaryBuffer = true;
      } else {
        fileType = 'other';
      }

      const [record] = await storeFile(session.user.id, modelId, file, fileType, textureType, uploaded.length, isBinaryBuffer);

      if (fileType === 'texture') textureCount += 1;
      if (fileType === 'model' && firstModelFileId == null) firstModelFileId = record.id;

      uploaded.push(record);
    }

    // Update the model's file metadata
    await db
      .update(threedModels)
      .set({
        hasExternalFiles: true,
        textureCount,
        mainModelFileId: firstModelFileId,
      })
      .where(and(
        eq(threedModels.id, modelId),
        eq(threedModels.userId, session.user.id),
      ));

    return NextResponse.json({
      success: true,
      data: uploaded,
      message: `Added ${uploaded.length} file(s) to model`,
    });
  } catch (error) {
    console.error('Error adding files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add files', details: String(error) },
      { status: 500 }
    );
  }
}
