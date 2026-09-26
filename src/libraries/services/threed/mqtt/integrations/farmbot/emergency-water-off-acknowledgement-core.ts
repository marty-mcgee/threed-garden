import { farmBotEmergencyWaterOffRpcLabel } from '../../../farmbot/command-lifecycle-core';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS = new Set([
  'version',
  'ownerId',
  'farmbotId',
  'emergencyId',
  'rpcLabel',
  'state',
  'errorCode',
  'receivedAt',
]);

export const MAX_FARMBOT_EMERGENCY_ACKNOWLEDGEMENT_BYTES = 1024;

export interface FarmBotEmergencyWaterOffAcknowledgementInput {
  version: 1;
  ownerId: string;
  farmbotId: number;
  emergencyId: string;
  rpcLabel: string;
  state: 'acknowledged' | 'failed';
  errorCode: 'farmbot_emergency_rpc_error' | null;
  receivedAt: Date;
}

export class FarmBotEmergencyWaterOffAcknowledgementInputError extends Error {
  constructor() {
    super('invalid_farmbot_emergency_water_off_acknowledgement');
    this.name = 'FarmBotEmergencyWaterOffAcknowledgementInputError';
  }
}

function invalid(): never {
  throw new FarmBotEmergencyWaterOffAcknowledgementInputError();
}

export function parseFarmBotEmergencyWaterOffAcknowledgement(
  payload: unknown,
  now = new Date()
): Readonly<FarmBotEmergencyWaterOffAcknowledgementInput> {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof payload !== 'object' || payload === null || Array.isArray(payload)) return invalid();
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).length !== FIELDS.size
    || Object.keys(input).some((field) => !FIELDS.has(field))
    || input.version !== 1
    || typeof input.ownerId !== 'string' || !input.ownerId.trim() || input.ownerId.length > 255
    || !Number.isSafeInteger(input.farmbotId) || Number(input.farmbotId) <= 0
    || typeof input.emergencyId !== 'string' || !UUID_V4_PATTERN.test(input.emergencyId)
    || typeof input.rpcLabel !== 'string'
    || (input.state !== 'acknowledged' && input.state !== 'failed')
    || typeof input.receivedAt !== 'string') {
    return invalid();
  }
  const emergencyId = input.emergencyId.toLowerCase();
  if (input.rpcLabel !== farmBotEmergencyWaterOffRpcLabel(emergencyId)
    || (input.state === 'acknowledged' && input.errorCode !== null)
    || (input.state === 'failed' && input.errorCode !== 'farmbot_emergency_rpc_error')) {
    return invalid();
  }
  const receivedAt = new Date(input.receivedAt);
  if (Number.isNaN(receivedAt.valueOf()) || receivedAt.toISOString() !== input.receivedAt
    || receivedAt.getTime() > now.getTime() + 60_000) return invalid();
  return Object.freeze({
    version: 1,
    ownerId: input.ownerId.trim(),
    farmbotId: Number(input.farmbotId),
    emergencyId,
    rpcLabel: input.rpcLabel,
    state: input.state,
    errorCode: input.errorCode as 'farmbot_emergency_rpc_error' | null,
    receivedAt,
  });
}
