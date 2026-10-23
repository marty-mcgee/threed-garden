import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { readOwnedThreeDModelEmbeddedImageSource, ThreeDEmbeddedImageReadError } from '@/libraries/services/threed/models/model-embedded-images-server';
import {
  extractThreeDModelEmbeddedImage,
  inspectThreeDModelEmbeddedImages,
} from '@/libraries/services/threed/models/model-embedded-images-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: PRIVATE_HEADERS });
}

function positiveId(value: string | null) {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null;
  const result = Number(value);
  return Number.isSafeInteger(result) && result <= 2_147_483_647 ? result : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure('Unauthorized', 401);
    const { id } = await params;
    const query = new URL(request.url).searchParams;
    const modelId = positiveId(id), fileId = positiveId(query.get('fileId'));
    const allowedKeys = new Set(['fileId', 'imageIndex', 'sourceStamp', 'download', 'source']);
    if (!modelId || !fileId || [...query.keys()].some(key => !allowedKeys.has(key) || query.getAll(key).length !== 1)) {
      return failure('Choose a valid Model and geometry File.', 400);
    }
    const indexText = query.get('imageIndex');
    const imageIndex = indexText === null ? null : Number(indexText);
    const sourceStamp = query.get('sourceStamp');
    const sourceRequested = query.get('source') === 'true';
    if (
      (indexText !== null && (!/^(?:0|[1-9]\d*)$/.test(indexText) || !Number.isSafeInteger(imageIndex) || imageIndex! > 499))
      || ((imageIndex !== null || sourceRequested) && (!sourceStamp || !/^[a-f0-9]{64}$/.test(sourceStamp)))
      || (imageIndex === null && !sourceRequested && (sourceStamp !== null || query.has('download')))
      || (query.has('source') && (!sourceRequested || imageIndex !== null || query.has('download')))
      || (query.has('download') && !['true', 'false'].includes(query.get('download')!))
    ) return failure('Invalid embedded image request. Reload the image catalog.', 400);

    const source = await readOwnedThreeDModelEmbeddedImageSource({ modelId, fileId, userId: session.user.id, signal: request.signal, ...(sourceStamp ? { sourceStamp } : {}) });
    const { fileName, isPrimary, bytes } = source;

    try {
      if (sourceRequested) {
        const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 128);
        return new NextResponse(new Uint8Array(bytes).buffer, { headers: {
          ...PRIVATE_HEADERS, 'Content-Type': 'application/octet-stream', 'Content-Length': String(bytes.byteLength),
          'Content-Disposition': `attachment; filename="${safeName}"`, 'X-Source-Stamp': source.sourceStamp,
        } });
      }
      if (imageIndex === null) {
        const catalog = inspectThreeDModelEmbeddedImages(fileName, bytes);
        return NextResponse.json({ success: true, data: {
          modelId, fileId, fileName, isPrimary,
          sourceStamp: source.sourceStamp, catalog,
        } }, { headers: PRIVATE_HEADERS });
      }
      const image = extractThreeDModelEmbeddedImage(fileName, bytes, imageIndex);
      const disposition = query.get('download') === 'true' ? 'attachment' : 'inline';
      return new NextResponse(new Uint8Array(image.bytes).buffer, { headers: {
        ...PRIVATE_HEADERS, 'Content-Type': image.mimeType, 'Content-Length': String(image.bytes.byteLength),
        'Content-Disposition': `${disposition}; filename="${image.fileName}"`,
      } });
    } catch {
      return failure(imageIndex === null
        ? 'The geometry contains an invalid or unsupported embedded image structure.'
        : 'This embedded image is unavailable or cannot be exported. Reload the image catalog.', 422);
    }
  } catch (error) {
    if (error instanceof ThreeDEmbeddedImageReadError) return failure(error.message, error.status);
    if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) return failure('Embedded image inspection was interrupted. Try again.', 422);
    return failure('Embedded image inspection could not be completed. Try again.', 500);
  }
}
