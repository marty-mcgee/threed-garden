import { NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { auth } from '@/libraries/auth';
import { authorizeThreeDDirectUpload, completeThreeDDirectUpload, verifyThreeDDirectUpload } from '@/libraries/services/threed/models/model-direct-upload-server';

export const runtime = 'nodejs';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store' };

async function boundedBody(request: NextRequest) {
  const reader = request.body?.getReader(); if (!reader) throw new Error('Missing upload request.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const next = await reader.read(); if (next.done) break;
    size += next.value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new Error('Upload request is too large.'); }
    chunks.push(next.value);
  }
  return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Sign in to upload a Model.' }, { status: 401, headers });
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret) return NextResponse.json({ success: false, error: 'Model storage is not configured.' }, { status: 503, headers });
  try {
    const body = await boundedBody(request), userId = session.user.id;
    if (body.action === 'authorize') {
      const data = authorizeThreeDDirectUpload(userId, body.fileName, body.fileSize, secret, crypto.randomUUID());
      return NextResponse.json({ success: true, data }, { headers });
    }
    if (body.action === 'complete') {
      const receipt = verifyThreeDDirectUpload(body.authorization, userId, secret);
      const object = await head(receipt.pathname, { abortSignal: AbortSignal.timeout(15_000) });
      const data = await completeThreeDDirectUpload(receipt, object);
      return NextResponse.json({ success: true, data }, { headers });
    }
    if (body.type !== 'blob.generate-client-token') throw new Error('Invalid upload operation.');
    const response = await handleUpload({ request, body: body as unknown as HandleUploadBody,
      onBeforeGenerateToken: async (pathname, authorization) => {
        const receipt = verifyThreeDDirectUpload(authorization, userId, secret);
        if (pathname !== receipt.pathname) throw new Error('Upload destination does not match its authorization.');
        return { allowedContentTypes: [receipt.contentType], maximumSizeInBytes: receipt.fileSize,
          validUntil: receipt.expiresAt, addRandomSuffix: false, allowOverwrite: false };
      },
    });
    return NextResponse.json(response, { headers });
  } catch (error) {
    const safe = error instanceof Error && /^(Upload |Uploaded Model |Choose |The Model file |.+ is [\d.]+ MiB\.)/.test(error.message);
    return NextResponse.json({ success: false, error: safe ? (error as Error).message : 'Model upload verification failed. Check the file and retry.' }, { status: 400, headers });
  }
}
