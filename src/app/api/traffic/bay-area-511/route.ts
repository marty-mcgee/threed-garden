// src/app/api/bay-area-511/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { bayAreaTrafficEvents } from '@/lib/schema';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '2000');
  const showAll = searchParams.get('showAll') === 'true';
  
  try {
    let events;
    
    if (!showAll) {
      // Only active events
      events = await db
        .select()
        .from(bayAreaTrafficEvents)
        .where(sql`${bayAreaTrafficEvents.status} = 'active'`)
        .orderBy(desc(bayAreaTrafficEvents.fetchedAt))
        .limit(limit);
    } else {
      // All events (including closed)
      events = await db
        .select()
        .from(bayAreaTrafficEvents)
        .orderBy(desc(bayAreaTrafficEvents.fetchedAt))
        .limit(limit);
    }
    
    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
      showAll: showAll,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Bay Area 511 API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}