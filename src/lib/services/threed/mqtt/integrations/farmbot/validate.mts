import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import {
  MqttWorkerAuthError,
  MqttWorkerNonceStore,
  signMqttWorkerRequest,
  verifyMqttWorkerRequest,
} from '../../worker/auth';
import {
  FarmBotWorkerGrantError,
  parseFarmBotWorkerConnectionGrant,
} from './grant';
import {
  FarmBotWorkerSessionRegistry,
  FarmBotWorkerCommandSessionError,
  FarmBotWorkerSessionScopeError,
} from './session-registry';
import {
  farmBotWorkerTopics,
  parseFarmBotWorkerStatusPayload,
} from './status';
import { farmBotMqttReadonlyAdapter } from './adapter';
import { validateMqttReadonlyIntegrationAdapter } from '../../core/integration-adapter';
import type {
  MqttReadonlyConnectionRequest,
  MqttReadonlyTransport,
  MqttReadonlyTransportCallbacks,
  MqttReadonlyTransportConnection,
} from '../../core/transport';
import {
  MqttJsReadonlyTransport,
  type MqttConnector,
} from '../../transports/mqttjs';
import { createFarmBotWorkerServer } from './server';
import {
  DisabledFarmBotWorkerPersistenceSink,
  HttpFarmBotWorkerPersistenceSink,
  type FarmBotWorkerPersistenceRecord,
  type FarmBotWorkerPersistenceSink,
} from './persistence-client';
import {
  FarmBotCommandDeliveryError,
  evaluateFarmBotWaterAcknowledgementTimeout,
  mapFarmBotCommandAcknowledgement,
  mapFarmBotWaterRecoveryAcknowledgement,
  prepareFarmBotWaterOffRecovery,
  prepareFarmBotWaterDelivery,
} from './command-delivery-core';
import {
  FARMBOT_EMERGENCY_REQUEST_LIFETIME_MS,
  FARMBOT_WATER_ACK_TIMEOUT_MS,
  farmBotEmergencyWaterOffRpcLabel,
  farmBotCommandRecoveryRpcLabel,
} from '../../../farmbot/command-lifecycle-core';
import {
  FarmBotWorkerCommandRequestError,
  MAX_FARMBOT_WORKER_COMMAND_REQUEST_BYTES,
  parseFarmBotWorkerWaterCommandRequest,
  prepareFarmBotWorkerWaterCommandFromAcceptedRecord,
  prepareFarmBotWorkerWaterCommandSubmission,
} from './command-request-core';
import {
  DisabledFarmBotWorkerCommandExecutor,
  FarmBotWorkerCommandsDisabledError,
  type FarmBotWorkerCommandExecutor,
} from './command-executor';
import {
  FarmBotWorkerCommandExecutionGate,
  FarmBotWorkerCommandGateError,
  type FarmBotWorkerCommandAcknowledgement,
} from './command-execution-gate';
import {
  FarmBotCommandAcknowledgementInputError,
  MAX_FARMBOT_COMMAND_ACKNOWLEDGEMENT_BYTES,
  parseFarmBotCommandAcknowledgement,
} from './command-acknowledgement-core';
import {
  DisabledFarmBotWorkerCommandAcknowledgementSink,
  HttpFarmBotWorkerCommandAcknowledgementSink,
  type FarmBotWorkerCommandAcknowledgementSink,
} from './command-acknowledgement-client';
import {
  FarmBotCommandAcknowledgementResponseError,
  parseFarmBotCommandAcknowledgementReceipt,
} from './command-acknowledgement-response-core';
import {
  FarmBotWorkerCommandResponseError,
  parseFarmBotWorkerCommandAcceptedResponse,
} from './command-response-core';
import {
  FarmBotCommandHandoffError,
  requestFarmBotWorkerCommandAcceptance,
} from './command-handoff-core';
import {
  FarmBotCommandDispatchCoordinatorError,
  handOffAndRecordFarmBotWaterCommand,
} from './command-dispatch-coordinator-core';
import {
  FarmBotCommandPilotError,
  acceptAndDispatchFarmBotWaterCommand,
} from './command-pilot-core';
import {
  FarmBotCommandCompletionError,
  recordAndCompleteFarmBotCommandAcknowledgement,
} from './command-completion-core';
import {
  FarmBotCommandTimeoutCoordinatorError,
  timeOutAndRequireFarmBotWaterRecovery,
} from './command-timeout-core';
import {
  MAX_FARMBOT_COMMAND_TIMEOUT_REPORT_BYTES,
  FarmBotWorkerCommandTimeoutReportError,
  type FarmBotWorkerCommandTimeoutReport,
  parseFarmBotWorkerCommandTimeoutReport,
  prepareFarmBotWorkerCommandTimeoutReport,
} from './command-timeout-report-core';
import {
  FarmBotTimeoutIngestionError,
  ingestFarmBotWorkerCommandTimeout,
} from './command-timeout-ingestion-core';
import {
  FarmBotCommandTimeoutResponseError,
  parseFarmBotCommandTimeoutReceipt,
} from './command-timeout-response-core';
import {
  DisabledFarmBotWorkerCommandTimeoutSink,
  HttpFarmBotWorkerCommandTimeoutSink,
  type FarmBotWorkerCommandTimeoutSink,
  createFarmBotWorkerCommandTimeoutSink,
} from './command-timeout-client';
import { ProcessLocalFarmBotWorkerCommandDeadlineMonitor } from './command-deadline-monitor';
import {
  FarmBotTimeoutReconciliationError,
  reconcileOverdueFarmBotCommands,
} from './command-timeout-reconciliation-core';
import {
  MAX_FARMBOT_TIMEOUT_RECONCILIATION_REQUEST_BYTES,
  FarmBotTimeoutReconciliationRequestError,
  parseFarmBotTimeoutReconciliationRequest,
  parseFarmBotTimeoutReconciliationResponse,
} from './command-timeout-reconciliation-request-core';
import {
  DisabledFarmBotWorkerTimeoutReconciliationRunner,
  HttpFarmBotWorkerTimeoutReconciliationRunner,
  createFarmBotWorkerTimeoutReconciliationRunner,
} from './command-timeout-reconciliation-client';
import {
  FarmBotWorkerRecoveryRequestError,
  MAX_FARMBOT_WORKER_RECOVERY_REQUEST_BYTES,
  parseFarmBotWorkerWaterOffRecoveryRequest,
  prepareFarmBotWorkerWaterOffRecoveryFromRequiredRecord,
  prepareFarmBotWorkerWaterOffRecoverySubmission,
} from './command-recovery-request-core';
import {
  FarmBotWorkerRecoveryResponseError,
  parseFarmBotWorkerRecoveryAcceptedResponse,
} from './command-recovery-response-core';
import {
  FarmBotRecoveryHandoffError,
  requestFarmBotWorkerRecoveryAcceptance,
} from './command-recovery-handoff-core';
import {
  FarmBotRecoveryDispatchCoordinatorError,
  handOffAndRecordFarmBotWaterOffRecovery,
} from './command-recovery-dispatch-coordinator-core';
import {
  DisabledFarmBotWorkerRecoveryExecutor,
  FarmBotWorkerRecoveryDisabledError,
  FarmBotWorkerRecoveryExecutionResultError,
  validateFarmBotWorkerRecoveryExecutionResult,
} from './command-recovery-executor';
import {
  FarmBotWorkerRecoveryExecutionGate,
  FarmBotWorkerRecoveryGateError,
  type FarmBotWorkerRecoveryAcknowledgement,
} from './command-recovery-execution-gate';
import {
  DisabledFarmBotWorkerRecoveryAcknowledgementSink,
  HttpFarmBotWorkerRecoveryAcknowledgementSink,
  createFarmBotWorkerRecoveryAcknowledgementSink,
} from './command-recovery-acknowledgement-client';
import {
  FarmBotRecoveryAcknowledgementResponseError,
  parseFarmBotRecoveryAcknowledgementReceipt,
} from './command-recovery-acknowledgement-response-core';
import { ProcessLocalFarmBotWorkerDeviceExecutionArbiter } from './device-execution-arbiter';
import {
  FarmBotRecoveryAcknowledgementInputError,
  MAX_FARMBOT_RECOVERY_ACKNOWLEDGEMENT_BYTES,
  parseFarmBotRecoveryAcknowledgement,
} from './command-recovery-acknowledgement-core';
import {
  MAX_FARMBOT_EMERGENCY_WATER_OFF_REQUEST_BYTES,
  FarmBotWorkerEmergencyWaterOffRequestError,
  parseFarmBotWorkerEmergencyWaterOffRequest,
} from './emergency-water-off-request-core';

