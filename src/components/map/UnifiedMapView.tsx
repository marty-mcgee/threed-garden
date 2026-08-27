// components/map/UnifiedMapView.tsx
'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { UnifiedMapData, MapViewMode, MapLayerConfig, TrafficIncident, RuntimeMarker, ThreeDActionTarget } from '@/lib/types/map';
import { LeafletMap } from '@/components/map/LeafletMap';
import {
  buildThreeDRuntimeMarkerResult,
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
  /** Registers an on-demand reader for a marker's current registry position. */
  onRuntimeMarkerPositionResolverChange?: (
    resolver: ThreeDRuntimeMarkerPositionResolver | null,
  ) => void;
  /** Library model currently awaiting a ground placement click. */
  placementModel?: ThreeDModelLibraryItem | null;
  /** Receives the selected ThreeD ground coordinate. */
  onModelPlacement?: (position: { x: number; y: number; z: number }) => void;
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
  onCameraModeChange,
  focusRequest = 0,
  actionTarget,
  actionTargetFocusRequest = 0,
  onProjectMarkerSnapshotProviderChange,
  onRuntimeMarkerPositionResolverChange,
  placementModel,
  onModelPlacement,
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
  const runtimeMarkerRegistryRef = useRef<ThreeDRuntimeMarkerRegistry | null>(null);
  if (!runtimeMarkerRegistryRef.current) {
    runtimeMarkerRegistryRef.current = new ThreeDRuntimeMarkerRegistry();
  }
  const [autoRotate, setAutoRotate] = useState(false);
  const [deletingRejectedMarkerId, setDeletingRejectedMarkerId] = useState<number | null>(null);
  const [repairingRejectedMarkerId, setRepairingRejectedMarkerId] = useState<number | null>(null);

  const markerBuildResult = useMemo(
    () => buildThreeDRuntimeMarkerResult(data.threed.raw),
    [data.threed.raw],
  );

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

  // The persistent ThreeD Scene receives every validated Project marker.
  // Presentation filters are passed separately so hiding one marker suspends
  // its existing Sub-Module runtime instead of unmounting its React/Rapier owner.
  const threeDMarkers = useMemo(() => runtimeMarkers
    .filter((m) => m.position && m.position.x !== undefined), [runtimeMarkers]);
  const visibleThreeDMarkerIds = useMemo(
    () => new Set(filteredMarkers.map((marker) => String(marker.id))),
    [filteredMarkers],
  );

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
        controlledCharacterId={controlledCharacterId}
        onControlChange={onControlChange}
        onRuntimeMarkerPositionChange={handleRuntimeMarkerPositionChange}
        cameraMode={cameraMode as any}
        onCameraModeChange={onCameraModeChange}
        focusRequest={focusRequest}
        actionTarget={actionTarget}
        actionTargetFocusRequest={actionTargetFocusRequest}
        placementModel={placementModel}
        onModelPlacement={onModelPlacement}
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
            {markerBuildResult.issues.length} ThreeD marker record{markerBuildResult.issues.length === 1 ? '' : 's'} skipped for safety
          </summary>
          <div className="max-h-72 space-y-2 overflow-y-auto border-t border-white/10 px-3 py-2 text-[11px]">
            <p className="text-white/65">
              These records were not sent to the ThreeD Scene or Rapier. Correct or delete the listed records in Admin.
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
