// ============================================
// CONSTANTS
// ============================================

export const SOURCE_COLORS: Record<string, string> = {
  caltrans: '#3b82f6',
  bayarea511: '#10b981',
  chpLive: '#ef4444',
  chpHistorical: '#8b5cf6',
  calfire: '#f97316',
  default: '#6b7280',
};

export const SOURCE_ICONS: Record<string, string> = {
  caltrans: '🚧',
  bayarea511: '📻',
  chpLive: '🚨',
  chpHistorical: '📊',
  calfire: '🔥',
  default: '📍',
};

export const SEVERITY_SCALE: Record<string, number> = {
  critical: 1.6,
  fatal: 1.6,
  injury: 1.3,
  high: 1.3,
  medium: 1.0,
  low: 0.8,
  default: 1.0,
};


export const GROWTH_STAGE_COLORS: Record<string, string> = {
  seed: '#8B4513',
  seedling: '#90EE90',
  vegetative: '#32CD32',
  flowering: '#FF69B4',
  fruiting: '#FF8C00',
  mature: '#006400',
};

export const GROWTH_STAGE_HEIGHTS: Record<string, number> = {
  seed: 0.1,
  seedling: 0.3,
  vegetative: 0.6,
  flowering: 0.8,
  fruiting: 1.0,
  mature: 1.2,
};

export function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || SOURCE_COLORS.default;
}

export function getSourceIcon(source: string): string {
  return SOURCE_ICONS[source] || SOURCE_ICONS.default;
}

export function getGrowthStageColor(stage: string): string {
  return GROWTH_STAGE_COLORS[stage] || GROWTH_STAGE_COLORS.seed;
}

export function getGrowthStageHeight(stage: string): number {
  return GROWTH_STAGE_HEIGHTS[stage] || GROWTH_STAGE_HEIGHTS.seed;
}

// components/threed/shared/coordinates.ts
export function latLngToPosition(
  lat: number,
  lng: number,
  centerLat: number = 37.3,
  centerLng: number = -119.5
): [number, number, number] {
  const scale = 2.5;
  return [(lng - centerLng) * scale, 0, (centerLat - lat) * scale];
}