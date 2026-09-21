// lib/utils/map-helpers.ts

/**
 * Get the icon emoji for a traffic layer
 */
export function getTrafficIcon(id: string): string {
  const icons: Record<string, string> = {
    chpCad: '🚨',
    chpCases: '📋',
    chpCenters: '🏢',
    caltransClosures: '🚧',
    caltransCctv: '📹',
    caltransDistricts: '🏛️',
    bayArea511: '📻',
    calfireIncidents: '🔥',
  };
  return icons[id] || '📍';
}

/**
 * Get the display label for a traffic layer
 */
export function getTrafficLabel(id: string): string {
  const labels: Record<string, string> = {
    chpCad: 'CHP CAD',
    chpCases: 'CHP Cases',
    chpCenters: 'CHP Centers',
    caltransClosures: 'Closures',
    caltransCctv: 'CCTV',
    caltransDistricts: 'Districts',
    bayArea511: '511',
    calfireIncidents: 'CalFire',
  };
  return labels[id] || id;
}

/**
 * Get the icon emoji for a ThreeD layer
 */
export function getThreeDIcon(id: string): string {
  const icons: Record<string, string> = {
    plants: '🌱',
    beds: '🛏️',
    characters: '🧑‍🌾',
    markers: '📍',
    layers: '📐',
    farmbots: '🤖',
  };
  return icons[id] || '📦';
}

/**
 * Get the display label for a ThreeD layer
 */
export function getThreeDLabel(id: string): string {
  const labels: Record<string, string> = {
    plants: 'Plants',
    beds: 'Beds',
    characters: 'Characters',
    markers: 'Markers',
    layers: 'Layers',
    farmbots: 'FarmBots',
  };
  return labels[id] || id;
}

/**
 * Get the color for a traffic layer (for badges, markers, etc.)
 */
export function getTrafficColor(id: string): string {
  const colors: Record<string, string> = {
    chpCad: 'bg-red-500',
    chpCases: 'bg-orange-500',
    chpCenters: 'bg-yellow-500',
    caltransClosures: 'bg-blue-500',
    caltransCctv: 'bg-cyan-500',
    caltransDistricts: 'bg-indigo-500',
    bayArea511: 'bg-emerald-500',
    calfireIncidents: 'bg-rose-500',
  };
  return colors[id] || 'bg-gray-500';
}

/**
 * Get the color for a ThreeD layer (for badges, markers, etc.)
 */
export function getThreeDColor(id: string): string {
  const colors: Record<string, string> = {
    plants: 'bg-green-500',
    beds: 'bg-amber-500',
    characters: 'bg-purple-500',
    markers: 'bg-pink-500',
    layers: 'bg-cyan-500',
    farmbots: 'bg-slate-500',
  };
  return colors[id] || 'bg-gray-500';
}

/**
 * Get the full color class with text color for a traffic layer
 */
