// src/app/api/chp-historical/poll/route.ts
import { NextResponse } from 'next/server';
import { CHPPoller } from '@/lib/services/traffic/CHPPoller';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'poll';
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  const poller = new CHPPoller();
  
  try {
    switch (action) {
      case 'poll':
        console.log(`Starting CHP Historical poll with limit: ${limit}, startDate: ${startDate || 'auto'}, endDate: ${endDate || 'today'}`);
        
        const result = await poller.pollAll({ 
          limit, 
          startDate: startDate || undefined,
          endDate: endDate || undefined
        });
        
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'CHP Historical poll completed' : 'Poll failed',
          stats: result.stats,
          timestamp: new Date().toISOString()
        });
        
      case 'status':
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
    console.error('CHP Historical API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}