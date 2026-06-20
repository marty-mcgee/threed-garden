// app/api/debug/compare/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  const rawSql = neon(connectionString);
  
  try {
    // Get ALL active closures from Drizzle
    const drizzleActive = await db
      .select()
      .from(laneClosures)
      .where(eq(laneClosures.status, 'active'));
    
    // Get ALL active closures from raw SQL
    const rawActive = await rawSql`
      SELECT * FROM lane_closures WHERE status = 'active'
    `;
    
    // Get count by district from Drizzle
    const drizzleByDistrict = await db
      .select({
        district: laneClosures.district,
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .where(eq(laneClosures.status, 'active'))
      .groupBy(laneClosures.district);
    
    // Get count by district from raw SQL
    const rawByDistrict = await rawSql`
      SELECT district, COUNT(*) as count 
      FROM lane_closures 
      WHERE status = 'active' 
      GROUP BY district
    `;
    
    const countsMatch = drizzleActive.length === rawActive.length;
    
    return NextResponse.json({
      success: true,
      comparison: {
        drizzle_active_count: drizzleActive.length,
        raw_active_count: rawActive.length,
        counts_match: countsMatch,
        drizzle_by_district: drizzleByDistrict,
        raw_by_district: rawByDistrict,
      },
      sample_drizzle_record: drizzleActive[0] || null,
      sample_raw_record: rawActive[0] || null,
      note: countsMatch 
        ? "Drizzle and raw SQL return same counts" 
        : "Mismatch detected - check Drizzle query logic",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug compare error:', error);
    return NextResponse.json(
      { 
        error: 'Compare failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
