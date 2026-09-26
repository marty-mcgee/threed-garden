'use client';
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import type { EcctrlHandle } from 'ecctrl';
import { Box3, type Object3D } from 'three';
import { findCharacterLanding } from '@/libraries/services/threed/orchestration/teleport-landing';
import { NAVIGATION_REQUEST, NAVIGATION_STATUS, type NavigationRequest } from '@/libraries/services/threed/orchestration/navigation-events';

export function useCharacterTeleport({ markerId, targetMarkerId, controlled, enabled, taskLocked, controller, radius, halfHeight, floatHeight }: {
  markerId?: string; targetMarkerId?: string; controlled: boolean; enabled: boolean;
  taskLocked: { current: boolean }; controller: { current: EcctrlHandle | null };
  radius: number; halfHeight: number; floatHeight: number;
}) {
  const { scene } = useThree();
  const { world, rapier, colliderStates } = useRapier();
  const pending = useRef<NavigationRequest | null>(null);
  useEffect(() => {
    const receive = (event: Event) => {
      const request = (event as CustomEvent<NavigationRequest>).detail;
      if (!request || request.actorMarkerId !== markerId) return;
      pending.current = request.command === 'teleport' && typeof request.requestId === 'string' && request.requestId.trim() ? request : null;
    };
    window.addEventListener(NAVIGATION_REQUEST, receive);
    return () => { window.removeEventListener(NAVIGATION_REQUEST, receive); pending.current = null; };
  }, [markerId, targetMarkerId, controlled, enabled]);

  useBeforePhysicsStep(() => {
    const request = pending.current;
    if (!request) return;
    pending.current = null;
    const publish = (phase: string) => window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS, {
      detail: { actorMarkerId: markerId, requestId: request.requestId, phase },
    }));
    const visible = (object?: Object3D) => {
      if (!object) return false;
      for (let parent: Object3D | null = object; parent; parent = parent.parent) if (!parent.visible) return false;
      return true;
    };
    const target = scene.getObjectByName(`threed-marker-${targetMarkerId}`);
    const actor = scene.getObjectByName(`threed-marker-${markerId}`);
    const ec = controller.current;
    if (!controlled || !enabled || taskLocked.current || !ec?.body || !targetMarkerId
      || request.targetMarkerId !== targetMarkerId || markerId === targetMarkerId || !visible(actor) || !visible(target)) {
      publish('teleport-cancelled'); return;
    }
    // R3F's collider objects retain their Scene ancestry, including explicit
    // Bed/FarmBot colliders. Highlight rings are not part of this ownership list.
    const targetColliders = [...colliderStates.values()].filter(({ object }) => {
      for (let parent: Object3D | null = object; parent; parent = parent.parent) if (parent === target) return true;
      return false;
    }).map(({ collider }) => collider);
    const landing = findCharacterLanding({ world, rapier, body: ec.body, bounds: new Box3().setFromObject(target!), targetColliders, radius, halfHeight, floatHeight });
    if (!landing) { publish('teleport-blocked'); return; }
    // Same explicit physics-step boundary as position editing; keep body rotation and loaded model.
    ec.setMovement({ joystick: { x: 0, y: 0 }, run: false, jump: false });
    ec.body.setTranslation(landing, true);
    ec.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    ec.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    publish('teleported');
  });
}
