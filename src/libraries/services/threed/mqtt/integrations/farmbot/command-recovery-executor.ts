import type { FarmBotWorkerWaterOffRecoveryRequest } from './command-recovery-request-core';

export interface FarmBotWorkerRecoveryExecutionResult {
  commandId: string;
  recoveryRpcLabel: string;
  acceptedAt: string;
}

export interface FarmBotWorkerRecoveryExecutor {
  execute(
    request: Readonly<FarmBotWorkerWaterOffRecoveryRequest>
  ): Promise<Readonly<FarmBotWorkerRecoveryExecutionResult>>;
}

export class FarmBotWorkerRecoveryDisabledError extends Error {
  constructor() {
    super('farmbot_worker_recovery_disabled');
    this.name = 'FarmBotWorkerRecoveryDisabledError';
  }
}

export class FarmBotWorkerRecoveryExecutionResultError extends Error {
  constructor() {
    super('invalid_farmbot_recovery_execution_result');
    this.name = 'FarmBotWorkerRecoveryExecutionResultError';
  }
}

export function validateFarmBotWorkerRecoveryExecutionResult(input: {
  request: Readonly<FarmBotWorkerWaterOffRecoveryRequest>;
  result: unknown;
  now?: Date;
}): Readonly<FarmBotWorkerRecoveryExecutionResult> {
  const now = input.now ?? new Date();
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof input.result !== 'object' || input.result === null || Array.isArray(input.result)) {
    throw new FarmBotWorkerRecoveryExecutionResultError();
  }
  const result = input.result as Record<string, unknown>;
  const fields = Object.keys(result);
  if (fields.length !== 3
    || !fields.every((field) => ['commandId', 'recoveryRpcLabel', 'acceptedAt'].includes(field))
    || result.commandId !== input.request.commandId
    || result.recoveryRpcLabel !== input.request.recoveryRpcLabel
    || typeof result.acceptedAt !== 'string') {
    throw new FarmBotWorkerRecoveryExecutionResultError();
  }
  const acceptedAt = new Date(result.acceptedAt);
  if (Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== result.acceptedAt
    || Math.abs(acceptedAt.getTime() - now.getTime()) > 60_000) {
    throw new FarmBotWorkerRecoveryExecutionResultError();
  }
  return Object.freeze({
    commandId: input.request.commandId,
    recoveryRpcLabel: input.request.recoveryRpcLabel,
    acceptedAt: result.acceptedAt,
  });
}

export class DisabledFarmBotWorkerRecoveryExecutor implements FarmBotWorkerRecoveryExecutor {
  async execute(_request: Readonly<FarmBotWorkerWaterOffRecoveryRequest>): Promise<never> {
    throw new FarmBotWorkerRecoveryDisabledError();
  }
}
