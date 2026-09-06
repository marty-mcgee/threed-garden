import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedModelFiles, threedModels } from '@/lib/schema/threed';
import { inspectThreeDModelPrimary } from '@/lib/services/threed/models/model-companion-core';
import {
  resolveThreeDModelAttachmentUrl,
  type ThreeDModelRuntimeAttachment,
} from '@/lib/services/threed/models/model-attachment-runtime-core';
import { isOwnedThreeDBlobUrl } from '@/lib/services/threed/models/model-file-integrity';

export const runtime = 'nodejs';

const SUPPORTED_PRIMARY_TYPES = new Set(['fbx', 'glb', 'gltf']);
const MAX_PRIMARY_BYTES = 256 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const modelId = Number(new URL(request.url).searchParams.get('modelId'));
  if (!Number.isSafeInteger(modelId) || modelId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid model ID' }, { status: 400 });
  }

  const [model] = await db.select().from(threedModels).where(and(
    eq(threedModels.id, modelId),
    eq(threedModels.userId, session.user.id),
  )).limit(1);
  if (!model) {
    return NextResponse.json({ success: false, error: 'Model not found' }, { status: 404 });
  }

  const files = await db.select().from(threedModelFiles).where(and(
    eq(threedModelFiles.modelId, modelId),
    eq(threedModelFiles.userId, session.user.id),
  )).orderBy(asc(threedModelFiles.loadOrder), asc(threedModelFiles.id));
  const primary = files.find((file) => file.id === model.mainModelFileId && file.fileType === 'model')
    ?? files.find((file) => file.fileType === 'model')
    ?? null;
  if (!primary) {
    return NextResponse.json({ success: true, data: { status: 'missing_primary', requirements: [] } });
  }

  const modelType = primary.fileName.split('.').pop()?.toLowerCase() ?? model.modelType;
  if (!SUPPORTED_PRIMARY_TYPES.has(modelType)) {
    return NextResponse.json({
      success: true,
      data: { status: 'not_supported', primaryFileName: primary.fileName, requirements: [] },
    });
  }
  if (
    !isOwnedThreeDBlobUrl(primary.filePath, { modelId, userId: session.user.id })
    || (primary.fileSize ?? 0) <= 0
    || (primary.fileSize ?? 0) > MAX_PRIMARY_BYTES
  ) {
    return NextResponse.json({ success: false, error: 'Primary Model file is not eligible for dependency inspection' }, { status: 422 });
  }

  try {
    const response = await fetch(primary.filePath, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Primary file request failed (${response.status})`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength <= 0 || bytes.byteLength > MAX_PRIMARY_BYTES) {
      throw new Error('Primary file size is outside the inspection boundary');
    }
    const attachments: ThreeDModelRuntimeAttachment[] = files.map((file) => ({
      fileName: file.fileName,
      relativePath: file.relativePath || file.fileName,
      filePath: file.filePath,
      fileType: file.fileType,
    }));
    const requirements = inspectThreeDModelPrimary(primary.fileName, bytes).map((requirement) => {
      const resolvedUrl = resolveThreeDModelAttachmentUrl(requirement.relativePath, attachments);
      const matched = attachments.find((attachment) => attachment.filePath === resolvedUrl) ?? null;
      return {
        ...requirement,
        satisfied: Boolean(matched),
        matchedFileId: matched ? files.find((file) => file.filePath === matched.filePath)?.id ?? null : null,
        matchedRelativePath: matched?.relativePath ?? null,
      };
    });
    return NextResponse.json({
      success: true,
      data: {
        status: 'analyzed',
        primaryFileName: primary.fileName,
        complete: requirements.every((requirement) => requirement.satisfied),
        requirements,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? `Dependency inspection failed: ${error.message}` : 'Dependency inspection failed',
    }, { status: 422 });
  }
}
