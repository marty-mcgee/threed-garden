import type { CharacterPreviewClip } from '@/libraries/utils/character-preview-action';
import { defaultKickCollisionPoints } from '@/libraries/services/threed/physics/action-collision-core';
import type { SimulationStep } from '@/libraries/services/threed/simulations/simulation-input';
import type { PreviewMapping } from './simulation-preview-data';
import { LIBRARY_ACTIONS } from '@/libraries/services/threed/animations/contracts';

/** Present the configured Action vocabulary, rather than raw rig clip aliases. */
export function simulationPreviewChoices(clips: CharacterPreviewClip[], mapping?: PreviewMapping, set: 'strict' | 'broad' = 'broad') {
  if (!mapping?.slots) return clips.map(clip => ({ action: clip.action, label: clip.action, clip, reason: '' }));
  const slots = mapping.slots;
  const keys = [...new Set([...LIBRARY_ACTIONS, ...slots.map(slot => slot.actionKey)])];
  return keys.filter(action => slots.find(slot => slot.actionKey === action)?.isActive !== false && mapping.effective?.find(row => row.actionKey === action)?.state !== 'disabled').map(action => ({
    action,
    label: slots.find(slot => slot.actionKey === action)?.name
      ?? action.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, value => value.toUpperCase()),
    clip: clips.find(clip => clip.action === action),
    reason: mapping.effective?.find(row => row.actionKey === action)?.state === 'disabled' ? 'Mapping disabled' : mapping.effective?.find(row => row.actionKey === action)?.state === 'assigned' ? 'Assigned clip is not loaded or compatible' : 'Assign a compatible animation to this Character or its Model',
  })).filter(choice => set === 'broad' || !!choice.clip);
}

export function simulationPreviewAction(step: SimulationStep, clips: CharacterPreviewClip[], mapping?: PreviewMapping): CharacterPreviewClip | undefined {
  const action = step.action === 'runToTarget' ? 'run' : step.action === 'kickBall'
    ? simulationPreviewChoices(clips, mapping, 'strict').find(choice => defaultKickCollisionPoints(choice.label).length)?.action
    : step.action;
  return clips.find(clip => clip.action === action);
}

export function simulationPreviewStepChoices(step: SimulationStep, clips: CharacterPreviewClip[], mapping?: PreviewMapping, set: 'strict' | 'broad' = 'broad') {
  const choices = simulationPreviewChoices(clips, mapping, set);
  return step.action === 'kickBall' ? choices.filter(choice => defaultKickCollisionPoints(choice.label).length) : choices;
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
