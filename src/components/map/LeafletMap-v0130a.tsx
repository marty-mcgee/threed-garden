// components/map/LeafletMap.tsx

'use client';

import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrafficIncident, RuntimeMarker as ThreeDMarker } from '@/lib/types/map';
import { getTrafficColor, getTrafficLabel } from '@/lib/utils/map-helpers';

// Fix Leaflet icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
  onFocusMarker?: (marker: ThreeDMarker | TrafficIncident) => void;
  selectedIncident?: TrafficIncident | null;
  selectedMarker?: ThreeDMarker | null;
  center?: [number, number];
  zoom?: number;
  height?: string;
  gpsCenter?: { lat: number; lng: number };
}

function threeDToGPS(x: number, z: number, center: { lat: number; lng: number }) {
  return {
    lat: center.lat + (z * 0.001),
    lng: center.lng + (x * 0.001),
  };
}

// Emoji mapping for 3D marker types
const MARKER_EMOJIS: Record<string, string> = {
  plantings: '🌱',
  beds: '🧑‍🌾',
  characters: '🧚',
  farmbots: '🤖',
  plants: '🌿',
  layers: '📐',
  markers: '📍',
};

// Severity emoji mapping for traffic incidents
const SEVERITY_EMOJIS: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

function LeafletMapComponent({
  incidents,
  markers,
  onIncidentClick,
  onMarkerClick,
  onFocusMarker,
  selectedIncident,
  selectedMarker,
  center = [39.514719, -123.760382],
  zoom = 12,
  height = '100%',
  gpsCenter = { lat: 39.514719, lng: -123.760382 },
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const initializedRef = useRef(false);
  const previousSelectedRef = useRef<string | null>(null);

  // Store callbacks in refs to prevent re-renders
  const onIncidentClickRef = useRef(onIncidentClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onFocusMarkerRef = useRef(onFocusMarker);

  useEffect(() => {
    onIncidentClickRef.current = onIncidentClick;
    onMarkerClickRef.current = onMarkerClick;
    onFocusMarkerRef.current = onFocusMarker;
  }, [onIncidentClick, onMarkerClick, onFocusMarker]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      initializedRef.current = false;
      previousSelectedRef.current = null;
    };
  }, []);

  // Handle pan to selected marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const target = selectedMarker || selectedIncident;

    if (!target) {
      previousSelectedRef.current = null;
      return;
    }

    let lat: number | undefined;
    let lng: number | undefined;

    if (selectedMarker) {
      const markerData = markers.find(m => m.id === selectedMarker.id);
      if (markerData) {
        lat = markerData.lat;
        lng = markerData.lng;
        if (markerData.metadata?.position) {
          const gps = threeDToGPS(
            markerData.metadata.position.x || 0,
            markerData.metadata.position.z || 0,
            gpsCenter
          );
          lat = gps.lat;
          lng = gps.lng;
        }
      }
    } else if (selectedIncident) {
      lat = selectedIncident.lat;
      lng = selectedIncident.lng;
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    const currentId = selectedMarker?.id || selectedIncident?.id || null;
    if (currentId !== previousSelectedRef.current) {
      previousSelectedRef.current = currentId;
      const currentZoom = map.getZoom();
      map.setView([lat, lng], currentZoom, { animate: false });
    }
  }, [selectedMarker, selectedIncident, markers, gpsCenter]);

  // Render markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear old markers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    const group = L.layerGroup().addTo(map);
    const bounds = L.latLngBounds();
    let hasMarkers = false;

    const isValid = (lat: number, lng: number) => {
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    };

    // Add incident markers with Focus button
    incidents.forEach((incident) => {
      if (!isValid(incident.lat, incident.lng)) return;
      hasMarkers = true;
      bounds.extend([incident.lat, incident.lng]);

      const color = getTrafficColor(incident.source);
      const severityEmoji = SEVERITY_EMOJIS[incident.severity] || '🟡';
      const isSelected = selectedIncident?.id === incident.id;

      const popupContent = `
        <div class="p-3 max-w-xs">
          <div class="font-medium text-sm">${incident.title}</div>
          <div class="text-xs text-gray-500 mt-1">📍 ${incident.location}</div>
          <div class="text-xs text-gray-500">${getTrafficLabel(incident.source)} • ${new Date(incident.timestamp).toLocaleString()}</div>
          <button 
            class="mt-2 w-full text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors focus-marker-btn"
            data-incident-id="${incident.id}"
            data-lat="${incident.lat}"
            data-lng="${incident.lng}"
          >
            🎯 Focus on this marker
          </button>
        </div>
      `;

      const icon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full ${color} border-2 ${isSelected ? 'border-blue-500 border-4' : 'border-white'} shadow-lg flex items-center justify-center text-white text-sm font-bold">
              ${severityEmoji}
            </div>
            ${isSelected ? `
              <div class="absolute -inset-1 rounded-full border-2 border-blue-500 animate-ping"></div>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      });

      const marker = L.marker([incident.lat, incident.lng], { icon })
        .bindPopup(popupContent, { maxWidth: 300, className: 'custom-popup' })
        .on('click', () => {
          onIncidentClickRef.current?.(incident);
        })
        .addTo(group);

      marker.on('popupopen', () => {
        const container = document.querySelector('.leaflet-popup-content');
        if (!container) return;
        const btn = container.querySelector('.focus-marker-btn');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lat = parseFloat(btn.getAttribute('data-lat') || '0');
            const lng = parseFloat(btn.getAttribute('data-lng') || '0');
            if (onFocusMarkerRef.current && !isNaN(lat) && !isNaN(lng)) {
              const focusMarker: ThreeDMarker = {
                id: incident.id,
                name: incident.title,
                type: 'incident',
                position: { x: lat, y: 0, z: lng },
                color: color,
                size: 'medium',
                metadata: { 
                  ...incident,
                  gps: { lat, lng }
                },
              };
              onFocusMarkerRef.current(focusMarker);
              map.setView([lat, lng], map.getZoom(), { animate: true });
              marker.closePopup();
            }
          });
        }
      });
    });

    // Add 3D markers with Focus button
    markers.forEach((marker) => {
      let lat = marker.lat;
      let lng = marker.lng;
      if (marker.metadata?.position) {
        const gps = threeDToGPS(
          marker.metadata.position.x || 0,
          marker.metadata.position.z || 0,
          gpsCenter
        );
        lat = gps.lat;
        lng = gps.lng;
      }
      if (!isValid(lat, lng)) return;
      hasMarkers = true;
      bounds.extend([lat, lng]);

      const colors: Record<string, string> = {
        plantings: '#22c55e',
        beds: '#f59e0b',
        characters: '#8b5cf6',
        farmbots: '#64748b',
      };
      const color = marker.color || colors[marker.type] || '#6b7280';
      const emoji = MARKER_EMOJIS[marker.type] || '📍';
      const isSelected = selectedMarker?.id === marker.id && selectedMarker?.type === marker.type;

      const popupContent = `
        <div class="p-3 max-w-xs">
          <div class="font-medium text-sm">${marker.name}</div>
          <div class="text-xs text-gray-500 mt-1">📦 ${marker.type}</div>
          <div class="text-xs text-gray-500">📍 (${lat.toFixed(4)}, ${lng.toFixed(4)})</div>
          ${marker.metadata?.description ? `<div class="text-xs text-gray-600 mt-1">${marker.metadata.description}</div>` : ''}
          <button 
            class="mt-2 w-full text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition-colors focus-marker-btn"
            data-marker-id="${marker.id}"
            data-type="${marker.type}"
            data-lat="${lat}"
            data-lng="${lng}"
          >
            🎯 Focus on this marker
          </button>
        </div>
      `;

      const icon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-purple-500 border-4' : 'border-white'} shadow-lg flex items-center justify-center text-sm" style="background-color: ${color}">
              ${emoji}
            </div>
            ${isSelected ? `
              <div class="absolute -inset-1 rounded-full border-2 border-purple-500 animate-ping"></div>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      });

      const lMarker = L.marker([lat, lng], { icon })
        .bindPopup(popupContent, { maxWidth: 300, className: 'custom-popup' })
        .on('click', () => {
          if (onMarkerClickRef.current) {
            onMarkerClickRef.current({
              id: marker.id,
              name: marker.name,
              type: marker.type as any,
              position: { x: lat, y: 0, z: lng },
              color: color,
              size: marker.size || 'medium',
              metadata: marker.metadata || {},
            });
          }
        })
        .addTo(group);

      lMarker.on('popupopen', () => {
        const container = document.querySelector('.leaflet-popup-content');
        if (!container) return;
        const btn = container.querySelector('.focus-marker-btn');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const markerId = btn.getAttribute('data-marker-id') || '';
            const type = btn.getAttribute('data-type') || '';
            const lat = parseFloat(btn.getAttribute('data-lat') || '0');
            const lng = parseFloat(btn.getAttribute('data-lng') || '0');
            if (onFocusMarkerRef.current && !isNaN(lat) && !isNaN(lng)) {
              const focusMarker: ThreeDMarker = {
                id: markerId,
                name: marker.name,
                type: type as any,
                position: { x: lat, y: 0, z: lng },
                color: color,
                size: marker.size || 'medium',
                metadata: { 
                  ...marker.metadata,
                  gps: { lat, lng }
                },
              };
              onFocusMarkerRef.current(focusMarker);
              map.setView([lat, lng], map.getZoom(), { animate: true });
              lMarker.closePopup();
            }
          });
        }
      });
    });

    // Fit bounds on first render only
    if (hasMarkers && bounds.isValid() && !initializedRef.current) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      initializedRef.current = true;
    }
  }, [incidents, markers, gpsCenter, selectedIncident, selectedMarker]);

  return <div ref={mapRef} style={{ height, width: '100%' }} />;
}

export const LeafletMap = memo(LeafletMapComponent);