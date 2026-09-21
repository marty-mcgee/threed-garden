import { farmBotCommandRecoveryRpcLabel } from '../../../farmbot/command-lifecycle-core';
import type { FarmBotWorkerCommandTimeoutReport } from './command-timeout-report-core';

const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['commandId', 'state', 'recoveryState', 'recoveryRpcLabel']);
const RECOVERY_STATES = new Set(['required', 'dispatched', 'confirmed', 'failed']);

export interface FarmBotCommandTimeoutReceipt {
  commandId: string;
  state: 'timed_out';
  recoveryState: 'required' | 'dispatched' | 'confirmed' | 'failed';
  recoveryRpcLabel: string;
}

export class FarmBotCommandTimeoutResponseError extends Error {
  constructor(readonly code: 'invalid_response' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotCommandTimeoutResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotCommandTimeoutReceipt(input: {
  response: unknown;
  report: Readonly<FarmBotWorkerCommandTimeoutReport>;
}): Readonly<FarmBotCommandTimeoutReceipt> {
  if (!isRecord(input.response) || !hasExactFields(input.response, RESPONSE_FIELDS)
    || input.response.success !== true || !isRecord(input.response.data)
    || !hasExactFields(input.response.data, DATA_FIELDS)) {
    throw new FarmBotCommandTimeoutResponseError('invalid_response');
  }
  const data = input.response.data;
  if (typeof data.commandId !== 'string' || data.state !== 'timed_out'
    || typeof data.recoveryState !== 'string' || !RECOVERY_STATES.has(data.recoveryState)
    || typeof data.recoveryRpcLabel !== 'string') {
    throw new FarmBotCommandTimeoutResponseError('invalid_response');
  }
  if (data.commandId.toLowerCase() !== input.report.commandId
    || data.recoveryRpcLabel !== farmBotCommandRecoveryRpcLabel(input.report.commandId)) {
    throw new FarmBotCommandTimeoutResponseError('identity_mismatch');
  }
  return Object.freeze({
    commandId: input.report.commandId,
    state: 'timed_out',
    recoveryState: data.recoveryState as FarmBotCommandTimeoutReceipt['recoveryState'],
    recoveryRpcLabel: data.recoveryRpcLabel,
  });
}
