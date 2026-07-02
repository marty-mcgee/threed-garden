// lib/services/threed/markerService.ts
import { db } from '@/lib/db/client';
import { markers } from '@/lib/schema/threed';
import { eq } from 'drizzle-orm';

export async function createTrafficMarker(
  incidentId: string,
  layerId: string,
  userId: string
) {
  // Get the traffic incident data
  const incident = await db
    .select()
    .from(trafficIncidents)
    .where(eq(trafficIncidents.id, incidentId))
    .limit(1);

  if (!incident.length) throw new Error('Incident not found');

  const data = incident[0];

  // Create marker
  const [marker] = await db
    .insert(markers)
    .values({
      name: `${data.type} - ${data.location}`,
      description: data.description,
      type: 'traffic_incident',
      layerId: layerId,
      userId: userId,
      positionX: data.longitude * 100, // Convert to 3D coordinates
      positionZ: data.latitude * 100,
      sourceType: 'traffic_incident',
      sourceId: data.id,
      color: getColorForType(data.type),
      icon: getIconForType(data.type),
      metadata: {
        severity: data.severity,
        timestamp: data.timestamp,
        source: data.source,
      },
    })
    .returning();

  // Update the incident with the marker ID
  await db
    .update(trafficIncidents)
    .set({ markerId: marker.id })
    .where(eq(trafficIncidents.id, data.id));

  return marker;
}