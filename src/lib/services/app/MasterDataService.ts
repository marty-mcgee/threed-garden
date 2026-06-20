// src/lib/services/MasterDataService.ts
import { MasterMapEvent } from '@/components/map/masterMap';

export interface MasterData {
  events: MasterMapEvent[];
  lastUpdated: Date;
  summary: {
    total: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
  };
}

class MasterDataService {
  async fetchAllEvents(): Promise<MasterData> {
    const startTime = Date.now();
    
    // Fetch data from all services in parallel
    const [caltransRes, bayAreaRes, chpLiveRes, chpHistoricalRes] = await Promise.all([
      fetch('/api/caltrans/closures/raw').catch(() => ({ json: () => ({ data: [] }) })),
      fetch('/api/bay-area-511?limit=1000').catch(() => ({ json: () => ({ data: [] }) })),
      fetch('/api/chp-cad?limit=1000').catch(() => ({ json: () => ({ data: [] }) })),
      fetch('/api/chp-historical/collisions?limit=1000').catch(() => ({ json: () => ({ data: [] }) })),
    ]);
    
    const caltransData = await caltransRes.json();
    const bayAreaData = await bayAreaRes.json();
    const chpLiveData = await chpLiveRes.json();
    const chpHistoricalData = await chpHistoricalRes.json();
    
    const events: MasterMapEvent[] = [];
    
    // Process Caltrans closures
    (caltransData.data || []).forEach((closure: any) => {
      if (closure.latitude && closure.longitude) {
        events.push({
          id: closure.closure_id,
          source: 'caltrans',
          type: closure.closure_type || 'Lane Closure',
          severity: closure.status === 'active' ? 'Active' : 'Completed',
          location: closure.route || 'Unknown',
          city: closure.city,
          county: closure.county,
          description: closure.description || `${closure.closure_type} on ${closure.route}`,
          latitude: parseFloat(closure.latitude),
          longitude: parseFloat(closure.longitude),
          timestamp: closure.end_date,
        });
      }
    });
    
    // Process Bay Area 511 events
    (bayAreaData.data || []).forEach((event: any) => {
      if (event.latitude && event.longitude) {
        events.push({
          id: event.id,
          source: 'bayarea511',
          type: event.eventType || 'Traffic Event',
          severity: event.severity,
          location: event.roadwayName || 'Unknown',
          city: event.city,
          county: event.county,
          description: event.description || `${event.eventType} on ${event.roadwayName}`,
          latitude: parseFloat(event.latitude),
          longitude: parseFloat(event.longitude),
          timestamp: event.startTime,
        });
      }
    });
    
    // Process CHP Live incidents
    (chpLiveData.data || []).forEach((incident: any) => {
      if (incident.latitude && incident.longitude) {
        events.push({
          id: incident.id,
          source: 'chp-live',
          type: incident.incidentType || 'CHP Incident',
          severity: incident.severity,
          location: incident.location || 'Unknown',
          city: incident.city,
          county: incident.county,
          description: incident.details || `${incident.incidentType} at ${incident.location}`,
          latitude: parseFloat(incident.latitude),
          longitude: parseFloat(incident.longitude),
          timestamp: incident.logTime,
        });
      }
    });
    
    // Process CHP Historical collisions
    (chpHistoricalData.data || []).forEach((collision: any) => {
      if (collision.latitude && collision.longitude) {
        events.push({
          id: collision.id,
          source: 'chp-historical',
          type: 'Collision',
          severity: collision.severity,
          location: collision.location || 'Unknown',
          city: collision.city,
          county: collision.county,
          description: `${collision.severity || 'Collision'} on ${collision.location}`,
          latitude: parseFloat(collision.latitude),
          longitude: parseFloat(collision.longitude),
          timestamp: collision.collisionDate,
        });
      }
    });
    
    // Calculate summary statistics
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    events.forEach(event => {
      bySource[event.source] = (bySource[event.source] || 0) + 1;
      byType[event.type] = (byType[event.type] || 0) + 1;
    });
    
    return {
      events,
      lastUpdated: new Date(),
      summary: {
        total: events.length,
        bySource,
        byType,
      },
    };
  }
}

export const masterDataService = new MasterDataService();