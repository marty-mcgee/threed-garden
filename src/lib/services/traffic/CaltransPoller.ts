// src/lib/services/CaltransPoller.ts
import { db } from '@/lib/db/client';
import { laneClosures } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export class CaltransPoller {
  private baseUrl = 'https://cwwp2.dot.ca.gov/data';
  
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  // All Caltrans districts (1-12)
  // private readonly ALL_DISTRICTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  private readonly ALL_DISTRICTS = [1];

  private async fetchDistrictClosures(district: number): Promise<any[]> {
    const url = `${this.baseUrl}/d${district}/lcs/lcsStatusD${district.toString().padStart(2, '0')}.json`;
    
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MCNews-Caltrans-Poller/1.0' }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`  District ${district}: No data available`);
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const closures = data?.lcsClosures || [];
      console.log(`  District ${district}: ${closures.length} closures`);
      
      return closures;
    } catch (error) {
      console.error(`  ✗ District ${district} failed:`, error);
      return [];
    }
  }

  private generateSourceId(district: number, closure: any): string {
    return closure.id || `${district}_${closure.route}_${closure.startDate}_${closure.startTime}`;
  }

  private async upsertClosure(district: number, closure: any): Promise<'new' | 'updated' | 'skipped'> {
    const sourceId = this.generateSourceId(district, closure);
    
    const startTimestamp = closure.startDate && closure.startTime
      ? new Date(`${closure.startDate} ${closure.startTime}`)
      : null;
    const endTimestamp = closure.endDate && closure.endTime
      ? new Date(`${closure.endDate} ${closure.endTime}`)
      : null;
    
    const closureData = {
      sourceId,
      district,
      route: closure.route,
      direction: closure.direction,
      closureType: closure.closureType,
      lanesAffected: closure.lanesAffected,
      startTimestamp,
      endTimestamp,
      description: closure.description,
      latitude: closure.latitude ? parseFloat(closure.latitude) : null,
      longitude: closure.longitude ? parseFloat(closure.longitude) : null,
      county: closure.county,
      city: closure.city,
      rawData: closure,
      lastSeen: new Date(),
      status: 'active',
    };
    
    try {
      const existing = await db
        .select()
        .from(laneClosures)
        .where(eq(laneClosures.sourceId, sourceId))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(laneClosures).set({
          ...closureData,
          timesSeen: (existing[0].timesSeen || 0) + 1,
        }).where(eq(laneClosures.sourceId, sourceId));
        return 'updated';
      } else {
        await db.insert(laneClosures).values({
          ...closureData,
          timesSeen: 1,
          firstSeen: new Date(),
        });
        return 'new';
      }
    } catch (error) {
      console.error(`Error upserting closure ${sourceId}:`, error);
      return 'skipped';
    }
  }

  async pollAll() {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🚦 Starting Caltrans poll at ${new Date().toISOString()}`);
      console.log(`  Fetching all ${this.ALL_DISTRICTS.length} districts...`);
      
      let totalClosures = 0;
      let newCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const district of this.ALL_DISTRICTS) {
        const closures = await this.fetchDistrictClosures(district);
        totalClosures += closures.length;
        
        for (const closure of closures) {
          const result = await this.upsertClosure(district, closure);
          if (result === 'new') newCount++;
          else if (result === 'updated') updatedCount++;
          else skippedCount++;
        }
        
        // Small delay between districts to be respectful
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mark stale closures as completed (not seen in last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const staleResult = await db
        .update(laneClosures)
        .set({ status: 'completed' })
        .where(sql`status = 'active' AND last_seen < ${thirtyMinutesAgo}`);
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        totalFetched: totalClosures, 
        newCount, 
        updatedCount, 
        skippedCount,
        staleCount: staleResult.rowCount || 0,
        duration
      };
      
      console.log(`✅ Caltrans Poll complete:`);
      console.log(`  ${totalClosures} total closures, ${newCount} new, ${updatedCount} updated, ${skippedCount} skipped`);
      console.log(`  ${this.lastPollStats.staleCount} closures marked as completed`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Caltrans Polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }

  async getStats() {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(laneClosures);
    
    const active = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(laneClosures)
      .where(eq(laneClosures.status, 'active'));
    
    const byDistrict = await db
      .select({
        district: laneClosures.district,
        count: sql<number>`COUNT(*)`,
      })
      .from(laneClosures)
      .where(eq(laneClosures.status, 'active'))
      .groupBy(laneClosures.district)
      .orderBy(sql`count DESC`);
    
    return {
      total: total[0]?.count || 0,
      active: active[0]?.count || 0,
      byDistrict,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }

  isPollingActive(): boolean {
    return this.pollingActive;
  }
}