import { Euler, Quaternion, Vector3 } from 'three';

export type ScenePoint = { x: number; y: number; z: number };
export type SceneOwnerPose = { position: ScenePoint; rotation: [number, number, number] };
export type SceneTransformDraft = { position: ScenePoint; rotationY: number; width: number; height: number; depth: number };

/** Sensor children inherit the rigid body pose, not the visual Model scale. */
export function sceneOwnerPose(owner: {
  type: string;
  position?: ScenePoint;
  data?: Record<string, any>;
}, livePosition?: ScenePoint | null): SceneOwnerPose {
  const data = owner.data ?? {};
  return {
    position: livePosition ?? owner.position ?? { x: 0, y: 0, z: 0 },
    rotation: owner.type === 'models' || owner.type === 'model'
      ? [Number(data.rotationX) || 0, Number(data.rotationYInstance) || 0, Number(data.rotationZ) || 0]
      : [0, owner.type === 'plantings' ? 0 : (Number(data.rotation) || 0) * Math.PI / 180, 0],
  };
}

export function sceneLocalToWorld(point: ScenePoint, owner: SceneOwnerPose): ScenePoint {
  const vector = new Vector3(point.x, point.y, point.z)
    .applyEuler(new Euler(...owner.rotation))
    .add(new Vector3(owner.position.x, owner.position.y, owner.position.z));
  return { x: vector.x, y: vector.y, z: vector.z };
}

export function sceneWorldToLocal(point: ScenePoint, owner: SceneOwnerPose): ScenePoint {
  const vector = new Vector3(point.x, point.y, point.z)
    .sub(new Vector3(owner.position.x, owner.position.y, owner.position.z))
    .applyQuaternion(new Quaternion().setFromEuler(new Euler(...owner.rotation)).invert());
  return { x: vector.x, y: vector.y, z: vector.z };
}

export function validSceneTransform(draft: SceneTransformDraft): boolean {
  return [draft.position.x, draft.position.y, draft.position.z, draft.rotationY]
    .every(value => Number.isFinite(value) && Math.abs(value) <= 10_000)
    && [draft.width, draft.height, draft.depth].every(value => Number.isFinite(value) && value >= 0.05 && value <= 10_000);
}

/** Full signed yaw; Euler.y alone folds back after a 90-degree turn. */
export function sceneYawDegrees(rotation: { x: number; y: number; z: number; w: number }): number {
  return Math.atan2(2 * (rotation.w * rotation.y + rotation.x * rotation.z),
    1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z)) * 180 / Math.PI;
}
