import { NextRequest } from 'next/server';
import { animationResponse } from '@/libraries/services/threed/animations/http';
import { parseTarget, parseAction, parseAssignment } from '@/libraries/services/threed/animations/contracts';
import { getAssignments, putAssignment, removeAssignment } from '@/libraries/services/threed/animations/library';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  return animationResponse(userId => {
    const params = new URL(request.url).searchParams;
    return getAssignments(userId, parseTarget(params.get('target'), params.get('targetId')));
  });
}
export function PUT(request: NextRequest) {
  return animationResponse(async userId => putAssignment(userId, parseAssignment(await request.json().catch(() => null))));
}
export function DELETE(request: NextRequest) {
  return animationResponse(userId => {
    const params = new URL(request.url).searchParams;
    return removeAssignment(userId, parseTarget(params.get('target'), params.get('targetId')), parseAction(params.get('actionKey')));
  });
}
