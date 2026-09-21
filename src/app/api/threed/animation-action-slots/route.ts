import { NextRequest } from 'next/server';
import { animationResponse } from '@/libraries/services/threed/animations/http';
import { positiveId } from '@/libraries/services/threed/animations/contracts';
import { listActionSlots, saveActionSlot, deleteActionSlot } from '@/libraries/services/threed/animations/slots';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() { return animationResponse(listActionSlots); }
export function POST(request: NextRequest) { return animationResponse(async userId => saveActionSlot(userId, await request.json().catch(() => null))); }
export function DELETE(request: NextRequest) { return animationResponse(userId => deleteActionSlot(userId, positiveId(request.nextUrl.searchParams.get('id')))); }
