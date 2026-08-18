import 'server-only';

import {
  musicAlbums,
  musicLinks,
  musicMedia,
  musicTracks,
} from '@/lib/schema/music';
import {
  threedBeds,
  threedCharacters,
  threedFarmbots,
  threedHarvests,
  threedLayers,
  threedModels,
  threedPlantings,
  threedPlants,
  threedTasks,
  threedWateringSchedules,
} from '@/lib/schema/threed';
import {
  trafficBayArea511Events,
  trafficCalfireIncidents,
  trafficCaltransCctvCameras,
  trafficCaltransDistricts,
  trafficCaltransLaneClosures,
  trafficChpCadIncidents,
  trafficChpCases,
  trafficChpCenters,
} from '@/lib/schema/traffic';

export type ProjectModuleType = 'music' | 'threed' | 'traffic';

interface AssignableAssetDefinitionBase {
  moduleType: ProjectModuleType;
  table: any;
  idColumn: any;
  userIdColumn: any;
}

export type AssignableAssetDefinition = AssignableAssetDefinitionBase & (
  | { policy: 'ownerOnly' }
  | {
      policy: 'ownerOrActivePublic';
      isPublicColumn: any;
      isActiveColumn: any;
    }
);

export const ASSIGNABLE_ASSET_REGISTRY: Record<string, AssignableAssetDefinition> = {
  music_albums: {
    moduleType: 'music', policy: 'ownerOnly', table: musicAlbums,
    idColumn: musicAlbums.id, userIdColumn: musicAlbums.userId,
  },
  music_tracks: {
    moduleType: 'music', policy: 'ownerOnly', table: musicTracks,
    idColumn: musicTracks.id, userIdColumn: musicTracks.userId,
  },
  music_links: {
    moduleType: 'music', policy: 'ownerOnly', table: musicLinks,
    idColumn: musicLinks.id, userIdColumn: musicLinks.userId,
  },
  music_media: {
    moduleType: 'music', policy: 'ownerOnly', table: musicMedia,
    idColumn: musicMedia.id, userIdColumn: musicMedia.userId,
  },

  threed_plants: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedPlants,
    idColumn: threedPlants.id, userIdColumn: threedPlants.userId,
  },
  threed_beds: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedBeds,
    idColumn: threedBeds.id, userIdColumn: threedBeds.userId,
  },
  threed_plantings: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedPlantings,
    idColumn: threedPlantings.id, userIdColumn: threedPlantings.userId,
  },
  threed_layers: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedLayers,
    idColumn: threedLayers.id, userIdColumn: threedLayers.userId,
  },
  threed_models: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedModels,
    idColumn: threedModels.id, userIdColumn: threedModels.userId,
  },
  threed_characters: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedCharacters,
    idColumn: threedCharacters.id, userIdColumn: threedCharacters.userId,
  },
  threed_tasks: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedTasks,
    idColumn: threedTasks.id, userIdColumn: threedTasks.userId,
  },
  threed_harvests: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedHarvests,
    idColumn: threedHarvests.id, userIdColumn: threedHarvests.userId,
  },
  threed_farmbots: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedFarmbots,
    idColumn: threedFarmbots.id, userIdColumn: threedFarmbots.userId,
  },
  threed_watering_schedules: {
    moduleType: 'threed', policy: 'ownerOnly', table: threedWateringSchedules,
    idColumn: threedWateringSchedules.id, userIdColumn: threedWateringSchedules.userId,
  },

  traffic_chp_cad_incidents: {
    moduleType: 'traffic', policy: 'ownerOrActivePublic', table: trafficChpCadIncidents,
    idColumn: trafficChpCadIncidents.id, userIdColumn: trafficChpCadIncidents.userId,
    isPublicColumn: trafficChpCadIncidents.isPublic, isActiveColumn: trafficChpCadIncidents.isActive,
  },
  traffic_chp_cases: {
    moduleType: 'traffic', policy: 'ownerOrActivePublic', table: trafficChpCases,
    idColumn: trafficChpCases.id, userIdColumn: trafficChpCases.userId,
    isPublicColumn: trafficChpCases.isPublic, isActiveColumn: trafficChpCases.isActive,
  },
  traffic_chp_centers: {
    moduleType: 'traffic', policy: 'ownerOnly', table: trafficChpCenters,
    idColumn: trafficChpCenters.id, userIdColumn: trafficChpCenters.userId,
  },
  traffic_caltrans_lane_closures: {
    moduleType: 'traffic', policy: 'ownerOrActivePublic', table: trafficCaltransLaneClosures,
    idColumn: trafficCaltransLaneClosures.id, userIdColumn: trafficCaltransLaneClosures.userId,
    isPublicColumn: trafficCaltransLaneClosures.isPublic, isActiveColumn: trafficCaltransLaneClosures.isActive,
  },
  traffic_caltrans_districts: {
    moduleType: 'traffic', policy: 'ownerOnly', table: trafficCaltransDistricts,
    idColumn: trafficCaltransDistricts.id, userIdColumn: trafficCaltransDistricts.userId,
  },
  traffic_caltrans_cctv_cameras: {
    moduleType: 'traffic', policy: 'ownerOrActivePublic', table: trafficCaltransCctvCameras,
    idColumn: trafficCaltransCctvCameras.id, userIdColumn: trafficCaltransCctvCameras.userId,
    isPublicColumn: trafficCaltransCctvCameras.isPublic, isActiveColumn: trafficCaltransCctvCameras.isActive,
  },
  traffic_bay_area_511_events: {
    moduleType: 'traffic', policy: 'ownerOrActivePublic', table: trafficBayArea511Events,
    idColumn: trafficBayArea511Events.id, userIdColumn: trafficBayArea511Events.userId,
    isPublicColumn: trafficBayArea511Events.isPublic, isActiveColumn: trafficBayArea511Events.isActive,
  },
  traffic_calfire_incidents: {
    moduleType: 'traffic', policy: 'ownerOrActivePublic', table: trafficCalfireIncidents,
    idColumn: trafficCalfireIncidents.id, userIdColumn: trafficCalfireIncidents.userId,
    isPublicColumn: trafficCalfireIncidents.isPublic, isActiveColumn: trafficCalfireIncidents.isActive,
  },
};
