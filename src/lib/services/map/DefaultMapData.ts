// lib/services/map/DefaultMapData.ts
import { UnifiedMapData, MapLayerConfig } from '@/lib/types/map';

// ✅ Default GPS center (Fort Bragg)
export const DEFAULT_MAP_CENTER = { lat: 39.514719, lng: -123.760382 };

// ✅ Return empty data - no sample data
export function getDefaultMapData(): UnifiedMapData {
  return {
    traffic: {
      raw: null,
      total: 0,
      chpCadCount: 0,
      chpCasesCount: 0,
      chpCentersCount: 0,
      caltransClosuresCount: 0,
      caltransCctvCount: 0,
      caltransDistrictsCount: 0,
      bayArea511Count: 0,
      calfireIncidentsCount: 0,
    },
    threed: {
      raw: null,
      total: 0,
      plantsCount: 0,
      plantingsCount: 0,
      bedsCount: 0,
      charactersCount: 0,
      markersCount: 0,
      layersCount: 0,
      farmbotsCount: 0,
      tasksCount: 0,
      harvestsCount: 0,
      weatherLogsCount: 0,
      layers: [],
    },
  };
}

// ✅ Default layers configuration
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
      plantings: { enabled: true, visible: true },
      beds: { enabled: true, visible: true },
      characters: { enabled: true, visible: true },
      markers: { enabled: true, visible: true },
      layers: { enabled: true, visible: true },
      farmbots: { enabled: true, visible: true },
    },
  };
}