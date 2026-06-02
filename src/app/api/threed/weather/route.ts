// src/app/api/threed/weather/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedWeatherLogs } from '@/lib/auth/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/weather - List weather logs with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const hasWarnings = searchParams.get('hasWarnings') === 'true';
  
  try {
    let conditions = [];
    
    if (startDate) {
      conditions.push(sql`${threedWeatherLogs.recordedAt} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${threedWeatherLogs.recordedAt} <= ${endDate}`);
    }
    
    if (hasWarnings) {
      conditions.push(sql`${threedWeatherLogs.frostWarning} = true OR ${threedWeatherLogs.heatWarning} = true OR ${threedWeatherLogs.droughtWarning} = true`);
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const weatherLogs = await db
      .select()
      .from(threedWeatherLogs)
      .where(whereClause)
      .orderBy(desc(threedWeatherLogs.recordedAt))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: weatherLogs,
      count: weatherLogs.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weather GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/weather - Create new weather log
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newWeatherLog = await db.insert(threedWeatherLogs).values({
      ...body,
      recordedAt: body.recordedAt || new Date(),
      createdAt: new Date(),
    }).returning();
    
    return NextResponse.json({
      success: true,
      data: newWeatherLog[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weather POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/weather/:id - Update weather log
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Weather log ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const updated = await db
      .update(threedWeatherLogs)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(threedWeatherLogs.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weather PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/weather/:id - Delete weather log
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Weather log ID required' },
        { status: 400 }
      );
    }
    
    const deleted = await db
      .delete(threedWeatherLogs)
      .where(eq(threedWeatherLogs.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deleted[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weather DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}