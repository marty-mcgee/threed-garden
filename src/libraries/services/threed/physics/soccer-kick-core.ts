import { isProjectModelMovableBall } from '../models/project-model-instance-core';
import { defaultKickCollisionPoints, type ThreeDActionCollisionPointId, type ThreeDActionCollisionSample } from './action-collision-core';

/** Client-only, Project-instance interaction. No Scenario or score persistence. */
export const THREED_SOCCER_KICK_REQUEST_EVENT = 'threed-soccer-kick-request';
export const THREED_SOCCER_KICK_APPLY_EVENT = 'threed-soccer-kick-apply';
export const THREED_SOCCER_KICK_REJECT_EVENT = 'threed-soccer-kick-reject';
export const THREED_SOCCER_KICK_RESULT_EVENT = 'threed-soccer-kick-result';
export const THREED_SOCCER_KICK_CANCEL_EVENT = 'threed-soccer-kick-cancel';
export type SoccerKickCancel = Pick<SoccerKickRequest, 'requestId' | 'projectId' | 'characterMarkerId' | 'ballMarkerId'>;
export const THREED_CHARACTER_ACTION_CANCEL_EVENT = 'threed-character-action-cancel';
export const SOCCER_KICK_MAX_PLANAR_RANGE = 4.5;
export const SOCCER_KICK_MAX_HEIGHT_DIFFERENCE = 2;
export const SOCCER_KICK_MAX_SPEED = 18;
export const SOCCER_KICK_SPEED_GAIN = 10;

export type SoccerKickPosition = Readonly<{ x: number; y: number; z: number }>;
export type SoccerKickRequest = Readonly<{
  version: 1;
  requestId: string;
  projectId: number;
  characterId: number;
  characterMarkerId: string;
  ballMarkerId: string;
  action: string;
  timing?: 'contact';
  pointIds?: readonly ThreeDActionCollisionPointId[];
}>;
export type SoccerKickApply = SoccerKickRequest & Readonly<{
  actorPosition: SoccerKickPosition;
  collision?: ThreeDActionCollisionSample;
}>;
export type SoccerKickResult = Readonly<{
  requestId: string;
  projectId: number;
  ballMarkerId: string;
  applied: boolean;
  reason?: 'animation-rejected' | 'collision-unavailable' | 'miss' | 'timeout' | 'changed';
}>;

export function isSoccerFootKickSlot(name: string): boolean {
  return defaultKickCollisionPoints(name).length > 0;
}

export function validSoccerKickRequest(value: unknown): value is SoccerKickRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<SoccerKickRequest>;
  return request.version === 1
    && typeof request.requestId === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(request.requestId)
    && Number.isSafeInteger(request.projectId) && Number(request.projectId) > 0
    && Number.isSafeInteger(request.characterId) && Number(request.characterId) > 0
    && typeof request.characterMarkerId === 'string' && request.characterMarkerId.length > 0
    && typeof request.ballMarkerId === 'string' && request.ballMarkerId.length > 0
    && typeof request.action === 'string' && request.action.length > 0 && request.action.length <= 120
    && (request.timing === undefined || (request.timing === 'contact'
      && Array.isArray(request.pointIds) && request.pointIds.length > 0 && request.pointIds.length <= 2
      && new Set(request.pointIds).size === request.pointIds.length
      && request.pointIds.every(id => id === 'left-foot' || id === 'right-foot')));
}

export function soccerKickInRange(actor: SoccerKickPosition, ball: SoccerKickPosition): boolean {
  if (![actor.x, actor.y, actor.z, ball.x, ball.y, ball.z].every(Number.isFinite)) return false;
  const planar = Math.hypot(ball.x - actor.x, ball.z - actor.z);
  return planar > 0.05 && planar <= SOCCER_KICK_MAX_PLANAR_RANGE
    && Math.abs(ball.y - actor.y) <= SOCCER_KICK_MAX_HEIGHT_DIFFERENCE;
}

/** Returns one bounded horizontal impulse for the current Rapier body, or null. */
export function planSoccerKickImpulse(input: {
  actor: SoccerKickPosition;
  ball: SoccerKickPosition;
  velocity: SoccerKickPosition;
  mass: number;
}): SoccerKickPosition | null {
  const { actor, ball, velocity, mass } = input;
  if (!soccerKickInRange(actor, ball)
    || ![velocity.x, velocity.y, velocity.z, mass].every(Number.isFinite)
    || mass <= 0 || mass > 100) return null;
  const speed = Math.hypot(velocity.x, velocity.z);
  if (speed >= SOCCER_KICK_MAX_SPEED) return null;
  const distance = Math.hypot(ball.x - actor.x, ball.z - actor.z);
  const directionX = (ball.x - actor.x) / distance;
  const directionZ = (ball.z - actor.z) / distance;
  const gain = Math.min(SOCCER_KICK_SPEED_GAIN, SOCCER_KICK_MAX_SPEED - speed);
  return { x: directionX * gain * mass, y: 0, z: directionZ * gain * mass };
}

export interface SoccerKickMarker {
  id: string;
  type: string;
  data?: { id?: unknown; isMovable?: unknown };
  metadata?: unknown;
  isActive?: boolean;
  isVisible?: boolean;
}

/** Resolves current Project instances and positions; reusable Model IDs are insufficient. */
export function findSoccerKickParticipants(input: {
  request: SoccerKickRequest;
  projectId?: number;
  controlledCharacterId?: number | null;
  target?: { markerId: string; id: number; type: string } | null;
  markers: readonly SoccerKickMarker[];
  activeLayers: ReadonlySet<string>;
  visibleMarkerIds?: ReadonlySet<string>;
  positionForMarker: (markerId: string) => SoccerKickPosition | null | undefined;
}): { actorPosition: SoccerKickPosition; ballPosition: SoccerKickPosition } | null {
  const { request } = input;
  if (input.projectId !== request.projectId
    || input.controlledCharacterId !== request.characterId
    || input.target?.markerId !== request.ballMarkerId
    || input.target.type !== 'models'
    || !input.activeLayers.has('models') || !input.activeLayers.has('characters')) return null;
  const actor = input.markers.find(marker => marker.id === request.characterMarkerId
    && (marker.type === 'characters' || marker.type === 'character')
    && marker.data?.id === request.characterId && marker.data?.isMovable === true);
  const ball = input.markers.find(marker => marker.id === request.ballMarkerId
    && (marker.type === 'models' || marker.type === 'model')
    && marker.data?.id === input.target?.id && isProjectModelMovableBall(marker.metadata));
  if (!actor || !ball || actor.isActive === false || actor.isVisible === false
    || ball.isActive === false || ball.isVisible === false
    || (input.visibleMarkerIds && (!input.visibleMarkerIds.has(actor.id)
      || !input.visibleMarkerIds.has(ball.id)))) return null;
  const actorPosition = input.positionForMarker(actor.id);
  const ballPosition = input.positionForMarker(ball.id);
  return actorPosition && ballPosition && soccerKickInRange(actorPosition, ballPosition)
    ? { actorPosition, ballPosition } : null;
}
