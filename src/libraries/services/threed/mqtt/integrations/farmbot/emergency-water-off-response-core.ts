import type { FarmBotWorkerEmergencyWaterOffRequest } from './emergency-water-off-request-core';

const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['emergencyId', 'rpcLabel', 'acceptedAt']);
const MAX_CLOCK_SKEW_MS = 60_000;

export interface FarmBotWorkerEmergencyWaterOffAcceptedResponse {
  emergencyId: string;
  rpcLabel: string;
  acceptedAt: Date;
}

export class FarmBotWorkerEmergencyWaterOffResponseError extends Error {
  constructor(readonly code: 'invalid_response' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotWorkerEmergencyWaterOffResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotWorkerEmergencyWaterOffAcceptedResponse(input: {
  response: unknown;
  emergency: Readonly<FarmBotWorkerEmergencyWaterOffRequest>;
  now?: Date;
}): Readonly<FarmBotWorkerEmergencyWaterOffAcceptedResponse> {
  const now = input.now ?? new Date();
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || !isRecord(input.response) || !hasExactFields(input.response, RESPONSE_FIELDS)
    || input.response.success !== true || !isRecord(input.response.data)
    || !hasExactFields(input.response.data, DATA_FIELDS)) {
    throw new FarmBotWorkerEmergencyWaterOffResponseError('invalid_response');
  }

  const data = input.response.data;
  if (typeof data.emergencyId !== 'string' || typeof data.rpcLabel !== 'string'
    || typeof data.acceptedAt !== 'string') {
    throw new FarmBotWorkerEmergencyWaterOffResponseError('invalid_response');
  }
  if (data.emergencyId.toLowerCase() !== input.emergency.emergencyId
    || data.rpcLabel !== input.emergency.rpcLabel) {
    throw new FarmBotWorkerEmergencyWaterOffResponseError('identity_mismatch');
  }

  const acceptedAt = new Date(data.acceptedAt);
  if (Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== data.acceptedAt
    || Math.abs(acceptedAt.getTime() - now.getTime()) > MAX_CLOCK_SKEW_MS) {
    throw new FarmBotWorkerEmergencyWaterOffResponseError('invalid_response');
  }

  return Object.freeze({
    emergencyId: input.emergency.emergencyId,
    rpcLabel: input.emergency.rpcLabel,
    acceptedAt,
  });
}
