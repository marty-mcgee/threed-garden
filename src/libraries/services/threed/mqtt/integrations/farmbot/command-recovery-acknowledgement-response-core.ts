import type { FarmBotWorkerRecoveryAcknowledgement } from './command-recovery-execution-gate';

const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['commandId', 'recoveryState']);

export interface FarmBotRecoveryAcknowledgementReceipt {
  commandId: string;
  recoveryState: 'confirmed' | 'failed';
}

export class FarmBotRecoveryAcknowledgementResponseError extends Error {
  constructor(readonly code: 'invalid_response' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotRecoveryAcknowledgementResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotRecoveryAcknowledgementReceipt(input: {
  response: unknown;
  acknowledgement: Readonly<FarmBotWorkerRecoveryAcknowledgement>;
}): Readonly<FarmBotRecoveryAcknowledgementReceipt> {
  if (!isRecord(input.response) || !hasExactFields(input.response, RESPONSE_FIELDS)
    || input.response.success !== true || !isRecord(input.response.data)
    || !hasExactFields(input.response.data, DATA_FIELDS)) {
    throw new FarmBotRecoveryAcknowledgementResponseError('invalid_response');
  }
  const data = input.response.data;
  if (typeof data.commandId !== 'string'
    || (data.recoveryState !== 'confirmed' && data.recoveryState !== 'failed')) {
    throw new FarmBotRecoveryAcknowledgementResponseError('invalid_response');
  }
  if (data.commandId.toLowerCase() !== input.acknowledgement.commandId
    || data.recoveryState !== input.acknowledgement.state) {
    throw new FarmBotRecoveryAcknowledgementResponseError('identity_mismatch');
  }
  return Object.freeze({
    commandId: input.acknowledgement.commandId,
    recoveryState: input.acknowledgement.state,
  });
}