function testJwt(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

let completedValidationSteps = 0;
function validationStep(label: string): void {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD FarmBot MQTT worker validation');
console.log('─'.repeat(40));

const now = new Date('2027-01-15T12:00:00.000Z');
const claims = {
  mqtt: 'broker.example.com',
  mqtt_ws: 'wss://broker.example.com/ws/mqtt',
  bot: 'device_123',
  vhost: 'test-vhost',
  iat: Math.floor(now.getTime() / 1000) - 60,
  exp: Math.floor(now.getTime() / 1000) + 3_600,
};
const credential = testJwt(claims);
const grantPayload = {
  version: 1,
  farmbotId: 42,
  ownerId: 'owner-1',
  farmbotDeviceId: 123,
  brokerDeviceId: claims.bot,
  mqttHost: claims.mqtt,
  mqttWsUrl: claims.mqtt_ws,
  vhost: claims.vhost,
  tokenIssuedAt: new Date(claims.iat * 1_000).toISOString(),
  tokenExpiresAt: new Date(claims.exp * 1_000).toISOString(),
  grantIssuedAt: now.toISOString(),
  grantExpiresAt: new Date(now.getTime() + 120_000).toISOString(),
  credential,
};

const grant = parseFarmBotWorkerConnectionGrant(grantPayload, now);
assert.equal(grant.brokerDeviceId, 'device_123');
assert.throws(
  () => parseFarmBotWorkerConnectionGrant({ ...grantPayload, brokerDeviceId: 'device_999' }, now),
  FarmBotWorkerGrantError
);

const workerCommandPayload = {
  version: 1,
  farmbotId: 42,
  ownerId: 'owner-1',
  brokerDeviceId: 'device_123',
  commandId: '550e8400-e29b-41d4-a716-446655440000',
  semanticCommand: 'water',
  state: 'accepted',
  peripheralPin: 8,
  durationMs: 5_000,
  commandFingerprint: 'a'.repeat(64),
  rpcLabel: 'threed_water_550e8400e29b41d4a716446655440000',
  expiresAt: new Date(now.getTime() + 60_000).toISOString(),
};
const workerCommand = parseFarmBotWorkerWaterCommandRequest(workerCommandPayload, now);
const emergencyId = '550e8400-e29b-41d4-a716-446655440099';
const emergencyRequestedAt = new Date(now);
const emergencyExpiresAt = new Date(
  emergencyRequestedAt.getTime() + FARMBOT_EMERGENCY_REQUEST_LIFETIME_MS
);
const emergencyRequestPayload = {
  version: 1,
  farmbotId: workerCommand.farmbotId,
  ownerId: workerCommand.ownerId,
  brokerDeviceId: workerCommand.brokerDeviceId,
  emergencyId,
  semanticCommand: 'emergency_water_off',
  peripheralPin: workerCommand.peripheralPin,
  rpcLabel: farmBotEmergencyWaterOffRpcLabel(emergencyId),
  requestedAt: emergencyRequestedAt.toISOString(),
  expiresAt: emergencyExpiresAt.toISOString(),
};
assert.deepEqual(parseFarmBotWorkerEmergencyWaterOffRequest(
  emergencyRequestPayload,
  emergencyRequestedAt
), {
  ...emergencyRequestPayload,
  requestedAt: emergencyRequestedAt,
  expiresAt: emergencyExpiresAt,
});
assert.equal(MAX_FARMBOT_EMERGENCY_WATER_OFF_REQUEST_BYTES, 1_024);
for (const invalid of [
  { ...emergencyRequestPayload, extra: true },
  { ...emergencyRequestPayload, ownerId: '' },
  { ...emergencyRequestPayload, farmbotId: 0 },
  { ...emergencyRequestPayload, brokerDeviceId: 'invalid' },
  { ...emergencyRequestPayload, emergencyId: 'invalid' },
  { ...emergencyRequestPayload, semanticCommand: 'water' },
  { ...emergencyRequestPayload, peripheralPin: -1 },
  { ...emergencyRequestPayload, rpcLabel: 'wrong' },
  { ...emergencyRequestPayload, requestedAt: 'invalid' },
  {
    ...emergencyRequestPayload,
    expiresAt: new Date(emergencyExpiresAt.getTime() + 1).toISOString(),
  },
] as const) {
  assert.throws(
    () => parseFarmBotWorkerEmergencyWaterOffRequest(invalid, emergencyRequestedAt),
    FarmBotWorkerEmergencyWaterOffRequestError
  );
}
assert.throws(
  () => parseFarmBotWorkerEmergencyWaterOffRequest(
    emergencyRequestPayload,
    emergencyExpiresAt
  ),
  (error) => error instanceof FarmBotWorkerEmergencyWaterOffRequestError
    && error.code === 'expired_request'
);
assert.equal(workerCommand.semanticCommand, 'water');
assert.equal(workerCommand.state, 'accepted');
assert.equal(workerCommand.durationMs, 5_000);
assert.equal(Object.isFrozen(workerCommand), true);
assert.equal(MAX_FARMBOT_WORKER_COMMAND_REQUEST_BYTES, 2_048);
validationStep('Connection grant and strict Water request contracts');
const acknowledgementPayload = {
  version: 1,
  ownerId: 'owner-1',
  farmbotId: 42,
  commandId: workerCommand.commandId,
  rpcLabel: workerCommand.rpcLabel,
  state: 'acknowledged',
  rejectionCode: null,
  receivedAt: new Date(now.getTime() + 1_000).toISOString(),
};
assert.deepEqual(parseFarmBotCommandAcknowledgement(acknowledgementPayload, now), {
  ...acknowledgementPayload,
  receivedAt: new Date(acknowledgementPayload.receivedAt),
});
assert.equal(MAX_FARMBOT_COMMAND_ACKNOWLEDGEMENT_BYTES, 1_024);
const acknowledgementAuditBase = {
  commandId: workerCommand.commandId,
  rpcLabel: workerCommand.rpcLabel,
  rejectionCode: null,
  acknowledgedAt: null,
  completedAt: null,
  terminalAt: null,
};
const completionCalls: string[] = [];
const completionResult = await recordAndCompleteFarmBotCommandAcknowledgement({
  userId: ' owner-1 ',
  commandId: workerCommand.commandId.toUpperCase(),
  rpcLabel: workerCommand.rpcLabel,
  outcome: 'ok',
  receivedAt: new Date(acknowledgementPayload.receivedAt),
}, {
  async recordAcknowledgement(input) {
    completionCalls.push('acknowledge');
    assert.equal(input.userId, 'owner-1');
    return {
      ...acknowledgementAuditBase,
      state: 'acknowledged',
      acknowledgedAt: input.now,
    };
  },
  async completeAcknowledged(input) {
    completionCalls.push('complete');
    return {
      ...acknowledgementAuditBase,
      state: 'completed',
      acknowledgedAt: input.now,
      completedAt: input.now,
      terminalAt: input.now,
    };
  },
});
assert.deepEqual(completionCalls, ['acknowledge', 'complete']);
assert.deepEqual(completionResult, {
  commandId: workerCommand.commandId,
  state: 'completed',
});
let rejectedCompletionCalled = false;
assert.deepEqual(await recordAndCompleteFarmBotCommandAcknowledgement({
  userId: 'owner-1',
  commandId: workerCommand.commandId,
  rpcLabel: workerCommand.rpcLabel,
  outcome: 'error',
  receivedAt: new Date(acknowledgementPayload.receivedAt),
}, {
  async recordAcknowledgement(input) {
    return {
      ...acknowledgementAuditBase,
      state: 'rejected',
      rejectionCode: 'farmbot_rpc_error',
      terminalAt: input.now,
    };
  },
  async completeAcknowledged() {
    rejectedCompletionCalled = true;
    throw new Error('must_not_complete');
  },
}), {
  commandId: workerCommand.commandId,
  state: 'rejected',
});
assert.equal(rejectedCompletionCalled, false);
await assert.rejects(
  recordAndCompleteFarmBotCommandAcknowledgement({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    rpcLabel: 'different_label',
    outcome: 'ok',
    receivedAt: new Date(acknowledgementPayload.receivedAt),
  }, {
    async recordAcknowledgement() {
      throw new Error('must_not_record');
    },
    async completeAcknowledged() {
      throw new Error('must_not_complete');
    },
  }),
  FarmBotCommandCompletionError
);
for (const invalid of [
  { ...acknowledgementPayload, topic: 'bot/device_123/from_device' },
  { ...acknowledgementPayload, state: 'rejected', rejectionCode: null },
  { ...acknowledgementPayload, state: 'acknowledged', rejectionCode: 'farmbot_rpc_error' },
  { ...acknowledgementPayload, rpcLabel: 'invalid label' },
  { ...acknowledgementPayload, receivedAt: new Date(now.getTime() + 60_001).toISOString() },
] as const) {
  assert.throws(
    () => parseFarmBotCommandAcknowledgement(invalid, now),
    FarmBotCommandAcknowledgementInputError
  );
}
assert.deepEqual(
  prepareFarmBotWorkerWaterCommandSubmission(42, workerCommandPayload, now),
  {
    path: '/internal/v1/farmbots/42/commands',
    command: workerCommand,
  }
);
const acceptedCommandRecord = {
  commandId: workerCommand.commandId,
  userId: workerCommand.ownerId,
  farmbotId: workerCommand.farmbotId,
  policyVersion: 1,
  semanticCommand: workerCommand.semanticCommand,
  state: workerCommand.state,
  peripheralPin: workerCommand.peripheralPin,
  durationMs: workerCommand.durationMs,
  commandFingerprint: workerCommand.commandFingerprint,
  rpcLabel: workerCommand.rpcLabel,
  acceptedAt: new Date(now.getTime() - 1_000),
  expiresAt: workerCommand.expiresAt,
};
assert.deepEqual(prepareFarmBotWorkerWaterCommandFromAcceptedRecord({
  command: acceptedCommandRecord,
  brokerDeviceId: workerCommand.brokerDeviceId,
  now,
}), workerCommand);
for (const command of [
  { ...acceptedCommandRecord, policyVersion: 2 },
  { ...acceptedCommandRecord, state: 'validated' },
  { ...acceptedCommandRecord, peripheralPin: null },
  { ...acceptedCommandRecord, durationMs: 10_000 },
  { ...acceptedCommandRecord, commandFingerprint: null },
  { ...acceptedCommandRecord, rpcLabel: null },
  { ...acceptedCommandRecord, acceptedAt: null },
  { ...acceptedCommandRecord, acceptedAt: new Date(now.getTime() + 1) },
  { ...acceptedCommandRecord, expiresAt: new Date(Number.NaN) },
] as const) {
  assert.throws(
    () => prepareFarmBotWorkerWaterCommandFromAcceptedRecord({
      command,
      brokerDeviceId: workerCommand.brokerDeviceId,
      now,
    }),
    FarmBotWorkerCommandRequestError
  );
}
const handoffSubmissions: Array<{
  farmbotId: number;
  command: Readonly<typeof workerCommand>;
}> = [];
const handoffResult = await requestFarmBotWorkerCommandAcceptance({
  userId: ' owner-1 ',
  commandId: workerCommand.commandId.toUpperCase(),
  now,
}, {
  async loadContext(input) {
    assert.deepEqual(input, {
      userId: 'owner-1',
      commandId: workerCommand.commandId,
      now,
    });
    return {
      command: acceptedCommandRecord,
      brokerDeviceId: workerCommand.brokerDeviceId,
    };
  },
  async submitToWorker(farmbotId, command) {
    handoffSubmissions.push({ farmbotId, command });
    return {
      commandId: command.commandId,
      rpcLabel: command.rpcLabel,
      acceptedAt: now,
    };
  },
});
assert.deepEqual(handoffSubmissions, [{
  farmbotId: workerCommand.farmbotId,
  command: workerCommand,
}]);
assert.deepEqual(handoffResult, {
  commandId: workerCommand.commandId,
  rpcLabel: workerCommand.rpcLabel,
  workerAcceptedAt: now,
});
const dispatchCoordinatorCalls: string[] = [];
const dispatchCoordinatorResult = await handOffAndRecordFarmBotWaterCommand({
  userId: ' owner-1 ',
  commandId: workerCommand.commandId,
  now,
}, {
  async handOff() {
    dispatchCoordinatorCalls.push('handoff');
    return handoffResult;
  },
  async recordDispatch(input) {
    dispatchCoordinatorCalls.push('record');
    assert.deepEqual(input, {
      userId: 'owner-1',
      commandId: workerCommand.commandId,
      rpcLabel: workerCommand.rpcLabel,
      workerAcceptedAt: now,
    });
    return {
      commandId: workerCommand.commandId,
      rpcLabel: workerCommand.rpcLabel,
      state: 'dispatched',
      dispatchedAt: now,
    };
  },
});
assert.deepEqual(dispatchCoordinatorCalls, ['handoff', 'record']);
assert.deepEqual(dispatchCoordinatorResult, {
  commandId: workerCommand.commandId,
  state: 'dispatched',
  rpcLabel: workerCommand.rpcLabel,
  dispatchedAt: now,
});
const pilotCalls: string[] = [];
const pilotResult = await acceptAndDispatchFarmBotWaterCommand({
  userId: ' owner-1 ',
  commandId: workerCommand.commandId.toUpperCase(),
  now,
}, {
  async acceptValidated(input) {
    pilotCalls.push('accept');
    assert.deepEqual(input, {
      userId: 'owner-1',
      commandId: workerCommand.commandId,
      now,
    });
    return acceptedCommandRecord;
  },
  async dispatchAccepted() {
    pilotCalls.push('dispatch');
    return dispatchCoordinatorResult;
  },
});
assert.deepEqual(pilotCalls, ['accept', 'dispatch']);
assert.deepEqual(pilotResult, dispatchCoordinatorResult);
let invalidAcceptanceDispatched = false;
await assert.rejects(
  acceptAndDispatchFarmBotWaterCommand({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now,
  }, {
    async acceptValidated() {
      return { ...acceptedCommandRecord, state: 'validated' };
    },
    async dispatchAccepted() {
      invalidAcceptanceDispatched = true;
      return dispatchCoordinatorResult;
    },
  }),
  FarmBotCommandPilotError
);
assert.equal(invalidAcceptanceDispatched, false);
await assert.rejects(
  handOffAndRecordFarmBotWaterCommand({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now,
  }, {
    async handOff() {
      return handoffResult;
    },
    async recordDispatch() {
      return {
        commandId: workerCommand.commandId,
        rpcLabel: 'different_label',
        state: 'dispatched',
        dispatchedAt: now,
      };
    },
  }),
  FarmBotCommandDispatchCoordinatorError
);
let invalidReceiptRecorded = false;
await assert.rejects(
  handOffAndRecordFarmBotWaterCommand({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now,
  }, {
    async handOff() {
      return {
        ...handoffResult,
        commandId: '550e8400-e29b-41d4-a716-446655440001',
      };
    },
    async recordDispatch() {
      invalidReceiptRecorded = true;
      throw new Error('must_not_record');
    },
  }),
  FarmBotCommandDispatchCoordinatorError
);
assert.equal(invalidReceiptRecorded, false);
await assert.rejects(
  requestFarmBotWorkerCommandAcceptance({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now,
  }, {
    async loadContext() {
      return {
        command: { ...acceptedCommandRecord, userId: 'different-owner' },
        brokerDeviceId: workerCommand.brokerDeviceId,
      };
    },
    async submitToWorker() {
      throw new Error('must_not_submit');
    },
  }),
  (error) => error instanceof FarmBotCommandHandoffError
    && error.code === 'identity_mismatch'
);
await assert.rejects(
  requestFarmBotWorkerCommandAcceptance({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now,
  }, {
    async loadContext() {
      return {
        command: acceptedCommandRecord,
        brokerDeviceId: workerCommand.brokerDeviceId,
      };
    },
    async submitToWorker(_farmbotId, command) {
      return {
        commandId: command.commandId,
        rpcLabel: command.rpcLabel,
        acceptedAt: new Date(Number.NaN),
      };
    },
  }),
  (error) => error instanceof FarmBotCommandHandoffError
    && error.code === 'identity_mismatch'
);
assert.throws(
  () => prepareFarmBotWorkerWaterCommandSubmission(43, workerCommandPayload, now),
  (error) => error instanceof FarmBotWorkerCommandRequestError
    && error.code === 'identity_mismatch'
);
for (const invalid of [
  { ...workerCommandPayload, topic: 'bot/device_123/from_clients' },
  { ...workerCommandPayload, celeryScript: { kind: 'rpc_request' } },
  { ...workerCommandPayload, durationMs: 60_000 },
  { ...workerCommandPayload, peripheralPin: -1 },
  { ...workerCommandPayload, state: 'validated' },
  { ...workerCommandPayload, rpcLabel: 'different_label' },
] as const) {
  assert.throws(
    () => parseFarmBotWorkerWaterCommandRequest(invalid, now),
    FarmBotWorkerCommandRequestError
  );
}
assert.throws(
  () => parseFarmBotWorkerWaterCommandRequest({
    ...workerCommandPayload,
    expiresAt: now.toISOString(),
  }, now),
  (error) => error instanceof FarmBotWorkerCommandRequestError
    && error.code === 'expired_command'
);
const acceptedResponsePayload = {
  success: true,
  data: {
    commandId: workerCommand.commandId,
    rpcLabel: workerCommand.rpcLabel,
    acceptedAt: now.toISOString(),
  },
};
assert.deepEqual(parseFarmBotWorkerCommandAcceptedResponse({
  response: acceptedResponsePayload,
  command: workerCommand,
  now,
}), {
  commandId: workerCommand.commandId,
  rpcLabel: workerCommand.rpcLabel,
  acceptedAt: now,
});
for (const invalid of [
  { ...acceptedResponsePayload, extra: true },
  { ...acceptedResponsePayload, success: false },
  { ...acceptedResponsePayload, data: { ...acceptedResponsePayload.data, extra: true } },
  { ...acceptedResponsePayload, data: {
    ...acceptedResponsePayload.data,
    commandId: '550e8400-e29b-41d4-a716-446655440001',
  } },
  { ...acceptedResponsePayload, data: { ...acceptedResponsePayload.data, rpcLabel: 'different_label' } },
  { ...acceptedResponsePayload, data: { ...acceptedResponsePayload.data, acceptedAt: 'invalid' } },
  { ...acceptedResponsePayload, data: {
    ...acceptedResponsePayload.data,
    acceptedAt: new Date(now.getTime() + 60_001).toISOString(),
  } },
  { ...acceptedResponsePayload, data: {
    ...acceptedResponsePayload.data,
    acceptedAt: new Date(now.getTime() - 60_001).toISOString(),
  } },
] as const) {
  assert.throws(
    () => parseFarmBotWorkerCommandAcceptedResponse({
      response: invalid,
      command: workerCommand,
      now,
    }),
    FarmBotWorkerCommandResponseError
  );
}

let releaseFirstCommand!: () => void;
const firstCommandPending = new Promise<void>((resolve) => {
  releaseFirstCommand = resolve;
});
let fakeCommandExecutionCount = 0;
const fakeCommandExecutor: FarmBotWorkerCommandExecutor = {
  async execute(request) {
    fakeCommandExecutionCount += 1;
    await firstCommandPending;
    return {
      commandId: request.commandId,
      rpcLabel: request.rpcLabel,
      acceptedAt: now.toISOString(),
    };
  },
};
const reportedAcknowledgements: FarmBotWorkerCommandAcknowledgement[] = [];
let acknowledgementFlushCount = 0;
const fakeAcknowledgementSink: FarmBotWorkerCommandAcknowledgementSink = {
  record(acknowledgement) {
    reportedAcknowledgements.push(structuredClone(acknowledgement));
  },
  async flush() {
    acknowledgementFlushCount += 1;
  },
};
const commandGate = new FarmBotWorkerCommandExecutionGate(
  fakeCommandExecutor,
  fakeAcknowledgementSink
);
const firstExecution = commandGate.execute(workerCommand);
await assert.rejects(
  commandGate.execute(workerCommand),
  (error) => error instanceof FarmBotWorkerCommandGateError
    && error.code === 'duplicate_command'
);
const secondWorkerCommand = parseFarmBotWorkerWaterCommandRequest({
  ...workerCommandPayload,
  commandId: '550e8400-e29b-41d4-a716-446655440001',
  rpcLabel: 'threed_water_550e8400e29b41d4a716446655440001',
}, now);
await assert.rejects(
  commandGate.execute(secondWorkerCommand),
  (error) => error instanceof FarmBotWorkerCommandGateError
    && error.code === 'command_in_progress'
);
releaseFirstCommand();
const firstExecutionResult = await firstExecution;
assert.equal(commandGate.observeResponse({
  farmbotId: 43,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: workerCommand.rpcLabel,
    errorCode: null,
  },
  receivedAt: new Date(now.getTime() + 500).toISOString(),
}), null);
assert.equal(commandGate.observeResponse({
  farmbotId: 42,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: 'unknown_rpc_label',
    errorCode: null,
  },
  receivedAt: new Date(now.getTime() + 500).toISOString(),
}), null);
const correlatedAcknowledgement = commandGate.observeResponse({
  farmbotId: 42,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: workerCommand.rpcLabel,
    errorCode: null,
  },
  receivedAt: new Date(now.getTime() + 1_000).toISOString(),
});
assert.deepEqual(correlatedAcknowledgement, {
  ownerId: 'owner-1',
  farmbotId: 42,
  commandId: workerCommand.commandId,
  rpcLabel: workerCommand.rpcLabel,
  state: 'acknowledged',
  rejectionCode: null,
  receivedAt: new Date(now.getTime() + 1_000).toISOString(),
});
const commandAcknowledgementReceipt = {
  success: true,
  data: {
    commandId: correlatedAcknowledgement.commandId,
    state: 'completed' as const,
  },
};
assert.deepEqual(parseFarmBotCommandAcknowledgementReceipt({
  response: commandAcknowledgementReceipt,
  acknowledgement: correlatedAcknowledgement,
}), commandAcknowledgementReceipt.data);
const rejectedCommandAcknowledgement = Object.freeze({
  ...correlatedAcknowledgement,
  state: 'rejected' as const,
  rejectionCode: 'farmbot_rpc_error' as const,
});
assert.deepEqual(parseFarmBotCommandAcknowledgementReceipt({
  response: {
    success: true,
    data: { commandId: rejectedCommandAcknowledgement.commandId, state: 'rejected' },
  },
  acknowledgement: rejectedCommandAcknowledgement,
}), { commandId: rejectedCommandAcknowledgement.commandId, state: 'rejected' });
for (const response of [
  { ...commandAcknowledgementReceipt, extra: true },
  { ...commandAcknowledgementReceipt, success: false },
  {
    ...commandAcknowledgementReceipt,
    data: { ...commandAcknowledgementReceipt.data, extra: true },
  },
  {
    ...commandAcknowledgementReceipt,
    data: {
      ...commandAcknowledgementReceipt.data,
      commandId: '550e8400-e29b-41d4-a716-446655440001',
    },
  },
  {
    ...commandAcknowledgementReceipt,
    data: { ...commandAcknowledgementReceipt.data, state: 'rejected' },
  },
] as const) {
  assert.throws(
    () => parseFarmBotCommandAcknowledgementReceipt({
      response,
      acknowledgement: correlatedAcknowledgement,
    }),
    FarmBotCommandAcknowledgementResponseError
  );
}
assert.deepEqual(reportedAcknowledgements, [correlatedAcknowledgement]);
await commandGate.flushAcknowledgements();
assert.equal(acknowledgementFlushCount, 1);
assert.equal(commandGate.observeResponse({
  farmbotId: 42,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: workerCommand.rpcLabel,
    errorCode: null,
  },
  receivedAt: new Date(now.getTime() + 2_000).toISOString(),
}), null, 'An acknowledgement must settle its tracked RPC label only once');

