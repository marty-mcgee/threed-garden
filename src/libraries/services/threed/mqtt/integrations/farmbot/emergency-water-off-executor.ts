import type { FarmBotWorkerEmergencyWaterOffRequest } from './emergency-water-off-request-core';

export interface FarmBotWorkerEmergencyWaterOffExecutionResult {
  emergencyId: string;
  rpcLabel: string;
  acceptedAt: string;
}

export interface FarmBotWorkerEmergencyWaterOffExecutor {
  execute(
    request: Readonly<FarmBotWorkerEmergencyWaterOffRequest>
  ): Promise<Readonly<FarmBotWorkerEmergencyWaterOffExecutionResult>>;
}

export class FarmBotWorkerEmergencyWaterOffDisabledError extends Error {
  constructor() {
    super('farmbot_worker_emergency_water_off_disabled');
    this.name = 'FarmBotWorkerEmergencyWaterOffDisabledError';
  }
}

export class FarmBotWorkerEmergencyWaterOffExecutionResultError extends Error {
  constructor() {
    super('invalid_farmbot_emergency_water_off_execution_result');
    this.name = 'FarmBotWorkerEmergencyWaterOffExecutionResultError';
  }
}

export function validateFarmBotWorkerEmergencyWaterOffExecutionResult(input: {
  request: Readonly<FarmBotWorkerEmergencyWaterOffRequest>;
  result: unknown;
  now?: Date;
}): Readonly<FarmBotWorkerEmergencyWaterOffExecutionResult> {
  const now = input.now ?? new Date();
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof input.result !== 'object' || input.result === null || Array.isArray(input.result)) {
    throw new FarmBotWorkerEmergencyWaterOffExecutionResultError();
  }
  const result = input.result as Record<string, unknown>;
  const fields = Object.keys(result);
  if (fields.length !== 3
    || !fields.every((field) => ['emergencyId', 'rpcLabel', 'acceptedAt'].includes(field))
    || result.emergencyId !== input.request.emergencyId
    || result.rpcLabel !== input.request.rpcLabel
    || typeof result.acceptedAt !== 'string') {
    throw new FarmBotWorkerEmergencyWaterOffExecutionResultError();
  }
  const acceptedAt = new Date(result.acceptedAt);
  if (Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== result.acceptedAt
    || Math.abs(acceptedAt.getTime() - now.getTime()) > 60_000) {
    throw new FarmBotWorkerEmergencyWaterOffExecutionResultError();
  }
  return Object.freeze({
    emergencyId: input.request.emergencyId,
    rpcLabel: input.request.rpcLabel,
    acceptedAt: result.acceptedAt,
  });
}

export class DisabledFarmBotWorkerEmergencyWaterOffExecutor
implements FarmBotWorkerEmergencyWaterOffExecutor {
  async execute(_request: Readonly<FarmBotWorkerEmergencyWaterOffRequest>): Promise<never> {
    throw new FarmBotWorkerEmergencyWaterOffDisabledError();
  }
}
