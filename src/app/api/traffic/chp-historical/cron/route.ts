// src/app/api/chp-historical/cron/route.ts
import { NextResponse } from 'next/server';
import { CHPPoller } from '@/lib/services/traffic/CHPPoller';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  console.log(`[Cron] CHP Historical poll triggered at ${new Date().toISOString()}`);
  
  try {
    const poller = new CHPPoller();
    // Fetch last 7 days of data by default for cron
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const result = await poller.pollAll({ 
      limit: 1000, 
      startDate, 
      endDate 
    });
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Cron poll completed' : 'Cron poll failed',
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] CHP Historical error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}