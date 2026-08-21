import type { FarmBotWorkerCommandAcknowledgement } from './command-execution-gate';

const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['commandId', 'state']);

export interface FarmBotCommandAcknowledgementReceipt {
  commandId: string;
  state: 'completed' | 'rejected';
}

export class FarmBotCommandAcknowledgementResponseError extends Error {
  constructor(readonly code: 'invalid_response' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotCommandAcknowledgementResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotCommandAcknowledgementReceipt(input: {
  response: unknown;
  acknowledgement: Readonly<FarmBotWorkerCommandAcknowledgement>;
}): Readonly<FarmBotCommandAcknowledgementReceipt> {
  if (!isRecord(input.response) || !hasExactFields(input.response, RESPONSE_FIELDS)
    || input.response.success !== true || !isRecord(input.response.data)
    || !hasExactFields(input.response.data, DATA_FIELDS)) {
    throw new FarmBotCommandAcknowledgementResponseError('invalid_response');
  }
  const expectedState = input.acknowledgement.state === 'acknowledged'
    ? 'completed' as const
    : 'rejected' as const;
  const data = input.response.data;
  if (typeof data.commandId !== 'string'
    || (data.state !== 'completed' && data.state !== 'rejected')) {
    throw new FarmBotCommandAcknowledgementResponseError('invalid_response');
  }
  if (data.commandId.toLowerCase() !== input.acknowledgement.commandId
    || data.state !== expectedState) {
    throw new FarmBotCommandAcknowledgementResponseError('identity_mismatch');
  }
  return Object.freeze({
    commandId: input.acknowledgement.commandId,
    state: expectedState,
  });
}
