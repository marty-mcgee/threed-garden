import { NextRequest } from 'next/server';
import { animationResponse } from '@/lib/services/threed/animations/http';
import { applyPreset } from '@/lib/services/threed/animations/presets';
export const runtime = 'nodejs';
export function POST(request: NextRequest) { return animationResponse(async userId => applyPreset(userId, await request.json().catch(() => null))); }
