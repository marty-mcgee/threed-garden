// app/api/caltrans/closures/summary/debug/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  const results: any = {};
  
  try {
    // Test 1: Simple count
    const totalCount = await sql`SELECT COUNT(*) as count FROM lane_closures`;
    results.total_count = totalCount[0].count;
    
    // Test 2: Status counts (simple)
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count 
      FROM lane_closures 
      GROUP BY status
    `;
    results.status_counts = statusCounts;
    
    // Test 3: District counts (simple)
    const districtCounts = await sql`
      SELECT district, COUNT(*) as count 
      FROM lane_closures 
      WHERE status = 'active'
      GROUP BY district
      ORDER BY district
    `;
    results.district_counts = districtCounts;
    
    // Test 4: Route counts (simple)
    const routeCounts = await sql`
      SELECT route, COUNT(*) as count 
      FROM lane_closures 
      WHERE status = 'active'
      GROUP BY route 
      ORDER BY count DESC 
      LIMIT 10
    `;
    results.route_counts = routeCounts;
    
    // Test 5: Expiring soon
    const expiringSoon = await sql`
      SELECT * FROM lane_closures 
      WHERE status = 'active' 
        AND end_timestamp > NOW() 
        AND end_timestamp < NOW() + INTERVAL '24 hours'
      ORDER BY end_timestamp 
      LIMIT 20
    `;
    results.expiring_soon_count = expiringSoon.length;
    results.expiring_soon_sample = expiringSoon.slice(0, 3);
    
    return NextResponse.json({
      success: true,
      data: results,
      message: "All queries working. Now you can build the summary endpoint."
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
