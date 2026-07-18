// lib/services/traffic/TrafficService.ts
import { db } from '@/lib/db/client';
import { 
  trafficChpCadIncidents,
  trafficCaltransLaneClosures,
  trafficBayArea511Events,
  trafficCalfireIncidents,
  trafficCaltransCctvCameras ,
  trafficChpCases,
} from '@/lib/schema/traffic';
import { eq } from 'drizzle-orm';

// ============================================
// FETCH ALL TRAFFIC DATA FOR A PROJECT
// ============================================

export async function fetchTrafficData(projectId: number) {
  try {
    const [chpCad, caltrans, bayArea, calfire, cctv, chpCollisions] = await Promise.all([
      db.select().from(trafficChpCadIncidents).where(eq(trafficChpCadIncidents.trafficId, projectId)),
      db.select().from(trafficCaltransLaneClosures).where(eq(trafficCaltransLaneClosures.trafficId, projectId)),
      db.select().from(trafficBayArea511Events).where(eq(trafficBayArea511Events.trafficId, projectId)),
      db.select().from(trafficCalfireIncidents).where(eq(trafficCalfireIncidents.trafficId, projectId)),
      db.select().from(trafficCaltransCctvCameras ).where(eq(trafficCaltransCctvCameras .trafficId, projectId)),
      db.select().from(trafficChpCases).where(eq(trafficChpCases.trafficId, projectId)),
    ]);

    return {
      chpCad,
      caltrans,
      bayArea,
      calfire,
      cctv,
      chpCollisions,
      total: chpCad.length + caltrans.length + bayArea.length + calfire.length + cctv.length + chpCollisions.length,
    };
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    throw error;
  }
}

// ============================================
// FETCH SPECIFIC TRAFFIC DATA TYPES
// ============================================

export async function fetchTrafficChpCadIncidents(projectId: number) {
  return db.select().from(trafficChpCadIncidents).where(eq(trafficChpCadIncidents.trafficId, projectId));
}

export async function fetchTrafficCaltransClosures(projectId: number) {
  return db.select().from(trafficCaltransLaneClosures).where(eq(trafficCaltransLaneClosures.trafficId, projectId));
}

export async function fetchTrafficBayArea511Events(projectId: number) {
  return db.select().from(trafficBayArea511Events).where(eq(trafficBayArea511Events.trafficId, projectId));
}

export async function fetchTrafficCalfireIncidents(projectId: number) {
  return db.select().from(trafficCalfireIncidents).where(eq(trafficCalfireIncidents.trafficId, projectId));
}

export async function fetchtrafficCaltransCctvCameras (projectId: number) {
  return db.select().from(trafficCaltransCctvCameras ).where(eq(trafficCaltransCctvCameras .trafficId, projectId));
}

export async function fetchTrafficChpCases(projectId: number) {
  return db.select().from(trafficChpCases).where(eq(trafficChpCases.trafficId, projectId));
}