let deadlineCallback: (() => void) | null = null;
let deadlineCancelled = false;
let deadlineClock = new Date(now);
const deadlineReports: FarmBotWorkerCommandTimeoutReport[] = [];
let deadlineFlushCount = 0;
const deadlineSink: FarmBotWorkerCommandTimeoutSink = {
  record(report) {
    deadlineReports.push(structuredClone(report));
  },
  async flush() {
    deadlineFlushCount += 1;
  },
};
const deadlineMonitor = new ProcessLocalFarmBotWorkerCommandDeadlineMonitor(
  deadlineSink,
  () => new Date(deadlineClock),
  {
    schedule(callback) {
      deadlineCallback = callback;
      return 'deadline-handle';
    },
    cancel() {
      deadlineCancelled = true;
    },
  }
);
const deadlineGate = new FarmBotWorkerCommandExecutionGate({
  async execute(request) {
    return {
      commandId: request.commandId,
      rpcLabel: request.rpcLabel,
      acceptedAt: now.toISOString(),
    };
  },
}, new DisabledFarmBotWorkerCommandAcknowledgementSink(),
new ProcessLocalFarmBotWorkerDeviceExecutionArbiter(), deadlineMonitor);
await deadlineGate.execute(workerCommand);
assert.ok(deadlineCallback);
deadlineClock = new Date(now.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS);
(deadlineCallback as () => void)();
assert.equal(deadlineReports.length, 1);
assert.equal(deadlineReports[0]?.commandId, workerCommand.commandId);
assert.equal(deadlineGate.observeResponse({
  farmbotId: workerCommand.farmbotId,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: workerCommand.rpcLabel,
    errorCode: null,
  },
  receivedAt: deadlineClock.toISOString(),
}), null, 'A response after timeout must not settle the command again');
await deadlineGate.shutdown();
assert.equal(deadlineFlushCount, 1);
assert.equal(deadlineCancelled, false);

let settledDeadlineCallback: (() => void) | null = null;
let settledDeadlineCancelled = false;
const settledDeadlineReports: FarmBotWorkerCommandTimeoutReport[] = [];
const settledDeadlineMonitor = new ProcessLocalFarmBotWorkerCommandDeadlineMonitor({
  record(report) {
    settledDeadlineReports.push(structuredClone(report));
  },
  async flush() {},
}, () => new Date(now), {
  schedule(callback) {
    settledDeadlineCallback = callback;
    return 'settled-deadline-handle';
  },
  cancel() {
    settledDeadlineCancelled = true;
  },
});
settledDeadlineMonitor.track({ request: workerCommand, acceptedAt: now.toISOString(), onTimeout: () => true });
settledDeadlineMonitor.settle(workerCommand.rpcLabel);
assert.equal(settledDeadlineCancelled, true);
(settledDeadlineCallback as unknown as () => void)();
assert.deepEqual(settledDeadlineReports, []);
assert.deepEqual(await commandGate.execute(workerCommand), firstExecutionResult);
assert.equal(fakeCommandExecutionCount, 1, 'An exact completed retry must reuse its receipt');
await assert.rejects(
  commandGate.execute(Object.freeze({
    ...workerCommand,
    commandFingerprint: 'b'.repeat(64),
  })),
  (error) => error instanceof FarmBotWorkerCommandGateError
    && error.code === 'duplicate_command',
  'A changed request must not reuse a completed receipt'
);
const disabledCommandGate = new FarmBotWorkerCommandExecutionGate(
  new DisabledFarmBotWorkerCommandExecutor()
);
await assert.rejects(disabledCommandGate.execute(workerCommand), FarmBotWorkerCommandsDisabledError);
await assert.rejects(
  disabledCommandGate.execute(workerCommand),
  FarmBotWorkerCommandsDisabledError,
  'Known disabled execution must release its unused command claim'
);
const invalidResultGate = new FarmBotWorkerCommandExecutionGate({
  async execute(request) {
    return {
      commandId: request.commandId,
      rpcLabel: 'wrong_rpc_label',
      acceptedAt: now.toISOString(),
    };
  },
});
await assert.rejects(
  invalidResultGate.execute(workerCommand),
  /invalid_farmbot_command_execution_result/
);
await assert.rejects(
  invalidResultGate.execute(workerCommand),
  (error) => error instanceof FarmBotWorkerCommandGateError
    && error.code === 'duplicate_command',
  'An invalid executor result has an uncertain outcome and must remain claimed'
);

const delivery = prepareFarmBotWaterDelivery({
  command: {
    commandId: '550e8400-e29b-41d4-a716-446655440000',
    semanticCommand: 'water',
    state: 'validated',
    peripheralPin: 8,
    durationMs: 5_000,
    commandFingerprint: 'a'.repeat(64),
    expiresAt: new Date(now.getTime() + 60_000),
  },
  brokerDeviceId: 'device_123',
  now,
});
assert.equal(delivery.topic, 'bot/device_123/from_clients');
assert.equal(delivery.rpcLabel, 'threed_water_550e8400e29b41d4a716446655440000');
assert.deepEqual(JSON.parse(delivery.payload), {
  kind: 'rpc_request',
  args: { label: delivery.rpcLabel },
  body: [
    { kind: 'write_pin', args: { pin_number: 8, pin_value: 1, pin_mode: 0 } },
    { kind: 'wait', args: { milliseconds: 5_000 } },
    { kind: 'write_pin', args: { pin_number: 8, pin_value: 0, pin_mode: 0 } },
  ],
});
assert.deepEqual(mapFarmBotCommandAcknowledgement({
  expectedRpcLabel: delivery.rpcLabel,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: delivery.rpcLabel,
    errorCode: null,
  },
}), { state: 'acknowledged', rejectionCode: null });
assert.deepEqual(mapFarmBotCommandAcknowledgement({
  expectedRpcLabel: delivery.rpcLabel,
  response: {
    eventType: 'rpc_error',
    outcome: 'rejected',
    rpcLabel: delivery.rpcLabel,
    errorCode: 'rpc_error',
  },
}), { state: 'rejected', rejectionCode: 'farmbot_rpc_error' });
assert.throws(
  () => mapFarmBotCommandAcknowledgement({
    expectedRpcLabel: delivery.rpcLabel,
    response: {
      eventType: 'rpc_ok',
      outcome: 'accepted',
      rpcLabel: 'different_label',
      errorCode: null,
    },
  }),
  FarmBotCommandDeliveryError
);
assert.throws(
  () => prepareFarmBotWaterDelivery({
    command: {
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      semanticCommand: 'water',
      state: 'validated',
      peripheralPin: 8,
      durationMs: 60_000,
      commandFingerprint: 'a'.repeat(64),
      expiresAt: new Date(now.getTime() + 60_000),
    },
    brokerDeviceId: 'device_123',
    now,
  }),
  FarmBotCommandDeliveryError
);

