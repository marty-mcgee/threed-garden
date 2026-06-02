// src/app/api/debug/schema-check/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  try {
    // Get actual column names from the database
    const laneClosuresColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lane_closures'
      ORDER BY ordinal_position
    `;
    
    const chpCollisionsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'chp_collisions'
      ORDER BY ordinal_position
    `;
    
    return NextResponse.json({
      lane_closures_columns: laneClosuresColumns,
      chp_collisions_columns: chpCollisionsColumns,
      note: "Compare these with your Drizzle schema in src/lib/schema.ts"
    });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
