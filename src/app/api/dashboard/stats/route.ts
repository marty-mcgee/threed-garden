// app/api/dashboard/stats/route.ts
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
    
    // Get all stats in parallel using Promise.all for better performance
    const [
      totalActive,
      totalCompleted,
      uniqueRoutes,
      closuresLast24h,
      districtStats,
      recentActivity
    ] = await Promise.all([
      // Total active closures
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(laneClosures)
        .where(eq(laneClosures.status, 'active')),
      
      // Total completed closures
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(laneClosures)
        .where(eq(laneClosures.status, 'completed')),
      
      // Unique routes with active closures
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${laneClosures.route})` })
        .from(laneClosures)
        .where(eq(laneClosures.status, 'active')),
      
      // New closures in last 24 hours
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(laneClosures)
        .where(sql`${laneClosures.createdAt} > NOW() - INTERVAL '24 hours'`),
      
      // Stats by district
      db
        .select({
          district: laneClosures.district,
          total: sql<number>`COUNT(*)`,
          active: sql<number>`COUNT(CASE WHEN ${laneClosures.status} = 'active' THEN 1 END)`,
        })
        .from(laneClosures)
        .groupBy(laneClosures.district)
        .orderBy(laneClosures.district),
      
      // Weekly trend (last 7 days)
      db
        .select({
          date: sql<Date>`DATE(${laneClosures.createdAt})`,
          newClosures: sql<number>`COUNT(*)`,
        })
        .from(laneClosures)
        .where(sql`${laneClosures.createdAt} > NOW() - INTERVAL '7 days'`)
        .groupBy(sql`DATE(${laneClosures.createdAt})`)
        .orderBy(sql`date DESC`)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_active: Number(totalActive[0]?.count || 0),
          total_completed: Number(totalCompleted[0]?.count || 0),
          unique_routes: Number(uniqueRoutes[0]?.count || 0),
          new_last_24h: Number(closuresLast24h[0]?.count || 0),
        },
        by_district: districtStats.map(d => ({
          district: d.district,
          total: Number(d.total),
          active: Number(d.active)
        })),
        weekly_trend: recentActivity.map(day => ({
          date: day.date,
          new_closures: Number(day.newClosures)
        })),
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
