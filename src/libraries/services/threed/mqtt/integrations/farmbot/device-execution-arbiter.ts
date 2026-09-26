export interface FarmBotWorkerDeviceExecutionArbiter {
  tryClaim(farmbotId: number): boolean;
  release(farmbotId: number): void;
}

export class ProcessLocalFarmBotWorkerDeviceExecutionArbiter
implements FarmBotWorkerDeviceExecutionArbiter {
  private readonly activeFarmbots = new Set<number>();

  tryClaim(farmbotId: number): boolean {
    if (this.activeFarmbots.has(farmbotId)) return false;
    this.activeFarmbots.add(farmbotId);
    return true;
  }

  release(farmbotId: number): void {
    this.activeFarmbots.delete(farmbotId);
  }
}
