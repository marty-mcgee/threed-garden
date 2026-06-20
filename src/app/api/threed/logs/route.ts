// src/app/api/threed/logs/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedSystemLogs } from '@/lib/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/logs - List system logs with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const level = searchParams.get('level');
  const source = searchParams.get('source');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  try {
    let conditions = [];
    
    if (level && level !== 'all') {
      conditions.push(eq(threedSystemLogs.level, level));
    }
    
    if (source) {
      conditions.push(eq(threedSystemLogs.source, source));
    }
    
    if (startDate) {
      conditions.push(sql`${threedSystemLogs.loggedAt} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${threedSystemLogs.loggedAt} <= ${endDate}`);
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const logs = await db
      .select()
      .from(threedSystemLogs)
      .where(whereClause)
      .orderBy(desc(threedSystemLogs.loggedAt))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedSystemLogs)
      .where(whereClause);
    
    // Get unique sources for filter dropdown
    const sources = await db
      .selectDistinct({ source: threedSystemLogs.source })
      .from(threedSystemLogs)
      .where(sql`${threedSystemLogs.source} IS NOT NULL`);
    
    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
      total: total[0]?.count || 0,
      sources: sources.map(s => s.source).filter(Boolean),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logs GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/logs/:id - Delete a log entry (admin only)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Log ID required' },
        { status: 400 }
      );
    }
    
    const deleted = await db
      .delete(threedSystemLogs)
      .where(eq(threedSystemLogs.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deleted[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logs DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/logs - Clear all logs (admin only)
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'clear') {
      await db.delete(threedSystemLogs);
      return NextResponse.json({
        success: true,
        message: 'All logs cleared',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Logs Clear Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}