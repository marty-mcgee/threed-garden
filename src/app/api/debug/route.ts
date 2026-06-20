// app/api/debug/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  
  const results: any = {};
  
  try {
    // 1. Test database connection
    const connectionTest = await sqlClient`SELECT 1 as connected`;
    results.connection = { success: true, data: connectionTest };
  } catch (error) {
    results.connection = { success: false, error: String(error) };
  }
  
  try {
    // 2. List all tables
    const tables = await sqlClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    results.tables = tables;
  } catch (error) {
    results.tables_error = String(error);
  }
  
  try {
    // 3. Check lane_closures table structure
    const columns = await sqlClient`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lane_closures'
      ORDER BY ordinal_position
    `;
    results.lane_closures_columns = columns;
  } catch (error) {
    results.lane_closures_error = String(error);
  }
  
  try {
    // 4. Count records in lane_closures
    const count = await sqlClient`SELECT COUNT(*) FROM lane_closures`;
    results.lane_closures_count = count[0].count;
  } catch (error) {
    results.lane_closures_count_error = String(error);
  }
  
  try {
    // 5. Test a simple query
    const sample = await sqlClient`SELECT * FROM lane_closures LIMIT 1`;
    results.sample_record = sample;
  } catch (error) {
    results.sample_error = String(error);
  }
  
  try {
    // 6. Check caltrans_districts table
    const districtsCount = await sqlClient`SELECT COUNT(*) FROM caltrans_districts`;
    results.districts_count = districtsCount[0].count;
  } catch (error) {
    results.districts_error = String(error);
  }
  
  return NextResponse.json(results);
}
