import type {
  ThreeDActionTarget,
  ThreeDCharacterOrchestrationRequest,
} from '../../../types/map';
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { getThreeDActionTargetCapabilities } from './action-target-core.ts';

export const THREED_INTERACTION_POLICY_VERSION = 1 as const;
export const THREED_DEFAULT_INTERACTION_DISTANCE = 1.5;
export const THREED_INTERACTION_ARRIVAL_TOLERANCE = 0.1;
export const THREED_INTERACTION_FACING_TOLERANCE = Math.PI / 8;
export const THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT =
  'threed-character-orchestration-request' as const;
export const THREED_ORCHESTRATED_INTERACTION_ACTIONS = [
  'point',
  'pointGesture',
  'talk',
] as const;

export type ThreeDOrchestratedInteractionAction =
  typeof THREED_ORCHESTRATED_INTERACTION_ACTIONS[number];

export interface ThreeDPlanarPosition {
  x: number;
  y: number;
  z: number;
}

export interface ThreeDInteractionApproachInput {
  characterPosition: ThreeDPlanarPosition;
  targetPosition: ThreeDPlanarPosition;
  interactionDistance?: number;
  arrivalTolerance?: number;
}

export interface ThreeDInteractionApproachPlan {
  distanceToTarget: number;
  interactionDistance: number;
  arrived: boolean;
  destination: ThreeDPlanarPosition;
  facingYaw: number;
}

export interface ThreeDTargetRelativeNavigationPlan {
  distanceToTarget: number;
  hasDirection: boolean;
  forwardDirection: ThreeDPlanarPosition;
}

export type ThreeDOrchestrationLifecyclePhase =
  | 'interacting'
  | 'completed'
  | 'cancelled';

export interface ThreeDOrchestrationLifecycleState {
  requestId: string;
  characterId: number;
  targetId: number;
  action: string;
  phase: ThreeDOrchestrationLifecyclePhase;
  changedAt: number;
}

export type ThreeDOrchestrationLifecycleErrorCode =
  | 'invalid_changed_at'
  | 'request_mismatch'
  | 'invalid_transition';

export class ThreeDOrchestrationLifecycleError extends Error {
  readonly code: ThreeDOrchestrationLifecycleErrorCode;

  constructor(code: ThreeDOrchestrationLifecycleErrorCode) {
    super(code);
    this.name = 'ThreeDOrchestrationLifecycleError';
    this.code = code;
  }
}

export type ThreeDInteractionPlanningErrorCode =
  | 'invalid_character_position'
  | 'invalid_target_position'
  | 'invalid_interaction_distance'
  | 'invalid_arrival_tolerance';

export class ThreeDInteractionPlanningError extends Error {
  readonly code: ThreeDInteractionPlanningErrorCode;

  constructor(code: ThreeDInteractionPlanningErrorCode) {
    super(code);
    this.name = 'ThreeDInteractionPlanningError';
    this.code = code;
  }
}

export type ThreeDOrchestrationRequestErrorCode =
  | 'invalid_request_id'
  | 'invalid_character_id'
  | 'unsupported_action'
  | 'invalid_target';

export class ThreeDOrchestrationRequestError extends Error {
  readonly code: ThreeDOrchestrationRequestErrorCode;

  constructor(code: ThreeDOrchestrationRequestErrorCode) {
    super(code);
    this.name = 'ThreeDOrchestrationRequestError';
    this.code = code;
  }
}

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isFinitePosition(value: ThreeDPlanarPosition): boolean {
  return Number.isFinite(value.x)
    && Number.isFinite(value.y)
    && Number.isFinite(value.z);
}

export function createThreeDCharacterOrchestrationRequest(input: {
  requestId: string;
  characterId: number;
  action: string;
  target: ThreeDActionTarget;
  interactionDistance?: number;
}): ThreeDCharacterOrchestrationRequest {
  if (!UUID_V4_PATTERN.test(input.requestId)) {
    throw new ThreeDOrchestrationRequestError('invalid_request_id');
  }
  if (!Number.isSafeInteger(input.characterId) || input.characterId < 1) {
    throw new ThreeDOrchestrationRequestError('invalid_character_id');
  }
  if (!THREED_ORCHESTRATED_INTERACTION_ACTIONS.includes(
    input.action as ThreeDOrchestratedInteractionAction,
  )) {
    throw new ThreeDOrchestrationRequestError('unsupported_action');
  }
  if (
    !getThreeDActionTargetCapabilities(input.target.type)
    || !Number.isSafeInteger(input.target.id)
    || input.target.id < 1
    || !isFinitePosition(input.target.position)
  ) {
    throw new ThreeDOrchestrationRequestError('invalid_target');
  }

  const approach = planThreeDInteractionApproach({
    characterPosition: input.target.position,
    targetPosition: input.target.position,
    interactionDistance: input.interactionDistance,
  });

  return Object.freeze({
    version: THREED_INTERACTION_POLICY_VERSION,
    requestId: input.requestId.toLowerCase(),
    characterId: input.characterId,
    action: input.action,
    target: Object.freeze({
      ...input.target,
      position: Object.freeze({ ...input.target.position }),
      actionRequestId: input.requestId.toLowerCase(),
    }),
    interactionDistance: approach.interactionDistance,
  });
}

