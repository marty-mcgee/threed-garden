// src/app/api/chp-cad/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { chpCadIncidents, chpCadCenters } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '2000');
  const action = searchParams.get('action');

  try {
    // Handle stats action
    if (action === 'stats') {
      const total = await db.select({ count: sql<number>`COUNT(*)` }).from(chpCadIncidents);
      
      const byCenter = await db
        .select({
          centerName: chpCadCenters.centerName,
          centerCode: chpCadCenters.centerCode,
          count: sql<number>`COUNT(*)`,
        })
        .from(chpCadIncidents)
        .leftJoin(chpCadCenters, eq(chpCadIncidents.centerId, chpCadCenters.id))
        .groupBy(chpCadCenters.centerName, chpCadCenters.centerCode);
      
      const byType = await db
        .select({
          incidentType: chpCadIncidents.incidentType,
          count: sql<number>`COUNT(*)`,
        })
        .from(chpCadIncidents)
        .groupBy(chpCadIncidents.incidentType)
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
        id: chpCadIncidents.id,
        sourceId: chpCadIncidents.sourceId,
        incidentType: chpCadIncidents.incidentType,
        location: chpCadIncidents.location,
        city: chpCadIncidents.city,
        county: chpCadIncidents.county,
        details: chpCadIncidents.details,
        logTime: chpCadIncidents.logTime,
        status: chpCadIncidents.status,
        latitude: chpCadIncidents.latitude,    // ✅ ADDED
        longitude: chpCadIncidents.longitude,  // ✅ ADDED
        createdAt: chpCadIncidents.createdAt,
        centerName: chpCadCenters.centerName,
        centerCode: chpCadCenters.centerCode,
      })
      .from(chpCadIncidents)
      .leftJoin(chpCadCenters, eq(chpCadIncidents.centerId, chpCadCenters.id))
      .orderBy(desc(chpCadIncidents.createdAt))
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