import { modelSelection } from '@/lib/services/threed/models/model-primary-file';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  threedModelFiles,
  threedModelMaterialAssignments,
  threedModels,
  threedModelTextures,
} from '@/lib/schema/threed';
import {
  inspectThreeDModelMaterial,
  inspectThreeDModelPrimary,
  type ThreeDModelCompanionRequirement,
} from '@/lib/services/threed/models/model-companion-core';
import {
  resolveThreeDModelAttachmentUrl,
  type ThreeDModelRuntimeAttachment,
} from '@/lib/services/threed/models/model-attachment-runtime-core';
import { isOwnedThreeDBlobUrl } from '@/lib/services/threed/models/model-file-integrity';
import {
  isThreeDModelMaterialTargetKey,
  writeThreeDModelMaterialOverride,
} from '@/lib/services/threed/models/model-material-override-core';

export const runtime = 'nodejs';

const SUPPORTED_PRIMARY_TYPES = new Set(['fbx', 'glb', 'gltf', 'obj']);
const MAX_PRIMARY_BYTES = 256 * 1024 * 1024;
const MAX_MATERIAL_BYTES = 5 * 1024 * 1024;

function requirementIdentity(requirement: ThreeDModelCompanionRequirement) {
  return `${requirement.kind}:${requirement.relativePath.toLowerCase()}`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const modelId = Number(new URL(request.url).searchParams.get('modelId'));
  if (!Number.isSafeInteger(modelId) || modelId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid model ID' }, { status: 400 });
  }

  const [model] = await db.select(modelSelection()).from(threedModels).where(and(
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
    const primaryRequirements = inspectThreeDModelPrimary(primary.fileName, bytes);
    const discoveredRequirements = [...primaryRequirements];

    for (const requirement of primaryRequirements) {
      if (requirement.kind !== 'material') continue;
      const resolvedUrl = resolveThreeDModelAttachmentUrl(requirement.relativePath, attachments);
      const matched = attachments.find((attachment) => attachment.filePath === resolvedUrl) ?? null;
      const matchedFile = matched
        ? files.find((file) => file.filePath === matched.filePath) ?? null
        : null;
      if (!matchedFile) continue;
      if (
        !isOwnedThreeDBlobUrl(matchedFile.filePath, { modelId, userId: session.user.id })
        || (matchedFile.fileSize ?? 0) <= 0
        || (matchedFile.fileSize ?? 0) > MAX_MATERIAL_BYTES
      ) {
        throw new Error(`Material file ${matchedFile.fileName} is not eligible for dependency inspection`);
      }
      const materialResponse = await fetch(matchedFile.filePath, { cache: 'no-store' });
      if (!materialResponse.ok) {
        throw new Error(`Material file request failed (${materialResponse.status})`);
      }
      const materialBytes = new Uint8Array(await materialResponse.arrayBuffer());
      if (materialBytes.byteLength <= 0 || materialBytes.byteLength > MAX_MATERIAL_BYTES) {
        throw new Error(`Material file ${matchedFile.fileName} is outside the inspection boundary`);
      }
      discoveredRequirements.push(...inspectThreeDModelMaterial(
        matchedFile.fileName,
        new TextDecoder().decode(materialBytes),
        requirement.relativePath,
      ));
    }

    const uniqueRequirements = [...new Map(
      discoveredRequirements.map((requirement) => [requirementIdentity(requirement), requirement]),
    ).values()];
    const requirements = uniqueRequirements.map((requirement) => {
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

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 415 });
  }
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 2_048) {
    return NextResponse.json({ success: false, error: 'Material assignment request is too large' }, { status: 413 });
  }
  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return NextResponse.json({ success: false, error: 'Invalid material assignment' }, { status: 400 });
  }
  const body = input as Record<string, unknown>;
  const requestedTargetKeys = Array.isArray(body.targetKeys)
    ? [...new Set(body.targetKeys)]
    : body.targetKey === undefined ? [] : [body.targetKey];
  if (
    Object.keys(body).some((key) => !['modelId', 'targetKey', 'targetKeys', 'channel', 'textureFileId', 'textureId'].includes(key))
    || (body.targetKey !== undefined && body.targetKeys !== undefined)
    || requestedTargetKeys.length < 1
    || requestedTargetKeys.length > 500
    || requestedTargetKeys.some((targetKey) => !isThreeDModelMaterialTargetKey(targetKey))
    || body.channel !== 'baseColor'
  ) {
    return NextResponse.json({ success: false, error: 'Invalid material assignment' }, { status: 400 });
  }
  const modelId = Number(body.modelId);
  const textureFileId = body.textureFileId === undefined ? null : Number(body.textureFileId);
  const textureId = body.textureId === undefined ? null : Number(body.textureId);
  if (
    !Number.isSafeInteger(modelId) || modelId <= 0
    || (textureFileId === null) === (textureId === null)
    || (textureFileId !== null && (!Number.isSafeInteger(textureFileId) || textureFileId <= 0))
    || (textureId !== null && (!Number.isSafeInteger(textureId) || textureId <= 0))
  ) {
    return NextResponse.json({ success: false, error: 'Choose exactly one valid Texture' }, { status: 400 });
  }
  const [[model], [attachmentTexture], [libraryTexture]] = await Promise.all([
    db.select(modelSelection()).from(threedModels).where(and(
      eq(threedModels.id, modelId),
      eq(threedModels.userId, session.user.id),
    )).limit(1),
    textureFileId === null ? Promise.resolve([]) : db.select().from(threedModelFiles).where(and(
      eq(threedModelFiles.id, textureFileId), eq(threedModelFiles.modelId, modelId),
      eq(threedModelFiles.userId, session.user.id), eq(threedModelFiles.fileType, 'texture'),
    )).limit(1),
    textureId === null ? Promise.resolve([]) : db.select().from(threedModelTextures).where(and(
      eq(threedModelTextures.id, textureId), eq(threedModelTextures.userId, session.user.id), eq(threedModelTextures.isActive, true),
    )).limit(1),
  ]);
  if (!model || (!attachmentTexture && !libraryTexture)) {
    return NextResponse.json({ success: false, error: 'Model or Texture not found' }, { status: 404 });
  }
  const textureReference = libraryTexture?.filePath
    ?? attachmentTexture?.relativePath
    ?? attachmentTexture?.fileName;
  if (!textureReference) {
    return NextResponse.json({ success: false, error: 'Texture reference is unavailable' }, { status: 422 });
  }
  const metadata = requestedTargetKeys.reduce<Record<string, unknown>>(
    (currentMetadata, targetKey) => writeThreeDModelMaterialOverride(currentMetadata, {
      targetKey: targetKey as string,
      channel: 'baseColor',
      textureRelativePath: textureReference,
    }),
    model.metadata && typeof model.metadata === 'object' && !Array.isArray(model.metadata)
      ? model.metadata as Record<string, unknown>
      : {},
  );
  const [updated] = await db.transaction(async (tx) => {
    if (libraryTexture) {
      for (const targetKey of requestedTargetKeys as string[]) {
        await tx.insert(threedModelMaterialAssignments).values({
          userId,
          modelId,
          textureId: libraryTexture.id,
          targetKey,
          channel: 'baseColor',
        }).onConflictDoUpdate({
          target: [
            threedModelMaterialAssignments.modelId,
            threedModelMaterialAssignments.targetKey,
            threedModelMaterialAssignments.channel,
          ],
          set: { textureId: libraryTexture.id, userId, updatedAt: new Date() },
        });
      }
    }
    return tx.update(threedModels).set({ metadata, updatedAt: new Date() }).where(and(
      eq(threedModels.id, modelId), eq(threedModels.userId, userId),
    )).returning({ id: threedModels.id, metadata: threedModels.metadata });
  });
  return NextResponse.json({ success: true, data: updated });
}
