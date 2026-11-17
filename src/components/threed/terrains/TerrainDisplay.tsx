'use client';

import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { defaultTerrainStyle, terrainElevationColor, terrainHeightAt, type TerrainDefinition } from '@/libraries/services/threed/terrains/terrain-core';

const origin = {
  id: null,
  threedId: 1,
  terrainId: 1,
  terrainRevision: 1,
  centerXM: 0,
  centerZM: 0,
  rotationYDeg: 0,
  scale: 1,
};

export function TerrainDisplay({ definition }: { definition: TerrainDefinition }) {
  const style = definition.appearance.style ?? defaultTerrainStyle();
  const palette = definition.appearance.elevationColors;
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = style.resolution ** 2;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || style.surface !== 'blocks') return;
    const object = new THREE.Object3D();
    const color = new THREE.Color();
    const width = definition.widthM / style.resolution;
    const length = definition.lengthM / style.resolution;
    const thickness = Math.min(width, length);
    const range = definition.appearance.noiseRecipe?.heightM || Math.max(1, ...definition.heightsM.map(Math.abs));
    for (let row = 0; row < style.resolution; row++) {
      for (let column = 0; column < style.resolution; column++) {
        const x = (column + 0.5) * width - definition.widthM / 2;
        const z = (row + 0.5) * length - definition.lengthM / 2;
        const height = terrainHeightAt(definition, origin, x, z) ?? 0;
        const water = palette && palette.waterEnabled !== false && height <= palette.seaLevelM;
        const visibleHeight = water && style.flatWater && style.display === 'color' ? palette.seaLevelM : height;
        object.position.set(x, visibleHeight - thickness / 2, z);
        object.scale.set(width, thickness, length);
        object.updateMatrix();
        const index = row * style.resolution + column;
        mesh.setMatrixAt(index, object.matrix);
        if (style.display === 'height') color.setHSL(0.75 * (1 - THREE.MathUtils.clamp(height / range, 0, 1)), 1, 0.5);
        else {
          color.set(palette ? terrainElevationColor(palette, height, definition.appearance.color) : definition.appearance.color);
          const hsl = color.getHSL({ h: 0, s: 0, l: 0 });
          const depth = water && style.depthColor ? 1.4 * Math.pow(Math.max(0, 1 - (palette.seaLevelM - height) / range * 1.3), 6) : 1;
          color.setHSL(hsl.h, Math.min(1, hsl.s * style.saturation), Math.min(1, hsl.l * depth));
        }
        mesh.setColorAt(index, color);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [definition, style, palette]);
  return <>
    {style.surface === 'blocks' && <instancedMesh key={count} ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow raycast={() => null}>
      <boxGeometry />
      <meshPhongMaterial />
    </instancedMesh>}
    {style.surface === 'mesh' && style.flatWater && style.display === 'color' && palette && palette.waterEnabled !== false && <mesh position={[0, palette.seaLevelM, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[definition.widthM, definition.lengthM]} />
      <meshStandardMaterial color={palette.waterColor} side={THREE.DoubleSide} roughness={0.5} />
    </mesh>}
  </>;
}
