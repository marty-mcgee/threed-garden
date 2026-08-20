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

console.log('FarmBot command policy validation passed');
