import assert from 'node:assert/strict';
import {
  FARMBOT_COMMAND_POLICY_VERSION,
  FarmBotCommandPolicyError,
  canTransitionFarmBotCommand,
  isTerminalFarmBotCommandState,
  parseFarmBotCommandIntent,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/command-policy-core.ts';
import {
  FarmBotCommandRepositoryInputError,
  matchesFarmBotIdempotentRequest,
  prepareFarmBotRequestedCommand,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/command-repository-core.ts';
import {
  FARMBOT_COMMAND_REQUEST_TTL_MS,
  FARMBOT_BLOCKING_COMMAND_STATES,
  FARMBOT_WATER_DURATION_MS,
  FarmBotCommandValidationError,
  isFarmBotBlockingCommandState,
  prepareRejectedFarmBotCommand,
  prepareValidatedFarmBotWaterCommand,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/command-validation-core.ts';
import {
  FarmBotCommandRequestError,
  parseFarmBotCommandRequestEnvelope,
  toFarmBotCommandAuthorizationStatus,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/command-route-core.ts';
import {
  FARMBOT_WATER_ACK_TIMEOUT_MS,
  FarmBotCommandLifecycleError,
  farmBotCommandRpcLabel,
  farmBotCommandRecoveryRpcLabel,
  prepareAcceptedFarmBotCommand,
  prepareAcknowledgedFarmBotCommand,
  prepareCompletedFarmBotCommand,
  prepareDispatchedFarmBotCommand,
  prepareDispatchedFarmBotCommandRecovery,
  prepareRequiredFarmBotCommandRecovery,
  prepareResolvedFarmBotCommandRecovery,
  prepareTimedOutFarmBotCommand,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/command-lifecycle-core.ts';
import {
  FarmBotEmergencyActionError,
  prepareAcceptedFarmBotEmergencyAction,
  prepareDispatchedFarmBotEmergencyAction,
  prepareExpiredFarmBotEmergencyAction,
  prepareRejectedFarmBotEmergencyAction,
  prepareRequestedFarmBotEmergencyAction,
  prepareResolvedFarmBotEmergencyAction,
  prepareValidatedFarmBotEmergencyAction,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/emergency-action-core.ts';

let completedValidationSteps = 0;
function validationStep(label: string): void {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD FarmBot command policy validation');
console.log('─'.repeat(40));

const valid = parseFarmBotCommandIntent({
  policyVersion: FARMBOT_COMMAND_POLICY_VERSION,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
});
assert.deepEqual(valid, {
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
});
assert.equal(Object.isFrozen(valid), true);

function rejects(input: unknown, code: FarmBotCommandPolicyError['code']) {
  assert.throws(
    () => parseFarmBotCommandIntent(input),
    (error) => error instanceof FarmBotCommandPolicyError && error.code === code
  );
}

rejects(null, 'invalid_intent');
rejects({
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'move_absolute',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
}, 'unsupported_semantic_command');
rejects({
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'emergency_stop',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
}, 'unsupported_semantic_command');
rejects({
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
  pin: 8,
}, 'unexpected_intent_field');
rejects({
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
  durationMs: 60_000,
}, 'unexpected_intent_field');
rejects({
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
  topic: 'bot/device_123/from_clients',
}, 'unexpected_intent_field');
rejects({
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
  celeryScript: { kind: 'rpc_request' },
}, 'unexpected_intent_field');
rejects({
  policyVersion: 2,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
}, 'unsupported_policy_version');
rejects({
  policyVersion: 1,
  projectId: 0,
  semanticCommand: 'water',
  idempotencyKey: '6ba7b810-9dad-4d80-80b4-00c04fd430c8',
}, 'invalid_project_id');
rejects({
  policyVersion: 1,
  projectId: 42,
  semanticCommand: 'water',
  idempotencyKey: 'not-a-uuid',
}, 'invalid_idempotency_key');

assert.equal(canTransitionFarmBotCommand('requested', 'validated'), true);
assert.equal(canTransitionFarmBotCommand('requested', 'dispatched'), false);
assert.equal(canTransitionFarmBotCommand('accepted', 'dispatched'), true);
assert.equal(canTransitionFarmBotCommand('dispatched', 'completed'), false);
assert.equal(canTransitionFarmBotCommand('dispatched', 'acknowledged'), true);
assert.equal(canTransitionFarmBotCommand('acknowledged', 'completed'), true);
assert.equal(canTransitionFarmBotCommand('completed', 'requested'), false);
assert.equal(isTerminalFarmBotCommandState('completed'), true);
assert.equal(isTerminalFarmBotCommandState('rejected'), true);
assert.equal(isTerminalFarmBotCommandState('timed_out'), true);
assert.equal(isTerminalFarmBotCommandState('cancelled'), true);
assert.equal(isTerminalFarmBotCommandState('accepted'), false);
validationStep('Semantic Water allowlist and command-state policy');

const requestedAt = new Date('2026-08-20T18:00:00.000Z');
const requestedCommand = prepareFarmBotRequestedCommand({
  commandId: '550e8400-e29b-41d4-a716-446655440000',
  userId: ' owner-1 ',
  farmbotId: 3,
  intent: valid,
  requestedAt,
  expiresAt: new Date(requestedAt.getTime() + 60_000),
});
assert.equal(requestedCommand.state, 'requested');
assert.equal(requestedCommand.projectId, 42);
assert.equal(requestedCommand.userId, 'owner-1');
assert.equal(Object.isFrozen(requestedCommand), true);
assert.equal(matchesFarmBotIdempotentRequest(requestedCommand, requestedCommand), true);
assert.equal(matchesFarmBotIdempotentRequest(
  { ...requestedCommand, projectId: 43 },
  requestedCommand
), false);
assert.throws(
  () => prepareFarmBotRequestedCommand({
    commandId: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'owner-1',
    farmbotId: 3,
    intent: valid,
    requestedAt,
    expiresAt: requestedAt,
  }),
  (error) => error instanceof FarmBotCommandRepositoryInputError
    && error.code === 'invalid_expiry'
);
validationStep('Requested-command audit and idempotency rules');

const binding = {
  id: 9,
  userId: 'owner-1',
  farmbotId: 3,
  semanticAction: 'water',
  peripheralId: 12,
  peripheralPin: 8,
  peripheralMode: 0,
  isActive: true,
};
const bindingValidation = {
  valid: true as const,
  reason: 'valid' as const,
  peripheral: { id: 12, label: 'Water', pin: 8, mode: 0 as const },
};
const validatedAt = new Date(requestedAt.getTime() + 1_000);
const validated = prepareValidatedFarmBotWaterCommand({
  command: requestedCommand,
  binding,
  bindingValidation,
  anotherCommandActive: false,
  now: validatedAt,
});
assert.equal(validated.state, 'validated');
assert.equal(validated.durationMs, FARMBOT_WATER_DURATION_MS);
assert.equal(validated.peripheralBindingId, 9);
assert.equal(validated.peripheralPin, 8);
assert.match(validated.commandFingerprint, /^[0-9a-f]{64}$/);
assert.equal(Object.isFrozen(validated), true);
assert.deepEqual(FARMBOT_BLOCKING_COMMAND_STATES, [
  'validated',
  'accepted',
  'dispatched',
  'acknowledged',
]);
assert.equal(isFarmBotBlockingCommandState('validated'), true);
assert.equal(isFarmBotBlockingCommandState('requested'), false);
assert.equal(isFarmBotBlockingCommandState('rejected'), false);

function rejectsValidation(
  overrides: Partial<Parameters<typeof prepareValidatedFarmBotWaterCommand>[0]>,
  code: FarmBotCommandValidationError['code']
) {
  assert.throws(
    () => prepareValidatedFarmBotWaterCommand({
      command: requestedCommand,
      binding,
      bindingValidation,
      anotherCommandActive: false,
      now: validatedAt,
      ...overrides,
    }),
    (error) => error instanceof FarmBotCommandValidationError && error.code === code
  );
}

rejectsValidation({ now: requestedCommand.expiresAt }, 'request_expired');
rejectsValidation({ now: new Date(Number.NaN) }, 'invalid_validation_time');
rejectsValidation({ anotherCommandActive: true }, 'command_in_progress');
rejectsValidation({ binding: { ...binding, isActive: false } }, 'binding_inactive');
rejectsValidation({
  bindingValidation: { valid: false, reason: 'peripheral_missing', peripheral: null },
}, 'peripheral_missing');
rejectsValidation({ binding: { ...binding, peripheralPin: 9 } }, 'binding_metadata_changed');
rejectsValidation({
  binding: { ...binding, peripheralMode: 1 },
  bindingValidation: {
    ...bindingValidation,
    peripheral: { ...bindingValidation.peripheral, mode: 1 },
  },
}, 'unsupported_peripheral_mode');
rejectsValidation({
  command: {
    ...requestedCommand,
    expiresAt: new Date(requestedAt.getTime() + FARMBOT_COMMAND_REQUEST_TTL_MS + 1),
  },
}, 'request_lifetime_exceeded');

const rejected = prepareRejectedFarmBotCommand(
  new FarmBotCommandValidationError('command_in_progress'),
  validatedAt
);
assert.deepEqual(rejected, {
  state: 'rejected',
  rejectionCode: 'command_in_progress',
  terminalAt: validatedAt,
});
assert.equal(Object.isFrozen(rejected), true);
validationStep('Water binding validation, fixed limits, and rejection mapping');

const requestEnvelope = parseFarmBotCommandRequestEnvelope({ farmbotId: 3, intent: valid });
assert.deepEqual(requestEnvelope, { farmbotId: 3, intent: valid });
assert.equal(Object.isFrozen(requestEnvelope), true);
assert.throws(
  () => parseFarmBotCommandRequestEnvelope({ farmbotId: 3, intent: valid, pin: 8 }),
  (error) => error instanceof FarmBotCommandRequestError
    && error.code === 'unexpected_request_field'
);
assert.throws(
  () => parseFarmBotCommandRequestEnvelope({ farmbotId: 0, intent: valid }),
  (error) => error instanceof FarmBotCommandRequestError
    && error.code === 'invalid_farmbot_id'
);

const authorizationStatus = toFarmBotCommandAuthorizationStatus({
  commandId: requestedCommand.commandId,
  semanticCommand: requestedCommand.semanticCommand,
  state: validated.state,
  requestedAt: requestedCommand.requestedAt,
  validatedAt: validated.validatedAt,
  terminalAt: null,
  expiresAt: requestedCommand.expiresAt,
  rejectionCode: null,
  durationMs: validated.durationMs,
});
assert.equal(authorizationStatus.state, 'validated');
assert.equal(authorizationStatus.deliveryEnabled, false);
assert.equal('peripheralPin' in authorizationStatus, false);
assert.equal('commandFingerprint' in authorizationStatus, false);
assert.equal(Object.isFrozen(authorizationStatus), true);
validationStep('Strict API request and limited authorization response');

const lifecycleRpcLabel = 'threed_water_550e8400e29b41d4a716446655440000';
assert.equal(farmBotCommandRpcLabel(requestedCommand.commandId), lifecycleRpcLabel);
assert.equal(
  FARMBOT_WATER_ACK_TIMEOUT_MS,
  FARMBOT_WATER_DURATION_MS + 10_000,
  'Acknowledgement timeout must include Water duration plus response grace'
);
const accepted = prepareAcceptedFarmBotCommand({
  command: { state: 'validated', expiresAt: requestedCommand.expiresAt, rpcLabel: null },
  rpcLabel: lifecycleRpcLabel,
  now: validatedAt,
});
assert.equal(accepted.state, 'accepted');
const dispatched = prepareDispatchedFarmBotCommand({
  command: { ...accepted, rpcLabel: lifecycleRpcLabel },
  now: new Date(validatedAt.getTime() + 1_000),
});
assert.equal(dispatched.state, 'dispatched');
const acknowledged = prepareAcknowledgedFarmBotCommand({
  command: { ...dispatched, rpcLabel: lifecycleRpcLabel },
  rpcLabel: lifecycleRpcLabel,
  outcome: 'ok',
  now: new Date(dispatched.dispatchedAt.getTime() + 1_000),
});
assert.equal(acknowledged.state, 'acknowledged');
const completed = prepareCompletedFarmBotCommand({
  command: acknowledged,
  now: new Date(acknowledged.acknowledgedAt.getTime() + 1),
});
assert.equal(completed.state, 'completed');
assert.equal(completed.terminalAt.getTime(), completed.completedAt.getTime());
assert.deepEqual(prepareAcknowledgedFarmBotCommand({
  command: { ...dispatched, rpcLabel: lifecycleRpcLabel },
  rpcLabel: lifecycleRpcLabel,
  outcome: 'error',
  now: new Date(dispatched.dispatchedAt.getTime() + 1_000),
}), {
  state: 'rejected',
  rejectionCode: 'farmbot_rpc_error',
  terminalAt: new Date(dispatched.dispatchedAt.getTime() + 1_000),
});
assert.throws(
  () => prepareAcknowledgedFarmBotCommand({
    command: { ...dispatched, rpcLabel: lifecycleRpcLabel },
    rpcLabel: 'different_label',
    outcome: 'ok',
    now: new Date(dispatched.dispatchedAt.getTime() + 1_000),
  }),
  FarmBotCommandLifecycleError
);
assert.throws(
  () => prepareTimedOutFarmBotCommand({
    command: dispatched,
    now: new Date(dispatched.dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS - 1),
  }),
  (error) => error instanceof FarmBotCommandLifecycleError
    && error.code === 'acknowledgement_pending'
);
assert.deepEqual(prepareTimedOutFarmBotCommand({
  command: dispatched,
  now: new Date(dispatched.dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS),
}), {
  state: 'timed_out',
  rejectionCode: 'ack_timeout',
  terminalAt: new Date(dispatched.dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS),
});

const timedOutAt = new Date(dispatched.dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS);
const recoveryRpcLabel = 'threed_water_off_550e8400e29b41d4a716446655440000';
assert.equal(farmBotCommandRecoveryRpcLabel(requestedCommand.commandId), recoveryRpcLabel);
const recoveryRequired = prepareRequiredFarmBotCommandRecovery({
  command: {
    commandId: requestedCommand.commandId,
    state: 'timed_out',
    dispatchedAt: dispatched.dispatchedAt,
    recoveryState: null,
  },
  now: timedOutAt,
});
assert.deepEqual(recoveryRequired, {
  recoveryState: 'required',
  recoveryRpcLabel,
  recoveryRequiredAt: timedOutAt,
});
const recoveryDispatched = prepareDispatchedFarmBotCommandRecovery({
  command: { ...recoveryRequired },
  now: new Date(timedOutAt.getTime() + 1),
});
assert.equal(recoveryDispatched.recoveryState, 'dispatched');
const recoveryConfirmed = prepareResolvedFarmBotCommandRecovery({
  command: { ...recoveryRequired, ...recoveryDispatched },
  rpcLabel: recoveryRpcLabel,
  outcome: 'ok',
  now: new Date(recoveryDispatched.recoveryDispatchedAt.getTime() + 1),
});
assert.equal(recoveryConfirmed.recoveryState, 'confirmed');
assert.equal(recoveryConfirmed.recoveryErrorCode, null);
assert.equal(prepareResolvedFarmBotCommandRecovery({
  command: { ...recoveryRequired, ...recoveryDispatched },
  rpcLabel: recoveryRpcLabel,
  outcome: 'error',
  now: new Date(recoveryDispatched.recoveryDispatchedAt.getTime() + 1),
}).recoveryState, 'failed');
assert.throws(
  () => prepareRequiredFarmBotCommandRecovery({
    command: {
      commandId: requestedCommand.commandId,
      state: 'validated',
      dispatchedAt: null,
      recoveryState: null,
    },
    now: timedOutAt,
  }),
  FarmBotCommandLifecycleError
);
assert.throws(
  () => prepareResolvedFarmBotCommandRecovery({
    command: { ...recoveryRequired, ...recoveryDispatched },
    rpcLabel: 'different_label',
    outcome: 'ok',
    now: new Date(recoveryDispatched.recoveryDispatchedAt.getTime() + 1),
  }),
  FarmBotCommandLifecycleError
);

validationStep('Acknowledgement, timeout, completion, and recovery lifecycle');

const emergencyRequestedAt = new Date('2026-08-21T12:00:00.000Z');
const emergencyRequested = prepareRequestedFarmBotEmergencyAction({
  emergencyId: 'e6a7b810-9dad-4d80-80b4-00c04fd430c8',
  userId: ' owner-42 ',
  farmbotId: 42,
  requestedAt: emergencyRequestedAt,
});
assert.equal(emergencyRequested.userId, 'owner-42');
assert.equal(emergencyRequested.rpcLabel, 'threed_emergency_off_e6a7b8109dad4d8080b400c04fd430c8');
assert.equal(emergencyRequested.expiresAt.getTime() - emergencyRequested.requestedAt.getTime(), 60_000);

const emergencyBinding = {
  id: 8,
  userId: 'owner-42',
  farmbotId: 42,
  semanticAction: 'water',
  peripheralId: 5,
  peripheralPin: 8,
  peripheralMode: 0,
  isActive: true,
};
const emergencyValidated = prepareValidatedFarmBotEmergencyAction({
  action: emergencyRequested,
  binding: emergencyBinding,
  now: new Date(emergencyRequestedAt.getTime() + 1_000),
});
assert.deepEqual(emergencyValidated, {
  state: 'validated',
  peripheralBindingId: 8,
  peripheralId: 5,
  peripheralPin: 8,
  peripheralMode: 0,
  validatedAt: new Date(emergencyRequestedAt.getTime() + 1_000),
});
const emergencyAccepted = prepareAcceptedFarmBotEmergencyAction({
  action: { ...emergencyValidated, expiresAt: emergencyRequested.expiresAt },
  now: new Date(emergencyRequestedAt.getTime() + 2_000),
});
const emergencyDispatched = prepareDispatchedFarmBotEmergencyAction({
  action: emergencyAccepted,
  now: new Date(emergencyRequestedAt.getTime() + 3_000),
});
const emergencyAcknowledged = prepareResolvedFarmBotEmergencyAction({
  action: { ...emergencyDispatched, rpcLabel: emergencyRequested.rpcLabel },
  rpcLabel: emergencyRequested.rpcLabel,
  outcome: 'ok',
  now: new Date(emergencyRequestedAt.getTime() + 4_000),
});
assert.equal(emergencyAcknowledged.state, 'acknowledged');
assert.equal(emergencyAcknowledged.outcomeErrorCode, null);
assert.equal(prepareResolvedFarmBotEmergencyAction({
  action: { ...emergencyDispatched, rpcLabel: emergencyRequested.rpcLabel },
  rpcLabel: emergencyRequested.rpcLabel,
  outcome: 'error',
  now: new Date(emergencyRequestedAt.getTime() + 4_000),
}).state, 'failed');
assert.equal(prepareRejectedFarmBotEmergencyAction({
  action: emergencyRequested,
  errorCode: 'binding_missing',
  now: new Date(emergencyRequestedAt.getTime() + 1_000),
}).state, 'rejected');
assert.equal(prepareExpiredFarmBotEmergencyAction({
  action: emergencyRequested,
  now: emergencyRequested.expiresAt,
}).state, 'expired');
assert.throws(
  () => prepareValidatedFarmBotEmergencyAction({
    action: emergencyRequested,
    binding: { ...emergencyBinding, peripheralMode: 1 },
    now: new Date(emergencyRequestedAt.getTime() + 1_000),
  }),
  (error) => error instanceof FarmBotEmergencyActionError
    && error.code === 'unsupported_peripheral_mode'
);
assert.throws(
  () => prepareResolvedFarmBotEmergencyAction({
    action: { ...emergencyDispatched, rpcLabel: emergencyRequested.rpcLabel },
    rpcLabel: 'wrong_rpc_label',
    outcome: 'ok',
    now: new Date(emergencyRequestedAt.getTime() + 4_000),
  }),
  (error) => error instanceof FarmBotEmergencyActionError
    && error.code === 'rpc_label_mismatch'
);
assert.throws(
  () => prepareAcceptedFarmBotEmergencyAction({
    action: { ...emergencyValidated, expiresAt: emergencyRequested.expiresAt },
    now: emergencyRequested.expiresAt,
  }),
  (error) => error instanceof FarmBotEmergencyActionError
    && error.code === 'emergency_expired'
);
validationStep('Independent emergency Water-off audit lifecycle');

console.log('─'.repeat(40));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
console.log('FarmBot command policy validation passed\n');
