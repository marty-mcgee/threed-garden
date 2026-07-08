// app/api/traffic/caltrans/closures/search/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { trafficCaltransLaneClosures } from '@/lib/schema';
import { eq, or, ilike, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '20');
  
  if (!q || q.length < 2) {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Search query must be at least 2 characters'
    });
  }
  
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    const searchPattern = `%${q}%`;
    
    // Build search conditions
    const searchConditions = or(
      ilike(trafficCaltransLaneClosures.description, searchPattern),
      ilike(trafficCaltransLaneClosures.route, searchPattern),
      ilike(trafficCaltransLaneClosures.city, searchPattern),
      ilike(trafficCaltransLaneClosures.county, searchPattern)
    );
    
    const whereClause = and(
      eq(trafficCaltransLaneClosures.status, 'active'),
      searchConditions
    );
    
    // Execute search with relevance ranking
    const results = await db
      .select({
        closureId: trafficCaltransLaneClosures.closureId,
        route: trafficCaltransLaneClosures.route,
        closureType: trafficCaltransLaneClosures.closureType,
        description: trafficCaltransLaneClosures.description,
        city: trafficCaltransLaneClosures.city,
        county: trafficCaltransLaneClosures.county,
        endDate: trafficCaltransLaneClosures.endDate,
        status: trafficCaltransLaneClosures.status,
        // Add relevance score
        rank: sql<number>`ts_rank(
          to_tsvector('english', 
            COALESCE(${trafficCaltransLaneClosures.description}, '') || ' ' || 
            COALESCE(${trafficCaltransLaneClosures.route}, '') || ' ' || 
            COALESCE(${trafficCaltransLaneClosures.city}, '')
          ),
          plainto_tsquery('english', ${q})
        )`,
      })
      .from(trafficCaltransLaneClosures)
      .where(whereClause)
      .orderBy(sql`rank DESC, ${trafficCaltransLaneClosures.endDate} ASC`)
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: results,
      query: q,
      count: results.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
