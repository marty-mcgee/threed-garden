// src/components/map/simpleMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapBoundsUpdater({ events }: { events: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (events.length === 0) return;
    const validEvents = events.filter(e => e.latitude && e.longitude);
    if (validEvents.length === 0) return;
    const bounds = L.latLngBounds(validEvents.map(e => [e.latitude, e.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [events, map]);
  
  return null;
}

interface MapEvent {
  id: number;
  latitude: number;
  longitude: number;
  roadwayName: string;
  eventType: string;
  description: string;
  onClick?: () => void;
}

interface SimpleMapProps {
  events: MapEvent[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (event: MapEvent) => void;
}

export default function SimpleMap({ events, center = [39.3, -123.5], zoom = 11, height = '500px', onMarkerClick }: SimpleMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const validEvents = events.filter(e => e.latitude && e.longitude && !isNaN(e.latitude) && !isNaN(e.longitude));

  const handleMarkerClick = (event: MapEvent) => {
    if (event.onClick) {
      event.onClick();
    } else if (onMarkerClick) {
      onMarkerClick(event);
    }
  };

  return (
    <MapContainer
      key={`map-${center[0]}-${center[1]}-${zoom}`}
      // ref={mapRef} 
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.75rem', zIndex: 1 }}
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {validEvents.map((event) => {
        const getMarkerColor = () => {
          if (event.eventType.includes('🚧')) return '#3b82f6';
          if (event.eventType.includes('🚗')) return '#10b981';
          if (event.eventType.includes('🚨')) return '#ef4444';
          if (event.eventType.includes('📊')) return '#8b5cf6';
          return '#6b7280';
        };

        const customIcon = L.divIcon({
          html: `<div style="
            background-color: ${getMarkerColor()};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>`,
          iconSize: [18, 18],
          popupAnchor: [0, -9],
          className: 'custom-marker'
        });

        return (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => handleMarkerClick(event),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px', maxWidth: '300px' }}>
                <h3 className="font-bold text-sm mb-1">{event.eventType}</h3>
                <p className="text-xs text-gray-600 mb-2">{event.roadwayName}</p>
                <p className="text-xs text-gray-500 mb-2">{event.description?.substring(0, 100)}</p>
                <button
                  onClick={() => handleMarkerClick(event)}
                  className="mt-2 w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1 border-t border-gray-100"
                >
                  View details →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      <MapBoundsUpdater events={validEvents} />
    </MapContainer>
  );
}