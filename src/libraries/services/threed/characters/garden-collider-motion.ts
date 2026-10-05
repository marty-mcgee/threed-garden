import { Quaternion, Vector3 } from 'three';
import type { RapierRigidBody } from '@react-three/rapier';

/** Scene-owned collider motion; never called by an animation mixer or task action. */
export function createGardenColliderMotionSync() {
  let owner: RapierRigidBody | null = null;
  const bindings = new Map<number, {
    offset: Vector3;
    rotation: Quaternion;
    lastPosition: Vector3;
    lastRotation: Quaternion;
  }>();
  const inverse = new Quaternion();
  const position = new Vector3();
  const rotation = new Quaternion();

  return (body: RapierRigidBody, motion: { position: Vector3; quaternion: Quaternion }, captureOnly = false) => {
    if (owner !== body) {
      bindings.clear();
      owner = body;
    }
    const { position: translation, quaternion } = motion;
    if (![translation.x, translation.y, translation.z, quaternion.x, quaternion.y, quaternion.z, quaternion.w].every(Number.isFinite)) return;
    inverse.copy(quaternion).invert();
    const handles = new Set<number>();
    for (let i = 0; i < body.numColliders(); i++) {
      const collider = body.collider(i);
      handles.add(collider.handle);
      let binding = bindings.get(collider.handle);
      if (!binding) {
        const initialPosition = collider.translationWrtParent();
        const initialRotation = collider.rotationWrtParent();
        if (!initialPosition || !initialRotation) continue;
        binding = {
          offset: new Vector3(initialPosition.x, initialPosition.y, initialPosition.z).sub(translation).applyQuaternion(inverse),
          rotation: new Quaternion(initialRotation.x, initialRotation.y, initialRotation.z, initialRotation.w).premultiply(inverse),
          lastPosition: translation.clone(),
          lastRotation: quaternion.clone(),
        };
        bindings.set(collider.handle, binding);
      }
      if (captureOnly || (binding.lastPosition.equals(translation) && binding.lastRotation.equals(quaternion))) continue;
      position.copy(binding.offset).applyQuaternion(quaternion).add(translation);
      rotation.copy(binding.rotation).premultiply(quaternion);
      collider.setTranslationWrtParent(position);
      collider.setRotationWrtParent(rotation);
      binding.lastPosition.copy(translation);
      binding.lastRotation.copy(quaternion);
    }
    for (const handle of bindings.keys()) if (!handles.has(handle)) bindings.delete(handle);
  };
}
