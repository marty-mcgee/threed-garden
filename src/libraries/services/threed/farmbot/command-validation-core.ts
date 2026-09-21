import { createHash } from 'node:crypto';
import type { FarmBotPeripheralBindingValidation } from './peripheral-binding-core.ts';
import type { FarmBotRequestedCommandRecord } from './command-repository-core.ts';

export const FARMBOT_COMMAND_REQUEST_TTL_MS = 60_000;
export const FARMBOT_WATER_DURATION_MS = 5_000;
export const FARMBOT_WATER_MAX_DURATION_MS = 10_000;
export const FARMBOT_BLOCKING_COMMAND_STATES = [
  'validated',
  'accepted',
  'dispatched',
  'acknowledged',
] as const;

if (FARMBOT_WATER_DURATION_MS > FARMBOT_WATER_MAX_DURATION_MS) {
  throw new Error('invalid_farmbot_water_duration_policy');
}

export type FarmBotCommandValidationErrorCode =
  | 'invalid_request_state'
  | 'invalid_validation_time'
  | 'request_expired'
  | 'request_lifetime_exceeded'
  | 'command_in_progress'
  | 'binding_missing'
  | 'binding_inactive'
  | 'peripheral_missing'
  | 'binding_metadata_changed'
  | 'unsupported_peripheral_mode';

export class FarmBotCommandValidationError extends Error {
  readonly code: FarmBotCommandValidationErrorCode;

  constructor(code: FarmBotCommandValidationErrorCode) {
    super(code);
    this.name = 'FarmBotCommandValidationError';
    this.code = code;
  }
}

export interface FarmBotWaterBindingRecord {
  id: number;
  userId: string;
  farmbotId: number;
  semanticAction: string;
  peripheralId: number;
  peripheralPin: number;
  peripheralMode: number;
  isActive: boolean;
}

export interface ValidatedFarmBotWaterCommand {
  state: 'validated';
  peripheralBindingId: number;
  peripheralId: number;
  peripheralPin: number;
  durationMs: typeof FARMBOT_WATER_DURATION_MS;
  commandFingerprint: string;
  validatedAt: Date;
}

export interface RejectedFarmBotCommand {
  state: 'rejected';
  rejectionCode: FarmBotCommandValidationErrorCode;
  terminalAt: Date;
}

export function isFarmBotBlockingCommandState(
  state: string
): state is typeof FARMBOT_BLOCKING_COMMAND_STATES[number] {
  return FARMBOT_BLOCKING_COMMAND_STATES.includes(
    state as typeof FARMBOT_BLOCKING_COMMAND_STATES[number]
  );
}

export function prepareRejectedFarmBotCommand(
  error: FarmBotCommandValidationError,
  now: Date
): RejectedFarmBotCommand {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotCommandValidationError('invalid_validation_time');
  }
  return Object.freeze({
    state: 'rejected',
    rejectionCode: error.code,
    terminalAt: new Date(now),
  });
}

function bindingError(
  validation: Exclude<FarmBotPeripheralBindingValidation, { valid: true }>
): FarmBotCommandValidationErrorCode {
  if (validation.reason === 'binding_inactive') return 'binding_inactive';
  if (validation.reason === 'peripheral_missing') return 'peripheral_missing';
  return 'binding_metadata_changed';
}

export function prepareValidatedFarmBotWaterCommand(input: {
  command: FarmBotRequestedCommandRecord;
  binding: FarmBotWaterBindingRecord;
  bindingValidation: FarmBotPeripheralBindingValidation;
  anotherCommandActive: boolean;
  now: Date;
}): ValidatedFarmBotWaterCommand {
  if (input.command.state !== 'requested') {
    throw new FarmBotCommandValidationError('invalid_request_state');
  }
  if (!(input.now instanceof Date) || Number.isNaN(input.now.valueOf())) {
    throw new FarmBotCommandValidationError('invalid_validation_time');
  }
  if (input.command.expiresAt.getTime() - input.command.requestedAt.getTime()
    > FARMBOT_COMMAND_REQUEST_TTL_MS) {
    throw new FarmBotCommandValidationError('request_lifetime_exceeded');
  }
  if (input.now >= input.command.expiresAt) {
    throw new FarmBotCommandValidationError('request_expired');
  }
  if (input.anotherCommandActive) {
    throw new FarmBotCommandValidationError('command_in_progress');
  }
  if (!input.bindingValidation.valid) {
    throw new FarmBotCommandValidationError(bindingError(input.bindingValidation));
  }
  if (!input.binding.isActive) {
    throw new FarmBotCommandValidationError('binding_inactive');
  }
  if (input.binding.userId !== input.command.userId
    || input.binding.farmbotId !== input.command.farmbotId
    || input.binding.semanticAction !== input.command.semanticCommand
    || !Number.isSafeInteger(input.binding.id)
    || input.binding.id <= 0
    || input.binding.peripheralId !== input.bindingValidation.peripheral.id
    || input.binding.peripheralPin !== input.bindingValidation.peripheral.pin
    || input.binding.peripheralMode !== input.bindingValidation.peripheral.mode) {
    throw new FarmBotCommandValidationError('binding_metadata_changed');
  }
  if (input.binding.peripheralMode !== 0) {
    throw new FarmBotCommandValidationError('unsupported_peripheral_mode');
  }
  const fingerprint = createHash('sha256').update([
    `policy:${input.command.policyVersion}`,
    `command:${input.command.commandId}`,
    `action:${input.command.semanticCommand}`,
    `farmbot:${input.command.farmbotId}`,
    `binding:${input.binding.id}`,
    `peripheral:${input.binding.peripheralId}`,
    `pin:${input.binding.peripheralPin}`,
    `duration:${FARMBOT_WATER_DURATION_MS}`,
  ].join('|')).digest('hex');

  return Object.freeze({
    state: 'validated',
    peripheralBindingId: input.binding.id,
    peripheralId: input.binding.peripheralId,
    peripheralPin: input.binding.peripheralPin,
    durationMs: FARMBOT_WATER_DURATION_MS,
    commandFingerprint: fingerprint,
    validatedAt: new Date(input.now),
  });
}
