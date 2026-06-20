// src/app/api/chp-cad/cron/route.ts
import { NextResponse } from 'next/server';
import { CHPCADPoller } from '@/lib/services/traffic/CHPCADPoller';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  console.log(`[Cron] CHP CAD poll triggered at ${new Date().toISOString()}`);
  
  try {
    const poller = new CHPCADPoller();
    const result = await poller.pollAll({ startDate: '2026-05-20' });
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Cron poll completed' : 'Cron poll failed',
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] CHP CAD error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}