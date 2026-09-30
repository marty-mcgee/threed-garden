'use client';

import { useAfterPhysicsStep, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import type { RefObject } from 'react';
import { reconcileSensorOccupancyWithPhysics, type SensorCounterState } from '@/libraries/services/threed/physics/sensor-counter-core';

/** A restored "inside" flag cannot outlive the live Rapier overlap. */
export function SensorOccupancySync({ stateRef, onSeparated }: {
  stateRef: RefObject<SensorCounterState>;
  onSeparated: (keys: ReadonlySet<string>) => void;
}) {
  const { world, colliderStates, rigidBodyStates } = useRapier();
  useAfterPhysicsStep(() => {
    const occupied = stateRef.current?.occupied;
    if (!occupied?.length) return;
    const sensors = new Map<string, RapierCollider>();
    colliderStates.forEach((state, handle) => {
      if (!state.object.name.startsWith('threed-sensor:')) return;
      const collider = world.getCollider(handle);
      if (collider?.isValid() && collider.isEnabled()) sensors.set(state.object.name.slice(14), collider);
    });
    const bodies = new Map<string, RapierRigidBody[]>();
    rigidBodyStates.forEach((_state, handle) => {
      const body = world.getRigidBody(handle);
      if (!body?.isValid() || !body.isEnabled() || !body.numColliders()) return;
      const physics = (body.userData as { threeDPhysics?: {
        identity?: { moduleType: string; assetId: number }; projectMarkerId?: number;
      } } | undefined)?.threeDPhysics;
      if (!physics?.identity) return;
      for (const key of [
        `${physics.identity.moduleType}:${physics.identity.assetId}`,
        ...(physics.projectMarkerId ? [`marker:${physics.projectMarkerId}`] : []),
      ]) bodies.set(key, [...(bodies.get(key) ?? []), body]);
    });
    const current = stateRef.current;
    if (!current) return;
    const next = reconcileSensorOccupancyWithPhysics(current, (sensorKey, sourceKey) => {
      const sensor = sensors.get(sensorKey);
      const sources = bodies.get(sourceKey);
      // Loading, hidden, or disabled owners cannot establish separation.
      if (!sensor || !sources) return undefined;
      return sources.some(body => {
        for (let index = 0; index < body.numColliders(); index++) {
          const collider = body.collider(index);
          if (collider.isEnabled() && !collider.isSensor() && world.intersectionPair(sensor, collider)) return true;
        }
        return false;
      });
    });
    if (next !== current) onSeparated(new Set(current.occupied.filter(key => !next.occupied.includes(key))));
  });
  return null;
}
