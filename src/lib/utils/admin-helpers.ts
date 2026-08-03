// lib/utils/admin-helpers.ts

// ✅ Map asset types to their admin page paths
export const ADMIN_PATHS: Record<string, string> = {
  // ThreeD types
  plantings: '/admin/threed/plantings',
  beds: '/admin/threed/beds',
  characters: '/admin/threed/characters',
  farmbots: '/admin/threed/farmbots',
  plants: '/admin/threed/plants',
  models: '/admin/threed/models',
  layers: '/admin/threed/layers',
  tasks: '/admin/threed/tasks',
  harvests: '/admin/threed/harvests',
  weatherLogs: '/admin/threed/weather-logs',
  
  // Traffic types
  incident: '/admin/traffic/chp-cad',
  chpCases: '/admin/traffic/chp-cases',
  caltransClosures: '/admin/traffic/caltrans',
  calfireIncidents: '/admin/traffic/calfire',
  bayArea511: '/admin/traffic/bay-area-511',
};

export function getAdminPath(type: string, id: string | number): string {
  const basePath = ADMIN_PATHS[type] || '/admin';
  return `${basePath}?id=${id}`;
}

// ✅ v0.14.0: Get admin edit URL for a specific asset
export function getAdminEditUrl(type: string, id: string | number): string {
  const basePath = ADMIN_PATHS[type] || '/admin';
  // For list-based admin pages, link with id param
  if (basePath === '/admin' || basePath === '/admin/projects') {
    return `${basePath}/${id}`;
  }
  return `${basePath}?id=${id}`;
}

// ✅ v0.14.0: Get dashboard view URL for a project
export function getDashboardViewUrl(projectId: string | number): string {
  return `/dashboard/map?projectId=${projectId}`;
}

// ✅ Get display labels for asset types
export const TYPE_LABELS: Record<string, string> = {
  plantings: 'Planting',
  beds: 'Bed',
  characters: 'Character',
  farmbots: 'FarmBot',
  plants: 'Plant',
  models: '3D Model',
  layers: 'Layer',
  tasks: 'Task',
  harvests: 'Harvest',
  weatherLogs: 'Weather Log',
  incident: 'Traffic Incident',
  chpCases: 'CHP Case',
  caltransClosures: 'Caltrans Closure',
  calfireIncidents: 'CalFire Incident',
  bayArea511: 'Bay Area 511 Event',
};