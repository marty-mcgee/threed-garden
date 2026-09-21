import type { FarmBotWorkerEmergencyWaterOffAcknowledgement } from './emergency-water-off-execution-gate';

const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['emergencyId', 'state']);

export interface FarmBotEmergencyWaterOffAcknowledgementReceipt {
  emergencyId: string;
  state: 'acknowledged' | 'failed';
}

export class FarmBotEmergencyWaterOffAcknowledgementResponseError extends Error {
  constructor(readonly code: 'invalid_response' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotEmergencyWaterOffAcknowledgementResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotEmergencyWaterOffAcknowledgementReceipt(input: {
  response: unknown;
  acknowledgement: Readonly<FarmBotWorkerEmergencyWaterOffAcknowledgement>;
}): Readonly<FarmBotEmergencyWaterOffAcknowledgementReceipt> {
  if (!isRecord(input.response) || !hasExactFields(input.response, RESPONSE_FIELDS)
    || input.response.success !== true || !isRecord(input.response.data)
    || !hasExactFields(input.response.data, DATA_FIELDS)) {
    throw new FarmBotEmergencyWaterOffAcknowledgementResponseError('invalid_response');
  }
  const data = input.response.data;
  if (typeof data.emergencyId !== 'string'
    || (data.state !== 'acknowledged' && data.state !== 'failed')) {
    throw new FarmBotEmergencyWaterOffAcknowledgementResponseError('invalid_response');
  }
  if (data.emergencyId.toLowerCase() !== input.acknowledgement.emergencyId
    || data.state !== input.acknowledgement.state) {
    throw new FarmBotEmergencyWaterOffAcknowledgementResponseError('identity_mismatch');
  }
  return Object.freeze({
    emergencyId: input.acknowledgement.emergencyId,
    state: input.acknowledgement.state,
  });
}
