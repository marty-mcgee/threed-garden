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
}

const MARKER_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  planting: { color: '#22c55e', icon: '🌱', label: 'Planting' },
  bed: { color: '#f59e0b', icon: '🧑‍🌾', label: 'Bed' },
  character: { color: '#8b5cf6', icon: '🧚', label: 'Character' },
  farmbot: { color: '#64748b', icon: '🤖', label: 'FarmBot' },
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
}: UnifiedMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const runtimeMarkers = useMemo((): RuntimeMarker[] => {
    if (!data.threed.raw) return [];
    const now = new Date().toISOString();
    const markers: RuntimeMarker[] = [];

    const extractPosition = (item: any) => {
      let x = item.position?.x ?? item.positionX ?? item.latitude ?? item.lat ?? 0;
      let y = item.position?.y ?? item.positionY ?? item.height ?? 0;
      let z = item.position?.z ?? item.positionZ ?? item.longitude ?? item.lng ?? 0;
      if (typeof x === 'string') x = parseFloat(x);
      if (typeof y === 'string') y = parseFloat(y);
      if (typeof z === 'string') z = parseFloat(z);
      return { x, y, z };
    };

    const extractName = (item: any, type: string) => {
      if (type === 'plantings' && item.plantId) {
        const plant = data.threed.raw?.plants?.find((p: any) => p.id === item.plantId);
        if (plant) return plant.commonName || plant.name || `${type} #${item.id}`;
      }
      return item.name || item.commonName || item.modelName || item.title || item.plantId || `${type} #${item.id}`;
    };

    // Plantings
    if (data.threed.raw.plantings?.length > 0) {
      data.threed.raw.plantings.forEach((item: any) => {
        const config = MARKER_CONFIG.planting;
        markers.push({
          id: `planting-${item.id}`,
          name: extractName(item, 'plantings'),
          type: 'planting',
          position: extractPosition(item),
          color: item.color || config.color,
          icon: config.icon,
          label: extractName(item, 'plantings'),
          isVisible: item.isVisible ?? true,
          isActive: item.isActive ?? true,
          data: { id: item.id, description: item.notes || '', ...item },
          metadata: { source: 'sub-module' as const, generatedAt: now },
        });
      });
    }

    const raw = data.threed.raw as Record<string, any[]>;
    const typesToProcess = ['beds', 'characters', 'farmbots'];
    typesToProcess.forEach((type) => {
      if (!raw[type]) return;
      raw[type].forEach((item: any) => {
        const position = extractPosition(item);
        if (position.x === 0 && position.y === 0 && position.z === 0) return;
        const config = MARKER_CONFIG[type] || MARKER_CONFIG.planting;
        markers.push({
          id: `${type}-${item.id}`,
          name: extractName(item, type),
          type,
          position,
          color: item.color || config.color,
          icon: config.icon,
          label: extractName(item, type),
          isVisible: item.isVisible ?? true,
          isActive: item.isActive ?? true,
          data: { id: item.id, description: item.description || '', ...item },
          metadata: { source: 'sub-module' as const, generatedAt: now },
        });
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

  const filteredIncidents = data.traffic.raw ? Object.values(data.traffic.raw).flat() : [];

  const filteredMarkers = runtimeMarkers.filter((marker) => {
    const layerConfig = layers.threed[marker.type as keyof typeof layers.threed];
    if (!layerConfig?.enabled || !layerConfig?.visible) return false;
    if (visibleAssetTypes && visibleAssetTypes.size > 0) return visibleAssetTypes.has(marker.type);
    return true;
  });

  const spreadMarkers = useMemo(() => spreadOverlappingMarkers(filteredMarkers, 1.5), [filteredMarkers]);

  const handleIncidentClick = useCallback((incident: TrafficIncident) => {
    if (onIncidentSelect) onIncidentSelect(selectedIncident?.id === incident.id ? null : incident);
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

  const leafletMarkers = spreadMarkers
    .filter((marker) => marker.position && marker.position.x !== undefined && marker.position.z !== undefined)
    .map((marker) => ({
      id: marker.id, name: marker.name, type: marker.type,
      lat: marker.position.x, lng: marker.position.z,
      color: marker.color, size: 'medium',
      metadata: { ...marker.metadata, position: marker.position, data: marker.data },
    }));

  const threeDMarkers = spreadMarkers
    .filter((marker) => marker.position && marker.position.x !== undefined)
    .map((marker) => ({
      id: marker.id, name: marker.name, type: marker.type,
      position: marker.position, color: marker.color,
      icon: marker.icon, label: marker.label,
      metadata: marker.metadata, data: marker.data,
    }));

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