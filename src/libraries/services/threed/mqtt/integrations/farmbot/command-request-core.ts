import { farmBotCommandRpcLabel } from '../../../farmbot/command-lifecycle-core';
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
  'state',
  'peripheralPin',
  'durationMs',
  'commandFingerprint',
  'rpcLabel',
  'expiresAt',
]);

export const MAX_FARMBOT_WORKER_COMMAND_REQUEST_BYTES = 2 * 1024;

export interface FarmBotWorkerWaterCommandRequest {
  version: 1;
  farmbotId: number;
  ownerId: string;
  brokerDeviceId: string;
  commandId: string;
  semanticCommand: 'water';
  state: 'accepted';
  peripheralPin: number;
  durationMs: typeof FARMBOT_WATER_DURATION_MS;
  commandFingerprint: string;
  rpcLabel: string;
  expiresAt: Date;
}

export interface FarmBotAcceptedCommandRecord {
  commandId: string;
  userId: string;
  farmbotId: number;
  policyVersion: number;
  semanticCommand: string;
  state: string;
  peripheralPin: number | null;
  durationMs: number | null;
  commandFingerprint: string | null;
  rpcLabel: string | null;
  acceptedAt: Date | null;
  expiresAt: Date;
}

export class FarmBotWorkerCommandRequestError extends Error {
  constructor(readonly code: 'invalid_request' | 'expired_command' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotWorkerCommandRequestError';
  }
}

function fail(code: FarmBotWorkerCommandRequestError['code'] = 'invalid_request'): never {
  throw new FarmBotWorkerCommandRequestError(code);
}

export function parseFarmBotWorkerWaterCommandRequest(
  payload: unknown,
  now = new Date()
): Readonly<FarmBotWorkerWaterCommandRequest> {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return fail();
  }
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).some((field) => !REQUEST_FIELDS.has(field))
    || Object.keys(input).length !== REQUEST_FIELDS.size
    || input.version !== 1
    || !Number.isSafeInteger(input.farmbotId) || Number(input.farmbotId) <= 0
    || typeof input.ownerId !== 'string' || !input.ownerId.trim() || input.ownerId.length > 255
    || typeof input.brokerDeviceId !== 'string'
    || !BROKER_DEVICE_PATTERN.test(input.brokerDeviceId)
    || typeof input.commandId !== 'string' || !COMMAND_ID_PATTERN.test(input.commandId)
    || input.semanticCommand !== 'water'
    || input.state !== 'accepted'
    || !Number.isSafeInteger(input.peripheralPin) || Number(input.peripheralPin) < 0
    || input.durationMs !== FARMBOT_WATER_DURATION_MS
    || typeof input.commandFingerprint !== 'string'
    || !FINGERPRINT_PATTERN.test(input.commandFingerprint)
    || typeof input.rpcLabel !== 'string'
    || typeof input.expiresAt !== 'string') {
    return fail();
  }

  const commandId = input.commandId.toLowerCase();
  if (input.rpcLabel !== farmBotCommandRpcLabel(commandId)) {
    return fail('identity_mismatch');
  }
  const expiresAt = new Date(input.expiresAt);
  if (Number.isNaN(expiresAt.valueOf()) || expiresAt.toISOString() !== input.expiresAt) {
    return fail();
  }
  if (expiresAt <= now) return fail('expired_command');

  return Object.freeze({
    version: 1,
    farmbotId: Number(input.farmbotId),
    ownerId: input.ownerId.trim(),
    brokerDeviceId: input.brokerDeviceId,
    commandId,
    semanticCommand: 'water',
    state: 'accepted',
    peripheralPin: Number(input.peripheralPin),
    durationMs: FARMBOT_WATER_DURATION_MS,
    commandFingerprint: input.commandFingerprint,
    rpcLabel: input.rpcLabel,
    expiresAt,
  });
}

export function prepareFarmBotWorkerWaterCommandSubmission(
  farmbotId: number,
  payload: unknown,
  now = new Date()
) {
  if (!Number.isSafeInteger(farmbotId) || farmbotId <= 0) return fail();
  const command = parseFarmBotWorkerWaterCommandRequest(payload, now);
  if (command.farmbotId !== farmbotId) return fail('identity_mismatch');
  return Object.freeze({
    path: `/internal/v1/farmbots/${farmbotId}/commands` as const,
    command,
  });
}

export function prepareFarmBotWorkerWaterCommandFromAcceptedRecord(input: {
  command: FarmBotAcceptedCommandRecord;
  brokerDeviceId: string;
  now?: Date;
}): Readonly<FarmBotWorkerWaterCommandRequest> {
  const now = input.now ?? new Date();
  const acceptedAt = input.command.acceptedAt;
  if (input.command.policyVersion !== 1
    || !(acceptedAt instanceof Date) || Number.isNaN(acceptedAt.valueOf())
    || !(input.command.expiresAt instanceof Date)
    || Number.isNaN(input.command.expiresAt.valueOf())
    || acceptedAt > now || acceptedAt >= input.command.expiresAt) {
    return fail();
  }

  return parseFarmBotWorkerWaterCommandRequest({
    version: 1,
    farmbotId: input.command.farmbotId,
    ownerId: input.command.userId,
    brokerDeviceId: input.brokerDeviceId,
    commandId: input.command.commandId,
    semanticCommand: input.command.semanticCommand,
    state: input.command.state,
    peripheralPin: input.command.peripheralPin,
    durationMs: input.command.durationMs,
    commandFingerprint: input.command.commandFingerprint,
    rpcLabel: input.command.rpcLabel,
    expiresAt: input.command.expiresAt.toISOString(),
  }, now);
}
