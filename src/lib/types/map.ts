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
  // Polymorphic union fields - also present on RuntimeMarker
  name?: string;
  position?: { x: number; y: number; z: number };
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  // v0.13.0-beta: runtime-computed convenience fields
  size?: string;
  lat?: number;
  lng?: number;
  title?: string;
}

/** Database row shape returned for an explicitly saved ThreeD Project marker. */
export interface ProjectThreeDMarkerRecord {
  markerType: string;
  sourceAssetId: number;
  markerId: string;
  name: string;
  positionX: string | number;
  positionY: string | number;
  positionZ: string | number;
  positionSource: 'asset' | 'runtime';
  color: string;
  icon: string;
  label: string;
  isVisible: boolean;
  isActive: boolean;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  savedAt?: string | Date;
}

/** Persisted Sub-Module identity for a supported ThreeD Runtime Marker. */
export type ThreeDRuntimeMarkerModuleType =
  | 'plantings'
  | 'beds'
  | 'characters'
  | 'farmbots'
  | 'models';

/** Client-side identity and position for a supported ThreeD world-action target. */
export type ThreeDActionTargetType = ThreeDRuntimeMarkerModuleType;

export interface ThreeDActionTarget {
  /** Runtime marker identity, for example `plantings-12`. */
  markerId: string;
  type: ThreeDActionTargetType;
  /** Source asset identity within the marker's ThreeD Sub-Module. */
  id: number;
  name: string;
  position: { x: number; y: number; z: number };
  /** Per-button-press token carried through animation completion for idempotent persistence. */
  actionRequestId?: string;
}

/** Runtime-only request for positioning a character before a semantic animation. */
export interface ThreeDCharacterOrchestrationRequest {
  version: 1;
  requestId: string;
  characterId: number;
  action: string;
  target: ThreeDActionTarget;
  interactionDistance: number;
}

export type ThreeDCharacterOrchestrationPhase =
  | 'approaching'
  | 'orienting'
  | 'interacting'
  | 'completed'
  | 'cancelled';

// ============================================
// Unified Map Data
// ============================================

export interface UnifiedMapData {
  traffic: {
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
    raw: {
      plants: any[];
      beds: any[];
      characters: any[];
      layers: any[];
      farmbots: any[];
      models: any[];
      plantings: any[];
      tasks: any[];
      harvests: any[];
      weatherLogs: any[];
      projectThreedMarkers?: ProjectThreeDMarkerRecord[];
    } | null;
    total: number;
    plantsCount: number;
    bedsCount: number;
    charactersCount: number;
    markersCount: number;
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
  traffic: Record<string, { enabled: boolean; visible: boolean }>;
  threed: Record<string, { enabled: boolean; visible: boolean }>;
}
