// src/lib/services/CalFirePoller.ts - Updated to fetch both active and inactive

import { db } from '@/lib/db/client';
import { calfireIncidents } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

// Northern California counties to monitor (including test counties)
const NORTHERN_CA_COUNTIES = [
  'Mendocino', 'Humboldt', 'Lake', 'Sonoma', 'Napa', 'Marin',
  'Solano', 'Contra Costa', 'Alameda', 'Santa Clara', 'San Mateo',
  'San Francisco', 'Sacramento', 'Yolo', 'Placer', 'El Dorado',
  'Butte', 'Tehama', 'Shasta', 'Siskiyou', 'Trinity', 'Del Norte',
  'Modoc', 'Lassen', 'Plumas', 'Sierra', 'Nevada', 'Colusa',
  'Glenn', 'Sutter', 'Yuba', 'Amador', 'Calaveras', 'Tuolumne',
  'Mariposa', 'Merced', 'Stanislaus', 'San Joaquin',
  // Test counties
  'Riverside', 'Santa Barbara', 'Ventura'
];

export class CalFirePoller {
  private baseUrl = 'https://incidents.fire.ca.gov/umbraco/api/IncidentApi/List';
  
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  // src/lib/services/CalFirePoller.ts - Updated fetchIncidents method

  /**
   * Fetch incidents from CalFire API - can fetch both active and inactive
   */
  private async fetchIncidents(includeInactive: boolean = false): Promise<any[]> {
    const url = `${this.baseUrl}?inactive=${includeInactive}`;
    
    try {
      console.log(`[${new Date().toISOString()}] Fetching CalFire incidents...`);
      console.log(`  URL: ${url}`);
      console.log(`  Include inactive: ${includeInactive}`);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MCNews-CalFire-Poller/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const incidents = Array.isArray(data) ? data : [];
      
      console.log(`  Total incidents from API: ${incidents.length}`);
      
      // Log county distribution for debugging
      const countyCounts: Record<string, number> = {};
      for (const incident of incidents) {
        const county = incident.County || 'Unknown';
        countyCounts[county] = (countyCounts[county] || 0) + 1;
      }
      console.log(`  Counties in full response:`, Object.keys(countyCounts).slice(0, 10));
      
      // Filter for Northern California counties
      const northernIncidents = incidents.filter((incident: any) => {
        const county = incident.County;
        return NORTHERN_CA_COUNTIES.includes(county);
      });
      
      console.log(`  Northern California incidents: ${northernIncidents.length}`);
      
      // Log which counties were filtered out
      const filteredOutCounties = Object.keys(countyCounts).filter(
        c => !NORTHERN_CA_COUNTIES.includes(c)
      );
      if (filteredOutCounties.length > 0) {
        console.log(`  Filtered out counties: ${filteredOutCounties.slice(0, 10).join(', ')}${filteredOutCounties.length > 10 ? '...' : ''}`);
      }
      
      return northernIncidents;
      
    } catch (error) {
      console.error('✗ CalFire API failed:', error);
      return [];
    }
  }

  // src/lib/services/CalFirePoller.ts - Add this new method

  /**
   * Fetch ALL incidents from API without county filtering (for backfill)
   */
  private async fetchAllIncidentsUnfiltered(includeInactive: boolean = true): Promise<any[]> {
    const url = `${this.baseUrl}?inactive=${includeInactive}`;
    
    try {
      console.log(`[${new Date().toISOString()}] Fetching ALL CalFire incidents (unfiltered)...`);
      console.log(`  URL: ${url}`);
      console.log(`  Include inactive: ${includeInactive}`);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MCNews-CalFire-Poller/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const incidents = Array.isArray(data) ? data : [];
      
      console.log(`  Total incidents from API (unfiltered): ${incidents.length}`);
      
      // Log county distribution
      const countyCounts: Record<string, number> = {};
      for (const incident of incidents) {
        const county = incident.County || 'Unknown';
        countyCounts[county] = (countyCounts[county] || 0) + 1;
      }
      console.log(`  Counties with incidents:`, Object.keys(countyCounts).sort());
      
      return incidents;
      
    } catch (error) {
      console.error('✗ CalFire API failed:', error);
      return [];
    }
  }

