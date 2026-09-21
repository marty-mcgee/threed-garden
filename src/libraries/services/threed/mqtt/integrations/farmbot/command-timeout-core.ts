import {
  FARMBOT_WATER_ACK_TIMEOUT_MS,
  farmBotCommandRecoveryRpcLabel,
} from '../../../farmbot/command-lifecycle-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECOVERY_STATES = new Set(['required', 'dispatched', 'confirmed', 'failed']);

export interface FarmBotTimeoutRecoveryAudit {
  commandId: string;
  userId: string;
  state: string;
  rejectionCode: string | null;
  dispatchedAt: Date | null;
  terminalAt: Date | null;
  recoveryState: string | null;
  recoveryRpcLabel: string | null;
  recoveryRequiredAt: Date | null;
}

export interface FarmBotCommandTimeoutDependencies {
  recordTimeout(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<Readonly<FarmBotTimeoutRecoveryAudit>>;
  requireRecovery(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<Readonly<FarmBotTimeoutRecoveryAudit>>;
}

export class FarmBotCommandTimeoutCoordinatorError extends Error {
  constructor() {
    super('farmbot_command_timeout_recovery_mismatch');
    this.name = 'FarmBotCommandTimeoutCoordinatorError';
  }
}

function validDate(value: Date | null): value is Date {
  return value instanceof Date && !Number.isNaN(value.valueOf());
}

export async function timeOutAndRequireFarmBotWaterRecovery(input: {
  userId: string;
  commandId: string;
  now?: Date;
}, dependencies: FarmBotCommandTimeoutDependencies) {
  const userId = input.userId.trim();
  const commandId = input.commandId.toLowerCase();
  const now = input.now ?? new Date();
  if (!userId || !COMMAND_ID_PATTERN.test(commandId)
    || !(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotCommandTimeoutCoordinatorError();
  }

  const timedOut = await dependencies.recordTimeout({ userId, commandId, now });
  if (timedOut.userId !== userId || timedOut.commandId !== commandId
    || timedOut.state !== 'timed_out' || timedOut.rejectionCode !== 'ack_timeout'
    || !validDate(timedOut.dispatchedAt) || !validDate(timedOut.terminalAt)
    || timedOut.terminalAt < timedOut.dispatchedAt
    || timedOut.terminalAt.getTime()
      < timedOut.dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS
    || timedOut.terminalAt > now) {
    throw new FarmBotCommandTimeoutCoordinatorError();
  }

  const recovery = await dependencies.requireRecovery({ userId, commandId, now });
  if (recovery.userId !== userId || recovery.commandId !== commandId
    || recovery.state !== 'timed_out' || recovery.rejectionCode !== 'ack_timeout'
    || !RECOVERY_STATES.has(recovery.recoveryState ?? '')
    || recovery.recoveryRpcLabel !== farmBotCommandRecoveryRpcLabel(commandId)
    || !validDate(recovery.recoveryRequiredAt)
    || recovery.recoveryRequiredAt < timedOut.dispatchedAt
    || recovery.recoveryRequiredAt > now) {
    throw new FarmBotCommandTimeoutCoordinatorError();
  }

  return Object.freeze({
    commandId,
    state: 'timed_out' as const,
    recoveryState: recovery.recoveryState,
    recoveryRpcLabel: recovery.recoveryRpcLabel,
    recoveryRequiredAt: new Date(recovery.recoveryRequiredAt),
  });
}
