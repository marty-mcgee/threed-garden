// src/lib/services/CHPCADPoller.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '@/lib/db/client';
import { chpCadIncidents, chpCadCenters } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
// import { getCityCoordinates } from '@/lib/utils/cityGeocoder';

const CENTERS_LIST = [
  { code: 'UKCC', name: 'Ukiah', county: 'Mendocino' },
  { code: 'HMCC', name: 'Humboldt', county: 'Humboldt' },
  // { code: 'SACC', name: 'Sacramento', county: 'Sacramento' },
  // { code: 'LACC', name: 'Los Angeles', county: 'Los Angeles' },
  // { code: 'GGCC', name: 'Golden Gate', county: 'San Francisco' },
  // { code: 'SKCCSTCC', name: 'Stockton', county: 'San Joaquin' },
  // { code: 'OCCC', name: 'Orange', county: 'Orange' },
  // { code: 'FRCC', name: 'Fresno', county: 'Fresno' },
  // { code: 'BFCC', name: 'Bakersfield', county: 'Kern' },
];

export class CHPCADPoller {
  private baseUrl = 'https://cad.chp.ca.gov/Traffic.aspx';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  async pollAll() {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🚦 Starting CHP CAD poll at ${new Date().toISOString()}`);
      
      let allIncidents: any[] = [];
      
      for (const center of CENTERS_LIST) {
        const incidents = await this.fetchIncidentsForCenter(center);
        console.log(`  ${center.name}: ${incidents.length} incidents found`);
        allIncidents = [...allIncidents, ...incidents];
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      let newCount = 0;
      for (const incident of allIncidents) {
        const existing = await db
          .select()
          .from(chpCadIncidents)
          .where(eq(chpCadIncidents.sourceId, incident.sourceId))
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(chpCadIncidents).values(incident);
          newCount++;
        }
      }
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { totalFetched: allIncidents.length, newCount, duration };
      
      console.log(`✅ CHP CAD Poll complete: ${allIncidents.length} total, ${newCount} new`);
      
      return { 
        success: true, 
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('CHP CAD Polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }

  private async fetchIncidentsForCenter(center: { code: string; name: string; county: string }) {
    try {
      console.log(`  Fetching ${center.name} (${center.code})...`);
      
      const centerRecord = await db
        .select({ id: chpCadCenters.id })
        .from(chpCadCenters)
        .where(eq(chpCadCenters.centerCode, center.code))
        .limit(1);
      
      const centerId = centerRecord[0]?.id || null;
      
      const initialResponse = await axios.get(this.baseUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 15000
      });
      
      const $init = cheerio.load(initialResponse.data);
      
      const viewState = $init('#__VIEWSTATE').val() || '';
      const viewStateGenerator = $init('#__VIEWSTATEGENERATOR').val() || '';
      const eventValidation = $init('#__EVENTVALIDATION').val() || '';
      
      const formData = new URLSearchParams();
      formData.append('__VIEWSTATE', viewState);
      formData.append('__VIEWSTATEGENERATOR', viewStateGenerator);
      if (eventValidation) formData.append('__EVENTVALIDATION', eventValidation);
      formData.append('ddlComCenter', center.code);
      formData.append('btnCCGo', 'OK');
      
      const response = await axios.post(this.baseUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        timeout: 15000
      });
      
      const incidents = this.parseIncidentsFromHtml(response.data, center, centerId);
      return incidents;
      
    } catch (error) {
      console.error(`  Error fetching ${center.name}:`, error);
      return [];
    }
  }

  private parseIncidentsFromHtml(html: string, center: any, centerId: number | null) {
    const $ = cheerio.load(html);
    const incidents: any[] = [];
    
    const incidentTable = $('#gvIncidents');
    
    if (!incidentTable || incidentTable.length === 0) {
      console.log(`    No incident table found for ${center.name}`);
      return [];
    }
    
    const rows = incidentTable.find('tr.gvRow, tr.gvAltRow');
    const now = new Date();
    
    rows.each((index, row) => {
      const cells = $(row).find('td');
      if (cells.length < 7) return;
      
      const incidentNumber = cells.eq(1).text().trim();
      const incidentTime = cells.eq(2).text().trim();
      const incidentType = cells.eq(3).text().trim();
      const location = cells.eq(4).text().trim();
      const locationDesc = cells.eq(5).text().trim();
      const area = cells.eq(6).text().trim();
      
      if (!incidentType && !location) return;
      
      let fullLocation = location;
      if (locationDesc && locationDesc !== '&nbsp;' && locationDesc !== '') {
        fullLocation += ` (${locationDesc})`;
      }
      if (area && area !== '&nbsp;' && area !== '') {
        fullLocation += ` - ${area}`;
      }
      
      let logTime = new Date(now);
      if (incidentTime) {
        try {
          const [time, modifier] = incidentTime.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours !== 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          logTime.setHours(hours, minutes || 0, 0, 0);
        } catch (e) {}
      }
      
      incidents.push({
        sourceId: `${center.code}_${incidentNumber || now.getTime()}_${index}`,
        centerId: centerId,
        incidentType: incidentType || 'Unknown',
        location: fullLocation || location || 'Unknown',
        city: area || '',
        county: center.county,
        logTime: logTime,
        details: `${incidentType} at ${location}`,
        status: 'active',
        latitude: null,
        longitude: null,
        fetchedAt: now,
      });
    });
    
    console.log(`    Parsed ${incidents.length} incidents for ${center.name}`);
    return incidents;
  }

  async getStats() {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chpCadIncidents);
    
    const byCenter = await db
      .select({
        centerName: chpCadCenters.centerName,
        centerCode: chpCadCenters.centerCode,
        count: sql<number>`COUNT(*)`,
      })
      .from(chpCadIncidents)
      .leftJoin(chpCadCenters, eq(chpCadIncidents.centerId, chpCadCenters.id))
      .groupBy(chpCadCenters.centerName, chpCadCenters.centerCode);
    
    return {
      total: total[0]?.count || 0,
      byCenter: byCenter,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }

  isPollingActive(): boolean {
    return this.pollingActive;
  }
}