// app/api/debug/database/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { trafficCaltransLaneClosures } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  
  try {
    // Get ALL records using Drizzle
    const allRecords = await db.select().from(trafficCaltransLaneClosures);
    
    // Get counts by status
    const statusCounts = await db
      .select({
        status: trafficCaltransLaneClosures.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(trafficCaltransLaneClosures)
      .groupBy(trafficCaltransLaneClosures.status);
    
    // Get sample records with full details
    const sampleRecords = await db
      .select({
        closureId: trafficCaltransLaneClosures.closureId,
        sourceId: trafficCaltransLaneClosures.sourceId,
        status: trafficCaltransLaneClosures.status,
        route: trafficCaltransLaneClosures.route,
        closureType: trafficCaltransLaneClosures.closureType,
        startDate: trafficCaltransLaneClosures.startDate,
        endDate: trafficCaltransLaneClosures.endDate,
        createdAt: trafficCaltransLaneClosures.createdAt,
      })
      .from(trafficCaltransLaneClosures)
      .limit(5);
    
    return NextResponse.json({
      success: true,
      total_records: allRecords.length,
      status_counts: statusCounts,
      sample_records: sampleRecords,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug database error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