const dispatchedAt = new Date(now.getTime() + 1_000);
const timeoutNow = new Date(dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS);
const workerTimeoutReport = prepareFarmBotWorkerCommandTimeoutReport({
  request: workerCommand,
  acceptedAt: dispatchedAt.toISOString(),
  now: timeoutNow,
});
assert.deepEqual(workerTimeoutReport, {
  version: 1,
  ownerId: workerCommand.ownerId,
  farmbotId: workerCommand.farmbotId,
  commandId: workerCommand.commandId,
  rpcLabel: workerCommand.rpcLabel,
  acceptedAt: dispatchedAt,
  timedOutAt: timeoutNow,
  reason: 'ack_timeout',
});
const workerTimeoutReceipt = {
  success: true,
  data: {
    commandId: workerCommand.commandId,
    state: 'timed_out' as const,
    recoveryState: 'required' as const,
    recoveryRpcLabel: farmBotCommandRecoveryRpcLabel(workerCommand.commandId),
  },
};
assert.deepEqual(parseFarmBotCommandTimeoutReceipt({
  response: workerTimeoutReceipt,
  report: workerTimeoutReport,
}), workerTimeoutReceipt.data);
for (const response of [
  { ...workerTimeoutReceipt, extra: true },
  { ...workerTimeoutReceipt, success: false },
  { ...workerTimeoutReceipt, data: { ...workerTimeoutReceipt.data, extra: true } },
  { ...workerTimeoutReceipt, data: { ...workerTimeoutReceipt.data, commandId: '550e8400-e29b-41d4-a716-446655440001' } },
  { ...workerTimeoutReceipt, data: { ...workerTimeoutReceipt.data, state: 'completed' } },
  { ...workerTimeoutReceipt, data: { ...workerTimeoutReceipt.data, recoveryState: 'invalid' } },
  { ...workerTimeoutReceipt, data: { ...workerTimeoutReceipt.data, recoveryRpcLabel: 'wrong' } },
] as const) {
  assert.throws(
    () => parseFarmBotCommandTimeoutReceipt({ response, report: workerTimeoutReport }),
    FarmBotCommandTimeoutResponseError
  );
}
assert.equal(MAX_FARMBOT_COMMAND_TIMEOUT_REPORT_BYTES, 1_024);
const workerTimeoutPayload = {
  ...workerTimeoutReport,
  acceptedAt: workerTimeoutReport.acceptedAt.toISOString(),
  timedOutAt: workerTimeoutReport.timedOutAt.toISOString(),
};
for (const invalid of [
  { ...workerTimeoutPayload, extra: true },
  { ...workerTimeoutPayload, ownerId: '' },
  { ...workerTimeoutPayload, farmbotId: 0 },
  { ...workerTimeoutPayload, commandId: 'invalid' },
  { ...workerTimeoutPayload, rpcLabel: 'wrong' },
  { ...workerTimeoutPayload, acceptedAt: 'invalid' },
  {
    ...workerTimeoutPayload,
    timedOutAt: new Date(timeoutNow.getTime() - 1).toISOString(),
  },
  { ...workerTimeoutPayload, reason: 'other' },
] as const) {
  assert.throws(
    () => parseFarmBotWorkerCommandTimeoutReport(invalid, timeoutNow),
    FarmBotWorkerCommandTimeoutReportError
  );
}
const timeoutIngestionCalls: string[] = [];
const timeoutIngestionResult = await ingestFarmBotWorkerCommandTimeout(
  workerTimeoutReport,
  {
    async loadCommand(input) {
      timeoutIngestionCalls.push('load');
      return {
        commandId: input.commandId,
        userId: input.userId,
        farmbotId: workerCommand.farmbotId,
        rpcLabel: workerCommand.rpcLabel,
        state: 'dispatched',
        dispatchedAt,
      };
    },
    async recordTimeoutAndRequireRecovery(input) {
      timeoutIngestionCalls.push('timeout');
      return {
        commandId: input.commandId,
        state: 'timed_out',
        recoveryState: 'required',
        recoveryRpcLabel: farmBotCommandRecoveryRpcLabel(input.commandId),
        recoveryRequiredAt: input.now,
      };
    },
  }
);
assert.deepEqual(timeoutIngestionCalls, ['load', 'timeout']);
assert.deepEqual(timeoutIngestionResult, {
  commandId: workerCommand.commandId,
  state: 'timed_out',
  recoveryState: 'required',
  recoveryRpcLabel: farmBotCommandRecoveryRpcLabel(workerCommand.commandId),
  recoveryRequiredAt: timeoutNow,
});
let invalidTimeoutWriterCalled = false;
await assert.rejects(
  ingestFarmBotWorkerCommandTimeout(workerTimeoutReport, {
    async loadCommand() {
      return {
        commandId: workerCommand.commandId,
        userId: workerCommand.ownerId,
        farmbotId: workerCommand.farmbotId,
        rpcLabel: workerCommand.rpcLabel,
        state: 'completed',
        dispatchedAt,
      };
    },
    async recordTimeoutAndRequireRecovery() {
      invalidTimeoutWriterCalled = true;
      throw new Error('must not be called');
    },
  }),
  (error) => error instanceof FarmBotTimeoutIngestionError
    && error.code === 'audit_mismatch'
);
assert.equal(invalidTimeoutWriterCalled, false);
const reconciliationCalls: string[] = [];
const reconciliationResult = await reconcileOverdueFarmBotCommands({
  now: timeoutNow,
  limit: 2,
}, {
  async loadOverdue() {
    return [
      {
        userId: workerCommand.ownerId,
        farmbotId: workerCommand.farmbotId,
        commandId: workerCommand.commandId,
        rpcLabel: workerCommand.rpcLabel,
        state: 'dispatched',
        dispatchedAt,
      },
      {
        userId: workerCommand.ownerId,
        farmbotId: workerCommand.farmbotId,
        commandId: secondWorkerCommand.commandId,
        rpcLabel: secondWorkerCommand.rpcLabel,
        state: 'dispatched',
        dispatchedAt,
      },
    ];
  },
  async reconcile(input) {
    reconciliationCalls.push(input.commandId);
    if (input.commandId === secondWorkerCommand.commandId) return null;
    return {
      commandId: input.commandId,
      state: 'timed_out',
      recoveryState: 'required',
      recoveryRpcLabel: farmBotCommandRecoveryRpcLabel(input.commandId),
    };
  },
});
assert.deepEqual(reconciliationCalls, [workerCommand.commandId, secondWorkerCommand.commandId]);
assert.deepEqual(reconciliationResult, { examined: 2, reconciled: 1, skipped: 1 });
assert.equal(MAX_FARMBOT_TIMEOUT_RECONCILIATION_REQUEST_BYTES, 256);
assert.deepEqual(parseFarmBotTimeoutReconciliationRequest({ version: 1, limit: 50 }), {
  version: 1,
  limit: 50,
});
assert.deepEqual(parseFarmBotTimeoutReconciliationResponse({
  success: true,
  data: reconciliationResult,
}), reconciliationResult);
for (const request of [
  { version: 1, limit: 0 },
  { version: 1, limit: 101 },
  { version: 1, limit: 50, extra: true },
] as const) {
  assert.throws(
    () => parseFarmBotTimeoutReconciliationRequest(request),
    FarmBotTimeoutReconciliationRequestError
  );
}
assert.throws(() => parseFarmBotTimeoutReconciliationResponse({
  success: true,
  data: { examined: 2, reconciled: 2, skipped: 1 },
}), FarmBotTimeoutReconciliationRequestError);
await assert.rejects(
  reconcileOverdueFarmBotCommands({ now: timeoutNow, limit: 1 }, {
    async loadOverdue() {
      return [{
        userId: workerCommand.ownerId,
        farmbotId: workerCommand.farmbotId,
        commandId: workerCommand.commandId,
        rpcLabel: workerCommand.rpcLabel,
        state: 'completed',
        dispatchedAt,
      }];
    },
    async reconcile() {
      throw new Error('must not be called');
    },
  }),
  FarmBotTimeoutReconciliationError
);
const timeoutCalls: string[] = [];
const timeoutResult = await timeOutAndRequireFarmBotWaterRecovery({
  userId: ' owner-1 ',
  commandId: workerCommand.commandId.toUpperCase(),
  now: timeoutNow,
}, {
  async recordTimeout(input) {
    timeoutCalls.push('timeout');
    return {
      commandId: workerCommand.commandId,
      userId: input.userId,
      state: 'timed_out',
      rejectionCode: 'ack_timeout',
      dispatchedAt,
      terminalAt: input.now,
      recoveryState: null,
      recoveryRpcLabel: null,
      recoveryRequiredAt: null,
    };
  },
  async requireRecovery(input) {
    timeoutCalls.push('recovery');
    return {
      commandId: workerCommand.commandId,
      userId: input.userId,
      state: 'timed_out',
      rejectionCode: 'ack_timeout',
      dispatchedAt,
      terminalAt: input.now,
      recoveryState: 'required',
      recoveryRpcLabel: 'threed_water_off_550e8400e29b41d4a716446655440000',
      recoveryRequiredAt: input.now,
    };
  },
});
assert.deepEqual(timeoutCalls, ['timeout', 'recovery']);
assert.deepEqual(timeoutResult, {
  commandId: workerCommand.commandId,
  state: 'timed_out',
  recoveryState: 'required',
  recoveryRpcLabel: 'threed_water_off_550e8400e29b41d4a716446655440000',
  recoveryRequiredAt: timeoutNow,
});
const requiredRecoveryRecord = {
  commandId: workerCommand.commandId,
  userId: workerCommand.ownerId,
  farmbotId: workerCommand.farmbotId,
  policyVersion: 1,
  semanticCommand: 'water',
  state: 'timed_out',
  peripheralPin: workerCommand.peripheralPin,
  durationMs: workerCommand.durationMs,
  commandFingerprint: workerCommand.commandFingerprint,
  dispatchedAt,
  recoveryState: 'required',
  recoveryRpcLabel: timeoutResult.recoveryRpcLabel,
  recoveryRequiredAt: timeoutNow,
};
const recoveryWorkerRequest = prepareFarmBotWorkerWaterOffRecoveryFromRequiredRecord({
  command: requiredRecoveryRecord,
  brokerDeviceId: workerCommand.brokerDeviceId,
  now: timeoutNow,
});
assert.deepEqual(recoveryWorkerRequest, {
  version: 1,
  farmbotId: workerCommand.farmbotId,
  ownerId: workerCommand.ownerId,
  brokerDeviceId: workerCommand.brokerDeviceId,
  commandId: workerCommand.commandId,
  semanticCommand: 'water_off',
  recoveryState: 'required',
  peripheralPin: workerCommand.peripheralPin,
  commandFingerprint: workerCommand.commandFingerprint,
  recoveryRpcLabel: timeoutResult.recoveryRpcLabel,
  recoveryRequiredAt: timeoutNow,
});
assert.equal(MAX_FARMBOT_WORKER_RECOVERY_REQUEST_BYTES, 2_048);
const recoverySubmission = prepareFarmBotWorkerWaterOffRecoverySubmission(
  workerCommand.farmbotId,
  {
    ...recoveryWorkerRequest,
    recoveryRequiredAt: recoveryWorkerRequest.recoveryRequiredAt.toISOString(),
  },
  timeoutNow
);
assert.equal(recoverySubmission.path, '/internal/v1/farmbots/42/recoveries');
assert.deepEqual(recoverySubmission.recovery, recoveryWorkerRequest);
assert.throws(
  () => prepareFarmBotWorkerWaterOffRecoverySubmission(
    43,
    {
      ...recoveryWorkerRequest,
      recoveryRequiredAt: recoveryWorkerRequest.recoveryRequiredAt.toISOString(),
    },
    timeoutNow
  ),
  FarmBotWorkerRecoveryRequestError
);
const recoveryAcceptedResponse = {
  success: true,
  data: {
    commandId: recoveryWorkerRequest.commandId,
    recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
    acceptedAt: timeoutNow.toISOString(),
  },
};
assert.deepEqual(validateFarmBotWorkerRecoveryExecutionResult({
  request: recoveryWorkerRequest,
  result: recoveryAcceptedResponse.data,
  now: timeoutNow,
}), recoveryAcceptedResponse.data);
for (const result of [
  { ...recoveryAcceptedResponse.data, extra: true },
  { ...recoveryAcceptedResponse.data, commandId: '550e8400-e29b-41d4-a716-446655440001' },
  { ...recoveryAcceptedResponse.data, recoveryRpcLabel: 'wrong' },
  { ...recoveryAcceptedResponse.data, acceptedAt: 'invalid' },
  {
    ...recoveryAcceptedResponse.data,
    acceptedAt: new Date(timeoutNow.getTime() + 60_001).toISOString(),
  },
] as const) {
  assert.throws(
    () => validateFarmBotWorkerRecoveryExecutionResult({
      request: recoveryWorkerRequest,
      result,
      now: timeoutNow,
    }),
    FarmBotWorkerRecoveryExecutionResultError
  );
}
let releaseFirstRecovery!: () => void;
const firstRecoveryPending = new Promise<void>((resolve) => {
  releaseFirstRecovery = resolve;
});
const recoveryGateNow = new Date();
let fakeRecoveryExecutionCount = 0;
const reportedRecoveryAcknowledgements: FarmBotWorkerRecoveryAcknowledgement[] = [];
let recoveryAcknowledgementFlushCount = 0;
const recoveryGate = new FarmBotWorkerRecoveryExecutionGate({
  async execute(request) {
    fakeRecoveryExecutionCount += 1;
    await firstRecoveryPending;
    return {
      commandId: request.commandId,
      recoveryRpcLabel: request.recoveryRpcLabel,
      acceptedAt: recoveryGateNow.toISOString(),
    };
  },
}, new ProcessLocalFarmBotWorkerDeviceExecutionArbiter(), {
  record(acknowledgement) {
    reportedRecoveryAcknowledgements.push(structuredClone(acknowledgement));
  },
  async flush() {
    recoveryAcknowledgementFlushCount += 1;
  },
});
const firstRecoveryExecution = recoveryGate.execute(recoveryWorkerRequest);
await assert.rejects(
  recoveryGate.execute(recoveryWorkerRequest),
  (error) => error instanceof FarmBotWorkerRecoveryGateError
    && error.code === 'duplicate_recovery'
);
const secondRecoveryRequest = parseFarmBotWorkerWaterOffRecoveryRequest({
  ...recoveryWorkerRequest,
  commandId: '550e8400-e29b-41d4-a716-446655440001',
  recoveryRpcLabel: 'threed_water_off_550e8400e29b41d4a716446655440001',
  recoveryRequiredAt: recoveryWorkerRequest.recoveryRequiredAt.toISOString(),
}, timeoutNow);
await assert.rejects(
  recoveryGate.execute(secondRecoveryRequest),
  (error) => error instanceof FarmBotWorkerRecoveryGateError
    && error.code === 'recovery_in_progress'
);
releaseFirstRecovery();
const firstRecoveryResult = await firstRecoveryExecution;
assert.equal(recoveryGate.observeResponse({
  farmbotId: 43,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
    errorCode: null,
  },
  receivedAt: new Date(recoveryGateNow.getTime() + 500).toISOString(),
}), null);
assert.equal(recoveryGate.observeResponse({
  farmbotId: 42,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: 'unknown_recovery_label',
    errorCode: null,
  },
  receivedAt: new Date(recoveryGateNow.getTime() + 500).toISOString(),
}), null);
const recoveryAcknowledgement = recoveryGate.observeResponse({
  farmbotId: 42,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
    errorCode: null,
  },
  receivedAt: new Date(recoveryGateNow.getTime() + 1_000).toISOString(),
});
assert.ok(recoveryAcknowledgement);
assert.deepEqual(recoveryAcknowledgement, {
  ownerId: workerCommand.ownerId,
  farmbotId: workerCommand.farmbotId,
  commandId: workerCommand.commandId,
  recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
  state: 'confirmed',
  errorCode: null,
  receivedAt: new Date(recoveryGateNow.getTime() + 1_000).toISOString(),
});
assert.deepEqual(reportedRecoveryAcknowledgements, [recoveryAcknowledgement]);
await recoveryGate.flushAcknowledgements();
assert.equal(recoveryAcknowledgementFlushCount, 1);
const recoveryAcknowledgementPayload = {
  version: 1,
  ...recoveryAcknowledgement,
};
const recoveryAcknowledgementReceipt = {
  success: true,
  data: {
    commandId: recoveryAcknowledgement.commandId,
    recoveryState: recoveryAcknowledgement.state,
  },
};
assert.deepEqual(parseFarmBotRecoveryAcknowledgementReceipt({
  response: recoveryAcknowledgementReceipt,
  acknowledgement: recoveryAcknowledgement,
}), recoveryAcknowledgementReceipt.data);
for (const response of [
  { ...recoveryAcknowledgementReceipt, extra: true },
  { ...recoveryAcknowledgementReceipt, success: false },
  { ...recoveryAcknowledgementReceipt, data: { ...recoveryAcknowledgementReceipt.data, extra: true } },
  { ...recoveryAcknowledgementReceipt, data: { ...recoveryAcknowledgementReceipt.data, commandId: '550e8400-e29b-41d4-a716-446655440001' } },
  { ...recoveryAcknowledgementReceipt, data: { ...recoveryAcknowledgementReceipt.data, recoveryState: 'failed' } },
] as const) {
  assert.throws(
    () => parseFarmBotRecoveryAcknowledgementReceipt({
      response,
      acknowledgement: recoveryAcknowledgement,
    }),
    FarmBotRecoveryAcknowledgementResponseError
  );
}
assert.deepEqual(parseFarmBotRecoveryAcknowledgement(
  recoveryAcknowledgementPayload,
  new Date(recoveryGateNow.getTime() + 1_000)
), {
  ...recoveryAcknowledgementPayload,
  receivedAt: new Date(recoveryAcknowledgement.receivedAt),
});
assert.equal(MAX_FARMBOT_RECOVERY_ACKNOWLEDGEMENT_BYTES, 1_024);
for (const invalid of [
  { ...recoveryAcknowledgementPayload, extra: true },
  { ...recoveryAcknowledgementPayload, ownerId: '' },
  { ...recoveryAcknowledgementPayload, farmbotId: 0 },
  { ...recoveryAcknowledgementPayload, commandId: 'invalid' },
  { ...recoveryAcknowledgementPayload, recoveryRpcLabel: 'wrong' },
  { ...recoveryAcknowledgementPayload, state: 'failed', errorCode: null },
  { ...recoveryAcknowledgementPayload, state: 'confirmed', errorCode: 'farmbot_recovery_rpc_error' },
  { ...recoveryAcknowledgementPayload, receivedAt: 'invalid' },
] as const) {
  assert.throws(
    () => parseFarmBotRecoveryAcknowledgement(
      invalid,
      new Date(recoveryGateNow.getTime() + 1_000)
    ),
    FarmBotRecoveryAcknowledgementInputError
  );
}
assert.equal(recoveryGate.observeResponse({
  farmbotId: 42,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
    errorCode: null,
  },
  receivedAt: new Date(recoveryGateNow.getTime() + 2_000).toISOString(),
}), null);
const failedRecoveryGate = new FarmBotWorkerRecoveryExecutionGate({
  async execute(request) {
    return {
      commandId: request.commandId,
      recoveryRpcLabel: request.recoveryRpcLabel,
      acceptedAt: new Date().toISOString(),
    };
  },
});
await failedRecoveryGate.execute(secondRecoveryRequest);
const failedRecoveryReceivedAt = new Date().toISOString();
assert.deepEqual(failedRecoveryGate.observeResponse({
  farmbotId: secondRecoveryRequest.farmbotId,
  response: {
    eventType: 'rpc_error',
    outcome: 'rejected',
    rpcLabel: secondRecoveryRequest.recoveryRpcLabel,
    errorCode: 'rpc_error',
  },
  receivedAt: failedRecoveryReceivedAt,
}), {
  ownerId: secondRecoveryRequest.ownerId,
  farmbotId: secondRecoveryRequest.farmbotId,
  commandId: secondRecoveryRequest.commandId,
  recoveryRpcLabel: secondRecoveryRequest.recoveryRpcLabel,
  state: 'failed',
  errorCode: 'farmbot_recovery_rpc_error',
  receivedAt: failedRecoveryReceivedAt,
});
assert.deepEqual(await recoveryGate.execute(recoveryWorkerRequest), firstRecoveryResult);
assert.equal(fakeRecoveryExecutionCount, 1);
await assert.rejects(
  recoveryGate.execute(Object.freeze({
    ...recoveryWorkerRequest,
    commandFingerprint: 'b'.repeat(64),
  })),
  (error) => error instanceof FarmBotWorkerRecoveryGateError
    && error.code === 'duplicate_recovery'
);
const disabledRecoveryGate = new FarmBotWorkerRecoveryExecutionGate(
  new DisabledFarmBotWorkerRecoveryExecutor()
);
await assert.rejects(
  disabledRecoveryGate.execute(recoveryWorkerRequest),
  FarmBotWorkerRecoveryDisabledError
);
await assert.rejects(
  disabledRecoveryGate.execute(recoveryWorkerRequest),
  FarmBotWorkerRecoveryDisabledError
);
const invalidRecoveryResultGate = new FarmBotWorkerRecoveryExecutionGate({
  async execute(request) {
    return {
      commandId: request.commandId,
      recoveryRpcLabel: 'wrong',
      acceptedAt: recoveryGateNow.toISOString(),
    };
  },
});
await assert.rejects(
  invalidRecoveryResultGate.execute(recoveryWorkerRequest),
  FarmBotWorkerRecoveryExecutionResultError
);
await assert.rejects(
  invalidRecoveryResultGate.execute(recoveryWorkerRequest),
  (error) => error instanceof FarmBotWorkerRecoveryGateError
    && error.code === 'duplicate_recovery'
);
const sharedCommandFirstArbiter = new ProcessLocalFarmBotWorkerDeviceExecutionArbiter();
let releaseSharedCommand!: () => void;
const sharedCommandPending = new Promise<void>((resolve) => {
  releaseSharedCommand = resolve;
});
const sharedCommandGate = new FarmBotWorkerCommandExecutionGate({
  async execute(request) {
    await sharedCommandPending;
    return {
      commandId: request.commandId,
      rpcLabel: request.rpcLabel,
      acceptedAt: new Date().toISOString(),
    };
  },
}, new DisabledFarmBotWorkerCommandAcknowledgementSink(), sharedCommandFirstArbiter);
const sharedRecoveryGate = new FarmBotWorkerRecoveryExecutionGate({
  async execute(request) {
    return {
      commandId: request.commandId,
      recoveryRpcLabel: request.recoveryRpcLabel,
      acceptedAt: new Date().toISOString(),
    };
  },
}, sharedCommandFirstArbiter);
const activeSharedCommand = sharedCommandGate.execute(workerCommand);
await assert.rejects(
  sharedRecoveryGate.execute(recoveryWorkerRequest),
  (error) => error instanceof FarmBotWorkerRecoveryGateError
    && error.code === 'recovery_in_progress'
);
releaseSharedCommand();
await activeSharedCommand;

