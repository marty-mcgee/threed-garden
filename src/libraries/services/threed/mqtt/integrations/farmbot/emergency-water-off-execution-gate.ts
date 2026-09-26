import type { FarmBotWorkerEmergencyWaterOffRequest } from './emergency-water-off-request-core';
import {
  FarmBotWorkerEmergencyWaterOffDisabledError,
  type FarmBotWorkerEmergencyWaterOffExecutionResult,
  type FarmBotWorkerEmergencyWaterOffExecutor,
  validateFarmBotWorkerEmergencyWaterOffExecutionResult,
} from './emergency-water-off-executor';
import {
  ProcessLocalFarmBotWorkerDeviceExecutionArbiter,
  type FarmBotWorkerDeviceExecutionArbiter,
} from './device-execution-arbiter';
import type { FarmBotWorkerRpcResponse } from './rpc';
import {
  DisabledFarmBotWorkerEmergencyWaterOffAcknowledgementSink,
  type FarmBotWorkerEmergencyWaterOffAcknowledgementSink,
} from './emergency-water-off-acknowledgement-client';

interface CompletedFarmBotWorkerEmergencyWaterOff {
  request: Readonly<FarmBotWorkerEmergencyWaterOffRequest>;
  result: Readonly<FarmBotWorkerEmergencyWaterOffExecutionResult>;
}

interface TrackedFarmBotWorkerEmergencyWaterOff {
  ownerId: string;
  farmbotId: number;
  emergencyId: string;
  rpcLabel: string;
}

export interface FarmBotWorkerEmergencyWaterOffAcknowledgement {
  ownerId: string;
  farmbotId: number;
  emergencyId: string;
  rpcLabel: string;
  state: 'acknowledged' | 'failed';
  errorCode: 'farmbot_emergency_rpc_error' | null;
  receivedAt: string;
}

function sameEmergencyRequest(
  left: Readonly<FarmBotWorkerEmergencyWaterOffRequest>,
  right: Readonly<FarmBotWorkerEmergencyWaterOffRequest>
): boolean {
  return left.version === right.version
    && left.farmbotId === right.farmbotId
    && left.ownerId === right.ownerId
    && left.brokerDeviceId === right.brokerDeviceId
    && left.emergencyId === right.emergencyId
    && left.semanticCommand === right.semanticCommand
    && left.peripheralPin === right.peripheralPin
    && left.rpcLabel === right.rpcLabel
    && left.requestedAt.getTime() === right.requestedAt.getTime()
    && left.expiresAt.getTime() === right.expiresAt.getTime();
}

export class FarmBotWorkerEmergencyWaterOffGateError extends Error {
  constructor(readonly code: 'duplicate_emergency' | 'emergency_in_progress') {
    super(code);
    this.name = 'FarmBotWorkerEmergencyWaterOffGateError';
  }
}

export class FarmBotWorkerEmergencyWaterOffExecutionGate
implements FarmBotWorkerEmergencyWaterOffExecutor {
  private readonly claimedEmergencyIds = new Set<string>();
  private readonly completedByEmergencyId
    = new Map<string, CompletedFarmBotWorkerEmergencyWaterOff>();
  private readonly pendingByRpcLabel
    = new Map<string, TrackedFarmBotWorkerEmergencyWaterOff>();

  constructor(
    private readonly executor: FarmBotWorkerEmergencyWaterOffExecutor,
    private readonly deviceArbiter: FarmBotWorkerDeviceExecutionArbiter
      = new ProcessLocalFarmBotWorkerDeviceExecutionArbiter(),
    private readonly acknowledgementSink: FarmBotWorkerEmergencyWaterOffAcknowledgementSink
      = new DisabledFarmBotWorkerEmergencyWaterOffAcknowledgementSink()
  ) {}

  async execute(
    request: Readonly<FarmBotWorkerEmergencyWaterOffRequest>
  ): Promise<Readonly<FarmBotWorkerEmergencyWaterOffExecutionResult>> {
    if (this.claimedEmergencyIds.has(request.emergencyId)) {
      const completed = this.completedByEmergencyId.get(request.emergencyId);
      if (completed && sameEmergencyRequest(completed.request, request)) return completed.result;
      throw new FarmBotWorkerEmergencyWaterOffGateError('duplicate_emergency');
    }
    if (!this.deviceArbiter.tryClaim(request.farmbotId)) {
      throw new FarmBotWorkerEmergencyWaterOffGateError('emergency_in_progress');
    }

    this.claimedEmergencyIds.add(request.emergencyId);
    try {
      const result = validateFarmBotWorkerEmergencyWaterOffExecutionResult({
        request,
        result: await this.executor.execute(request),
      });
      this.completedByEmergencyId.set(request.emergencyId, {
        request: Object.freeze({
          ...request,
          requestedAt: new Date(request.requestedAt),
          expiresAt: new Date(request.expiresAt),
        }),
        result,
      });
      this.pendingByRpcLabel.set(request.rpcLabel, {
        ownerId: request.ownerId,
        farmbotId: request.farmbotId,
        emergencyId: request.emergencyId,
        rpcLabel: request.rpcLabel,
      });
      return result;
    } catch (error) {
      if (error instanceof FarmBotWorkerEmergencyWaterOffDisabledError) {
        this.claimedEmergencyIds.delete(request.emergencyId);
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
  }): Readonly<FarmBotWorkerEmergencyWaterOffAcknowledgement> | null {
    const tracked = this.pendingByRpcLabel.get(input.response.rpcLabel);
    if (!tracked || tracked.farmbotId !== input.farmbotId) return null;
    const receivedAt = new Date(input.receivedAt);
    if (Number.isNaN(receivedAt.valueOf()) || receivedAt.toISOString() !== input.receivedAt) {
      return null;
    }
    const failed = input.response.eventType === 'rpc_error';
    const result = Object.freeze({
      ...tracked,
      state: failed ? 'failed' as const : 'acknowledged' as const,
      errorCode: failed ? 'farmbot_emergency_rpc_error' as const : null,
      receivedAt: input.receivedAt,
    });
    this.pendingByRpcLabel.delete(tracked.rpcLabel);
    this.acknowledgementSink.record(result);
    return result;
  }

  flushAcknowledgements(): Promise<void> {
    return this.acknowledgementSink.flush();
  }
}
