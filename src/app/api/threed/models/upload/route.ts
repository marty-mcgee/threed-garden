// src/app/api/threed/models/upload/route.ts — v0.16.4-alpha
// Standalone model-file upload for the create flow: uploads the primary GLB/GLTF/FBX/OBJ
// file to Vercel Blob and returns its public URL + inferred metadata (no DB write yet).
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { del, put } from '@vercel/blob';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { threedModelFiles, threedModels } from '@/lib/schema/threed';
import {
  inspectThreeDGltfStructure,
  parseThreeDGlbJsonChunk,
} from '@/lib/services/threed/models/gltf-runtime-inspection-core';
import { inspectThreeDFbxStructure } from '@/lib/services/threed/models/fbx-runtime-inspection-server';

export const runtime = 'nodejs';

const EXT_TO_TYPE: Record<string, string> = {
  glb: 'glb',
  gltf: 'gltf',
  fbx: 'fbx',
  obj: 'obj',
  usdz: 'usdz',
};

const THUMBNAIL_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const THUMBNAIL_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const MAX_MODEL_BYTES = 256 * 1024 * 1024;
const INSPECTABLE_MODEL_TYPES = new Set(['fbx', 'glb', 'gltf']);

async function hasExpectedThumbnailSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.type === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((value, index) => bytes[index] === value);
  }
  if (file.type === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
}

function extensionOf(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function suggestedModelName(fileName: string): string {
  const extension = extensionOf(fileName);
  const stem = extension ? fileName.slice(0, -(extension.length + 1)) : fileName;
  return stem.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || 'Untitled Model';
}

async function inspectUploadedModel(file: File, modelType: string) {
  if (!INSPECTABLE_MODEL_TYPES.has(modelType)) {
    return {
      status: 'not_supported' as const,
      message: `${modelType.toUpperCase()} structural analysis is not available yet`,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fbxInspection = modelType === 'fbx'
    ? inspectThreeDFbxStructure(bytes.buffer, { offset: 0, limit: 12 })
    : null;
  const inspection = fbxInspection ?? inspectThreeDGltfStructure(
    modelType === 'glb'
      ? parseThreeDGlbJsonChunk(bytes)
      : JSON.parse(new TextDecoder().decode(bytes)),
    { offset: 0, limit: 12 },
  );

  return {
    status: 'analyzed' as const,
    geometryStatus: inspection.status,
    meshCount: inspection.meshCount,
    triangleCount: inspection.triangleCount,
    skinnedMeshCount: inspection.skinnedMeshCount,
    invalidMeshCount: inspection.invalidMeshCount,
    colliderEligible: inspection.colliderEligible,
    reasons: inspection.reasons,
    componentCount: inspection.sourceComponents.total,
    components: inspection.sourceComponents.items,
    ...(fbxInspection ? { materialTargets: fbxInspection.materialTargets } : {}),
  };
}

function isOwnedStagedModelUrl(value: unknown, userId: string): value is string {
  if (typeof value !== 'string' || value.length > 2_000) return false;
  try {
    const url = new URL(value);
    const segments = url.pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
    return url.protocol === 'https:'
      && url.hostname.endsWith('.blob.vercel-storage.com')
      && segments.length === 4
      && segments[0] === 'models'
      && segments[1] === userId
      && segments[2] === 'upload'
      && /^\d+\.(?:glb|gltf|fbx|obj|usdz)$/i.test(segments[3]);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const purpose = formData.get('purpose') === 'thumbnail' ? 'thumbnail' : 'model';
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (purpose === 'thumbnail') {
      const suppliedExtension = extensionOf(file.name);
      const extension = THUMBNAIL_MIME_TO_EXTENSION[file.type];
      if (!extension || !THUMBNAIL_EXTENSIONS.has(suppliedExtension)) {
        return NextResponse.json(
          { success: false, error: 'Preview image must be a JPG, PNG, or WebP file' },
          { status: 400 },
        );
      }
      if (file.size <= 0 || file.size > MAX_THUMBNAIL_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Preview image must be between 1 byte and 5 MB' },
          { status: 400 },
        );
      }
      if (!(await hasExpectedThumbnailSignature(file))) {
        return NextResponse.json(
          { success: false, error: 'Preview image contents do not match the selected image format' },
          { status: 400 },
        );
      }

      const path = `models/${session.user.id}/previews/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const blob = await put(path, file, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.type,
      });

      return NextResponse.json({
        success: true,
        data: {
          purpose,
          url: blob.url,
          fileSize: file.size,
          extension,
          fileName: file.name,
        },
      });
    }

    const ext = extensionOf(file.name);
    const modelType = EXT_TO_TYPE[ext];
    if (!modelType) {
      return NextResponse.json(
        { success: false, error: 'Model file must be GLB, GLTF, FBX, OBJ, or USDZ' },
        { status: 400 },
      );
    }
    if (file.size <= 0 || file.size > MAX_MODEL_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Model file must be between 1 byte and 256 MB' },
        { status: 400 },
      );
    }

    let analysis;
    try {
      analysis = await inspectUploadedModel(file, modelType);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? `Model analysis failed: ${error.message}` : 'Model analysis failed',
      }, { status: 422 });
    }

    const path = `models/${session.user.id}/upload/${Date.now()}.${ext}`;

    const blob = await put(path, file, { access: 'public', addRandomSuffix: false });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        fileSize: file.size,
        extension: ext,
        modelType,
        fileName: file.name,
        suggestedModelName: suggestedModelName(file.name),
        analysis,
      },
    });
  } catch (error) {
    console.error('Error uploading model file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload model file', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 415 });
    }
    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > 2_048) {
      return NextResponse.json({ success: false, error: 'Cleanup request is too large' }, { status: 413 });
    }
    const parsedBody: unknown = await request.json();
    if (
      typeof parsedBody !== 'object'
      || parsedBody === null
      || Array.isArray(parsedBody)
      || Object.keys(parsedBody).length !== 1
      || !Object.hasOwn(parsedBody, 'url')
    ) {
      return NextResponse.json({ success: false, error: 'Invalid staged Model cleanup request' }, { status: 400 });
    }
    const body = parsedBody as { url: unknown };
    if (!isOwnedStagedModelUrl(body.url, session.user.id)) {
      return NextResponse.json({ success: false, error: 'Invalid staged Model upload URL' }, { status: 400 });
    }

    const [referencedModel] = await db.select({ id: threedModels.id }).from(threedModels).where(and(
      eq(threedModels.userId, session.user.id),
      eq(threedModels.filePath, body.url),
    )).limit(1);
    const [referencedFile] = await db.select({ id: threedModelFiles.id }).from(threedModelFiles).where(and(
      eq(threedModelFiles.userId, session.user.id),
      eq(threedModelFiles.filePath, body.url),
    )).limit(1);
    if (referencedModel || referencedFile) {
      return NextResponse.json(
        { success: false, error: 'Committed Model files cannot be discarded as staged uploads' },
        { status: 409 },
      );
    }

    await del(body.url);
    return NextResponse.json({ success: true, message: 'Staged Model upload discarded' });
  } catch (error) {
    console.error('Failed to discard staged Model upload', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to discard staged Model upload' },
      { status: 500 },
    );
  }
}
