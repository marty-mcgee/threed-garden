// src/lib/services/BayArea511Poller.ts
import { db } from '@/lib/db/client';
import { trafficBayArea511Events } from '@/lib/schema';
import { and, count, desc, eq, isNotNull, notInArray } from 'drizzle-orm';

type BayArea511EventType = typeof trafficBayArea511Events.$inferInsert.eventType;

export class BayArea511Poller {
  private apiKey: string;
  private baseUrl = 'http://api.511.org/traffic/events';
  
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  constructor() {
    this.apiKey = process.env.BAY_AREA_511_API_KEY || '';
    if (!this.apiKey) {
      console.warn('BAY_AREA_511_API_KEY not set in environment variables');
    }
  }

  private extractCoordinates(event: any): { latitude: number | null; longitude: number | null } {
    // From debug output: geography.coordinates = [-122.367064, 37.808409]
    if (event.geography && event.geography.coordinates) {
      const coords = event.geography.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        return { 
          longitude: coords[0],  // First is longitude
          latitude: coords[1]    // Second is latitude
        };
      }
    }
    return { latitude: null, longitude: null };
  }

  private normalizeEventType(value: unknown): BayArea511EventType {
    const eventType = String(value || '').toLowerCase();

    if (eventType.includes('congestion')) return 'congestion';
    if (eventType.includes('construction')) return 'construction';
    if (eventType.includes('special')) return 'special_event';
    if (eventType.includes('weather')) return 'weather';

    return 'accident';
  }

  private normalizeSeverity(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : 1;
  }

  private normalizeTimestamp(value: unknown, fallback = new Date()): string {
    const parsed = value ? new Date(String(value)) : fallback;
    return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
  }

  async fetchEvents(limit: number = 500): Promise<any[]> {
    if (!this.apiKey) {
      console.error('Cannot fetch 511 events: No API key');
      return [];
    }

    try {
      const url = `${this.baseUrl}?api_key=${this.apiKey}`;
      console.log(`[${new Date().toISOString()}] Fetching Bay Area 511 events...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // The API returns an object with events array
      let events = [];
      if (data.events && Array.isArray(data.events)) {
        events = data.events;
      } else if (Array.isArray(data)) {
        events = data;
      }
      
      console.log(`  Total events from API: ${events.length}`);
      
      // Log sample coordinates for debugging
      if (events.length > 0) {
        const sample = events[0];
        const coords = this.extractCoordinates(sample);
        console.log(`  Sample event: ${sample.event_type} at ${sample.roads?.[0]?.name || 'unknown location'}`);
        console.log(`  Coordinates: lat=${coords.latitude}, lng=${coords.longitude}`);
      }
      
      return events.slice(0, limit);
      
    } catch (error) {
      console.error('✗ 511 API failed:', error);
      return [];
    }
  }

  private async upsertEvent(event: any): Promise<'new' | 'updated' | 'skipped'> {
    // Source ID from debug output: id = "511.org/1060526"
    const sourceId = event.id;
    
    if (!sourceId) {
      console.log('  Skipping event with no id');
      return 'skipped';
    }
    
    const coords = this.extractCoordinates(event);
    
    // Extract road info from roads array
    let roadwayName = '';
    let directionOfTravel = '';
    let lanesAffected = '';
    
    if (event.roads && event.roads.length > 0) {
      const road = event.roads[0];
      roadwayName = road.name || '';
      directionOfTravel = road.direction || '';
      if (road['+lane_status']) {
        lanesAffected = road['+lane_status'];
      }
    }
    
    // Extract area name (city/county)
    let areaName = '';
    if (event.areas && event.areas.length > 0) {
      areaName = event.areas[0].name || '';
    }
    
    // Parse schedule intervals
    let startTime: string | null = null;
    let endTime: string | null = null;
    if (event.schedule && event.schedule.intervals && event.schedule.intervals.length > 0) {
      const interval = event.schedule.intervals[0];
      const [start, end] = interval.split('/');
      if (start) startTime = this.normalizeTimestamp(start);
      if (end) endTime = this.normalizeTimestamp(end);
    }

    const isActive = event.status?.toLowerCase() === 'active';
    const eventData: typeof trafficBayArea511Events.$inferInsert = {
      eventId: sourceId,
      sourceId,
      eventType: this.normalizeEventType(event.event_type),
      severity: this.normalizeSeverity(event.severity),
      title: event.headline || '',
      description: event.headline || '',
      location: roadwayName || areaName || null,
      latitude: coords.latitude?.toString() || null,
      longitude: coords.longitude?.toString() || null,
      city: areaName || null,
      reportedAt: startTime || this.normalizeTimestamp(event.created || event.updated),
      clearedAt: isActive ? null : endTime,
      lastUpdated: this.normalizeTimestamp(event.updated || event.created),
      impact: [directionOfTravel, lanesAffected].filter(Boolean).join(' - ') || null,
      rawData: event,
      isActive,
      isPublic: true,
    };
    
    try {
      const existing = await db
        .select()
        .from(trafficBayArea511Events)
        .where(eq(trafficBayArea511Events.sourceId, sourceId))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(trafficBayArea511Events).set(eventData).where(eq(trafficBayArea511Events.sourceId, sourceId));
        return 'updated';
      } else {
        await db.insert(trafficBayArea511Events).values(eventData);
        return 'new';
      }
    } catch (error) {
      console.error(`Error upserting event ${sourceId}:`, error);
      return 'skipped';
    }
  }

  async pollAll(options?: { limit?: number }) {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      const limit = options?.limit || 500;
      
      console.log(`\n🚦 Starting Bay Area 511 poll at ${new Date().toISOString()}`);
      
      const events = await this.fetchEvents(limit);
      
      let newCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let eventsWithCoords = 0;
      
      for (const event of events) {
        const result = await this.upsertEvent(event);
        if (result === 'new') newCount++;
        else if (result === 'updated') updatedCount++;
        else skippedCount++;
        
        const coords = this.extractCoordinates(event);
        if (coords.latitude !== null && coords.longitude !== null) {
          eventsWithCoords++;
        }
      }
      
      // Get active source IDs from current events
      const activeSourceIds = events
        .filter(e => e.status === 'ACTIVE')
        .map(e => e.id)
        .filter(id => id);
      
      let closedCount = 0;
      if (activeSourceIds.length > 0) {
        const now = new Date().toISOString();
        const closedEvents = await db
          .update(trafficBayArea511Events)
          .set({ isActive: false, clearedAt: now, lastUpdated: now })
          .where(
            and(
              eq(trafficBayArea511Events.isActive, true),
              notInArray(trafficBayArea511Events.sourceId, activeSourceIds)
            )
          )
          .returning({ id: trafficBayArea511Events.id });
        closedCount = closedEvents.length;
        console.log(`  Marked ${closedCount} events as closed`);
      }
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        totalFetched: events.length, 
        eventsWithCoords,
        newCount, 
        updatedCount, 
        skippedCount,
        closedCount,
        duration 
      };
      
      console.log(`✅ Bay Area 511 Poll complete:`);
      console.log(`  Active from API: ${events.filter(e => e.status === 'ACTIVE').length} of ${events.length}`);
      console.log(`  New: ${newCount}, Updated: ${updatedCount}, Closed: ${closedCount}`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Bay Area 511 Polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }

  async getEvents(limit: number = 1000) {
    const events = await db
      .select()
      .from(trafficBayArea511Events)
      .where(eq(trafficBayArea511Events.isActive, true))
      .limit(limit);
    
    return events;
  }

  async getStats() {
    const [totalResult] = await db
      .select({ value: count() })
      .from(trafficBayArea511Events);

    const [activeResult] = await db
      .select({ value: count() })
      .from(trafficBayArea511Events)
      .where(eq(trafficBayArea511Events.isActive, true));

    const [withCoordsResult] = await db
      .select({ value: count() })
      .from(trafficBayArea511Events)
      .where(
        and(
          isNotNull(trafficBayArea511Events.latitude),
          isNotNull(trafficBayArea511Events.longitude)
        )
      );

    const byTypeResult = await db
      .select({
        eventType: trafficBayArea511Events.eventType,
        count: count(),
      })
      .from(trafficBayArea511Events)
      .where(eq(trafficBayArea511Events.isActive, true))
      .groupBy(trafficBayArea511Events.eventType)
      .orderBy(desc(count()))
      .limit(10);
    
    return {
      total: totalResult?.value || 0,
      active: activeResult?.value || 0,
      withCoordinates: withCoordsResult?.value || 0,
      byType: byTypeResult,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }

  isPollingActive(): boolean {
    return this.pollingActive;
  }
}
