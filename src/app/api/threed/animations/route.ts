import { NextRequest } from 'next/server';
import { animationResponse } from '@/lib/services/threed/animations/http';
import { parseList, parseClipUpdate, positiveId } from '@/lib/services/threed/animations/contracts';
import { listAnimations, updateAnimation, deleteAnimation } from '@/lib/services/threed/animations/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  return animationResponse(userId => listAnimations(userId, parseList(new URL(request.url).searchParams)));
}
export function PATCH(request: NextRequest) {
  return animationResponse(async userId => updateAnimation(userId, parseClipUpdate(await request.json().catch(() => null))));
}
export function DELETE(request: NextRequest) {
  return animationResponse(userId => deleteAnimation(userId, positiveId(new URL(request.url).searchParams.get('id'))));
}
