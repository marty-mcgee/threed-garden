// lib/data/threed/seed-layers.ts
import { db } from '@/lib/db/client';
import { layers, markers } from '@/lib/schema/threed/layers';

export async function seedLayersAndMarkers(userId: string) {
  // Create default layers
  const defaultLayers = [
    {
      name: 'Traffic Incidents',
      description: 'Real-time traffic incidents and closures',
      type: 'traffic',
      icon: 'Car',
      color: '#ef4444',
      isEnabled: true,
      userId,
    },
    {
      name: 'Garden Plants',
      description: 'All plants in the garden',
      type: 'garden',
      icon: 'Leaf',
      color: '#22c55e',
      isEnabled: true,
      userId,
    },
    {
      name: 'FarmBots',
      description: 'Active FarmBot devices',
      type: 'farmbots',
      icon: 'Cpu',
      color: '#8b5cf6',
      isEnabled: true,
      userId,
    },
    {
      name: 'Weather Stations',
      description: 'Weather monitoring stations',
      type: 'weather',
      icon: 'Cloud',
      color: '#60a5fa',
      isEnabled: true,
      userId,
    },
  ];

  for (const layerData of defaultLayers) {
    const [layer] = await db
      .insert(layers)
      .values(layerData)
      .returning();

    // Add some sample markers for each layer
    if (layer.type === 'traffic') {
      await db.insert(markers).values([
        {
          name: 'Sample CHP Incident',
          description: 'Sample traffic incident',
          type: 'traffic_incident',
          layerId: layer.id,
          userId,
          positionX: 0,
          positionZ: 0,
          color: '#ef4444',
          icon: 'AlertTriangle',
        },
      ]);
    }
  }
}