// lib/services/map/DefaultMapData.ts - Fixed with proper GPS coordinates

import { UnifiedMapData, TrafficIncident, ThreeDMarker } from '@/lib/types/map';

// ✅ Default GPS center for ThreeD garden (San Francisco)
export const DEFAULT_3D_GPS_CENTER = { lat: 37.7749, lng: -122.4194 };

// ✅ Scale factor for 3D coordinates to GPS degrees
// 1 unit in 3D space ≈ 0.001 degrees GPS (roughly 100 meters)
const SCALE_FACTOR = 0.001;

// ✅ Convert 3D position to GPS coordinates
function threeDToGPS(
  x: number, 
  z: number, 
  center: { lat: number; lng: number }
): { lat: number; lng: number } {
  return {
    lat: center.lat + (z * SCALE_FACTOR),
    lng: center.lng + (x * SCALE_FACTOR),
  };
}

// ✅ Generate realistic sample traffic incidents for California
export function generateSampleTrafficIncidents(): TrafficIncident[] {
  const now = new Date();
  const incidents: TrafficIncident[] = [];

  // Sample CHP CAD incidents
  const chpIncidents = [
    { 
      title: 'Multi-vehicle collision', 
      location: 'I-80 EB at Truckee',
      lat: 39.3280, lng: -120.1833, 
      severity: 'high' as const,
      description: 'Chain reaction collision involving 4 vehicles. CHP on scene.'
    },
    { 
      title: 'Vehicle fire', 
      location: 'US-101 SB near San Jose',
      lat: 37.3382, lng: -121.8863, 
      severity: 'critical' as const,
      description: 'Semi-truck fully engulfed. All lanes blocked.'
    },
    { 
      title: 'Hit and run', 
      location: 'I-5 NB at Grapevine',
      lat: 34.9375, lng: -118.9300, 
      severity: 'medium' as const,
      description: 'Vehicle fled scene after collision. CHP investigating.'
    },
    {
      title: 'CHP Incident - Bay Bridge',
      location: 'I-80 WB Bay Bridge',
      lat: 37.8170, lng: -122.3500,
      severity: 'high' as const,
      description: 'CHP responding to multi-vehicle incident on Bay Bridge'
    },
  ];

  chpIncidents.forEach((incident, index) => {
    incidents.push({
      id: `sample-chp-${index}`,
      source: 'chpCad',
      sourceName: 'CHP CAD',
      type: 'Traffic Collision',
      title: incident.title,
      description: incident.description,
      location: incident.location,
      lat: incident.lat,
      lng: incident.lng,
      severity: incident.severity,
      timestamp: new Date(now.getTime() - index * 3600000).toISOString(),
      details: { source: 'sample' },
    });
  });

  // Sample Caltrans lane closures
  const caltransClosures = [
    {
      title: 'Lane closure for road work',
      location: 'I-80 WB at Donner Pass',
      lat: 39.3250, lng: -120.3200,
      severity: 'medium' as const,
      description: 'Right lane closed for paving. Expect delays.'
    },
    {
      title: 'Full highway closure',
      location: 'CA-1 at Big Sur',
      lat: 36.2700, lng: -121.8075,
      severity: 'high' as const,
      description: 'Mudslide debris removal. Use alternate route.'
    },
    {
      title: 'Caltrans Closure - Golden Gate Bridge',
      location: 'US-101 Golden Gate Bridge',
      lat: 37.8199, lng: -122.4783,
      severity: 'medium' as const,
      description: 'Lane closure for maintenance on Golden Gate Bridge'
    },
  ];

  caltransClosures.forEach((incident, index) => {
    incidents.push({
      id: `sample-caltrans-${index}`,
      source: 'caltransClosures',
      sourceName: 'Caltrans Closures',
      type: 'Lane Closure',
      title: incident.title,
      description: incident.description,
      location: incident.location,
      lat: incident.lat,
      lng: incident.lng,
      severity: incident.severity,
      timestamp: new Date(now.getTime() - (index + 1) * 7200000).toISOString(),
      details: { source: 'sample' },
    });
  });

  // Sample CalFire incidents
  const calfireIncidents = [
    {
      title: 'Wildfire - Redwood Fire',
      location: 'Mendocino County',
      lat: 39.0000, lng: -123.0000,
      severity: 'critical' as const,
      description: '500 acres, 15% contained. Mandatory evacuations.'
    },
    {
      title: 'Wildfire - Oak Fire',
      location: 'Sonoma County',
      lat: 38.5000, lng: -122.7500,
      severity: 'high' as const,
      description: '50 acres, 60% contained. Crews on scene.'
    },
  ];

  calfireIncidents.forEach((incident, index) => {
    incidents.push({
      id: `sample-calfire-${index}`,
      source: 'calfireIncidents',
      sourceName: 'CalFire',
      type: 'Wildfire',
      title: incident.title,
      description: incident.description,
      location: incident.location,
      lat: incident.lat,
      lng: incident.lng,
      severity: incident.severity,
      timestamp: new Date(now.getTime() - (index + 2) * 3600000).toISOString(),
      details: { source: 'sample' },
    });
  });

  // Sample Bay Area 511 events
  const bayAreaEvents = [
    {
      title: 'Congestion on I-880',
      location: 'I-880 NB near Oakland',
      lat: 37.8044, lng: -122.2711,
      severity: 'medium' as const,
      description: 'Heavy congestion due to accident cleanup'
    },
  ];

  bayAreaEvents.forEach((event, index) => {
    incidents.push({
      id: `sample-bayarea-${index}`,
      source: 'bayArea511',
      sourceName: 'Bay Area 511',
      type: 'Traffic Event',
      title: event.title,
      description: event.description,
      location: event.location,
      lat: event.lat,
      lng: event.lng,
      severity: event.severity,
      timestamp: new Date(now.getTime() - (index + 3) * 3600000).toISOString(),
      details: { source: 'sample' },
    });
  });

  return incidents;
}

