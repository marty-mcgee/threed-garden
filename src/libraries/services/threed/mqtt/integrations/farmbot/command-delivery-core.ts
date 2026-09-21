import type { FarmBotWorkerRpcResponse } from './rpc.ts';
import { FARMBOT_WATER_DURATION_MS } from '../../../farmbot/command-validation-core';
import {
  FARMBOT_WATER_ACK_TIMEOUT_MS,
  farmBotCommandRpcLabel,
  farmBotCommandRecoveryRpcLabel,
} from '../../../farmbot/command-lifecycle-core';

const COMMAND_FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;
const BROKER_DEVICE_PATTERN = /^device_[1-9]\d*$/;

export const FARMBOT_WATER_ON_VALUE = 1;
export const FARMBOT_WATER_OFF_VALUE = 0;
export const FARMBOT_COMMAND_PAYLOAD_MAX_BYTES = 4_096;

export interface FarmBotWaterDeliveryEnvelope {
  topic: string;
  rpcLabel: string;
  payload: string;
  payloadBytes: number;
}

export class FarmBotCommandDeliveryError extends Error {
  readonly code:
    | 'invalid_command'
    | 'invalid_broker_device'
    | 'expired_command'
    | 'invalid_rpc_response';

  constructor(code: FarmBotCommandDeliveryError['code']) {
    super(code);
    this.name = 'FarmBotCommandDeliveryError';
    this.code = code;
  }
}

function resolvedWaterCommand(command: {
  commandId: string;
  semanticCommand: string;
  peripheralPin: number | null;
  durationMs: number | null;
  commandFingerprint: string | null;
}): boolean {
  return command.semanticCommand === 'water'
    && /^[0-9a-f-]{36}$/i.test(command.commandId)
    && Number.isSafeInteger(command.peripheralPin)
    && Number(command.peripheralPin) >= 0
    && Number.isSafeInteger(command.durationMs)
    && Number(command.durationMs) === FARMBOT_WATER_DURATION_MS
    && typeof command.commandFingerprint === 'string'
    && COMMAND_FINGERPRINT_PATTERN.test(command.commandFingerprint);
}

function waterRequest(input: { label: string; pin: number; durationMs: number }) {
  const on = Object.freeze({
    kind: 'write_pin' as const,
    args: Object.freeze({ pin_number: input.pin, pin_value: 1 as const, pin_mode: 0 as const }),
  });
  const wait = Object.freeze({
    kind: 'wait' as const,
    args: Object.freeze({ milliseconds: input.durationMs }),
  });
  const off = Object.freeze({
    kind: 'write_pin' as const,
    args: Object.freeze({ pin_number: input.pin, pin_value: 0 as const, pin_mode: 0 as const }),
  });
  return Object.freeze({
    kind: 'rpc_request' as const,
    args: Object.freeze({ label: input.label }),
    body: Object.freeze([on, wait, off]),
  });
}

