// src/components/threed/shared/FadingRing.tsx — v0.16.2-beta
'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FadingRingProps {
  /** Local-space position of the ring (defaults to slightly above ground). */
  position?: [number, number, number];
  innerRadius?: number;
  outerRadius?: number;
  segments?: number;
  /** Seconds the ring stays fully visible before fading. */
  fadeDelay?: number;
  /** Seconds for the ring to fade to full invisibility (after `fadeDelay`). */
  duration?: number;
  color?: string;
  /** Opacity the ring starts at before fading. */
  initialOpacity?: number;
}

/**
 * A ground-flat selection ring that fades out over `duration` seconds and stays
 * invisible. It resets (re-fades) whenever the component remounts — which happens
 * naturally when a marker is deselected and re-selected.
 */
export function FadingRing({
  position = [0, 0.02, 0],
  innerRadius = 0.7,
  outerRadius = 1.0,
  segments = 32,
  fadeDelay = 4,
  duration = 1,
  color = '#3b82f6',
  initialOpacity = 0.6,
}: FadingRingProps) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = 0;
  }, []);

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    elapsedRef.current += delta;
    // Hold at full opacity for the delay period before fading.
    if (elapsedRef.current < fadeDelay) {
      if (mat.opacity !== initialOpacity) mat.opacity = initialOpacity;
      return;
    }
    const t = Math.min((elapsedRef.current - fadeDelay) / duration, 1);
    mat.opacity = initialOpacity * (1 - t);
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, segments]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={initialOpacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}