  /**
   * Poll ALL incidents without county filtering (for backfill)
   */
  async pollAllUnfiltered(): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🔥 Starting CalFire UNFILTERED Full Poll at ${new Date().toISOString()}`);
      console.log(`  This will fetch ALL incidents (no county filter)`);
      
      const incidents = await this.fetchAllIncidentsUnfiltered(true);
      
      let newCount = 0;
      let updatedCount = 0;
      let closedCount = 0;
      let skippedCount = 0;
      
      for (let i = 0; i < incidents.length; i++) {
        const incident = incidents[i];
        const result = await this.upsertIncident(incident);
        if (result === 'new') newCount++;
        else if (result === 'updated') updatedCount++;
        else if (result === 'closed') closedCount++;
        else skippedCount++;
        
        if ((i + 1) % 20 === 0) {
          console.log(`    Progress: ${i + 1}/${incidents.length} incidents processed`);
        }
      }
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        totalFetched: incidents.length, 
        newCount, 
        updatedCount,
        closedCount,
        skippedCount,
        duration,
        type: 'unfiltered_full'
      };
      
      console.log(`✅ CalFire Unfiltered Poll complete:`);
      console.log(`  Total incidents: ${incidents.length}`);
      console.log(`  New: ${newCount}, Updated: ${updatedCount}, Closed: ${closedCount}, Skipped: ${skippedCount}`);
      console.log(`  Duration: ${duration}ms`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('CalFire Unfiltered Polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }

  /**
   * Fetch and save ALL incidents (both active and inactive)
   */
  private async fetchAndSaveAll(includeInactive: boolean): Promise<{ total: number; new: number; updated: number; closed: number }> {
    const incidents = await this.fetchIncidents(includeInactive);
    
    let newCount = 0;
    let updatedCount = 0;
    let closedCount = 0;
    
    for (const incident of incidents) {
      const result = await this.upsertIncident(incident);
      if (result === 'new') newCount++;
      else if (result === 'updated') updatedCount++;
      else if (result === 'closed') closedCount++;
    }
    
    return { total: incidents.length, new: newCount, updated: updatedCount, closed: closedCount };
  }

  /**
   * Upsert a single incident
   */
  private async upsertIncident(incident: any): Promise<'new' | 'updated' | 'closed' | 'skipped'> {
    const uniqueId = incident.UniqueId;
    
    if (!uniqueId) {
      return 'skipped';
    }
    
    const existing = await db
      .select()
      .from(calfireIncidents)
      .where(eq(calfireIncidents.uniqueId, uniqueId))
      .limit(1);
    
    const isActive = incident.IsActive === true;
    const percentContained = incident.PercentContained ? parseFloat(incident.PercentContained) : null;
    const isExtinguished = !isActive || percentContained === 100;
    
    const incidentData = {
      uniqueId: uniqueId,
      name: incident.Name || 'Unknown',
      type: incident.Type || 'Wildfire',
      status: isExtinguished ? 'extinguished' : (isActive ? 'active' : 'inactive'),
      county: incident.County,
      location: incident.Location,
      latitude: incident.Latitude ? parseFloat(incident.Latitude) : null,
      longitude: incident.Longitude ? parseFloat(incident.Longitude) : null,
      acresBurned: incident.AcresBurned ? parseFloat(incident.AcresBurned) : null,
      percentContained: percentContained,
      startedAt: incident.Started ? new Date(incident.Started) : null,
      updatedAt: incident.Updated ? new Date(incident.Updated) : null,
      extinguishedAt: incident.ExtinguishedDate ? new Date(incident.ExtinguishedDate) : null,
      adminUnit: incident.AdminUnit,
      url: incident.Url,
      isActive: isActive,
      isCalFireIncident: incident.CalFireIncident === true,
      rawData: incident,
      lastSeen: new Date(),
    };
    
    try {
      if (existing.length > 0) {
        await db.update(calfireIncidents).set({
          ...incidentData,
          lastSeen: new Date(),
        }).where(eq(calfireIncidents.uniqueId, uniqueId));
        
        // Check if status changed from active to inactive
        const wasActive = existing[0].isActive;
        if (wasActive && !isActive) {
          return 'closed';
        }
        return 'updated';
      } else {
        await db.insert(calfireIncidents).values(incidentData);
        return 'new';
      }
    } catch (error) {
      console.error(`Error upserting incident ${uniqueId}:`, error);
      return 'skipped';
    }
  }

  /**
   * Poll ONLY active incidents (for quick updates)
   */
  async pollActive(): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🔥 Starting CalFire Active Incidents poll at ${new Date().toISOString()}`);
      
      const result = await this.fetchAndSaveAll(false);
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        totalFetched: result.total, 
        newCount: result.new, 
        updatedCount: result.updated,
        closedCount: result.closed,
        duration,
        type: 'active'
      };
      
      console.log(`✅ CalFire Active Poll complete:`);
      console.log(`  ${result.total} active incidents, ${result.new} new, ${result.updated} updated, ${result.closed} closed`);
      console.log(`  Duration: ${duration}ms`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('CalFire Polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }

  /**
   * Poll ALL incidents (including inactive) - for backfill or full sync
   */
  async pollAll(): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🔥 Starting CalFire Full Poll (including inactive) at ${new Date().toISOString()}`);
      
      const result = await this.fetchAndSaveAll(true);
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        totalFetched: result.total, 
        newCount: result.new, 
        updatedCount: result.updated,
        closedCount: result.closed,
        duration,
        type: 'full'
      };
      
      console.log(`✅ CalFire Full Poll complete:`);
      console.log(`  ${result.total} total incidents, ${result.new} new, ${result.updated} updated, ${result.closed} closed`);
      console.log(`  Duration: ${duration}ms`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('CalFire Polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }

  async getStats() {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(calfireIncidents);
    
    const active = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(calfireIncidents)
      .where(eq(calfireIncidents.isActive, true));
    
    const inactive = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(calfireIncidents)
      .where(eq(calfireIncidents.isActive, false));
    
    const byCounty = await db
      .select({
        county: calfireIncidents.county,
        count: sql<number>`COUNT(*)`,
      })
      .from(calfireIncidents)
      .where(eq(calfireIncidents.isActive, true))
      .groupBy(calfireIncidents.county)
      .orderBy(sql`count DESC`);
    
    const totalAcres = await db
      .select({ sum: sql<number>`SUM(acres_burned)` })
      .from(calfireIncidents)
      .where(eq(calfireIncidents.isActive, true));
    
    return {
      total: total[0]?.count || 0,
      active: active[0]?.count || 0,
      inactive: inactive[0]?.count || 0,
      byCounty: byCounty,
      totalActiveAcres: totalAcres[0]?.sum || 0,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }

  isPollingActive(): boolean {
    return this.pollingActive;
  }
}