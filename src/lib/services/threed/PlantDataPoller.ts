// src/lib/services/threed/PlantDataPoller.ts
import { db } from '@/lib/db/client';
import { threedPlants } from '@/lib/auth/schema';
import { eq, sql } from 'drizzle-orm';

export class PlantDataPoller {
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  async importFromSeedData(seedData: any[]): Promise<{ newCount: number; updatedCount: number }> {
    console.log(`\n🌱 Importing ${seedData.length} plants from seed data...`);
    
    let newCount = 0;
    let updatedCount = 0;
    
    for (const plant of seedData) {
      const existing = await db
        .select()
        .from(threedPlants)
        .where(eq(threedPlants.plantId, plant.plantId))
        .limit(1);
      
      const plantData = {
        ...plant,
        updatedAt: new Date(),
      };
      
      if (existing.length > 0) {
        await db.update(threedPlants).set(plantData).where(eq(threedPlants.plantId, plant.plantId));
        updatedCount++;
      } else {
        await db.insert(threedPlants).values({
          ...plantData,
          createdAt: new Date(),
        });
        newCount++;
      }
    }
    
    console.log(`  Import complete: ${newCount} new, ${updatedCount} updated`);
    return { newCount, updatedCount };
  }

  async getStats() {
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
    
    return {
      total: total[0]?.count || 0,
      byType: byType,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }

  isPollingActive(): boolean {
    return this.pollingActive;
  }
}