import type { ThreeDRuntimeMarkerIdentity } from '../markers/runtime-marker-core';
import {
  createThreeDPhysicsEventId,
  normalizeThreeDPhysicsEvent,
  type ThreeDPhysicsEventKind,
  type ThreeDPhysicsEventV1,
} from './physics-event-core';

export interface ThreeDRapierPhysicsObservation {
  kind: ThreeDPhysicsEventKind;
  occurredAt: string;
  target?: ThreeDRuntimeMarkerIdentity;
  magnitude?: number;
  point?: { x: number; y: number; z: number };
  tags?: readonly string[];
  sensor?: ThreeDPhysicsEventV1['sensor'];
}

export interface ThreeDRapierPhysicsEventAdapter {
  observe(observation: ThreeDRapierPhysicsObservation): Readonly<ThreeDPhysicsEventV1>;
}

export function createThreeDRapierPhysicsEventAdapter(input: {
  projectId: number;
  source: ThreeDRuntimeMarkerIdentity;
}): ThreeDRapierPhysicsEventAdapter {
  let sequence = 0;
  return Object.freeze({
    observe(observation: ThreeDRapierPhysicsObservation) {
      sequence += 1;
      const sceneEventId = createThreeDPhysicsEventId({
        projectId: input.projectId,
        kind: observation.kind,
        source: input.source,
        target: observation.target,
        occurredAt: observation.occurredAt,
        sequence,
      });
      return normalizeThreeDPhysicsEvent({
        ...observation,
        projectId: input.projectId,
        source: input.source,
        sceneEventId: observation.sensor ? `${sceneEventId}:${observation.sensor.ownerMarkerId}:${observation.sensor.id}` : sceneEventId,
      });
    },
  });
}
