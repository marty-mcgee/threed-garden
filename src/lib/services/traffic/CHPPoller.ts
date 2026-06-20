// src/lib/services/CHPPoller.ts
import { db } from '@/lib/db/client';
import { chpCollisions } from '@/lib/schema';
import { eq, sql, desc } from 'drizzle-orm';

export class CHPPoller {
  private resourceId = 'b8ce0ca4-b4e9-490d-b4d1-1f4ec48cbefb';
  private baseUrl = 'https://data.ca.gov/api/3/action/datastore_search';
  
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  /**
   * Get the latest collision date from the database
   */
  private async getLatestCollisionDate(): Promise<Date | null> {
    const result = await db
      .select({ latestDate: chpCollisions.collisionDate })
      .from(chpCollisions)
      .orderBy(desc(chpCollisions.collisionDate))
      .limit(1);
    
    return result[0]?.latestDate || null;
  }

  /**
   * Fetch only NEW records (since latest date in DB)
   */
  private async fetchNewRecords(sinceDate: Date, limit: number = 500): Promise<any[]> {
    const sinceDateStr = sinceDate.toISOString().split('T')[0];
    
    const url = new URL(this.baseUrl);
    url.searchParams.append('resource_id', this.resourceId);
    url.searchParams.append('limit', String(limit));
    url.searchParams.append('sort', 'Crash Date Time desc');
    
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MCNews-CHP-Poller/1.0' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const records = data.result?.records || [];
    
    return records.filter((record: any) => {
      const crashDate = record['Crash Date Time'];
      if (!crashDate) return false;
      return new Date(crashDate) >= sinceDate;
    });
  }

  private async upsertCollision(record: any): Promise<'new' | 'skipped'> {
    const caseId = record['Report Number'];
    if (!caseId) return 'skipped';
    
    const existing = await db
      .select()
      .from(chpCollisions)
      .where(eq(chpCollisions.caseId, caseId))
      .limit(1);
    
    if (existing.length > 0) return 'skipped';
    
    const collisionDate = record['Crash Date Time'] ? new Date(record['Crash Date Time']) : null;
    
    await db.insert(chpCollisions).values({
      caseId: caseId,
      collisionDate: collisionDate,
      collisionYear: collisionDate?.getFullYear() || null,
      severity: this.mapSeverity(record['Collision Type Description']),
      county: record['County Code'] ? String(record['County Code']) : null,
      city: record['City Name'],
      location: this.buildLocation(record),
      latitude: record['Latitude'] ? parseFloat(record['Latitude']) : null,
      longitude: record['Longitude'] ? parseFloat(record['Longitude']) : null,
      primaryFactor: record['Primary Collision Factor Violation'],
      weather: record['Weather 1'],
      lighting: record['LightingDescription'],
      injuries: record['NumberInjured'] || 0,
      fatalities: record['NumberKilled'] || 0,
      rawData: record,
      lastSeen: new Date(),
    });
    
    return 'new';
  }

  private mapSeverity(collisionType: string): string {
    if (!collisionType) return 'Unknown';
    const type = collisionType.toLowerCase();
    if (type.includes('fatal')) return 'Fatal';
    if (type.includes('injury')) return 'Injury';
    return 'Property Damage';
  }

  private buildLocation(record: any): string {
    const parts = [];
    if (record['Primary Road']) parts.push(record['Primary Road']);
    if (record['Secondary Road'] && record['Secondary Road'] !== 'NULL') parts.push(`& ${record['Secondary Road']}`);
    if (record['City Name']) parts.push(`in ${record['City Name']}`);
    return parts.join(' ') || 'Unknown location';
  }

  /**
   * Simple incremental poller - only fetches new records since last poll
   */
  async pollAll(options?: { limit?: number; startDate?: string; endDate?: string }): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      let startDate: Date;
      
      if (options?.startDate) {
        startDate = new Date(options.startDate);
        console.log(`\n🚦 MANUAL POLL: Fetching records since ${startDate.toISOString().split('T')[0]}`);
      } else {
        const latestInDb = await this.getLatestCollisionDate();
        if (latestInDb) {
          startDate = new Date(latestInDb);
          startDate.setDate(startDate.getDate() + 1);
          console.log(`\n🚦 INCREMENTAL POLL: Fetching records since ${startDate.toISOString().split('T')[0]}`);
        } else {
          console.log(`\n⚠️ No data in database. Please run the backfill script first.`);
          return { success: false, error: 'No data in database. Run backfill script first.' };
        }
      }
      
      const limit = options?.limit || 1000;
      
      console.log(`  Fetching up to ${limit} records...`);
      
      const records = await this.fetchNewRecords(startDate, limit);
      
      const localCounties = ['12', '23'];
      const localRecords = records.filter(record => 
        localCounties.includes(String(record['County Code']))
      );
      
      console.log(`  Found ${records.length} records since ${startDate.toISOString().split('T')[0]}`);
      console.log(`  Local county records: ${localRecords.length}`);
      
      let newCount = 0;
      for (const record of localRecords) {
        const result = await this.upsertCollision(record);
        if (result === 'new') newCount++;
      }
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        totalFetched: records.length,
        localRecords: localRecords.length,
        newCount, 
        duration,
        sinceDate: startDate.toISOString().split('T')[0]
      };
      
      console.log(`✅ CHP Historical Poll complete: ${newCount} new records in ${duration}ms`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('Polling error:', error);
      return { success: false, error: error.message };
    } finally {
      this.pollingActive = false;
    }
  }

  async getStats() {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chpCollisions);
    
    const bySeverity = await db
      .select({
        severity: chpCollisions.severity,
        count: sql<number>`COUNT(*)`,
      })
      .from(chpCollisions)
      .groupBy(chpCollisions.severity);
    
    const byYear = await db
      .select({
        year: chpCollisions.collisionYear,
        count: sql<number>`COUNT(*)`,
      })
      .from(chpCollisions)
      .where(sql`${chpCollisions.collisionYear} IS NOT NULL`)
      .groupBy(chpCollisions.collisionYear)
      .orderBy(sql`year DESC`);
    
    const latest = await db
      .select({ latestDate: chpCollisions.collisionDate })
      .from(chpCollisions)
      .orderBy(desc(chpCollisions.collisionDate))
      .limit(1);
    
    return {
      total: total[0]?.count || 0,
      bySeverity: bySeverity,
      byYear: byYear,
      latestDate: latest[0]?.latestDate,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }

  isPollingActive(): boolean {
    return this.pollingActive;
  }
}