import type { DataTexture, Group, MeshStandardMaterial } from 'three';

/** All physical parameters are inches. Scale is applied once when positions are emitted. */
export interface CottageParameters {
  units: 'inches'; overall_scale: number; seed: number; texture_resolution: number; interior_enabled: boolean;
  main_width: number; main_depth: number; front_section_depth: number;
  front_wall_height: number; rear_wall_height: number;
  front_roof_pitch_rise_per_12: number; rear_roof_pitch_rise_per_12: number;
  roof_overhang: number; wall_thickness: number; floor_elevation: number;
  wing_width: number; wing_depth: number; wing_wall_height: number; wing_roof_pitch_rise_per_12: number;
  porch_depth: number; door_height: number; door_width: number;
  window_width: number; window_height: number; window_sill_height: number;
  front_glazing_height: number; chimney_width: number; chimney_depth: number; chimney_above_ridge: number;
  skylight_width: number; skylight_length: number; frame_width: number; walkway_width: number;
  roof_thickness: number; glass_opacity: number; interior_lining_thickness: number;
  partition_thickness: number; partition_height: number; hall_width: number;
  texture_weathering: number; contact_shading_strength: number;
}

export interface GeneratorIdentity {
  id: 'threed-cottage-ts'; version: string; rng: 'mulberry32-v1'; seed: number;
  sourceUnits: 'inches'; outputUnits: 'metres'; draft: true;
}

export type CottageTextureRole = 'baseColor' | 'normal' | 'packedORM';
export interface TextureArtifact {
  id: string; name: string; relativePath: string; role: CottageTextureRole;
  width: number; height: number; pixels: Uint8Array; texture: DataTexture;
  colorSpace: 'srgb' | 'linear'; mimeType: 'image/png';
}

export interface MaterialRecipe {
  id: string; name: string; material: MeshStandardMaterial;
  textureBindings: Partial<Record<'baseColor' | 'normal' | 'occlusion' | 'roughness' | 'metallic', string>>;
  baseColor: [number, number, number]; roughness: number; metalness: number;
  opacity: number; doubleSided: boolean; normalScale: [number, number]; aoStrength: number;
}

export interface GeneratedPart { id: string; name: string; materialId: string; vertexCount: number; triangleCount: number }
export interface TextureSamplingSnapshot {
  textureId: string; uvChannel: number; repeat: [number, number]; offset: [number, number];
  rotation: number; wrapS: number; wrapT: number; flipY: boolean; colorSpace: 'srgb' | 'linear';
}
export type MaterialRecipeSnapshot = Omit<MaterialRecipe, 'material'> & {
  textureSampling: Partial<Record<keyof MaterialRecipe['textureBindings'], TextureSamplingSnapshot>>;
};
export interface GeneratedModelBundle {
  root: Group; parameters: CottageParameters; identity: GeneratorIdentity;
  textures: TextureArtifact[]; materials: MaterialRecipe[]; parts: GeneratedPart[];
  bounds: { min: [number, number, number]; max: [number, number, number]; size: [number, number, number] };
  stats: { meshCount: number; vertexCount: number; triangleCount: number; texturePixels: number };
  /** Idempotent; callers own the bundle until export/preview work has completed. */
  dispose(): void;
}

/** Safe provenance only: references, owner data and local paths never enter the GLB. */
export interface ModelGenerationManifest {
  manifestVersion: 1; generator: GeneratorIdentity; parameters: CottageParameters;
  geometry: GeneratedModelBundle['stats']; bounds: GeneratedModelBundle['bounds'];
  artifacts: Array<{ path: string; mimeType: string; bytes: number; sha256: string }>;
  materials: MaterialRecipeSnapshot[];
}
