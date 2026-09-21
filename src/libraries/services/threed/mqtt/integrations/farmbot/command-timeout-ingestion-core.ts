import type { FarmBotWorkerCommandTimeoutReport } from './command-timeout-report-core';
import { farmBotCommandRecoveryRpcLabel } from '../../../farmbot/command-lifecycle-core';

export interface FarmBotTimeoutIngestionAudit {
  commandId: string;
  userId: string;
  farmbotId: number;
  rpcLabel: string | null;
  state: string;
  dispatchedAt: Date | null;
}

export interface FarmBotTimeoutIngestionResult {
  commandId: string;
  state: 'timed_out';
  recoveryState: string | null;
  recoveryRpcLabel: string | null;
  recoveryRequiredAt: Date;
}

export interface FarmBotTimeoutIngestionDependencies {
  loadCommand(input: {
    userId: string;
    commandId: string;
  }): Promise<Readonly<FarmBotTimeoutIngestionAudit> | null>;
  recordTimeoutAndRequireRecovery(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<Readonly<FarmBotTimeoutIngestionResult>>;
}

export class FarmBotTimeoutIngestionError extends Error {
  constructor(readonly code: 'not_found' | 'audit_mismatch') {
    super(code);
    this.name = 'FarmBotTimeoutIngestionError';
  }
}

export async function ingestFarmBotWorkerCommandTimeout(
  report: Readonly<FarmBotWorkerCommandTimeoutReport>,
  dependencies: FarmBotTimeoutIngestionDependencies
): Promise<Readonly<FarmBotTimeoutIngestionResult>> {
  const command = await dependencies.loadCommand({
    userId: report.ownerId,
    commandId: report.commandId,
  });
  if (!command) throw new FarmBotTimeoutIngestionError('not_found');
  if (command.commandId !== report.commandId || command.userId !== report.ownerId
    || command.farmbotId !== report.farmbotId || command.rpcLabel !== report.rpcLabel
    || !['dispatched', 'timed_out'].includes(command.state)
    || !(command.dispatchedAt instanceof Date)
    || Number.isNaN(command.dispatchedAt.valueOf())
    || command.dispatchedAt.getTime() !== report.acceptedAt.getTime()) {
    throw new FarmBotTimeoutIngestionError('audit_mismatch');
  }
  const result = await dependencies.recordTimeoutAndRequireRecovery({
    userId: report.ownerId,
    commandId: report.commandId,
    now: new Date(report.timedOutAt),
  });
  if (result.commandId !== report.commandId || result.state !== 'timed_out'
    || !['required', 'dispatched', 'confirmed', 'failed'].includes(result.recoveryState ?? '')
    || result.recoveryRpcLabel !== farmBotCommandRecoveryRpcLabel(report.commandId)
    || !(result.recoveryRequiredAt instanceof Date)
    || Number.isNaN(result.recoveryRequiredAt.valueOf())
    || result.recoveryRequiredAt < report.acceptedAt
    || result.recoveryRequiredAt > report.timedOutAt) {
    throw new FarmBotTimeoutIngestionError('audit_mismatch');
  }
  return Object.freeze({
    ...result,
    recoveryRequiredAt: new Date(result.recoveryRequiredAt),
  });
}
