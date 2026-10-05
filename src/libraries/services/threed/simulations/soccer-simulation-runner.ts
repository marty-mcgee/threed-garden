import { parseSimulationDefinition, type SimulationDefinition, type SimulationStep } from './simulation-input';

/** First Scene execution capability. Definitions and outcomes remain separate. */
export type SoccerSimulation = { id: number; revision: number; name: string; projectId: number; threedId: number;
  isActive: boolean; definition: SimulationDefinition };
export type SimulationReply = { requestId: string; actorMarkerId?: string; targetMarkerId?: string; projectId?: number;
  kind: 'navigation' | 'kick'; success: boolean; reason?: string };
export type SimulationOutcome = { stepId: string; action: string; requestId: string; startedAt: number; endedAt: number;
  status: 'completed' | 'failed' | 'cancelled' | 'timed-out'; reason?: string };
export type SimulationRunState = { runId: string; simulationId: number; revision: number; phase: 'running' | 'completed' | 'failed' | 'cancelled' | 'timed-out';
  stepIndex: number; outcomes: SimulationOutcome[]; reason?: string };

export function captureSoccerSimulation(value: SoccerSimulation, binding: { projectId: number; threedId?: number }): SoccerSimulation {
  if (!Number.isSafeInteger(value.id) || value.id <= 0 || !Number.isSafeInteger(value.revision) || value.revision <= 0
    || !value.isActive || value.projectId !== binding.projectId || !Number.isSafeInteger(value.threedId) || value.threedId <= 0 || value.threedId !== binding.threedId) throw new Error('Choose an active Simulation available in this Project module.');
  const definition = parseSimulationDefinition(value.definition), first = definition.steps[0];
  if (!first || definition.steps.some(step => !['runToTarget', 'kickBall'].includes(step.action))) throw new Error('This Scene runner supports Run to target ball and Kick ball only.');
  if (definition.steps.some(step => step.actorMarkerId !== first.actorMarkerId || step.targetMarkerId !== first.targetMarkerId)) throw new Error('Use one Character and one target ball per Soccer Simulation.');
  return { id: value.id, revision: value.revision, name: value.name, projectId: value.projectId, threedId: value.threedId,
    isActive: value.isActive, definition };
}

type Port = {
  requestId: () => string; now: () => number;
  schedule: (fn: () => void, ms: number) => unknown; clear: (timer: unknown) => void;
  subscribe: (listener: (reply: SimulationReply) => void) => () => void;
  validate: (step: SimulationStep) => string | null;
  dispatch: (step: SimulationStep, requestId: string) => void;
  cancel: (step: SimulationStep, requestId: string) => void;
  update: (state: SimulationRunState) => void;
};

/** Subscribes before dispatch, correlates every response, and cancels before reporting a terminal state. */
export class SoccerSimulationRunner {
  private state: SimulationRunState | null = null;
  private simulation: SoccerSimulation | null = null;
  private pending: { step: SimulationStep; requestId: string; startedAt: number; timer?: unknown } | null = null;
  private unsubscribe: (() => void) | null = null;
  constructor(private readonly port: Port) {}
  get running() { return this.state?.phase === 'running'; }
  start(simulation: SoccerSimulation, runId = this.port.requestId()) {
    if (this.running) throw new Error('A Simulation is already running.');
    this.simulation = captureSoccerSimulation(simulation, simulation);
    this.state = { runId, simulationId: simulation.id, revision: simulation.revision, phase: 'running', stepIndex: 0, outcomes: [] };
    this.unsubscribe = this.port.subscribe(reply => this.receive(reply));
    this.next();
  }
  stop(reason = 'Stopped by user.') {
    if (!this.running) return;
    this.finishPending('cancelled', reason, true);
    this.finish('cancelled', reason);
  }
  private publish() { if (this.state) this.port.update({ ...this.state, outcomes: [...this.state.outcomes] }); }
  private next() {
    if (!this.running || !this.state || !this.simulation) return;
    const step = this.simulation.definition.steps[this.state.stepIndex];
    if (!step) { this.finish(this.state.outcomes.some(item => item.status !== 'completed') ? 'failed' : 'completed'); return; }
    const reason = this.port.validate(step);
    if (reason) { this.finish('failed', reason); return; }
    const pending = { step, requestId: this.port.requestId(), startedAt: this.port.now(), timer: undefined as unknown };
    this.pending = pending;
    pending.timer = this.port.schedule(() => {
      if (this.pending !== pending || !this.running) return;
      this.finishPending('timed-out', 'Action timed out.', true);
      this.advanceFailure(step, 'timed-out', 'Action timed out.');
    }, step.timeoutMs);
    this.publish();
    try { this.port.dispatch(step, pending.requestId); }
    catch { if (this.pending === pending) { this.finishPending('failed', 'Action could not start.', true); this.advanceFailure(step, 'failed', 'Action could not start.'); } }
  }
  private receive(reply: SimulationReply) {
    const pending = this.pending, simulation = this.simulation;
    if (!this.running || !pending || !simulation || reply.requestId !== pending.requestId) return;
    if (pending.step.action === 'runToTarget') {
      if (reply.kind !== 'navigation' || reply.actorMarkerId !== pending.step.actorMarkerId || reply.targetMarkerId !== pending.step.targetMarkerId) return;
    } else if (reply.kind !== 'kick' || reply.projectId !== simulation.projectId || reply.targetMarkerId !== pending.step.targetMarkerId) return;
    const step = pending.step;
    this.finishPending(reply.success ? 'completed' : 'failed', reply.reason, !reply.success);
    if (reply.success) { this.state!.stepIndex++; this.next(); }
    else this.advanceFailure(step, 'failed', reply.reason);
  }
  private advanceFailure(step: SimulationStep, phase: 'failed' | 'timed-out', reason?: string) {
    if (!this.running) return;
    // A cancelled/blocked navigation is a lifecycle failure; it never advances to a kick.
    if (step.onFailure === 'continue' && step.action === 'kickBall') { this.state!.stepIndex++; this.next(); }
    else this.finish(phase, reason);
  }
  private finishPending(status: SimulationOutcome['status'], reason?: string, cancel = false) {
    const pending = this.pending;
    if (!pending) return;
    this.pending = null; // Nested synchronous cancellation/result events cannot settle this step twice.
    this.port.clear(pending.timer);
    if (cancel) this.port.cancel(pending.step, pending.requestId);
    this.state!.outcomes.push({ stepId: pending.step.id, action: pending.step.action, requestId: pending.requestId,
      startedAt: pending.startedAt, endedAt: this.port.now(), status, ...(reason ? { reason: reason.slice(0, 200) } : {}) });
  }
  private finish(phase: SimulationRunState['phase'], reason?: string) {
    if (!this.state) return;
    this.unsubscribe?.(); this.unsubscribe = null;
    this.state.phase = phase; this.state.reason = reason?.slice(0, 200);
    this.publish();
  }
}
