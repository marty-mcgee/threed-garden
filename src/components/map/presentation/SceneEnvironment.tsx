'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';
import * as THREE from 'three';

type GroundPoint = { x: number; y: number; z: number };
interface InteractiveGroundProps {
  size: number;
  centerX: number;
  centerZ: number;
  onClick?: () => void;
  placementActive?: boolean;
  onPlacementHover?: (point: GroundPoint) => void;
  onPlacementLeave?: () => void;
  onPlacementClick?: (point: GroundPoint) => void;
  showVisualGround?: boolean;
}

// These consumers stay under the existing Scene Canvas; no new host or state owner.
// ✅ Procedural grass texture generator (canvas-based, no external files needed)
function createGrassTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // A repeatable texture keeps the ground from visibly changing whenever the
  // persistent Scene remounts. Layer broad turf variation beneath fine blades
  // so the surface reads naturally at both overview and Character distances.
  let seed = 0x3d5a1e;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  ctx.fillStyle = '#426b32';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 220; i++) {
    const x = random() * 512;
    const y = random() * 512;
    const radius = 10 + random() * 42;
    const lightPatch = random() > 0.48;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, lightPatch ? 'rgba(126, 158, 77, 0.16)' : 'rgba(28, 65, 31, 0.18)');
    gradient.addColorStop(1, 'rgba(66, 107, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < 4200; i++) {
    const x = random() * 512;
    const y = random() * 512;
    const height = 1 + random() * 3;
    ctx.strokeStyle = random() > 0.45
      ? `rgba(108, 145, 63, ${0.18 + random() * 0.22})`
      : `rgba(25, 72, 35, ${0.14 + random() * 0.2})`;
    ctx.lineWidth = 0.5 + random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 1.5, y - height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function HighResolutionEnvironmentBackground({ url }: { url: string }) {
  const scene = useThree((state) => state.scene);
  const texture = useTexture(url);

  useEffect(() => {
    const previousBackground = scene.background;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    scene.background = texture;
    return () => {
      if (scene.background === texture) scene.background = previousBackground;
    };
  }, [scene, texture]);

  return null;
}

export function ProceduralDaylightBackground() {
  const scene = useThree((state) => state.scene);
  // Match Drei Environment's layout lifecycle so it cannot capture a sky that
  // a later passive cleanup is about to dispose during a preset change.
  useLayoutEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext('2d')!;
    const sky = context.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#397bb8');
    sky.addColorStop(0.42, '#78add4');
    sky.addColorStop(0.72, '#c7d9df');
    sky.addColorStop(1, '#ead8b9');
    context.fillStyle = sky;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const sun = context.createRadialGradient(1510, 525, 4, 1510, 525, 150);
    sun.addColorStop(0, 'rgba(255, 245, 205, 0.95)');
    sun.addColorStop(0.16, 'rgba(255, 228, 166, 0.5)');
    sun.addColorStop(1, 'rgba(255, 218, 155, 0)');
    context.fillStyle = sun;
    context.fillRect(1360, 375, 300, 300);

    const cloudBands = [
      { x: 90, y: 340, width: 470, height: 54, opacity: 0.16 },
      { x: 640, y: 420, width: 390, height: 38, opacity: 0.12 },
      { x: 1170, y: 300, width: 520, height: 48, opacity: 0.14 },
      { x: 1700, y: 455, width: 300, height: 34, opacity: 0.1 },
    ];
    for (const cloud of cloudBands) {
      const cloudGradient = context.createRadialGradient(
        cloud.x + cloud.width / 2,
        cloud.y,
        0,
        cloud.x + cloud.width / 2,
        cloud.y,
        cloud.width / 2,
      );
      cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity})`);
      cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = cloudGradient;
      context.beginPath();
      context.ellipse(
        cloud.x + cloud.width / 2,
        cloud.y,
        cloud.width / 2,
        cloud.height,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    let previousBackground = scene.background;
    const previousTexture = previousBackground instanceof THREE.Texture ? previousBackground : null;
    // A replaced owner can release its texture while this background is active.
    const forgetDisposedBackground = () => { previousBackground = null; };
    previousTexture?.addEventListener('dispose', forgetDisposedBackground);
    scene.background = texture;
    return () => {
      if (scene.background === texture) scene.background = previousBackground;
      previousTexture?.removeEventListener('dispose', forgetDisposedBackground);
      texture.dispose();
    };
  }, [scene]);

  return null;
}

// Shadow light with proper target direction and massive frustum depth
export function ShadowLight({ centerX, centerZ, azimuth, elevation }: { centerX: number; centerZ: number; azimuth: number; elevation: number }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    // Aim sunlight at the scene center from the selected direction.
    light.target.position.set(centerX, 0, centerZ);
    light.target.updateMatrixWorld();
    // Set massive frustum
    light.shadow.camera.left = -300;
    light.shadow.camera.right = 300;
    light.shadow.camera.top = 300;
    light.shadow.camera.bottom = -300;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 5000;
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
  }, [centerX, centerZ, azimuth, elevation]);

  return (
    <directionalLight
      ref={lightRef}
      position={[centerX + 30 * Math.cos(elevation * Math.PI / 180) * Math.sin(azimuth * Math.PI / 180), 30 * Math.sin(elevation * Math.PI / 180), centerZ + 30 * Math.cos(elevation * Math.PI / 180) * Math.cos(azimuth * Math.PI / 180)]}
      intensity={1.2}
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
    />
  );
}

// Interactive Ground with shadow catching + left-click deselect
export function InteractiveGround({
  size,
  centerX,
  centerZ,
  onClick,
  placementActive,
  onPlacementHover,
  onPlacementLeave,
  onPlacementClick,
  showVisualGround = true,
}: InteractiveGroundProps) {
  const grassMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  useLayoutEffect(() => {
    const material = grassMaterialRef.current;
    if (!material) return;
    const texture = createGrassTexture();
    const repeat = Math.max(size / 4, 1);
    texture.repeat.set(repeat, repeat);
    material.map = texture;
    material.needsUpdate = true;
    return () => {
      if (material.map === texture) {
        material.map = null;
        material.needsUpdate = true;
      }
      texture.dispose();
    };
  }, [size, showVisualGround]);

  return (
    <group>
      {/* Shadow catching plane (transparent, catches shadows) */}
      {showVisualGround && <Plane
        args={[size, size]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.05, centerZ]}
        receiveShadow
      >
        <shadowMaterial transparent opacity={0.35} />
      </Plane>}
      {/* Visual ground plane with grass texture */}
      {showVisualGround && <Plane
        args={[size, size]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.1, centerZ]}
        receiveShadow
      >
        <meshStandardMaterial
          ref={grassMaterialRef}
          roughness={0.85}
          metalness={0}
          color="#ffffff"
        />
      </Plane>}

      {/* ✅ v0.15.3: Invisible click target for left-click deselect */}
      <Plane
        args={[size, size]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.03, centerZ]}
        onPointerMove={(e) => {
          if (!placementActive) return;
          onPlacementHover?.({ x: e.point.x, y: 0, z: e.point.z });
        }}
        onPointerLeave={() => onPlacementLeave?.()}
        onClick={(e) => {
          if (!placementActive && !onClick) return;
          e.stopPropagation();
          if (placementActive) {
            onPlacementClick?.({ x: e.point.x, y: 0, z: e.point.z });
          } else if (onClick) {
            onClick();
          }
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </Plane>
    </group>
  );
}

