// src/components/map/masterMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map bounds updater component
function MapBoundsUpdater({ events }: { events: MasterMapEvent[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (events.length === 0) return;
    
    const eventsWithCoords = events.filter(e => e.latitude && e.longitude);
    if (eventsWithCoords.length === 0) return;
    
    const bounds = L.latLngBounds(eventsWithCoords.map(e => [e.latitude, e.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [events, map]);
  
  return null;
}

export interface MasterMapEvent {
  id: number;
  source: 'caltrans' | 'bayarea511' | 'chp-live' | 'chp-historical';
  type: string;
  severity?: string;
  location: string;
  city?: string;
  county?: string;
  description?: string;
  latitude: number | string;
  longitude: number | string;
  timestamp?: string;
}

interface MasterMapProps {
  events: MasterMapEvent[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onEventClick?: (event: MasterMapEvent) => void;
}

const getSourceColor = (source: string) => {
  switch (source) {
    case 'caltrans': return '#3b82f6';
    case 'bayarea511': return '#10b981';
    case 'chp-live': return '#ef4444';
    case 'chp-historical': return '#8b5cf6';
    default: return '#6b7280';
  }
};

const getSourceName = (source: string) => {
  switch (source) {
    case 'caltrans': return 'Caltrans';
    case 'bayarea511': return '511.org';
    case 'chp-live': return 'CHP Live';
    case 'chp-historical': return 'CHP Historical';
    default: return source;
  }
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'caltrans': return '🚧';
    case 'bayarea511': return '🚗';
    case 'chp-live': return '🚨';
    case 'chp-historical': return '📊';
    default: return '📍';
  }
};

export default function MasterMap({ events, center = [39.3, -123.5], zoom = 9, height = '500px', onEventClick }: MasterMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`w-full h-[${height}] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  const eventsWithCoords = events.filter(e => {
    const lat = typeof e.latitude === 'string' ? parseFloat(e.latitude) : e.latitude;
    const lng = typeof e.longitude === 'string' ? parseFloat(e.longitude) : e.longitude;
    return lat && lng && !isNaN(lat) && !isNaN(lng);
  });

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.75rem', zIndex: 1 }}
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {eventsWithCoords.map((event) => {
        const lat = typeof event.latitude === 'string' ? parseFloat(event.latitude) : event.latitude;
        const lng = typeof event.longitude === 'string' ? parseFloat(event.longitude) : event.longitude;
        const sourceColor = getSourceColor(event.source);
        
        const customIcon = L.divIcon({
          html: `<div style="
            background-color: ${sourceColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
            cursor: pointer;
          ">${getSourceIcon(event.source)}</div>`,
          iconSize: [32, 32],
          popupAnchor: [0, -16],
          className: 'custom-marker'
        });

        return (
          <Marker
            key={`${event.source}-${event.id}`}
            position={[lat, lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => onEventClick?.(event),
            }}
          >
            <Popup>
              <div style={{ minWidth: '220px', maxWidth: '320px', fontFamily: 'system-ui' }}>
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: sourceColor }} />
                  <span className="text-xs font-semibold uppercase">{getSourceName(event.source)}</span>
                </div>
                <h3 className="font-bold text-sm mb-1">{event.type || 'Event'}</h3>
                <p className="text-xs text-gray-600 mb-2">{event.location}</p>
                {event.description && (
                  <p className="text-xs text-gray-500 mb-2">{event.description.substring(0, 120)}</p>
                )}
                {event.city && <p className="text-xs text-gray-400">📍 City: {event.city}</p>}
                {event.county && <p className="text-xs text-gray-400">📍 County: {event.county}</p>}
                {event.timestamp && (
                  <p className="text-xs text-gray-400 mt-1">🕐 {new Date(event.timestamp).toLocaleString()}</p>
                )}
                {event.severity && (
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                    event.severity === 'Fatal' || event.severity === 'Major' ? 'bg-red-100 text-red-700' : 
                    event.severity === 'Injury' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {event.severity}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      <MapBoundsUpdater events={eventsWithCoords} />
    </MapContainer>
  );
}