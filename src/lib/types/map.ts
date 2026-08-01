// lib/types/map.ts

// ============================================
// Traffic Types
// ============================================

export interface TrafficIncident {
  id: string;
  source: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
  severity?: string;
  status?: string;
  type?: string;
}

// ============================================
// ThreeD Types
// ============================================

export interface ThreeDLayer {
  id: number;
  layerId: string;
  name: string;
  description: string | null;
  config: {
    includeTypes?: string[];
    color?: string;
    opacity?: number;
    visible?: boolean;
  };
  isVisible: boolean;
  isActive: boolean;
  orderIndex?: number;
}

// ✅ Runtime Marker (generated at runtime from sub-module data)
export interface RuntimeMarker {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  color: string;
  icon: string;
  label: string;
  isVisible: boolean;
  isActive: boolean;
  data: any;
  metadata: {
    source: 'sub-module';
    generatedAt: string;
  };
}

// ============================================
// Unified Map Data
// ============================================

export interface UnifiedMapData {
  traffic: {
    // Raw data from traffic sub-modules
    raw: {
      chpCadIncidents: any[];
      chpCases: any[];
      chpCenters: any[];
      caltransLaneClosures: any[];
      caltransCctvCameras: any[];
      caltransDistricts: any[];
      bayArea511Events: any[];
      calfireIncidents: any[];
    } | null;
    total: number;
    chpCadCount: number;
    chpCasesCount: number;
    chpCentersCount: number;
    caltransClosuresCount: number;
    caltransCctvCount: number;
    caltransDistrictsCount: number;
    bayArea511Count: number;
    calfireIncidentsCount: number;
  };
  threed: {
    // Raw data from threed sub-modules
    raw: {
      plants: any[];
      beds: any[];
      characters: any[];
      layers: any[];
      farmbots: any[];
      plantings: any[];
      tasks: any[];
      harvests: any[];
      weatherLogs: any[];
    } | null;
    total: number;
    plantsCount: number;
    bedsCount: number;
    charactersCount: number;
    markersCount: number; // Always 0 - no database markers
    layersCount: number;
    farmbotsCount: number;
    plantingsCount: number;
    tasksCount: number;
    harvestsCount: number;
    weatherLogsCount: number;
    layers: ThreeDLayer[];
  };
}

// ============================================
// Map View Types
// ============================================

export type MapViewMode = '2d' | '3d' | 'combined';

export interface MapLayerConfig {
  traffic: {
    [key: string]: {
      enabled: boolean;
      visible: boolean;
    };
  };
  threed: {
    [key: string]: {
      enabled: boolean;
      visible: boolean;
    };
  };
}