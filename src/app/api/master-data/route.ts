// src/app/api/master-data/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures, chpCollisions, bayAreaTrafficEvents, chpCadIncidents } from '@/lib/auth/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  
  try {
    // Fetch Caltrans closures with coordinates
    const caltransEvents = await db
      .select({
        id: laneClosures.closureId,
        source: sql<string>`'caltrans'`,
        type: laneClosures.closureType,
        severity: laneClosures.status,
        location: laneClosures.route,
        city: laneClosures.city,
        county: laneClosures.county,
        description: laneClosures.description,
        latitude: laneClosures.latitude,
        longitude: laneClosures.longitude,
        timestamp: laneClosures.endDate,
      })
      .from(laneClosures)
      .where(sql`${laneClosures.latitude} IS NOT NULL AND ${laneClosures.longitude} IS NOT NULL`)
      .limit(200);
    
    // Fetch Bay Area 511 events with coordinates
    const bayAreaEvents = await db
      .select({
        id: bayAreaTrafficEvents.id,
        source: sql<string>`'bayarea511'`,
        type: bayAreaTrafficEvents.eventType,
        severity: bayAreaTrafficEvents.severity,
        location: bayAreaTrafficEvents.roadwayName,
        city: sql<string>`NULL`,
        county: sql<string>`NULL`,
        description: bayAreaTrafficEvents.description,
        latitude: bayAreaTrafficEvents.latitude,
        longitude: bayAreaTrafficEvents.longitude,
        timestamp: bayAreaTrafficEvents.startTime,
      })
      .from(bayAreaTrafficEvents)
      .where(sql`${bayAreaTrafficEvents.latitude} IS NOT NULL AND ${bayAreaTrafficEvents.longitude} IS NOT NULL`)
      .limit(200);
    
    // Fetch CHP live incidents with coordinates
    const chpLiveEvents = await db
      .select({
        id: chpCadIncidents.id,
        source: sql<string>`'chp-live'`,
        type: chpCadIncidents.incidentType,
        severity: sql<string>`'Active'`,
        location: chpCadIncidents.location,
        city: chpCadIncidents.city,
        county: chpCadIncidents.county,
        description: chpCadIncidents.details,
        latitude: chpCadIncidents.latitude,
        longitude: chpCadIncidents.longitude,
        timestamp: chpCadIncidents.logTime,
      })
      .from(chpCadIncidents)
      .where(sql`${chpCadIncidents.latitude} IS NOT NULL AND ${chpCadIncidents.longitude} IS NOT NULL AND ${chpCadIncidents.status} = 'active'`)
      .limit(200);
    
    // Fetch CHP historical collisions with coordinates
    const chpHistoricalEvents = await db
      .select({
        id: chpCollisions.id,
        source: sql<string>`'chp-historical'`,
        type: sql<string>`'Collision'`,
        severity: chpCollisions.severity,
        location: chpCollisions.location,
        city: chpCollisions.city,
        county: chpCollisions.county,
        description: chpCollisions.primaryFactor,
        latitude: chpCollisions.latitude,
        longitude: chpCollisions.longitude,
        timestamp: chpCollisions.collisionDate,
      })
      .from(chpCollisions)
      .where(sql`${chpCollisions.latitude} IS NOT NULL AND ${chpCollisions.longitude} IS NOT NULL`)
      .limit(200);
    
    // Combine all events
    const allEvents = [
      ...caltransEvents,
      ...bayAreaEvents,
      ...chpLiveEvents,
      ...chpHistoricalEvents,
    ];
    
    // Calculate summary
    const bySource: Record<string, number> = {};
    allEvents.forEach(event => {
      const source = event.source as string;
      bySource[source] = (bySource[source] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      events: allEvents,
      summary: {
        total: allEvents.length,
        bySource,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Master data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master data', details: String(error) },
      { status: 500 }
    );
  }
}