const sharedRecoveryFirstArbiter = new ProcessLocalFarmBotWorkerDeviceExecutionArbiter();
let releaseSharedRecovery!: () => void;
const sharedRecoveryPending = new Promise<void>((resolve) => {
  releaseSharedRecovery = resolve;
});
const recoveryFirstGate = new FarmBotWorkerRecoveryExecutionGate({
  async execute(request) {
    await sharedRecoveryPending;
    return {
      commandId: request.commandId,
      recoveryRpcLabel: request.recoveryRpcLabel,
      acceptedAt: new Date().toISOString(),
    };
  },
}, sharedRecoveryFirstArbiter);
const commandSecondGate = new FarmBotWorkerCommandExecutionGate({
  async execute(request) {
    return {
      commandId: request.commandId,
      rpcLabel: request.rpcLabel,
      acceptedAt: new Date().toISOString(),
    };
  },
}, new DisabledFarmBotWorkerCommandAcknowledgementSink(), sharedRecoveryFirstArbiter);
const activeSharedRecovery = recoveryFirstGate.execute(recoveryWorkerRequest);
await assert.rejects(
  commandSecondGate.execute(workerCommand),
  (error) => error instanceof FarmBotWorkerCommandGateError
    && error.code === 'command_in_progress'
);
releaseSharedRecovery();
await activeSharedRecovery;
assert.deepEqual(parseFarmBotWorkerRecoveryAcceptedResponse({
  response: recoveryAcceptedResponse,
  recovery: recoveryWorkerRequest,
  now: timeoutNow,
}), {
  commandId: recoveryWorkerRequest.commandId,
  recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
  acceptedAt: timeoutNow,
});
for (const response of [
  { ...recoveryAcceptedResponse, extra: true },
  { ...recoveryAcceptedResponse, success: false },
  { ...recoveryAcceptedResponse, data: { ...recoveryAcceptedResponse.data, extra: true } },
  { ...recoveryAcceptedResponse, data: {
    ...recoveryAcceptedResponse.data,
    commandId: '550e8400-e29b-41d4-a716-446655440001',
  } },
  { ...recoveryAcceptedResponse, data: {
    ...recoveryAcceptedResponse.data,
    recoveryRpcLabel: 'wrong',
  } },
  { ...recoveryAcceptedResponse, data: {
    ...recoveryAcceptedResponse.data,
    acceptedAt: new Date(timeoutNow.getTime() + 60_001).toISOString(),
  } },
] as const) {
  assert.throws(
    () => parseFarmBotWorkerRecoveryAcceptedResponse({
      response,
      recovery: recoveryWorkerRequest,
      now: timeoutNow,
    }),
    FarmBotWorkerRecoveryResponseError
  );
}
const recoveryHandoffCalls: string[] = [];
const recoveryHandoff = await requestFarmBotWorkerRecoveryAcceptance({
  userId: ' owner-1 ',
  commandId: workerCommand.commandId.toUpperCase(),
  now: timeoutNow,
}, {
  async loadContext(input) {
    recoveryHandoffCalls.push('context');
    assert.deepEqual(input, {
      userId: 'owner-1',
      commandId: workerCommand.commandId,
      now: timeoutNow,
    });
    return {
      command: requiredRecoveryRecord,
      brokerDeviceId: workerCommand.brokerDeviceId,
    };
  },
  async submitToWorker(farmbotId, recoveryRequest) {
    recoveryHandoffCalls.push('worker');
    assert.equal(farmbotId, workerCommand.farmbotId);
    assert.deepEqual(recoveryRequest, recoveryWorkerRequest);
    return {
      commandId: recoveryRequest.commandId,
      recoveryRpcLabel: recoveryRequest.recoveryRpcLabel,
      acceptedAt: timeoutNow,
    };
  },
});
assert.deepEqual(recoveryHandoffCalls, ['context', 'worker']);
assert.deepEqual(recoveryHandoff, {
  commandId: workerCommand.commandId,
  recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
  workerAcceptedAt: timeoutNow,
});
const recoveryDispatchCalls: string[] = [];
const recoveryDispatch = await handOffAndRecordFarmBotWaterOffRecovery({
  userId: ' owner-1 ',
  commandId: workerCommand.commandId.toUpperCase(),
  now: timeoutNow,
}, {
  async handOff() {
    recoveryDispatchCalls.push('handoff');
    return recoveryHandoff;
  },
  async recordDispatch(input) {
    recoveryDispatchCalls.push('record');
    assert.deepEqual(input, {
      userId: 'owner-1',
      commandId: workerCommand.commandId,
      recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
      workerAcceptedAt: timeoutNow,
    });
    return {
      commandId: workerCommand.commandId,
      recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
      recoveryState: 'dispatched',
      recoveryDispatchedAt: timeoutNow,
    };
  },
});
assert.deepEqual(recoveryDispatchCalls, ['handoff', 'record']);
assert.deepEqual(recoveryDispatch, {
  commandId: workerCommand.commandId,
  recoveryState: 'dispatched',
  recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
  recoveryDispatchedAt: timeoutNow,
});
let invalidRecoveryReceiptRecorded = false;
await assert.rejects(
  handOffAndRecordFarmBotWaterOffRecovery({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now: timeoutNow,
  }, {
    async handOff() {
      return { ...recoveryHandoff, recoveryRpcLabel: 'wrong' };
    },
    async recordDispatch() {
      invalidRecoveryReceiptRecorded = true;
      throw new Error('must_not_record');
    },
  }),
  FarmBotRecoveryDispatchCoordinatorError
);
assert.equal(invalidRecoveryReceiptRecorded, false);
await assert.rejects(
  handOffAndRecordFarmBotWaterOffRecovery({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now: timeoutNow,
  }, {
    async handOff() {
      return recoveryHandoff;
    },
    async recordDispatch() {
      return {
        commandId: workerCommand.commandId,
        recoveryRpcLabel: recoveryWorkerRequest.recoveryRpcLabel,
        recoveryState: 'required',
        recoveryDispatchedAt: timeoutNow,
      };
    },
  }),
  FarmBotRecoveryDispatchCoordinatorError
);
let invalidRecoveryContextSubmitted = false;
await assert.rejects(
  requestFarmBotWorkerRecoveryAcceptance({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now: timeoutNow,
  }, {
    async loadContext() {
      return {
        command: { ...requiredRecoveryRecord, userId: 'different-owner' },
        brokerDeviceId: workerCommand.brokerDeviceId,
      };
    },
    async submitToWorker() {
      invalidRecoveryContextSubmitted = true;
      throw new Error('must_not_submit');
    },
  }),
  FarmBotRecoveryHandoffError
);
assert.equal(invalidRecoveryContextSubmitted, false);
await assert.rejects(
  requestFarmBotWorkerRecoveryAcceptance({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now: timeoutNow,
  }, {
    async loadContext() {
      return {
        command: requiredRecoveryRecord,
        brokerDeviceId: workerCommand.brokerDeviceId,
      };
    },
    async submitToWorker(_farmbotId, recoveryRequest) {
      return {
        commandId: recoveryRequest.commandId,
        recoveryRpcLabel: 'wrong',
        acceptedAt: timeoutNow,
      };
    },
  }),
  FarmBotRecoveryHandoffError
);
for (const invalid of [
  { ...recoveryWorkerRequest, recoveryRequiredAt: timeoutNow.toISOString(), topic: 'unsafe' },
  { ...recoveryWorkerRequest, recoveryRequiredAt: timeoutNow.toISOString(), celeryScript: {} },
  { ...recoveryWorkerRequest, recoveryRequiredAt: timeoutNow.toISOString(), durationMs: 5_000 },
  { ...recoveryWorkerRequest, recoveryRequiredAt: timeoutNow.toISOString(), peripheralPin: -1 },
  { ...recoveryWorkerRequest, recoveryRequiredAt: timeoutNow.toISOString(), recoveryState: 'dispatched' },
  { ...recoveryWorkerRequest, recoveryRequiredAt: timeoutNow.toISOString(), recoveryRpcLabel: 'wrong' },
] as const) {
  assert.throws(
    () => parseFarmBotWorkerWaterOffRecoveryRequest(invalid, timeoutNow),
    FarmBotWorkerRecoveryRequestError
  );
}
for (const command of [
  { ...requiredRecoveryRecord, policyVersion: 2 },
  { ...requiredRecoveryRecord, state: 'dispatched' },
  { ...requiredRecoveryRecord, durationMs: 10_000 },
  { ...requiredRecoveryRecord, dispatchedAt: null },
  { ...requiredRecoveryRecord, recoveryState: null },
  { ...requiredRecoveryRecord, recoveryRequiredAt: null },
] as const) {
  assert.throws(
    () => prepareFarmBotWorkerWaterOffRecoveryFromRequiredRecord({
      command,
      brokerDeviceId: workerCommand.brokerDeviceId,
      now: timeoutNow,
    }),
    FarmBotWorkerRecoveryRequestError
  );
}
let invalidTimeoutRequiredRecovery = false;
await assert.rejects(
  timeOutAndRequireFarmBotWaterRecovery({
    userId: 'owner-1',
    commandId: workerCommand.commandId,
    now: timeoutNow,
  }, {
    async recordTimeout() {
      return {
        commandId: workerCommand.commandId,
        userId: 'owner-1',
        state: 'dispatched',
        rejectionCode: null,
        dispatchedAt,
        terminalAt: null,
        recoveryState: null,
        recoveryRpcLabel: null,
        recoveryRequiredAt: null,
      };
    },
    async requireRecovery() {
      invalidTimeoutRequiredRecovery = true;
      throw new Error('must_not_require_recovery');
    },
  }),
  FarmBotCommandTimeoutCoordinatorError
);
assert.equal(invalidTimeoutRequiredRecovery, false);
assert.deepEqual(evaluateFarmBotWaterAcknowledgementTimeout({
  state: 'dispatched',
  dispatchedAt,
  now: new Date(dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS - 1),
}), {
  timedOut: false,
  recoveryRequired: false,
  deadline: new Date(dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS),
});
assert.deepEqual(evaluateFarmBotWaterAcknowledgementTimeout({
  state: 'dispatched',
  dispatchedAt,
  now: new Date(dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS),
}), {
  timedOut: true,
  recoveryRequired: true,
  deadline: new Date(dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS),
});
assert.deepEqual(evaluateFarmBotWaterAcknowledgementTimeout({
  state: 'acknowledged',
  dispatchedAt,
  now: new Date(dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS),
}), { timedOut: false, recoveryRequired: false, deadline: null });