export function getTrafficColorClass(id: string): string {
  const colorMap: Record<string, string> = {
    chpCad: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    chpCases: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
    chpCenters: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
    caltransClosures: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    caltransCctv: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
    caltransDistricts: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
    bayArea511: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    calfireIncidents: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  };
  return colorMap[id] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

/**
 * Get the full color class with text color for a ThreeD layer
 */
export function getThreeDColorClass(id: string): string {
  const colorMap: Record<string, string> = {
    plants: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    beds: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    characters: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
    markers: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
    layers: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
    farmbots: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return colorMap[id] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

/**
 * Get the sort order for traffic layers (for consistent display)
 */
export function getTrafficSortOrder(id: string): number {
  const order: Record<string, number> = {
    chpCad: 1,
    chpCases: 2,
    chpCenters: 3,
    caltransClosures: 4,
    caltransCctv: 5,
    caltransDistricts: 6,
    bayArea511: 7,
    calfireIncidents: 8,
  };
  return order[id] || 99;
}

/**
 * Get the sort order for ThreeD layers (for consistent display)
 */
export function getThreeDSortOrder(id: string): number {
  const order: Record<string, number> = {
    plants: 1,
    beds: 2,
    characters: 3,
    markers: 4,
    layers: 5,
    farmbots: 6,
  };
  return order[id] || 99;
}

/**
 * Get all traffic layer keys in sorted order
 */
export function getSortedTrafficLayers(): string[] {
  return Object.keys(getTrafficIcon).sort((a, b) => getTrafficSortOrder(a) - getTrafficSortOrder(b));
}

/**
 * Get all ThreeD layer keys in sorted order
 */
export function getSortedThreeDLayers(): string[] {
  return Object.keys(getThreeDIcon).sort((a, b) => getThreeDSortOrder(a) - getThreeDSortOrder(b));
}

// ============================================
// v0.13.0-beta: Admin URL & Popup Helpers
// ============================================

/**
 * Get admin URL for a specific asset type and ID
 */
export function getAdminUrl(type: string, id: number | string): string {
  const base = '/admin';
  const routes: Record<string, string> = {
    plantings: `${base}/threed/plantings`,
    planting: `${base}/threed/plantings`,
    plants: `${base}/threed/plants`,
    beds: `${base}/threed/beds`,
    bed: `${base}/threed/beds`,
    characters: `${base}/threed/characters`,
    character: `${base}/threed/characters`,
    farmbots: `${base}/threed/farmbots`,
    farmbot: `${base}/threed/farmbots`,
    chpCad: `${base}/traffic/chp-cad`,
    chpCadIncidents: `${base}/traffic/chp-cad`,
    chpCases: `${base}/traffic/chp-cases`,
    chpCenters: `${base}/traffic/chp-centers`,
    caltransLaneClosures: `${base}/traffic/caltrans`,
    caltransClosures: `${base}/traffic/caltrans`,
    caltransCctv: `${base}/traffic/caltrans-cctv`,
    caltransCctvCameras: `${base}/traffic/caltrans-cctv`,
    caltransDistricts: `${base}/traffic/caltrans-districts`,
    bayArea511: `${base}/traffic/bay-area-511`,
    bayArea511Events: `${base}/traffic/bay-area-511`,
    calfireIncidents: `${base}/traffic/calfire`,
    calfire: `${base}/traffic/calfire`,
  };
  const route = routes[type] || routes[type + 's'] || `${base}`;
  return `${route}?id=${id}`;
}

/**
 * Get a human-readable label for a marker type
 */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    planting: 'Planting',
    plantings: 'Planting',
    bed: 'Garden Bed',
    beds: 'Garden Bed',
    character: 'Character',
    characters: 'Character',
    farmbot: 'FarmBot',
    farmbots: 'FarmBot',
    incident: 'Traffic Incident',
    chpCad: 'CHP CAD Incident',
    chpCases: 'CHP Case',
    chpCenters: 'CHP Center',
    caltransClosures: 'Caltrans Closure',
    caltransCctv: 'CCTV Camera',
    caltransDistricts: 'Caltrans District',
    bayArea511: '511 Event',
    calfireIncidents: 'CalFire Incident',
  };
  return labels[type] || type;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
}

/**
 * Build a rich HTML popup for a 3D/map marker with admin link
 */
export function buildRichPopupHTML(params: {
  name: string;
  type: string;
  id: number | string;
  lat: number;
  lng: number;
  details?: Record<string, string>;
  metadata?: any;
}): string {
  const { name, type, id, lat, lng, details } = params;
  const adminUrl = getAdminUrl(type, id);
  const typeLabel = getTypeLabel(type);
  
  let detailsRows = '';
  if (details) {
    detailsRows = Object.entries(details)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
        return `<div class="text-[11px] text-gray-600 dark:text-gray-400"><span class="font-medium text-gray-700 dark:text-gray-300">${label}:</span> ${escapeHtml(String(value))}</div>`;
      })
      .join('');
  }

  return `
    <div class="p-3 max-w-xs font-sans">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded">${typeLabel}</span>
        <span class="text-[10px] text-gray-400">ID: ${id}</span>
      </div>
      <div class="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">${escapeHtml(name)}</div>
      <div class="text-[11px] text-gray-500 mb-1">📍 (${lat.toFixed(4)}, ${lng.toFixed(4)})</div>
      ${detailsRows ? `<div class="mt-2 space-y-0.5 border-t pt-2 border-gray-200 dark:border-gray-700">${detailsRows}</div>` : ''}
      <div class="mt-3 flex gap-2">
        <button class="flex-1 text-[11px] bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors focus-marker-btn"
          data-marker-id="${id}" data-type="${type}" data-lat="${lat}" data-lng="${lng}">
          🎯 Focus
        </button>
        <a href="${adminUrl}" target="_blank" class="flex-1 text-center text-[11px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors no-underline inline-block">
          📝 View Details
        </a>
      </div>
    </div>`;
}

/**
 * Build a rich popup for a traffic incident with admin link
 */
export function buildTrafficPopupHTML(incident: {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  source: string;
  timestamp: string;
  severity?: string;
  status?: string;
}): string {
  const adminUrl = getAdminUrl(incident.source, incident.id);
  const sourceLabel = getTrafficLabel(incident.source);
  const severityEmoji = incident.severity === 'critical' ? '🔴' : 
    incident.severity === 'high' ? '🟠' : 
    incident.severity === 'medium' ? '🟡' : 
    incident.severity === 'low' ? '🟢' : '';
  const timeStr = new Date(incident.timestamp).toLocaleString();
  
  return `
    <div class="p-3 max-w-xs font-sans">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-1.5 py-0.5 rounded">${sourceLabel}</span>
        ${incident.severity ? `<span class="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">${severityEmoji} ${incident.severity}</span>` : ''}
      </div>
      <div class="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">${escapeHtml(incident.title)}</div>
      <div class="text-[11px] text-gray-500 mb-1">📍 ${escapeHtml(incident.location)}</div>
      <div class="text-[10px] text-gray-400">🕐 ${timeStr}</div>
      ${incident.status ? `<div class="text-[11px] text-gray-600 mt-1"><span class="font-medium">Status:</span> ${incident.status}</div>` : ''}
      <div class="mt-3 flex gap-2">
        <button class="flex-1 text-[11px] bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors focus-marker-btn"
          data-incident-id="${incident.id}" data-lat="${incident.lat}" data-lng="${incident.lng}">
          🎯 Focus
        </button>
        <a href="${adminUrl}" target="_blank" class="flex-1 text-center text-[11px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors no-underline inline-block">
          📝 View Details
        </a>
      </div>
    </div>`;
}