// ✅ Generate sample ThreeD markers with proper GPS coordinates
export function generateSampleThreeDMarkers(gpsCenter?: { lat: number; lng: number }): ThreeDMarker[] {
  const center = gpsCenter || DEFAULT_3D_GPS_CENTER;
  const markers: ThreeDMarker[] = [];

  // Sample plants - placed around the garden
  const plantData = [
    { name: 'Rose', x: -2.0, z: -1.5, color: '#22c55e' },
    { name: 'Lavender', x: 0.0, z: -2.0, color: '#16a34a' },
    { name: 'Sunflower', x: 2.0, z: -1.0, color: '#22c55e' },
    { name: 'Tomato', x: -1.5, z: 1.5, color: '#16a34a' },
    { name: 'Basil', x: 1.5, z: 2.0, color: '#22c55e' },
    { name: 'Mint', x: -2.5, z: 0.5, color: '#16a34a' },
    { name: 'Rosemary', x: 2.5, z: 0.0, color: '#22c55e' },
    { name: 'Thyme', x: 0.0, z: 1.0, color: '#16a34a' },
  ];

  plantData.forEach((plant, index) => {
    const gps = threeDToGPS(plant.x, plant.z, center);
    markers.push({
      id: `sample-plant-${index}`,
      name: plant.name,
      type: 'plants',
      position: { x: plant.x, y: 0, z: plant.z },
      color: plant.color,
      size: 'medium',
      metadata: {
        description: `${plant.name} plant in garden bed`,
        stage: ['Seedling', 'Growing', 'Flowering', 'Harvesting'][index % 4],
        gps: gps,
      },
    });
  });

  // Sample beds
  const bedData = [
    { name: 'Raised Bed 1', x: -3.0, z: -3.0, color: '#f59e0b' },
    { name: 'Raised Bed 2', x: 3.0, z: -3.0, color: '#f59e0b' },
    { name: 'In-Ground Bed', x: 0.0, z: -4.0, color: '#f59e0b' },
    { name: 'Container Garden', x: -3.5, z: 2.0, color: '#f59e0b' },
  ];

  bedData.forEach((bed, index) => {
    const gps = threeDToGPS(bed.x, bed.z, center);
    markers.push({
      id: `sample-bed-${index}`,
      name: bed.name,
      type: 'beds',
      position: { x: bed.x, y: 0, z: bed.z },
      color: bed.color,
      size: 'large',
      metadata: {
        description: `${bed.name} for vegetables and herbs`,
        dimensions: `4ft x 8ft`,
        gps: gps,
      },
    });
  });

  // Sample waypoint markers
  const waypointData = [
    { name: 'Entrance', x: -4.0, z: 4.0, color: '#ec4899' },
    { name: 'Water Station', x: 0.0, z: 4.5, color: '#ec4899' },
    { name: 'Compost', x: 4.0, z: 4.0, color: '#ec4899' },
    { name: 'Garden Shed', x: -4.5, z: -4.0, color: '#ec4899' },
    { name: 'Greenhouse', x: 4.5, z: -4.0, color: '#ec4899' },
  ];

  waypointData.forEach((waypoint, index) => {
    const gps = threeDToGPS(waypoint.x, waypoint.z, center);
    markers.push({
      id: `sample-waypoint-${index}`,
      name: waypoint.name,
      type: 'markers',
      position: { x: waypoint.x, y: 0.5, z: waypoint.z },
      color: waypoint.color,
      size: 'small',
      metadata: {
        description: `${waypoint.name} location in garden`,
        icon: '📍',
        gps: gps,
      },
    });
  });

  // Sample characters
  const characterData = [
    { name: 'Gardener', x: -1.0, z: -0.5, color: '#8b5cf6' },
    { name: 'Visitor', x: 1.0, z: 0.5, color: '#8b5cf6' },
    { name: 'Volunteer', x: 0.0, z: -1.0, color: '#8b5cf6' },
  ];

  characterData.forEach((character, index) => {
    const gps = threeDToGPS(character.x, character.z, center);
    markers.push({
      id: `sample-character-${index}`,
      name: character.name,
      type: 'characters',
      position: { x: character.x, y: 0, z: character.z },
      color: character.color,
      size: 'medium',
      metadata: {
        description: `${character.name} character in garden`,
        animation: ['walking', 'standing', 'gardening'][index % 3],
        gps: gps,
      },
    });
  });

  // Sample farmbot
  const farmbotData = [
    { name: 'FarmBot 1', x: -2.0, z: 3.0, color: '#64748b' },
    { name: 'FarmBot 2', x: 2.0, z: 3.0, color: '#64748b' },
  ];

  farmbotData.forEach((farmbot, index) => {
    const gps = threeDToGPS(farmbot.x, farmbot.z, center);
    markers.push({
      id: `sample-farmbot-${index}`,
      name: farmbot.name,
      type: 'farmbots',
      position: { x: farmbot.x, y: 0, z: farmbot.z },
      color: farmbot.color,
      size: 'medium',
      metadata: {
        description: `${farmbot.name} - Automated gardening robot`,
        status: ['Active', 'Charging', 'Maintenance'][index % 3],
        gps: gps,
      },
    });
  });

  // Sample layers
  const layerData = [
    { name: 'Main Garden Layer', x: 0.0, z: 0.0, color: '#06b6d4' },
    { name: 'Herb Garden Layer', x: -1.0, z: 2.0, color: '#06b6d4' },
  ];

  layerData.forEach((layer, index) => {
    const gps = threeDToGPS(layer.x, layer.z, center);
    markers.push({
      id: `sample-layer-${index}`,
      name: layer.name,
      type: 'layers',
      position: { x: layer.x, y: 0.1, z: layer.z },
      color: layer.color,
      size: 'large',
      metadata: {
        description: `${layer.name} - Garden organization layer`,
        gps: gps,
      },
    });
  });

  return markers;
}

