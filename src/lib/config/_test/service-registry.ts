// lib/config/service-registry.ts
import { ModuleName, getFeatureFlags } from './settings';

export interface ServiceRegistry {
  id: string;
  module: ModuleName;
  name: string;
  description: string;
  enabled: boolean;
  dependencies?: string[];
}

export function getServiceRegistry(): ServiceRegistry[] {
  const flags = getFeatureFlags();
  
  return [
    // Traffic services
    {
      id: 'chpCad',
      module: 'traffic',
      name: 'CHP CAD',
      description: 'Live California Highway Patrol incidents',
      enabled: flags.modules.traffic.enabled && flags.modules.traffic.services.chpCad,
    },
    {
      id: 'chpHistorical',
      module: 'traffic',
      name: 'CHP Historical',
      description: 'Historical collision data from CKAN',
      enabled: flags.modules.traffic.enabled && flags.modules.traffic.services.chpHistorical,
    },
    {
      id: 'caltrans',
      module: 'traffic',
      name: 'Caltrans',
      description: 'Real-time lane closures from CWWP2',
      enabled: flags.modules.traffic.enabled && flags.modules.traffic.services.caltrans,
    },
    {
      id: 'bayArea511',
      module: 'traffic',
      name: 'Bay Area 511',
      description: 'Traffic events from 511.org',
      enabled: flags.modules.traffic.enabled && flags.modules.traffic.services.bayArea511,
    },
    {
      id: 'calfire',
      module: 'traffic',
      name: 'CalFire',
      description: 'Wildfire incidents from CalFire API',
      enabled: flags.modules.traffic.enabled && flags.modules.traffic.services.calfire,
    },
    {
      id: 'cctv',
      module: 'traffic',
      name: 'CCTV',
      description: 'Traffic cameras from Caltrans',
      enabled: flags.modules.traffic.enabled && flags.modules.traffic.services.cctv,
    },
    
    // ThreeD services
    {
      id: 'weather',
      module: 'threed',
      name: 'Weather',
      description: 'Weather data from OpenWeatherMap',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.weather,
    },
    {
      id: 'farmbot',
      module: 'threed',
      name: 'FarmBot',
      description: 'FarmBot device integration',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.farmbot,
    },
    {
      id: 'plants',
      module: 'threed',
      name: 'Plants',
      description: 'Plant database management',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.plants,
    },
    {
      id: 'beds',
      module: 'threed',
      name: 'Garden Beds',
      description: 'Garden bed management',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.beds,
    },
    {
      id: 'plantings',
      module: 'threed',
      name: 'Plantings',
      description: 'Track plants in garden beds',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.plantings,
    },
    {
      id: 'tasks',
      module: 'threed',
      name: 'Tasks',
      description: 'Garden task management',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.tasks,
    },
    {
      id: 'harvests',
      module: 'threed',
      name: 'Harvests',
      description: 'Yield tracking and analytics',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.harvests,
    },
    {
      id: 'characters',
      module: 'threed',
      name: 'Characters',
      description: '3D characters with animations',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.characters,
    },
    {
      id: 'models',
      module: 'threed',
      name: '3D Models',
      description: '3D asset management',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.models,
    },
    {
      id: 'analytics',
      module: 'threed',
      name: 'Analytics',
      description: 'Garden performance analytics',
      enabled: flags.modules.threed.enabled && flags.modules.threed.services.analytics,
    },
    
    // Music services
    {
      id: 'albums',
      module: 'music',
      name: 'Albums',
      description: 'Album metadata management',
      enabled: flags.modules.music.enabled && flags.modules.music.services.albums,
    },
    {
      id: 'tracks',
      module: 'music',
      name: 'Tracks',
      description: 'Track metadata management',
      enabled: flags.modules.music.enabled && flags.modules.music.services.tracks,
    },
    {
      id: 'links',
      module: 'music',
      name: 'Links',
      description: 'External link management',
      enabled: flags.modules.music.enabled && flags.modules.music.services.links,
    },
    {
      id: 'media',
      module: 'music',
      name: 'Media Gallery',
      description: 'Album image management',
      enabled: flags.modules.music.enabled && flags.modules.music.services.media,
    },
    {
      id: 'streaming',
      module: 'music',
      name: 'Streaming',
      description: 'Audio streaming from S3',
      enabled: flags.modules.music.enabled && flags.modules.music.services.streaming,
    },
  ];
}

/**
 * Get enabled services for a specific module
 */
export function getEnabledServicesForModule(module: ModuleName): ServiceRegistry[] {
  return getServiceRegistry().filter(
    service => service.module === module && service.enabled
  );
}

/**
 * Get all enabled services
 */
export function getAllEnabledServices(): ServiceRegistry[] {
  return getServiceRegistry().filter(service => service.enabled);
}