const recovery = prepareFarmBotWaterOffRecovery({
  command: {
    commandId: '550e8400-e29b-41d4-a716-446655440000',
    semanticCommand: 'water',
    state: 'timed_out',
    peripheralPin: 8,
    durationMs: 5_000,
    commandFingerprint: 'a'.repeat(64),
    dispatchedAt,
  },
  brokerDeviceId: 'device_123',
});
assert.equal(recovery.rpcLabel, 'threed_water_off_550e8400e29b41d4a716446655440000');
assert.deepEqual(JSON.parse(recovery.payload), {
  kind: 'rpc_request',
  args: { label: recovery.rpcLabel },
  body: [
    { kind: 'write_pin', args: { pin_number: 8, pin_value: 0, pin_mode: 0 } },
  ],
});
assert.deepEqual(mapFarmBotWaterRecoveryAcknowledgement({
  expectedRpcLabel: recovery.rpcLabel,
  response: {
    eventType: 'rpc_ok',
    outcome: 'accepted',
    rpcLabel: recovery.rpcLabel,
    errorCode: null,
  },
}), { outcome: 'recovery_confirmed', errorCode: null });
assert.deepEqual(mapFarmBotWaterRecoveryAcknowledgement({
  expectedRpcLabel: recovery.rpcLabel,
  response: {
    eventType: 'rpc_error',
    outcome: 'rejected',
    rpcLabel: recovery.rpcLabel,
    errorCode: 'rpc_error',
  },
}), { outcome: 'recovery_failed', errorCode: 'farmbot_recovery_rpc_error' });
assert.throws(
  () => prepareFarmBotWaterOffRecovery({
    command: {
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      semanticCommand: 'water',
      state: 'validated',
      peripheralPin: 8,
      durationMs: 5_000,
      commandFingerprint: 'a'.repeat(64),
      dispatchedAt: null,
    },
    brokerDeviceId: 'device_123',
  }),
  FarmBotCommandDeliveryError
);
for (const invalid of [
  { state: 'requested' },
  { commandFingerprint: 'invalid' },
  { expiresAt: now },
] as const) {
  assert.throws(
    () => prepareFarmBotWaterDelivery({
      command: {
        commandId: '550e8400-e29b-41d4-a716-446655440000',
        semanticCommand: 'water',
        state: 'validated',
        peripheralPin: 8,
        durationMs: 5_000,
        commandFingerprint: 'a'.repeat(64),
        expiresAt: new Date(now.getTime() + 60_000),
        ...invalid,
      },
      brokerDeviceId: 'device_123',
      now,
    }),
    FarmBotCommandDeliveryError
  );
}
assert.throws(
  () => prepareFarmBotWaterDelivery({
    command: {
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      semanticCommand: 'water',
      state: 'validated',
      peripheralPin: 8,
      durationMs: 5_000,
      commandFingerprint: 'a'.repeat(64),
      expiresAt: new Date(now.getTime() + 60_000),
    },
    brokerDeviceId: 'invalid-device',
    now,
  }),
  FarmBotCommandDeliveryError
);

validationStep('Command lifecycle, acknowledgement, timeout, and Water-off recovery');

type FakeMqttListener = (...args: never[]) => void;
class FakeReadonlyMqttClient {
  readonly listeners = new Map<string, Set<FakeMqttListener>>();
  subscriptions: { topics: string[]; options: { qos: 0 } }[] = [];
  ended = false;

  on(event: string, listener: FakeMqttListener): this {
    const listeners = this.listeners.get(event) ?? new Set<FakeMqttListener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  off(event: string, listener: FakeMqttListener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args as never[]);
    }
  }

  async subscribeAsync(topics: string[], options: { qos: 0 }) {
    this.subscriptions.push({ topics, options });
    return topics.map((topic) => ({ topic, qos: 0 as const }));
  }

  async endAsync(): Promise<void> {
    this.ended = true;
    this.emit('close');
  }
}

