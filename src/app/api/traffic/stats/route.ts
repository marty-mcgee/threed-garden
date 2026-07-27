// app/api/traffic/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  trafficChpCadIncidents,
  trafficChpCases,
  trafficCaltransLaneClosures,
  trafficBayArea511Events,
} from '@/lib/schema/traffic';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get CHP-CAD incidents count
    const [incidentCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(case when status = 'active' then 1 end)`,
        cleared: sql<number>`count(case when status = 'cleared' then 1 end)`,
      })
      .from(trafficChpCadIncidents)
      .where(eq(trafficChpCadIncidents.userId, userId));

    // Get CHP cases count
    const [caseCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficChpCases)
      .where(eq(trafficChpCases.userId, userId));

    // Get active closures count
    const [closureCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficCaltransLaneClosures)
      .where(
        sql`${trafficCaltransLaneClosures.userId} = ${userId} AND ${trafficCaltransLaneClosures.status} = 'active'`
      );

    // Get 511 events count
    const [eventCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficBayArea511Events)
      .where(
        sql`${trafficBayArea511Events.userId} = ${userId} AND ${trafficBayArea511Events.status} = 'active'`
      );

    return NextResponse.json({
      success: true,
      data: {
        totalIncidents: incidentCounts?.total || 0,
        activeIncidents: incidentCounts?.active || 0,
        clearedIncidents: incidentCounts?.cleared || 0,
        totalCases: caseCount?.count || 0,
        activeClosures: closureCount?.count || 0,
        totalEvents: eventCount?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}