import {
  prepareFarmBotWorkerWaterCommandFromAcceptedRecord,
  type FarmBotAcceptedCommandRecord,
  type FarmBotWorkerWaterCommandRequest,
} from './command-request-core';
import type { FarmBotWorkerCommandAcceptedResponse } from './command-response-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FarmBotCommandDeliveryContext {
  command: FarmBotAcceptedCommandRecord;
  brokerDeviceId: string;
}

export interface FarmBotCommandHandoffDependencies {
  loadContext(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<FarmBotCommandDeliveryContext>;
  submitToWorker(
    farmbotId: number,
    command: Readonly<FarmBotWorkerWaterCommandRequest>
  ): Promise<Readonly<FarmBotWorkerCommandAcceptedResponse>>;
}

export class FarmBotCommandHandoffError extends Error {
  constructor(readonly code: 'invalid_request' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotCommandHandoffError';
  }
}

export async function requestFarmBotWorkerCommandAcceptance(input: {
  userId: string;
  commandId: string;
  now?: Date;
}, dependencies: FarmBotCommandHandoffDependencies) {
  const userId = input.userId.trim();
  const commandId = input.commandId.toLowerCase();
  const now = input.now ?? new Date();
  if (!userId || !COMMAND_ID_PATTERN.test(commandId)
    || !(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotCommandHandoffError('invalid_request');
  }

  const context = await dependencies.loadContext({ userId, commandId, now });
  if (context.command.userId !== userId
    || context.command.commandId.toLowerCase() !== commandId) {
    throw new FarmBotCommandHandoffError('identity_mismatch');
  }
  const workerCommand = prepareFarmBotWorkerWaterCommandFromAcceptedRecord({
    command: context.command,
    brokerDeviceId: context.brokerDeviceId,
    now,
  });
  const accepted = await dependencies.submitToWorker(
    workerCommand.farmbotId,
    workerCommand
  );
  const workerAcceptedAt = accepted.acceptedAt instanceof Date
    ? accepted.acceptedAt
    : new Date(Number.NaN);
  if (accepted.commandId !== workerCommand.commandId
    || accepted.rpcLabel !== workerCommand.rpcLabel
    || Number.isNaN(workerAcceptedAt.valueOf())
    || Math.abs(workerAcceptedAt.getTime() - now.getTime()) > 60_000) {
    throw new FarmBotCommandHandoffError('identity_mismatch');
  }

  return Object.freeze({
    commandId: accepted.commandId,
    rpcLabel: accepted.rpcLabel,
    workerAcceptedAt: new Date(workerAcceptedAt),
  });
}
