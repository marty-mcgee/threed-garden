import {
  FARMBOT_EMERGENCY_REQUEST_LIFETIME_MS,
  farmBotEmergencyWaterOffRpcLabel,
} from '../../../farmbot/command-lifecycle-core';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BROKER_DEVICE_PATTERN = /^device_[1-9]\d*$/;
const FIELDS = new Set([
  'version',
  'farmbotId',
  'ownerId',
  'brokerDeviceId',
  'emergencyId',
  'semanticCommand',
  'peripheralPin',
  'rpcLabel',
  'requestedAt',
  'expiresAt',
]);

export const MAX_FARMBOT_EMERGENCY_WATER_OFF_REQUEST_BYTES = 1_024;

export interface FarmBotWorkerEmergencyWaterOffRequest {
  version: 1;
  farmbotId: number;
  ownerId: string;
  brokerDeviceId: string;
  emergencyId: string;
  semanticCommand: 'emergency_water_off';
  peripheralPin: number;
  rpcLabel: string;
  requestedAt: Date;
  expiresAt: Date;
}

export class FarmBotWorkerEmergencyWaterOffRequestError extends Error {
  constructor(readonly code: 'invalid_request' | 'expired_request' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotWorkerEmergencyWaterOffRequestError';
  }
}

function fail(
  code: FarmBotWorkerEmergencyWaterOffRequestError['code'] = 'invalid_request'
): never {
  throw new FarmBotWorkerEmergencyWaterOffRequestError(code);
}

export function parseFarmBotWorkerEmergencyWaterOffRequest(
  payload: unknown,
  now = new Date()
): Readonly<FarmBotWorkerEmergencyWaterOffRequest> {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof payload !== 'object' || payload === null || Array.isArray(payload)) return fail();
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).length !== FIELDS.size
    || Object.keys(input).some((field) => !FIELDS.has(field))
    || input.version !== 1
    || !Number.isSafeInteger(input.farmbotId) || Number(input.farmbotId) <= 0
    || typeof input.ownerId !== 'string' || !input.ownerId.trim() || input.ownerId.length > 255
    || typeof input.brokerDeviceId !== 'string'
    || !BROKER_DEVICE_PATTERN.test(input.brokerDeviceId)
    || typeof input.emergencyId !== 'string' || !UUID_V4_PATTERN.test(input.emergencyId)
    || input.semanticCommand !== 'emergency_water_off'
    || !Number.isSafeInteger(input.peripheralPin) || Number(input.peripheralPin) < 0
    || typeof input.rpcLabel !== 'string'
    || typeof input.requestedAt !== 'string' || typeof input.expiresAt !== 'string') return fail();
  const emergencyId = input.emergencyId.toLowerCase();
  if (input.rpcLabel !== farmBotEmergencyWaterOffRpcLabel(emergencyId)) {
    return fail('identity_mismatch');
  }
  const requestedAt = new Date(input.requestedAt);
  const expiresAt = new Date(input.expiresAt);
  if (Number.isNaN(requestedAt.valueOf()) || requestedAt.toISOString() !== input.requestedAt
    || Number.isNaN(expiresAt.valueOf()) || expiresAt.toISOString() !== input.expiresAt
    || expiresAt.getTime() - requestedAt.getTime() !== FARMBOT_EMERGENCY_REQUEST_LIFETIME_MS
    || requestedAt.getTime() > now.getTime() + 60_000) return fail();
  if (expiresAt <= now) return fail('expired_request');
  return Object.freeze({
    version: 1,
    farmbotId: Number(input.farmbotId),
    ownerId: input.ownerId.trim(),
    brokerDeviceId: input.brokerDeviceId,
    emergencyId,
    semanticCommand: 'emergency_water_off',
    peripheralPin: Number(input.peripheralPin),
    rpcLabel: input.rpcLabel,
    requestedAt,
    expiresAt,
  });
}
