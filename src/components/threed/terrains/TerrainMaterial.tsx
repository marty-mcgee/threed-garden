'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { TerrainDefinition } from '@/libraries/services/threed/terrains/terrain-core';

function finishMaterial(material: THREE.MeshStandardMaterial, appearance: TerrainDefinition['appearance']) {
  const style = appearance.style;
  if (!style || style.display === 'height') return material;
  const compile = material.onBeforeCompile.bind(material);
  const cacheKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => cacheKey + '-terrain-style-v1';
  material.onBeforeCompile = (shader, renderer) => {
    compile(shader, renderer);
    shader.uniforms.styleSaturation = { value: style.saturation };
    shader.uniforms.styleSea = { value: appearance.elevationColors?.seaLevelM ?? 0 };
    shader.uniforms.styleDepth = { value: style.depthColor && appearance.elevationColors?.waterEnabled !== false && appearance.elevationColors ? 1 : 0 };
    shader.uniforms.styleRange = { value: appearance.noiseRecipe?.heightM || 100 };
    // Reuse the elevation-band varying; a single Surface color needs its own height varying.
    if (!shader.vertexShader.includes('varying float vTerrainHeight;')) {
      shader.vertexShader = 'attribute float terrainHeight; varying float vTerrainHeight;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTerrainHeight = terrainHeight;');
      shader.fragmentShader = 'varying float vTerrainHeight;\n' + shader.fragmentShader;
    }
    shader.fragmentShader = 'uniform float styleSaturation; uniform float styleSea; uniform float styleDepth; uniform float styleRange;\n' + shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
float luminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
diffuseColor.rgb = clamp(mix(vec3(luminance), diffuseColor.rgb, styleSaturation), 0.0, 1.0);
if (styleDepth > 0.5 && vTerrainHeight <= styleSea) diffuseColor.rgb *= 1.4 * pow(max(0.0, 1.0 - (styleSea - vTerrainHeight) / max(styleRange, 0.001) * 1.3), 6.0);
#include <roughnessmap_fragment>
`);
  };
  return material;
}

export function createTerrainMaterial(appearance: TerrainDefinition['appearance'], roughness: number) {
  const palette = appearance.elevationColors;
  // Historical rendering values remain readable, but all elevation palettes use exact height bands.
  const material = new THREE.MeshStandardMaterial({
    color: palette ? '#ffffff' : appearance.color,
    vertexColors: false,
    roughness,
    side: THREE.DoubleSide,
    colorWrite: appearance.style?.surface !== 'blocks',
    depthWrite: appearance.style?.surface !== 'blocks',
  });
  if (appearance.style?.display === 'height') {
    material.vertexColors = false;
    material.color.set('#ffffff');
    material.customProgramCacheKey = () => 'terrain-height-map-v1';
    material.onBeforeCompile = shader => {
      shader.uniforms.heightRange = { value: appearance.noiseRecipe?.heightM || 100 };
      shader.vertexShader = 'attribute float terrainHeight; varying float vTerrainHeight;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTerrainHeight = terrainHeight;');
      shader.fragmentShader = 'varying float vTerrainHeight; uniform float heightRange;\n' + shader.fragmentShader.replace('#include <color_fragment>', `
float hue = 0.75 * (1.0 - clamp(vTerrainHeight / max(heightRange, 0.001), 0.0, 1.0));
vec3 rgb = clamp(abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
diffuseColor.rgb = rgb;
`);
    };
    return material;
  }
  if (!palette) return finishMaterial(material, appearance);
  material.customProgramCacheKey = () => 'terrain-height-bands-v1';
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, {
      terrainSea: { value: palette.seaLevelM },
      terrainWaterEnabled: { value: palette.waterEnabled === false ? 0 : 1 },
      terrainWater: { value: new THREE.Color(palette.waterColor) },
      terrainBase: { value: new THREE.Color(appearance.color) },
      terrainStarts: { value: palette.bands.map((band, index) => index === 0 ? 0 : band.fromM) },
      terrainEnabled: { value: palette.bands.map(band => band.enabled === false ? 0 : 1) },
      terrainColors: { value: palette.bands.map(band => new THREE.Color(band.color)) },
    });
    shader.vertexShader = 'attribute float terrainHeight; varying float vTerrainHeight;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvTerrainHeight = terrainHeight;',
    );
    shader.fragmentShader = `
varying float vTerrainHeight;
uniform float terrainSea;
uniform float terrainWaterEnabled;
uniform vec3 terrainWater;
uniform vec3 terrainBase;
uniform float terrainStarts[6];
uniform float terrainEnabled[6];
uniform vec3 terrainColors[6];
` + shader.fragmentShader.replace('#include <color_fragment>', `
vec3 terrainColor = terrainBase;
float terrainAboveSea = vTerrainHeight - terrainSea;
if (terrainAboveSea <= 0.0) {
  if (terrainWaterEnabled > 0.5) terrainColor = terrainWater;
} else {
  for (int i = 0; i < 6; i++) {
    if (terrainEnabled[i] > 0.5 && terrainAboveSea >= terrainStarts[i]) terrainColor = terrainColors[i];
  }
}
diffuseColor.rgb = terrainColor;
`);
  };
  return finishMaterial(material, appearance);
}

export function TerrainMaterial({ appearance, roughness }: { appearance: TerrainDefinition['appearance']; roughness: number }) {
  const material = useMemo(() => createTerrainMaterial(appearance, roughness), [appearance, roughness]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}
