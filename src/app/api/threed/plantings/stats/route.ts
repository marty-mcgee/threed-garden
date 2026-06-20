// src/app/api/threed/plantings/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedPlantings } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total plantings
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlantings);
    
    // By status
    const byStatus = await db
      .select({
        status: threedPlantings.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedPlantings)
      .groupBy(threedPlantings.status)
      .orderBy(sql`COUNT(*) DESC`);
    
    // By growth stage
    const byGrowthStage = await db
      .select({
        growthStage: threedPlantings.growthStage,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedPlantings)
      .groupBy(threedPlantings.growthStage)
      .orderBy(sql`COUNT(*) DESC`);
    
    // Planted in last 30 days
    const recent = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlantings)
      .where(sql`${threedPlantings.plantedDate} > NOW() - INTERVAL '30 days'`);
    
    // Total plants in ground
    const totalPlants = await db
      .select({ sum: sql<number>`SUM(${threedPlantings.quantity})` })
      .from(threedPlantings)
      .where(sql`${threedPlantings.status} IN ('planted', 'growing', 'harvesting')`);
    
    return NextResponse.json({
      success: true,
      data: {
        total: Number(total[0]?.count) || 0,
        byStatus: byStatus.map((row) => ({
          status: row.status,
          count: Number(row.count),
        })),
        byGrowthStage: byGrowthStage.map((row) => ({
          stage: row.growthStage,
          count: Number(row.count),
        })),
        plantedLast30Days: Number(recent[0]?.count) || 0,
        totalPlantsPlanted: Number(totalPlants[0]?.sum) || 0,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}