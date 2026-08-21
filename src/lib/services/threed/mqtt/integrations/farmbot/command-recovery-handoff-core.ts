import {
  prepareFarmBotWorkerWaterOffRecoveryFromRequiredRecord,
  type FarmBotRequiredRecoveryRecord,
  type FarmBotWorkerWaterOffRecoveryRequest,
} from './command-recovery-request-core';
import type { FarmBotWorkerRecoveryAcceptedResponse } from './command-recovery-response-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FarmBotRecoveryDeliveryContext {
  command: FarmBotRequiredRecoveryRecord;
  brokerDeviceId: string;
}

export interface FarmBotRecoveryHandoffDependencies {
  loadContext(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<FarmBotRecoveryDeliveryContext>;
  submitToWorker(
    farmbotId: number,
    recovery: Readonly<FarmBotWorkerWaterOffRecoveryRequest>
  ): Promise<Readonly<FarmBotWorkerRecoveryAcceptedResponse>>;
}

export class FarmBotRecoveryHandoffError extends Error {
  constructor(readonly code: 'invalid_request' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotRecoveryHandoffError';
  }
}

export async function requestFarmBotWorkerRecoveryAcceptance(input: {
  userId: string;
  commandId: string;
  now?: Date;
}, dependencies: FarmBotRecoveryHandoffDependencies) {
  const userId = input.userId.trim();
  const commandId = input.commandId.toLowerCase();
  const now = input.now ?? new Date();
  if (!userId || !COMMAND_ID_PATTERN.test(commandId)
    || !(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotRecoveryHandoffError('invalid_request');
  }

  const context = await dependencies.loadContext({ userId, commandId, now });
  if (context.command.userId !== userId
    || context.command.commandId.toLowerCase() !== commandId) {
    throw new FarmBotRecoveryHandoffError('identity_mismatch');
  }
  const workerRecovery = prepareFarmBotWorkerWaterOffRecoveryFromRequiredRecord({
    command: context.command,
    brokerDeviceId: context.brokerDeviceId,
    now,
  });
  const accepted = await dependencies.submitToWorker(
    workerRecovery.farmbotId,
    workerRecovery
  );
  const workerAcceptedAt = accepted.acceptedAt instanceof Date
    ? accepted.acceptedAt
    : new Date(Number.NaN);
  if (accepted.commandId !== workerRecovery.commandId
    || accepted.recoveryRpcLabel !== workerRecovery.recoveryRpcLabel
    || Number.isNaN(workerAcceptedAt.valueOf())
    || Math.abs(workerAcceptedAt.getTime() - now.getTime()) > 60_000) {
    throw new FarmBotRecoveryHandoffError('identity_mismatch');
  }

  return Object.freeze({
    commandId: accepted.commandId,
    recoveryRpcLabel: accepted.recoveryRpcLabel,
    workerAcceptedAt: new Date(workerAcceptedAt),
  });
}
