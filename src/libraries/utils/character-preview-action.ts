import { LoopOnce, LoopRepeat, type AnimationClip, type AnimationMixer } from 'three';
import type { ThreeDActionCollisionContext, ThreeDActionCollisionPointId } from '@/libraries/services/threed/physics/action-collision-core';

export type CharacterPreviewAction = { id: string; action: string; approach?: boolean; kick?: { context: ThreeDActionCollisionContext; pointIds: readonly ThreeDActionCollisionPointId[] } };
export type CharacterPreviewClip = { action: string; clipName: string; duration: number };

/** Resting preview uses the retained mixer without timeline completion callbacks. */
export function playCharacterPreviewIdle(mixer: AnimationMixer, clip: AnimationClip) {
  if (!Number.isFinite(clip.duration) || clip.duration <= 0) throw new Error('The default animation has no playable duration.');
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.reset().setLoop(LoopRepeat, Infinity);
  action.clampWhenFinished = false;
  action.setEffectiveTimeScale(1).setEffectiveWeight(1);
  action.play(); mixer.update(0);
  return () => action.stop();
}

/** Animation-only completion; never sends Character tasks or world commands. */
export function playCharacterPreviewAction(mixer: AnimationMixer, clip: AnimationClip, finished: () => void) {
  if (!Number.isFinite(clip.duration) || clip.duration <= 0) throw new Error('This animation has no playable duration.');
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.reset().setLoop(LoopOnce, 1);
  action.clampWhenFinished = true;
  action.setEffectiveTimeScale(1).setEffectiveWeight(1);
  let active = true;
  const complete = (event: { action: typeof action }) => { if (active && event.action === action) { active = false; finished(); } };
  mixer.addEventListener('finished', complete);
  action.play(); mixer.update(0);
  return () => { active = false; mixer.removeEventListener('finished', complete); action.stop(); };
}
