import { FARMBOT_WATER_ACK_TIMEOUT_MS } from '../../../farmbot/command-lifecycle-core';
import type { FarmBotWorkerWaterCommandRequest } from './command-request-core';
import {
  DisabledFarmBotWorkerCommandTimeoutSink,
  type FarmBotWorkerCommandTimeoutSink,
} from './command-timeout-client';
import {
  prepareFarmBotWorkerCommandTimeoutReport,
  type FarmBotWorkerCommandTimeoutReport,
} from './command-timeout-report-core';

export interface FarmBotWorkerCommandDeadlineMonitor {
  track(input: {
    request: Readonly<FarmBotWorkerWaterCommandRequest>;
    acceptedAt: string;
    onTimeout(report: Readonly<FarmBotWorkerCommandTimeoutReport>): boolean;
  }): void;
  settle(rpcLabel: string): void;
  shutdown(): Promise<void>;
}

export class DisabledFarmBotWorkerCommandDeadlineMonitor
implements FarmBotWorkerCommandDeadlineMonitor {
  track(): void {}
  settle(): void {}
  async shutdown(): Promise<void> {}
}

interface DeadlineScheduler {
  schedule(callback: () => void, delayMs: number): unknown;
  cancel(handle: unknown): void;
}

const defaultScheduler: DeadlineScheduler = {
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class ProcessLocalFarmBotWorkerCommandDeadlineMonitor
implements FarmBotWorkerCommandDeadlineMonitor {
  private readonly pending = new Map<string, unknown>();

  constructor(
    private readonly sink: FarmBotWorkerCommandTimeoutSink
      = new DisabledFarmBotWorkerCommandTimeoutSink(),
    private readonly clock: () => Date = () => new Date(),
    private readonly scheduler: DeadlineScheduler = defaultScheduler
  ) {}

  track(input: {
    request: Readonly<FarmBotWorkerWaterCommandRequest>;
    acceptedAt: string;
    onTimeout(report: Readonly<FarmBotWorkerCommandTimeoutReport>): boolean;
  }): void {
    const acceptedAt = new Date(input.acceptedAt);
    if (Number.isNaN(acceptedAt.valueOf()) || acceptedAt.toISOString() !== input.acceptedAt
      || this.pending.has(input.request.rpcLabel)) {
      throw new Error('invalid_farmbot_command_deadline');
    }
    const deadline = acceptedAt.getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS;
    const schedule = () => this.scheduler.schedule(expire, Math.max(
      0,
      deadline - this.clock().getTime()
    ));
    const expire = () => {
      const now = this.clock();
      if (now.getTime() < deadline) {
        this.pending.set(input.request.rpcLabel, schedule());
        return;
      }
      if (!this.pending.delete(input.request.rpcLabel)) return;
      const report = prepareFarmBotWorkerCommandTimeoutReport({
        request: input.request,
        acceptedAt: input.acceptedAt,
        now,
      });
      if (input.onTimeout(report)) this.sink.record(report);
    };
    this.pending.set(input.request.rpcLabel, schedule());
  }

  settle(rpcLabel: string): void {
    const handle = this.pending.get(rpcLabel);
    if (handle === undefined) return;
    this.pending.delete(rpcLabel);
    this.scheduler.cancel(handle);
  }

  async shutdown(): Promise<void> {
    for (const handle of this.pending.values()) this.scheduler.cancel(handle);
    this.pending.clear();
    await this.sink.flush();
  }
}
