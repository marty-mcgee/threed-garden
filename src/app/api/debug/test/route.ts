// app/api/debug/test/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  const results: any = {};
  
  try {
    // Test 1: Basic connection
    const connectionTest = await sql`SELECT 1 as connected`;
    results.connection = { success: true, message: 'Database connected' };
  } catch (error) {
    results.connection = { success: false, error: String(error) };
  }
  
  try {
    // Test 2: Check if lane_closures table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lane_closures'
      )
    `;
    results.table_exists = tableCheck[0]?.exists || false;
  } catch (error) {
    results.table_error = String(error);
  }
  
  try {
    // Test 3: Count records
    const count = await sql`SELECT COUNT(*) as count FROM lane_closures`;
    results.record_count = count[0]?.count || 0;
  } catch (error) {
    results.count_error = String(error);
  }
  
  try {
    // Test 4: Get one record
    const sample = await sql`SELECT * FROM lane_closures LIMIT 1`;
    results.sample_record = sample[0] || null;
  } catch (error) {
    results.sample_error = String(error);
  }
  
  return NextResponse.json({
    success: results.connection?.success === true,
    results,
    timestamp: new Date().toISOString()
  });
}
