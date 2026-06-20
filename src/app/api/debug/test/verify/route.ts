// app/api/test/verify/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  try {
    // Get all records count
    const totalCount = await sql`SELECT COUNT(*) as count FROM lane_closures`;
    
    // Get test records
    const testRecords = await sql`
      SELECT * FROM lane_closures 
      WHERE source_id LIKE 'test_%' 
      LIMIT 5
    `;
    
    // Get sample of all records
    const sample = await sql`SELECT * FROM lane_closures LIMIT 3`;
    
    return NextResponse.json({
      total_records: totalCount[0].count,
      test_records: testRecords,
      sample_records: sample,
      message: testRecords.length > 0 
        ? "Test record found! Now run the poller to get real Caltrans data."
        : "No test records found. Run /api/test/populate first."
    });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
