import assert from 'node:assert/strict';
import {
  THREED_DEFAULT_INTERACTION_DISTANCE,
  THREED_INTERACTION_FACING_TOLERANCE,
  THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
  THREED_INTERACTION_POLICY_VERSION,
  ThreeDOrchestrationRequestError,
  ThreeDInteractionPlanningError,
  createThreeDCharacterOrchestrationRequest,
  planThreeDInteractionApproach,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/orchestration/interaction-core.ts';

let completedValidationSteps = 0;
function validationStep(label: string): void {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD character orchestration validation');
console.log('─'.repeat(42));

assert.equal(THREED_INTERACTION_POLICY_VERSION, 1);
assert.equal(THREED_DEFAULT_INTERACTION_DISTANCE, 1.5);
assert.equal(THREED_INTERACTION_FACING_TOLERANCE, Math.PI / 8);
validationStep('Versioned simulation policy and default interaction distance');

const approach = planThreeDInteractionApproach({
  characterPosition: { x: 0, y: 0, z: 0 },
  targetPosition: { x: 0, y: 0, z: 10 },
});
assert.equal(approach.arrived, false);
assert.deepEqual(approach.destination, { x: 0, y: 0, z: 8.5 });
assert.equal(approach.facingYaw, 0);
validationStep('Safe stopping position before a distant target');

const lateralApproach = planThreeDInteractionApproach({
  characterPosition: { x: -5, y: 2, z: 0 },
  targetPosition: { x: 0, y: 8, z: 0 },
  interactionDistance: 2,
});
assert.deepEqual(lateralApproach.destination, { x: -2, y: 2, z: 0 });
assert.equal(lateralApproach.facingYaw, Math.PI / 2);
validationStep('Planar approach preserves character height and computes facing');

const arrived = planThreeDInteractionApproach({
  characterPosition: { x: 0, y: 0, z: 1.55 },
  targetPosition: { x: 0, y: 0, z: 0 },
});
assert.equal(arrived.arrived, true);
assert.deepEqual(arrived.destination, { x: 0, y: 0, z: 1.55 });
validationStep('Arrival tolerance prevents unnecessary movement');

assert.throws(
  () => planThreeDInteractionApproach({
    characterPosition: { x: Number.NaN, y: 0, z: 0 },
    targetPosition: { x: 0, y: 0, z: 0 },
  }),
  (error) => error instanceof ThreeDInteractionPlanningError
    && error.code === 'invalid_character_position',
);
assert.throws(
  () => planThreeDInteractionApproach({
    characterPosition: { x: 0, y: 0, z: 0 },
    targetPosition: { x: 0, y: 0, z: 1 },
    interactionDistance: 0,
  }),
  (error) => error instanceof ThreeDInteractionPlanningError
    && error.code === 'invalid_interaction_distance',
);
validationStep('Invalid positions and unsafe distances fail closed');

const orchestrationRequest = createThreeDCharacterOrchestrationRequest({
  requestId: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
  characterId: 7,
  action: 'point',
  target: {
    markerId: 'farmbots-3',
    type: 'farmbot',
    id: 3,
    name: 'FarmBot Gamma',
    position: { x: 4, y: 0, z: 8 },
  },
});
assert.equal(THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT, 'threed-character-orchestration-request');
assert.equal(orchestrationRequest.version, 1);
assert.equal(orchestrationRequest.interactionDistance, 1.5);
assert.equal(orchestrationRequest.target.actionRequestId, orchestrationRequest.requestId);
assert.equal(Object.isFrozen(orchestrationRequest), true);
assert.equal(Object.isFrozen(orchestrationRequest.target), true);
validationStep('Versioned FarmBot interaction request and compatibility identity');

assert.throws(
  () => createThreeDCharacterOrchestrationRequest({
    requestId: 'not-a-uuid',
    characterId: 7,
    action: 'point',
    target: orchestrationRequest.target,
  }),
  (error) => error instanceof ThreeDOrchestrationRequestError
    && error.code === 'invalid_request_id',
);
assert.throws(
  () => createThreeDCharacterOrchestrationRequest({
    requestId: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
    characterId: 7,
    action: 'watering',
    target: orchestrationRequest.target,
  }),
  (error) => error instanceof ThreeDOrchestrationRequestError
    && error.code === 'unsupported_action',
);
validationStep('Malformed and unsupported orchestration requests fail closed');

console.log('─'.repeat(42));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
