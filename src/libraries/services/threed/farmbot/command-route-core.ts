import type { FarmBotCommandState } from './command-policy-core.ts';

const REQUEST_FIELDS = new Set(['farmbotId', 'intent']);

export const FARMBOT_COMMAND_REQUEST_MAX_BYTES = 4_096;

export class FarmBotCommandRequestError extends Error {
  readonly code: 'invalid_request' | 'invalid_farmbot_id' | 'unexpected_request_field';

  constructor(code: 'invalid_request' | 'invalid_farmbot_id' | 'unexpected_request_field') {
    super(code);
    this.name = 'FarmBotCommandRequestError';
    this.code = code;
  }
}

export interface FarmBotCommandRequestEnvelope {
  farmbotId: number;
  intent: unknown;
}

export function parseFarmBotCommandRequestEnvelope(
  input: unknown
): FarmBotCommandRequestEnvelope {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new FarmBotCommandRequestError('invalid_request');
  }
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => !REQUEST_FIELDS.has(key))) {
    throw new FarmBotCommandRequestError('unexpected_request_field');
  }
  if (!Number.isSafeInteger(record.farmbotId) || Number(record.farmbotId) <= 0) {
    throw new FarmBotCommandRequestError('invalid_farmbot_id');
  }
  if (!Object.hasOwn(record, 'intent')) {
    throw new FarmBotCommandRequestError('invalid_request');
  }
  return Object.freeze({
    farmbotId: Number(record.farmbotId),
    intent: record.intent,
  });
}

export function toFarmBotCommandAuthorizationStatus(command: {
  commandId: string;
  semanticCommand: string;
  state: string;
  requestedAt: Date;
  validatedAt: Date | null;
  terminalAt: Date | null;
  expiresAt: Date;
  rejectionCode: string | null;
  durationMs: number | null;
}) {
  return Object.freeze({
    commandId: command.commandId,
    semanticCommand: command.semanticCommand,
    state: command.state as FarmBotCommandState,
    requestedAt: command.requestedAt,
    validatedAt: command.validatedAt,
    terminalAt: command.terminalAt,
    expiresAt: command.expiresAt,
    rejectionCode: command.rejectionCode,
    durationMs: command.durationMs,
    deliveryEnabled: false as const,
  });
}
