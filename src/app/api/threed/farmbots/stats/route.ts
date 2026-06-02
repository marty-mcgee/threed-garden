// src/app/api/threed/farmbots/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedFarmbots } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots);
    
    const online = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(sql`${threedFarmbots.status} = 'online'`);
    
    const offline = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(sql`${threedFarmbots.status} = 'offline'`);
    
    const byStatus = await db
      .select({
        status: threedFarmbots.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedFarmbots)
      .groupBy(threedFarmbots.status)
      .orderBy(sql`count DESC`);
    
    const active = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(sql`${threedFarmbots.isActive} = true`);
    
    return NextResponse.json({
      success: true,
      data: {
        total: total[0]?.count || 0,
        online: online[0]?.count || 0,
        offline: offline[0]?.count || 0,
        active: active[0]?.count || 0,
        byStatus,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('FarmBots Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}