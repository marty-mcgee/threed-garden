// components/traffic/map/EnhancedLeafletMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ============================================
// TYPES
// ============================================

export interface TrafficIncident {
  id: string;
  type: 'chp' | 'caltrans' | '511' | 'calfire';
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
  details?: Record<string, any>;
}

interface EnhancedLeafletMapProps {
  incidents: TrafficIncident[];
  onRefresh?: () => void;
  autoRefreshInterval?: number;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

// ============================================
// CUSTOM MARKER ICONS
// ============================================

const getMarkerIcon = (type: TrafficIncident['type'], severity?: string) => {
  const colors = {
    chp: '#ef4444',
    caltrans: '#3b82f6',
    '511': '#10b981',
    calfire: '#f97316',
  };

  const size = severity === 'critical' ? 32 : severity === 'high' ? 28 : 24;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${colors[type]};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${size * 0.5}px;
        font-weight: bold;
        transition: all 0.2s;
      ">
        ${type === 'chp' ? '🚨' : type === 'caltrans' ? '🚧' : type === '511' ? '📻' : '🔥'}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

// ============================================
// POPUP CONTENT - NO DATE FORMATTING
// ============================================

function createPopupContent(incident: TrafficIncident): string {
  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const severityBadge = incident.severity 
    ? `<span class="px-2 py-1 rounded-full text-xs font-medium ${severityColors[incident.severity] || severityColors.low}">
        ${incident.severity.toUpperCase()}
      </span>`
    : '';

  return `
    <div class="min-w-[250px] p-2">
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-bold text-gray-900 dark:text-white">${incident.title}</h3>
        ${severityBadge}
      </div>
      
      <div class="space-y-2 text-sm">
        <p class="text-gray-600 dark:text-gray-300">${incident.description}</p>
        
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span class="font-medium">📍</span>
          <span>${incident.location}</span>
        </div>
        
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span class="font-medium">📡</span>
          <span>${incident.source}</span>
        </div>

        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span class="font-medium">🕐</span>
          <span>${incident.timestamp || 'N/A'}</span>
        </div>
        
        ${incident.details ? `
          <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            ${Object.entries(incident.details)
              .filter(([key]) => !['id', 'type', 'lat', 'lng'].includes(key))
              .map(([key, value]) => `
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500">${key}:</span>
                  <span class="font-medium">${value}</span>
                </div>
              `).join('')}
          </div>
        ` : ''}
        
        <div class="mt-3 flex gap-2">
          <button 
            onclick="window.location.href='/dashboard/traffic/incident/${incident.id}'"
            class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
          >
            View Details
          </button>
          <button 
            onclick="window.open('https://www.google.com/maps?q=${incident.lat},${incident.lng}', '_blank')"
            class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Open Maps
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// MAP CONTROLLER
// ============================================

function MapController({ incidents }: { incidents: TrafficIncident[] }) {
  const map = useMap();
  const markerClusterRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Create marker cluster group
    const markerCluster = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
    });

    // Add markers to cluster
    incidents.forEach((incident) => {
      const marker = L.marker([incident.lat, incident.lng], {
        icon: getMarkerIcon(incident.type, incident.severity),
      });

      marker.bindPopup(createPopupContent(incident), {
        maxWidth: 300,
        className: 'incident-popup',
      });

      markerCluster.addLayer(marker);
    });

    map.addLayer(markerCluster);
    markerClusterRef.current = markerCluster;

    // Fit bounds to show all markers
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(incidents.map(i => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }

    return () => {
      map.removeLayer(markerCluster);
    };
  }, [map, incidents]);

  return null;
}

// ============================================
// MAP LEGEND
// ============================================

function MapLegend() {
  const legendItems = [
    { label: 'CHP Incidents', color: '#ef4444', icon: '🚨' },
    { label: 'Caltrans Closures', color: '#3b82f6', icon: '🚧' },
    { label: '511 Events', color: '#10b981', icon: '📻' },
    { label: 'CalFire Incidents', color: '#f97316', icon: '🔥' },
  ];

  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</h4>
      <div className="space-y-1.5">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{item.icon} {item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function EnhancedLeafletMap({
  incidents,
  onRefresh,
  autoRefreshInterval = 60000,
  height = '600px',
  center = [37.3, -119.5],
  zoom = 5,
}: EnhancedLeafletMapProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [incidentCount, setIncidentCount] = useState(incidents.length);

  // Auto-refresh
  useEffect(() => {
    if (!onRefresh) return;

    const interval = setInterval(async () => {
      await handleRefresh();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, onRefresh]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setIncidentCount(incidents.length);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update count when incidents change
  useEffect(() => {
    setIncidentCount(incidents.length);
  }, [incidents]);

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="bg-white dark:bg-gray-900 shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        
        <Badge variant="secondary" className="bg-white dark:bg-gray-900 shadow-lg">
          {incidentCount} Incidents
        </Badge>
      </div>

      {/* Map Container */}
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController incidents={incidents} />
          <MapLegend />
        </MapContainer>
      </div>
    </div>
  );
}