// src/app/api/threed/farmbots/stats/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedFarmbots } from '@/lib/schema';
import { and, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ownerCondition = eq(threedFarmbots.userId, session.user.id);

    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(ownerCondition);
    
    const online = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(and(ownerCondition, eq(threedFarmbots.status, 'online')));
    
    const offline = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(and(ownerCondition, eq(threedFarmbots.status, 'offline')));
    
    const byStatus = await db
      .select({
        status: threedFarmbots.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedFarmbots)
      .where(ownerCondition)
      .groupBy(threedFarmbots.status)
      .orderBy(sql`count DESC`);
    
    const active = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(and(ownerCondition, eq(threedFarmbots.isActive, true)));
    
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
