import { NextRequest } from 'next/server';
import { animationResponse } from '@/lib/services/threed/animations/http';
import { positiveId } from '@/lib/services/threed/animations/contracts';
import { listPresets, getPreset, savePreset, deletePreset } from '@/lib/services/threed/animations/presets';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  return animationResponse(userId => { const id = request.nextUrl.searchParams.get('id'); return id ? getPreset(userId, positiveId(id)) : listPresets(userId); });
}
export function POST(request: NextRequest) { return animationResponse(async userId => savePreset(userId, await request.json().catch(() => null), false)); }
export function PUT(request: NextRequest) { return animationResponse(async userId => savePreset(userId, await request.json().catch(() => null), true)); }
export function DELETE(request: NextRequest) { return animationResponse(userId => deletePreset(userId, positiveId(request.nextUrl.searchParams.get('id')), positiveId(request.nextUrl.searchParams.get('revision')))); }
