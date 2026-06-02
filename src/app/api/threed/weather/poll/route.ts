// src/app/api/threed/weather/poll/route.ts
import { NextResponse } from 'next/server';
import { WeatherPoller } from '@/lib/services/threed/WeatherPoller';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log(`Starting weather poll...`);
  
  const poller = new WeatherPoller();
  const result = await poller.pollCurrentWeather();
  
  return NextResponse.json({
    success: result.success,
    message: result.success ? 'Weather poll completed' : 'Poll failed',
    stats: result.stats,
    timestamp: new Date().toISOString()
  });
}