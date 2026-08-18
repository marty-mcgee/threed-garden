// src/app/api/traffic/caltrans/closures/raw/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { trafficCaltransLaneClosures } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const LOCAL_DISTRICT = 1; // District 1 covers Mendocino & Humboldt

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '2000');
  const showAll = searchParams.get('showAll') === 'true';
  
  try {
    const conditions = showAll
      ? eq(trafficCaltransLaneClosures.isActive, true)
      : and(
          eq(trafficCaltransLaneClosures.isActive, true),
          eq(trafficCaltransLaneClosures.districtId, LOCAL_DISTRICT)
        );
    
    const closures = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(conditions)
      .orderBy(desc(trafficCaltransLaneClosures.lastUpdated))
      .limit(limit);

    const data = closures.map((closure) => ({
      ...closure,
      closure_id: closure.id,
      source_id: closure.sourceId,
      district: closure.districtId,
      closure_type: closure.closureType,
      status: closure.isActive ? 'active' : 'completed',
      start_date: closure.startDate,
      end_date: closure.endDate,
      startTimestamp: closure.startDate,
      endTimestamp: closure.endDate,
      end_timestamp: closure.endDate,
      lastSeen: closure.lastUpdated,
      raw_data: closure.rawData,
      lanesAffected: null,
    }));
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      showAll: showAll,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Caltrans API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
