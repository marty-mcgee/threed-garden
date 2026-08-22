import assert from 'node:assert/strict';
import {
  THREED_DEFAULT_INTERACTION_DISTANCE,
  THREED_INTERACTION_FACING_TOLERANCE,
  THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
  THREED_INTERACTION_POLICY_VERSION,
  ThreeDOrchestrationLifecycleError,
  ThreeDOrchestrationRequestError,
  ThreeDInteractionPlanningError,
  createThreeDOrchestrationLifecycleState,
  createThreeDCharacterOrchestrationRequest,
  planThreeDInteractionApproach,
  planThreeDTargetRelativeNavigation,
  transitionThreeDOrchestrationLifecycleState,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/orchestration/interaction-core.ts';
import {
  THREED_ACTION_TARGET_MARKER_TYPES,
  THREED_GENERIC_TARGET_ACTIONS,
  THREED_PLANTING_TARGET_ACTIONS,
  getThreeDActionTargetCapabilities,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/orchestration/action-target-core.ts';

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
    type: 'farmbots',
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

const activeLifecycle = createThreeDOrchestrationLifecycleState(
  orchestrationRequest,
  1_000,
);
assert.equal(activeLifecycle.phase, 'interacting');
assert.equal(activeLifecycle.requestId, orchestrationRequest.requestId);
assert.equal(Object.isFrozen(activeLifecycle), true);
validationStep('Interaction lifecycle starts with the validated request identity');

const completedLifecycle = transitionThreeDOrchestrationLifecycleState(
  activeLifecycle,
  {
    requestId: activeLifecycle.requestId,
    phase: 'completed',
    changedAt: 2_000,
  },
);
assert.equal(completedLifecycle.phase, 'completed');
assert.equal(
  transitionThreeDOrchestrationLifecycleState(completedLifecycle, {
    requestId: completedLifecycle.requestId,
    phase: 'completed',
    changedAt: 3_000,
  }),
  completedLifecycle,
);
validationStep('Matching completion is terminal and repeated completion is idempotent');

assert.throws(
  () => transitionThreeDOrchestrationLifecycleState(activeLifecycle, {
    requestId: '1ba7b810-9dad-4d80-80b4-00c04fd430c8',
    phase: 'cancelled',
    changedAt: 2_000,
  }),
  (error) => error instanceof ThreeDOrchestrationLifecycleError
    && error.code === 'request_mismatch',
);
assert.throws(
  () => transitionThreeDOrchestrationLifecycleState(completedLifecycle, {
    requestId: completedLifecycle.requestId,
    phase: 'cancelled',
    changedAt: 3_000,
  }),
  (error) => error instanceof ThreeDOrchestrationLifecycleError
    && error.code === 'invalid_transition',
);
validationStep('Mismatched requests and terminal-state replacement fail closed');

const targetRelativeDirections = [
  {
    targetPosition: { x: 0, y: 9, z: 10 },
    expected: { x: 0, y: 0, z: 1 },
  },
  {
    targetPosition: { x: 10, y: -9, z: 0 },
    expected: { x: 1, y: 0, z: 0 },
  },
  {
    targetPosition: { x: 0, y: 0, z: -10 },
    expected: { x: 0, y: 0, z: -1 },
  },
  {
    targetPosition: { x: -10, y: 0, z: 0 },
    expected: { x: -1, y: 0, z: 0 },
  },
];
for (const direction of targetRelativeDirections) {
  const navigation = planThreeDTargetRelativeNavigation({
    characterPosition: { x: 0, y: 0, z: 0 },
    targetPosition: direction.targetPosition,
  });
  assert.equal(navigation.hasDirection, true);
  assert.deepEqual(navigation.forwardDirection, direction.expected);
  assert.equal(navigation.distanceToTarget, 10);
}
validationStep('Target-relative forward direction is correct on every cardinal axis');

const zeroDistanceNavigation = planThreeDTargetRelativeNavigation({
  characterPosition: { x: 3, y: 1, z: -2 },
  targetPosition: { x: 3, y: 99, z: -2 },
});
assert.equal(zeroDistanceNavigation.hasDirection, false);
assert.equal(zeroDistanceNavigation.distanceToTarget, 0);
assert.deepEqual(zeroDistanceNavigation.forwardDirection, { x: 0, y: 0, z: 0 });
validationStep('Coincident planar positions do not invent a movement direction');

assert.deepEqual(THREED_ACTION_TARGET_MARKER_TYPES, [
  'plantings',
  'beds',
  'characters',
  'farmbots',
  'models',
]);
for (const markerType of THREED_ACTION_TARGET_MARKER_TYPES) {
  const capabilities = getThreeDActionTargetCapabilities(markerType);
  assert.equal(capabilities?.targetable, true);
  assert.equal(capabilities?.navigationEnabled, true);
  assert.deepEqual(capabilities?.genericActions, THREED_GENERIC_TARGET_ACTIONS);
  assert.deepEqual(
    capabilities?.moduleActions,
    markerType === 'plantings' ? THREED_PLANTING_TARGET_ACTIONS : [],
  );
}
validationStep('Every rendered ThreeD Sub-Module marker is an Action Target');

for (const markerType of THREED_ACTION_TARGET_MARKER_TYPES) {
  const request = createThreeDCharacterOrchestrationRequest({
    requestId: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
    characterId: 7,
    action: 'point',
    target: {
      markerId: `${markerType}-3`,
      type: markerType,
      id: 3,
      name: `${markerType} target`,
      position: { x: 4, y: 0, z: 8 },
    },
  });
  assert.equal(request.target.type, markerType);
}
validationStep('Generic orchestration accepts every rendered marker target type');

assert.equal(getThreeDActionTargetCapabilities('layers'), null);
assert.equal(getThreeDActionTargetCapabilities('plants'), null);
assert.equal(getThreeDActionTargetCapabilities('traffic'), null);
validationStep('Non-rendered and non-ThreeD data do not become marker targets');

console.log('─'.repeat(42));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
