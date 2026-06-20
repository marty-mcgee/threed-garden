// src/app/api/chp-historical/collisions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { chpCollisions } from '@/lib/schema';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const showAll = searchParams.get('showAll') === 'true';
  
  try {
    // Build query with DESC order (most recent first)
    let query = db
      .select()
      .from(chpCollisions)
      .orderBy(desc(chpCollisions.collisionDate))
      .limit(limit)
      .offset(offset);
    
    // If not showAll, filter to local counties (already done in backfill)
    // But we can keep as is
    
    const collisions = await query;
    
    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chpCollisions);
    
    return NextResponse.json({
      success: true,
      data: collisions,
      count: collisions.length,
      total: totalResult[0]?.count || 0,
      offset,
      limit,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('CHP Historical API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}