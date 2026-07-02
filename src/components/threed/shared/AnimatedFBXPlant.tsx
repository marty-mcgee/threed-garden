// src/components/threed/AnimatedFBXPlant.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { AnimationMixer } from 'three';

export function AnimatedFBXPlant({ url, position, scale = 1, autoPlay = true }) {
  const fbx = useLoader(FBXLoader, url);
  const mixerRef = useRef<AnimationMixer | null>(null);

  useEffect(() => {
    if (fbx && fbx.animations.length > 0) {
      // Create animation mixer
      const mixer = new AnimationMixer(fbx);
      
      // Play the first animation
      const action = mixer.clipAction(fbx.animations[0]);
      if (autoPlay) {
        action.play();
      }
      
      mixerRef.current = mixer;
      
      // Cleanup
      return () => {
        mixer.stopAllAction();
      };
    }
  }, [fbx, autoPlay]);

  // Update animation mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return <primitive object={fbx} position={position} scale={scale} />;
}