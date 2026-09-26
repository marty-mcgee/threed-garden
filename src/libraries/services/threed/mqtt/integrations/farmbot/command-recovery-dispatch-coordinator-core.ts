import { farmBotCommandRecoveryRpcLabel } from '../../../farmbot/command-lifecycle-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POST_DISPATCH_RECOVERY_STATES = new Set(['dispatched', 'confirmed', 'failed']);

export interface FarmBotWorkerRecoveryHandoffReceipt {
  commandId: string;
  recoveryRpcLabel: string;
  workerAcceptedAt: Date;
}

export interface FarmBotRecoveryDispatchAudit {
  commandId: string;
  recoveryRpcLabel: string | null;
  recoveryState: string | null;
  recoveryDispatchedAt: Date | null;
}

export interface FarmBotRecoveryDispatchCoordinatorDependencies {
  handOff(input: {
    userId: string;
    commandId: string;
    now?: Date;
  }): Promise<Readonly<FarmBotWorkerRecoveryHandoffReceipt>>;
  recordDispatch(input: {
    userId: string;
    commandId: string;
    recoveryRpcLabel: string;
    workerAcceptedAt: Date;
  }): Promise<Readonly<FarmBotRecoveryDispatchAudit>>;
}

export class FarmBotRecoveryDispatchCoordinatorError extends Error {
  constructor() {
    super('farmbot_recovery_dispatch_audit_mismatch');
    this.name = 'FarmBotRecoveryDispatchCoordinatorError';
  }
}

export async function handOffAndRecordFarmBotWaterOffRecovery(input: {
  userId: string;
  commandId: string;
  now?: Date;
}, dependencies: FarmBotRecoveryDispatchCoordinatorDependencies) {
  const userId = input.userId.trim();
  const commandId = input.commandId.toLowerCase();
  const now = input.now ?? new Date();
  if (!userId || !COMMAND_ID_PATTERN.test(commandId)
    || !(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotRecoveryDispatchCoordinatorError();
  }
  const receipt = await dependencies.handOff({ userId, commandId, now });
  if (receipt.commandId !== commandId
    || receipt.recoveryRpcLabel !== farmBotCommandRecoveryRpcLabel(commandId)
    || !(receipt.workerAcceptedAt instanceof Date)
    || Number.isNaN(receipt.workerAcceptedAt.valueOf())
    || Math.abs(receipt.workerAcceptedAt.getTime() - now.getTime()) > 60_000) {
    throw new FarmBotRecoveryDispatchCoordinatorError();
  }
  const audit = await dependencies.recordDispatch({
    userId,
    commandId: receipt.commandId,
    recoveryRpcLabel: receipt.recoveryRpcLabel,
    workerAcceptedAt: new Date(receipt.workerAcceptedAt),
  });
  if (audit.commandId !== receipt.commandId
    || audit.recoveryRpcLabel !== receipt.recoveryRpcLabel
    || !POST_DISPATCH_RECOVERY_STATES.has(audit.recoveryState ?? '')
    || !(audit.recoveryDispatchedAt instanceof Date)
    || audit.recoveryDispatchedAt.getTime() !== receipt.workerAcceptedAt.getTime()) {
    throw new FarmBotRecoveryDispatchCoordinatorError();
  }

  return Object.freeze({
    commandId: audit.commandId,
    recoveryState: audit.recoveryState,
    recoveryRpcLabel: audit.recoveryRpcLabel,
    recoveryDispatchedAt: new Date(audit.recoveryDispatchedAt),
  });
}