const fakeMqttClient = new FakeReadonlyMqttClient();
const mqttConnectInputs: Array<{ brokerUrl: string; options: Record<string, unknown> }> = [];
const fakeMqttConnector: MqttConnector = async (brokerUrl, options) => {
  mqttConnectInputs.push({ brokerUrl, options: options as Record<string, unknown> });
  return fakeMqttClient;
};
const mqttMessages: Array<{ topic: string; payload: Uint8Array }> = [];
let mqttConnected = 0;
let mqttDisconnected = 0;
const mqttConnection = await new MqttJsReadonlyTransport(fakeMqttConnector).connect(
  {
    brokerUrl: grant.mqttWsUrl,
    username: grant.brokerDeviceId,
    password: grant.credential,
    clientId: `marty_mcgee_farmbot_${grant.farmbotId}`,
    topics: ['bot/device_123/status', 'bot/device_123/from_device'],
  },
  {
    onConnected: () => { mqttConnected += 1; },
    onDisconnected: () => { mqttDisconnected += 1; },
    onMessage: (topic, payload) => mqttMessages.push({ topic, payload }),
  }
);
const mqttConnectInput = mqttConnectInputs[0];
assert.ok(mqttConnectInput);
assert.equal(mqttConnectInput.brokerUrl, claims.mqtt_ws);
assert.equal(mqttConnectInput.options.username, claims.bot);
assert.equal(
  Buffer.from(mqttConnectInput.options.password as Uint8Array).toString('utf8'),
  credential
);
assert.equal(mqttConnectInput.options.reconnectPeriod, 0);
assert.equal(mqttConnectInput.options.resubscribe, false);
assert.equal(mqttConnectInput.options.rejectUnauthorized, true);
assert.deepEqual(fakeMqttClient.subscriptions, [{
  topics: ['bot/device_123/status', 'bot/device_123/from_device'],
  options: { qos: 0 },
}]);
assert.equal(mqttConnected, 1);
fakeMqttClient.emit('message', 'bot/device_123/status', Buffer.from('{"safe":true}'));
assert.equal(mqttMessages.length, 1);
await mqttConnection.close();
assert.equal(fakeMqttClient.ended, true);
assert.equal(mqttDisconnected, 0, 'Intentional close must not report a transport failure');
assert.throws(
  () => parseFarmBotWorkerConnectionGrant({
    ...grantPayload,
    grantExpiresAt: new Date(now.getTime() - 1).toISOString(),
  }, now),
  FarmBotWorkerGrantError
);
validationStep('Read-only MQTT.js transport security and cleanup');

const authKey = randomBytes(32).toString('base64');
const otherAuthKey = randomBytes(32).toString('base64');
const authBody = Buffer.from(JSON.stringify(grantPayload));
const authInput = {
  method: 'PUT',
  path: '/internal/v1/farmbots/42/session',
  timestamp: String(now.getTime()),
  nonce: randomBytes(18).toString('base64url'),
  body: authBody,
};
const headers = signMqttWorkerRequest(authInput, authKey);
const nonceStore = new MqttWorkerNonceStore();
assert.doesNotThrow(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers },
  authKey,
  nonceStore,
  now.getTime()
));
assert.throws(
  () => verifyMqttWorkerRequest(
    { ...authInput, ...headers },
    authKey,
    nonceStore,
    now.getTime()
  ),
  (error: unknown) => error instanceof MqttWorkerAuthError
    && error.code === 'replayed_nonce'
);
assert.throws(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers, nonce: randomBytes(18).toString('base64url') },
  otherAuthKey,
  new MqttWorkerNonceStore(),
  now.getTime()
));
assert.throws(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers, body: Buffer.from('tampered') },
  authKey,
  new MqttWorkerNonceStore(),
  now.getTime()
));
assert.throws(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers },
  authKey,
  new MqttWorkerNonceStore(),
  now.getTime() + 61_000
));
validationStep('Worker HMAC authentication, expiry, and replay protection');

assert.deepEqual(farmBotWorkerTopics('device_123'), {
  status: 'bot/device_123/status',
  fromDevice: 'bot/device_123/from_device',
});
assert.deepEqual(parseFarmBotWorkerStatusPayload(Buffer.from(JSON.stringify({
  location_data: { position: { x: 10, y: 20, z: -3 } },
  private_tree: { discarded: true },
}))), { x: 10, y: 20, z: -3 });
assert.throws(() => parseFarmBotWorkerStatusPayload(Buffer.from('{invalid')));
assert.throws(() => farmBotWorkerTopics('device_123/#'));
assert.doesNotThrow(() => validateMqttReadonlyIntegrationAdapter(farmBotMqttReadonlyAdapter));
assert.deepEqual(farmBotMqttReadonlyAdapter.identify(grant), {
  integrationType: 'farmbot',
  integrationId: 42,
  ownerId: 'owner-1',
  clientId: 'device_123',
});
assert.deepEqual(farmBotMqttReadonlyAdapter.buildConnection(grant), {
  brokerUrl: 'mqtts://broker.example.com:8883',
  username: 'device_123',
  password: credential,
  clientId: 'marty_mcgee_farmbot_42',
  topics: ['bot/device_123/status', 'bot/device_123/from_device'],
});
assert.equal(
  farmBotMqttReadonlyAdapter.acceptsTopic(grant, 'bot/device_123/status'),
  true
);
assert.equal(
  farmBotMqttReadonlyAdapter.acceptsTopic(grant, 'bot/device_123/unapproved'),
  false
);
assert.deepEqual(farmBotMqttReadonlyAdapter.normalizeMessage(
  grant,
  'bot/device_123/status',
  Buffer.from(JSON.stringify({ location_data: { position: { x: 4, y: 5, z: 6 } } }))
), { kind: 'status', position: { x: 4, y: 5, z: 6 } });
assert.equal(farmBotMqttReadonlyAdapter.normalizeMessage(
  grant,
  'bot/device_123/unapproved',
  Buffer.from('{}')
), null);
validationStep('FarmBot topic allowlist and inbound message normalization');

class FakeTransport implements MqttReadonlyTransport {
  connectCount = 0;
  closeCount = 0;
  failConnect = false;
  callbacks: MqttReadonlyTransportCallbacks | null = null;
  requests: MqttReadonlyConnectionRequest[] = [];

  async connect(
    request: MqttReadonlyConnectionRequest,
    callbacks: MqttReadonlyTransportCallbacks
  ): Promise<MqttReadonlyTransportConnection> {
    this.connectCount += 1;
    this.requests.push(structuredClone(request));
    if (this.failConnect) throw new Error('offline transport failure');
    this.callbacks = callbacks;
    callbacks.onConnected();
    return {
      close: async () => {
        this.closeCount += 1;
      },
    };
  }
}

class FakePersistenceSink implements FarmBotWorkerPersistenceSink {
  records: FarmBotWorkerPersistenceRecord[] = [];
  flushCount = 0;

  record(record: FarmBotWorkerPersistenceRecord): void {
    this.records.push(structuredClone(record));
  }

  async flush(): Promise<void> {
    this.flushCount += 1;
  }
}

let testNow = new Date(now);
const transport = new FakeTransport();
const persistence = new FakePersistenceSink();
const registry = new FarmBotWorkerSessionRegistry(transport, {
  now: () => new Date(testNow),
  staleAfterMs: 30_000,
  maxReconnectAttempts: 2,
  reconnectBaseDelayMs: 0,
  reconnectMaxDelayMs: 0,
}, persistence);
assert.equal((await registry.connect(grant)).connectionState, 'connected');
assert.equal(transport.connectCount, 1);
assert.equal(transport.requests[0]?.brokerUrl, 'mqtts://broker.example.com:8883');
assert.equal(transport.requests[0]?.username, 'device_123');
assert.deepEqual(transport.requests[0]?.topics, [
  'bot/device_123/status',
  'bot/device_123/from_device',
]);
assert.equal((await registry.connect(grant)).connectionState, 'connected');
assert.equal(transport.connectCount, 1, 'Matching grants must be idempotent');
await assert.rejects(
  registry.connect({ ...grant, ownerId: 'different-owner' }),
  FarmBotWorkerSessionScopeError
);
assert.equal(transport.connectCount, 1, 'Owner mismatch must not replace the current session');

transport.callbacks?.onMessage(
  'bot/device_123/status',
  Buffer.from(JSON.stringify({ location_data: { position: { x: 1, y: 2, z: 3 } } }))
);
assert.deepEqual(registry.get(42)?.position, { x: 1, y: 2, z: 3 });
assert.equal(registry.get(42)?.stale, false);
assert.equal(registry.assertCommandSession({
  farmbotId: 42,
  ownerId: 'owner-1',
  brokerDeviceId: 'device_123',
}).connectionState, 'connected');
assert.throws(
  () => registry.assertCommandSession({
    farmbotId: 42,
    ownerId: 'different-owner',
    brokerDeviceId: 'device_123',
  }),
  (error) => error instanceof FarmBotWorkerCommandSessionError
    && error.code === 'scope_mismatch'
);
const firstPositionRecordCount = persistence.records.filter(
  (record) => record.event?.eventType === 'position'
).length;
transport.callbacks?.onMessage(
  'bot/device_123/status',
  Buffer.from(JSON.stringify({ location_data: { position: { x: 1, y: 2, z: 3 } } }))
);
assert.equal(
  persistence.records.filter((record) => record.event?.eventType === 'position').length,
  firstPositionRecordCount,
  'Unchanged positions inside the heartbeat window must not append history'
);
transport.callbacks?.onMessage(
  'bot/device_123/from_device',
  Buffer.from(JSON.stringify({ kind: 'rpc_ok', args: { label: 'test_rpc_1' } }))
);
assert.equal(
  persistence.records.some((record) => record.event?.eventType === 'rpc_ok'
    && record.event.rpcLabel === 'test_rpc_1'),
  true
);
assert.equal(JSON.stringify(persistence.records).includes(credential), false);
transport.callbacks?.onMessage('bot/device_123/unapproved', Buffer.from('{}'));
assert.equal(registry.get(42)?.invalidMessageCount, 1);
assert.equal(registry.get(42)?.lastMessageAt, now.toISOString());
transport.callbacks?.onMessage('bot/device_123/status', Buffer.from('{invalid'));
assert.equal(registry.get(42)?.invalidMessageCount, 2);
assert.equal(registry.get(42)?.lastMessageAt, testNow.toISOString());

testNow = new Date(now.getTime() + 31_000);
assert.equal(registry.get(42)?.stale, true);
assert.throws(
  () => registry.assertCommandSession({
    farmbotId: 42,
    ownerId: 'owner-1',
    brokerDeviceId: 'device_123',
  }),
  (error) => error instanceof FarmBotWorkerCommandSessionError
    && error.code === 'session_not_ready'
);
transport.callbacks?.onDisconnected('network_closed');
assert.equal(registry.get(42)?.connectionState, 'reconnecting');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(transport.connectCount, 2);
assert.equal(registry.get(42)?.connectionState, 'connected');
transport.failConnect = true;
transport.callbacks?.onDisconnected('network_closed');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(registry.get(42)?.connectionState, 'error');
await Promise.resolve();

assert.equal(await registry.disconnect(42), true);
assert.equal(transport.closeCount, 0);
assert.equal(registry.get(42), null);
assert.deepEqual(
  persistence.records
    .filter((record) => record.event?.eventType === 'connection_state')
    .map((record) => record.event?.connectionState),
  [
    'connecting',
    'connected',
    'reconnecting',
    'connected',
    'reconnecting',
    'error',
    'disconnected',
  ]
);
await registry.shutdown();
assert.equal(persistence.flushCount, 1);
validationStep('Session lifecycle, freshness, reconnect limits, and credential cleanup');

