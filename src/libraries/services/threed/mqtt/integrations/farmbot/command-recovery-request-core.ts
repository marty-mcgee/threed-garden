import { farmBotCommandRecoveryRpcLabel } from '../../../farmbot/command-lifecycle-core';
import { FARMBOT_WATER_DURATION_MS } from '../../../farmbot/command-validation-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BROKER_DEVICE_PATTERN = /^device_[1-9]\d*$/;
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;
const REQUEST_FIELDS = new Set([
  'version',
  'farmbotId',
  'ownerId',
  'brokerDeviceId',
  'commandId',
  'semanticCommand',
  'recoveryState',
  'peripheralPin',
  'commandFingerprint',
  'recoveryRpcLabel',
  'recoveryRequiredAt',
]);

export const MAX_FARMBOT_WORKER_RECOVERY_REQUEST_BYTES = 2 * 1024;

export interface FarmBotWorkerWaterOffRecoveryRequest {
  version: 1;
  farmbotId: number;
  ownerId: string;
  brokerDeviceId: string;
  commandId: string;
  semanticCommand: 'water_off';
  recoveryState: 'required';
  peripheralPin: number;
  commandFingerprint: string;
  recoveryRpcLabel: string;
  recoveryRequiredAt: Date;
}

export interface FarmBotRequiredRecoveryRecord {
  commandId: string;
  userId: string;
  farmbotId: number;
  policyVersion: number;
  semanticCommand: string;
  state: string;
  peripheralPin: number | null;
  durationMs: number | null;
  commandFingerprint: string | null;
  dispatchedAt: Date | null;
  recoveryState: string | null;
  recoveryRpcLabel: string | null;
  recoveryRequiredAt: Date | null;
}

export class FarmBotWorkerRecoveryRequestError extends Error {
  constructor(readonly code: 'invalid_request' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotWorkerRecoveryRequestError';
  }
}

function fail(code: FarmBotWorkerRecoveryRequestError['code'] = 'invalid_request'): never {
  throw new FarmBotWorkerRecoveryRequestError(code);
}

export function parseFarmBotWorkerWaterOffRecoveryRequest(
  payload: unknown,
  now = new Date()
): Readonly<FarmBotWorkerWaterOffRecoveryRequest> {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return fail();
  }
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).length !== REQUEST_FIELDS.size
    || Object.keys(input).some((field) => !REQUEST_FIELDS.has(field))
    || input.version !== 1
    || !Number.isSafeInteger(input.farmbotId) || Number(input.farmbotId) <= 0
    || typeof input.ownerId !== 'string' || !input.ownerId.trim() || input.ownerId.length > 255
    || typeof input.brokerDeviceId !== 'string'
    || !BROKER_DEVICE_PATTERN.test(input.brokerDeviceId)
    || typeof input.commandId !== 'string' || !COMMAND_ID_PATTERN.test(input.commandId)
    || input.semanticCommand !== 'water_off'
    || input.recoveryState !== 'required'
    || !Number.isSafeInteger(input.peripheralPin) || Number(input.peripheralPin) < 0
    || typeof input.commandFingerprint !== 'string'
    || !FINGERPRINT_PATTERN.test(input.commandFingerprint)
    || typeof input.recoveryRpcLabel !== 'string'
    || typeof input.recoveryRequiredAt !== 'string') {
    return fail();
  }

  const commandId = input.commandId.toLowerCase();
  if (input.recoveryRpcLabel !== farmBotCommandRecoveryRpcLabel(commandId)) {
    return fail('identity_mismatch');
  }
  const recoveryRequiredAt = new Date(input.recoveryRequiredAt);
  if (Number.isNaN(recoveryRequiredAt.valueOf())
    || recoveryRequiredAt.toISOString() !== input.recoveryRequiredAt
    || recoveryRequiredAt.getTime() > now.getTime() + 60_000) {
    return fail();
  }

  return Object.freeze({
    version: 1,
    farmbotId: Number(input.farmbotId),
    ownerId: input.ownerId.trim(),
    brokerDeviceId: input.brokerDeviceId,
    commandId,
    semanticCommand: 'water_off',
    recoveryState: 'required',
    peripheralPin: Number(input.peripheralPin),
    commandFingerprint: input.commandFingerprint,
    recoveryRpcLabel: input.recoveryRpcLabel,
    recoveryRequiredAt,
  });
}

export function prepareFarmBotWorkerWaterOffRecoveryFromRequiredRecord(input: {
  command: FarmBotRequiredRecoveryRecord;
  brokerDeviceId: string;
  now?: Date;
}): Readonly<FarmBotWorkerWaterOffRecoveryRequest> {
  const now = input.now ?? new Date();
  const command = input.command;
  if (command.policyVersion !== 1 || command.semanticCommand !== 'water'
    || !['timed_out', 'rejected'].includes(command.state)
    || command.durationMs !== FARMBOT_WATER_DURATION_MS
    || !(command.dispatchedAt instanceof Date) || Number.isNaN(command.dispatchedAt.valueOf())
    || command.recoveryState !== 'required'
    || !(command.recoveryRequiredAt instanceof Date)
    || Number.isNaN(command.recoveryRequiredAt.valueOf())
    || command.recoveryRequiredAt < command.dispatchedAt) {
    return fail();
  }

  return parseFarmBotWorkerWaterOffRecoveryRequest({
    version: 1,
    farmbotId: command.farmbotId,
    ownerId: command.userId,
    brokerDeviceId: input.brokerDeviceId,
    commandId: command.commandId,
    semanticCommand: 'water_off',
    recoveryState: command.recoveryState,
    peripheralPin: command.peripheralPin,
    commandFingerprint: command.commandFingerprint,
    recoveryRpcLabel: command.recoveryRpcLabel,
    recoveryRequiredAt: command.recoveryRequiredAt.toISOString(),
  }, now);
}

export function prepareFarmBotWorkerWaterOffRecoverySubmission(
  farmbotId: number,
  payload: unknown,
  now = new Date()
) {
  if (!Number.isSafeInteger(farmbotId) || farmbotId <= 0) return fail();
  const recovery = parseFarmBotWorkerWaterOffRecoveryRequest(payload, now);
  if (recovery.farmbotId !== farmbotId) return fail('identity_mismatch');
  return Object.freeze({
    path: `/internal/v1/farmbots/${farmbotId}/recoveries` as const,
    recovery,
  });
}
