// lib/types/map/index.ts
export interface MapLayerConfig {
  traffic: {
    chpCad: LayerState;
    chpCases: LayerState;
    chpCenters: LayerState;
    caltransClosures: LayerState;
    caltransCctv: LayerState;
    caltransDistricts: LayerState;
    bayArea511: LayerState;
    calfireIncidents: LayerState;
  };
  threed: {
    plants: LayerState;
    beds: LayerState;
    characters: LayerState;
    markers: LayerState;
    layers: LayerState;
    farmbots: LayerState;
  };
}

export interface LayerState {
  enabled: boolean;
  visible: boolean;
}

export type MapViewMode = 'combined' | '2d' | '3d';

export interface UnifiedMapData {
  traffic: {
    total: number;
    chpCadCount: number;
    chpCasesCount: number;
    chpCentersCount: number;
    caltransClosuresCount: number;
    caltransCctvCount: number;
    caltransDistrictsCount: number;
    bayArea511Count: number;
    calfireIncidentsCount: number;
    incidents: TrafficIncident[];
  };
  threed: {
    total: number;
    plantsCount: number;
    plantingsCount: number;
    bedsCount: number;
    charactersCount: number;
    layersCount: number;
    markersCount: number;
    farmbotsCount: number;
    markers: ThreeDMarker[];
  };
}

export interface TrafficIncident {
  id: string;
  source: 'chpCad' | 'chpCases' | 'chpCenters' | 'caltransClosures' | 'caltransCctv' | 'caltransDistricts' | 'bayArea511' | 'calfireIncidents';
  type: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  sourceName: string;
  details?: any;
}

export interface ThreeDMarker {
  id: string;
  name: string;
  type: 'plant' | 'planting' | 'bed' | 'character' | 'marker' | 'layer' | 'farmbot';
  position: { x: number; y: number; z: number };
  color?: string;
  size?: string;
  metadata?: any;
}