import {
  FARMBOT_WATER_ACK_TIMEOUT_MS,
  farmBotCommandRpcLabel,
} from '../../../farmbot/command-lifecycle-core';
import type { FarmBotWorkerWaterCommandRequest } from './command-request-core';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS = new Set([
  'version',
  'ownerId',
  'farmbotId',
  'commandId',
  'rpcLabel',
  'acceptedAt',
  'timedOutAt',
  'reason',
]);

export const MAX_FARMBOT_COMMAND_TIMEOUT_REPORT_BYTES = 1_024;

export interface FarmBotWorkerCommandTimeoutReport {
  version: 1;
  ownerId: string;
  farmbotId: number;
  commandId: string;
  rpcLabel: string;
  acceptedAt: Date;
  timedOutAt: Date;
  reason: 'ack_timeout';
}

export class FarmBotWorkerCommandTimeoutReportError extends Error {
  constructor() {
    super('invalid_farmbot_worker_command_timeout_report');
    this.name = 'FarmBotWorkerCommandTimeoutReportError';
  }
}

function invalid(): never {
  throw new FarmBotWorkerCommandTimeoutReportError();
}

export function parseFarmBotWorkerCommandTimeoutReport(
  payload: unknown,
  now = new Date()
): Readonly<FarmBotWorkerCommandTimeoutReport> {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof payload !== 'object' || payload === null || Array.isArray(payload)) return invalid();
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).length !== FIELDS.size
    || Object.keys(input).some((field) => !FIELDS.has(field))
    || input.version !== 1
    || typeof input.ownerId !== 'string' || !input.ownerId.trim() || input.ownerId.length > 255
    || !Number.isSafeInteger(input.farmbotId) || Number(input.farmbotId) <= 0
    || typeof input.commandId !== 'string' || !UUID_V4_PATTERN.test(input.commandId)
    || typeof input.rpcLabel !== 'string'
    || typeof input.acceptedAt !== 'string'
    || typeof input.timedOutAt !== 'string'
    || input.reason !== 'ack_timeout') return invalid();
  const commandId = input.commandId.toLowerCase();
  if (input.rpcLabel !== farmBotCommandRpcLabel(commandId)) return invalid();
  const acceptedAt = new Date(input.acceptedAt);
  const timedOutAt = new Date(input.timedOutAt);
  if (Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== input.acceptedAt
    || Number.isNaN(timedOutAt.valueOf()) || timedOutAt.toISOString() !== input.timedOutAt
    || timedOutAt.getTime() < acceptedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS
    || timedOutAt.getTime() > now.getTime() + 60_000) return invalid();
  return Object.freeze({
    version: 1,
    ownerId: input.ownerId.trim(),
    farmbotId: Number(input.farmbotId),
    commandId,
    rpcLabel: input.rpcLabel,
    acceptedAt,
    timedOutAt,
    reason: 'ack_timeout',
  });
}

export function prepareFarmBotWorkerCommandTimeoutReport(input: {
  request: Readonly<FarmBotWorkerWaterCommandRequest>;
  acceptedAt: string;
  now: Date;
}): Readonly<FarmBotWorkerCommandTimeoutReport> {
  return parseFarmBotWorkerCommandTimeoutReport({
    version: 1,
    ownerId: input.request.ownerId,
    farmbotId: input.request.farmbotId,
    commandId: input.request.commandId,
    rpcLabel: input.request.rpcLabel,
    acceptedAt: input.acceptedAt,
    timedOutAt: input.now.toISOString(),
    reason: 'ack_timeout',
  }, input.now);
}
