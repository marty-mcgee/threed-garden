import {
  FarmBotWorkerRecoveryDisabledError,
  type FarmBotWorkerRecoveryExecutionResult,
  type FarmBotWorkerRecoveryExecutor,
  validateFarmBotWorkerRecoveryExecutionResult,
} from './command-recovery-executor';
import type { FarmBotWorkerWaterOffRecoveryRequest } from './command-recovery-request-core';
import { mapFarmBotWaterRecoveryAcknowledgement } from './command-delivery-core';
import type { FarmBotWorkerRpcResponse } from './rpc';
import {
  ProcessLocalFarmBotWorkerDeviceExecutionArbiter,
  type FarmBotWorkerDeviceExecutionArbiter,
} from './device-execution-arbiter';
import {
  DisabledFarmBotWorkerRecoveryAcknowledgementSink,
  type FarmBotWorkerRecoveryAcknowledgementSink,
} from './command-recovery-acknowledgement-client';

interface CompletedFarmBotWorkerRecovery {
  request: Readonly<FarmBotWorkerWaterOffRecoveryRequest>;
  result: Readonly<FarmBotWorkerRecoveryExecutionResult>;
}

interface TrackedFarmBotWorkerRecovery {
  ownerId: string;
  farmbotId: number;
  commandId: string;
  recoveryRpcLabel: string;
}

export interface FarmBotWorkerRecoveryAcknowledgement {
  ownerId: string;
  farmbotId: number;
  commandId: string;
  recoveryRpcLabel: string;
  state: 'confirmed' | 'failed';
  errorCode: 'farmbot_recovery_rpc_error' | null;
  receivedAt: string;
}

function sameRecovery(
  left: Readonly<FarmBotWorkerWaterOffRecoveryRequest>,
  right: Readonly<FarmBotWorkerWaterOffRecoveryRequest>
): boolean {
  return left.version === right.version
    && left.farmbotId === right.farmbotId
    && left.ownerId === right.ownerId
    && left.brokerDeviceId === right.brokerDeviceId
    && left.commandId === right.commandId
    && left.semanticCommand === right.semanticCommand
    && left.recoveryState === right.recoveryState
    && left.peripheralPin === right.peripheralPin
    && left.commandFingerprint === right.commandFingerprint
    && left.recoveryRpcLabel === right.recoveryRpcLabel
    && left.recoveryRequiredAt.getTime() === right.recoveryRequiredAt.getTime();
}

export class FarmBotWorkerRecoveryGateError extends Error {
  constructor(readonly code: 'duplicate_recovery' | 'recovery_in_progress') {
    super(code);
    this.name = 'FarmBotWorkerRecoveryGateError';
  }
}

export class FarmBotWorkerRecoveryExecutionGate implements FarmBotWorkerRecoveryExecutor {
  private readonly claimedCommandIds = new Set<string>();
  private readonly completedByCommandId = new Map<string, CompletedFarmBotWorkerRecovery>();
  private readonly pendingByRpcLabel = new Map<string, TrackedFarmBotWorkerRecovery>();

  constructor(
    private readonly executor: FarmBotWorkerRecoveryExecutor,
    private readonly deviceArbiter: FarmBotWorkerDeviceExecutionArbiter
      = new ProcessLocalFarmBotWorkerDeviceExecutionArbiter(),
    private readonly acknowledgementSink: FarmBotWorkerRecoveryAcknowledgementSink
      = new DisabledFarmBotWorkerRecoveryAcknowledgementSink()
  ) {}

  async execute(
    request: Readonly<FarmBotWorkerWaterOffRecoveryRequest>
  ): Promise<Readonly<FarmBotWorkerRecoveryExecutionResult>> {
    if (this.claimedCommandIds.has(request.commandId)) {
      const completed = this.completedByCommandId.get(request.commandId);
      if (completed && sameRecovery(completed.request, request)) return completed.result;
      throw new FarmBotWorkerRecoveryGateError('duplicate_recovery');
    }
    if (!this.deviceArbiter.tryClaim(request.farmbotId)) {
      throw new FarmBotWorkerRecoveryGateError('recovery_in_progress');
    }

    this.claimedCommandIds.add(request.commandId);
    try {
      const result = validateFarmBotWorkerRecoveryExecutionResult({
        request,
        result: await this.executor.execute(request),
      });
      this.completedByCommandId.set(request.commandId, {
        request: Object.freeze({
          ...request,
          recoveryRequiredAt: new Date(request.recoveryRequiredAt),
        }),
        result,
      });
      this.pendingByRpcLabel.set(request.recoveryRpcLabel, {
        ownerId: request.ownerId,
        farmbotId: request.farmbotId,
        commandId: request.commandId,
        recoveryRpcLabel: request.recoveryRpcLabel,
      });
      return result;
    } catch (error) {
      // A disabled executor proves no recovery delivery was attempted. Any
      // other failure remains claimed because its delivery outcome is unknown.
      if (error instanceof FarmBotWorkerRecoveryDisabledError) {
        this.claimedCommandIds.delete(request.commandId);
      }
      throw error;
    } finally {
      this.deviceArbiter.release(request.farmbotId);
    }
  }

  observeResponse(input: {
    farmbotId: number;
    response: FarmBotWorkerRpcResponse;
    receivedAt: string;
  }): Readonly<FarmBotWorkerRecoveryAcknowledgement> | null {
    const tracked = this.pendingByRpcLabel.get(input.response.rpcLabel);
    if (!tracked || tracked.farmbotId !== input.farmbotId) return null;
    const receivedAt = new Date(input.receivedAt);
    if (Number.isNaN(receivedAt.valueOf()) || receivedAt.toISOString() !== input.receivedAt) {
      return null;
    }
    const acknowledgement = mapFarmBotWaterRecoveryAcknowledgement({
      expectedRpcLabel: tracked.recoveryRpcLabel,
      response: input.response,
    });
    const result = Object.freeze({
      ...tracked,
      state: acknowledgement.outcome === 'recovery_confirmed'
        ? 'confirmed' as const
        : 'failed' as const,
      errorCode: acknowledgement.errorCode,
      receivedAt: input.receivedAt,
    });
    this.acknowledgementSink.record(result);
    this.pendingByRpcLabel.delete(tracked.recoveryRpcLabel);
    return result;
  }

  flushAcknowledgements(): Promise<void> {
    return this.acknowledgementSink.flush();
  }
}
