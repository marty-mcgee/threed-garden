import { NextResponse } from 'next/server';

// The legacy singleton writes unowned records and cannot act for an individual User.
function retired() {
  return NextResponse.json({ error: 'Shared Multimedia polling is unavailable. Use owner-scoped uploads.' },
    { status: 405, headers: { 'Cache-Control': 'private, no-store' } });
}
export const GET = retired;
export const POST = retired;