export function createThreeDOrchestrationLifecycleState(
  request: ThreeDCharacterOrchestrationRequest,
  changedAt: number,
): ThreeDOrchestrationLifecycleState {
  if (!Number.isFinite(changedAt) || changedAt < 0) {
    throw new ThreeDOrchestrationLifecycleError('invalid_changed_at');
  }

  return Object.freeze({
    requestId: request.requestId,
    characterId: request.characterId,
    targetId: request.target.id,
    action: request.action,
    phase: 'interacting',
    changedAt,
  });
}

/**
 * Applies browser-side simulation lifecycle changes only. Terminal states are
 * immutable, while repeating the same terminal result is intentionally safe.
 */
export function transitionThreeDOrchestrationLifecycleState(
  current: ThreeDOrchestrationLifecycleState,
  input: {
    requestId: string;
    phase: 'completed' | 'cancelled';
    changedAt: number;
  },
): ThreeDOrchestrationLifecycleState {
  if (!Number.isFinite(input.changedAt) || input.changedAt < current.changedAt) {
    throw new ThreeDOrchestrationLifecycleError('invalid_changed_at');
  }
  if (input.requestId !== current.requestId) {
    throw new ThreeDOrchestrationLifecycleError('request_mismatch');
  }
  if (current.phase === input.phase) {
    return current;
  }
  if (current.phase !== 'interacting') {
    throw new ThreeDOrchestrationLifecycleError('invalid_transition');
  }

  return Object.freeze({
    ...current,
    phase: input.phase,
    changedAt: input.changedAt,
  });
}

/**
 * Plans only the ThreeD character's visual approach and orientation.
 * It has no animation, API, persistence, MQTT, worker, or device behavior.
 */
export function planThreeDInteractionApproach(
  input: ThreeDInteractionApproachInput,
): ThreeDInteractionApproachPlan {
  if (!isFinitePosition(input.characterPosition)) {
    throw new ThreeDInteractionPlanningError('invalid_character_position');
  }
  if (!isFinitePosition(input.targetPosition)) {
    throw new ThreeDInteractionPlanningError('invalid_target_position');
  }

  const interactionDistance = input.interactionDistance
    ?? THREED_DEFAULT_INTERACTION_DISTANCE;
  if (!Number.isFinite(interactionDistance) || interactionDistance <= 0) {
    throw new ThreeDInteractionPlanningError('invalid_interaction_distance');
  }

  const arrivalTolerance = input.arrivalTolerance
    ?? THREED_INTERACTION_ARRIVAL_TOLERANCE;
  if (!Number.isFinite(arrivalTolerance) || arrivalTolerance < 0) {
    throw new ThreeDInteractionPlanningError('invalid_arrival_tolerance');
  }

  const navigation = planThreeDTargetRelativeNavigation({
    characterPosition: input.characterPosition,
    targetPosition: input.targetPosition,
  });
  const distanceToTarget = navigation.distanceToTarget;
  const arrived = distanceToTarget <= interactionDistance + arrivalTolerance;
  const facingYaw = navigation.hasDirection
    ? Math.atan2(
      navigation.forwardDirection.x,
      navigation.forwardDirection.z,
    )
    : 0;

  let destination = { ...input.characterPosition };
  if (!arrived && navigation.hasDirection) {
    destination = {
      x: input.targetPosition.x
        - navigation.forwardDirection.x * interactionDistance,
      y: input.characterPosition.y,
      z: input.targetPosition.z
        - navigation.forwardDirection.z * interactionDistance,
    };
  }

  return Object.freeze({
    distanceToTarget,
    interactionDistance,
    arrived,
    destination: Object.freeze(destination),
    facingYaw,
  });
}

/**
 * Resolves the world-space forward direction for target-relative character
 * controls. Camera mode, perspective, orbit, and zoom are intentionally absent.
 */
export function planThreeDTargetRelativeNavigation(input: {
  characterPosition: ThreeDPlanarPosition;
  targetPosition: ThreeDPlanarPosition;
}): ThreeDTargetRelativeNavigationPlan {
  if (!isFinitePosition(input.characterPosition)) {
    throw new ThreeDInteractionPlanningError('invalid_character_position');
  }
  if (!isFinitePosition(input.targetPosition)) {
    throw new ThreeDInteractionPlanningError('invalid_target_position');
  }

  const deltaX = input.targetPosition.x - input.characterPosition.x;
  const deltaZ = input.targetPosition.z - input.characterPosition.z;
  const distanceToTarget = Math.hypot(deltaX, deltaZ);
  const hasDirection = distanceToTarget > 0.001;

  return Object.freeze({
    distanceToTarget,
    hasDirection,
    forwardDirection: Object.freeze(hasDirection
      ? {
        x: deltaX / distanceToTarget,
        y: 0,
        z: deltaZ / distanceToTarget,
      }
      : { x: 0, y: 0, z: 0 }),
  });
}
