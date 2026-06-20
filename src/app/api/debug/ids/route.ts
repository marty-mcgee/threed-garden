// app/api/debug/ids/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  try {
    const closures = await sql`
      SELECT closure_id, route, status, district 
      FROM lane_closures 
      ORDER BY closure_id 
      LIMIT 50
    `;
    
    return NextResponse.json({
      success: true,
      count: closures.length,
      closures: closures
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
