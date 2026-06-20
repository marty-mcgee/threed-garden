// src/app/api/caltrans/cron/route.ts
import { NextResponse } from 'next/server';
import { CaltransPoller } from '@/lib/services/traffic/CaltransPoller';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  console.log(`[Cron] Caltrans poll triggered at ${new Date().toISOString()}`);
  
  try {
    const poller = new CaltransPoller();
    const result = await poller.pollAll();
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Cron poll completed' : 'Cron poll failed',
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Caltrans error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}