// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { trafficCaltransLaneClosures, trafficBayArea511Events, trafficChpCadIncidents, trafficChpCases } from '@/lib/schema';
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
        .from(trafficCaltransLaneClosures)
        .where(
          showAllRegions 
            ? eq(trafficCaltransLaneClosures.status, 'active')
            : sql`${trafficCaltransLaneClosures.status} = 'active' AND ${trafficCaltransLaneClosures.district} = 1`
        )
        .limit(10),
      
      // Bay Area 511 events (Mendocino only unless showAllRegions)
      db
        .select()
        .from(trafficBayArea511Events)
        .where(
          showAllRegions 
            ? eq(trafficBayArea511Events.status, 'active')
            : sql`${trafficBayArea511Events.status} = 'active' AND LOWER(${trafficBayArea511Events.roadwayName}) LIKE '%mendocino%' OR LOWER(${trafficBayArea511Events.roadwayName}) LIKE '%ukiah%'`
        )
        .limit(10),
      
      // CHP Live incidents (already filtered to Ukiah/Humboldt)
      db
        .select()
        .from(trafficChpCadIncidents)
        .where(eq(trafficChpCadIncidents.status, 'active'))
        .limit(10),
      
      // CHP Historical collisions (local counties only unless showAllRegions)
      showHistorical
        ? db
            .select()
            .from(trafficChpCases)
            .where(
              showAllRegions 
                ? undefined
                : sql`${trafficChpCases.county} IN ('12', '23')`  // Humboldt & Mendocino
            )
            .orderBy(desc(trafficChpCases.collisionDate))
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