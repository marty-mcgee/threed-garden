// src/app/api/master-data/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { trafficCaltransLaneClosures, trafficChpCollisions, trafficBayArea511Events, trafficChpCadIncidents } from '@/lib/schema';
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
        id: trafficCaltransLaneClosures.closureId,
        source: sql<string>`'caltrans'`,
        type: trafficCaltransLaneClosures.closureType,
        severity: trafficCaltransLaneClosures.status,
        location: trafficCaltransLaneClosures.route,
        city: trafficCaltransLaneClosures.city,
        county: trafficCaltransLaneClosures.county,
        description: trafficCaltransLaneClosures.description,
        latitude: trafficCaltransLaneClosures.latitude,
        longitude: trafficCaltransLaneClosures.longitude,
        timestamp: trafficCaltransLaneClosures.endDate,
      })
      .from(trafficCaltransLaneClosures)
      .where(sql`${trafficCaltransLaneClosures.latitude} IS NOT NULL AND ${trafficCaltransLaneClosures.longitude} IS NOT NULL`)
      .limit(200);
    
    // Fetch Bay Area 511 events with coordinates
    const trafficBayAreaEvents = await db
      .select({
        id: trafficBayArea511Events.id,
        source: sql<string>`'bayarea511'`,
        type: trafficBayArea511Events.eventType,
        severity: trafficBayArea511Events.severity,
        location: trafficBayArea511Events.roadwayName,
        city: sql<string>`NULL`,
        county: sql<string>`NULL`,
        description: trafficBayArea511Events.description,
        latitude: trafficBayArea511Events.latitude,
        longitude: trafficBayArea511Events.longitude,
        timestamp: trafficBayArea511Events.startTime,
      })
      .from(trafficBayArea511Events)
      .where(sql`${trafficBayArea511Events.latitude} IS NOT NULL AND ${trafficBayArea511Events.longitude} IS NOT NULL`)
      .limit(200);
    
    // Fetch CHP live incidents with coordinates
    const chpLiveEvents = await db
      .select({
        id: trafficChpCadIncidents.id,
        source: sql<string>`'chp-live'`,
        type: trafficChpCadIncidents.incidentType,
        severity: sql<string>`'Active'`,
        location: trafficChpCadIncidents.location,
        city: trafficChpCadIncidents.city,
        county: trafficChpCadIncidents.county,
        description: trafficChpCadIncidents.details,
        latitude: trafficChpCadIncidents.latitude,
        longitude: trafficChpCadIncidents.longitude,
        timestamp: trafficChpCadIncidents.logTime,
      })
      .from(trafficChpCadIncidents)
      .where(sql`${trafficChpCadIncidents.latitude} IS NOT NULL AND ${trafficChpCadIncidents.longitude} IS NOT NULL AND ${trafficChpCadIncidents.status} = 'active'`)
      .limit(200);
    
    // Fetch CHP historical collisions with coordinates
    const chpHistoricalEvents = await db
      .select({
        id: trafficChpCollisions.id,
        source: sql<string>`'chp-historical'`,
        type: sql<string>`'Collision'`,
        severity: trafficChpCollisions.severity,
        location: trafficChpCollisions.location,
        city: trafficChpCollisions.city,
        county: trafficChpCollisions.county,
        description: trafficChpCollisions.primaryFactor,
        latitude: trafficChpCollisions.latitude,
        longitude: trafficChpCollisions.longitude,
        timestamp: trafficChpCollisions.collisionDate,
      })
      .from(trafficChpCollisions)
      .where(sql`${trafficChpCollisions.latitude} IS NOT NULL AND ${trafficChpCollisions.longitude} IS NOT NULL`)
      .limit(200);
    
    // Combine all events
    const allEvents = [
      ...caltransEvents,
      ...trafficBayAreaEvents,
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