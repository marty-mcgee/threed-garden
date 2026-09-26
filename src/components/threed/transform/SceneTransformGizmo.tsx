'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { Group, MathUtils, type Object3D } from 'three';
import { sceneYawDegrees } from '@/libraries/services/threed/transforms/scene-transform-core';
import { useSceneTransform } from './SceneTransformWorkspace';

/** Shared draft-only gizmo. Each object adapter owns persistence and physics. */
export function SceneTransformGizmo() {
  const { session, mode, saving, update } = useSceneTransform();
  const [object] = useState(() => new Group());
  const parent = useRef<Group>(null);
  const scene = useThree(state => state.scene);
  const ownerRef = useRef<Object3D | null>(null);
  useFrame(() => {
    if (!session || !parent.current) return;
    if (!ownerRef.current?.parent) ownerRef.current = scene.getObjectByName(`threed-transform-owner:${session.ownerKey}`) ?? null;
    const owner = ownerRef.current;
    if (!owner) return;
    owner.getWorldPosition(parent.current.position);
    owner.getWorldQuaternion(parent.current.quaternion);
    parent.current.updateMatrixWorld(true);
  });
  const orbit = useThree(state => state.controls) as { enabled: boolean } | null;
  useEffect(() => {
    const enabled = orbit?.enabled;
    return () => { if (orbit && enabled !== undefined) orbit.enabled = enabled; };
  }, [orbit]);
  useLayoutEffect(() => {
    if (!session) return;
    const { position, rotationY, width, height, depth } = session.draft;
    object.position.set(position.x, position.y, position.z);
    object.rotation.set(0, MathUtils.degToRad(rotationY), 0);
    object.scale.set(width / session.dimensions[0], height / session.dimensions[1], depth / session.dimensions[2]);
  }, [object, session]);
  if (!session) return null;
  return <>
    <group ref={parent} position={[session.owner.position.x, session.owner.position.y, session.owner.position.z]} rotation={session.owner.rotation}>
      <primitive object={object}>
        <mesh onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
          <boxGeometry args={session.dimensions} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.95} depthTest={false} />
        </mesh>
      </primitive>
    </group>
    <TransformControls object={object} mode={mode} space={mode === 'translate' ? 'world' : 'local'} size={0.9} enabled={!saving}
      showX={mode !== 'rotate'} showY showZ={mode !== 'rotate'}
      onObjectChange={() => {
        // Prevent inverted/degenerate sensor colliders when dragging through the center.
        const dimensions = session.dimensions.map((base, axis) =>
          MathUtils.clamp(base * object.scale.getComponent(axis), 0.05, 10_000));
        object.scale.set(...dimensions.map((size, axis) => size / session.dimensions[axis]) as [number, number, number]);
        update({
          position: { x: object.position.x, y: object.position.y, z: object.position.z },
          rotationY: sceneYawDegrees(object.quaternion),
          width: dimensions[0], height: dimensions[1], depth: dimensions[2],
        });
      }} />
  </>;
}
