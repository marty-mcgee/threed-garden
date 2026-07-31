// lib/services/map/MapDataService.ts
import { UnifiedMapData, TrafficIncident, ThreeDMarker } from '@/lib/types/map';

// ============================================
// Main data fetching function with project context
// ============================================
export async function fetchUnifiedMapData(
  projectId: string | number,
  options?: {
    includeInactive?: boolean;
    limit?: number;
  }
): Promise<UnifiedMapData> {
  const { includeInactive = false, limit = 100 } = options || {};
  
  try {
    const [trafficData, threedData] = await Promise.all([
      fetchTrafficMapData(projectId, { includeInactive, limit }),
      fetchThreeDMapData(projectId, { includeInactive, limit }),
    ]);

    return {
      traffic: trafficData,
      threed: threedData,
    };
  } catch (error) {
    console.error('Error fetching unified map data:', error);
    return getFallbackData();
  }
}

// ============================================
// Fetch traffic data for a specific project
// ============================================
export async function fetchTrafficMapData(
  projectId: string | number,
  options?: {
    includeInactive?: boolean;
    limit?: number;
  }
) {
  const { includeInactive = false, limit = 100 } = options || {};
  
  try {
    const params = new URLSearchParams({
      projectId: String(projectId),
      includeInactive: String(includeInactive),
      limit: String(limit),
    });

    const response = await fetch(`/api/map/traffic?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch traffic data: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch traffic data');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching traffic map data:', error);
    return getTrafficFallback();
  }
}

// ============================================
// Fetch ThreeD data for a specific project
// ============================================
export async function fetchThreeDMapData(
  projectId: string | number,
  options?: {
    includeInactive?: boolean;
    limit?: number;
  }
) {
  const { includeInactive = false, limit = 100 } = options || {};
  
  try {
    const params = new URLSearchParams({
      projectId: String(projectId),
      includeInactive: String(includeInactive),
      limit: String(limit),
    });

    const response = await fetch(`/api/map/threed?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ThreeD data: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch ThreeD data');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching ThreeD map data:', error);
    return getThreeDFallback();
  }
}

// ============================================
// Get available projects for map view
// ============================================
export async function fetchMapProjects(options?: {
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { includeInactive = false, limit = 50, offset = 0 } = options || {};
  
  try {
    const params = new URLSearchParams({
      includeInactive: String(includeInactive),
      limit: String(limit),
      offset: String(offset),
    });

    const response = await fetch(`/api/map/projects?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch projects');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching map projects:', error);
    return [];
  }
}

// ============================================
// Check if a project has map data
// ============================================
export async function projectHasMapData(projectId: string | number): Promise<{
  hasTraffic: boolean;
  hasThreeD: boolean;
  totalAssets: number;
}> {
  try {
    const params = new URLSearchParams({
      projectId: String(projectId),
    });

    const response = await fetch(`/api/map/check?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to check project data: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to check project data');
    }

    return result.data;
  } catch (error) {
    console.error('Error checking project data:', error);
    return { hasTraffic: false, hasThreeD: false, totalAssets: 0 };
  }
}

// ============================================
// Get map data for a specific asset type
// ============================================
export async function fetchAssetTypeData(
  projectId: string | number,
  assetType: string,
  options?: {
    includeInactive?: boolean;
    limit?: number;
  }
) {
  const { includeInactive = false, limit = 100 } = options || {};
  
  try {
    const params = new URLSearchParams({
      projectId: String(projectId),
      assetType: assetType,
      includeInactive: String(includeInactive),
      limit: String(limit),
    });

    const response = await fetch(`/api/map/asset-type?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch asset data: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch asset data');
    }

    return result.data;
  } catch (error) {
    console.error(`Error fetching ${assetType} data:`, error);
    return null;
  }
}

// ============================================
// Fallback data
// ============================================
function getFallbackData(): UnifiedMapData {
  return {
    traffic: getTrafficFallback(),
    threed: getThreeDFallback(),
  };
}

function getTrafficFallback() {
  return {
    total: 0,
    chpCadCount: 0,
    chpCasesCount: 0,
    chpCentersCount: 0,
    caltransClosuresCount: 0,
    caltransCctvCount: 0,
    caltransDistrictsCount: 0,
    bayArea511Count: 0,
    calfireIncidentsCount: 0,
    incidents: [],
  };
}

function getThreeDFallback() {
  return {
    total: 0,
    plantsCount: 0,
    plantingsCount: 0,
    bedsCount: 0,
    charactersCount: 0,
    markersCount: 0,
    layersCount: 0,
    farmbotsCount: 0,
    markers: [],
  };
}

// ============================================
// Cache helpers
// ============================================
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export function clearMapCache(projectId?: string | number) {
  if (projectId) {
    const key = `project_${projectId}`;
    cache.delete(key);
  } else {
    cache.clear();
  }
}

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function fetchUnifiedMapDataWithCache(
  projectId: string | number,
  options?: {
    includeInactive?: boolean;
    limit?: number;
    forceRefresh?: boolean;
  }
): Promise<UnifiedMapData> {
  const { forceRefresh = false, ...fetchOptions } = options || {};
  const cacheKey = `project_${projectId}_${JSON.stringify(fetchOptions)}`;
  
  if (!forceRefresh) {
    const cached = getCachedData<UnifiedMapData>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  const data = await fetchUnifiedMapData(projectId, fetchOptions);
  setCachedData(cacheKey, data);
  return data;
}