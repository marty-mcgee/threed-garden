import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Legacy discovery has no User assignment. Never create unowned content.
  return NextResponse.json({ error: 'Shared Multimedia sync requires an owner-scoped implementation.' }, { status: 503 });
}
