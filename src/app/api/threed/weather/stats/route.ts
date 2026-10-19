// src/app/api/threed/weather/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/libraries/db/client';
import { threedWeatherLogs } from '@/libraries/schema';
import { auth } from '@/libraries/auth';
import { weatherReadingColumns } from '@/libraries/services/threed/project-weather';
import { and, eq, sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
    const owner = eq(threedWeatherLogs.userId, session.user.id);
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs).where(owner);
    
    const avgTemp = await db
      .select({ avg: sql<number>`AVG(${threedWeatherLogs.temperature})` })
      .from(threedWeatherLogs).where(owner);
    
    const avgHumidity = await db
      .select({ avg: sql<number>`AVG(${threedWeatherLogs.humidity})` })
      .from(threedWeatherLogs).where(owner);
    
    const frostDays = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs)
      .where(and(owner, eq(threedWeatherLogs.frostWarning, true)));
    
    const heatDays = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs)
      .where(and(owner, eq(threedWeatherLogs.heatWarning, true)));
    
    const recent = await db
      .select(weatherReadingColumns)
      .from(threedWeatherLogs)
      .where(owner)
      .orderBy(desc(threedWeatherLogs.recordedAt))
      .limit(1);
    
    return NextResponse.json({
      success: true,
      data: {
        total: Number(total[0]?.count) || 0,
        avgTemperatureF: Number(avgTemp[0]?.avg) || 0,
        avgHumidityPercent: Number(avgHumidity[0]?.avg) || 0,
        frostDays: Number(frostDays[0]?.count) || 0,
        heatDays: Number(heatDays[0]?.count) || 0,
        lastReading: recent[0] || null,
      },
      timestamp: new Date().toISOString()
    }, { headers: { 'Cache-Control': 'private, no-store' } });
    
  } catch (error) {
    console.error('Weather Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
