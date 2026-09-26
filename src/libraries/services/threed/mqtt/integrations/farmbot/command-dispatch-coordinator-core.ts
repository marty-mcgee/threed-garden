import { farmBotCommandRpcLabel } from '../../../farmbot/command-lifecycle-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POST_DISPATCH_STATES = new Set([
  'dispatched',
  'acknowledged',
  'completed',
  'rejected',
  'timed_out',
]);

export interface FarmBotWorkerHandoffReceipt {
  commandId: string;
  rpcLabel: string;
  workerAcceptedAt: Date;
}

export interface FarmBotCommandDispatchAudit {
  commandId: string;
  rpcLabel: string | null;
  state: string;
  dispatchedAt: Date | null;
}

export interface FarmBotCommandDispatchCoordinatorDependencies {
  handOff(input: {
    userId: string;
    commandId: string;
    now?: Date;
  }): Promise<Readonly<FarmBotWorkerHandoffReceipt>>;
  recordDispatch(input: {
    userId: string;
    commandId: string;
    rpcLabel: string;
    workerAcceptedAt: Date;
  }): Promise<Readonly<FarmBotCommandDispatchAudit>>;
}

export class FarmBotCommandDispatchCoordinatorError extends Error {
  constructor() {
    super('farmbot_command_dispatch_audit_mismatch');
    this.name = 'FarmBotCommandDispatchCoordinatorError';
  }
}

export async function handOffAndRecordFarmBotWaterCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}, dependencies: FarmBotCommandDispatchCoordinatorDependencies) {
  const userId = input.userId.trim();
  const commandId = input.commandId.toLowerCase();
  const now = input.now ?? new Date();
  if (!userId || !COMMAND_ID_PATTERN.test(commandId)
    || !(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotCommandDispatchCoordinatorError();
  }
  const receipt = await dependencies.handOff({ userId, commandId, now });
  if (receipt.commandId !== commandId
    || receipt.rpcLabel !== farmBotCommandRpcLabel(commandId)
    || !(receipt.workerAcceptedAt instanceof Date)
    || Number.isNaN(receipt.workerAcceptedAt.valueOf())
    || Math.abs(receipt.workerAcceptedAt.getTime() - now.getTime()) > 60_000) {
    throw new FarmBotCommandDispatchCoordinatorError();
  }
  const audit = await dependencies.recordDispatch({
    userId,
    commandId: receipt.commandId,
    rpcLabel: receipt.rpcLabel,
    workerAcceptedAt: new Date(receipt.workerAcceptedAt),
  });
  if (audit.commandId !== receipt.commandId
    || audit.rpcLabel !== receipt.rpcLabel
    || !POST_DISPATCH_STATES.has(audit.state)
    || !(audit.dispatchedAt instanceof Date)
    || audit.dispatchedAt.getTime() !== receipt.workerAcceptedAt.getTime()) {
    throw new FarmBotCommandDispatchCoordinatorError();
  }

  return Object.freeze({
    commandId: audit.commandId,
    state: audit.state,
    rpcLabel: audit.rpcLabel,
    dispatchedAt: new Date(audit.dispatchedAt),
  });
}
