// src/app/api/threed/plants/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedPlants } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlants);
    
    const byType = await db
      .select({
        type: threedPlants.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedPlants)
      .groupBy(threedPlants.type)
      .orderBy(sql`count DESC`);
    
    const byStatus = await db
      .select({
        status: threedPlants.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedPlants)
      .groupBy(threedPlants.status);
    
    const recentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlants)
      .where(sql`created_at > NOW() - INTERVAL '30 days'`);
    
    return NextResponse.json({
      success: true,
      data: {
        total: total[0]?.count || 0,
        byType,
        byStatus,
        addedLast30Days: recentCount[0]?.count || 0,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plants Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}