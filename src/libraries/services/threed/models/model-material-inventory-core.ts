import * as THREE from 'three';

export const THREED_MODEL_MATERIAL_INVENTORY_LIMIT = 500;

const TEXTURE_CHANNELS = [
  ['map', 'Base color'],
  ['normalMap', 'Normal'],
  ['roughnessMap', 'Roughness'],
  ['metalnessMap', 'Metalness'],
  ['aoMap', 'Ambient occlusion'],
  ['emissiveMap', 'Emissive'],
  ['alphaMap', 'Opacity'],
  ['bumpMap', 'Bump'],
  ['displacementMap', 'Displacement'],
  ['lightMap', 'Light'],
] as const;

export interface ThreeDModelMaterialTextureChannel {
  property: (typeof TEXTURE_CHANNELS)[number][0];
  label: (typeof TEXTURE_CHANNELS)[number][1];
  source: string | null;
  ready: boolean;
  width: number | null;
  height: number | null;
}

export interface ThreeDModelMaterialSlot {
  id: string;
  meshIndex: number;
  meshPath: string;
  meshName: string;
  slotIndex: number;
  materialName: string;
  materialType: string;
  color: string | null;
  opacity: number;
  transparent: boolean;
  textures: ThreeDModelMaterialTextureChannel[];
}

export interface ThreeDModelMaterialInventory {
  meshCount: number;
  materialSlotCount: number;
  texturedSlotCount: number;
  readyTextureSlotCount: number;
  unavailableTextureSlotCount: number;
  untexturedSlotCount: number;
  omittedSlotCount: number;
  slots: ThreeDModelMaterialSlot[];
}

export interface ThreeDModelMaterialPreviewOverride {
  targetKey: string;
  textureUrl: string;
  fileName: string;
}

function objectPath(object: THREE.Object3D, root: THREE.Object3D): string {
  const segments: string[] = [];
  let current: THREE.Object3D | null = object;
  while (current && current !== root) {
    segments.unshift(current.name || current.type);
    current = current.parent;
  }
  return segments.join('/') || object.name || object.type;
}

function textureDetails(texture: THREE.Texture) {
  const source = texture.source?.data as {
    currentSrc?: unknown;
    src?: unknown;
    naturalWidth?: unknown;
    naturalHeight?: unknown;
    videoWidth?: unknown;
    videoHeight?: unknown;
    width?: unknown;
    height?: unknown;
  } | undefined;
  const candidate = source?.currentSrc ?? source?.src;
  const rawWidth = source?.naturalWidth ?? source?.videoWidth ?? source?.width;
  const rawHeight = source?.naturalHeight ?? source?.videoHeight ?? source?.height;
  const width = typeof rawWidth === 'number' && Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : null;
  const height = typeof rawHeight === 'number' && Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : null;
  return {
    source: typeof candidate === 'string' && candidate ? candidate : null,
    ready: width !== null && height !== null,
    width,
    height,
  };
}

function materialSlot(
  material: THREE.Material,
  mesh: THREE.Mesh,
  root: THREE.Object3D,
  slotIndex: number,
  meshIndex: number,
): ThreeDModelMaterialSlot {
  const values = material as THREE.Material & {
    color?: THREE.Color;
  } & Partial<Record<(typeof TEXTURE_CHANNELS)[number][0], THREE.Texture>>;
  const meshPath = objectPath(mesh, root);
  const textures = TEXTURE_CHANNELS.flatMap(([property, label]) => {
    const texture = values[property];
    if (!(texture instanceof THREE.Texture)) return [];
    return [{ property, label, ...textureDetails(texture) }];
  });
  return {
    id: `mesh:${meshIndex}:material:${slotIndex}`,
    meshIndex,
    meshPath,
    meshName: mesh.name || mesh.type,
    slotIndex,
    materialName: material.name || `Material ${slotIndex + 1}`,
    materialType: material.type,
    color: values.color instanceof THREE.Color ? `#${values.color.getHexString()}` : null,
    opacity: material.opacity,
    transparent: material.transparent,
    textures,
  };
}

export function createThreeDModelMaterialInventory(root: THREE.Object3D): ThreeDModelMaterialInventory {
  let meshCount = 0;
  let materialSlotCount = 0;
  let texturedSlotCount = 0;
  let readyTextureSlotCount = 0;
  const slots: ThreeDModelMaterialSlot[] = [];

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    meshCount += 1;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const [slotIndex, material] of materials.entries()) {
      if (!(material instanceof THREE.Material)) continue;
      const slot = materialSlot(material, object, root, slotIndex, meshCount - 1);
      materialSlotCount += 1;
      if (slot.textures.length > 0) texturedSlotCount += 1;
      if (slot.textures.some((texture) => texture.ready)) readyTextureSlotCount += 1;
      if (slots.length < THREED_MODEL_MATERIAL_INVENTORY_LIMIT) slots.push(slot);
    }
  });

  return {
    meshCount,
    materialSlotCount,
    texturedSlotCount,
    readyTextureSlotCount,
    unavailableTextureSlotCount: texturedSlotCount - readyTextureSlotCount,
    untexturedSlotCount: materialSlotCount - texturedSlotCount,
    omittedSlotCount: Math.max(0, materialSlotCount - slots.length),
    slots,
  };
}

export function resolveThreeDModelMaterialTarget(
  root: THREE.Object3D,
  targetKey: string,
): { mesh: THREE.Mesh; slotIndex: number } | null {
  const match = targetKey.match(/^mesh:(\d+):material:(\d+)$/);
  if (!match) return null;
  const requestedMeshIndex = Number(match[1]);
  const slotIndex = Number(match[2]);
  let meshIndex = 0;
  let targetMesh: THREE.Mesh | null = null;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (meshIndex === requestedMeshIndex) targetMesh = object;
    meshIndex += 1;
  });
  if (!targetMesh || !Number.isSafeInteger(slotIndex) || slotIndex < 0) return null;
  return { mesh: targetMesh, slotIndex };
}
