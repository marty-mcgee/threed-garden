// src/app/api/caltrans/closures/raw/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { laneClosures } from '@/lib/schema';
import { sql, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const LOCAL_DISTRICT = 1; // District 1 covers Mendocino & Humboldt

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '2000');
  const showAll = searchParams.get('showAll') === 'true';
  
  try {
    let conditions;
    
    if (!showAll) {
      // Filter to District 1 only
      conditions = sql`${laneClosures.status} = 'active' AND ${laneClosures.district} = ${LOCAL_DISTRICT}`;
    } else {
      // Show all active closures statewide
      conditions = eq(laneClosures.status, 'active');
    }
    
    const closures = await db
      .select()
      .from(laneClosures)
      .where(conditions)
      .orderBy(desc(laneClosures.lastSeen))
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: closures,
      count: closures.length,
      showAll: showAll,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Caltrans API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}