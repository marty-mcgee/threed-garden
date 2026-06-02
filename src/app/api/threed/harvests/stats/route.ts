// src/app/api/threed/harvests/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedHarvests, threedPlants } from '@/lib/auth/schema';
import { sql, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total harvests count
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedHarvests);
    
    // Total weight
    const totalWeight = await db
      .select({ sum: sql<number>`SUM(${threedHarvests.weightLbs})` })
      .from(threedHarvests);
    
    // Total quantity
    const totalQuantity = await db
      .select({ sum: sql<number>`SUM(${threedHarvests.quantity})` })
      .from(threedHarvests);
    
    // Top plants
    const topPlants = await db
      .select({
        plantId: threedHarvests.plantId,
        plantName: threedPlants.commonName,
        harvestCount: sql<number>`COUNT(*)`,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
      })
      .from(threedHarvests)
      .leftJoin(threedPlants, eq(threedHarvests.plantId, threedPlants.id))
      .where(sql`${threedHarvests.plantId} IS NOT NULL`)
      .groupBy(threedHarvests.plantId, threedPlants.commonName)
      .orderBy(sql`SUM(${threedHarvests.weightLbs}) DESC`)
      .limit(10);
    
    // Monthly trends - FIXED: use the SQL expression in ORDER BY instead of alias
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
    
    // Recent harvests (last 30 days)
    const recentHarvests = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedHarvests)
      .where(sql`${threedHarvests.harvestDate} > NOW() - INTERVAL '30 days'`);
    
    return NextResponse.json({
      success: true,
      data: {
        totalHarvests: Number(total[0]?.count) || 0,
        totalWeightLbs: Number(totalWeight[0]?.sum) || 0,
        totalQuantity: Number(totalQuantity[0]?.sum) || 0,
        harvestsLast30Days: Number(recentHarvests[0]?.count) || 0,
        topPlants: topPlants.map((row) => ({
          plantId: row.plantId,
          plantName: row.plantName || 'Unknown',
          count: Number(row.harvestCount),
          totalWeight: Number(row.totalWeight),
        })),
        byMonth: monthlyTrend.map((row) => ({
          month: row.month,
          count: Number(row.count),
          totalWeight: Number(row.totalWeight),
        })),
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Harvests Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}