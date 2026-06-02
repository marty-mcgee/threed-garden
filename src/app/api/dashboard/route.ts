// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { laneClosures, bayAreaTrafficEvents, chpCadIncidents, chpCollisions } from '@/lib/auth/schema';
import { sql, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showAllRegions = searchParams.get('showAll') === 'true';
  const showHistorical = searchParams.get('historical') === 'true';
  
  try {
    // Fetch all data in parallel using Promise.all
    const [caltransData, bayAreaData, chpLiveData, chpHistoricalData] = await Promise.all([
      // Caltrans lane closures (District 1 only unless showAllRegions)
      db
        .select()
        .from(laneClosures)
        .where(
          showAllRegions 
            ? eq(laneClosures.status, 'active')
            : sql`${laneClosures.status} = 'active' AND ${laneClosures.district} = 1`
        )
        .limit(10),
      
      // Bay Area 511 events (Mendocino only unless showAllRegions)
      db
        .select()
        .from(bayAreaTrafficEvents)
        .where(
          showAllRegions 
            ? eq(bayAreaTrafficEvents.status, 'active')
            : sql`${bayAreaTrafficEvents.status} = 'active' AND LOWER(${bayAreaTrafficEvents.roadwayName}) LIKE '%mendocino%' OR LOWER(${bayAreaTrafficEvents.roadwayName}) LIKE '%ukiah%'`
        )
        .limit(10),
      
      // CHP Live incidents (already filtered to Ukiah/Humboldt)
      db
        .select()
        .from(chpCadIncidents)
        .where(eq(chpCadIncidents.status, 'active'))
        .limit(10),
      
      // CHP Historical collisions (local counties only unless showAllRegions)
      showHistorical
        ? db
            .select()
            .from(chpCollisions)
            .where(
              showAllRegions 
                ? undefined
                : sql`${chpCollisions.county} IN ('12', '23')`  // Humboldt & Mendocino
            )
            .orderBy(desc(chpCollisions.collisionDate))
            .limit(10)
        : Promise.resolve([])
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        caltrans: caltransData,
        bayArea511: bayAreaData,
        chpLive: chpLiveData,
        chpHistorical: chpHistoricalData,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}