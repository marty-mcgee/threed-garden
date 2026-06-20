// app/api/caltrans/closures/summary/route.ts (Confirmed Working)
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    // 1. Get counts by status
    const statusCounts = await db
      .select({
        status: laneClosures.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .groupBy(laneClosures.status);
    
    // 2. Get active closures by district
    const activeByDistrict = await db
      .select({
        district: laneClosures.district,
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .where(eq(laneClosures.status, 'active'))
      .groupBy(laneClosures.district)
      .orderBy(laneClosures.district);
    
    // 3. Get top routes with active closures
    const topRoutes = await db
      .select({
        route: laneClosures.route,
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .where(eq(laneClosures.status, 'active'))
      .groupBy(laneClosures.route)
      .orderBy(sql`count DESC`)
      .limit(10);
    
    // 4. Get closures expiring in next 24 hours
    const expiringSoon = await db
      .select()
      .from(laneClosures)
      .where(
        sql`${laneClosures.status} = 'active' AND 
            ${laneClosures.endTimestamp} > NOW() AND 
            ${laneClosures.endTimestamp} < NOW() + INTERVAL '24 hours'`
      )
      .orderBy(laneClosures.endTimestamp)
      .limit(20);
    
    // 5. Get closure types distribution
    const closureTypes = await db
      .select({
        type: laneClosures.closureType,
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .where(eq(laneClosures.status, 'active'))
      .groupBy(laneClosures.closureType)
      .orderBy(sql`count DESC`);
    
    // 6. Get today's new closures
    const todayNew = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .where(sql`DATE(${laneClosures.createdAt}) = CURRENT_DATE`);
    
    const totalActive = activeByDistrict.reduce((sum, d) => sum + (Number(d.count) || 0), 0);
    
    return NextResponse.json({
      success: true,
      summary: {
        totals: {
          total_active: totalActive,
          total_by_status: statusCounts,
          new_today: Number(todayNew[0]?.count || 0),
        },
        by_district: activeByDistrict,
        top_routes: topRoutes,
        by_type: closureTypes,
        expiring_soon: {
          count: expiringSoon.length,
          closures: expiringSoon
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch summary',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
