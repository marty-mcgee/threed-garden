import type { CharacterPreviewClip } from '@/libraries/utils/character-preview-action';
import { defaultKickCollisionPoints } from '@/libraries/services/threed/physics/action-collision-core';
import type { SimulationStep } from '@/libraries/services/threed/simulations/simulation-input';
import type { PreviewMapping } from './simulation-preview-data';

export function simulationPreviewAction(step: SimulationStep, clips: CharacterPreviewClip[], mapping?: PreviewMapping): CharacterPreviewClip | undefined {
  const action = step.action === 'runToTarget' ? 'run' : step.action === 'kickBall'
    ? mapping?.slots?.find(slot => slot.isActive && defaultKickCollisionPoints(slot.name).length && clips.some(clip => clip.action === slot.actionKey))?.actionKey
    : step.action;
  return clips.find(clip => clip.action === action);
}

export type PreviewTimelineState = { phase: 'idle' | 'playing' | 'finished' | 'stopped' | 'failed'; index: number; requestId?: string; message: string };
/** One local animation per Action, correlated completion and bounded timeout. */
export class SimulationPreviewTimeline {
  private state: PreviewTimelineState = { phase: 'idle', index: 0, message: '' };
  private steps: SimulationStep[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private serial = 0;
  constructor(private publish: (state: PreviewTimelineState) => void) {}
  play(steps: SimulationStep[], index = 0) {
    this.stop(false); this.steps = steps.map(step => ({ ...step }));
    if (!this.steps.length || index < 0 || index >= steps.length) return;
    this.state = { phase: 'playing', index, message: '' }; this.next();
  }
  finish(requestId: string) {
    if (this.state.phase !== 'playing' || this.state.requestId !== requestId) return;
    clearTimeout(this.timer); this.state = { ...this.state, index: this.state.index + 1 }; this.next();
  }
  fail(message: string) { clearTimeout(this.timer); this.state = { ...this.state, phase: 'failed', requestId: undefined, message }; this.publish(this.state); }
  stop(notify = true) { clearTimeout(this.timer); this.serial++; this.state = { ...this.state, phase: 'stopped', requestId: undefined, message: 'Preview stopped.' }; if (notify) this.publish(this.state); }
  private next() {
    if (this.state.index >= this.steps.length) { this.state = { phase: 'finished', index: this.steps.length - 1, message: 'Animation preview finished.' }; this.publish(this.state); return; }
    const requestId = `preview-${++this.serial}`;
    this.state = { ...this.state, phase: 'playing', requestId, message: `Playing Action ${this.state.index + 1}.` };
    this.timer = setTimeout(() => { if (this.state.requestId === requestId && this.state.phase === 'playing') this.fail('Animation preview timed out. Check the assigned clip.'); }, this.steps[this.state.index].timeoutMs);
    this.publish(this.state);
  }
}
