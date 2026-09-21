import type { FarmBotWorkerWaterOffRecoveryRequest } from './command-recovery-request-core';

const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['commandId', 'recoveryRpcLabel', 'acceptedAt']);
const MAX_CLOCK_SKEW_MS = 60_000;

export interface FarmBotWorkerRecoveryAcceptedResponse {
  commandId: string;
  recoveryRpcLabel: string;
  acceptedAt: Date;
}

export class FarmBotWorkerRecoveryResponseError extends Error {
  constructor(readonly code: 'invalid_response' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotWorkerRecoveryResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotWorkerRecoveryAcceptedResponse(input: {
  response: unknown;
  recovery: Readonly<FarmBotWorkerWaterOffRecoveryRequest>;
  now?: Date;
}): Readonly<FarmBotWorkerRecoveryAcceptedResponse> {
  const now = input.now ?? new Date();
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || !isRecord(input.response) || !hasExactFields(input.response, RESPONSE_FIELDS)
    || input.response.success !== true || !isRecord(input.response.data)
    || !hasExactFields(input.response.data, DATA_FIELDS)) {
    throw new FarmBotWorkerRecoveryResponseError('invalid_response');
  }

  const data = input.response.data;
  if (typeof data.commandId !== 'string' || typeof data.recoveryRpcLabel !== 'string'
    || typeof data.acceptedAt !== 'string') {
    throw new FarmBotWorkerRecoveryResponseError('invalid_response');
  }
  if (data.commandId.toLowerCase() !== input.recovery.commandId
    || data.recoveryRpcLabel !== input.recovery.recoveryRpcLabel) {
    throw new FarmBotWorkerRecoveryResponseError('identity_mismatch');
  }

  const acceptedAt = new Date(data.acceptedAt);
  if (Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== data.acceptedAt
    || Math.abs(acceptedAt.getTime() - now.getTime()) > MAX_CLOCK_SKEW_MS) {
    throw new FarmBotWorkerRecoveryResponseError('invalid_response');
  }

  return Object.freeze({
    commandId: input.recovery.commandId,
    recoveryRpcLabel: input.recovery.recoveryRpcLabel,
    acceptedAt,
  });
}
