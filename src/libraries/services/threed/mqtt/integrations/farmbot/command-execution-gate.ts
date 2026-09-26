import {
  FarmBotWorkerCommandsDisabledError,
  type FarmBotWorkerCommandExecutionResult,
  type FarmBotWorkerCommandExecutor,
} from './command-executor';
import type { FarmBotWorkerWaterCommandRequest } from './command-request-core';
import { mapFarmBotCommandAcknowledgement } from './command-delivery-core';
import type { FarmBotWorkerRpcResponse } from './rpc';
import {
  DisabledFarmBotWorkerCommandAcknowledgementSink,
  type FarmBotWorkerCommandAcknowledgementSink,
} from './command-acknowledgement-client';
import {
  ProcessLocalFarmBotWorkerDeviceExecutionArbiter,
  type FarmBotWorkerDeviceExecutionArbiter,
} from './device-execution-arbiter';
import {
  DisabledFarmBotWorkerCommandDeadlineMonitor,
  type FarmBotWorkerCommandDeadlineMonitor,
} from './command-deadline-monitor';

interface TrackedFarmBotWorkerCommand {
  ownerId: string;
  farmbotId: number;
  commandId: string;
  rpcLabel: string;
}

interface CompletedFarmBotWorkerCommand {
  request: Readonly<FarmBotWorkerWaterCommandRequest>;
  result: Readonly<FarmBotWorkerCommandExecutionResult>;
}

function sameWorkerCommand(
  left: Readonly<FarmBotWorkerWaterCommandRequest>,
  right: Readonly<FarmBotWorkerWaterCommandRequest>
): boolean {
  return left.version === right.version
    && left.farmbotId === right.farmbotId
    && left.ownerId === right.ownerId
    && left.brokerDeviceId === right.brokerDeviceId
    && left.commandId === right.commandId
    && left.semanticCommand === right.semanticCommand
    && left.state === right.state
    && left.peripheralPin === right.peripheralPin
    && left.durationMs === right.durationMs
    && left.commandFingerprint === right.commandFingerprint
    && left.rpcLabel === right.rpcLabel
    && left.expiresAt.getTime() === right.expiresAt.getTime();
}

export interface FarmBotWorkerCommandAcknowledgement {
  ownerId: string;
  farmbotId: number;
  commandId: string;
  rpcLabel: string;
  state: 'acknowledged' | 'rejected';
  rejectionCode: 'farmbot_rpc_error' | null;
  receivedAt: string;
}

export interface FarmBotWorkerCommandResponseObserver {
  observeResponse(input: {
    farmbotId: number;
    response: FarmBotWorkerRpcResponse;
    receivedAt: string;
  }): Readonly<FarmBotWorkerCommandAcknowledgement> | null;
}

export class DisabledFarmBotWorkerCommandResponseObserver
implements FarmBotWorkerCommandResponseObserver {
  observeResponse(): null {
    return null;
  }
}

export class FarmBotWorkerCommandGateError extends Error {
  constructor(readonly code: 'duplicate_command' | 'command_in_progress') {
    super(code);
    this.name = 'FarmBotWorkerCommandGateError';
  }
}

export class FarmBotWorkerCommandExecutionGate implements FarmBotWorkerCommandExecutor {
  private readonly claimedCommandIds = new Set<string>();
  private readonly pendingByRpcLabel = new Map<string, TrackedFarmBotWorkerCommand>();
  private readonly completedByCommandId = new Map<string, CompletedFarmBotWorkerCommand>();

  constructor(
    private readonly executor: FarmBotWorkerCommandExecutor,
    private readonly acknowledgementSink: FarmBotWorkerCommandAcknowledgementSink
      = new DisabledFarmBotWorkerCommandAcknowledgementSink(),
    private readonly deviceArbiter: FarmBotWorkerDeviceExecutionArbiter
      = new ProcessLocalFarmBotWorkerDeviceExecutionArbiter(),
    private readonly deadlineMonitor: FarmBotWorkerCommandDeadlineMonitor
      = new DisabledFarmBotWorkerCommandDeadlineMonitor()
  ) {}

  async execute(
    request: Readonly<FarmBotWorkerWaterCommandRequest>
  ): Promise<Readonly<FarmBotWorkerCommandExecutionResult>> {
    if (this.claimedCommandIds.has(request.commandId)) {
      const completed = this.completedByCommandId.get(request.commandId);
      if (completed && sameWorkerCommand(completed.request, request)) {
        return completed.result;
      }
      throw new FarmBotWorkerCommandGateError('duplicate_command');
    }
    if (!this.deviceArbiter.tryClaim(request.farmbotId)) {
      throw new FarmBotWorkerCommandGateError('command_in_progress');
    }

    this.claimedCommandIds.add(request.commandId);
    try {
      const result = await this.executor.execute(request);
      const acceptedAt = new Date(result.acceptedAt);
      if (result.commandId !== request.commandId || result.rpcLabel !== request.rpcLabel
        || Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== result.acceptedAt) {
        throw new Error('invalid_farmbot_command_execution_result');
      }
      this.pendingByRpcLabel.set(request.rpcLabel, {
        ownerId: request.ownerId,
        farmbotId: request.farmbotId,
        commandId: request.commandId,
        rpcLabel: request.rpcLabel,
      });
      const storedResult = Object.freeze({
        commandId: result.commandId,
        rpcLabel: result.rpcLabel,
        acceptedAt: result.acceptedAt,
      });
      this.completedByCommandId.set(request.commandId, {
        request: Object.freeze({ ...request, expiresAt: new Date(request.expiresAt) }),
        result: storedResult,
      });
      this.deadlineMonitor.track({
        request,
        acceptedAt: storedResult.acceptedAt,
        onTimeout: () => this.pendingByRpcLabel.delete(request.rpcLabel),
      });
      return storedResult;
    } catch (error) {
      // A disabled executor proves that no delivery was attempted. All other
      // failures remain claimed because their delivery outcome may be unknown.
      if (error instanceof FarmBotWorkerCommandsDisabledError) {
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
  }): Readonly<FarmBotWorkerCommandAcknowledgement> | null {
    const tracked = this.pendingByRpcLabel.get(input.response.rpcLabel);
    if (!tracked || tracked.farmbotId !== input.farmbotId) return null;
    const receivedAt = new Date(input.receivedAt);
    if (Number.isNaN(receivedAt.valueOf()) || receivedAt.toISOString() !== input.receivedAt) {
      return null;
    }
    const acknowledgement = mapFarmBotCommandAcknowledgement({
      expectedRpcLabel: tracked.rpcLabel,
      response: input.response,
    });
    const result = Object.freeze({
      ...tracked,
      ...acknowledgement,
      receivedAt: input.receivedAt,
    });
    this.acknowledgementSink.record(result);
    this.deadlineMonitor.settle(tracked.rpcLabel);
    this.pendingByRpcLabel.delete(tracked.rpcLabel);
    return result;
  }

  flushAcknowledgements(): Promise<void> {
    return this.acknowledgementSink.flush();
  }

  async shutdown(): Promise<void> {
    await this.deadlineMonitor.shutdown();
    await this.acknowledgementSink.flush();
  }
}
