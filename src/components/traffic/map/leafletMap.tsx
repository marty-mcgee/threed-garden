// src/components/map/leafletMap.tsx
'use client';

import { useEffect, useRef } from 'react';

// Import Leaflet dynamically to avoid SSR issues
let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

interface MapEvent {
  id: number;
  latitude: number;
  longitude: number;
  roadwayName: string;
  eventType: string;
  description: string;
}

interface LeafletMapProps {
  events: MapEvent[];
  center?: [number, number];
  zoom?: number;
}

export default function LeafletMap({ events, center = [39.3, -123.5], zoom = 9 }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize map (always runs, regardless of events)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (typeof window === 'undefined') return;
    if (!L) return;

    console.log('Initializing map with center:', center, 'zoom:', zoom);

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);
    
    // Add tile layer (OpenStreetMap base map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(map);

    mapInstanceRef.current = map;
    console.log('Map initialized successfully');

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  // Add/update markers when events change
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;
    
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    console.log(`Adding ${events.length} markers to map`);

    // Add markers for each event (if any)
    events.forEach(event => {
      const getMarkerColor = () => {
        const type = event.eventType?.toLowerCase() || '';
        if (type.includes('accident')) return '#ef4444';
        if (type.includes('construction')) return '#f97316';
        if (type.includes('roadwork')) return '#3b82f6';
        return '#10b981';
      };

      // Create custom marker
      const markerHtml = `
        <div style="
          background-color: ${getMarkerColor()};
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        iconSize: [18, 18],
        popupAnchor: [0, -9],
        className: 'custom-marker'
      });

      const popupContent = `
        <div style="min-width: 200px; max-width: 300px; font-family: system-ui;">
          <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${event.roadwayName || 'Unknown Roadway'}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${event.eventType || 'Event'}</p>
          <p style="font-size: 12px; margin-bottom: 4px;">${event.description?.substring(0, 100) || 'No description'}</p>
        </div>
      `;

      const marker = L.marker([event.latitude, event.longitude], { icon: customIcon })
        .bindPopup(popupContent);

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if there are multiple
    if (events.length > 1) {
      const bounds = L.latLngBounds(events.map(e => [e.latitude, e.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (events.length === 1) {
      map.setView([events[0].latitude, events[0].longitude], 12);
    }

  }, [events]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
      style={{ zIndex: 1, backgroundColor: '#f0f0f0' }}
    />
  );
}