const originalFetch = globalThis.fetch;
const persistenceRequests: Array<Record<string, unknown>> = [];
let failNextPersistenceRequest = true;
let mismatchNextCommandReceipt = false;
let mismatchNextRecoveryReceipt = false;
let mismatchNextTimeoutReceipt = false;
assert.ok(
  createFarmBotWorkerRecoveryAcknowledgementSink({ NODE_ENV: 'test' })
    instanceof DisabledFarmBotWorkerRecoveryAcknowledgementSink
);
assert.throws(() => createFarmBotWorkerRecoveryAcknowledgementSink({
  NODE_ENV: 'test',
  THREED_MQTT_APP_BASE_URL: 'http://127.0.0.1:3000',
}));
assert.ok(
  createFarmBotWorkerCommandTimeoutSink({ NODE_ENV: 'test' })
    instanceof DisabledFarmBotWorkerCommandTimeoutSink
);
assert.throws(() => createFarmBotWorkerCommandTimeoutSink({
  NODE_ENV: 'test',
  THREED_MQTT_APP_BASE_URL: 'http://127.0.0.1:3000',
}));
assert.ok(
  createFarmBotWorkerTimeoutReconciliationRunner({ NODE_ENV: 'test' })
    instanceof DisabledFarmBotWorkerTimeoutReconciliationRunner
);
assert.throws(() => createFarmBotWorkerTimeoutReconciliationRunner({
  NODE_ENV: 'test',
  THREED_MQTT_APP_BASE_URL: 'http://127.0.0.1:3000',
}));
assert.throws(() => createFarmBotWorkerCommandTimeoutSink({
  NODE_ENV: 'test',
  THREED_MQTT_WORKER_TO_APP_HMAC_KEY: authKey,
}));
assert.throws(() => createFarmBotWorkerRecoveryAcknowledgementSink({
  NODE_ENV: 'test',
  THREED_MQTT_WORKER_TO_APP_HMAC_KEY: authKey,
}));
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  persistenceRequests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
  if (failNextPersistenceRequest) {
    failNextPersistenceRequest = false;
    return new Response(null, { status: 503 });
  }
  const requestUrl = input instanceof Request ? input.url : String(input);
  if (new URL(requestUrl).pathname
    === '/api/internal/threed-mqtt/farmbot/commands/timeouts/reconcile') {
    return Response.json({
      success: true,
      data: { examined: 0, reconciled: 0, skipped: 0 },
    });
  }
  if (new URL(requestUrl).pathname
    === '/api/internal/threed-mqtt/farmbot/commands/timeouts') {
    const report = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const commandId = mismatchNextTimeoutReceipt
      ? '550e8400-e29b-41d4-a716-446655440001'
      : report.commandId;
    mismatchNextTimeoutReceipt = false;
    return Response.json({
      success: true,
      data: {
        commandId,
        state: 'timed_out',
        recoveryState: 'required',
        recoveryRpcLabel: farmBotCommandRecoveryRpcLabel(String(report.commandId)),
      },
    }, { status: 202 });
  }
  if (new URL(requestUrl).pathname
    === '/api/internal/threed-mqtt/farmbot/commands/acknowledgements') {
    const acknowledgement = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const commandId = mismatchNextCommandReceipt
      ? '550e8400-e29b-41d4-a716-446655440001'
      : acknowledgement.commandId;
    mismatchNextCommandReceipt = false;
    return Response.json({
      success: true,
      data: {
        commandId,
        state: acknowledgement.state === 'acknowledged' ? 'completed' : 'rejected',
      },
    }, { status: 202 });
  }
  if (new URL(requestUrl).pathname
    === '/api/internal/threed-mqtt/farmbot/recoveries/acknowledgements') {
    const acknowledgement = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const commandId = mismatchNextRecoveryReceipt
      ? '550e8400-e29b-41d4-a716-446655440001'
      : acknowledgement.commandId;
    mismatchNextRecoveryReceipt = false;
    return Response.json({
      success: true,
      data: {
        commandId,
        recoveryState: acknowledgement.state,
      },
    }, { status: 202 });
  }
  return new Response(null, { status: 204 });
}) as typeof fetch;
try {
  const httpPersistence = new HttpFarmBotWorkerPersistenceSink(
    'http://127.0.0.1:3000',
    authKey
  );
  const runtime = persistence.records.at(-1)?.runtime;
  assert.ok(runtime);
  for (let index = 0; index < 201; index += 1) {
    httpPersistence.record({
      ownerId: grant.ownerId,
      farmbotId: grant.farmbotId,
      brokerDeviceId: grant.brokerDeviceId,
      workerSessionId: '00000000-0000-4000-8000-000000000001',
      runtime,
      event: {
        eventId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        source: 'status',
        eventType: 'position',
        connectionState: 'connected',
        outcome: null,
        rpcLabel: null,
        errorCode: null,
        summary: 'test position',
        position: { x: index, y: 0, z: 0 },
        payloadBytes: 1,
        payloadSha256: 'a'.repeat(64),
        occurredAt: now,
      },
    });
  }
  await httpPersistence.flush();
  assert.equal(persistenceRequests.length, 1);
  await httpPersistence.flush();
  const retriedEventCount = persistenceRequests.slice(1).reduce((total, request) => (
    total + ((request.events as unknown[])?.length ?? 0)
  ), 0);
  assert.equal(retriedEventCount, 201, 'A failed batch must retain all later unsent events');
  assert.ok(correlatedAcknowledgement);
  const requestsBeforeAcknowledgement = persistenceRequests.length;
  const httpAcknowledgements = new HttpFarmBotWorkerCommandAcknowledgementSink(
    'http://127.0.0.1:3000',
    authKey
  );
  failNextPersistenceRequest = true;
  httpAcknowledgements.record(correlatedAcknowledgement);
  await httpAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeAcknowledgement + 1);
  await httpAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeAcknowledgement + 2);
  assert.deepEqual(persistenceRequests.at(-1), {
    version: 1,
    ...correlatedAcknowledgement,
  });
  const requestsBeforeMismatchedCommandReceipt = persistenceRequests.length;
  mismatchNextCommandReceipt = true;
  httpAcknowledgements.record(correlatedAcknowledgement);
  await httpAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeMismatchedCommandReceipt + 1);
  await httpAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeMismatchedCommandReceipt + 2);
  const requestsBeforeRecoveryAcknowledgement = persistenceRequests.length;
  const httpRecoveryAcknowledgements = new HttpFarmBotWorkerRecoveryAcknowledgementSink(
    'http://127.0.0.1:3000',
    authKey
  );
  failNextPersistenceRequest = true;
  httpRecoveryAcknowledgements.record(recoveryAcknowledgement);
  await httpRecoveryAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeRecoveryAcknowledgement + 1);
  await httpRecoveryAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeRecoveryAcknowledgement + 2);
  assert.deepEqual(persistenceRequests.at(-1), {
    version: 1,
    ...recoveryAcknowledgement,
  });
  const requestsBeforeMismatchedReceipt = persistenceRequests.length;
  mismatchNextRecoveryReceipt = true;
  httpRecoveryAcknowledgements.record(recoveryAcknowledgement);
  await httpRecoveryAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeMismatchedReceipt + 1);
  await httpRecoveryAcknowledgements.flush();
  assert.equal(persistenceRequests.length, requestsBeforeMismatchedReceipt + 2);
  const requestsBeforeTimeout = persistenceRequests.length;
  const httpTimeouts = new HttpFarmBotWorkerCommandTimeoutSink(
    'http://127.0.0.1:3000',
    authKey
  );
  failNextPersistenceRequest = true;
  httpTimeouts.record(workerTimeoutReport);
  await httpTimeouts.flush();
  assert.equal(persistenceRequests.length, requestsBeforeTimeout + 1);
  await httpTimeouts.flush();
  assert.equal(persistenceRequests.length, requestsBeforeTimeout + 2);
  const requestsBeforeMismatchedTimeout = persistenceRequests.length;
  mismatchNextTimeoutReceipt = true;
  httpTimeouts.record(workerTimeoutReport);
  await httpTimeouts.flush();
  assert.equal(persistenceRequests.length, requestsBeforeMismatchedTimeout + 1);
  await httpTimeouts.flush();
  assert.equal(persistenceRequests.length, requestsBeforeMismatchedTimeout + 2);
  const requestsBeforeReconciliation = persistenceRequests.length;
  const reconciliationRunner = new HttpFarmBotWorkerTimeoutReconciliationRunner(
    'http://127.0.0.1:3000',
    authKey,
    50,
    60_000
  );
  reconciliationRunner.start();
  await reconciliationRunner.shutdown();
  assert.equal(persistenceRequests.length, requestsBeforeReconciliation + 1);
  assert.deepEqual(persistenceRequests.at(-1), { version: 1, limit: 50 });
} finally {
  globalThis.fetch = originalFetch;
}
validationStep('Runtime/event persistence batching and command/recovery acknowledgement retry');

const httpWorkerTransport = new FakeTransport();
const workerServer = createFarmBotWorkerServer(
  authKey,
  new DisabledFarmBotWorkerPersistenceSink(),
  httpWorkerTransport,
  'mqttjs'
);
await new Promise<void>((resolve, reject) => {
  workerServer.server.once('error', reject);
  workerServer.server.listen(0, '127.0.0.1', resolve);
});
const address = workerServer.server.address() as AddressInfo;
const origin = `http://127.0.0.1:${address.port}`;

const healthResponse = await fetch(`${origin}/health`);
assert.equal(healthResponse.status, 200);
const healthBody = await healthResponse.json() as Record<string, unknown>;
assert.equal(healthBody.ok, true);
assert.equal(healthBody.mqttTransport, 'mqttjs');
assert.equal(healthBody.commandsEnabled, false);

const liveNow = new Date();
const liveClaims = {
  ...claims,
  iat: Math.floor(liveNow.getTime() / 1000) - 60,
  exp: Math.floor(liveNow.getTime() / 1000) + 3_600,
};
const liveCredential = testJwt(liveClaims);
const liveGrantPayload = {
  ...grantPayload,
  tokenIssuedAt: new Date(liveClaims.iat * 1_000).toISOString(),
  tokenExpiresAt: new Date(liveClaims.exp * 1_000).toISOString(),
  grantIssuedAt: liveNow.toISOString(),
  grantExpiresAt: new Date(liveNow.getTime() + 120_000).toISOString(),
  credential: liveCredential,
};
const liveAuthBody = Buffer.from(JSON.stringify(liveGrantPayload));
const requestPath = '/internal/v1/farmbots/42/session';
const requestTimestamp = String(Date.now());
const requestNonce = randomBytes(18).toString('base64url');
const requestHeaders = signMqttWorkerRequest({
  method: 'PUT',
  path: requestPath,
  timestamp: requestTimestamp,
  nonce: requestNonce,
  body: liveAuthBody,
}, authKey);
const httpHeaders = {
  'content-type': 'application/json',
  'x-threed-mqtt-worker-version': requestHeaders.version,
  'x-threed-mqtt-worker-timestamp': requestHeaders.timestamp,
  'x-threed-mqtt-worker-nonce': requestHeaders.nonce,
  'x-threed-mqtt-worker-signature': requestHeaders.signature,
};
const connectResponse = await fetch(`${origin}${requestPath}`, {
  method: 'PUT',
  headers: httpHeaders,
  body: liveAuthBody,
});
assert.equal(connectResponse.status, 202, 'The fake transport should establish the test session');
const connectBody = JSON.stringify(await connectResponse.json());
assert.ok(!connectBody.includes(liveCredential), 'Worker responses must not expose credentials');

const replayResponse = await fetch(`${origin}${requestPath}`, {
  method: 'PUT',
  headers: httpHeaders,
  body: liveAuthBody,
});
assert.equal(replayResponse.status, 401, 'Signed requests must not be replayable');

const disabledCommandExecutor = new DisabledFarmBotWorkerCommandExecutor();
await assert.rejects(
  disabledCommandExecutor.execute(parseFarmBotWorkerWaterCommandRequest({
    ...workerCommandPayload,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  })),
  FarmBotWorkerCommandsDisabledError
);
const commandPath = '/internal/v1/farmbots/42/commands';
const commandBody = Buffer.from(JSON.stringify({
  ...workerCommandPayload,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
}));
const commandHeaders = signMqttWorkerRequest({
  method: 'POST',
  path: commandPath,
  timestamp: String(Date.now()),
  nonce: randomBytes(18).toString('base64url'),
  body: commandBody,
}, authKey);
const commandResponse = await fetch(`${origin}${commandPath}`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-threed-mqtt-worker-version': commandHeaders.version,
    'x-threed-mqtt-worker-timestamp': commandHeaders.timestamp,
    'x-threed-mqtt-worker-nonce': commandHeaders.nonce,
    'x-threed-mqtt-worker-signature': commandHeaders.signature,
  },
  body: commandBody,
});
assert.equal(commandResponse.status, 409, 'Commands require a matching fresh worker session');

httpWorkerTransport.callbacks?.onMessage(
  'bot/device_123/status',
  Buffer.from(JSON.stringify({ location_data: { position: { x: 1, y: 2, z: 3 } } }))
);
const disabledRecoveryExecutor = new DisabledFarmBotWorkerRecoveryExecutor();
await assert.rejects(
  disabledRecoveryExecutor.execute(recoveryWorkerRequest),
  FarmBotWorkerRecoveryDisabledError
);
const recoveryPath = '/internal/v1/farmbots/42/recoveries';
const liveRecoveryRequiredAt = new Date();
const recoveryBody = Buffer.from(JSON.stringify({
  ...recoveryWorkerRequest,
  recoveryRequiredAt: liveRecoveryRequiredAt.toISOString(),
}));
const recoveryHeaders = signMqttWorkerRequest({
  method: 'POST',
  path: recoveryPath,
  timestamp: String(Date.now()),
  nonce: randomBytes(18).toString('base64url'),
  body: recoveryBody,
}, authKey);
const recoveryResponse = await fetch(`${origin}${recoveryPath}`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-threed-mqtt-worker-version': recoveryHeaders.version,
    'x-threed-mqtt-worker-timestamp': recoveryHeaders.timestamp,
    'x-threed-mqtt-worker-nonce': recoveryHeaders.nonce,
    'x-threed-mqtt-worker-signature': recoveryHeaders.signature,
  },
  body: recoveryBody,
});
assert.equal(recoveryResponse.status, 503, 'The default recovery executor must remain disabled');
assert.deepEqual(await recoveryResponse.json(), {
  success: false,
  error: 'FarmBot recovery is disabled',
});
validationStep('Signed worker HTTP routes and disabled command/recovery boundaries');

await workerServer.registry.shutdown();
await new Promise<void>((resolve, reject) => {
  workerServer.server.close((error) => error ? reject(error) : resolve());
});

console.log('─'.repeat(40));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
console.log('FarmBot MQTT worker Phase 2B/2C offline validation passed\n');
