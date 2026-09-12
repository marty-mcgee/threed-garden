import { NextRequest } from 'next/server';
import { animationResponse } from '@/lib/services/threed/animations/http';
import { parseList, positiveId, AnimationLibraryError } from '@/lib/services/threed/animations/contracts';
import { listAnimationFiles, deleteAnimationFile } from '@/lib/services/threed/animations/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  return animationResponse(userId => listAnimationFiles(userId, parseList(new URL(request.url).searchParams)));
}
export function DELETE(request: NextRequest) {
  return animationResponse(userId => deleteAnimationFile(userId, positiveId(new URL(request.url).searchParams.get('id'))));
}

export async function POST(request: NextRequest) {
  return animationResponse(async userId => {
    const { uploadAnimationSource } = await import('@/lib/services/threed/animations/upload');
    const form = await request.formData().catch(() => null);
    if (!form) throw new AnimationLibraryError(400, 'Invalid animation upload');
    return uploadAnimationSource(userId, form);
  });
}
