import {
  FARMBOT_EMERGENCY_REQUEST_LIFETIME_MS,
  farmBotEmergencyWaterOffRpcLabel,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './command-lifecycle-core.ts';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const FARMBOT_EMERGENCY_POLICY_VERSION = 1;

export type FarmBotEmergencyActionErrorCode =
  | 'invalid_request'
  | 'invalid_transition'
  | 'invalid_transition_time'
  | 'emergency_expired'
  | 'binding_missing'
  | 'binding_inactive'
  | 'binding_metadata_changed'
  | 'unsupported_peripheral_mode'
  | 'rpc_label_mismatch'
  | 'farmbot_emergency_rpc_error';

export class FarmBotEmergencyActionError extends Error {
  readonly code: FarmBotEmergencyActionErrorCode;

  constructor(code: FarmBotEmergencyActionErrorCode) {
    super(code);
    this.name = 'FarmBotEmergencyActionError';
    this.code = code;
  }
}

export interface FarmBotEmergencyRequestedAction {
  emergencyId: string;
  userId: string;
  farmbotId: number;
  policyVersion: typeof FARMBOT_EMERGENCY_POLICY_VERSION;
  semanticAction: 'emergency_water_off';
  state: 'requested';
  rpcLabel: string;
  requestedAt: Date;
  expiresAt: Date;
}

export interface FarmBotEmergencyWaterBinding {
  id: number;
  userId: string;
  farmbotId: number;
  semanticAction: string;
  peripheralId: number;
  peripheralPin: number;
  peripheralMode: number;
  isActive: boolean;
}

function copyTransitionTime(now: Date, previous: Date): Date {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || !(previous instanceof Date) || Number.isNaN(previous.valueOf())
    || now < previous) {
    throw new FarmBotEmergencyActionError('invalid_transition_time');
  }
  return new Date(now);
}

function assertNotExpired(now: Date, expiresAt: Date): void {
  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.valueOf()) || now >= expiresAt) {
    throw new FarmBotEmergencyActionError('emergency_expired');
  }
}

export function prepareRequestedFarmBotEmergencyAction(input: {
  emergencyId: string;
  userId: string;
  farmbotId: number;
  requestedAt: Date;
}): Readonly<FarmBotEmergencyRequestedAction> {
  if (!UUID_V4_PATTERN.test(input.emergencyId)
    || typeof input.userId !== 'string' || !input.userId.trim() || input.userId.length > 255
    || !Number.isSafeInteger(input.farmbotId) || input.farmbotId <= 0
    || !(input.requestedAt instanceof Date) || Number.isNaN(input.requestedAt.valueOf())) {
    throw new FarmBotEmergencyActionError('invalid_request');
  }
  const emergencyId = input.emergencyId.toLowerCase();
  const requestedAt = new Date(input.requestedAt);
  return Object.freeze({
    emergencyId,
    userId: input.userId.trim(),
    farmbotId: input.farmbotId,
    policyVersion: FARMBOT_EMERGENCY_POLICY_VERSION,
    semanticAction: 'emergency_water_off',
    state: 'requested',
    rpcLabel: farmBotEmergencyWaterOffRpcLabel(emergencyId),
    requestedAt,
    expiresAt: new Date(requestedAt.getTime() + FARMBOT_EMERGENCY_REQUEST_LIFETIME_MS),
  });
}

export function prepareValidatedFarmBotEmergencyAction(input: {
  action: FarmBotEmergencyRequestedAction;
  binding: FarmBotEmergencyWaterBinding | null;
  now: Date;
}) {
  if (input.action.state !== 'requested') {
    throw new FarmBotEmergencyActionError('invalid_transition');
  }
  const now = copyTransitionTime(input.now, input.action.requestedAt);
  assertNotExpired(now, input.action.expiresAt);
  if (input.binding === null) throw new FarmBotEmergencyActionError('binding_missing');
  if (!input.binding.isActive) throw new FarmBotEmergencyActionError('binding_inactive');
  if (!Number.isSafeInteger(input.binding.id) || input.binding.id <= 0
    || input.binding.userId !== input.action.userId
    || input.binding.farmbotId !== input.action.farmbotId
    || input.binding.semanticAction !== 'water'
    || !Number.isSafeInteger(input.binding.peripheralId) || input.binding.peripheralId <= 0
    || !Number.isSafeInteger(input.binding.peripheralPin) || input.binding.peripheralPin < 0
    || !Number.isSafeInteger(input.binding.peripheralMode)) {
    throw new FarmBotEmergencyActionError('binding_metadata_changed');
  }
  if (input.binding.peripheralMode !== 0) {
    throw new FarmBotEmergencyActionError('unsupported_peripheral_mode');
  }
  return Object.freeze({
    state: 'validated' as const,
    peripheralBindingId: input.binding.id,
    peripheralId: input.binding.peripheralId,
    peripheralPin: input.binding.peripheralPin,
    peripheralMode: input.binding.peripheralMode,
    validatedAt: now,
  });
}

