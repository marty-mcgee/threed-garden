// app/api/caltrans/closures/stats/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures, caltransDistricts, apiRequestLogs } from '@/lib/schema';
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
        districtId: caltransDistricts.districtId,
        districtName: caltransDistricts.districtName,
        region: caltransDistricts.region,
        activeClosures: sql<number>`COUNT(${laneClosures.closureId})`,
        routesAffected: sql<string[]>`ARRAY_AGG(DISTINCT ${laneClosures.route})`,
        earliestEnd: sql<Date>`MIN(${laneClosures.endDate})`,
      })
      .from(caltransDistricts)
      .leftJoin(laneClosures, eq(caltransDistricts.districtId, laneClosures.district))
      .where(eq(laneClosures.status, 'active'))
      .groupBy(
        caltransDistricts.districtId,
        caltransDistricts.districtName,
        caltransDistricts.region
      )
      .orderBy(sql`activeClosures DESC`);
    
    // 2. Get API health stats for last 24 hours
    const apiHealth = await db
      .select({
        totalRequests: sql<number>`COUNT(*)`,
        avgResponseTime: sql<number>`AVG(${apiRequestLogs.responseTimeMs})`,
        successRate: sql<number>`(SUM(CASE WHEN ${apiRequestLogs.success} THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100`,
        lastRequest: sql<Date>`MAX(${apiRequestLogs.requestTimestamp})`,
      })
      .from(apiRequestLogs)
      .where(sql`${apiRequestLogs.requestTimestamp} > NOW() - INTERVAL '24 hours'`);
    
    // 3. Get 7-day trend
    const trends = await db
      .select({
        date: sql<Date>`DATE(${laneClosures.createdAt})`,
        newClosures: sql<number>`COUNT(*)`,
        completedClosures: sql<number>`COUNT(CASE WHEN ${laneClosures.status} = 'completed' THEN 1 END)`,
      })
      .from(laneClosures)
      .where(sql`${laneClosures.createdAt} > NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${laneClosures.createdAt})`)
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
