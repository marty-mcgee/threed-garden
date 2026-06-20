// src/app/api/caltrans/poll/route.ts
import { NextResponse } from 'next/server';
import { CaltransPoller } from '@/lib/services/traffic/CaltransPoller';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'poll';
  
  const poller = new CaltransPoller();
  
  try {
    switch (action) {
      case 'poll':
        const result = await poller.pollAll();
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Caltrans poll completed' : 'Poll failed',
          stats: result.stats,
          timestamp: new Date().toISOString()
        });
      case 'stats':
        const stats = await poller.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
          isPolling: poller.isPollingActive(),
          timestamp: new Date().toISOString()
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Caltrans API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}