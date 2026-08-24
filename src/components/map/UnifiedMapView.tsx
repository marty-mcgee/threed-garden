// components/map/UnifiedMapView.tsx
'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { UnifiedMapData, MapViewMode, MapLayerConfig, TrafficIncident, RuntimeMarker, ThreeDActionTarget } from '@/lib/types/map';
import { LeafletMap } from '@/components/map/LeafletMap';
import {
  buildThreeDRuntimeMarkers,
  createThreeDRuntimeMarkerRegistrations,
} from '@/lib/services/threed/markers/runtime-marker-builder';
import { ThreeDRuntimeMarkerRegistry } from '@/lib/services/threed/markers/runtime-marker-core';
import type { ProjectThreeDMarkerSnapshotInput } from '@/lib/services/threed/markers/project-marker-snapshot-core';
import type { ThreeDModelLibraryItem } from '@/lib/types/threed';

export type ProjectThreeDMarkerSnapshotProvider = () => ProjectThreeDMarkerSnapshotInput[];
export type ThreeDRuntimeMarkerPositionResolver = (
  moduleType: string,
  assetId: number,
) => { x: number; y: number; z: number } | null;

// ✅ Dynamically import ThreeD Scene (3D) to avoid SSR issues
const ThreeDScene = dynamic(
  () => import('@/components/map/ThreeDScene').then((mod) => mod.ThreeDScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface UnifiedMapViewProps {
  /** Active Project identity; changing it starts a separate marker collection. */
  projectId?: number | null;
  data: UnifiedMapData;
  layers: MapLayerConfig;
  viewMode: MapViewMode;
  onIncidentSelect?: (incident: TrafficIncident | null) => void;
  onMarkerSelect?: (marker: RuntimeMarker | null) => void;
  onFocusMarker?: (marker: RuntimeMarker) => void;
  selectedIncident?: TrafficIncident | null;
  selectedMarker?: RuntimeMarker | null;
  height?: string;
  gpsCenter?: { lat: number; lng: number };
  visibleAssetTypes?: Set<string>;
  filterText?: string;
  filterActiveOnly?: boolean;
  filterAssetType?: string | null;
  /** ID of the ecctrl character currently being controlled */
  controlledCharacterId?: number | null;
  /** Called when an ecctrl character's control state changes */
  onControlChange?: (markerId: string, pos: { x: number; y: number; z: number }) => void;
  /** Camera mode override (selected by user in DetailsCard) */
  cameraMode?: string;
  /** v0.16.2-beta: increments to request a manual "zoom + center" on the selected marker */
  focusRequest?: number;
  /** Persistent client-side target for ThreeD character actions. */
  actionTarget?: ThreeDActionTarget | null;
  /** Increments to request camera focus on the current action target. */
  actionTargetFocusRequest?: number;
  /** Registers an on-demand provider for an explicit ThreeD Project save. */
  onProjectMarkerSnapshotProviderChange?: (
    provider: ProjectThreeDMarkerSnapshotProvider | null,
  ) => void;
  /** Registers an on-demand reader for a marker's current registry position. */
  onRuntimeMarkerPositionResolverChange?: (
    resolver: ThreeDRuntimeMarkerPositionResolver | null,
  ) => void;
  /** Library model currently awaiting a ground placement click. */
  placementModel?: ThreeDModelLibraryItem | null;
  /** Receives the selected ThreeD ground coordinate. */
  onModelPlacement?: (position: { x: number; y: number; z: number }) => void;
}

function isTrafficIncident(m: RuntimeMarker | TrafficIncident): m is TrafficIncident {
  return 'source' in m;
}

function shallowEqualRecord(
  left: Record<string, unknown> | null | undefined,
  right: Record<string, unknown> | null | undefined,
  ignoredKeys: ReadonlySet<string> = new Set(),
): boolean {
  const leftRecord = left ?? {};
  const rightRecord = right ?? {};
  const leftKeys = Object.keys(leftRecord).filter((key) => !ignoredKeys.has(key));
  const rightKeys = Object.keys(rightRecord).filter((key) => !ignoredKeys.has(key));
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key)
      && Object.is(leftRecord[key], rightRecord[key]));
}

