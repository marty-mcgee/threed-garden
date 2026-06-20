// src/app/api/calfire/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { calfireIncidents } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '200');
  const showAll = searchParams.get('showAll') === 'true';
  
  try {
    let query = db
      .select()
      .from(calfireIncidents);
    
    // If showAll is false, only show active incidents
    if (!showAll) {
      query = query.where(eq(calfireIncidents.isActive, true));
    }
    
    const incidents = await query
      .orderBy(desc(calfireIncidents.startedAt))
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: incidents,
      count: incidents.length,
      showAll: showAll,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('CalFire API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}