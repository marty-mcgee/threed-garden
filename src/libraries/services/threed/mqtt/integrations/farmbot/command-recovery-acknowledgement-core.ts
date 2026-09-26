import { farmBotCommandRecoveryRpcLabel } from '../../../farmbot/command-lifecycle-core';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS = new Set([
  'version',
  'ownerId',
  'farmbotId',
  'commandId',
  'recoveryRpcLabel',
  'state',
  'errorCode',
  'receivedAt',
]);

export const MAX_FARMBOT_RECOVERY_ACKNOWLEDGEMENT_BYTES = 1024;

export interface FarmBotRecoveryAcknowledgementInput {
  version: 1;
  ownerId: string;
  farmbotId: number;
  commandId: string;
  recoveryRpcLabel: string;
  state: 'confirmed' | 'failed';
  errorCode: 'farmbot_recovery_rpc_error' | null;
  receivedAt: Date;
}

export class FarmBotRecoveryAcknowledgementInputError extends Error {
  constructor() {
    super('invalid_farmbot_recovery_acknowledgement');
    this.name = 'FarmBotRecoveryAcknowledgementInputError';
  }
}

function invalid(): never {
  throw new FarmBotRecoveryAcknowledgementInputError();
}

export function parseFarmBotRecoveryAcknowledgement(
  payload: unknown,
  now = new Date()
): Readonly<FarmBotRecoveryAcknowledgementInput> {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof payload !== 'object' || payload === null || Array.isArray(payload)) return invalid();
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).length !== FIELDS.size
    || Object.keys(input).some((field) => !FIELDS.has(field))
    || input.version !== 1
    || typeof input.ownerId !== 'string' || !input.ownerId.trim() || input.ownerId.length > 255
    || !Number.isSafeInteger(input.farmbotId) || Number(input.farmbotId) <= 0
    || typeof input.commandId !== 'string' || !UUID_V4_PATTERN.test(input.commandId)
    || typeof input.recoveryRpcLabel !== 'string'
    || (input.state !== 'confirmed' && input.state !== 'failed')
    || typeof input.receivedAt !== 'string') {
    return invalid();
  }
  const commandId = input.commandId.toLowerCase();
  if (input.recoveryRpcLabel !== farmBotCommandRecoveryRpcLabel(commandId)
    || (input.state === 'confirmed' && input.errorCode !== null)
    || (input.state === 'failed' && input.errorCode !== 'farmbot_recovery_rpc_error')) {
    return invalid();
  }
  const receivedAt = new Date(input.receivedAt);
  if (Number.isNaN(receivedAt.valueOf()) || receivedAt.toISOString() !== input.receivedAt
    || receivedAt.getTime() > now.getTime() + 60_000) return invalid();
  return Object.freeze({
    version: 1,
    ownerId: input.ownerId.trim(),
    farmbotId: Number(input.farmbotId),
    commandId,
    recoveryRpcLabel: input.recoveryRpcLabel,
    state: input.state,
    errorCode: input.errorCode as 'farmbot_recovery_rpc_error' | null,
    receivedAt,
  });
}
