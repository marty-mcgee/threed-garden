import { NextResponse } from 'next/server';

/** Refresh is an authenticated, same-origin POST at the Project boundary. */
const retired = () => NextResponse.json({ success: false, error: 'Update Weather from the Project Scene.' },
  { status: 405, headers: { 'Cache-Control': 'private, no-store' } });
export const GET = retired;
export const POST = retired;
