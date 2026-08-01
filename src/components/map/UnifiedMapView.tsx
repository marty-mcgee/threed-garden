// components/map/UnifiedMapView.tsx
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, AlertTriangle, Info, Box } from 'lucide-react';
import { UnifiedMapData, MapViewMode, MapLayerConfig, TrafficIncident, RuntimeMarker } from '@/lib/types/map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  getTrafficColor, 
  getThreeDColor, 
  getTrafficLabel, 
  getThreeDLabel 
} from '@/lib/utils/map-helpers';

// ✅ Dynamically import Leaflet (2D) to avoid SSR issues
const LeafletMap = dynamic(
  () => import('@/components/map/LeafletMap').then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

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
  selectedIncident?: TrafficIncident | null;
  selectedMarker?: RuntimeMarker | null;
  height?: string;
  gpsCenter?: { lat: number; lng: number };
}

// ✅ Marker configuration for different types
const MARKER_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  planting: { color: '#22c55e', icon: '🌱', label: 'Planting' },
  bed: { color: '#f59e0b', icon: '🧑‍🌾', label: 'Bed' },
  character: { color: '#8b5cf6', icon: '🧚', label: 'Character' },
  farmbot: { color: '#64748b', icon: '🤖', label: 'FarmBot' },
};

export function UnifiedMapView({
  data,
  layers,
  viewMode,
  onIncidentSelect,
  onMarkerSelect,
  selectedIncident,
  selectedMarker,
  height = '100%',
  gpsCenter = { lat: 39.514719, lng: -123.760382 },
}: UnifiedMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIncident, setHoveredIncident] = useState<TrafficIncident | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<RuntimeMarker | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  // ✅ Generate runtime markers from raw sub-module data
  const runtimeMarkers = useMemo((): RuntimeMarker[] => {
    if (!data.threed.raw) {
      return [];
    }

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
      // For plantings, try to get plant name first
      if (type === 'plantings' && item.plantId) {
        const plant = data.threed.raw?.plants?.find((p: any) => p.id === item.plantId);
        if (plant) {
          return plant.commonName || plant.name || `${type} #${item.id}`;
        }
      }
      return item.name || 
             item.commonName || 
             item.modelName || 
             item.title || 
             item.plantId || 
             `${type} #${item.id}`;
    };

    // ✅ Process plantings FIRST (they have position data)
    if (data.threed.raw.plantings && data.threed.raw.plantings.length > 0) {
      data.threed.raw.plantings.forEach((item: any) => {
        const config = MARKER_CONFIG.planting;
        const position = extractPosition(item);
        const name = extractName(item, 'plantings');
        const isActive = item.isActive ?? true;
        
        markers.push({
          id: `planting-${item.id}`,
          name: name,
          type: 'planting',
          position: position,
          color: item.color || config.color,
          icon: config.icon,
          label: name,
          isVisible: item.isVisible ?? true,
          isActive: isActive,
          data: {
            id: item.id,
            description: item.notes || '',
            ...item,
          },
          metadata: {
            source: 'sub-module',
            generatedAt: now,
          },
        });
      });
    }

    // ✅ Process other types that have position data
    // ❌ SKIP tasks (simple to-dos)
    // ❌ SKIP plants (master data)
    // ❌ SKIP harvests (simple logs)
    // ❌ SKIP weatherLogs (simple logs)
    // ❌ SKIP layers (configuration)
    // ❌ SKIP models (library)
    const typesToProcess = ['beds', 'characters', 'farmbots'];
    
    typesToProcess.forEach((type) => {
      if (!data.threed.raw?.[type]) return;
      
      data.threed.raw[type].forEach((item: any) => {
        const position = extractPosition(item);
        // Only create marker if position is not at origin (0,0,0)
        if (position.x === 0 && position.y === 0 && position.z === 0) {
          return; // Skip items without position data
        }
        
        const config = MARKER_CONFIG[type] || MARKER_CONFIG.planting;
        const name = extractName(item, type);
        const isActive = item.isActive ?? true;
        
        markers.push({
          id: `${type}-${item.id}`,
          name: name,
          type: type,
          position: position,
          color: item.color || config.color,
          icon: config.icon,
          label: name,
          isVisible: item.isVisible ?? true,
          isActive: isActive,
          data: {
            id: item.id,
            description: item.description || '',
            ...item,
          },
          metadata: {
            source: 'sub-module',
            generatedAt: now,
          },
        });
      });
    });

    return markers;
  }, [data.threed.raw]);

  // ✅ Helper to spread overlapping markers
  const spreadOverlappingMarkers = (markers: RuntimeMarker[], spreadDistance: number = 1.5): RuntimeMarker[] => {
    if (markers.length === 0) return markers;

    // Group markers by position (rounded to avoid floating point issues)
    const positionGroups: Record<string, RuntimeMarker[]> = {};
    
    markers.forEach(marker => {
      const key = `${Math.round(marker.position.x * 10) / 10},${Math.round(marker.position.y * 10) / 10},${Math.round(marker.position.z * 10) / 10}`;
      if (!positionGroups[key]) {
        positionGroups[key] = [];
      }
      positionGroups[key].push(marker);
    });
    
    // Spread markers in each group
    const spreadMarkers: RuntimeMarker[] = [];
    Object.values(positionGroups).forEach(group => {
      if (group.length === 1) {
        spreadMarkers.push(group[0]);
      } else {
        // Spread markers in a circle around the original position
        const basePos = group[0].position;
        group.forEach((marker, index) => {
          const angle = (index / group.length) * 2 * Math.PI;
          const radius = spreadDistance * (0.5 + index * 0.3);
          spreadMarkers.push({
            ...marker,
            position: {
              x: basePos.x + Math.cos(angle) * radius,
              y: basePos.y + 0.5 + index * 0.3, // Slight height offset
              z: basePos.z + Math.sin(angle) * radius,
            }
          });
        });
      }
    });
    
    return spreadMarkers;
  };

  // ✅ Filter incidents based on enabled layers
  const filteredIncidents = data.traffic.raw ? Object.values(data.traffic.raw).flat() : [];

  // ✅ Filter markers based on enabled layers
  const filteredMarkers = runtimeMarkers.filter((marker) => {
    const layerConfig = layers.threed[marker.type as keyof typeof layers.threed];
    return layerConfig?.enabled && layerConfig?.visible;
  });

  // ✅ Apply spreading to filtered markers
  const spreadMarkers = useMemo(() => {
    return spreadOverlappingMarkers(filteredMarkers, 1.5);
  }, [filteredMarkers]);

  // ✅ Get active layer counts
  const activeTrafficCount = filteredIncidents.length;
  const activeThreeDCount = spreadMarkers.length;

  // ✅ Handle incident click
  const handleIncidentClick = useCallback((incident: TrafficIncident) => {
    if (onIncidentSelect) {
      onIncidentSelect(selectedIncident?.id === incident.id ? null : incident);
    }
  }, [onIncidentSelect, selectedIncident]);

  // ✅ Handle marker click
  const handleMarkerClick = useCallback((marker: RuntimeMarker) => {
    if (onMarkerSelect) {
      onMarkerSelect(selectedMarker?.id === marker.id ? null : marker);
    }
  }, [onMarkerSelect, selectedMarker]);

  // ✅ Prepare incidents for Leaflet with proper coordinates
  const leafletIncidents = filteredIncidents
    .filter((incident: any) => incident.lat && incident.lng && incident.lat !== 0 && incident.lng !== 0)
    .map((incident: any) => ({
      ...incident,
      lat: incident.lat,
      lng: incident.lng,
    }));

  // ✅ Prepare markers for Leaflet (convert 3D position to 2D) - use spreadMarkers
  const leafletMarkers = spreadMarkers
    .filter((marker) => marker.position && marker.position.x !== undefined && marker.position.z !== undefined)
    .map((marker) => ({
      id: marker.id,
      name: marker.name,
      type: marker.type,
      lat: marker.position.x,
      lng: marker.position.z,
      color: marker.color,
      size: 'medium',
      metadata: {
        ...marker.metadata,
        position: marker.position,
        data: marker.data,
      },
    }));

  // ✅ Prepare traffic incidents for 3D (convert lat/lng to 3D position)
  const threeDIncidents = filteredIncidents
    .filter((incident: any) => incident.lat && incident.lng)
    .map((incident: any) => ({
      ...incident,
      position: {
        x: incident.lat,
        y: 0,
        z: incident.lng,
      },
    }));

  // ✅ Render 2D view (Leaflet)
  const render2DView = () => {
    return (
      <LeafletMap
        incidents={leafletIncidents}
        markers={leafletMarkers}
        onIncidentClick={handleIncidentClick}
        onMarkerClick={handleMarkerClick}
        selectedIncident={selectedIncident}
        selectedMarker={selectedMarker}
        height={height}
        gpsCenter={gpsCenter}
        center={[gpsCenter.lat, gpsCenter.lng]}
        zoom={12}
      />
    );
  };

  // ✅ Render 3D view (React Three Fiber)
  const render3DView = () => {
    // Prepare traffic incidents for 3D (convert lat/lng to 3D position)
    const threeDIncidents = filteredIncidents
      .filter((incident: any) => incident.lat && incident.lng)
      .map((incident: any) => ({
        ...incident,
        position: {
          x: (incident.lng - (-119.5)) * 2.0,
          y: 0,
          z: (incident.lat - 37.5) * 2.0,
        },
      }));

    // Prepare 3D markers for ThreeD scene - use spreadMarkers
    const threeDMarkers = spreadMarkers
      .filter((marker) => marker.position && marker.position.x !== undefined)
      .map((marker) => ({
        id: marker.id,
        name: marker.name,
        type: marker.type,
        position: marker.position,
        color: marker.color,
        icon: marker.icon,
        label: marker.label,
        metadata: marker.metadata,
        data: marker.data,
      }));

    return (
      <ThreeDScene
        incidents={threeDIncidents}
        markers={threeDMarkers}
        onIncidentClick={handleIncidentClick}
        onMarkerClick={handleMarkerClick}
        selectedIncident={selectedIncident}
        selectedMarker={selectedMarker}
        height={height}
        autoRotate={autoRotate}
        onAutoRotateToggle={() => setAutoRotate(!autoRotate)}
      />
    );
  };

  // ✅ Render combined view (2D + 3D overlay)
  const renderCombinedView = () => {
    return (
      <div className="relative w-full h-full">
        {/* 2D Base Layer */}
        <div className="absolute inset-0">
          {render2DView()}
        </div>

        {/* 3D Overlay indicator */}
        {activeThreeDCount > 0 && (
          <div className="absolute top-4 right-4 z-[1000]">
            <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm">
              <Box className="w-3 h-3 mr-1" />
              {activeThreeDCount} 3D items
            </Badge>
          </div>
        )}

        {/* Combined View Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm">
            <MapPin className="w-3 h-3 mr-1" />
            2D + 3D
          </Badge>
          <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm">
            🚗 {activeTrafficCount} traffic
          </Badge>
          <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm">
            📦 {activeThreeDCount} 3D
          </Badge>
        </div>

        {/* Combined View Controls */}
        <div className="absolute bottom-4 right-4 z-[1000] flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/50 text-white border-0 backdrop-blur-sm hover:bg-black/70"
            onClick={() => {
              // Toggle 3D overlay visibility
            }}
          >
            <Box className="w-3 h-3 mr-1" />
            3D Overlay
          </Button>
        </div>
      </div>
    );
  };

  // ✅ Render based on view mode
  const renderMap = () => {
    switch (viewMode) {
      case '2d':
        return render2DView();
      case '3d':
        return render3DView();
      case 'combined':
      default:
        return renderCombinedView();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {/* Map Container */}
      <div className="w-full h-full rounded-lg overflow-hidden">
        {renderMap()}
      </div>

      {/* Selection Details Panel - Traffic */}
      {selectedIncident && viewMode !== '3d' && (
        <div className="absolute bottom-24 left-4 z-[1000] max-w-sm">
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getTrafficColor(selectedIncident.source)} text-white`}>
                    {getTrafficLabel(selectedIncident.source)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedIncident.timestamp).toLocaleString()}
                  </span>
                </div>
                <h4 className="font-medium mt-1">{selectedIncident.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  📍 {selectedIncident.location}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onIncidentSelect && onIncidentSelect(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Marker Details */}
      {selectedMarker && viewMode !== '3d' && (
        <div className="absolute bottom-24 left-4 z-[1000] max-w-sm">
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getThreeDColor(selectedMarker.type)} text-white`}>
                    {getThreeDLabel(selectedMarker.type)}
                  </Badge>
                </div>
                <h4 className="font-medium mt-1">{selectedMarker.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  📍 Position: ({selectedMarker.position.x.toFixed(2)}, {selectedMarker.position.z.toFixed(2)})
                </p>
                {selectedMarker.data && (
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                    {selectedMarker.data.description || selectedMarker.data.plantId || ''}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMarkerSelect && onMarkerSelect(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}