import type { CreateProjectCharacterPlacementInput } from '@/lib/services/threed/characters/project-character-placement-core';
import type { CreateProjectFarmBotPlacementInput } from '@/lib/services/threed/farmbot/project-farmbot-placement-core';
import type { ProjectModelPlacementRole } from '@/lib/services/threed/models/project-model-instance-core';

export interface ThreeDScenePlacementPosition {
  x: number;
  y: number;
  z: number;
}

export interface FarmBotPlacementDraft {
  widthFeet: string;
  lengthFeet: string;
  heightFeet: string;
  color: string;
  rotation: string;
  scale: string;
}

export interface ProjectModelLibraryPlacementRequest {
  projectId: number;
  threedId: number;
  modelId: number;
  instanceName: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  scaleMultiplier: number;
  placementRole: ProjectModelPlacementRole;
}

export function createProjectModelLibraryPlacementRequest(input: {
  projectId: string;
  threedId: number;
  model: { id: number; modelName: string };
  position: ThreeDScenePlacementPosition;
  scaleMultiplier: number;
  placementRole: ProjectModelPlacementRole;
}): ProjectModelLibraryPlacementRequest {
  return {
    projectId: Number(input.projectId),
    threedId: input.threedId,
    modelId: input.model.id,
    instanceName: input.model.modelName,
    positionX: input.position.x,
    positionY: input.position.y,
    positionZ: input.position.z,
    scaleMultiplier: input.scaleMultiplier,
    placementRole: input.placementRole,
  };
}

export function createProjectCharacterLibraryPlacementRequest(input: {
  projectId: string;
  threedId: number;
  character: { id: number; scaleMultiplier: string | number | null };
  position: ThreeDScenePlacementPosition;
}): CreateProjectCharacterPlacementInput {
  return {
    markerType: 'characters',
    projectId: Number(input.projectId),
    threedId: input.threedId,
    characterId: input.character.id,
    positionX: input.position.x,
    positionY: input.position.y,
    positionZ: input.position.z,
    rotation: 0,
    scaleMultiplier: Number(input.character.scaleMultiplier ?? 1),
  };
}

export function createProjectFarmBotLibraryPlacementRequest(input: {
  projectId: string;
  threedId: number;
  farmBot: { id: number };
  draft: FarmBotPlacementDraft;
  position: ThreeDScenePlacementPosition;
}): CreateProjectFarmBotPlacementInput {
  return {
    markerType: 'farmbots',
    projectId: Number(input.projectId),
    threedId: input.threedId,
    farmbotId: Number(input.farmBot.id),
    widthFeet: Number(input.draft.widthFeet),
    lengthFeet: Number(input.draft.lengthFeet),
    heightFeet: Number(input.draft.heightFeet),
    color: input.draft.color,
    rotation: Number(input.draft.rotation),
    scale: Number(input.draft.scale),
    positionX: input.position.x,
    positionY: input.position.y,
    positionZ: input.position.z,
  };
}
