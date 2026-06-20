// src/app/api/historical/chp/route.ts
import { NextResponse } from 'next/server';
import { CHPPoller } from '@/lib/services/traffic/CHPPoller';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'poll';
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
  
  const poller = new CHPPoller();
  
  if (action === 'poll') {
    const result = await poller.pollAll({ limit });
    return NextResponse.json({
      success: result.success,
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}