// src/app/api/calfire/cron/route.ts
import { NextResponse } from 'next/server';
import { CalFirePoller } from '@/lib/services/traffic/CalFirePoller';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  console.log(`[Cron] CalFire poll triggered at ${new Date().toISOString()}`);
  
  try {
    const poller = new CalFirePoller();
    const result = await poller.pollActive();
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Cron poll completed' : 'Cron poll failed',
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] CalFire error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}