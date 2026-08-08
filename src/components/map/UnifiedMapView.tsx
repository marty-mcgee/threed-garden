// components/map/UnifiedMapView.tsx
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { UnifiedMapData, MapViewMode, MapLayerConfig, TrafficIncident, RuntimeMarker } from '@/lib/types/map';
import { LeafletMap } from '@/components/map/LeafletMap';

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
}

const MARKER_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  planting: { color: '#22c55e', icon: '🌱', label: 'Planting' },
  plantings: { color: '#22c55e', icon: '🌱', label: 'Planting' },
  bed: { color: '#f59e0b', icon: '🧑‍🌾', label: 'Bed' },
  beds: { color: '#f59e0b', icon: '🧑‍🌾', label: 'Bed' },
  character: { color: '#8b5cf6', icon: '🧚', label: 'Character' },
  characters: { color: '#8b5cf6', icon: '🧚', label: 'Character' },
  farmbot: { color: '#64748b', icon: '🤖', label: 'FarmBot' },
  farmbots: { color: '#64748b', icon: '🤖', label: 'FarmBot' },
};

function isTrafficIncident(m: RuntimeMarker | TrafficIncident): m is TrafficIncident {
  return 'source' in m;
}

export function UnifiedMapView({
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
}: UnifiedMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const runtimeMarkers = useMemo((): RuntimeMarker[] => {
    if (!data.threed.raw) return [];
    const now = new Date().toISOString();
    const markers: RuntimeMarker[] = [];

    const extractPosition = (item: any): { x: number; y: number; z: number } | null => {
      // ✅ Prefer flat DB column names (positionX, positionY, positionZ) over nested JSON position.x/y/z
      // DB rows return decimal columns as strings, so parse them
      const rawX = item.positionX ?? item.position?.x ?? item.latitude ?? item.lat ?? null;
      const rawY = item.positionY ?? item.position?.y ?? item.height ?? null;
      const rawZ = item.positionZ ?? item.position?.z ?? item.longitude ?? item.lng ?? null;
      if (rawX === null && rawY === null && rawZ === null) return null;
      const x = typeof rawX === 'string' ? parseFloat(rawX) : (rawX ?? 0);
      const y = typeof rawY === 'string' ? parseFloat(rawY) : (rawY ?? 0);
      const z = typeof rawZ === 'string' ? parseFloat(rawZ) : (rawZ ?? 0);
      // Only skip if ALL three are NaN — zero is a valid coordinate (e.g. ground marker at origin or y=0)
      if (isNaN(x) && isNaN(y) && isNaN(z)) return null;
      // Ensure NaN defaults to 0 for partially missing axes
      return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y, z: isNaN(z) ? 0 : z };
    };

    const extractName = (item: any, type: string) => {
      if (type === 'plantings' && item.plantId) {
        const plant = data.threed.raw?.plants?.find((p: any) => p.id === item.plantId);
        if (plant) return plant.commonName || plant.name || `${type} #${item.id}`;
      }
      return item.name || item.commonName || item.modelName || item.title || item.plantId || `${type} #${item.id}`;
    };

    // ✅ Helper to add a marker only when position is valid
    const pushIfPositioned = (
      id: string, name: string, type: string, item: any,
      config: { color: string; icon: string; label: string }
    ) => {
      const position = extractPosition(item);
      if (!position) return;
      markers.push({
        id, name, type, position,
        color: item.color || config.color,
        icon: config.icon, label: name,
        isVisible: item.isVisible ?? true,
        isActive: item.isActive ?? true,
        data: { id: item.id, description: item.notes || item.description || '', ...item },
        metadata: { source: 'sub-module' as const, generatedAt: now },
      });
    };

    // Plantings
    if (data.threed.raw.plantings?.length > 0) {
      data.threed.raw.plantings.forEach((item: any) => {
        pushIfPositioned(
          `plantings-${item.id}`,
          extractName(item, 'plantings'),
          'plantings', item,
          MARKER_CONFIG.plantings
        );
      });
    }

    const raw = data.threed.raw as Record<string, any[]>;
    const typesToProcess = ['beds', 'characters', 'farmbots'];
    typesToProcess.forEach((type) => {
      if (!raw[type]) return;
      raw[type].forEach((item: any) => {
        const config = MARKER_CONFIG[type] || MARKER_CONFIG.planting;
        pushIfPositioned(
          `${type}-${item.id}`,
          extractName(item, type),
          type, item, config
        );
      });
    });

    return markers;
  }, [data.threed.raw]);

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
    .filter((m) => m.position && m.position.x !== undefined)
    .map((m) => ({
      id: m.id, name: m.name, type: m.type,
      position: m.position, color: m.color,
      icon: m.icon, label: m.label,
      metadata: m.metadata, data: m.data,
    })), [filteredMarkers]);

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
        incidents={sceneIncidents}
        markers={threeDMarkers}
        onIncidentClick={handleIncidentClick}
        onMarkerClick={handleMarkerClick}
        selectedIncident={selectedIncident}
        selectedMarker={selectedMarker}
        height="100%"
        autoRotate={autoRotate}
        onAutoRotateToggle={() => setAutoRotate(!autoRotate)}
        controlledCharacterId={controlledCharacterId}
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