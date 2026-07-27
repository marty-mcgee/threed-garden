// lib/services/traffic/TrafficService.ts
import { db } from '@/lib/db/client';
import {
  traffic,
  trafficChpCadIncidents,
  trafficChpCases,
  trafficCaltransLaneClosures,
  trafficBayArea511Events,
  trafficCalfireIncidents,
} from '@/lib/schema/traffic';
import { eq, and, desc, sql } from 'drizzle-orm';

export class TrafficService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getDashboardStats() {
    const [incidentCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(case when status = 'active' then 1 end)`,
      })
      .from(trafficChpCadIncidents)
      .where(eq(trafficChpCadIncidents.userId, this.userId));

    const [closureCount] = await db
      .select({ active: sql<number>`count(*)` })
      .from(trafficCaltransLaneClosures)
      .where(
        sql`${trafficCaltransLaneClosures.userId} = ${this.userId} AND ${trafficCaltransLaneClosures.status} = 'active'`
      );

    const [fireCount] = await db
      .select({ active: sql<number>`count(*)` })
      .from(trafficCalfireIncidents)
      .where(
        sql`${trafficCalfireIncidents.userId} = ${this.userId} AND ${trafficCalfireIncidents.status} = 'active'`
      );

    return {
      activeIncidents: incidentCounts?.active || 0,
      activeClosures: closureCount?.active || 0,
      activeFires: fireCount?.active || 0,
      totalIncidents: incidentCounts?.total || 0,
    };
  }

  async getActiveIncidents(limit = 50) {
    return db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.userId, this.userId),
          eq(trafficChpCadIncidents.status, 'active')
        )
      )
      .orderBy(desc(trafficChpCadIncidents.reportedAt))
      .limit(limit);
  }

  async getActiveClosures(limit = 50) {
    return db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(
        and(
          eq(trafficCaltransLaneClosures.userId, this.userId),
          eq(trafficCaltransLaneClosures.status, 'active')
        )
      )
      .orderBy(desc(trafficCaltransLaneClosures.startDate))
      .limit(limit);
  }

  async getIncidentsByCounty(county: string) {
    return db
      .select()
      .from(trafficChpCadIncidents)
      .where(
        and(
          eq(trafficChpCadIncidents.userId, this.userId),
          eq(trafficChpCadIncidents.county, county)
        )
      )
      .orderBy(desc(trafficChpCadIncidents.reportedAt));
  }

  async getRecentEvents(limit = 100) {
    const incidents = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(eq(trafficChpCadIncidents.userId, this.userId))
      .orderBy(desc(trafficChpCadIncidents.reportedAt))
      .limit(limit);

    const closures = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(eq(trafficCaltransLaneClosures.userId, this.userId))
      .orderBy(desc(trafficCaltransLaneClosures.startDate))
      .limit(limit);

    const fires = await db
      .select()
      .from(trafficCalfireIncidents)
      .where(eq(trafficCalfireIncidents.userId, this.userId))
      .orderBy(desc(trafficCalfireIncidents.startedAt))
      .limit(limit);

    return {
      incidents,
      closures,
      fires,
    };
  }
}