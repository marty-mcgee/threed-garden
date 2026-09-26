import {
  FARMBOT_WATER_ACK_TIMEOUT_MS,
  farmBotCommandRecoveryRpcLabel,
  farmBotCommandRpcLabel,
} from '../../../farmbot/command-lifecycle-core';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FarmBotOverdueCommandCandidate {
  userId: string;
  farmbotId: number;
  commandId: string;
  rpcLabel: string | null;
  state: string;
  dispatchedAt: Date | null;
}

export interface FarmBotTimeoutReconciliationDependencies {
  loadOverdue(input: {
    now: Date;
    limit: number;
  }): Promise<ReadonlyArray<Readonly<FarmBotOverdueCommandCandidate>>>;
  reconcile(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<Readonly<{
    commandId: string;
    state: 'timed_out';
    recoveryState: string | null;
    recoveryRpcLabel: string | null;
  }> | null>;
}

export class FarmBotTimeoutReconciliationError extends Error {
  constructor() {
    super('farmbot_timeout_reconciliation_mismatch');
    this.name = 'FarmBotTimeoutReconciliationError';
  }
}

export async function reconcileOverdueFarmBotCommands(input: {
  now?: Date;
  limit?: number;
}, dependencies: FarmBotTimeoutReconciliationDependencies) {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 50;
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new FarmBotTimeoutReconciliationError();
  }
  const candidates = await dependencies.loadOverdue({ now: new Date(now), limit });
  if (!Array.isArray(candidates) || candidates.length > limit) {
    throw new FarmBotTimeoutReconciliationError();
  }
  const seen = new Set<string>();
  let reconciled = 0;
  let skipped = 0;
  for (const candidate of candidates) {
    const commandId = candidate.commandId.toLowerCase();
    if (!candidate.userId.trim() || !Number.isSafeInteger(candidate.farmbotId)
      || candidate.farmbotId <= 0 || !UUID_V4_PATTERN.test(commandId)
      || seen.has(commandId) || candidate.state !== 'dispatched'
      || candidate.rpcLabel !== farmBotCommandRpcLabel(commandId)
      || !(candidate.dispatchedAt instanceof Date)
      || Number.isNaN(candidate.dispatchedAt.valueOf())
      || candidate.dispatchedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS > now.getTime()) {
      throw new FarmBotTimeoutReconciliationError();
    }
    seen.add(commandId);
    const result = await dependencies.reconcile({
      userId: candidate.userId,
      commandId,
      now: new Date(now),
    });
    if (!result) {
      skipped += 1;
      continue;
    }
    if (result.commandId !== commandId || result.state !== 'timed_out'
      || !['required', 'dispatched', 'confirmed', 'failed'].includes(result.recoveryState ?? '')
      || result.recoveryRpcLabel !== farmBotCommandRecoveryRpcLabel(commandId)) {
      throw new FarmBotTimeoutReconciliationError();
    }
    reconciled += 1;
  }
  return Object.freeze({ examined: candidates.length, reconciled, skipped });
}
