// src/lib/services/CaltransPoller.ts
import { db } from '@/lib/db/client';
import { laneClosures } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export class CaltransPoller {
  private baseUrl = 'https://cwwp2.dot.ca.gov/data';
  
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  // private readonly ALL_DISTRICTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  private readonly ALL_DISTRICTS = [1];

  private normalizeDirection(direction: string): string {
    if (!direction) return 'Unknown';
    
    const directionMap: Record<string, string> = {
      'North / South': 'N/S',
      'South / North': 'S/N',
      'East / West': 'E/W',
      'West / East': 'W/E',
      'North': 'N',
      'South': 'S',
      'East': 'E',
      'West': 'W',
      'N/A': 'NA',
    };
    
    if (directionMap[direction]) {
      return directionMap[direction];
    }
    
    // Fallback: truncate to 10 characters
    return direction.substring(0, 10);
  }

  private async fetchDistrictClosures(district: number): Promise<any[]> {
    const districtFormatted = district.toString().padStart(2, '0');
    const url = `${this.baseUrl}/d${district}/lcs/lcsStatusD${districtFormatted}.json`;
    
    try {
      console.log(`  Fetching District ${district}: ${url}`);
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MCNews-Caltrans-Poller/1.0' }
      });
      
      if (response.status === 404) {
        console.log(`  District ${district}: No data available (404)`);
        return [];
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      let closures = [];
      if (data.data && Array.isArray(data.data)) {
        closures = data.data.map((item: any) => item.lcs).filter(Boolean);
      } else if (Array.isArray(data)) {
        closures = data;
      }
      
      console.log(`  District ${district}: ${closures.length} closures found`);
      
      if (closures.length > 0) {
        const sample = closures[0];
        console.log(`    Sample: ${sample.index} - ${sample.closure?.typeOfClosure || 'Unknown'}`);
      }
      
      return closures;
    } catch (error) {
      console.error(`  ✗ District ${district} failed:`, error);
      return [];
    }
  }

  private extractRoadwayInfo(closure: any): { route: string; direction: string } {
    let route = '';
    let direction = '';
    
    if (closure.location) {
      if (closure.location.begin?.beginRoute) {
        route = closure.location.begin.beginRoute;
      }
      if (closure.location.travelFlowDirection) {
        direction = this.normalizeDirection(closure.location.travelFlowDirection);
      }
    }
    
    if (!route && closure.closure?.facility) {
      route = closure.closure.facility;
    }
    
    return { route, direction };
  }

  private generateSourceId(district: number, closure: any): string {
    return closure.index || `${district}_${closure.closure?.closureID}_${closure.closure?.closureTimestamp?.closureStartDate}`;
  }

  private async upsertClosure(district: number, closure: any): Promise<'new' | 'updated' | 'skipped'> {
    const sourceId = this.generateSourceId(district, closure);
    const { route, direction } = this.extractRoadwayInfo(closure);
    
    let startTimestamp = null;
    let endTimestamp = null;
    
    if (closure.closure?.closureTimestamp) {
      const ts = closure.closure.closureTimestamp;
      if (ts.closureStartDate) {
        const timeStr = ts.closureStartTime || '00:00:00';
        startTimestamp = new Date(`${ts.closureStartDate}T${timeStr}`);
      }
      if (ts.closureEndDate && ts.closureEndDate !== '') {
        const timeStr = ts.closureEndTime || '23:59:59';
        endTimestamp = new Date(`${ts.closureEndDate}T${timeStr}`);
      }
    }
    
    let locationDesc = '';
    let county = '';
    let city = '';
    let latitude = null;
    let longitude = null;
    
    if (closure.location) {
      if (closure.location.begin?.beginFreeFormDescription) {
        locationDesc = closure.location.begin.beginFreeFormDescription;
      }
      if (closure.location.end?.endLocationName) {
        locationDesc += ` to ${closure.location.end.endLocationName}`;
      }
      if (closure.location.begin?.beginNearbyPlace) {
        city = closure.location.begin.beginNearbyPlace;
      }
      if (closure.location.begin?.beginCounty) {
        county = closure.location.begin.beginCounty;
      }
      if (closure.location.begin?.beginLongitude && closure.location.begin?.beginLatitude) {
        longitude = parseFloat(closure.location.begin.beginLongitude);
        latitude = parseFloat(closure.location.begin.beginLatitude);
      }
    }
    
    // Get lanes affected
    let lanesAffected = null;
    if (closure.closure?.lanesClosed) {
      lanesAffected = closure.closure.lanesClosed;
      if (lanesAffected.length > 100) {
        lanesAffected = lanesAffected.substring(0, 100);
      }
    }
    
    const closureData = {
      sourceId,
      district,
      route: route || 'Unknown',
      direction: direction || 'Unknown',
      closureType: closure.closure?.typeOfClosure || closure.closure?.typeOfWork || 'Unknown',
      lanesAffected: lanesAffected,
      startTimestamp,
      endTimestamp,
      description: `${closure.closure?.typeOfWork || ''} ${locationDesc}`.trim(),
      locationDescription: locationDesc.substring(0, 255),
      latitude,
      longitude,
      county: county || null,
      city: city || null,
      rawData: closure,
      lastSeen: new Date(),
      status: 'active',
      timesSeen: 1,
      firstSeen: new Date(),
    };
    
    try {
      const existing = await db
        .select()
        .from(laneClosures)
        .where(eq(laneClosures.sourceId, sourceId))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(laneClosures).set({
          lastSeen: new Date(),
          timesSeen: (existing[0].timesSeen || 0) + 1,
          rawData: closure,
        }).where(eq(laneClosures.sourceId, sourceId));
        return 'updated';
      } else {
        await db.insert(laneClosures).values(closureData);
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
      let districtsWithData = 0;
      
      for (const district of this.ALL_DISTRICTS) {
        const closures = await this.fetchDistrictClosures(district);
        totalClosures += closures.length;
        
        if (closures.length > 0) {
          districtsWithData++;
          for (const closure of closures) {
            const result = await this.upsertClosure(district, closure);
            if (result === 'new') newCount++;
            else if (result === 'updated') updatedCount++;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
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
        districtsWithData,
        staleCount: staleResult.rowCount || 0,
        duration 
      };
      
      console.log(`✅ Caltrans Poll complete:`);
      console.log(`  ${totalClosures} total closures from ${districtsWithData} districts`);
      console.log(`  ${newCount} new, ${updatedCount} updated, ${this.lastPollStats.staleCount} marked completed`);
      
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