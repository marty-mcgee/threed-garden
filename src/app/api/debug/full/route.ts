// app/api/debug/full/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  const rawSql = neon(connectionString);
  
  try {
    // Get ALL records using Drizzle
    const allDrizzleRecords = await db.select().from(laneClosures);
    
    // Get raw SQL records (bypassing Drizzle)
    const allRawRecords = await rawSql`SELECT * FROM lane_closures`;
    
    // Get column names and types
    const columns = await rawSql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lane_closures'
      ORDER BY ordinal_position
    `;
    
    // Check for NULL status
    const nullStatus = await rawSql`
      SELECT COUNT(*) as count FROM lane_closures WHERE status IS NULL
    `;
    
    // Get distinct status values
    const distinctStatuses = await rawSql`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM lane_closures 
      GROUP BY status
    `;
    
    // Get a sample record
    const sampleRecord = await rawSql`SELECT * FROM lane_closures LIMIT 1`;
    
    // Check for common issues
    const issues = [];
    if (nullStatus[0]?.count > 0) {
      issues.push(`${nullStatus[0].count} record(s) have NULL status`);
    }
    if (allRawRecords.length === 0) {
      issues.push('No records found in database');
    }
    
    return NextResponse.json({
      success: true,
      total_records_drizzle: allDrizzleRecords.length,
      total_records_raw: allRawRecords.length,
      columns: columns,
      distinct_statuses: distinctStatuses,
      null_status_count: nullStatus[0]?.count || 0,
      issues: issues,
      sample_record: sampleRecord[0] || null,
      all_records: allRawRecords,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug full error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
