// src/app/api/traffic/chp-cad/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { trafficChpCadIncidents, trafficChpCadCenters } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '2000');
  const action = searchParams.get('action');

  try {
    // Handle stats action
    if (action === 'stats') {
      const total = await db.select({ count: sql<number>`COUNT(*)` }).from(trafficChpCadIncidents);
      
      const byCenter = await db
        .select({
          centerName: trafficChpCadCenters.centerName,
          centerCode: trafficChpCadCenters.centerCode,
          count: sql<number>`COUNT(*)`,
        })
        .from(trafficChpCadIncidents)
        .leftJoin(trafficChpCadCenters, eq(trafficChpCadIncidents.centerId, trafficChpCadCenters.id))
        .groupBy(trafficChpCadCenters.centerName, trafficChpCadCenters.centerCode);
      
      const byType = await db
        .select({
          incidentType: trafficChpCadIncidents.incidentType,
          count: sql<number>`COUNT(*)`,
        })
        .from(trafficChpCadIncidents)
        .groupBy(trafficChpCadIncidents.incidentType)
        .orderBy(sql`count DESC`)
        .limit(10);
      
      return NextResponse.json({
        success: true,
        data: {
          total: total[0]?.count || 0,
          byCenter,
          byType,
        },
      });
    }

    // Main query - NOW INCLUDING latitude and longitude
    const incidents = await db
      .select({
        id: trafficChpCadIncidents.id,
        sourceId: trafficChpCadIncidents.sourceId,
        incidentType: trafficChpCadIncidents.incidentType,
        location: trafficChpCadIncidents.location,
        city: trafficChpCadIncidents.city,
        county: trafficChpCadIncidents.county,
        details: trafficChpCadIncidents.details,
        logTime: trafficChpCadIncidents.logTime,
        status: trafficChpCadIncidents.status,
        latitude: trafficChpCadIncidents.latitude,    // ✅ ADDED
        longitude: trafficChpCadIncidents.longitude,  // ✅ ADDED
        createdAt: trafficChpCadIncidents.createdAt,
        centerName: trafficChpCadCenters.centerName,
        centerCode: trafficChpCadCenters.centerCode,
      })
      .from(trafficChpCadIncidents)
      .leftJoin(trafficChpCadCenters, eq(trafficChpCadIncidents.centerId, trafficChpCadCenters.id))
      .orderBy(desc(trafficChpCadIncidents.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: incidents,
      count: incidents.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('CHP CAD API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}