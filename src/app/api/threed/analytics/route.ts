// src/app/api/threed/analytics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedHarvests, threedPlants, threedPlantings } from '@/lib/schema';
import { sql, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get total harvests and weight
    const harvestStats = await db
      .select({
        totalHarvests: sql<number>`COUNT(*)`,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
        totalQuantity: sql<number>`SUM(${threedHarvests.quantity})`,
      })
      .from(threedHarvests);
    
    // Get monthly trends - FIXED: use the SQL expression in ORDER BY
    const monthlyTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${threedHarvests.harvestDate}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
      })
      .from(threedHarvests)
      .where(sql`${threedHarvests.harvestDate} > NOW() - INTERVAL '6 months'`)
      .groupBy(sql`TO_CHAR(${threedHarvests.harvestDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${threedHarvests.harvestDate}, 'YYYY-MM') DESC`);
    
    // Get top producing plants
    const topPlantsRaw = await db
      .select({
        plantId: threedHarvests.plantId,
        plantName: threedPlants.commonName,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
      })
      .from(threedHarvests)
      .leftJoin(threedPlants, eq(threedHarvests.plantId, threedPlants.id))
      .where(sql`${threedHarvests.plantId} IS NOT NULL`)
      .groupBy(threedHarvests.plantId, threedPlants.commonName)
      .orderBy(sql`SUM(${threedHarvests.weightLbs}) DESC`)
      .limit(5);
    
    // Calculate average yield per planting
    const activePlantings = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlantings)
      .where(sql`${threedPlantings.status} = 'growing' OR ${threedPlantings.status} = 'harvesting'`);
    
    const avgYieldPerPlant = activePlantings[0]?.count && harvestStats[0]?.totalWeight
      ? Number(harvestStats[0].totalWeight) / activePlantings[0].count
      : 0;
    
    // Get recent harvests
    const recentHarvests = await db
      .select({
        id: threedHarvests.id,
        quantity: threedHarvests.quantity,
        weightLbs: threedHarvests.weightLbs,
        harvestDate: threedHarvests.harvestDate,
        plantName: threedPlants.commonName,
      })
      .from(threedHarvests)
      .leftJoin(threedPlants, eq(threedHarvests.plantId, threedPlants.id))
      .orderBy(desc(threedHarvests.harvestDate))
      .limit(5);
    
    return NextResponse.json({
      success: true,
      data: {
        totalHarvests: Number(harvestStats[0]?.totalHarvests) || 0,
        totalWeight: Number(harvestStats[0]?.totalWeight) || 0,
        totalQuantity: Number(harvestStats[0]?.totalQuantity) || 0,
        avgYieldPerPlant: Number(avgYieldPerPlant),
        monthlyTrend: monthlyTrend.map((row) => ({
          month: row.month,
          weight: Number(row.totalWeight) || 0,
          count: Number(row.count) || 0,
        })),
        topPlants: topPlantsRaw.map((row) => ({
          name: row.plantName || 'Unknown',
          weight: Number(row.totalWeight) || 0,
        })),
        recentHarvests: recentHarvests.map((row) => ({
          id: row.id,
          quantity: row.quantity,
          weightLbs: row.weightLbs,
          harvestDate: row.harvestDate,
          plantName: row.plantName,
        })),
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}