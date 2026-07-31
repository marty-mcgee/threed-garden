// components/map/UnifiedMapView.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, AlertTriangle, Info, Box } from 'lucide-react';
import { UnifiedMapData, MapViewMode, MapLayerConfig, TrafficIncident, ThreeDMarker } from '@/lib/types/map';
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
  onMarkerSelect?: (marker: ThreeDMarker | null) => void;
  selectedIncident?: TrafficIncident | null;
  selectedMarker?: ThreeDMarker | null;
  height?: string;
  gpsCenter?: { lat: number; lng: number };
}

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
  const [hoveredMarker, setHoveredMarker] = useState<ThreeDMarker | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  // ✅ Filter incidents based on enabled layers
  const filteredIncidents = data.traffic.incidents.filter((incident) => {
    const layerConfig = layers.traffic[incident.source as keyof typeof layers.traffic];
    return layerConfig?.enabled && layerConfig?.visible;
  });

  // ✅ Filter markers based on enabled layers
  const filteredMarkers = data.threed.markers.filter((marker) => {
    const layerConfig = layers.threed[marker.type as keyof typeof layers.threed];
    return layerConfig?.enabled && layerConfig?.visible;
  });

  // ✅ Get active layer counts for display
  const activeTrafficCount = filteredIncidents.length;
  const activeThreeDCount = filteredMarkers.length;

  // ✅ Handle incident click
  const handleIncidentClick = useCallback((incident: TrafficIncident) => {
    if (onIncidentSelect) {
      onIncidentSelect(selectedIncident?.id === incident.id ? null : incident);
    }
  }, [onIncidentSelect, selectedIncident]);

  // ✅ Handle marker click
  const handleMarkerClick = useCallback((marker: ThreeDMarker) => {
    if (onMarkerSelect) {
      onMarkerSelect(selectedMarker?.id === marker.id ? null : marker);
    }
  }, [onMarkerSelect, selectedMarker]);

  // ✅ Prepare incidents for Leaflet with proper coordinates
  const leafletIncidents = filteredIncidents
    .filter((incident) => incident.lat && incident.lng && incident.lat !== 0 && incident.lng !== 0)
    .map((incident) => ({
      ...incident,
      lat: incident.lat,
      lng: incident.lng,
    }));

  // ✅ Prepare markers for Leaflet (convert 3D position to 2D)
  const leafletMarkers = filteredMarkers
    .filter((marker) => marker.position && marker.position.x !== undefined && marker.position.z !== undefined)
    .map((marker) => ({
      id: marker.id,
      name: marker.name,
      type: marker.type,
      lat: marker.position.x,
      lng: marker.position.z,
      color: marker.color,
      size: marker.size,
      metadata: {
        ...marker.metadata,
        position: marker.position,
      },
    }));

  // ✅ Prepare traffic incidents for 3D (convert lat/lng to 3D position)
  const threeDIncidents = filteredIncidents
    .filter((incident) => incident.lat && incident.lng)
    .map((incident) => ({
      ...incident,
      position: {
        x: incident.lat,
        y: 0,
        z: incident.lng,
      },
    }));

  // ✅ Prepare markers for 3D
  const threeDMarkers = filteredMarkers.map((marker) => ({
    ...marker,
  }));

  // ✅ Render 2D view (Leaflet) - ALWAYS renders map, even with no data
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

  // ✅ Render 3D view (React Three Fiber) - ALWAYS renders scene, even with no data
  const render3DView = () => {
    // ✅ Prepare traffic incidents for 3D (convert lat/lng to 3D position)
    const threeDIncidents = filteredIncidents
      .filter((incident) => incident.lat && incident.lng)
      .map((incident) => ({
        ...incident,
        position: {
          x: (incident.lng - (-119.5)) * 2.0,  // Scale longitude
          y: 0,
          z: (incident.lat - 37.5) * 2.0,       // Scale latitude
        },
      }));

    // ✅ Prepare markers for 3D (use existing position or convert)
    const threeDMarkers = filteredMarkers.map((marker) => ({
      ...marker,
      position: marker.position || { x: 0, y: 0, z: 0 },
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
        {/* ✅ 2D Base Layer - ALWAYS renders */}
        <div className="absolute inset-0">
          {render2DView()}
        </div>

        {/* ✅ 3D Overlay indicator (only if there's data) */}
        {activeThreeDCount > 0 && (
          <div className="absolute top-4 right-4 z-[1000]">
            <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm">
              <Box className="w-3 h-3 mr-1" />
              {activeThreeDCount} 3D items
            </Badge>
          </div>
        )}

        {/* ✅ Combined View Legend */}
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

        {/* ✅ Combined View Controls */}
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
      {/* ✅ Map Container - ALWAYS renders map */}
      <div className="w-full h-full rounded-lg overflow-hidden">
        {renderMap()}
      </div>

      {/* ✅ Selection Details Panel - ONLY for 2D (Leaflet) */}
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

      {/* ✅ 2D Marker Details (only for Leaflet) */}
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