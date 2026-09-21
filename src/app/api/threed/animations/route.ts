import { NextRequest } from 'next/server';
import { animationResponse } from '@/libraries/services/threed/animations/http';
import { parseList, parseClipUpdate, positiveId } from '@/libraries/services/threed/animations/contracts';
import { getAnimation, listAnimations, updateAnimation, deleteAnimation } from '@/libraries/services/threed/animations/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  return animationResponse(userId => {
    const params = new URL(request.url).searchParams;
    return params.has('id') ? getAnimation(userId, positiveId(params.get('id'))) : listAnimations(userId, parseList(params));
  });
}
export function PATCH(request: NextRequest) {
  return animationResponse(async userId => updateAnimation(userId, parseClipUpdate(await request.json().catch(() => null))));
}
export function DELETE(request: NextRequest) {
  return animationResponse(userId => deleteAnimation(userId, positiveId(new URL(request.url).searchParams.get('id'))));
}