const GENERATED_METADATA_KEYS = new Set(['generatedAt']);

function isSameRuntimeMarker(left: RuntimeMarker, right: RuntimeMarker): boolean {
  return left.id === right.id
    && left.name === right.name
    && left.type === right.type
    && left.position.x === right.position.x
    && left.position.y === right.position.y
    && left.position.z === right.position.z
    && left.color === right.color
    && left.icon === right.icon
    && left.label === right.label
    && left.isVisible === right.isVisible
    && left.isActive === right.isActive
    && shallowEqualRecord(left.data, right.data)
    && shallowEqualRecord(left.metadata, right.metadata, GENERATED_METADATA_KEYS);
}

export function UnifiedMapView({
  projectId,
  data,
  layers,
  viewMode,
  onIncidentSelect,
  onMarkerSelect,
  onFocusMarker,
  selectedIncident,
  selectedMarker,
  height = '100%',
  gpsCenter = { lat: 39.514719, lng: -123.760382 },
  visibleAssetTypes,
  filterText = '',
  filterActiveOnly = false,
  filterAssetType = null,
  controlledCharacterId,
  onControlChange,
  cameraMode,
  focusRequest = 0,
  actionTarget,
  actionTargetFocusRequest = 0,
  onProjectMarkerSnapshotProviderChange,
  onRuntimeMarkerPositionResolverChange,
  placementModel,
  onModelPlacement,
}: UnifiedMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stableMarkersRef = useRef<Map<string, RuntimeMarker>>(new Map());
  const markerProjectIdRef = useRef<number | null | undefined>(projectId);
  const runtimeMarkerRegistryRef = useRef<ThreeDRuntimeMarkerRegistry | null>(null);
  if (!runtimeMarkerRegistryRef.current) {
    runtimeMarkerRegistryRef.current = new ThreeDRuntimeMarkerRegistry();
  }
  const [autoRotate, setAutoRotate] = useState(false);

  const runtimeMarkers = useMemo(() => {
    if (markerProjectIdRef.current !== projectId) {
      stableMarkersRef.current.clear();
      runtimeMarkerRegistryRef.current?.clear();
      markerProjectIdRef.current = projectId;
    }

    const previous = stableMarkersRef.current;
    const next = new Map<string, RuntimeMarker>();
    const markers = buildThreeDRuntimeMarkers(data.threed.raw).map((marker) => {
      const existing = previous.get(marker.id);
      const stableMarker = existing && isSameRuntimeMarker(existing, marker)
        ? existing
        : marker;
      next.set(marker.id, stableMarker);
      return stableMarker;
    });
    stableMarkersRef.current = next;
    return markers;
  }, [data.threed.raw, projectId]);

  // Keep the complete Project-scoped marker set in the registry. Layer and UI
  // filters below remain presentation-only and do not remove marker identity.
  useEffect(() => {
    const registry = runtimeMarkerRegistryRef.current;
    if (!registry) return;
    try {
      registry.replaceAssetMarkers(
        createThreeDRuntimeMarkerRegistrations(runtimeMarkers),
      );
    } catch (error) {
      registry.clear();
      console.error('Failed to synchronize ThreeD Runtime Marker registry', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }, [runtimeMarkers]);

  useEffect(() => () => {
    runtimeMarkerRegistryRef.current?.clear();
  }, []);

  const handleRuntimeMarkerPositionChange = useCallback((
    moduleType: string,
    assetId: number,
    position: { x: number; y: number; z: number },
  ) => {
    runtimeMarkerRegistryRef.current?.updateLivePosition(
      moduleType,
      assetId,
      position,
    );
  }, []);

  const getProjectMarkerSnapshot = useCallback((): ProjectThreeDMarkerSnapshotInput[] => {
    const registry = runtimeMarkerRegistryRef.current;
    if (!registry) return [];

    return runtimeMarkers.map((marker) => {
      const assetId = Number(marker.data?.id);
      const registered = registry.resolve(marker.type, assetId);
      if (!registered) {
        throw new Error('Runtime Marker registry is not synchronized');
      }
      return {
        markerId: marker.id,
        moduleType: registered.identity.moduleType,
        assetId: marker.type === 'models'
          ? Number(marker.data?.modelId)
          : registered.identity.assetId,
        name: marker.name,
        position: registered.currentPosition,
        positionSource: registered.positionSource === 'runtime'
          || marker.metadata?.positionSource === 'runtime'
          ? 'runtime'
          : 'asset',
        color: marker.color,
        icon: marker.icon,
        label: marker.label,
        isVisible: marker.isVisible,
        isActive: marker.isActive,
        data: marker.data,
        metadata: marker.metadata,
      };
    });
  }, [runtimeMarkers]);

  const resolveRuntimeMarkerPosition = useCallback<ThreeDRuntimeMarkerPositionResolver>((
    moduleType,
    assetId,
  ) => {
    const position = runtimeMarkerRegistryRef.current
      ?.resolve(moduleType, assetId)
      ?.currentPosition;
    return position ? { ...position } : null;
  }, []);

  useEffect(() => {
    if (!onProjectMarkerSnapshotProviderChange) return;
    onProjectMarkerSnapshotProviderChange(getProjectMarkerSnapshot);
    return () => onProjectMarkerSnapshotProviderChange(null);
  }, [getProjectMarkerSnapshot, onProjectMarkerSnapshotProviderChange]);

  useEffect(() => {
    if (!onRuntimeMarkerPositionResolverChange) return;
    onRuntimeMarkerPositionResolverChange(resolveRuntimeMarkerPosition);
    return () => onRuntimeMarkerPositionResolverChange(null);
  }, [onRuntimeMarkerPositionResolverChange, resolveRuntimeMarkerPosition]);

  const spreadOverlappingMarkers = (markers: RuntimeMarker[], spreadDistance: number = 1.5): RuntimeMarker[] => {
    if (markers.length === 0) return markers;
    const positionGroups: Record<string, RuntimeMarker[]> = {};
    markers.forEach(marker => {
      const key = `${Math.round(marker.position.x * 10) / 10},${Math.round(marker.position.y * 10) / 10},${Math.round(marker.position.z * 10) / 10}`;
      if (!positionGroups[key]) positionGroups[key] = [];
      positionGroups[key].push(marker);
    });
    const spreadMarkers: RuntimeMarker[] = [];
    Object.values(positionGroups).forEach(group => {
      if (group.length === 1) {
        spreadMarkers.push(group[0]);
      } else {
        const basePos = group[0].position;
        group.forEach((marker, index) => {
          const angle = (index / group.length) * 2 * Math.PI;
          const radius = spreadDistance * (0.5 + index * 0.3);
          spreadMarkers.push({
            ...marker,
            position: {
              x: basePos.x + Math.cos(angle) * radius,
              y: basePos.y + 0.5 + index * 0.3,
              z: basePos.z + Math.sin(angle) * radius,
            }
          });
        });
      }
    });
    return spreadMarkers;
  };

  // ✅ v0.13.0-beta: Apply text, active-only, and asset-type filters
  const filteredMarkers = useMemo(() => {
    return runtimeMarkers.filter((marker) => {
      const layerConfig = layers.threed[marker.type as keyof typeof layers.threed];
      if (!layerConfig?.enabled || !layerConfig?.visible) return false;
      if (visibleAssetTypes && visibleAssetTypes.size > 0 && !visibleAssetTypes.has(marker.type)) return false;

      // Text filter: match marker name or type
      if (filterText) {
        const query = filterText.toLowerCase();
        if (!marker.name.toLowerCase().includes(query) && !marker.type.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Active-only filter
      if (filterActiveOnly && !marker.isActive) return false;

      // Asset type quick filter (from stat cards)
      if (filterAssetType) {
        const typeLower = filterAssetType.toLowerCase();
        // Map display labels back to marker types
        const typeMap: Record<string, string> = {
          'plantings': 'planting',
          'beds': 'bed',
          'characters': 'character',
          'farmbots': 'farmbot',
        };
        const targetType = typeMap[typeLower] || typeLower;
        if (marker.type !== targetType) return false;
      }

      return true;
    });
  }, [runtimeMarkers, layers, visibleAssetTypes, filterText, filterActiveOnly, filterAssetType]);

  // ✅ v0.13.0-beta: Apply text filter to incidents too
  // ✅ v0.15.2: Normalize GPS column names and assign unique composite keys
  // Traffic tables use serial IDs that collide across collections (CHP CAD id=3 ≠ Caltrans id=3)
  const filteredIncidents = useMemo(() => {
    if (!data.traffic.raw) return [];
    const allIncidents = Object.entries(data.traffic.raw).flatMap(([collection, items]) =>
      (items || []).map((item: any) => ({
        ...item,
        lat: item.lat ?? item.latitude ?? null,
        lng: item.lng ?? item.longitude ?? null,
        key: `${collection}_${item.id}`,
      }))
    );

    if (!filterText && !filterAssetType) return allIncidents;

    return allIncidents.filter((incident: any) => {
      // Text filter
      if (filterText) {
        const query = filterText.toLowerCase();
        const title = (incident.title || '').toLowerCase();
        const location = (incident.location || '').toLowerCase();
        if (!title.includes(query) && !location.includes(query)) return false;
      }

      // Asset type filter for traffic
      if (filterAssetType) {
        const typeLower = filterAssetType.toLowerCase();
        const sourceMap: Record<string, string> = {
          'chp cad': 'chpCadIncidents',
          'chp cases': 'chpCases',
          'chp centers': 'chpCenters',
          'caltrans closures': 'caltransLaneClosures',
          'cctv': 'caltransCctvCameras',
          'districts': 'caltransDistricts',
          '511 events': 'bayArea511Events',
          'calfire': 'calfireIncidents',
        };
        // This is approximate since incidents don't carry their source collection name clearly
        // We'll match against the incident source field
        const sourceLower = (incident.source || '').toLowerCase();
        const matchedSource = sourceMap[typeLower];
        if (!matchedSource || !sourceLower.includes(typeLower.split(' ')[0])) return false;
      }

      return true;
    });
  }, [data.traffic.raw, filterText, filterAssetType]);

  // ✅ Spread markers for 3D scene (prevents visual overlap of markers at same position)
  const spreadMarkers = useMemo(() => spreadOverlappingMarkers(filteredMarkers, 1.0), [filteredMarkers]);

  const handleIncidentClick = useCallback((incident: TrafficIncident) => {
    // Use composite key for uniqueness across traffic collections
    if (onIncidentSelect) onIncidentSelect((selectedIncident as any)?.key === (incident as any).key ? null : incident);
  }, [onIncidentSelect, selectedIncident]);

  const handleMarkerClick = useCallback((marker: RuntimeMarker) => {
    if (onMarkerSelect) onMarkerSelect(selectedMarker?.id === marker.id ? null : marker);
  }, [onMarkerSelect, selectedMarker]);

  // ✅ Type-safe focus marker handler
  const handleFocusMarker = useCallback((marker: RuntimeMarker | TrafficIncident) => {
    if (!onFocusMarker) return;
    let result: RuntimeMarker;
    if (isTrafficIncident(marker)) {
      result = {
        id: marker.id,
        name: marker.title,
        type: marker.source || 'incident',
        position: { x: marker.lat, y: 0, z: marker.lng },
        color: '#3b82f6',
        icon: '📍',
        label: marker.title,
        isVisible: true,
        isActive: true,
        data: marker,
        metadata: { source: 'sub-module' as const, generatedAt: new Date().toISOString() },
      };
    } else {
      result = marker;
    }
    onFocusMarker(result);
  }, [onFocusMarker]);

  const leafletIncidents = filteredIncidents
    .filter((incident: any) => incident.lat && incident.lng && incident.lat !== 0 && incident.lng !== 0)
    .map((incident: any) => ({ ...incident, lat: incident.lat, lng: incident.lng }));

  // ✅ ThreeD markers on 2D map: scale raw 3D coords into a small "garden plot" around gpsCenter
  //    Treat 1 unit in 3D space ≈ 0.0001° (~11m) so a 100-unit garden spans ~1.1km (½-mile plot)
  const GPS_SCALE = 0.0001;
  const leafletMarkers = useMemo(() => {
    const markers = spreadMarkers
      .filter((m) => m.position && m.position.x !== undefined && m.position.z !== undefined)
      .map((m) => {
        const lat = gpsCenter.lat + (m.position.z * GPS_SCALE);
        const lng = gpsCenter.lng + (m.position.x * GPS_SCALE);
        return {
          id: m.id, name: m.name, type: m.type,
          lat, lng,
          color: m.color, size: 'medium',
          metadata: { ...m.metadata, position: m.position, data: m.data },
        };
      });

    // De-duplicate exact-GPS overlaps with a tiny spread
    const groups: Record<string, typeof markers> = {};
    markers.forEach((m) => {
      const key = `${m.lat.toFixed(5)},${m.lng.toFixed(5)}`;
      (groups[key] ??= []).push(m);
    });
    const result: typeof markers = [];
    Object.values(groups).forEach((grp) => {
      if (grp.length === 1) { result.push(grp[0]); return; }
      grp.forEach((m, i) => {
        const a = (i / grp.length) * 2 * Math.PI;
        result.push({
          ...m,
          lat: m.lat + Math.sin(a) * 0.00001 * (i + 1),
          lng: m.lng + Math.cos(a) * 0.00001 * (i + 1),
        });
      });
    });
    return result;
  }, [spreadMarkers, gpsCenter]);

  // ✅ 3D scene: use raw filteredMarkers for accurate 3D positions (spreadMarkers is for 2D leaflet overlap prevention)
  const threeDMarkers = useMemo(() => filteredMarkers
    .filter((m) => m.position && m.position.x !== undefined), [filteredMarkers]);

  const render2DView = () => (
    <LeafletMap
      incidents={leafletIncidents}
      markers={leafletMarkers}
      onIncidentClick={handleIncidentClick}
      onMarkerClick={handleMarkerClick}
      onFocusMarker={handleFocusMarker}
      selectedIncident={selectedIncident}
      selectedMarker={selectedMarker}
      height="100%"
      gpsCenter={gpsCenter}
      center={[gpsCenter.lat, gpsCenter.lng]}
      zoom={12}
    />
  );

  const render3DView = () => {
    const sceneIncidents = filteredIncidents
      .filter((incident: any) => incident.lat && incident.lng)
      .map((incident: any) => ({
        ...incident,
        position: { x: (incident.lng - (-119.5)) * 2.0, y: 0, z: (incident.lat - 37.5) * 2.0 },
      }));
    return (
      <ThreeDScene
        projectId={projectId ?? undefined}
        incidents={sceneIncidents}
        markers={threeDMarkers}
        onIncidentClick={handleIncidentClick}
        onMarkerClick={handleMarkerClick}
        onClearSelection={() => {
          onIncidentSelect?.(null);
          onMarkerSelect?.(null);
        }}
        selectedIncident={selectedIncident}
        selectedMarker={selectedMarker}
        height="100%"
        autoRotate={autoRotate}
        onAutoRotateToggle={() => setAutoRotate(!autoRotate)}
        controlledCharacterId={controlledCharacterId}
        onControlChange={onControlChange}
        onRuntimeMarkerPositionChange={handleRuntimeMarkerPositionChange}
        cameraMode={cameraMode as any}
        focusRequest={focusRequest}
        actionTarget={actionTarget}
        actionTargetFocusRequest={actionTargetFocusRequest}
        placementModel={placementModel}
        onModelPlacement={onModelPlacement}
      />
    );
  };

  const renderMap = () => {
    switch (viewMode) {
      case '2d': return render2DView();
      case '3d': return render3DView();
      default: return null;
    }
  };

  return <div ref={containerRef} className="w-full h-full">{renderMap()}</div>;
}
