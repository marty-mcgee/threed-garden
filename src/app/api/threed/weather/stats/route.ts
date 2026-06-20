// src/app/api/threed/weather/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedWeatherLogs } from '@/lib/schema';
import { sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs);
    
    const avgTemp = await db
      .select({ avg: sql<number>`AVG(${threedWeatherLogs.temperature})` })
      .from(threedWeatherLogs);
    
    const avgHumidity = await db
      .select({ avg: sql<number>`AVG(${threedWeatherLogs.humidity})` })
      .from(threedWeatherLogs);
    
    const frostDays = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs)
      .where(sql`${threedWeatherLogs.frostWarning} = true`);
    
    const heatDays = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs)
      .where(sql`${threedWeatherLogs.heatWarning} = true`);
    
    const recent = await db
      .select()
      .from(threedWeatherLogs)
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
    });
    
  } catch (error) {
    console.error('Weather Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}