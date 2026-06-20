// app/api/caltrans/closures/simple/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    // Build conditions dynamically
    const conditions = [];
    
    if (district) {
      conditions.push(eq(laneClosures.district, parseInt(district)));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Execute query
    let query;
    if (whereClause) {
      query = await db
        .select()
        .from(laneClosures)
        .where(whereClause)
        .limit(limit);
    } else {
      query = await db
        .select()
        .from(laneClosures)
        .limit(limit);
    }
    
    return NextResponse.json({
      success: true,
      data: query,
      count: query.length,
      filters: { district },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Simple query error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch closures',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
