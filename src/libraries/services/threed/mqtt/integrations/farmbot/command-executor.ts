import type { FarmBotWorkerWaterCommandRequest } from './command-request-core';

export interface FarmBotWorkerCommandExecutionResult {
  commandId: string;
  rpcLabel: string;
  acceptedAt: string;
}

export interface FarmBotWorkerCommandExecutor {
  execute(
    request: Readonly<FarmBotWorkerWaterCommandRequest>
  ): Promise<Readonly<FarmBotWorkerCommandExecutionResult>>;
}

export class FarmBotWorkerCommandsDisabledError extends Error {
  constructor() {
    super('farmbot_worker_commands_disabled');
    this.name = 'FarmBotWorkerCommandsDisabledError';
  }
}

export class DisabledFarmBotWorkerCommandExecutor implements FarmBotWorkerCommandExecutor {
  async execute(_request: Readonly<FarmBotWorkerWaterCommandRequest>): Promise<never> {
    throw new FarmBotWorkerCommandsDisabledError();
  }
}
