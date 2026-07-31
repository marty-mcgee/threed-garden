// components/map/LeafletMap.tsx - Updated with GPS mapping

'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrafficIncident, ThreeDMarker } from '@/lib/types/map';
import { getTrafficColor, getTrafficLabel } from '@/lib/utils/map-helpers';
import { threeDToGPS } from '@/lib/utils/ThreeDToGPS';

// ✅ Fix Leaflet icon issue with Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapProps {
  incidents: TrafficIncident[];
  markers: Array<{
    id: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    color?: string;
    size?: string;
    metadata?: any;
  }>;
  onIncidentClick?: (incident: TrafficIncident) => void;
  onMarkerClick?: (marker: ThreeDMarker) => void;
  selectedIncident?: TrafficIncident | null;
  selectedMarker?: ThreeDMarker | null;
  center?: [number, number];
  zoom?: number;
  height?: string;
  gpsCenter?: { lat: number; lng: number }; // ✅ Add GPS center for ThreeD markers
}

export function LeafletMap({
  incidents,
  markers,
  onIncidentClick,
  onMarkerClick,
  selectedIncident,
  selectedMarker,
  center = [37.3, -119.5],
  zoom = 5,
  height = '100%',
  gpsCenter,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // ✅ Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      fadeAnimation: true,
      attributionControl: true,
    });

    // ✅ Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom]);

  // ✅ Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    // ✅ Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;

    // ✅ Helper to check if coordinates are valid
    const isValidCoordinate = (lat: number, lng: number) => {
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && 
             lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    };

    let hasValidMarkers = false;
    const bounds = L.latLngBounds();

    // ✅ Add incident markers
    incidents.forEach((incident) => {
      if (!isValidCoordinate(incident.lat, incident.lng)) return;

      hasValidMarkers = true;
      const color = getTrafficColor(incident.source);
      const popupContent = `
        <div class="p-2 max-w-xs">
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-block w-3 h-3 rounded-full ${color}"></span>
            <span class="font-medium text-sm">${incident.title}</span>
          </div>
          <p class="text-xs text-gray-600">${incident.description || ''}</p>
          <p class="text-xs text-gray-500 mt-1">📍 ${incident.location}</p>
          <p class="text-xs text-gray-500">${getTrafficLabel(incident.source)} • ${new Date(incident.timestamp).toLocaleString()}</p>
          <button class="mt-2 text-xs text-blue-600 hover:underline" data-incident-id="${incident.id}">View Details</button>
        </div>
      `;

      // ✅ Create custom icon based on severity
      const iconHtml = `
        <div class="relative">
          <div class="w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
            ${incident.severity === 'critical' ? '!' : incident.severity === 'high' ? 'H' : '●'}
          </div>
          ${incident.severity === 'critical' || incident.severity === 'high' ? `
            <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          ` : ''}
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const latLng = L.latLng(incident.lat, incident.lng);
      bounds.extend(latLng);

      const marker = L.marker(latLng, { icon })
        .bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        })
        .on('click', () => {
          if (onIncidentClick) onIncidentClick(incident);
        });

      layerGroup.addLayer(marker);

      // ✅ Highlight selected incident
      if (selectedIncident && selectedIncident.id === incident.id) {
        const highlightIcon = L.divIcon({
          html: `
            <div class="relative">
              <div class="w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shadow-lg border-4 border-blue-500 animate-pulse">
                ${incident.severity === 'critical' ? '!' : '●'}
              </div>
            </div>
          `,
          className: 'custom-marker-selected',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const highlightMarker = L.marker(latLng, { icon: highlightIcon })
          .addTo(layerGroup);
      }
    });

    // ✅ Add ThreeD markers (converted to GPS coordinates)
    markers.forEach((marker) => {
      // ✅ Convert 3D position to GPS
      let lat = marker.lat;
      let lng = marker.lng;
      
      // ✅ If marker has 3D position, convert it
      if (marker.metadata?.position) {
        const gps = threeDToGPS(
          marker.metadata.position.x || 0,
          marker.metadata.position.z || 0,
          gpsCenter
        );
        lat = gps.lat;
        lng = gps.lng;
      }

      if (!isValidCoordinate(lat, lng)) return;

      hasValidMarkers = true;
      const latLng = L.latLng(lat, lng);
      bounds.extend(latLng);

      // ✅ Get color based on type
      const typeColors: Record<string, string> = {
        plants: '#22c55e',
        beds: '#f59e0b',
        characters: '#8b5cf6',
        markers: '#ec4899',
        layers: '#06b6d4',
        farmbots: '#64748b',
      };
      const color = marker.color || typeColors[marker.type] || '#6b7280';

      const popupContent = `
        <div class="p-2 max-w-xs">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
            <span class="font-medium text-sm">${marker.name}</span>
          </div>
          <p class="text-xs text-gray-500">📦 ${marker.type}</p>
          <p class="text-xs text-gray-500">📍 (${lat.toFixed(4)}, ${lng.toFixed(4)})</p>
          ${marker.metadata?.description ? `<p class="text-xs text-gray-600 mt-1">${marker.metadata.description}</p>` : ''}
          <button class="mt-2 text-xs text-blue-600 hover:underline" data-marker-id="${marker.id}">View Details</button>
        </div>
      `;

      const icon = L.divIcon({
        html: `
          <div class="relative">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white" style="background-color: ${color}">
              ${marker.type === 'plants' ? '🌱' : 
                marker.type === 'beds' ? '🛏️' : 
                marker.type === 'characters' ? '🧑' : 
                marker.type === 'markers' ? '📍' : 
                marker.type === 'layers' ? '📐' : '🤖'}
            </div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const lMarker = L.marker(latLng, { icon })
        .bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        })
        .on('click', () => {
          if (onMarkerClick) {
            onMarkerClick({
              id: marker.id,
              name: marker.name,
              type: marker.type as any,
              position: { x: marker.lat || 0, y: 0, z: marker.lng || 0 },
              color: color,
              size: marker.size,
              metadata: marker.metadata,
            });
          }
        });

      layerGroup.addLayer(lMarker);
    });

    // ✅ Fit bounds to show all markers (with safety check)
    if (hasValidMarkers && bounds.isValid()) {
      map.fitBounds(bounds, { 
        padding: [50, 50], 
        maxZoom: 12 
      });
    } else if (!hasValidMarkers) {
      // ✅ If no valid markers, use default view
      map.setView(center, zoom);
    }

    return () => {
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
        markersLayerRef.current = null;
      }
    };
  }, [incidents, markers, onIncidentClick, onMarkerClick, selectedIncident, selectedMarker, isMapReady, center, zoom, gpsCenter]);

  return <div ref={mapRef} className="w-full" style={{ height }} />;
}