// components/map/UnifiedMapView.tsx
'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { UnifiedMapData, MapViewMode, MapLayerConfig, TrafficIncident, RuntimeMarker, ThreeDActionTarget } from '@/lib/types/map';
import { LeafletMap } from '@/components/map/LeafletMap';
import {
  geographicPositionToProjectLocalPosition,
  mapPositionToProjectPlanPosition,
  projectLocalPositionToGeographicPosition,
  projectPlanPositionToMapPosition,
  type ThreeDGeographicOrigin,
} from '@/lib/services/threed/markers/map-coordinate-core';
import {
  buildThreeDRuntimeMarkerResult,
  createThreeDRuntimeMarkerRegistrations,
} from '@/lib/services/threed/markers/runtime-marker-builder';
import { ThreeDRuntimeMarkerRegistry } from '@/lib/services/threed/markers/runtime-marker-core';
import type { ProjectThreeDMarkerSnapshotInput } from '@/lib/services/threed/markers/project-marker-snapshot-core';
import type { ThreeDModelLibraryItem } from '@/lib/types/threed';
import type {
  ProjectMapViewState,
  ProjectThreeDViewState,
  ThreeDProjectViewState,
} from '@/lib/services/threed/markers/project-view-state-core';

export type ProjectThreeDMarkerSnapshotProvider = () => ProjectThreeDMarkerSnapshotInput[];
export type ProjectThreeDViewStateProvider = () => ProjectThreeDViewState;
export type ProjectMapViewStateProvider = () => ProjectMapViewState;
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
  /** Shared Project-session registry; required when 2D and 3D mount separately. */
  runtimeMarkerRegistry?: ThreeDRuntimeMarkerRegistry;
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
  /** Project-owned WGS84 anchor used by both the ThreeD Scene and Leaflet. */
  geographicOrigin?: ThreeDGeographicOrigin | null;
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
  /** Reports a user-driven ThreeD camera mode change. */
  onCameraModeChange?: (mode: string) => void;
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
  initialProjectViewState?: ThreeDProjectViewState | null;
  onProjectThreeDViewStateProviderChange?: (
    provider: ProjectThreeDViewStateProvider | null,
  ) => void;
  onProjectMapViewStateProviderChange?: (
    provider: ProjectMapViewStateProvider | null,
  ) => void;
  /** Registers an on-demand reader for a marker's current registry position. */
  onRuntimeMarkerPositionResolverChange?: (
    resolver: ThreeDRuntimeMarkerPositionResolver | null,
  ) => void;
  /** Library model currently awaiting a ground placement click. */
  placementModel?: ThreeDModelLibraryItem | null;
  /** Receives the selected ThreeD ground coordinate. */
  onModelPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** Persists an existing Project Model at a new Project-plan position. */
  onModelMove?: (
    instanceId: number,
    position: { x: number; y: number; z: number },
  ) => Promise<boolean>;
  /** Existing Project Model currently awaiting a new ThreeD ground position. */
  movingModelName?: string | null;
  /** Persists the selected ThreeD replacement position. */
  onModelReposition?: (position: { x: number; y: number; z: number }) => void;
  /** Character Library item currently awaiting a ground placement click. */
  placementCharacterName?: string | null;
  /** Receives the selected ThreeD ground coordinate for a Character. */
  onCharacterPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** Existing FarmBot currently awaiting a Project Scene placement click. */
  placementFarmBotName?: string | null;
  /** Receives the selected ThreeD ground coordinate for a FarmBot. */
  onFarmBotPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** New Bed currently awaiting a ground placement click. */
  placementBedName?: string | null;
  /** Receives the selected ThreeD ground coordinate for a new Bed. */
  onBedPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** New Planting currently awaiting a ground placement click. */
  placementPlantingName?: string | null;
  /** Receives the selected ThreeD ground coordinate for a new Planting. */
  onPlantingPlacement?: (position: { x: number; y: number; z: number }) => void;
  /** Removes only a rejected saved Project marker row after user confirmation. */
  onRejectedProjectMarkerDelete?: (recordId: number) => Promise<void>;
  /** Restores a rejected Character snapshot to its source Character position. */
  onRejectedCharacterMarkerRepair?: (recordId: number) => Promise<void>;
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
  runtimeMarkerRegistry,
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
  geographicOrigin = null,
  visibleAssetTypes,
  filterText = '',
  filterActiveOnly = false,
  filterAssetType = null,
  controlledCharacterId,
  onControlChange,
  cameraMode,
  onCameraModeChange,
  focusRequest = 0,
  actionTarget,
  actionTargetFocusRequest = 0,
  onProjectMarkerSnapshotProviderChange,
  initialProjectViewState,
  onProjectThreeDViewStateProviderChange,
  onProjectMapViewStateProviderChange,
  onRuntimeMarkerPositionResolverChange,
  placementModel,
  onModelPlacement,
  onModelMove,
  movingModelName,
  onModelReposition,
  placementCharacterName,
  onCharacterPlacement,
  placementFarmBotName,
  onFarmBotPlacement,
  placementBedName,
  onBedPlacement,
  placementPlantingName,
  onPlantingPlacement,
  onRejectedProjectMarkerDelete,
  onRejectedCharacterMarkerRepair,
}: UnifiedMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedMarkerRef = useRef<RuntimeMarker | null | undefined>(selectedMarker);
  selectedMarkerRef.current = selectedMarker;
  const stableMarkersRef = useRef<Map<string, RuntimeMarker>>(new Map());
  const markerProjectIdRef = useRef<number | null | undefined>(projectId);
  const ownsRuntimeMarkerRegistryRef = useRef(!runtimeMarkerRegistry);
  const runtimeMarkerRegistryRef = useRef<ThreeDRuntimeMarkerRegistry | null>(null);
  if (!runtimeMarkerRegistryRef.current) {
    runtimeMarkerRegistryRef.current = runtimeMarkerRegistry ?? new ThreeDRuntimeMarkerRegistry();
  }
  const [autoRotate, setAutoRotate] = useState(false);
  const [runtimePositionRevision, setRuntimePositionRevision] = useState(0);
  const lastMapRuntimeRevisionAtRef = useRef(0);
  const pendingMapRuntimeRevisionTimerRef = useRef<number | null>(null);
  const [deletingRejectedMarkerId, setDeletingRejectedMarkerId] = useState<number | null>(null);
  const [repairingRejectedMarkerId, setRepairingRejectedMarkerId] = useState<number | null>(null);

  const markerBuildResult = useMemo(
    () => buildThreeDRuntimeMarkerResult(data.threed.raw),
    [data.threed.raw],
  );
  const recoveredMarkerCount = markerBuildResult.issues.filter(
    (issue) => issue.outcome === 'recovered',
  ).length;
  const skippedMarkerCount = markerBuildResult.issues.length - recoveredMarkerCount;

  const runtimeMarkers = useMemo(() => {
    if (markerProjectIdRef.current !== projectId) {
      stableMarkersRef.current.clear();
      runtimeMarkerRegistryRef.current?.clear();
      markerProjectIdRef.current = projectId;
    }

    const previous = stableMarkersRef.current;
    const next = new Map<string, RuntimeMarker>();
    const markers = markerBuildResult.markers.map((marker) => {
      const existing = previous.get(marker.id);
      const stableMarker = existing && isSameRuntimeMarker(existing, marker)
        ? existing
        : marker;
      next.set(marker.id, stableMarker);
      return stableMarker;
    });
    stableMarkersRef.current = next;
    return markers;
  }, [markerBuildResult.markers, projectId]);

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
    if (ownsRuntimeMarkerRegistryRef.current) {
      runtimeMarkerRegistryRef.current?.clear();
    }
    if (pendingMapRuntimeRevisionTimerRef.current !== null) {
      window.clearTimeout(pendingMapRuntimeRevisionTimerRef.current);
      pendingMapRuntimeRevisionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const registry = runtimeMarkerRegistryRef.current;
    if (!registry || viewMode === '3d') return;
    return registry.subscribe(() => {
      const now = Date.now();
      const elapsed = now - lastMapRuntimeRevisionAtRef.current;
      const publishRevision = () => {
        pendingMapRuntimeRevisionTimerRef.current = null;
        lastMapRuntimeRevisionAtRef.current = Date.now();
        setRuntimePositionRevision((current) => current + 1);
      };
      if (elapsed >= 250) {
        if (pendingMapRuntimeRevisionTimerRef.current !== null) {
          window.clearTimeout(pendingMapRuntimeRevisionTimerRef.current);
        }
        publishRevision();
        return;
      }
      if (pendingMapRuntimeRevisionTimerRef.current !== null) {
        window.clearTimeout(pendingMapRuntimeRevisionTimerRef.current);
      }
      pendingMapRuntimeRevisionTimerRef.current = window.setTimeout(
        publishRevision,
        250 - elapsed,
      );
    });
  }, [viewMode]);

  const handleRuntimeMarkerPositionChange = useCallback((
    moduleType: string,
    assetId: number,
    position: { x: number; y: number; z: number },
  ) => {
    const updated = runtimeMarkerRegistryRef.current?.updateLivePosition(
      moduleType,
      assetId,
      position,
    );
    if (!updated) {
      console.debug('[ThreeD Runtime Position] Registry identity was unavailable', {
        moduleType,
        assetId,
      });
      return;
    }
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

  const actionTargetWithCurrentPosition = useMemo(() => {
    if (!actionTarget) return actionTarget;
    const position = resolveRuntimeMarkerPosition(actionTarget.type, actionTarget.id);
    return position ? { ...actionTarget, position } : actionTarget;
  }, [
    actionTarget,
    actionTargetFocusRequest,
    resolveRuntimeMarkerPosition,
    runtimePositionRevision,
  ]);

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

  const handleIncidentClick = useCallback((incident: TrafficIncident) => {
    // Use composite key for uniqueness across traffic collections
    if (onIncidentSelect) onIncidentSelect((selectedIncident as any)?.key === (incident as any).key ? null : incident);
  }, [onIncidentSelect, selectedIncident]);

  const handleMarkerClick = useCallback((marker: RuntimeMarker) => {
    if (onMarkerSelect) {
      onMarkerSelect(selectedMarkerRef.current?.id === marker.id ? null : marker);
    }
  }, [onMarkerSelect]);

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

  // ThreeD markers use the shared Project-plan ↔ map projection so the 2D
  // placement path can later reverse the exact display calculation.
  const leafletMarkers = useMemo(() => {
    return filteredMarkers
      .filter((m) => m.position && m.position.x !== undefined && m.position.z !== undefined)
      .map((m) => {
        const assetId = Number((m.data as Record<string, unknown>)?.id);
        const runtimePosition = Number.isSafeInteger(assetId) && assetId > 0
          ? resolveRuntimeMarkerPosition(m.type, assetId)
          : null;
        const currentPosition = runtimePosition ?? m.position;
        const rawLatitude = (m.data as Record<string, unknown>)?.latitude;
        const rawLongitude = (m.data as Record<string, unknown>)?.longitude;
        const rawAltitude = (m.data as Record<string, unknown>)?.altitude;
        const storedLatitude = rawLatitude === null || rawLatitude === undefined
          ? null
          : Number(rawLatitude);
        const storedLongitude = rawLongitude === null || rawLongitude === undefined
          ? null
          : Number(rawLongitude);
        // Local XYZ is authoritative. A configured Project origin therefore
        // always derives the Map position, avoiding stale persisted GPS after
        // an origin, heading, or physical-scale correction.
        const geographic = geographicOrigin
          ? projectLocalPositionToGeographicPosition(currentPosition, geographicOrigin)
          : storedLatitude !== null
            && storedLongitude !== null
            && Number.isFinite(storedLatitude)
            && Number.isFinite(storedLongitude)
            ? { latitude: storedLatitude, longitude: storedLongitude }
            : null;
        const fallback = geographic
          ? { lat: geographic.latitude, lng: geographic.longitude }
          : projectPlanPositionToMapPosition(currentPosition, gpsCenter);
        const storedAltitude = rawAltitude === null || rawAltitude === undefined
          ? null
          : Number(rawAltitude);
        const altitude = geographicOrigin
          ? geographicOrigin.altitude + (currentPosition.y * geographicOrigin.metersPerSceneUnit)
          : storedAltitude !== null && Number.isFinite(storedAltitude)
            ? storedAltitude
            : null;
        return {
          id: m.id, name: m.name, type: m.type,
          lat: fallback.lat, lng: fallback.lng,
          color: m.color, size: 'medium',
          metadata: {
            ...m.metadata,
            position: currentPosition,
            data: m.data,
            geographicPosition: {
              latitude: fallback.lat,
              longitude: fallback.lng,
              altitude,
            },
          },
        };
      });
  }, [
    filteredMarkers,
    geographicOrigin,
    gpsCenter,
    resolveRuntimeMarkerPosition,
    runtimePositionRevision,
    viewMode,
  ]);

  // The persistent ThreeD Scene receives every validated Project marker.
  // Presentation filters are passed separately so hiding one marker suspends
  // its existing Sub-Module runtime instead of unmounting its React/Rapier owner.
  const threeDMarkers = useMemo(() => runtimeMarkers
    .filter((m) => m.position && m.position.x !== undefined), [runtimeMarkers]);
  const visibleThreeDMarkerIds = useMemo(
    () => new Set(filteredMarkers.map((marker) => String(marker.id))),
    [filteredMarkers],
  );

  const handleMapModelPlacement = useCallback((position: { lat: number; lng: number }) => {
    if (!placementModel || !onModelPlacement) return;
    onModelPlacement(geographicOrigin
      ? geographicPositionToProjectLocalPosition({
          latitude: position.lat,
          longitude: position.lng,
          altitude: geographicOrigin.altitude,
        }, geographicOrigin)
      : mapPositionToProjectPlanPosition(position, gpsCenter));
  }, [geographicOrigin, gpsCenter, onModelPlacement, placementModel]);

  const handleMapModelMove = useCallback((
    instanceId: number,
    position: { lat: number; lng: number },
  ) => {
    const currentMarker = filteredMarkers.find((marker) => (
      Number((marker.data as Record<string, unknown>)?.instanceId) === instanceId
      || Number((marker.data as Record<string, unknown>)?.projectMarkerId) === instanceId
    ));
    const currentY = currentMarker?.position.y ?? 0;
    return onModelMove?.(
      instanceId,
      geographicOrigin
        ? geographicPositionToProjectLocalPosition({
            latitude: position.lat,
            longitude: position.lng,
            altitude: geographicOrigin.altitude
              + (currentY * geographicOrigin.metersPerSceneUnit),
          }, geographicOrigin)
        : mapPositionToProjectPlanPosition(position, gpsCenter),
    ) ?? Promise.resolve(false);
  }, [filteredMarkers, geographicOrigin, gpsCenter, onModelMove]);

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
      initialViewState={initialProjectViewState?.map}
      onViewStateProviderChange={onProjectMapViewStateProviderChange}
      placementActive={Boolean(placementModel)}
      placementModelId={placementModel?.id ?? null}
      onPlacement={handleMapModelPlacement}
      onModelMove={handleMapModelMove}
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
        geographicHeadingDegrees={geographicOrigin?.headingDegrees ?? 0}
        incidents={sceneIncidents}
        markers={threeDMarkers}
        visibleMarkerIds={visibleThreeDMarkerIds}
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
        initialViewState={initialProjectViewState?.threeD}
        onViewStateProviderChange={onProjectThreeDViewStateProviderChange}
        controlledCharacterId={controlledCharacterId}
        onControlChange={onControlChange}
        onRuntimeMarkerPositionChange={handleRuntimeMarkerPositionChange}
        resolveRuntimeMarkerPosition={resolveRuntimeMarkerPosition}
        cameraMode={cameraMode as any}
        onCameraModeChange={onCameraModeChange}
        focusRequest={focusRequest}
        actionTarget={actionTargetWithCurrentPosition}
        actionTargetFocusRequest={actionTargetFocusRequest}
        placementModel={placementModel}
        onModelPlacement={onModelPlacement}
        movingModelName={movingModelName}
        onModelReposition={onModelReposition}
        placementCharacterName={placementCharacterName}
        onCharacterPlacement={onCharacterPlacement}
        placementFarmBotName={placementFarmBotName}
        onFarmBotPlacement={onFarmBotPlacement}
        placementBedName={placementBedName}
        onBedPlacement={onBedPlacement}
        placementPlantingName={placementPlantingName}
        onPlantingPlacement={onPlantingPlacement}
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

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {markerBuildResult.issues.length > 0 && (
        <details className="absolute left-3 top-3 z-40 max-w-lg rounded border border-amber-400/40 bg-black/90 text-white shadow-xl">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {skippedMarkerCount === 0
              ? `${recoveredMarkerCount} ThreeD marker snapshot${recoveredMarkerCount === 1 ? '' : 's'} recovered safely`
              : `${skippedMarkerCount} ThreeD marker record${skippedMarkerCount === 1 ? '' : 's'} skipped for safety${recoveredMarkerCount > 0 ? `; ${recoveredMarkerCount} recovered` : ''}`}
          </summary>
          <div className="max-h-72 space-y-2 overflow-y-auto border-t border-white/10 px-3 py-2 text-[11px]">
            <p className="text-white/65">
              {skippedMarkerCount === 0
                ? 'Unsafe saved transforms were kept out of Rapier. The affected marker was loaded at its valid source position.'
                : 'Skipped records were not sent to the ThreeD Scene or Rapier. Correct or delete the listed records in Admin.'}
            </p>
            {markerBuildResult.issues.some((issue) => (
              issue.source === 'threed_sub_module' && issue.markerType === 'characters'
            )) && (
              <a
                href="/admin/threed/characters"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded border border-amber-300/30 bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-100 hover:bg-amber-500/30"
              >
                Edit ThreeD Characters
              </a>
            )}
            {markerBuildResult.issues.slice(0, 10).map((issue, index) => (
              <div
                key={`${issue.source}-${issue.recordId ?? issue.markerId}-${index}`}
                className="rounded bg-amber-500/10 px-2 py-1.5"
              >
                <div className="font-medium text-amber-100">
                  {issue.source} row {issue.recordId ?? 'unknown'} · {issue.markerType} · {issue.markerId}
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-white/70">
                  {issue.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
                {issue.source === 'project_threed_markers'
                  && issue.markerType === 'characters'
                  && issue.recordId != null
                  && onRejectedCharacterMarkerRepair && (
                    <button
                      type="button"
                      disabled={repairingRejectedMarkerId != null}
                      onClick={async () => {
                        if (issue.recordId == null) return;
                        setRepairingRejectedMarkerId(issue.recordId);
                        try {
                          await onRejectedCharacterMarkerRepair(issue.recordId);
                        } finally {
                          setRepairingRejectedMarkerId(null);
                        }
                      }}
                      className="mr-2 mt-2 rounded border border-emerald-300/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {repairingRejectedMarkerId === issue.recordId
                        ? 'Restoring…'
                        : 'Restore Source Position'}
                    </button>
                  )}
                {issue.source === 'project_threed_markers'
                  && issue.recordId != null
                  && onRejectedProjectMarkerDelete && (
                    <button
                      type="button"
                      disabled={deletingRejectedMarkerId != null}
                      onClick={async () => {
                        if (issue.recordId == null) return;
                        if (!window.confirm(
                          `Remove saved ThreeD marker row ${issue.recordId}? The reusable source asset will remain.`,
                        )) return;
                        setDeletingRejectedMarkerId(issue.recordId);
                        try {
                          await onRejectedProjectMarkerDelete(issue.recordId);
                        } finally {
                          setDeletingRejectedMarkerId(null);
                        }
                      }}
                      className="mt-2 rounded border border-red-300/30 bg-red-500/15 px-2 py-1 text-[10px] font-medium text-red-100 hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {deletingRejectedMarkerId === issue.recordId
                        ? 'Removing…'
                        : 'Remove Saved Marker'}
                    </button>
                  )}
              </div>
            ))}
            {markerBuildResult.issues.length > 10 && (
              <p className="text-white/55">
                Plus {markerBuildResult.issues.length - 10} additional rejected records.
              </p>
            )}
          </div>
        </details>
      )}
      {renderMap()}
    </div>
  );
}
