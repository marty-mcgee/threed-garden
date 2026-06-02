// src/app/api/threed/logs/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedSystemLogs } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total logs
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedSystemLogs);
    
    // By level
    const byLevel = await db
      .select({
        level: threedSystemLogs.level,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedSystemLogs)
      .groupBy(threedSystemLogs.level)
      .orderBy(sql`count DESC`);
    
    // By source
    const bySource = await db
      .select({
        source: threedSystemLogs.source,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedSystemLogs)
      .groupBy(threedSystemLogs.source)
      .orderBy(sql`count DESC`)
      .limit(10);
    
    // Last 24 hours
    const last24h = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedSystemLogs)
      .where(sql`${threedSystemLogs.loggedAt} > NOW() - INTERVAL '24 hours'`);
    
    // Errors in last 24 hours
    const errors24h = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedSystemLogs)
      .where(sql`${threedSystemLogs.level} = 'error' AND ${threedSystemLogs.loggedAt} > NOW() - INTERVAL '24 hours'`);
    
    return NextResponse.json({
      success: true,
      data: {
        total: total[0]?.count || 0,
        byLevel,
        bySource,
        last24hCount: last24h[0]?.count || 0,
        errorsLast24h: errors24h[0]?.count || 0,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logs Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}