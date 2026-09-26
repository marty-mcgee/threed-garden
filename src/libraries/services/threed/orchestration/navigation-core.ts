// Pure navigation policy. Runtime adapters retain movement/physics and animation authority.
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { planThreeDTargetRelativeNavigation } from './interaction-core.ts';
import type { ThreeDPlanarPosition } from './interaction-core';

export type CharacterNavigationPhase = 'walking' | 'arrived' | 'cancelled' | 'blocked';
export type CharacterNavigationReason = 'manual-input' | 'control-released' | 'unavailable' | 'task-started' | 'invalid-position' | 'timeout' | 'no-progress';
export interface CharacterNavigationState {
  requestId: string;
  targetMarkerId: string;
  phase: CharacterNavigationPhase;
  startedAt: number;
  progressAt: number;
  bestDistance: number;
  reason?: CharacterNavigationReason;
}
export interface CharacterNavigationFrame {
  now: number;
  characterPosition: ThreeDPlanarPosition;
  targetPosition: ThreeDPlanarPosition;
  controlled: boolean;
  available: boolean;
  manualInput: boolean;
  taskActive: boolean;
  // Runtime must derive this from collision bounds; the target center is not a safe destination.
  stoppingDistance: number;
  maxVerticalGap: number;
}
const ZERO = Object.freeze({ x: 0, y: 0, z: 0 });
const finitePosition = (p: ThreeDPlanarPosition) => p && [p.x, p.y, p.z].every(Number.isFinite);
export function createCharacterNavigation(requestId: string, targetMarkerId: string, now: number): CharacterNavigationState {
  if (!requestId.trim() || !targetMarkerId.trim() || !Number.isFinite(now) || now < 0) throw new Error('Invalid navigation request');
  return { requestId, targetMarkerId, phase: 'walking', startedAt: now, progressAt: now, bestDistance: Infinity };
}
/** Returns steering only. Never writes transforms, plays a task, or completes a world action. */
export function stepCharacterNavigation(state: CharacterNavigationState, frame: CharacterNavigationFrame) {
  const stop = (phase: CharacterNavigationPhase, reason?: CharacterNavigationReason) => ({ state: { ...state, phase, reason }, direction: ZERO });
  if (state.phase !== 'walking') return { state, direction: ZERO };
  if (!frame.available) return stop('cancelled', 'unavailable');
  if (!frame.controlled) return stop('cancelled', 'control-released');
  if (frame.manualInput) return stop('cancelled', 'manual-input');
  if (frame.taskActive) return stop('cancelled', 'task-started');
  if (!finitePosition(frame.characterPosition) || !finitePosition(frame.targetPosition)
    || !Number.isFinite(frame.now) || frame.now < state.progressAt
    || !Number.isFinite(frame.stoppingDistance) || frame.stoppingDistance <= 0
    || !Number.isFinite(frame.maxVerticalGap) || frame.maxVerticalGap < 0) return stop('cancelled', 'invalid-position');
  const navigation = planThreeDTargetRelativeNavigation(frame);
  // Planar proximity cannot prove arrival on a different floor/elevation.
  const verticalGap = Math.abs(frame.targetPosition.y - frame.characterPosition.y);
  if (navigation.distanceToTarget <= frame.stoppingDistance && verticalGap <= frame.maxVerticalGap) return stop('arrived');
  if (frame.now - state.startedAt >= 120_000) return stop('blocked', 'timeout');
  const distance = Math.hypot(navigation.distanceToTarget, verticalGap);
  const progressing = distance < state.bestDistance - 0.05;
  const next = progressing ? { ...state, bestDistance: distance, progressAt: frame.now } : state;
  if (frame.now - next.progressAt >= 4_000) return stop('blocked', 'no-progress');
  return { state: next, direction: navigation.forwardDirection };
}
