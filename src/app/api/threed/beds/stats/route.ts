// src/app/api/threed/beds/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedBeds } from '@/lib/schema';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total beds
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedBeds);
    
    // Active beds
    const active = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedBeds)
      .where(eq(threedBeds.isActive, true));
    
    // Total square feet
    const totalSqFt = await db
      .select({ sum: sql<number>`SUM(${threedBeds.squareFeet})` })
      .from(threedBeds)
      .where(eq(threedBeds.isActive, true));
    
    // By shape
    const byShape = await db
      .select({
        shape: threedBeds.shape,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedBeds)
      .where(eq(threedBeds.isActive, true))
      .groupBy(threedBeds.shape)
      .orderBy(sql`COUNT(*) DESC`);
    
    return NextResponse.json({
      success: true,
      data: {
        total: Number(total[0]?.count) || 0,
        active: Number(active[0]?.count) || 0,
        totalSqFt: Number(totalSqFt[0]?.sum) || 0,
        byShape: byShape.map((row) => ({
          shape: row.shape,
          count: Number(row.count),
        })),
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}