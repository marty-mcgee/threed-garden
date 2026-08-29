// components/map/LeafletMap-v0130b.tsx - v0.13.0-beta "Smart Dashboard"

'use client';

import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrafficIncident, RuntimeMarker as ThreeDMarker } from '@/lib/types/map';
import type { ProjectMapViewState } from '@/lib/services/threed/markers/project-view-state-core';
import { 
  getTrafficColor, 
  getTrafficLabel,
  getAdminUrl,
  getTypeLabel,
} from '@/lib/utils/map-helpers';

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
  /** Enables one pending Project Model placement on the map surface. */
  placementActive?: boolean;
  /** Reports the geographic point selected for the pending placement. */
  onPlacement?: (position: { lat: number; lng: number }) => void;
  /** Persists a dragged Project Model marker at its new map position. */
  onModelMove?: (
    instanceId: number,
    position: { lat: number; lng: number },
  ) => Promise<boolean>;
  initialViewState?: ProjectMapViewState;
  onViewStateProviderChange?: (provider: (() => ProjectMapViewState) | null) => void;
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

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
}

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
  placementActive = false,
  onPlacement,
  onModelMove,
  initialViewState,
  onViewStateProviderChange,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const initializedRef = useRef(false);
  const previousSelectedRef = useRef<string | null>(null);
  const restoredViewKeyRef = useRef<string | null>(null);

  // Store callbacks in refs to prevent re-renders
  const onIncidentClickRef = useRef(onIncidentClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onFocusMarkerRef = useRef(onFocusMarker);
  const placementActiveRef = useRef(placementActive);
  const onPlacementRef = useRef(onPlacement);
  const onModelMoveRef = useRef(onModelMove);

  useEffect(() => {
    onIncidentClickRef.current = onIncidentClick;
    onMarkerClickRef.current = onMarkerClick;
    onFocusMarkerRef.current = onFocusMarker;
    placementActiveRef.current = placementActive;
    onPlacementRef.current = onPlacement;
    onModelMoveRef.current = onModelMove;
  }, [onIncidentClick, onMarkerClick, onFocusMarker, onModelMove, onPlacement, placementActive]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      maxZoom: 22,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxNativeZoom: 19,
      maxZoom: 22,
    }).addTo(map);

    mapInstanceRef.current = map;
    map.on('click', (event) => {
      if (!placementActiveRef.current) return;
      onPlacementRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      initializedRef.current = false;
      previousSelectedRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!onViewStateProviderChange) return;
    onViewStateProviderChange(() => {
      const map = mapInstanceRef.current;
      const currentCenter = map?.getCenter();
      return {
        center: {
          lat: currentCenter?.lat ?? center[0],
          lng: currentCenter?.lng ?? center[1],
        },
        zoom: map?.getZoom() ?? zoom,
      };
    });
    return () => onViewStateProviderChange(null);
  }, [center, onViewStateProviderChange, zoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !initialViewState) return;
    const key = `${initialViewState.center.lat}:${initialViewState.center.lng}:${initialViewState.zoom}`;
    if (restoredViewKeyRef.current === key) return;
    restoredViewKeyRef.current = key;
    map.setView(
      [initialViewState.center.lat, initialViewState.center.lng],
      initialViewState.zoom,
      { animate: false },
    );
  }, [initialViewState]);

  useEffect(() => {
    const container = mapInstanceRef.current?.getContainer();
    if (!container) return;
    container.style.cursor = placementActive ? 'crosshair' : '';
    return () => {
      container.style.cursor = '';
    };
  }, [placementActive]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = map?.getContainer();
    if (!map || !container || !placementActive) return;

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };
    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const bounds = container.getBoundingClientRect();
      const point = L.point(event.clientX - bounds.left, event.clientY - bounds.top);
      const latLng = map.containerPointToLatLng(point);
      onPlacementRef.current?.({ lat: latLng.lat, lng: latLng.lng });
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [placementActive]);

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
        // ✅ Coordinates are already converted to GPS by UnifiedMapView
        lat = markerData.lat;
        lng = markerData.lng;
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
    const bounds = L.latLngBounds([] as any);
    let hasMarkers = false;

    const isValid = (lat: number, lng: number) => {
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    };

    // ✅ v0.13.0-beta: Enhanced incident markers with rich popups & admin links
    incidents.forEach((incident) => {
      if (!isValid(incident.lat, incident.lng)) return;
      hasMarkers = true;
      bounds.extend([incident.lat, incident.lng]);

      const color = getTrafficColor(incident.source);
      const sevStr: string = incident.severity || 'medium';
      const severityEmoji = SEVERITY_EMOJIS[sevStr] || '🟡';
      const isSelected = (selectedIncident as any)?.key === (incident as any).key;
      const sourceLabel = getTrafficLabel(incident.source);
      const adminUrl = getAdminUrl(incident.source, incident.id);
      const timeStr = new Date(incident.timestamp).toLocaleString();

      // ✅ Rich popup with type badge, details, focus button, and View Details link
      const popupContent = `
        <div class="p-3 max-w-xs font-sans">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-1.5 py-0.5 rounded">${sourceLabel}</span>
            ${incident.severity ? `<span class="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">${severityEmoji} ${incident.severity}</span>` : ''}
            <span class="text-[10px] text-gray-400">ID: ${incident.id}</span>
          </div>
          <div class="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">${escapeHtml(incident.title)}</div>
          <div class="text-[11px] text-gray-500 mb-1">📍 ${escapeHtml(incident.location)}</div>
          <div class="text-[10px] text-gray-400">🕐 ${timeStr}</div>
          ${incident.status ? `<div class="text-[11px] text-gray-600 mt-1 border-t pt-1.5 border-gray-200 dark:border-gray-700"><span class="font-medium">Status:</span> ${escapeHtml(incident.status)}</div>` : ''}
          ${incident.description ? `<div class="text-[11px] text-gray-500 mt-1">${escapeHtml(incident.description?.slice(0, 80))}${incident.description?.length > 80 ? '...' : ''}</div>` : ''}
          <div class="mt-3 flex gap-2">
            <button class="flex-1 text-[11px] bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors focus-marker-btn"
              data-incident-id="${incident.id}" data-lat="${incident.lat}" data-lng="${incident.lng}">
              🎯 Focus
            </button>
            <a href="${adminUrl}" target="_blank" class="flex-1 text-center text-[11px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors no-underline inline-block">
              📝 View Details
            </a>
          </div>
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
        .bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' })
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
              const focusMarker = {
                id: incident.id,
                name: incident.title,
                type: 'incident',
                position: { x: lat, y: 0, z: lng },
                color: color,
                icon: '📍',
                label: incident.title,
                isVisible: true,
                isActive: true,
                data: incident,
                size: 'medium',
                metadata: { 
                  ...incident,
                  gps: { lat, lng },
                  source: 'sub-module' as const,
                  generatedAt: new Date().toISOString(),
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

    // ✅ v0.13.0-beta: Enhanced 3D markers with rich popups & admin links
    markers.forEach((marker) => {
      let lat = marker.lat;
      let lng = marker.lng;
      let actualId = marker.metadata?.data?.id || marker.id;
      // For compound IDs like "planting-123", extract the numeric part
      if (typeof actualId === 'string' && actualId.includes('-')) {
        actualId = actualId.split('-').pop() || actualId;
      }
      
      // ✅ Coordinates are already converted to GPS by UnifiedMapView — use them directly
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
      const typeLabel = getTypeLabel(marker.type);
      const adminUrl = getAdminUrl(marker.type, actualId);

      // Build detail rows from marker data
      const data = marker.metadata?.data || {};
      const modelInstanceId = Number(data.instanceId ?? data.projectMarkerId);
      const modelCanMove = marker.type === 'models'
        && Number.isSafeInteger(modelInstanceId)
        && modelInstanceId > 0
        && Boolean(onModelMoveRef.current);
      let detailsHtml = '';
      const detailFields: Record<string, string[]> = {
        planting: ['growthStage', 'health', 'plantedDate', 'notes'],
        bed: ['width', 'length', 'depth', 'soilType'],
        character: ['species', 'animationState', 'notes'],
        farmbot: ['status', 'lastSeen', 'notes'],
        plantings: ['growthStage', 'health', 'plantedDate', 'notes'],
        beds: ['width', 'length', 'depth', 'soilType'],
        characters: ['species', 'animationState', 'notes'],
        farmbots: ['status', 'lastSeen', 'notes'],
      };
      const fields = detailFields[marker.type] || ['notes', 'status'];
      const detailItems: string[] = [];
      fields.forEach((field) => {
        const value = data[field];
        if (value !== undefined && value !== null && value !== '') {
          const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase());
          detailItems.push(`<div class="text-[11px] text-gray-600 dark:text-gray-400"><span class="font-medium text-gray-700 dark:text-gray-300">${label}:</span> ${escapeHtml(String(value))}</div>`);
        }
      });
      if (detailItems.length > 0) {
        detailsHtml = `<div class="mt-2 space-y-0.5 border-t pt-2 border-gray-200 dark:border-gray-700">${detailItems.join('')}</div>`;
      }

      // ✅ Rich popup with type badge, details, focus, and View Details
      const popupContent = `
        <div class="p-3 max-w-xs font-sans">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded">${typeLabel}</span>
            <span class="text-[10px] text-gray-400">ID: ${actualId}</span>
          </div>
          <div class="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">${escapeHtml(marker.name)}</div>
          <div class="text-[11px] text-gray-500 mb-1">📍 (${lat.toFixed(4)}, ${lng.toFixed(4)})</div>
          ${detailsHtml}
          <div class="mt-3 flex gap-2">
            <button class="flex-1 text-[11px] bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors focus-marker-btn"
              data-marker-id="${marker.id}" data-type="${marker.type}" data-lat="${lat}" data-lng="${lng}">
              🎯 Focus
            </button>
            <a href="${adminUrl}" target="_blank" class="flex-1 text-center text-[11px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors no-underline inline-block">
              📝 View Details
            </a>
          </div>
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

      const lMarker = L.marker([lat, lng], { icon, draggable: modelCanMove })
        .bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' })
        .on('click', () => {
          if (onMarkerClickRef.current) {
            const localPosition = marker.metadata?.position;
            if (
              !localPosition
              || !Number.isFinite(Number(localPosition.x))
              || !Number.isFinite(Number(localPosition.y))
              || !Number.isFinite(Number(localPosition.z))
            ) return;
            const markerData = marker.metadata?.data || marker;
            const geographicPosition = marker.metadata?.geographicPosition;
            const rawAltitude = geographicPosition?.altitude ?? markerData?.altitude;
            onMarkerClickRef.current({
              id: marker.id,
              name: marker.name,
              type: marker.type as any,
              position: {
                x: Number(localPosition.x),
                y: Number(localPosition.y),
                z: Number(localPosition.z),
              },
              color: color,
              icon: emoji,
              label: marker.name,
              isVisible: true,
              isActive: true,
              data: markerData,
              size: marker.size || 'medium',
              metadata: {
                ...(marker.metadata || {}),
                geographicPosition: {
                  latitude: geographicPosition?.latitude ?? lat,
                  longitude: geographicPosition?.longitude ?? lng,
                  altitude: rawAltitude === null || rawAltitude === undefined
                    ? null
                    : Number(rawAltitude),
                },
              },
            });
          }
        })
        .addTo(group);

      if (modelCanMove) {
        lMarker.on('dragend', async () => {
          const next = lMarker.getLatLng();
          lMarker.dragging?.disable();
          const saved = await onModelMoveRef.current?.(modelInstanceId, {
            lat: next.lat,
            lng: next.lng,
          });
          if (!saved) lMarker.setLatLng([lat, lng]);
          lMarker.dragging?.enable();
        });
      }

      lMarker.on('popupopen', () => {
        const container = document.querySelector('.leaflet-popup-content');
        if (!container) return;
        const btn = container.querySelector('.focus-marker-btn');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const markerId = btn.getAttribute('data-marker-id') || '';
            const type = btn.getAttribute('data-type') || '';
            const latVal = parseFloat(btn.getAttribute('data-lat') || '0');
            const lngVal = parseFloat(btn.getAttribute('data-lng') || '0');
            if (onFocusMarkerRef.current && !isNaN(latVal) && !isNaN(lngVal)) {
              const focusMarker = {
                id: markerId,
                name: marker.name,
                type: type as any,
                position: { x: latVal, y: 0, z: lngVal },
                color: color,
                icon: emoji,
                label: marker.name,
                isVisible: true,
                isActive: true,
                data: marker.metadata?.data || marker,
                size: marker.size || 'medium',
                metadata: { 
                  ...marker.metadata,
                  gps: { lat: latVal, lng: lngVal },
                  source: 'sub-module' as const,
                  generatedAt: new Date().toISOString(),
                },
              };
              onFocusMarkerRef.current(focusMarker);
              map.setView([latVal, lngVal], map.getZoom(), { animate: true });
              lMarker.closePopup();
            }
          });
        }
      });
    });

    // Fit bounds on first render only
    if (hasMarkers && bounds.isValid() && !initializedRef.current && !initialViewState) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      initializedRef.current = true;
    } else if (initialViewState) {
      initializedRef.current = true;
    }
  // ✅ v0.15.2: Don't include selectedIncident/selectedMarker in deps —
  // selection highlighting is cosmetic and redraw-on-select causes popup/open close loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents, markers, gpsCenter, initialViewState]);

  return <div ref={mapRef} style={{ height, width: '100%' }} />;
}

export const LeafletMap = memo(LeafletMapComponent);
