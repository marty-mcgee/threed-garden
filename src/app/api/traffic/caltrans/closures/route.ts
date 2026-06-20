// src/app/api/caltrans/closures/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district');
  const route = searchParams.get('route');
  const status = searchParams.get('status') || 'active';
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    const conditions = [eq(laneClosures.status, status)];
    if (district) conditions.push(eq(laneClosures.district, parseInt(district)));
    if (route) conditions.push(ilike(laneClosures.route, `%${route}%`));
    
    const whereClause = and(...conditions);
    
    const closures = await db
      .select()
      .from(laneClosures)
      .where(whereClause)
      .orderBy(laneClosures.endDate)
      .offset(offset)
      .limit(limit);
    
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(laneClosures)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: closures,
      pagination: { total: Number(totalResult[0]?.count || 0), limit, offset }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}