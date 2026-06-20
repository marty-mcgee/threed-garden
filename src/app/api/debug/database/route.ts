// app/api/debug/database/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  
  try {
    // Get ALL records using Drizzle
    const allRecords = await db.select().from(laneClosures);
    
    // Get counts by status
    const statusCounts = await db
      .select({
        status: laneClosures.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .groupBy(laneClosures.status);
    
    // Get sample records with full details
    const sampleRecords = await db
      .select({
        closureId: laneClosures.closureId,
        sourceId: laneClosures.sourceId,
        status: laneClosures.status,
        route: laneClosures.route,
        closureType: laneClosures.closureType,
        startDate: laneClosures.startDate,
        endDate: laneClosures.endDate,
        createdAt: laneClosures.createdAt,
      })
      .from(laneClosures)
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
