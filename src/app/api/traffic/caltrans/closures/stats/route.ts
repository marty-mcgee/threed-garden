// app/api/traffic/caltrans/closures/stats/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { trafficCaltransLaneClosures, trafficCaltransDistricts, trafficApiRequestLogs } from '@/lib/schema';
import { eq, sql, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    // 1. Get district summary with active closures
    const districtSummary = await db
      .select({
        districtId: trafficCaltransDistricts.districtId,
        districtName: trafficCaltransDistricts.districtName,
        region: trafficCaltransDistricts.region,
        activeClosures: sql<number>`COUNT(${trafficCaltransLaneClosures.closureId})`,
        routesAffected: sql<string[]>`ARRAY_AGG(DISTINCT ${trafficCaltransLaneClosures.route})`,
        earliestEnd: sql<Date>`MIN(${trafficCaltransLaneClosures.endDate})`,
      })
      .from(trafficCaltransDistricts)
      .leftJoin(trafficCaltransLaneClosures, eq(trafficCaltransDistricts.districtId, trafficCaltransLaneClosures.district))
      .where(eq(trafficCaltransLaneClosures.status, 'active'))
      .groupBy(
        trafficCaltransDistricts.districtId,
        trafficCaltransDistricts.districtName,
        trafficCaltransDistricts.region
      )
      .orderBy(sql`activeClosures DESC`);
    
    // 2. Get API health stats for last 24 hours
    const apiHealth = await db
      .select({
        totalRequests: sql<number>`COUNT(*)`,
        avgResponseTime: sql<number>`AVG(${trafficApiRequestLogs.responseTimeMs})`,
        successRate: sql<number>`(SUM(CASE WHEN ${trafficApiRequestLogs.success} THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100`,
        lastRequest: sql<Date>`MAX(${trafficApiRequestLogs.requestTimestamp})`,
      })
      .from(trafficApiRequestLogs)
      .where(sql`${trafficApiRequestLogs.requestTimestamp} > NOW() - INTERVAL '24 hours'`);
    
    // 3. Get 7-day trend
    const trends = await db
      .select({
        date: sql<Date>`DATE(${trafficCaltransLaneClosures.createdAt})`,
        newClosures: sql<number>`COUNT(*)`,
        completedClosures: sql<number>`COUNT(CASE WHEN ${trafficCaltransLaneClosures.status} = 'completed' THEN 1 END)`,
      })
      .from(trafficCaltransLaneClosures)
      .where(sql`${trafficCaltransLaneClosures.createdAt} > NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${trafficCaltransLaneClosures.createdAt})`)
      .orderBy(sql`date DESC`);
    
    return NextResponse.json({
      success: true,
      data: {
        districts: districtSummary,
        api_health: apiHealth[0] || null,
        trends,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
