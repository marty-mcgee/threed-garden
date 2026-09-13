'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import { navigationVisualBounds } from '@/lib/services/threed/orchestration/navigation-visual-bounds';
import { createCharacterNavigation, stepCharacterNavigation, type CharacterNavigationState } from '@/lib/services/threed/orchestration/navigation-core';
import { NAVIGATION_REQUEST, NAVIGATION_STATUS, type NavigationRequest } from '@/lib/services/threed/orchestration/navigation-events';

// This adapter emits steering only. Ecctrl retains body, locomotion and live-position ownership.
export function useCharacterNavigation({ markerId, targetMarkerId, controlled, enabled, taskLocked, clearance }: {
  markerId?: string; targetMarkerId?: string; controlled: boolean; enabled: boolean;
  taskLocked: { current: boolean }; clearance: number;
}) {
  const { scene } = useThree();
  const state = useRef<CharacterNavigationState | null>(null);
  const box = useRef(new Box3()), position = useRef(new Vector3()), destination = useRef(new Vector3());
  const scratch = useRef(new Box3());
  const publish = useCallback((value: CharacterNavigationState) => {
    window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS, { detail: { actorMarkerId: markerId, requestId: value.requestId, phase: value.phase, reason: value.reason } }));
  }, [markerId]);
  const cancel = useCallback(() => {
    if (state.current?.phase === 'walking') {
      state.current = { ...state.current, phase: 'cancelled', reason: 'unavailable' };
      publish(state.current);
    }
  }, [publish]);
  useEffect(() => {
    function receive(event: Event) {
      const request = (event as CustomEvent<NavigationRequest>).detail;
      if (!request || request.actorMarkerId !== markerId) return;
      if (request.command === 'stop' || request.command === 'teleport') { cancel(); return; }
      if (request.command !== 'walk' || typeof request.requestId !== 'string' || !request.requestId.trim()) return;
      if (!controlled || !enabled || taskLocked.current || !targetMarkerId
        || request.targetMarkerId !== targetMarkerId || targetMarkerId === markerId) {
        publish({ requestId: request.requestId, targetMarkerId: targetMarkerId ?? '', phase: 'cancelled', reason: 'unavailable', startedAt: 0, progressAt: 0, bestDistance: 0 });
        return;
      }
      cancel();
      state.current = createCharacterNavigation(request.requestId, targetMarkerId, performance.now());
      publish(state.current);
    }
    window.addEventListener(NAVIGATION_REQUEST, receive);
    return () => { window.removeEventListener(NAVIGATION_REQUEST, receive); cancel(); };
  }, [markerId, targetMarkerId, controlled, enabled, taskLocked, cancel, publish]);

  return (currentPosition: { x: number; y: number; z: number }, manualInput: boolean) => {
    if (!state.current || state.current.phase !== 'walking') return null;
    const target = scene.getObjectByName(`threed-marker-${state.current.targetMarkerId}`);
    const actor = scene.getObjectByName(`threed-marker-${markerId}`);
    let available = !!actor && !!target && enabled && targetMarkerId === state.current.targetMarkerId;
    for (let parent = target; parent; parent = parent.parent ?? undefined) if (!parent.visible) available = false;
    for (let parent = actor; parent; parent = parent.parent ?? undefined) if (!parent.visible) available = false;
    position.current.set(currentPosition.x, currentPosition.y, currentPosition.z);
    if (target && available) {
      // World-space visible bounds give conservative clearance without changing any collider.
      navigationVisualBounds(target, box.current, scratch.current);
      available = !box.current.isEmpty();
      box.current.clampPoint(position.current, destination.current);
    }
    const next = stepCharacterNavigation(state.current, {
      now: performance.now(), characterPosition: currentPosition, targetPosition: destination.current,
      controlled, available, manualInput, taskActive: taskLocked.current,
      stoppingDistance: clearance, maxVerticalGap: 1.5,
    });
    if (next.state.phase !== state.current.phase) publish(next.state);
    state.current = next.state;
    return next.state.phase === 'walking' ? next.direction : null;
  };
}