// ✅ Generate complete default map data
export function getDefaultMapData(gpsCenter?: { lat: number; lng: number }): UnifiedMapData {
  const center = gpsCenter || DEFAULT_3D_GPS_CENTER;
  const incidents = generateSampleTrafficIncidents();
  const markers = generateSampleThreeDMarkers(center);

  // Count by source
  const counts = {
    chpCad: incidents.filter(i => i.source === 'chpCad').length,
    chpCases: 0,
    chpCenters: 0,
    caltransClosures: incidents.filter(i => i.source === 'caltransClosures').length,
    caltransCctv: 0,
    caltransDistricts: 0,
    bayArea511: incidents.filter(i => i.source === 'bayArea511').length,
    calfireIncidents: incidents.filter(i => i.source === 'calfireIncidents').length,
  };

  const threedCounts = {
    plants: markers.filter(m => m.type === 'plants').length,
    beds: markers.filter(m => m.type === 'beds').length,
    characters: markers.filter(m => m.type === 'characters').length,
    markers: markers.filter(m => m.type === 'markers').length,
    layers: markers.filter(m => m.type === 'layers').length,
    farmbots: markers.filter(m => m.type === 'farmbots').length,
  };

  return {
    traffic: {
      total: incidents.length,
      ...counts,
      incidents,
    },
    threed: {
      total: markers.length,
      plantsCount: threedCounts.plants,
      bedsCount: threedCounts.beds,
      charactersCount: threedCounts.characters,
      markersCount: threedCounts.markers,
      layersCount: threedCounts.layers,
      farmbotsCount: threedCounts.farmbots,
      markers,
    },
  };
}

// ✅ Get default map layers configuration
export function getDefaultLayers(): MapLayerConfig {
  return {
    traffic: {
      chpCad: { enabled: true, visible: true },
      chpCases: { enabled: false, visible: true },
      chpCenters: { enabled: false, visible: true },
      caltransClosures: { enabled: true, visible: true },
      caltransCctv: { enabled: false, visible: true },
      caltransDistricts: { enabled: false, visible: true },
      bayArea511: { enabled: true, visible: true },
      calfireIncidents: { enabled: true, visible: true },
    },
    threed: {
      plants: { enabled: true, visible: true },
      beds: { enabled: true, visible: true },
      characters: { enabled: true, visible: true },
      markers: { enabled: true, visible: true },
      layers: { enabled: true, visible: true },
      farmbots: { enabled: true, visible: true },
    },
  };
}