export function prepareAcceptedFarmBotEmergencyAction(input: {
  action: { state: string; validatedAt: Date | null; expiresAt: Date };
  now: Date;
}) {
  if (input.action.state !== 'validated' || input.action.validatedAt === null) {
    throw new FarmBotEmergencyActionError('invalid_transition');
  }
  const now = copyTransitionTime(input.now, input.action.validatedAt);
  assertNotExpired(now, input.action.expiresAt);
  return Object.freeze({ state: 'accepted' as const, acceptedAt: now });
}

export function prepareDispatchedFarmBotEmergencyAction(input: {
  action: { state: string; acceptedAt: Date | null };
  now: Date;
}) {
  if (input.action.state !== 'accepted' || input.action.acceptedAt === null) {
    throw new FarmBotEmergencyActionError('invalid_transition');
  }
  return Object.freeze({
    state: 'dispatched' as const,
    dispatchedAt: copyTransitionTime(input.now, input.action.acceptedAt),
  });
}

export function prepareResolvedFarmBotEmergencyAction(input: {
  action: { state: string; rpcLabel: string; dispatchedAt: Date | null };
  rpcLabel: string;
  outcome: 'ok' | 'error';
  now: Date;
}) {
  if (input.action.state !== 'dispatched' || input.action.dispatchedAt === null) {
    throw new FarmBotEmergencyActionError('invalid_transition');
  }
  if (input.rpcLabel !== input.action.rpcLabel) {
    throw new FarmBotEmergencyActionError('rpc_label_mismatch');
  }
  const now = copyTransitionTime(input.now, input.action.dispatchedAt);
  return input.outcome === 'ok'
    ? Object.freeze({
        state: 'acknowledged' as const,
        acknowledgedAt: now,
        terminalAt: now,
        outcomeErrorCode: null,
      })
    : Object.freeze({
        state: 'failed' as const,
        acknowledgedAt: null,
        terminalAt: now,
        outcomeErrorCode: 'farmbot_emergency_rpc_error' as const,
      });
}

export function prepareRejectedFarmBotEmergencyAction(input: {
  action: { state: string; requestedAt: Date; validatedAt?: Date | null };
  errorCode: Exclude<FarmBotEmergencyActionErrorCode,
    'invalid_transition' | 'invalid_transition_time' | 'emergency_expired'
    | 'rpc_label_mismatch' | 'farmbot_emergency_rpc_error'>;
  now: Date;
}) {
  if (!['requested', 'validated'].includes(input.action.state)) {
    throw new FarmBotEmergencyActionError('invalid_transition');
  }
  const previous = input.action.validatedAt ?? input.action.requestedAt;
  const now = copyTransitionTime(input.now, previous);
  return Object.freeze({
    state: 'rejected' as const,
    outcomeErrorCode: input.errorCode,
    terminalAt: now,
  });
}

export function prepareExpiredFarmBotEmergencyAction(input: {
  action: { state: string; requestedAt: Date; validatedAt?: Date | null; expiresAt: Date };
  now: Date;
}) {
  if (!['requested', 'validated'].includes(input.action.state)) {
    throw new FarmBotEmergencyActionError('invalid_transition');
  }
  const previous = input.action.validatedAt ?? input.action.requestedAt;
  const now = copyTransitionTime(input.now, previous);
  if (!(input.action.expiresAt instanceof Date)
    || Number.isNaN(input.action.expiresAt.valueOf()) || now < input.action.expiresAt) {
    throw new FarmBotEmergencyActionError('emergency_expired');
  }
  return Object.freeze({
    state: 'expired' as const,
    outcomeErrorCode: null,
    terminalAt: now,
  });
}
