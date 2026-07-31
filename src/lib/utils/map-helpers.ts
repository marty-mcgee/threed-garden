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