export function prepareFarmBotWaterDelivery(input: {
  command: {
    commandId: string;
    semanticCommand: string;
    state: string;
    peripheralPin: number | null;
    durationMs: number | null;
    commandFingerprint: string | null;
    expiresAt: Date;
  };
  brokerDeviceId: string;
  now: Date;
}): FarmBotWaterDeliveryEnvelope {
  if (!(input.now instanceof Date) || Number.isNaN(input.now.valueOf())
    || !(input.command.expiresAt instanceof Date)
    || Number.isNaN(input.command.expiresAt.valueOf())
    || input.command.state !== 'validated'
    || !resolvedWaterCommand(input.command)) {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  if (!BROKER_DEVICE_PATTERN.test(input.brokerDeviceId)) {
    throw new FarmBotCommandDeliveryError('invalid_broker_device');
  }
  if (input.now >= input.command.expiresAt) {
    throw new FarmBotCommandDeliveryError('expired_command');
  }

  let label: string;
  try {
    label = farmBotCommandRpcLabel(input.command.commandId);
  } catch {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  const payload = JSON.stringify(waterRequest({
    label,
    pin: Number(input.command.peripheralPin),
    durationMs: Number(input.command.durationMs),
  }));
  const payloadBytes = Buffer.byteLength(payload);
  if (payloadBytes > FARMBOT_COMMAND_PAYLOAD_MAX_BYTES) {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  return Object.freeze({
    topic: `bot/${input.brokerDeviceId}/from_clients`,
    rpcLabel: label,
    payload,
    payloadBytes,
  });
}

export function evaluateFarmBotWaterAcknowledgementTimeout(input: {
  state: string;
  dispatchedAt: Date | null;
  now: Date;
}): Readonly<{
  timedOut: boolean;
  recoveryRequired: boolean;
  deadline: Date | null;
}> {
  if (!(input.now instanceof Date) || Number.isNaN(input.now.valueOf())) {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  if (input.state !== 'dispatched') {
    return Object.freeze({ timedOut: false, recoveryRequired: false, deadline: null });
  }
  if (!(input.dispatchedAt instanceof Date) || Number.isNaN(input.dispatchedAt.valueOf())
    || input.dispatchedAt > input.now) {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  const deadline = new Date(input.dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS);
  const timedOut = input.now >= deadline;
  return Object.freeze({ timedOut, recoveryRequired: timedOut, deadline });
}

export function prepareFarmBotWaterOffRecovery(input: {
  command: {
    commandId: string;
    semanticCommand: string;
    state: string;
    peripheralPin: number | null;
    durationMs: number | null;
    commandFingerprint: string | null;
    dispatchedAt: Date | null;
  };
  brokerDeviceId: string;
}): FarmBotWaterDeliveryEnvelope {
  if (!['dispatched', 'timed_out', 'rejected'].includes(input.command.state)
    || !resolvedWaterCommand(input.command)
    || !(input.command.dispatchedAt instanceof Date)
    || Number.isNaN(input.command.dispatchedAt.valueOf())) {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  if (!BROKER_DEVICE_PATTERN.test(input.brokerDeviceId)) {
    throw new FarmBotCommandDeliveryError('invalid_broker_device');
  }
  let label: string;
  try {
    label = farmBotCommandRecoveryRpcLabel(input.command.commandId);
  } catch {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  const payload = JSON.stringify(Object.freeze({
    kind: 'rpc_request' as const,
    args: Object.freeze({ label }),
    body: Object.freeze([
      Object.freeze({
        kind: 'write_pin' as const,
        args: Object.freeze({
          pin_number: Number(input.command.peripheralPin),
          pin_value: FARMBOT_WATER_OFF_VALUE,
          pin_mode: 0 as const,
        }),
      }),
    ]),
  }));
  const payloadBytes = Buffer.byteLength(payload);
  if (payloadBytes > FARMBOT_COMMAND_PAYLOAD_MAX_BYTES) {
    throw new FarmBotCommandDeliveryError('invalid_command');
  }
  return Object.freeze({
    topic: `bot/${input.brokerDeviceId}/from_clients`,
    rpcLabel: label,
    payload,
    payloadBytes,
  });
}

export function mapFarmBotCommandAcknowledgement(input: {
  expectedRpcLabel: string;
  response: FarmBotWorkerRpcResponse;
}): Readonly<{
  state: 'acknowledged' | 'rejected';
  rejectionCode: 'farmbot_rpc_error' | null;
}> {
  if (input.response.rpcLabel !== input.expectedRpcLabel) {
    throw new FarmBotCommandDeliveryError('invalid_rpc_response');
  }
  return input.response.eventType === 'rpc_error'
    ? Object.freeze({ state: 'rejected' as const, rejectionCode: 'farmbot_rpc_error' as const })
    : Object.freeze({ state: 'acknowledged' as const, rejectionCode: null });
}

export function mapFarmBotWaterRecoveryAcknowledgement(input: {
  expectedRpcLabel: string;
  response: FarmBotWorkerRpcResponse;
}): Readonly<{
  outcome: 'recovery_confirmed' | 'recovery_failed';
  errorCode: 'farmbot_recovery_rpc_error' | null;
}> {
  if (input.response.rpcLabel !== input.expectedRpcLabel) {
    throw new FarmBotCommandDeliveryError('invalid_rpc_response');
  }
  return input.response.eventType === 'rpc_error'
    ? Object.freeze({
        outcome: 'recovery_failed' as const,
        errorCode: 'farmbot_recovery_rpc_error' as const,
      })
    : Object.freeze({ outcome: 'recovery_confirmed' as const, errorCode: null });
}
