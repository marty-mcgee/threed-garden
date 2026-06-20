// src/app/api/bay-area-511/cron/route.ts
import { NextResponse } from 'next/server';
import { BayArea511Poller } from '@/lib/services/traffic/BayArea511Poller';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  console.log(`[Cron] Bay Area 511 poll triggered at ${new Date().toISOString()}`);
  
  try {
    const poller = new BayArea511Poller();
    const result = await poller.pollAll();
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Cron poll completed' : 'Cron poll failed',
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Bay Area 511 error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}