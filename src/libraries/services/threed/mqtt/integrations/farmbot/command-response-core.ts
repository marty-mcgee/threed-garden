import type { FarmBotWorkerWaterCommandRequest } from './command-request-core';

const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['commandId', 'rpcLabel', 'acceptedAt']);
const MAX_CLOCK_SKEW_MS = 60_000;

export interface FarmBotWorkerCommandAcceptedResponse {
  commandId: string;
  rpcLabel: string;
  acceptedAt: Date;
}

export class FarmBotWorkerCommandResponseError extends Error {
  constructor(readonly code: 'invalid_response' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotWorkerCommandResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotWorkerCommandAcceptedResponse(input: {
  response: unknown;
  command: Readonly<FarmBotWorkerWaterCommandRequest>;
  now?: Date;
}): Readonly<FarmBotWorkerCommandAcceptedResponse> {
  const now = input.now ?? new Date();
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || !isRecord(input.response) || !hasExactFields(input.response, RESPONSE_FIELDS)
    || input.response.success !== true || !isRecord(input.response.data)
    || !hasExactFields(input.response.data, DATA_FIELDS)) {
    throw new FarmBotWorkerCommandResponseError('invalid_response');
  }

  const data = input.response.data;
  if (typeof data.commandId !== 'string' || typeof data.rpcLabel !== 'string'
    || typeof data.acceptedAt !== 'string') {
    throw new FarmBotWorkerCommandResponseError('invalid_response');
  }
  if (data.commandId.toLowerCase() !== input.command.commandId
    || data.rpcLabel !== input.command.rpcLabel) {
    throw new FarmBotWorkerCommandResponseError('identity_mismatch');
  }

  const acceptedAt = new Date(data.acceptedAt);
  if (Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== data.acceptedAt
    || Math.abs(acceptedAt.getTime() - now.getTime()) > MAX_CLOCK_SKEW_MS) {
    throw new FarmBotWorkerCommandResponseError('invalid_response');
  }

  return Object.freeze({
    commandId: input.command.commandId,
    rpcLabel: input.command.rpcLabel,
    acceptedAt,
  });
}
