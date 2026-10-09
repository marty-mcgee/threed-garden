import * as THREE from 'three';
// @ts-expect-error Native offline validation requires an explicit extension.
import { resolveThreeDModelMaterialTarget } from './model-material-inventory-core.ts';
import type { ThreeDModelMaterialChannel, ThreeDModelMaterialOverrideAssignment } from './model-material-override-core';
// @ts-expect-error Native offline validation requires an explicit extension.
import { THREED_MODEL_MATERIAL_TEXTURE_PROPERTIES as THREED_MODEL_TEXTURE_PROPERTIES } from './model-material-override-core.ts';

type TextureProperty = (typeof THREED_MODEL_TEXTURE_PROPERTIES)[ThreeDModelMaterialChannel];
type TexturedMaterial = THREE.Material & Partial<Record<TextureProperty, THREE.Texture | null>>;

/** Share decoded pixels, but keep UV/sampler/color-space state local to each binding. */
export function bindThreeDModelMaterialTexture(
  material: THREE.Material, image: THREE.Texture, channel: ThreeDModelMaterialChannel, modelType: string,
): THREE.Texture {
  const property = THREED_MODEL_TEXTURE_PROPERTIES[channel];
  if (!(property in material)) throw new Error(`This material does not support ${channel} textures`);
  const target = material as TexturedMaterial;
  const template = target[property] ?? target.map;
  const texture = image.clone();
  if (template instanceof THREE.Texture) {
    texture.flipY = template.flipY;
    texture.channel = template.channel;
    texture.wrapS = template.wrapS;
    texture.wrapT = template.wrapT;
    texture.magFilter = template.magFilter;
    texture.minFilter = template.minFilter;
    texture.anisotropy = template.anisotropy;
    texture.offset.copy(template.offset);
    texture.repeat.copy(template.repeat);
    texture.center.copy(template.center);
    texture.rotation = template.rotation;
    texture.matrixAutoUpdate = template.matrixAutoUpdate;
    texture.matrix.copy(template.matrix);
  } else if (['glb', 'gltf'].includes(modelType.toLowerCase())) {
    texture.flipY = false;
  }
  texture.colorSpace = channel === 'baseColor' || channel === 'emissive' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  target[property] = texture;
  // Authored tint/factors, normal strength, AO strength and alpha remain intact.
  material.needsUpdate = true;
  return texture;
}

/** Apply to an instance clone only; cached/imported materials and image sources stay untouched. */
export async function applyThreeDModelMaterialAssignments(
  root: THREE.Object3D,
  modelType: string,
  assignments: readonly ThreeDModelMaterialOverrideAssignment[],
  loadTexture: (reference: string) => Promise<THREE.Texture | null>,
): Promise<() => void> {
  const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const materials = new Map<string, THREE.Material>();
  const images = new Map<string, THREE.Texture | null>();
  const views: THREE.Texture[] = [];
  const dispose = () => {
    for (const [mesh, original] of originals) mesh.material = original;
    for (const material of materials.values()) material.dispose();
    for (const view of views) view.dispose();
    for (const image of images.values()) image?.dispose();
    originals.clear(); materials.clear(); views.length = 0; images.clear();
  };
  try {
    for (const assignment of assignments) {
      const target = resolveThreeDModelMaterialTarget(root, assignment.targetKey);
      if (!target) continue;
      const original = Array.isArray(target.mesh.material) ? target.mesh.material[target.slotIndex]
        : target.slotIndex === 0 ? target.mesh.material : undefined;
      if (!(original instanceof THREE.Material) || !(THREED_MODEL_TEXTURE_PROPERTIES[assignment.channel] in original)) continue;
      if (!images.has(assignment.textureRelativePath)) images.set(assignment.textureRelativePath, await loadTexture(assignment.textureRelativePath));
      const image = images.get(assignment.textureRelativePath);
      if (!image) continue;
      let material = materials.get(assignment.targetKey);
      if (!material) {
        material = original.clone();
        materials.set(assignment.targetKey, material);
        if (!originals.has(target.mesh)) originals.set(target.mesh, target.mesh.material);
        if (Array.isArray(target.mesh.material)) {
          target.mesh.material = [...target.mesh.material];
          target.mesh.material[target.slotIndex] = material;
        } else target.mesh.material = material;
      }
      views.push(bindThreeDModelMaterialTexture(material, image, assignment.channel, modelType));
    }
    return dispose;
  } catch (error) { dispose(); throw error; }
}
